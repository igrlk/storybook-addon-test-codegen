import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { MultiStepForm } from './MultiStepForm';

const meta: Meta<typeof MultiStepForm> = {
	component: MultiStepForm,
	parameters: {
		testCodegen: {
			testIdAttribute: 'data-testid',
		},
	},
};
export default meta;

type Story = StoryObj<typeof MultiStepForm>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(await canvas.findByRole('textbox', { name: 'Name' }));
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Name' }),
			'hello world',
		);
		await userEvent.click(await canvas.findByRole('textbox', { name: 'Email' }));
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Email' }),
			'asdf@gmail.com',
		);
		await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
	},
};
