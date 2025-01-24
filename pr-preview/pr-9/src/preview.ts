import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';

import { IS_RECORDING_KEY } from './constants';
import { withHoverOutline } from './decorators/with-hover-outline';
import { withInteractionListener } from './decorators/with-interaction-listener';

const preview: ProjectAnnotations<Renderer> = {
	decorators: [withInteractionListener, withHoverOutline],
	initialGlobals: {
		[IS_RECORDING_KEY]: false,
	},
};

export default preview;
