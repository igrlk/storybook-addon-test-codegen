import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { storyNameFromExport, toId } from '@storybook/csf';
import type { Channel } from 'storybook/internal/channels';
import { formatFileContent } from 'storybook/internal/common';
import { printCsf, readCsf } from 'storybook/internal/csf-tools';
import type { Options } from 'storybook/internal/types';
import {
	duplicateStoryWithNewName,
	parseArgs,
	removeExtraNewlines,
	updateArgsInCsfFile,
} from './codegen/save-story';
import { EVENTS } from './constants';
import type { SaveNewStoryRequestPayload } from './data';

export const handler = async (payload: SaveNewStoryRequestPayload) => {
	const { csfId, importPath, args, name, code } = payload;

	try {
		const sourceFilePath = join(process.cwd(), importPath);

		const csf = await readCsf(sourceFilePath, {
			makeTitle: (userTitle: string) => userTitle || 'myTitle',
		});

		const parsed = csf.parse();
		const stories = Object.entries(parsed._stories);

		const [componentId, storyId] = csfId.split('--');
		const newStoryName = name && storyNameFromExport(name);
		const newStoryId = newStoryName && toId(componentId, newStoryName);

		const [storyName] =
			stories.find(([key, value]) => value.id.endsWith(`--${storyId}`)) || [];
		if (!storyName) {
			console.error('Source story not found.');
			return;
		}
		if (name && csf.getStoryExport(name)) {
			console.error('Story already exists.');
			return;
		}

		const sourceStoryName = storyNameFromExport(storyName);

		await updateArgsInCsfFile(
			name
				? duplicateStoryWithNewName(parsed, storyName, name)
				: csf.getStoryExport(storyName),
			args ? parseArgs(args) : {},
		);

		const code = await formatFileContent(
			sourceFilePath,
			removeExtraNewlines(printCsf(csf).code, name || storyName),
		);

		console.log(code);

		// Writing the CSF file should trigger HMR, which causes the story to rerender. Delay the
		// response until that happens, but don't wait too long.
		await Promise.all([
			// new Promise<void>((resolve) => {
			// 	channel.on(STORY_RENDERED, resolve);
			// 	setTimeout(() => resolve(channel.off(STORY_RENDERED, resolve)), 3000);
			// }),
			writeFile(sourceFilePath, code),
		]);
	} catch (error: any) {
		console.error(
			`Error saving story: ${error.stack || error.message || error.toString()}`,
		);
	}
};

handler({
	code: {
		imports: [
			"import { userEvent, within, waitFor, expect } from '@storybook/test';",
		],
		play: [
			'play: async ({ canvasElement }) => {',
			'\tconst body = canvasElement.ownerDocument.body;',
			'\tconst canvas = within(body);',
			"\tawait userEvent.click(await canvas.findByText('Email Address', { exact: true }));",
			"\tawait userEvent.click(await canvas.findByRole('textbox', { name: 'Email Address' }));",
			"\tawait waitFor(() => expect(body.querySelector('.items-end > div:nth-of-type(1)')).toBeInTheDocument());",
			"\tawait userEvent.click(body.querySelector('.items-end > div:nth-of-type(1)') as HTMLElement);",
			"\tawait userEvent.click(await canvas.findByText('Email Address', { exact: true }));",
			"\tawait userEvent.click(await canvas.findByPlaceholderText('Enter your username', { exact: true }));",
			"\tawait userEvent.click(await canvas.findByRole('textbox', { name: 'Email Address' }));",
			"\tawait userEvent.click(await canvas.findByRole('textbox', { name: 'Email Address' }));",
			"\tawait userEvent.click(await canvas.findByText('Email Address', { exact: true }));",
			'}',
		],
	},
	name: `New${Date.now()}`,
	args: '{}',
	csfId: 'form--default',
	importPath: 'stories/Form.stories.tsx',
});

export const experimental_serverChannel = async (
	channel: Channel,
	options: Options,
) => {
	console.log('Server channel created', channel, options);

	channel.on(EVENTS.SAVE_NEW_STORY, handler);

	return channel;
};
