import type { Meta, StoryObj } from '@storybook/react-vite';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { InteractionRecorderView } from './InteractionRecorder';
import { SaveStoryView } from './SaveStory';
import {
	emptyCode,
	longCode,
	panelFrame,
	simpleCode,
	warningCode,
} from './story-helpers';

const noop = () => {};

const saveButton = (
	<SaveStoryView
		state="button"
		isDevelopment
		name="Sign up form"
		onNameChange={noop}
		onStartInput={noop}
		onSave={noop}
	/>
);

const meta: Meta<typeof InteractionRecorderView> = {
	title: 'Addon UI/Interaction Recorder Panel',
	component: InteractionRecorderView,
	args: {
		onToggleRecording: noop,
		onToggleAsserting: noop,
		onReset: noop,
		saveButton,
	},
	decorators: [panelFrame()],
	parameters: {
		layout: 'centered',
	},
};
export default meta;

type Story = StoryObj<typeof InteractionRecorderView>;

/** Idle: nothing recorded yet. */
export const Empty: Story = {
	args: { code: emptyCode, isRecording: false, isAsserting: false },
};

/** Recording started, waiting for the first interaction. */
export const Recording: Story = {
	args: { code: emptyCode, isRecording: true, isAsserting: false },
};

/** Recording with assertion mode on. */
export const AssertionMode: Story = {
	args: { code: emptyCode, isRecording: true, isAsserting: true },
};

/** Generated test code from a short recording. */
export const WithCode: Story = {
	args: { code: simpleCode, isRecording: true, isAsserting: false },
};

/** Generated code with every code-quality warning surfaced inline. */
export const WithWarnings: Story = {
	args: { code: warningCode, isRecording: true, isAsserting: false },
};

/** A long recording — the body scrolls and the "Play Function" header sticks. */
export const LongRecording: Story = {
	args: { code: longCode, isRecording: true, isAsserting: false },
};
