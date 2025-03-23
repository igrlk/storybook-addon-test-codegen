import type { Meta, StoryObj } from '@storybook/react';
import { MultiStepForm } from './MultiStepForm';

const meta: Meta<typeof MultiStepForm> = {
	component: MultiStepForm,
};
export default meta;

type Story = StoryObj<typeof MultiStepForm>;

export const Default: Story = {};

export const SubmitForm: Story = {
	},
};
