import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { Form } from './Form';

const meta: Meta<typeof Form> = {
	component: Form,
};
export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {};

export const WithArgs: Story = {
	args: {
		a: 10,
		handler: (a: number, b: number) => a + b,
	},
};

export const WithPlay: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(await canvas.findByRole('button'));
	},
};

export const Bla: Story = {
	name: 'Bla bla',
	args: {
		a: 10,
		handler: (a: number, b: number) => a + b,
	},
};
