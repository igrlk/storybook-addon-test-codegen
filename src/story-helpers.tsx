import type { Decorator } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { ThemeProvider, ensure, themes } from 'storybook/theming';
import {
	type GeneratedCode,
	convertInteractionsToCode,
} from './codegen/interactions-to-code';
import type { Interaction } from './state';

/**
 * UI Verify modes: capture every story in both themes automatically, each as its
 * own baseline, instead of hand-writing a `*Dark` twin per story. A mode's `theme`
 * is applied as the `theme:<value>` Storybook global (which our frames read below)
 * and also emulates the OS color scheme.
 */
export const themeModes = {
	Light: { theme: 'light' },
	Dark: { theme: 'dark' },
} as const;

const resolveTheme = (globals: { theme?: string }) =>
	ensure(themes[globals.theme === 'dark' ? 'dark' : 'light']);

/**
 * Frame that renders the full-height addon panel exactly like the manager does:
 * a fixed-size, themed surface so `height: 100%` inside the panel resolves. The
 * theme comes from the `theme` global so UI Verify modes can drive it.
 */
export const panelFrame =
	({ width = 560, height = 380 } = {}): Decorator =>
	(Story, { globals }) => {
		const theme = resolveTheme(globals);
		return (
			<ThemeProvider theme={theme}>
				<div
					style={{
						width,
						height,
						overflow: 'hidden',
						display: 'flex',
						background: theme.background.app,
						border: `1px solid ${theme.appBorderColor}`,
						color: theme.color.defaultText,
						fontFamily: theme.typography.fonts.base,
					}}
				>
					{/* Inner wrapper: the panel's effect forces its parent to height:100%,
					    so give it this div (100% of the fixed outer) to keep the outer height
					    fixed and let the panel body scroll instead of expanding. */}
					<div style={{ flex: 1, minWidth: 0, height: '100%' }}>
						<Story />
					</div>
				</div>
			</ThemeProvider>
		);
	};

/**
 * Padded, themed surface for the smaller controls (Save button, code block). Uses
 * the app background (not content) so the bordered card and its padding stay
 * visible in dark mode too.
 */
export const contentFrame =
	({
		width,
		padding = 24,
	}: { width?: number; padding?: number } = {}): Decorator =>
	(Story, { globals }) => {
		const theme = resolveTheme(globals);
		return (
			<ThemeProvider theme={theme}>
				<div
					style={{
						width,
						padding,
						background: theme.background.app,
						color: theme.color.defaultText,
						fontFamily: theme.typography.fonts.base,
					}}
				>
					<Story />
				</div>
			</ThemeProvider>
		);
	};

const canvas = (
	method: string,
	args: unknown[],
	nth: number | null = null,
): Interaction['elementQuery'] => ({ object: 'canvas', method, args, nth });

/** A clean recording: type into a field, click a button, assert the result. */
export const simpleCode: GeneratedCode = convertInteractionsToCode(
	[
		{
			elementQuery: canvas('getByLabelText', ['Email address']),
			event: { type: 'type', value: 'jane@example.com' },
		},
		{
			elementQuery: canvas('getByRole', ['button', { name: 'Sign up' }]),
			event: { type: 'click' },
		},
		{
			elementQuery: canvas('getByText', ['Thanks for signing up!']),
			event: { type: 'assertion', assertionType: 'toBeVisible', args: [] },
		},
	],
	true,
);

/** A recording that trips every code-quality warning the addon can surface. */
export const warningCode: GeneratedCode = convertInteractionsToCode(
	[
		{
			elementQuery: canvas('getByTestId', ['email-input']),
			event: { type: 'type', value: 'jane@example.com' },
		},
		{
			elementQuery: canvas('getByRole', ['button']),
			event: { type: 'click' },
		},
		{
			elementQuery: canvas('querySelector', ['.card > .cta']),
			event: { type: 'click' },
		},
	],
	true,
);

/** A long recording so the panel scrolls and the sticky "Play Function" header shows. */
export const longCode: GeneratedCode = convertInteractionsToCode(
	[
		{
			elementQuery: canvas('getByLabelText', ['First name']),
			event: { type: 'type', value: 'Jane' },
		},
		{
			elementQuery: canvas('getByLabelText', ['Last name']),
			event: { type: 'type', value: 'Doe' },
		},
		{
			elementQuery: canvas('getByLabelText', ['Email address']),
			event: { type: 'type', value: 'jane@example.com' },
		},
		{
			elementQuery: canvas('getByLabelText', ['Password']),
			event: { type: 'type', value: 'hunter2' },
		},
		{
			elementQuery: canvas('getByRole', ['combobox', { name: 'Country' }]),
			event: { type: 'select', options: ['Canada'] },
		},
		{
			elementQuery: canvas('getByRole', ['checkbox', { name: 'Subscribe' }]),
			event: { type: 'click' },
		},
		{
			elementQuery: canvas('getByRole', ['button', { name: 'Create account' }]),
			event: { type: 'click' },
		},
		{
			elementQuery: canvas('getByRole', ['heading', { name: 'Welcome, Jane' }]),
			event: { type: 'assertion', assertionType: 'toBeVisible', args: [] },
		},
		{
			elementQuery: canvas('getByText', ['jane@example.com']),
			event: { type: 'assertion', assertionType: 'toBeInTheDocument', args: [] },
		},
	],
	true,
);

/** Empty program — the panel's zero state. */
export const emptyCode: GeneratedCode = { imports: [], play: [] };
