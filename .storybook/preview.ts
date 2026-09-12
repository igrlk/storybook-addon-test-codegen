import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import addonCodegen from '../src/index';
import './tailwind.css';
import { configure } from 'storybook/test';

configure({
	testIdAttribute: 'my-custom-attribute',
});

export default definePreview({
	addons: [addonDocs(), addonCodegen()],
	// The addon-UI stories read this global to pick their ThemeProvider; UI Verify
	// modes set it per capture, and the toolbar lets you switch it locally.
	initialGlobals: { theme: 'light' },
	globalTypes: {
		theme: {
			description: 'Theme for the addon UI stories',
			toolbar: {
				title: 'Theme',
				icon: 'paintbrush',
				items: [
					{ value: 'light', title: 'Light' },
					{ value: 'dark', title: 'Dark' },
				],
				dynamicTitle: true,
			},
		},
	},
});
