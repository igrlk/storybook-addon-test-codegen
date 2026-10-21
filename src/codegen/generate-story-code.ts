import { formatFileContent } from 'storybook/internal/common';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import type { CsfFile } from 'storybook/internal/csf-tools';
import type { GeneratedCode } from './interactions-to-code';
import type { StorySaver } from './story-saver';

// The body lines of a generated `play: async (...) => { ... }`, without the
// first and last line, their trailing semicolon and one level of indent.
const preparePlay = (play: string[]) => play.slice(1, -1).map(prepareLine);

const prepareLine = (line: string) => {
	let result = line;

	if (result.endsWith(';')) {
		result = result.slice(0, -1);
	}

	if (result.startsWith('\t')) {
		result = result.slice(1);
	}

	return result;
};

export const generateStoryCode = async ({
	csf,
	csfId,
	name,
	args,
	code,
	saver,
}: {
	csf: CsfFile;
	csfId: string;
	name: string;
	args: string;
	code: GeneratedCode;
	/** The save steps for the installed Storybook, from `loadStorySaver`. */
	saver: StorySaver;
}) => {
	const parsed = csf.parse();
	const stories = Object.entries(parsed._stories);

	const [componentId, storyId] = csfId.split('--');

	const originalStoryName = stories.find(([key, value]) =>
		value.id.endsWith(`--${storyId}`),
	)?.[0];
	if (!originalStoryName) {
		throw new Error('Source story not found.');
	}

	// Format the new story name to follow Storybook naming conventions
	const newStoryName = name
		.replace(/^[^a-z]/i, '')
		.replace(/^\d+/, '')
		.replace(/[^a-z0-9-_ ]/gi, '')
		.replaceAll(/([-_ ]+[a-z0-9])/gi, (match) =>
			match.toUpperCase().replace(/[-_ ]/g, ''),
		); // from https://github.com/storybookjs/storybook/blob/1fdd2d6c675b81269125af5027e45a357c09f1fa/code/addons/controls/src/SaveStory.tsx#L122

	// Check if we're updating an existing story
	const existingStoryToUpdate =
		// Check for story.name property matching our target
		stories.find(([key, story]) => {
			if (story.name === name) {
				return true;
			}

			return false;
		}) ||
		// If no story with matching name property, look for a story by its export name
		stories.find(([key]) => key === name || storyNameFromExport(key) === name);

	const newStoryId = existingStoryToUpdate
		? toId(componentId, storyId)
		: toId(componentId, storyNameFromExport(newStoryName));

	// Update the existing story in place, or a copy of the original under the new name
	const exportName = existingStoryToUpdate?.[0] ?? newStoryName;
	const edits = saver.edit(parsed);
	if (!parsed._storyExports[exportName]) {
		edits.duplicateStory(originalStoryName, newStoryName);
	}

	await edits.setArgs(exportName, args);
	await edits.setPlay(
		exportName,
		preparePlay(code.play.map((line) => line.text)),
	);
	await edits.addImports(code.imports.map((line) => line.text));

	return {
		storyCode: await formatFileContent('.', edits.print(newStoryName)),
		newStoryId,
	};
};
