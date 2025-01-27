import { toId } from '@storybook/csf';
import { formatFileContent } from 'storybook/internal/common';
import { type CsfFile, printCsf } from 'storybook/internal/csf-tools';
import type { GeneratedCode } from './interactions-to-code';
import {
	duplicateStoryWithNewName,
	parseArgs,
	removeExtraNewlines,
	updateArgsInCsfFile,
	updateImportsInCsfFile,
	updatePlayInCsfFile,
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

	const [originalStoryName] =
		stories.find(([key, value]) => value.id.endsWith(`--${storyId}`)) || [];
	if (!originalStoryName) {
		throw new Error('Source story not found.');
	}

	const newStoryName = name
		.replace(/^[^a-z]/i, '')
		.replace(/^\d+/, '')
		.replace(/[^a-z0-9-_ ]/gi, '')
		.replaceAll(/([-_ ]+[a-z0-9])/gi, (match) =>
			match.toUpperCase().replace(/[-_ ]/g, ''),
		); // from https://github.com/storybookjs/storybook/blob/1fdd2d6c675b81269125af5027e45a357c09f1fa/code/addons/controls/src/SaveStory.tsx#L122

	const newStoryId = toId(componentId, newStoryName);

	const node =
		csf._storyExports[newStoryName] ??
		duplicateStoryWithNewName(parsed, originalStoryName, newStoryName);

	const parsedArgs = args ? parseArgs(args) : {};
	if (Object.keys(parsedArgs).length) {
		await updateArgsInCsfFile(node, args ? parseArgs(args) : {});
	}

	await updatePlayInCsfFile(node, code.play);

	await updateImportsInCsfFile(csf._ast, code.imports);

	return {
		storyCode: await formatFileContent(
			'.',
			removeExtraNewlines(printCsf(csf).code, newStoryName),
		),
		newStoryId,
	};
};
