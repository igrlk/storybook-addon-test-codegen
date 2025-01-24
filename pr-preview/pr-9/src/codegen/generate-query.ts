import { finder } from '@medv/finder';
import {
	findAllByLabelText,
	findAllByPlaceholderText,
	findAllByRole,
	findAllByTestId,
	findAllByText,
	findAllByTitle,
	findByLabelText,
	findByPlaceholderText,
	findByRole,
	findByTestId,
	findByText,
	findByTitle,
	getNodeText,
	queryAllByLabelText,
	queryAllByPlaceholderText,
	queryAllByRole,
	queryAllByTestId,
	queryAllByText,
	queryAllByTitle,
} from '@testing-library/dom';
import { computeAccessibleName, getRole } from 'dom-accessibility-api';

const queries = {
	role: {
		findOne: {
			name: 'findByRole',
			handler: findByRole,
		},
		findAll: {
			name: 'findAllByRole',
			handler: findAllByRole,
		},
		queryAll: queryAllByRole,
	},
	labelText: {
		findOne: {
			name: 'findByLabelText',
			handler: findByLabelText,
		},
		findAll: {
			name: 'findAllByLabelText',
			handler: findAllByLabelText,
		},
		queryAll: queryAllByLabelText,
	},
	placeholderText: {
		findOne: {
			name: 'findByPlaceholderText',
			handler: findByPlaceholderText,
		},
		findAll: {
			name: 'findAllByPlaceholderText',
			handler: findAllByPlaceholderText,
		},
		queryAll: queryAllByPlaceholderText,
	},
	text: {
		findOne: {
			name: 'findByText',
			handler: findByText,
		},
		findAll: {
			name: 'findAllByText',
			handler: findAllByText,
		},
		queryAll: queryAllByText,
	},
	title: {
		findOne: {
			name: 'findByTitle',
			handler: findByTitle,
		},
		findAll: {
			name: 'findAllByTitle',
			handler: findAllByTitle,
		},
		queryAll: queryAllByTitle,
	},
	testId: {
		findOne: {
			name: 'findByTestId',
			handler: findByTestId,
		},
		findAll: {
			name: 'findAllByTestId',
			handler: findAllByTestId,
		},
		queryAll: queryAllByTestId,
	},
	css: {
		parent: 'body',
		findOne: {
			name: 'querySelector',
			handler: (container: HTMLElement, selector: string) => null,
		},
		findAll: {
			name: 'querySelectorAll',
			handler: (container: HTMLElement, selector: string) => null,
		},
		queryAll: (container: HTMLElement, selector: string) => null,
	},
};

const selectorMethods = Object.keys(queries) as (keyof typeof queries)[];

type AfterFirst<T> = T extends [infer First, ...infer Rest] ? Rest : never;

type MethodMapping = {
	[Method in (typeof selectorMethods)[number]]: {
		method: Method;
		args: AfterFirst<Parameters<(typeof queries)[Method]['findOne']['handler']>>;
		score: number;
	};
};

type Selector = MethodMapping[(typeof selectorMethods)[number]];

const priorities = [
	'roleWithName',
	'label',
	'placeholder',
	'roleWithoutName',
	'textExact',
	'textPartial',
	'title',
	'testId',
	'css',
] as const;

const SCORE = priorities.reduce<Record<(typeof priorities)[number], number>>(
	(acc, key, index) => {
		acc[key] = index;
		return acc;
	},
	{} as Record<(typeof priorities)[number], number>,
);

const getSelectors = (
	container: Element,
	element: Element,
	testIdAttribute: string,
): Selector[] => {
	const selectors: Selector[] = [];

	const ariaRole = getRole(element);
	if (ariaRole) {
		const ariaName = computeAccessibleName(element);
		if (ariaName) {
			selectors.push({
				method: 'role',
				args: [ariaRole, { name: ariaName }],
				score: SCORE.roleWithName,
			});
		} else {
			selectors.push({
				method: 'role',
				args: [ariaRole],
				score: SCORE.roleWithoutName,
			});
		}
	}

	const labels = getElementLabels(element);
	for (const label of labels) {
		selectors.push({
			method: 'labelText',
			args: [label, { exact: true }],
			score: SCORE.label,
		});
	}

	if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
		const input = element as HTMLInputElement | HTMLTextAreaElement;
		if (input.placeholder) {
			selectors.push({
				method: 'placeholderText',
				args: [input.placeholder, { exact: true }],
				score: SCORE.placeholder,
			});
		}
	}

	const text = getNodeText(element as HTMLElement).trim();
	if (text) {
		const multilineParams = text.includes('\n')
			? {
					exact: false,
					collapseWhitespace: false,
				}
			: null;

		if (text.length <= 80) {
			selectors.push({
				method: 'text',
				args: [text, multilineParams ?? { exact: true }],
				score: SCORE.textExact,
			});
		} else {
			selectors.push({
				method: 'text',
				args: [text.slice(0, 80), multilineParams ?? { exact: false }],
				score: SCORE.textPartial,
			});
		}
	}

	const title = element.getAttribute('title');
	if (title) {
		selectors.push({
			method: 'title',
			args: [title, { exact: true }],
			score: SCORE.title,
		});
	}

	const testId = element.getAttribute(testIdAttribute);
	if (testId) {
		selectors.push({
			method: 'testId',
			args: [testId],
			score: SCORE.testId,
		});
	}

	try {
		const cssSelector = finder(element, { root: container, timeoutMs: 1000 });
		if (cssSelector) {
			selectors.push({
				method: 'css',
				args: [cssSelector],
				score: SCORE.css,
			});
		}
	} catch (ex) {
		if (ex instanceof Error && ex.message === 'Selector was not found.') {
			// Ignore
		} else {
			throw ex;
		}
	}

	return selectors;
};

export const getClosestInteractiveElement = (element: HTMLElement) =>
	element.closest(
		'button, select, input, [role="button"], [role="checkbox"], [role="radio"], a, [role="link"]',
	) as HTMLElement;

export type ElementQuery = {
	object: 'canvas' | 'body';
	method: string;
	args: unknown[];
	nth: number | null;
};

export const generateQuery = async (
	container: HTMLElement,
	element: HTMLElement,
	testIdAttribute: string,
): Promise<ElementQuery | null> => {
	const targetElement = getClosestInteractiveElement(element) || element;

	const selectors = getSelectors(container, targetElement, testIdAttribute).sort(
		(a, b) => a.score - b.score,
	);

	for (const { method, args } of selectors) {
		const elements: Element[] = Array.from(
			method === 'css'
				? container.querySelectorAll(args[0])
				: // biome-ignore lint/suspicious/noExplicitAny: Some type issue
					queries[method].queryAll(container, ...(args as any)),
		);

		const allElements = elements.filter(
			(e) => e.getAttribute('data-no-query') !== 'true',
		);

		if (!allElements?.[0] || !allElements.includes(targetElement)) {
			continue;
		}

		const object = (
			'parent' in queries[method] ? queries[method].parent : 'canvas'
		) as 'canvas' | 'body';

		if (allElements.length === 1) {
			return {
				object,
				method: queries[method].findOne.name,
				args,
				nth: null,
			};
		}

		const index = allElements.indexOf(targetElement);
		if (index === -1) {
			throw new Error('Element not found');
		}

		return {
			object,
			method: queries[method].findAll.name,
			args,
			nth: index,
		};
	}

	return null;
};

export const argsToString = (args: unknown[]) =>
	args
		.map((arg) => {
			if (typeof arg === 'string') {
				return wrapInQuotes(arg);
			}

			if (typeof arg === 'object' && arg !== null) {
				return `{ ${Object.entries(arg)
					.reduce<string[]>((acc, [key, value]) => {
						acc.push(
							`${key}: ${typeof value === 'string' ? wrapInQuotes(value) : value}`,
						);
						return acc;
					}, [])
					.join(', ')} }`;
			}

			return arg;
		})
		.join(', ');

export const wrapInQuotes = (str: string) =>
	str.includes('\n') ? `\`${str}\`` : `'${str}'`;

export const getElementLabels = (element: Element): string[] => {
	const labels: string[] = [];

	const labelledby = element.getAttribute('aria-labelledby');
	if (labelledby) {
		for (const labelId of labelledby.split(' ')) {
			const label = element.ownerDocument.querySelector<HTMLElement>(
				`[id="${labelId}"]`,
			);
			if (label) {
				labels.push(label.textContent ?? '');
			}
		}
	}

	const ariaLabel = element.getAttribute('aria-label');
	if (ariaLabel?.trim()) {
		labels.push(ariaLabel);
	}

	// Handle elements that belong to the "category label" per HTML specification
	const isNonHiddenInput =
		element.nodeName === 'INPUT' &&
		(element as HTMLInputElement).type !== 'hidden';

	if (
		['BUTTON', 'METER', 'OUTPUT', 'PROGRESS', 'SELECT', 'TEXTAREA'].includes(
			element.nodeName,
		) ||
		isNonHiddenInput
	) {
		const associatedLabels = (element as HTMLInputElement).labels;
		if (associatedLabels) {
			labels.push(
				...Array.from(associatedLabels).map(
					(label) => label.textContent?.trim() ?? '',
				),
			);
		}
	}

	return [...new Set(labels.filter((label) => label))];
};
