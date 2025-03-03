import { addons, types } from 'storybook/internal/manager-api';

import { AddonPanel, Badge, Spaced } from 'storybook/internal/components';
import type { ResponseData } from 'storybook/internal/core-events';
import { InteractionRecorder } from './InteractionRecorder';
import { ADDON_ID, EVENTS, PANEL_ID } from './constants';
import type { SaveNewStoryResponsePayload } from './data';
import { useInteractions, useIsRecording } from './state';

function Title() {
	const [interactions] = useInteractions();
	const [isRecording] = useIsRecording();

	return (
		<div>
			<Spaced col={1}>
				<span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
					Interaction Recorder
				</span>
				{isRecording && (
					<Badge status="neutral">{JSON.parse(interactions).length}</Badge>
				)}
			</Spaced>
		</div>
	);
}

addons.register(ADDON_ID, (api) => {
	const channel = api.getChannel();

	channel?.on(
		EVENTS.SAVE_NEW_STORY_RESPONSE,
		(data: ResponseData<SaveNewStoryResponsePayload>) => {
			if (!data.success) {
				return;
			}
			const story = api.getCurrentStoryData();

			if (story.type !== 'story') {
				return;
			}

			api.resetStoryArgs(story);
			if (data.payload.newStoryId) {
				api.selectStory(data.payload.newStoryId);
			}
		},
	);

	addons.add(PANEL_ID, {
		type: types.PANEL,
		title: Title,
		match: ({ viewMode }) => viewMode === 'story',
		render: ({ active }) => (
			<AddonPanel active={active ?? false}>
				<InteractionRecorder />
			</AddonPanel>
		),
	});
});
