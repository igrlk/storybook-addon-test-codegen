import { useCallback, useEffect } from 'storybook/internal/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';

import { useChannel } from 'storybook/internal/preview-api';
import { generateQuery } from '../codegen/generate-query';
import { getInteractionEvent } from '../codegen/get-interaction-event';
import {
	DOM_EVENTS,
	EVENTS,
	IS_ASSERTING_KEY,
	IS_RECORDING_KEY,
} from '../constants';
import type { Interaction } from '../state';
import { useAddonParameters } from './state';

export const withInteractionListener: DecoratorFunction = (
	storyFn,
	context,
) => {
	const isRecording = context.globals[IS_RECORDING_KEY];
	const isAssertionMode = context.globals[IS_ASSERTING_KEY];
	const emit = useChannel({});
	const { testIdAttribute } = useAddonParameters();

	const listener = useCallback<EventListener>(
		async (event) => {
			// Skip events when in assertion mode (they're handled separately)
			if (isAssertionMode) {
				return;
			}

			const interactionEvent = getInteractionEvent(event);
			if (!interactionEvent) {
				return;
			}

			const elementQuery = await generateQuery(
				document.body,
				event.target as HTMLElement,
				testIdAttribute,
			);

			if (!elementQuery) {
				return;
			}

			const listenerEvent: Interaction = {
				elementQuery,
				event: interactionEvent,
			};

			emit(EVENTS.INTERACTION, listenerEvent);
		},
		[isAssertionMode],
	);

	useEffect(() => {
		if (!isRecording) {
			return;
		}

		for (const domEvent of DOM_EVENTS) {
			document.body.addEventListener(domEvent, listener, true);
		}

		return () => {
			for (const domEvent of DOM_EVENTS) {
				document.body.removeEventListener(domEvent, listener, true);
			}
		};
	}, [isRecording, listener]);

	return storyFn();
};
