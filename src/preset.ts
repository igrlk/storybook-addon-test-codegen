import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Channel } from 'storybook/internal/channels';
import {
	type RequestData,
	type ResponseData,
	STORY_RENDERED,
} from 'storybook/internal/core-events';
import { readCsf } from 'storybook/internal/csf-tools';
import type { Options } from 'storybook/internal/types';
import { generateStoryCode } from './codegen/generate-story-code';
import { EVENTS } from './constants';
import type {
	SaveNewStoryRequestPayload,
	SaveNewStoryResponsePayload,
} from './data';

export const experimental_serverChannel = async (
	channel: Channel,
	options: Options,
) => {
	channel.on(
		EVENTS.SAVE_NEW_STORY_REQUEST,
		async ({ id, payload }: RequestData<SaveNewStoryRequestPayload>) => {
			const { csfId, importPath, args, name, code } = payload;

			try {
				const sourceFilePath = join(process.cwd(), importPath);

				const csf = await readCsf(sourceFilePath, {
					makeTitle: (userTitle: string) => userTitle || 'myTitle',
				});

				const { storyCode, newStoryId } = await generateStoryCode({
					csf,
					csfId,
					name,
					args,
					code,
				});

				// Writing the CSF file should trigger HMR, which causes the story to rerender. Delay the
				// response until that happens, but don't wait too long.
				await Promise.all([
					new Promise<void>((resolve) => {
						channel.on(STORY_RENDERED, resolve);
						setTimeout(() => resolve(channel.off(STORY_RENDERED, resolve)), 3000);
					}),
					writeFile(sourceFilePath, storyCode),
				]);

				channel.emit(EVENTS.SAVE_NEW_STORY_RESPONSE, {
					id,
					success: true,
					payload: { newStoryId },
					error: null,
				} satisfies ResponseData<SaveNewStoryResponsePayload>);
			} catch (error) {
				channel.emit(EVENTS.SAVE_NEW_STORY_RESPONSE, {
					id,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				} satisfies ResponseData<SaveNewStoryResponsePayload>);

				if (error instanceof Error) {
					console.error(
						`Error saving story: ${error.stack || error.message || error.toString()}`,
					);
				}
			}
		},
	);

	return channel;
};
