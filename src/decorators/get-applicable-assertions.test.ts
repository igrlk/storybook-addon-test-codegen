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
				'toBeEnabled',
				['toHaveTextContent', 'Click me'],
			],
		],
		[
			'Disabled button',
			'<button disabled>Click me</button>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveTextContent', 'Click me'],
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
				'toBeEnabled',
				['toHaveValue', 'Hello'],
			],
		],
		[
			'Input without value',
			'<input>',
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled', ['toHaveValue', '']],
		],
		[
			'Disabled input with value',
			'<input value="Hello" disabled>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveValue', 'Hello'],
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
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled', ['toHaveValue', 42]],
		],
		[
			'Textarea with content',
			'<textarea>Hello world</textarea>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', 'Hello world'],
				['toHaveTextContent', 'Hello world'],
			],
		],
		[
			'Textarea without content',
			'<textarea />',
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled', ['toHaveValue', '']],
		],
		[
			'Disabled textarea',
			'<textarea disabled>Hello world</textarea>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveValue', 'Hello world'],
				['toHaveTextContent', 'Hello world'],
			],
		],
		[
			'Single select',
			'<select><option value="1">One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', '2'],
				['toHaveTextContent', 'OneTwo'],
			],
		],
		[
			'Single select without selection',
			'<select><option value="1">One</option><option value="2">Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', '1'],
				['toHaveTextContent', 'OneTwo'],
			],
		],
		[
			'Disabled single select',
			'<select disabled><option value="1">One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveValue', '2'],
				['toHaveTextContent', 'OneTwo'],
			],
		],
		[
			'Multiple select',
			'<select multiple><option value="1" selected>One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', ['1', '2']],
				['toHaveTextContent', 'OneTwo'],
			],
		],
		[
			'Disabled multiple select',
			'<select multiple disabled><option value="1" selected>One</option><option value="2" selected>Two</option></select>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveValue', ['1', '2']],
				['toHaveTextContent', 'OneTwo'],
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
			['toBeVisible', 'toBeInTheDocument', 'toBeDisabled'], // Keep original
		],
		[
			'Button in disabled fieldset',
			'<fieldset disabled><button>Submit</button></fieldset>',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeDisabled',
				['toHaveTextContent', 'Submit'],
			],
		],
		[
			'Password input',
			'<input type="password" value="secret">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', 'secret'],
			],
		],
		[
			'Email input',
			'<input type="email" value="test@example.com">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', 'test@example.com'],
			],
		],
		[
			'Date input',
			'<input type="date" value="2023-03-20">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', '2023-03-20'],
			],
		],
		[
			'Range input',
			'<input type="range" min="0" max="100" value="50">',
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled', ['toHaveValue', '50']],
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
				'toBeEnabled',
				['toHaveTextContent', ' '],
			],
		],
		[
			'Submit input',
			'<input type="submit" value="Submit">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', 'Submit'],
			],
		],
		[
			'Button input',
			'<input type="button" value="Click me">',
			[
				'toBeVisible',
				'toBeInTheDocument',
				'toBeEnabled',
				['toHaveValue', 'Click me'],
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
			['toBeVisible', 'toBeInTheDocument', 'toBeEnabled', ['toHaveValue', 'Test']],
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
