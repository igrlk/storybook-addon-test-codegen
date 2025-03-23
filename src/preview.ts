import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';

import { IS_ASSERTING_KEY, IS_RECORDING_KEY } from './constants';
import { withInteractionRecorder } from './decorators/with-interaction-recorder';

const preview: ProjectAnnotations<Renderer> = {
	decorators: [withInteractionRecorder],
	initialGlobals: {
		[IS_RECORDING_KEY]: false,
		[IS_ASSERTING_KEY]: false,
	},
};

export default preview;
