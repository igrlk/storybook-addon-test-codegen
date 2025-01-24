import { useAddonState } from 'storybook/internal/manager-api';
import { useGlobals } from 'storybook/internal/manager-api';
import type { ElementQuery } from './codegen/generate-query';
import { ADDON_ID, IS_RECORDING_KEY } from './constants';

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
export type InteractionEvent =
	| ClickEvent
	| TypeEvent
	| KeydownEvent
	| KeyupEvent
	| SelectEvent
	| UploadEvent
	| FocusEvent;

export type Interaction = {
	elementQuery: ElementQuery;
	event: InteractionEvent;
};

export const useRecorderState = () =>
	useAddonState<{
		interactions: Interaction[];
	}>(ADDON_ID, {
		interactions: [],
	});

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
