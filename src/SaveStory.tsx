import { CheckIcon } from '@storybook/icons';
import { dequal as deepEqual } from 'dequal';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { type ChangeEvent, useEffect, useState } from 'react';
import { TooltipNote, WithTooltip } from 'storybook/internal/components';
import {
	experimental_requestResponse,
	useStorybookApi,
} from 'storybook/internal/manager-api';
import type { Args } from 'storybook/internal/types';
import type { GeneratedCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import type {
	SaveNewStoryRequestPayload,
	SaveNewStoryResponsePayload,
} from './data';
import {
	DisabledButton,
	ErrorButton,
	ErrorIcon,
	RotatingIcon,
	SaveContainer,
	SaveIconColorful,
	SaveInput,
	SavedButton,
	StyledButton,
	StyledCheckIcon,
} from './styles';

const stringifyArgs = (args: Record<string, unknown>) =>
	JSON.stringify(args, (_, value) => {
		if (typeof value === 'function') {
			return '__sb_empty_function_arg__';
		}
		return value;
	});

export const SaveStoryButton = ({
	code,
}: {
	code: GeneratedCode;
}) => {
	const api = useStorybookApi();

	const [name, setName] = useState('');
	const [state, setState] = useState<
		'button' | 'input' | 'creating' | 'success' | 'error'
	>('button');

	const storyData = api.getCurrentStoryData();
	useEffect(() => {
		setName(storyData?.name);
		setState('button');
	}, [storyData?.name]);

	const saveStory = async () => {
		setState('creating');

		const payload: SaveNewStoryRequestPayload = {
			code,
			csfId: storyData.id,
			importPath: storyData.importPath,
			args: stringifyArgs(
				'args' in storyData
					? Object.entries(storyData.args || {}).reduce<Args>(
							(acc, [key, value]) => {
								if (!deepEqual(value, storyData.initialArgs?.[key])) {
									acc[key] = value;
								}
								return acc;
							},
							{},
						)
					: {},
			),
			name,
		};

		const channel = api.getChannel();
		if (!channel) {
			return;
		}

		try {
			const { newStoryId } = await experimental_requestResponse<
				SaveNewStoryRequestPayload,
				SaveNewStoryResponsePayload
			>(
				// biome-ignore lint/suspicious/noExplicitAny: Should be fixed with new package version
				channel as any,
				EVENTS.SAVE_NEW_STORY_REQUEST,
				EVENTS.SAVE_NEW_STORY_RESPONSE,
				payload,
			);

			if (newStoryId === storyData.id) {
				setState('success');

				setTimeout(() => {
					setState('button');
				}, 2000);
			} else {
				setState('button');

				api.addNotification({
					id: 'create-new-story-file-success',
					content: {
						headline: 'Story file created',
						subHeadline: `${name} was created`,
					},
					duration: 8_000,
					icon: <CheckIcon />,
				});
			}

			await trySelectNewStory(api.selectStory, newStoryId);
		} catch (ex) {
			console.error(ex);

			api.addNotification({
				id: 'create-new-story-file-error',
				content: {
					headline: 'Failed to save story',
					subHeadline: 'Please try again',
				},
				duration: 8_000,
				icon: <CheckIcon />,
			});

			setState('error');

			setTimeout(() => {
				setState('button');
			}, 2000);
		}
	};

	const isDevelopment =
		// biome-ignore lint/suspicious/noExplicitAny:
		(global as any as { CONFIG_TYPE: string }).CONFIG_TYPE === 'DEVELOPMENT';

	return (
		<SaveContainer>
			{state === 'button' && isDevelopment && (
				<StyledButton onClick={() => setState('input')} variant="outline">
					<SaveIconColorful size={16} /> Save to story
				</StyledButton>
			)}

			{state === 'button' && !isDevelopment && (
				<WithTooltip
					as="div"
					hasChrome={false}
					trigger="hover"
					tooltip={<TooltipNote note="Only available in development mode" />}
				>
					<DisabledButton variant="outline" type="button">
						<SaveIconColorful size={16} /> Save to story
					</DisabledButton>
				</WithTooltip>
			)}

			{state === 'input' && (
				<>
					<SaveInput
						placeholder="Type story name"
						required
						autoFocus
						value={name}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
					/>
					<StyledButton onClick={saveStory} type="submit" variant="outline">
						Save
					</StyledButton>
				</>
			)}

			{state === 'creating' && (
				<StyledButton onClick={() => setState('input')} variant="outline">
					<RotatingIcon /> Saving
				</StyledButton>
			)}

			{state === 'success' && (
				<SavedButton variant="solid" type="button">
					<StyledCheckIcon /> Saved
				</SavedButton>
			)}

			{state === 'error' && (
				<ErrorButton variant="ghost" type="button">
					<ErrorIcon /> Failed to save
				</ErrorButton>
			)}
		</SaveContainer>
	);
};

export async function trySelectNewStory(
	selectStory: (id: string) => Promise<void> | void,
	storyId: string,
	attempt = 1,
): Promise<void> {
	if (attempt > 10) {
		throw new Error('We could not select the new story. Please try again.');
	}

	try {
		await selectStory(storyId);
	} catch (e) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return trySelectNewStory(selectStory, storyId, attempt + 1);
	}
}
