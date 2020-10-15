/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
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
	ColorPresentation
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { IColors } from './IColors';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

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
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface JSONColorTokenSettings {
	maxNumberOfColorTokens: number;
	colorTokenCasing: "Uppercase" | "Lowercase";
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: JSONColorTokenSettings = { 
	maxNumberOfColorTokens: 1000,
	colorTokenCasing: "Uppercase"
};
let globalSettings: JSONColorTokenSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<JSONColorTokenSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
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

function getDocumentSettings(resource: string): Thenable<JSONColorTokenSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'jsonColorToken'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	findColorTokens(change.document);
});

let colors: IColors[] = [];
async function findColorTokens(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /#[0-9a-fA-F]{6}/g;
	let m: RegExpExecArray | null;
	colors = [];
	let problems = 0;

	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfColorTokens) {
		problems++;
		
		colors.push({
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			}, 
			color: m[0]
		});
	}
}

function parseColor (color: string): Color {
	const red = parseInt(color.slice(1, 3), 16)/ 255;
	const green = parseInt(color.slice(3, 5), 16) / 255;
	const blue = parseInt(color.slice(5, 7), 16) / 255;
	return {
		red, green, blue, alpha: 1.0
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
	return result;
}

connection.onDocumentColor(async (params: DocumentColorParams): Promise<ColorInformation[]> => {
	const colorInformations: ColorInformation[] = colors.map((colorObj) => {
		const color = parseColor(colorObj.color);
		return {
			range: colors[0].range,
			color: color
		};
	});
	return colorInformations;
});

connection.onColorPresentation(async (params: ColorPresentationParams): Promise<ColorPresentation[]> => {
	let settings = await getDocumentSettings(params.textDocument.uri);
	return [{ label: stringifyColor(params.color, settings.colorTokenCasing) }];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
