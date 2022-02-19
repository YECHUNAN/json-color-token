/* --------------------------------------------------------------------------------------------
 * Copyright (c) Chunan Ye. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/**
 * Settings of json-color-token
 */
export interface JSONColorTokenSettings {
	/**
	 * Maximum number of color tokens that we allow the extension to parse.
	 * Once this many tokens are detected, the extension will stop processing any future tokens.
	 * Used mainly to avoid performance issues.
	 */
	maxNumberOfColorTokens: number;

	/**
	 * When using the color picker to set color, whether to set them as uppercase or lowercase letters.
	 */

	colorTokenCasing: "Uppercase" | "Lowercase";

	/**
	 * Languages for which to search for color tokens. Mutually exclusive with `cssLanguages`.
	 */
	languages: string[];

	/**
	 * Languages for which to search for referenced color token variables. Mutually exclusive with `languages`.
	 */
	cssLanguages: string[];
}

// The default settings, used when the `workspace/configuration` request is not supported by the client.
export const defaultSettings: JSONColorTokenSettings = {
	maxNumberOfColorTokens: 1000,
	colorTokenCasing: "Uppercase",
	languages: ["json", "jsonc"],
	cssLanguages: ["css", "less"]
};

/* A color token can be with/without opacity (last two digits)
 * e.g. without opacity #000000, with opacity #00000050
 */
export const colorTokenPattern = /#([0-9a-fA-F]{6}([0-9a-fA-F]{2})?|[0-9a-fA-F]{3}([0-9a-fA-F]{1})?)([ ;,"]|$)/g;
// export const colorTokenPattern = /#[0-9a-fA-F]{6}([0-9]{2})?/g;

export const cssVariablePattern = /var\(--(?<cssVar>[a-zA-Z0-9\-]+)\)/g;

export const jsonKeyPattern = /(((?<=")(?<varDoulbeQuote>[a-zA-Z0-9-_]+)(?="\s*:))|((?<=')(?<varSingleQuote>[a-zA-Z0-9-_]+)(?='\s*:)))/g;

export const maxNumberOfColorTokensNotificationNamespace = "JSONCOLORTOKEN.maxNumberOfColorTokens";
