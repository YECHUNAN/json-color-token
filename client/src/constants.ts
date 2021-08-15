/**
 * Make sure this file is in sync with server/src/constants
 * @todo Find out a way to share code between client and server.
 */

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
	 * For what language of documents to apply the extension.
	 */
	languages: string[];
}

// The default settings, used when the `workspace/configuration` request is not supported by the client.
export const defaultSettings: JSONColorTokenSettings = { 
	maxNumberOfColorTokens: 1000,
	colorTokenCasing: "Uppercase",
	languages: ["json", "jsonc"]
};

/**
 * Languages to exclude when applying the color token detection and preview.
 */
export const languagesToExclude: string[] = ["css", "less"];