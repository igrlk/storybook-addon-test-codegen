import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import './tailwind.css';
import { configure } from 'storybook/test';

configure({
	testIdAttribute: 'my-custom-attribute',
});

export default definePreview({
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},

	addons: [addonDocs()],
});
