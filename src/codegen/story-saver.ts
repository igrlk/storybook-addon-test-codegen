import type { CsfFile } from 'storybook/internal/csf-tools';

/**
 * The edits a save makes to one parsed story file. They read and build
 * syntax nodes, so there is one implementation per csf-tools generation:
 * `save-story-babel.ts` for Storybook 10 and `save-story-estree.ts` for
 * Storybook 11. `generateStoryCode` decides what to edit; these do it.
 */
export interface StoryFileEdits {
	/** Exports a copy of a story, without its `args` and `name`, under a new name. */
	duplicateStory(originalExportName: string, newExportName: string): void;
	/** Sets the args the controls panel sent, as JSON, on a story. */
	setArgs(exportName: string, args: string): void | Promise<void>;
	/** Sets a story's `play` function to one with the given body lines. */
	setPlay(exportName: string, play: string[]): void | Promise<void>;
	/** Adds the import statements, merged into the file's imports. */
	addImports(imports: string[]): void | Promise<void>;
	/** The edited file. `newStoryName` is the story the save wrote. */
	print(newStoryName: string): string;
}

export interface StorySaver {
	edit(csf: ReturnType<CsfFile['parse']>): StoryFileEdits;
}

/**
 * The saver for the installed Storybook: ESTree when its csf-tools have
 * `parseModule` (Storybook 11), Babel otherwise (Storybook 10). Each is
 * imported only on the Storybook it is written for: on Storybook 11
 * `storybook/internal/babel` does not resolve, and Storybook 10 lacks the
 * csf-tools exports the ESTree one imports.
 */
export const loadStorySaver = async (): Promise<StorySaver> => {
	const csfTools = await import('storybook/internal/csf-tools');
	return 'parseModule' in csfTools && typeof csfTools.parseModule === 'function'
		? (await import('./save-story-estree')).estreeStorySaver
		: (await import('./save-story-babel')).babelStorySaver;
};
