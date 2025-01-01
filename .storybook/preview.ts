import type { Preview } from '@storybook/react';
import './tailwind.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		testCodegen: {
			testIdAttribute: 'data-testid',
		},
	},
};

export default preview;
