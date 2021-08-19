/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

 import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	ColorInformation,
	Color,
	DocumentColorParams,
	ColorPresentationParams,
	ColorPresentation,
	DidChangeTextDocumentParams,
	TextDocumentChangeEvent,
	DidChangeConfigurationParams
} from "vscode-languageserver";

import {
	TextDocument
} from "vscode-languageserver-textdocument";
import { IColors } from "./IColors";
import { JSONColorTokenSettings, defaultSettings, cssLanguages, colorTokenPattern } from "./constants";

// Create a connection for the server, using Node"s IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let colorTokenCache: { [documentUri: string]: { [variable: string]: string} } = {};

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			colorProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log("Workspace folder change event received.");
		});
	}
});

let globalSettings: JSONColorTokenSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<JSONColorTokenSettings>> = new Map();
let cachedLanguages: string[] | undefined = undefined;

async function isLanguageIncludedForColorTokenDetection(languageId: string): Promise<boolean> {
	if (!cachedLanguages) {
		const settings = await getRemoteConfiguration() as JSONColorTokenSettings;
		cachedLanguages = settings.languages; 
	}
	return cssLanguages.indexOf(languageId) < 0 && cachedLanguages.indexOf(languageId) >= 0;
}

connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <JSONColorTokenSettings>(
			(change.settings.jsonColorToken || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(findColorTokens);
});

/**
 * Force a color token search when the user switch between opened text files.
 * Re-update the color token cache in opened json files.
 */
connection.onDidChangeTextDocument((change: DidChangeTextDocumentParams) => {
	const document = documents.get(change.textDocument.uri);
	if (!!document) {
		findColorTokens(document);
	}
	documents.all().forEach(updateColorTokenCache);
});

function getDocumentSettings(resource: string): Thenable<JSONColorTokenSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = getRemoteConfiguration(resource);
		documentSettings.set(resource, result);
	}
	return result;
}

function getRemoteConfiguration(resource?: string): Promise<any> {
	return connection.workspace.getConfiguration({
		scopeUri: resource,
		section: "jsonColorToken"
	});
}

// Only keep settings for open documents
documents.onDidClose(e => {
	if (!!colorTokenCache[e.document.uri]) {
		delete colorTokenCache[e.document.uri];
	}
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (change: TextDocumentChangeEvent<TextDocument>) => {
	updateColorTokenCache(change.document);
	await findColorTokens(change.document);
});

function isColorToken(token: string | number | undefined): boolean {
	if (typeof token === "string") {
		let regex = new RegExp(colorTokenPattern);
		return regex.test(token);
	}
	return false;
}

async function updateColorTokenCache(textDocument: TextDocument): Promise<void> {
	if (await isLanguageIncludedForColorTokenDetection(textDocument.languageId)) {
		let text = textDocument.getText();
		try {
			let jsonObj = JSON.parse(text);
			let colorTokenObj: {[variable: string]: string} = {};
			for (let key in jsonObj) {
				if (isColorToken(jsonObj[key])) {
					colorTokenObj[key] = jsonObj[key];
				}
			}
			colorTokenCache[textDocument.uri] = colorTokenObj;
		} catch (error) {
			// Swallow the error
		}
	}
}

let colors: IColors[] = [];
async function findColorTokens(textDocument: TextDocument): Promise<void> {
	const text = textDocument.getText();
	// Get the maxNumberOfColorTokens for every run.
	const settings = await getDocumentSettings(textDocument.uri);
	const { maxNumberOfColorTokens } = settings; 

	if (await isLanguageIncludedForColorTokenDetection(textDocument.languageId)) {
		let regex = new RegExp(colorTokenPattern);
		let m: RegExpExecArray | null;
		colors = [];
		let numTokens = 0;
	
		while ((m = regex.exec(text)) && numTokens < maxNumberOfColorTokens) {
			numTokens++;
			
			colors.push({
				range: {
					start: textDocument.positionAt(m.index),
					end: textDocument.positionAt(m.index + m[0].length)
				}, 
				color: m[0]
			});
		}
	} else if (cssLanguages.indexOf(textDocument.languageId) >= 0 ) {
		// Get reference to style variables
		let pattern = /var\(--([a-zA-Z0-9\-]+)\)/g;
		let m: RegExpExecArray | null;
		colors = [];
		while ((m = pattern.exec(text))) {
			for (let documentUri in colorTokenCache) {
				let variableName = m[1];
				if (colorTokenCache[documentUri][variableName]) {
					colors.push({
						range: {
							start: textDocument.positionAt(m.index),
							end: textDocument.positionAt(m.index + m[0].length)
						}, 
						color: colorTokenCache[documentUri][variableName]
					});
					break;
				}
			}
		}
	}
}

function parseColor (color: string): Color {
	const red = parseInt(color.slice(1, 3), 16)/ 255;
	const green = parseInt(color.slice(3, 5), 16) / 255;
	const blue = parseInt(color.slice(5, 7), 16) / 255;
	let alpha = 1.0;
	if (color.length === 9) {
		alpha = parseInt(color.slice(7, 9), 10) / 100;
	}
	return {
		red, green, blue, alpha: alpha
	}
}

function stringifyColor(color: Color, casing: "Uppercase" | "Lowercase"): string {
	let result = "#";
	function valueToCode(val: number): string {
		let result = Math.floor(val * 255).toString(16);
		return result.length === 1 ? "0" + result : result;
	}
	if (casing === "Lowercase") {
		result += valueToCode(color.red).toLowerCase();
		result += valueToCode(color.green).toLowerCase();
		result += valueToCode(color.blue).toLowerCase();
	} else {
		result += valueToCode(color.red).toUpperCase();
		result += valueToCode(color.green).toUpperCase();
		result += valueToCode(color.blue).toUpperCase();
	}
	if (color.alpha < 1.0) {
		result += (color.alpha * 100).toFixed(0);
	}
	return result;
}

connection.onDocumentColor(async (params: DocumentColorParams): Promise<ColorInformation[]> => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return [];
	}
	await findColorTokens(document);
	const colorInformations: ColorInformation[] = colors.map((colorObj) => {
		const color = parseColor(colorObj.color);
		return {
			range: colorObj.range,
			color: color
		};
	});
	return colorInformations;
});

connection.onColorPresentation(async (params: ColorPresentationParams): Promise<ColorPresentation[]> => {
	const document = documents.get(params.textDocument.uri);
	if (!!document && await isLanguageIncludedForColorTokenDetection(document.languageId)) {
		let settings = await getDocumentSettings(params.textDocument.uri);
		return [{ label: stringifyColor(params.color, settings.colorTokenCasing) }];
	}
	return [];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
