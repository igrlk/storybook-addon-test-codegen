import { DOM_EVENTS } from '../constants';
import type { InteractionEvent } from '../state';

export const getInteractionEvent = (event: Event): InteractionEvent | null => {
	const type = event.type;
	if (!DOM_EVENTS.includes(type)) {
		return null;
	}

	switch (type) {
		case 'pointerdown':
		case 'dblclick':
			return getClickEvent(event);
		case 'input':
			return getInputEvent(event);
		case 'keydown':
			return getKeydownEvent(event);
		case 'keyup':
			return getKeyupEvent(event);
		case 'focus':
			return getFocusEvent();
	}

	throw new Error(`Unhandled event type: ${type}`);
};

const getClickEvent = (event: Event): InteractionEvent => ({
	type: event.type === 'pointerdown' ? 'click' : 'dblclick',
});

const getInputEvent = (event: Event): InteractionEvent | null => {
	const target = event.target as HTMLElement;

	if (
		target.nodeName === 'INPUT' &&
		(target as HTMLInputElement).type.toLowerCase() === 'file'
	) {
		return {
			type: 'upload',
			files: [...((target as HTMLInputElement).files ?? [])].map(
				(file) => file.name,
			),
		};
	}

	if (isRangeInput(target)) {
		return {
			type: 'type',
			value: target.value,
		};
	}

	if (
		['INPUT', 'TEXTAREA'].includes(target.nodeName) ||
		target.isContentEditable
	) {
		if (
			target.nodeName === 'INPUT' &&
			['checkbox', 'radio'].includes(
				(target as HTMLInputElement).type.toLowerCase(),
			)
		) {
			// Checkbox is handled in click, we can't let input trigger on checkbox - that would mean we dispatched click events while recording.
			return null;
		}

		return {
			type: 'type',
			value: target.isContentEditable
				? target.innerText
				: (target as HTMLInputElement).value,
		};
	}

	if (target.nodeName === 'SELECT') {
		const selectElement = target as HTMLSelectElement;

		return {
			type: 'select',
			options: [...selectElement.selectedOptions].map((option) => option.value),
		};
	}

	return null;
};

const KEY_TO_SPECIAL_KEY: Record<string, string> = {
	Enter: '{enter}',
	Escape: '{esc}',
};

const getKeydownEvent = (event: Event): InteractionEvent | null => {
	const keyboardEvent = event as KeyboardEvent;
	const element = keyboardEvent.target as HTMLElement;

	if (keyboardEvent.key === 'Tab') {
		return { type: 'keydown', key: 'tab' };
	}

	if (keyboardEvent.key === 'Shift') {
		return { type: 'keydown', key: 'shift' };
	}

	if (
		keyboardEvent.key === 'Enter' &&
		(element.tagName === 'TEXTAREA' || element.isContentEditable)
	) {
		return null;
	}

	if (keyboardEvent.key === ' ' && keyboardEvent.target) {
		const checkbox = isCheckbox(element);
		if (checkbox) {
			return { type: 'click' };
		}
	}

	const specialKey = KEY_TO_SPECIAL_KEY[keyboardEvent.key];

	if (!specialKey) {
		return null;
	}

	return {
		type: 'keydown',
		key: specialKey as '{enter}' | '{esc}',
	};
};

const getKeyupEvent = (event: Event): InteractionEvent | null => {
	const keyboardEvent = event as KeyboardEvent;
	if (keyboardEvent.key === 'Shift') {
		return { type: 'keyup', key: 'shift' };
	}

	return null;
};

const isCheckbox = (node: Node | null): HTMLInputElement | null => {
	if (!node || node.nodeName !== 'INPUT') return null;
	const inputElement = node as HTMLInputElement;
	return ['checkbox', 'radio'].includes(inputElement.type) ? inputElement : null;
};

const isRangeInput = (node: Node | null): node is HTMLInputElement => {
	if (!node || node.nodeName !== 'INPUT') return false;
	const inputElement = node as HTMLInputElement;
	return inputElement.type.toLowerCase() === 'range';
};

const getFocusEvent = (): InteractionEvent => ({
	type: 'focus',
	shift: false,
});
