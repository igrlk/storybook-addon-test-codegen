import type { Meta, StoryObj } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { styled } from 'storybook/theming';
import { WarningExplanation } from './CodeBlock';
import { contentFrame } from './story-helpers';

// Mimics the popover chrome the explanation normally renders inside, so each
// warning is shown as its own complete, self-contained card (no portal, no
// hover, nothing to trim at the capture edge).
const TooltipCard = styled.div(({ theme }) => ({
	display: 'inline-block',
	background: theme.background.content,
	color: theme.color.defaultText,
	border: `1px solid ${theme.appBorderColor}`,
	borderRadius: 6,
	boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
}));

const meta: Meta<typeof WarningExplanation> = {
	title: 'Addon UI/Warning Explanations',
	component: WarningExplanation,
	decorators: [contentFrame({ padding: 32 })],
	render: (args) => (
		<TooltipCard>
			<WarningExplanation {...args} />
		</TooltipCard>
	),
	parameters: {
		layout: 'centered',
	},
};
export default meta;

type Story = StoryObj<typeof WarningExplanation>;

/** Shown when a query uses getByRole without a name. */
export const RoleWithoutName: Story = {
	args: { warning: 'ROLE_WITHOUT_NAME' },
};

/** Shown when a query falls back to querySelector. */
export const QuerySelector: Story = { args: { warning: 'QUERY_SELECTOR' } };

/** Shown when a query relies on a test id. */
export const TestId: Story = { args: { warning: 'TEST_ID' } };
