import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';

import { IS_ASSERTING_KEY, IS_RECORDING_KEY } from './constants';
import { withInteractionRecorder } from './decorators/with-interaction-recorder';

export const decorators: ProjectAnnotations<Renderer>['decorators'] = [
	withInteractionRecorder,
];

export const initialGlobals: ProjectAnnotations<Renderer>['initialGlobals'] = {
	[IS_RECORDING_KEY]: false,
	[IS_ASSERTING_KEY]: false,
};
