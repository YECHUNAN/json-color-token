/* --------------------------------------------------------------------------------------------
 * Copyright (c) Chunan Ye. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Position } from "vscode-languageserver";

export interface IColors {
	color: string,
	range: {
		start: Position,
		end: Position
	}
};