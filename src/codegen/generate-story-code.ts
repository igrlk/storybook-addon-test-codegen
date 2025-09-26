import { formatFileContent } from 'storybook/internal/common';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import { type CsfFile, printCsf } from 'storybook/internal/csf-tools';
import { type GeneratedCode, isPlay } from './interactions-to-code';
import {
	duplicateStoryWithNewName,
	parseArgs,
	removeExtraNewlines,
	updateArgsInCsfFile,
	updateImportsInCsfFile,
	updatePlayInCsfFile,
	updateTestsInCsfFile,
} from './save-story-utils';

export const generateStoryCode = async ({
	csf,
	csfId,
	name,
	args,
	code,
}: {
	csf: CsfFile;
	csfId: string;
	name: string;
	args: string;
	code: GeneratedCode;
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

	// If we're updating an existing story, use that node, otherwise create a new one
	const node = existingStoryToUpdate
		? csf._storyExports[existingStoryToUpdate[0]]
		: (csf._storyExports[newStoryName] ??
			duplicateStoryWithNewName(parsed, originalStoryName, newStoryName));

	await updateArgsInCsfFile(node, args ? parseArgs(args) : {});

	if (isPlay(code)) {
		await updatePlayInCsfFile(
			node,
			code.play.map((line) => line.text),
		);

		await updateImportsInCsfFile(
			csf._ast,
			code.imports.map((line) => line.text),
		);
	} else {
		await updateTestsInCsfFile(
			node,
			code.parameters,
			code.tests.map((line) => line.text),
			newStoryName,
			csf._ast,
		);

		await updateImportsInCsfFile(
			csf._ast,
			code.imports.map((line) => line.text),
		);
	}

	return {
		storyCode: await formatFileContent(
			'.',
			removeExtraNewlines(printCsf(csf).code, newStoryName),
		),
		newStoryId,
	};
};
