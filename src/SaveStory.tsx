import { CheckIcon, SaveIcon } from '@storybook/icons';
import { dequal as deepEqual } from 'dequal';
import { type ChangeEvent, useEffect, useState } from 'react';
import { Form } from 'storybook/internal/components';
import {
	experimental_requestResponse,
	useStorybookApi,
} from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';
import type { Args } from 'storybook/internal/types';
import type { GeneratedCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import type {
	SaveNewStoryErrorPayload,
	SaveNewStoryRequestPayload,
	SaveNewStoryResponsePayload,
} from './data';
import { StyledButton } from './styles';

const Container = styled.form({
	display: 'flex',
	alignItems: 'center',
	gap: 8,
});

const SaveIconColorful = styled(SaveIcon)(({ theme }) => ({
	color: theme.color.secondary,
}));

const Input = styled(Form.Input)(({ theme }) => ({
	paddingLeft: 10,
	paddingRight: 10,
	fontSize: theme.typography.size.s1,
	height: 28,
	minHeight: 'unset',

	...(theme.base === 'light' && {
		color: theme.color.darkest,
	}),

	'::placeholder': {
		color: theme.color.mediumdark,
	},
	'&:invalid:not(:placeholder-shown)': {
		boxShadow: `${theme.color.negative} 0 0 0 1px inset`,
	},
	'&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
		{
			display: 'none',
		},
}));

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

	const storyData = api.getCurrentStoryData();
	useEffect(() => {
		setName(storyData?.name);
	}, [storyData?.name]);

	const [state, setState] = useState<
		'button' | 'input' | 'creating' | 'success'
	>('button');

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
		<Container>
			{state === 'button' && (
				<StyledButton onClick={() => setState('input')} variant="outline">
					<SaveIconColorful size={16} /> Save story
				</StyledButton>
			)}

			{(state === 'input' || state === 'creating') && (
				<>
					<Input
						placeholder="Type story name"
						required
						autoFocus
						value={name}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
						disabled={state === 'creating'}
						onBlur
					/>
					<StyledButton
						onClick={saveStory}
						type="submit"
						variant="outline"
						disabled={state === 'creating'}
					>
						Save
					</StyledButton>
				</>
			)}

			{state === 'success' && (
				<StyledButton variant="outline" type="button">
					<SaveIconColorful size={16} /> Story saved
				</StyledButton>
			)}
		</Container>
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
