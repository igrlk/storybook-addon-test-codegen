import type { Meta, StoryObj } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { CodeBlock } from './CodeBlock';
import { contentFrame, simpleCode } from './story-helpers';

const meta: Meta<typeof CodeBlock> = {
	title: 'Addon UI/Code Block',
	component: CodeBlock,
	decorators: [contentFrame({ width: 480, padding: 48 })],
	parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof CodeBlock>;

export const Imports: Story = {
	args: { name: 'Imports', codeLines: simpleCode.imports },
};

export const PlayFunction: Story = {
	args: { name: 'Play Function', codeLines: simpleCode.play, isSticky: true },
};
