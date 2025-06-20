import type { Meta, StoryObj } from '@storybook/react-vite';
import { ManyElements } from './ManyElements';

const meta: Meta<typeof ManyElements> = {
	component: ManyElements,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
