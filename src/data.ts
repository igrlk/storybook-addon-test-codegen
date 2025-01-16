import type { GeneratedCode } from './codegen/interactions-to-code';

export type SaveNewStoryRequestPayload = {
	code: GeneratedCode;
	csfId: string;
	importPath: string;
	args: string;
	name: string;
};
