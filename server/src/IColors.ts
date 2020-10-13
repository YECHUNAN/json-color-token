import { Position } from 'vscode-languageserver';

export interface IColors {
	color: string,
	range: {
		start: Position,
		end: Position
	}
};