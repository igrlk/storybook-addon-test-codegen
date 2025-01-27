import { CheckIcon } from '@storybook/icons';
import { dequal as deepEqual } from 'dequal';
import { type ChangeEvent, useEffect, useState } from 'react';
import {
	experimental_requestResponse,
	useStorybookApi,
} from 'storybook/internal/manager-api';
import type { Args } from 'storybook/internal/types';
import type { GeneratedCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import type {
	SaveNewStoryErrorPayload,
	SaveNewStoryRequestPayload,
	SaveNewStoryResponsePayload,
} from './data';
import {
	RotatingIcon,
	SaveContainer,
	SaveIconColorful,
	SaveInput,
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
		'button' | 'input' | 'creating' | 'success'
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

		const { newStoryId } = await experimental_requestResponse<
			SaveNewStoryRequestPayload,
			SaveNewStoryResponsePayload,
			SaveNewStoryErrorPayload
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
			api.addNotification({
				id: 'create-new-story-file-success',
				content: {
					headline: 'Story file created',
					subHeadline: `${name} was created`,
				},
				duration: 8_000,
				icon: <CheckIcon />,
			});
			setState('button');
		}

		await trySelectNewStory(api.selectStory, newStoryId);
	};

	return (
		<SaveContainer>
			{state === 'button' && (
				<StyledButton onClick={() => setState('input')} variant="outline">
					<SaveIconColorful size={16} /> Save story
				</StyledButton>
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
					<RotatingIcon /> Save to story
				</StyledButton>
			)}

			{state === 'success' && (
				<StyledButton variant="outline" type="button">
					<StyledCheckIcon /> Saved
				</StyledButton>
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
