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
});
