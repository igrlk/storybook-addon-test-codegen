import type { CsfFile } from 'storybook/internal/csf-tools';

/**
 * The edits a save makes to one parsed story file. They read and build
 * syntax nodes, so there is one implementation per csf-tools generation:
 * `save-story-babel.ts` for the Babel csf-tools and `save-story-estree.ts`
 * for the ESTree ones. `generateStoryCode` decides what to edit; these do it.
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
 * Whether `csfTools` are the ESTree csf-tools of storybookjs/storybook#36613
 * (Storybook 11). Storybook 10, and the 11 prereleases before #36613, have
 * the Babel ones.
 */
export const hasEstreeCsfTools = (csfTools: object) =>
	'parseModule' in csfTools && typeof csfTools.parseModule === 'function';

/**
 * The saver for the installed csf-tools. Each is imported only where it
 * works: with #36613 `storybook/internal/babel` does not resolve, and
 * without it the csf-tools lack the exports the ESTree saver imports.
 */
export const loadStorySaver = async (): Promise<StorySaver> =>
	hasEstreeCsfTools(await import('storybook/internal/csf-tools'))
		? (await import('./save-story-estree')).estreeStorySaver
		: (await import('./save-story-babel')).babelStorySaver;
