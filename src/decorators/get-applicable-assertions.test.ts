import { describe, expect, test } from 'vitest';
import { getApplicableAssertions } from './get-applicable-assertions';

describe('getApplicableAssertions', () => {
	test.each([
		[
			'Visible button',
			'<button>Click me</button>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveTextContent', 'Click me'],
				'toBeEnabled',
			],
		],
		[
			'Disabled button',
			'<button disabled>Click me</button>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveTextContent', 'Click me'],
				'toBeDisabled',
			],
		],
		[
			'Checked checkbox',
			'<input type="checkbox" checked>',
			['toBeVisible', 'toBeInTheDocument', 'toBeChecked', 'toBeEnabled'],
		],
		[
			'Unchecked checkbox',
			'<input type="checkbox">',
			['toBeVisible', 'toBeInTheDocument', 'not.toBeChecked', 'toBeEnabled'],
		],
		[
			'Disabled checked checkbox',
			'<input type="checkbox" checked disabled>',
			['toBeVisible', 'toBeInTheDocument', 'toBeChecked', 'toBeDisabled'],
		],
		[
			'Disabled unchecked checkbox',
			'<input type="checkbox" disabled>',
			['toBeVisible', 'toBeInTheDocument', 'not.toBeChecked', 'toBeDisabled'],
		],
		[
			'Input with value',
			'<input value="Hello">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Hello'],
				'toBeEnabled',
			],
		],
		[
			'Input without value',
			'<input>',
			['toBeVisible', 'toBeInTheDocument', ['toHaveValue', ''], 'toBeEnabled'],
		],
		[
			'Disabled input with value',
			'<input value="Hello" disabled>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Hello'],
				'toBeDisabled',
			],
		],
		[
			'Div with text',
			'<div>Hello</div>',
			['toBeVisible', 'toBeInTheDocument', ['toHaveTextContent', 'Hello']],
		],
		[
			'Radio checked',
			'<input type="radio" checked>',
			['toBeVisible', 'toBeInTheDocument', 'toBeChecked', 'toBeEnabled'],
		],
		[
			'Radio unchecked',
			'<input type="radio">',
			['toBeVisible', 'toBeInTheDocument', 'not.toBeChecked', 'toBeEnabled'],
		],
		[
			'Disabled radio checked',
			'<input type="radio" checked disabled>',
			['toBeVisible', 'toBeInTheDocument', 'toBeChecked', 'toBeDisabled'],
		],
		[
			'Disabled radio unchecked',
			'<input type="radio" disabled>',
			['toBeVisible', 'toBeInTheDocument', 'not.toBeChecked', 'toBeDisabled'],
		],
		[
			'Number input',
			'<input type="number" value="42">',
			['toBeVisible', 'toBeInTheDocument', ['toHaveValue', 42], 'toBeEnabled'],
		],
		[
			'Number input without value',
			'<input type="number">',
			['toBeVisible', 'toBeInTheDocument', 'not.toHaveValue', 'toBeEnabled'],
		],
		[
			'Textarea with content',
			'<textarea>Hello world</textarea>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Hello world'],
				['toHaveTextContent', 'Hello world'],
				'toBeEnabled',
			],
		],
		[
			'Textarea without content',
			'<textarea />',
			['toBeVisible', 'toBeInTheDocument', ['toHaveValue', ''], 'toBeEnabled'],
		],
		[
			'Disabled textarea',
			'<textarea disabled>Hello world</textarea>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Hello world'],
				['toHaveTextContent', 'Hello world'],
				'toBeDisabled',
			],
		],
		[
			'Single select',
			'<select><option value="1">One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', '2'],
				['toHaveTextContent', 'OneTwo'],
				'toBeEnabled',
			],
		],
		[
			'Single select without selection',
			'<select><option value="1">One</option><option value="2">Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', '1'],
				['toHaveTextContent', 'OneTwo'],
				'toBeEnabled',
			],
		],
		[
			'Disabled single select',
			'<select disabled><option value="1">One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', '2'],
				['toHaveTextContent', 'OneTwo'],
				'toBeDisabled',
			],
		],
		[
			'Multiple select',
			'<select multiple><option value="1" selected>One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', ['1', '2']],
				['toHaveTextContent', 'OneTwo'],
				'toBeEnabled',
			],
		],
		[
			'Disabled multiple select',
			'<select multiple disabled><option value="1" selected>One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', ['1', '2']],
				['toHaveTextContent', 'OneTwo'],
				'toBeDisabled',
			],
		],
		[
			'Aria role checkbox checked',
			'<div role="checkbox" aria-checked="true">Checkbox</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeChecked',
				['toHaveTextContent', 'Checkbox'],
			],
		],
		[
			'Aria role checkbox unchecked',
			'<div role="checkbox" aria-checked="false">Checkbox</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'not.toBeChecked',
				['toHaveTextContent', 'Checkbox'],
			],
		],
		[
			'Aria role radio checked',
			'<div role="radio" aria-checked="true">Radio</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeChecked',
				['toHaveTextContent', 'Radio'],
			],
		],
		[
			'Aria role radio unchecked',
			'<div role="radio" aria-checked="false">Radio</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'not.toBeChecked',
				['toHaveTextContent', 'Radio'],
			],
		],
		[
			'Aria role switch checked',
			'<div role="switch" aria-checked="true">Switch</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeChecked',
				['toHaveTextContent', 'Switch'],
			],
		],
		[
			'Aria role switch unchecked',
			'<div role="switch" aria-checked="false">Switch</div>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'not.toBeChecked',
				['toHaveTextContent', 'Switch'],
			],
		],
		[
			'Element in disabled fieldset',
			'<fieldset disabled><input></fieldset>',
			['toBeVisible', 'toBeInTheDocument', 'toBeDisabled'],
		],
		[
			'Button in disabled fieldset',
			'<fieldset disabled><button>Submit</button></fieldset>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveTextContent', 'Submit'],
				'toBeDisabled',
			],
		],
		[
			'Password input',
			'<input type="password" value="secret">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'secret'],
				'toBeEnabled',
			],
		],
		[
			'Email input',
			'<input type="email" value="test@example.com">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'test@example.com'],
				'toBeEnabled',
			],
		],
		[
			'Date input',
			'<input type="date" value="2023-03-20">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', '2023-03-20'],
				'toBeEnabled',
			],
		],
		[
			'Range input',
			'<input type="range" min="0" max="100" value="50">',
			['toBeVisible', 'toBeInTheDocument', ['toHaveValue', '50'], 'toBeEnabled'],
		],
		[
			'Button with no text',
			'<button></button>',
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled'],
		],
		[
			'Button with only whitespace',
			'<button> </button>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveTextContent', ' '],
				'toBeEnabled',
			],
		],
		[
			'Submit input',
			'<input type="submit" value="Submit">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Submit'],
				'toBeEnabled',
			],
		],
		[
			'Button input',
			'<input type="button" value="Click me">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				['toHaveValue', 'Click me'],
				'toBeEnabled',
			],
		],
		[
			'Anchor tag with href',
			'<a href="https://example.com">Link</a>',
			['toBeVisible', 'toBeInTheDocument', ['toHaveTextContent', 'Link']],
		],
		[
			'Anchor tag without href',
			'<a>Link</a>',
			['toBeVisible', 'toBeInTheDocument', ['toHaveTextContent', 'Link']],
		],
		[
			'Complex assertion with multiple args',
			'<input data-testid="complex" value="Test">',
			['toBeVisible', 'toBeInTheDocument', ['toHaveValue', 'Test'], 'toBeEnabled'],
		],
	])('%s %s', (_, html, expectedAssertions) => {
		document.body.innerHTML = html;
		const element = document.body.firstElementChild as HTMLElement;
		const applicableAssertions = getApplicableAssertions(element);

		// Convert applicableAssertions to format matching expectedAssertions
		const normalizedAssertions = applicableAssertions.map((a) => {
			if (a.args.length > 0) {
				return [a.assertionType, ...a.args];
			}
			return a.assertionType;
		});

		expect(normalizedAssertions).toEqual(expectedAssertions);
	});
});
