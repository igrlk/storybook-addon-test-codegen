// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { type Combo, addons, types } from 'storybook/manager-api';

import { AddonPanel, Badge, Spaced } from 'storybook/internal/components';
import type { ResponseData } from 'storybook/internal/core-events';
import { Consumer } from 'storybook/manager-api';
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
		render: ({ active }) => {
			const mapper = ({ state }: Combo) => {
				return {
					getStoryName: (storyId: string) => {
						return state.internal_index?.entries[storyId]?.name ?? 'Story';
					},
				};
			};

			return (
				<Consumer filter={mapper}>
					{(fromState) => {
						return (
							<AddonPanel active={active ?? false}>
								<InteractionRecorder getStoryName={fromState.getStoryName} />
							</AddonPanel>
						);
					}}
				</Consumer>
			);
		},
	});
});
