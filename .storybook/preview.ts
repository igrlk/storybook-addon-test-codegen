import type { Preview } from '@storybook/react-vite';
import './tailwind.css';
import { configure } from 'storybook/test';

configure({
	testIdAttribute: 'my-custom-attribute',
});

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
};

export default preview;
