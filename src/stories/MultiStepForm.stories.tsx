import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { MultiStepForm } from './MultiStepForm';

const meta: Meta<typeof MultiStepForm> = {
	component: MultiStepForm,
};
export default meta;

type Story = StoryObj<typeof MultiStepForm>;

export const Playground: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(await canvas.findByRole('textbox', { name: 'Name' }));
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Name' }),
			'Jane',
		);
		await userEvent.click(await canvas.findByRole('textbox', { name: 'Email' }));
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Email' }),
			'jane@test.com',
		);
		await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
		await userEvent.click(await canvas.findByRole('textbox', { name: 'Phone' }));
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Phone' }),
			'123456789',
		);
		await userEvent.click(
			await canvas.findByRole('textbox', { name: 'Address' }),
		);
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Address' }),
			'42 Avenue',
		);
		await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
		await userEvent.click(await canvas.findByText(': Jane', { exact: true }));
		await userEvent.click(
			await canvas.findByText(': jane@test.com', { exact: true }),
		);
		await userEvent.click(
			await canvas.findByText(': 123456789', { exact: true }),
		);
		await userEvent.click(
			await canvas.findByText(': 42 Avenue', { exact: true }),
		);
	},
};
