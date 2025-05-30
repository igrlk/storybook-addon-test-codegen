import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';

const meta: Meta<typeof Form> = {
	component: Form,
};
export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {};
