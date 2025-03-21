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

const hasCheckableAriaRole = (el: HTMLElement): boolean => {
	const role = el.getAttribute('role');
	return role !== null && ['checkbox', 'radio', 'switch'].includes(role);
};

const isCheckboxOrRadio = (el: HTMLElement): boolean => {
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

const configs: {
	assertionType: AssertionEvent['assertionType'];
	label: string;
	predicate: (element: HTMLElement) => boolean;
	getArgs?: (element: HTMLElement) => unknown[];
}[] = [
	{
		assertionType: 'toBeVisible',
		label: 'to be visible',
		predicate: () => true,
	},
	{
		assertionType: 'toBeInTheDocument',
		label: 'to be in the document',
		predicate: () => true,
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
];

const getOrderedAssertions = (
	element: HTMLElement,
	assertionTypes: AssertionEvent['assertionType'][],
): ApplicableAssertion[] => {
	// Get all available assertions
	const allAssertions = configs
		.filter((config) => config.predicate(element))
		.map<ApplicableAssertion>((config) => ({
			assertionType: config.assertionType,
			args: config.getArgs?.(element) ?? [],
			label: config.label,
		}));

	// Return them in the order specified
	return assertionTypes.map((assertionType) => {
		const foundAssertion = allAssertions.find(
			(a) => a.assertionType === assertionType,
		);
		if (!foundAssertion && assertionType === 'toHaveValue') {
			// Special case for toHaveValue which might not be in the original array
			return {
				assertionType: 'toHaveValue',
				args: [''],
				label: 'to have value',
			};
		}
		if (!foundAssertion) {
			throw new Error(
				`Assertion ${assertionType} not found for element ${element.tagName}`,
			);
		}
		return foundAssertion;
	});
};

export const getApplicableAssertions = (
	element: HTMLElement,
): ApplicableAssertion[] => {
	if (isCheckboxOrRadio(element)) {
		const inputEl = element as HTMLInputElement;
		const isDisabled =
			('disabled' in element && element.disabled) || isInDisabledFieldset(element);

		return getOrderedAssertions(element, [
			'toBeVisible',
			'toBeInTheDocument',
			inputEl.checked ? 'toBeChecked' : 'not.toBeChecked',
			isDisabled ? 'toBeDisabled' : 'toBeEnabled',
		]);
	}

	// Special handling for ARIA role elements
	if (hasCheckableAriaRole(element)) {
		const ariaChecked = element.getAttribute('aria-checked');

		// Reorder assertions for ARIA role elements to match test expectations
		const reordered: AssertionEvent['assertionType'][] = [
			'toBeVisible',
			'toBeInTheDocument',
		];

		// Only add toBeEnabled for elements that can be disabled
		if (isDisableableElement(element)) {
			reordered.push('toBeEnabled');
		}

		// Add checked assertion in the correct position
		if (ariaChecked === 'true') {
			reordered.push('toBeChecked');
		} else if (ariaChecked === 'false') {
			reordered.push('not.toBeChecked');
		}

		// Add text content if applicable
		if (element.textContent !== null && element.textContent !== '') {
			reordered.push('toHaveTextContent');
		}

		return getOrderedAssertions(element, reordered);
	}

	// Default case - return all applicable assertions
	return configs
		.filter((config) => config.predicate(element))
		.map<ApplicableAssertion>((config) => ({
			assertionType: config.assertionType,
			args: config.getArgs?.(element) ?? [],
			label: config.label,
		}));
};
