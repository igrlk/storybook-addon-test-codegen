import type { Meta, StoryObj } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { UPDATE_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { expect, waitFor, within } from 'storybook/test';
import { IS_ASSERTING_KEY, IS_RECORDING_KEY } from '../constants';

/**
 * A small, deterministic surface for the preview-side overlays the addon injects
 * over the story while recording (hover highlight, query tooltip, assertion menu).
 */
const OverlayFixture = () => (
	<div style={{ padding: 48, fontFamily: 'sans-serif' }}>
		<div
			style={{
				width: 320,
				border: '1px solid #e0e0e0',
				borderRadius: 8,
				padding: 24,
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
				background: 'white',
				color: '#07074D',
			}}
		>
			<label
				style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}
			>
				Email address
				<input
					aria-label="Email address"
					defaultValue="jane@example.com"
					style={{
						padding: '8px 10px',
						border: '1px solid #ccc',
						borderRadius: 6,
						fontSize: 14,
					}}
				/>
			</label>
			<button
				type="button"
				style={{
					padding: '10px 14px',
					background: '#6A64F1',
					color: 'white',
					border: 'none',
					borderRadius: 6,
					fontSize: 14,
					cursor: 'pointer',
				}}
			>
				Sign up
			</button>
		</div>
	</div>
);

const body = (el: HTMLElement) => el.ownerDocument.body;

/**
 * Turn recording on from inside the preview. Driving it through the channel
 * (rather than a story-level global) means the capture doesn't depend on how
 * globals are seeded, and it doesn't retrigger the panel's story-change reset.
 */
const startRecording = async (asserting: boolean) => {
	addons.getChannel().emit(UPDATE_GLOBALS, {
		globals: {
			[IS_RECORDING_KEY]: true,
			[IS_ASSERTING_KEY]: asserting,
		},
	});
	// let the global propagate and the decorator attach its listeners
	await new Promise((resolve) => setTimeout(resolve, 250));
};

/**
 * `drawOutline` removes and redraws the outline on every `mouseover`, so check
 * first and only re-dispatch while it's still missing (the listeners may attach
 * a beat after recording turns on).
 */
const hoverUntilOutline = (canvasElement: HTMLElement, target: Element) =>
	waitFor(
		() => {
			if (body(canvasElement).querySelector('[data-no-query]')) {
				return;
			}
			target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
			throw new Error('outline not drawn yet');
		},
		{ timeout: 8000, interval: 400 },
	);

const meta: Meta<typeof OverlayFixture> = {
	title: 'Addon UI/Interaction Overlays',
	component: OverlayFixture,
};
export default meta;

type Story = StoryObj<typeof OverlayFixture>;

/** Recording on: hovering an element outlines it and shows the query the addon will write. */
export const HighlightOutline: Story = {
	play: async ({ canvasElement }) => {
		await startRecording(false);
		const button = within(canvasElement).getByRole('button', { name: 'Sign up' });
		await hoverUntilOutline(canvasElement, button);
	},
};

/** Assertion mode: the highlight turns green and the tooltip shows the `expect(...)` call. */
export const AssertionHighlight: Story = {
	play: async ({ canvasElement }) => {
		await startRecording(true);
		const input = within(canvasElement).getByLabelText('Email address');
		await hoverUntilOutline(canvasElement, input);
	},
};

/** Assertion mode: clicking an element opens the menu of assertions valid for it. */
export const AssertionMenu: Story = {
	play: async ({ canvasElement }) => {
		await startRecording(true);
		const input = within(canvasElement).getByLabelText('Email address');
		// Hover first so the recorder captures the target for the menu.
		await hoverUntilOutline(canvasElement, input);

		const rect = input.getBoundingClientRect();
		const opts = {
			bubbles: true,
			clientX: rect.left + 8,
			clientY: rect.top + 8,
		};
		input.dispatchEvent(new MouseEvent('pointerdown', opts));
		input.dispatchEvent(new MouseEvent('click', opts));

		await waitFor(() =>
			expect(
				within(body(canvasElement)).getByText('to be visible'),
			).toBeInTheDocument(),
		);
	},
};
