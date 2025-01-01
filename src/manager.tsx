import { addons, types } from 'storybook/internal/manager-api';

import { AddonPanel, Badge, Spaced } from 'storybook/internal/components';
import { InteractionRecorder } from './InteractionRecorder';
import { ADDON_ID, PANEL_ID } from './constants';
import { useIsRecording, useRecorderState } from './state';

function Title() {
	const [{ interactions }] = useRecorderState();
	const [isRecording] = useIsRecording();

	return (
		<div>
			<Spaced col={1}>
				<span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
					Interaction Recorder
				</span>
				{isRecording && <Badge status="neutral">{interactions.length}</Badge>}
			</Spaced>
		</div>
	);
}

addons.register(ADDON_ID, () => {
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
