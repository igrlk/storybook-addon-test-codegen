import { useAddonState } from 'storybook/internal/manager-api';
import { useGlobals } from 'storybook/internal/manager-api';
import type { ElementQuery } from './codegen/generate-query';
import { ADDON_ID, IS_ASSERTING_KEY, IS_RECORDING_KEY } from './constants';

export type ClickEvent = { type: 'click' | 'dblclick' };
export type TypeEvent = { type: 'type'; value: string };
export type KeydownEvent = {
	type: 'keydown';
	key: '{enter}' | '{esc}' | 'tab' | 'shift';
};
export type KeyupEvent = {
	type: 'keyup';
	key: 'shift';
};
export type SelectEvent = { type: 'select'; options: string[] };
export type UploadEvent = { type: 'upload'; files: string[] };
export type FocusEvent = { type: 'focus'; shift: boolean };
export type AssertionEvent = {
	type: 'assertion';
	assertionType:
		| 'toBeVisible'
		| 'toBeInTheDocument'
		| 'toBeChecked'
		| 'not.toBeChecked'
		| 'toBeDisabled'
		| 'toBeEnabled'
		| 'toHaveFocus'
		| 'toHaveValue'
		| 'not.toHaveValue'
		| 'toHaveTextContent';
	args: unknown[];
};
export type InteractionEvent =
	| ClickEvent
	| TypeEvent
	| KeydownEvent
	| KeyupEvent
	| SelectEvent
	| UploadEvent
	| FocusEvent
	| AssertionEvent;

export type Interaction = {
	elementQuery: ElementQuery;
	event: InteractionEvent;
};

// Interactions are stored as stringified Interaction[],
// because latest storybook has some issues with storing objects in addon state,
// where whenever you update the array, if number of elements are same, it doesn't trigger re-render
export const useInteractions = () =>
	useAddonState<string>(ADDON_ID, JSON.stringify([]));

export const useIsRecording = () => {
	const [globals, setGlobals] = useGlobals();

	return [
		globals[IS_RECORDING_KEY] === true,
		(isRecording: boolean) => {
			setGlobals({
				[IS_RECORDING_KEY]: isRecording,
			});
		},
	] as const;
};

export const useIsAsserting = () => {
	const [globals, setGlobals] = useGlobals();

	return [
		globals[IS_ASSERTING_KEY] === true,
		(isAssertionMode: boolean) => {
			setGlobals({
				[IS_ASSERTING_KEY]: isAssertionMode,
			});
		},
	] as const;
};
