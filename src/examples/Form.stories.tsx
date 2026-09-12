import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';

const meta: Meta<typeof Form> = {
	title: 'Examples/Form',
	component: Form,
	// Example/demo story — not part of the addon UI, so keep it out of visual capture.
	parameters: { uiVerify: { disableSnapshot: true } },
};
export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {};
