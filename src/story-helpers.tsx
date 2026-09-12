import type { Decorator } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { ThemeProvider, ensure, themes } from 'storybook/theming';
import {
	type GeneratedCode,
	convertInteractionsToCode,
} from './codegen/interactions-to-code';
import type { Interaction } from './state';

/** A padded, themed surface so the addon's manager components render like they do in the panel. */
export const contentFrame =
	({
		width,
		padding = 24,
	}: { width?: number; padding?: number } = {}): Decorator =>
	(Story) => {
		const theme = ensure(themes.light);
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
