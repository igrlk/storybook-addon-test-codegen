import { defineMain } from '@storybook/react-vite/node';
export default defineMain({
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [import.meta.resolve('./local-preset.ts'), '@storybook/addon-docs'],
	features: {
		actions: false,
		controls: false,
		experimentalTestSyntax: true,
	},
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
});
