import type { Meta, StoryObj } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SaveStoryView } from './SaveStory';
import { contentFrame } from './story-helpers';

const noop = () => {};

const meta: Meta<typeof SaveStoryView> = {
	title: 'Addon UI/Save To Story',
	component: SaveStoryView,
	args: {
		name: 'Sign up form',
		isDevelopment: true,
		onNameChange: noop,
		onStartInput: noop,
		onSave: noop,
	},
	decorators: [contentFrame({ padding: 48 })],
	parameters: {
		layout: 'centered',
	},
};
export default meta;

type Story = StoryObj<typeof SaveStoryView>;

export const Button: Story = { args: { state: 'button' } };
export const NameInput: Story = { args: { state: 'input' } };
export const Saving: Story = { args: { state: 'creating' } };
export const Saved: Story = { args: { state: 'success' } };
export const SaveFailed: Story = { args: { state: 'error' } };

/** In a static (non-dev) Storybook the button is disabled — hovering explains why. */
export const DisabledInProduction: Story = {
	args: { state: 'button', isDevelopment: false },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.hover(await canvas.findByText('Save to story'));

		const body = within(canvasElement.ownerDocument.body);
		await waitFor(() =>
			expect(
				body.getByText('Only available in development mode'),
			).toBeInTheDocument(),
		);
	},
};
