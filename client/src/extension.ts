/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { workspace, ExtensionContext, window as VSCodeWindow } from "vscode";

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from "vscode-languageclient";
import {
	defaultSettings,
	maxNumberOfColorTokensNotificationNamespace,
	maxNumberOfColorTokensNotificationInterval
} from "./constants";

let client: LanguageClient;

/**
 * @param count Limit of the number of color tokens to be parsed.
 * @todo Loc
 */
function getMaxNumberOfColorTokensNotificationMessage(count: number): string {
	return `The number of color tokens detected has reached the limit: ${count}. Please consider increasing the limit in the configuration.`;
}

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join("server", "out", "server.js")
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node"s Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	let languages: string[] = defaultSettings.languages;
	let cssLanguages: string[] = defaultSettings.cssLanguages;

	try {
		const setting = workspace.getConfiguration("jsonColorToken");
		languages = setting.get("languages");
		cssLanguages = setting.get("cssLanguages");
	} catch (err) {
		console.warn("Unable to get configurations!");
	}
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for json, jsonc files (color token detection)
		// and css files for color token variable preview
		documentSelector: [...languages, ...cssLanguages]
			.map((lang) => {
				return {
					scheme: "file", language: lang
				};
			}),
		synchronize: {
			// Notify the server about file changes to ".clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher("**/.clientrc")
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		"jsonColorToken",
		"JSON Color Token LSP",
		serverOptions,
		clientOptions
	);

	let lastNotificationTimeInSec: number | undefined = undefined;
	client.onReady().then(() => {
		client.onNotification(maxNumberOfColorTokensNotificationNamespace, (args: { count: number }) => {
			const currentTimeInSec = Date.now();
			if (!lastNotificationTimeInSec || (currentTimeInSec - lastNotificationTimeInSec) > maxNumberOfColorTokensNotificationInterval) {
				VSCodeWindow.showInformationMessage(getMaxNumberOfColorTokensNotificationMessage(args.count));
				lastNotificationTimeInSec = currentTimeInSec;
			}
		});
	});

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
