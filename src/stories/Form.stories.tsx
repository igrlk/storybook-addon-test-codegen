import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { Form } from './Form';

const meta: Meta<typeof Form> = {
	component: Form,
};
export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(
			await canvas.findByPlaceholderText('Enter your username', { exact: true }),
		);
		await userEvent.type(
			await canvas.findByPlaceholderText('Enter your username', { exact: true }),
			'aaee',
		);
	},
};

export const WithArgs: Story = {
	args: {
		a: 100,
		handler: (a: number, b: number) => a + b,
	},

	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
		);
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
			'asdf',
		);
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

	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
		);
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
			'asdf@gmail.com',
		);
		await userEvent.click(
			await canvas.findByPlaceholderText('Enter your username', { exact: true }),
		);
		await userEvent.type(
			await canvas.findByPlaceholderText('Enter your username', { exact: true }),
			'asdf',
		);
	},
};
