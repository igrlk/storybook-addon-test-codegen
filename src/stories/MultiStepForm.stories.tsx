import type { Meta, StoryObj } from '@storybook/react-vite';
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

export const Default: Story = {};
