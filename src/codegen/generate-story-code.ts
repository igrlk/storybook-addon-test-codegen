import { formatFileContent } from 'storybook/internal/common';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import { loadCsf } from 'storybook/internal/csf-tools';
import type { GeneratedCode } from './interactions-to-code';
import {
	duplicateStoryWithNewName,
	findStoryExport,
	parseArgs,
	updateArgsInCsfFile,
	updateImportsInCsfFile,
	updatePlayInCsfFile,
} from './save-story-utils';
import { SourceEditor } from './source-editor';

export const generateStoryCode = async ({
	source,
	fileName,
	csfId,
	name,
	args,
	code,
}: {
	/** The story file's source. */
	source: string;
	fileName?: string;
	csfId: string;
	name: string;
	args: string;
	code: GeneratedCode;
}) => {
	const csf = loadCsf(source, {
		fileName,
		makeTitle: (userTitle?: string) => userTitle || 'myTitle',
	}).parse();
	const stories = Object.entries(csf._stories);

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

	const editor = new SourceEditor(source, fileName);
	const storyArgs = args ? parseArgs(args) : {};
	const play = code.play.map((line) => line.text);

	// If we're updating an existing story, edit it in place, otherwise edit a copy and append it
	const existingExportName = existingStoryToUpdate
		? existingStoryToUpdate[0]
		: csf._storyExports[newStoryName]
			? newStoryName
			: undefined;

	if (existingExportName) {
		const locate = () => findStoryExport(editor, existingExportName);
		await updateArgsInCsfFile(editor, locate, storyArgs);
		await updatePlayInCsfFile(editor, locate, play);
	} else {
		const copy = duplicateStoryWithNewName(
			editor,
			originalStoryName,
			newStoryName,
		);
		const locate = () => copy.program;
		await updateArgsInCsfFile(copy, locate, storyArgs);
		await updatePlayInCsfFile(copy, locate, play);
		editor.appendStatement(copy.code);
		editor.commit();
	}

	await updateImportsInCsfFile(
		editor,
		code.imports.map((line) => line.text),
	);

	return {
		storyCode: await formatFileContent('.', editor.toString()),
		newStoryId,
	};
};
