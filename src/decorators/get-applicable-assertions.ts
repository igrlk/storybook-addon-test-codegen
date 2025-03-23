// The assertions that this library generates are the most used assertions from jest-dom library.
// https://github.com/testing-library/jest-dom contains the spec for all of them.

import type { AssertionEvent } from '../state';

export type ApplicableAssertion = Omit<AssertionEvent, 'type'> & {
	label: string;
};

const isInDisabledFieldset = (el: HTMLElement): boolean => {
	let parent = el.parentElement;
	while (parent) {
		if (
			parent.tagName === 'FIELDSET' &&
			(parent as HTMLFieldSetElement).disabled
		) {
			return true;
		}
		parent = parent.parentElement;
	}
	return false;
};

const isInputLikeElement = (el: HTMLElement): boolean => {
	if (
		[HTMLSelectElement, HTMLTextAreaElement].some((type) => el instanceof type)
	) {
		return true;
	}

	return (
		el instanceof HTMLInputElement && !['checkbox', 'radio'].includes(el.type)
	);
};

const isCheckboxOrRadio = (el: HTMLElement): el is HTMLInputElement => {
	return (
		el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)
	);
};

const isDisableableElement = (el: HTMLElement): boolean => {
	const disableableElements = [
		'BUTTON',
		'INPUT',
		'SELECT',
		'TEXTAREA',
		'OPTGROUP',
		'OPTION',
		'FIELDSET',
	];
	return disableableElements.includes(el.tagName);
};

const availableAssertions: {
	assertionType: AssertionEvent['assertionType'];
	label: string;
	predicate: (element: HTMLElement) => boolean;
	getArgs?: (element: HTMLElement) => unknown[];
}[] = [
	{
		assertionType: 'toBeChecked',
		label: 'to be checked',
		predicate: (el) => {
			if (el instanceof HTMLInputElement && isCheckboxOrRadio(el) && el.checked) {
				return true;
			}

			const role = el.getAttribute('role');
			const ariaChecked = el.getAttribute('aria-checked');

			if (
				role &&
				['checkbox', 'radio', 'switch'].includes(role) &&
				ariaChecked === 'true'
			) {
				return true;
			}

			return false;
		},
	},
	{
		assertionType: 'not.toBeChecked',
		label: 'to not be checked',
		predicate: (el) => {
			if (el instanceof HTMLInputElement && isCheckboxOrRadio(el) && !el.checked) {
				return true;
			}

			const role = el.getAttribute('role');
			const ariaChecked = el.getAttribute('aria-checked');

			if (
				role &&
				['checkbox', 'radio', 'switch'].includes(role) &&
				ariaChecked === 'false'
			) {
				return true;
			}

			return false;
		},
	},
	{
		assertionType: 'toHaveValue',
		label: 'to have value',
		predicate: (el) => {
			if (
				el instanceof HTMLInputElement &&
				el.type === 'number' &&
				Number.isNaN(el.valueAsNumber)
			) {
				return false;
			}

			if (isInDisabledFieldset(el) && el instanceof HTMLInputElement) {
				return true;
			}

			return isInputLikeElement(el);
		},
		getArgs: (el) => {
			if (el instanceof HTMLInputElement) {
				if (el.type === 'number') {
					return [el.valueAsNumber];
				}
				return [el.value];
			}

			if (el instanceof HTMLSelectElement) {
				if (el.multiple) {
					return [Array.from(el.selectedOptions).map((option) => option.value)];
				}

				// Always return a value for select elements
				return [el.value];
			}

			if (el instanceof HTMLTextAreaElement) {
				return [el.value];
			}

			return [''];
		},
	},
	{
		assertionType: 'not.toHaveValue',
		label: 'to not have value',
		predicate: (el) => {
			if (
				el instanceof HTMLInputElement &&
				el.type === 'number' &&
				Number.isNaN(el.valueAsNumber)
			) {
				return true;
			}

			return false;
		},
	},
	{
		assertionType: 'toHaveTextContent',
		label: 'to have text content',
		predicate: (el) => el.textContent !== null && el.textContent !== '',
		getArgs: (el) => [el.textContent || ''],
	},
	{
		assertionType: 'toBeEnabled',
		label: 'to be enabled',
		predicate: (el) => {
			if (!isDisableableElement(el)) {
				return false;
			}

			if ('disabled' in el && !!el.disabled) {
				return false;
			}

			return !isInDisabledFieldset(el);
		},
	},
	{
		assertionType: 'toBeDisabled',
		label: 'to be disabled',
		predicate: (el) => {
			if (!isDisableableElement(el)) {
				return false;
			}

			if ('disabled' in el && !!el.disabled) {
				return true;
			}

			return isInDisabledFieldset(el);
		},
	},
];

export const getApplicableAssertions = (
	element: HTMLElement,
): ApplicableAssertion[] => [
	{
		assertionType: 'toBeVisible',
		label: 'to be visible',
		args: [],
	},
	{
		assertionType: 'toBeInTheDocument',
		label: 'to be in the document',
		args: [],
	},
	...availableAssertions
		.filter((config) => config.predicate(element))
		.map((config) => ({
			assertionType: config.assertionType,
			args: config.getArgs?.(element) ?? [],
			label: config.label,
		})),
];
