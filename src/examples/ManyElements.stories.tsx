import type { Meta, StoryObj } from '@storybook/react-vite';
import { ManyElements } from './ManyElements';

const meta: Meta<typeof ManyElements> = {
	title: 'Examples/Many Elements',
	component: ManyElements,
	// Example/demo story — not part of the addon UI, so keep it out of visual capture.
	parameters: { uiVerify: { disableSnapshot: true } },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
