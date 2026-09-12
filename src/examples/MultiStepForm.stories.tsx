import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiStepForm } from './MultiStepForm';

const meta: Meta<typeof MultiStepForm> = {
	title: 'Examples/Multi-step Form',
	component: MultiStepForm,
	parameters: {
		testCodegen: {
			testIdAttribute: 'data-testid',
		},
		// Example/demo story — not part of the addon UI, so keep it out of visual capture.
		uiVerify: { disableSnapshot: true },
	},
};
export default meta;

type Story = StoryObj<typeof MultiStepForm>;

export const Default: Story = {};
