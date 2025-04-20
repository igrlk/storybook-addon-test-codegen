import { describe, expect, test } from 'vitest';
import type { Interaction } from '../state';
import {
	type GeneratedCodeLine,
	type Warning,
	convertInteractionsToCode,
	tab,
} from './interactions-to-code';

const withImports = (imports: string[]) => [
	{
		text: `import { ${imports.join(', ')} } from '@storybook/test';`,
	},
];

const withPlay = (
	codeLines: (string | { text: string; warning?: Warning })[],
) => [
	{ text: 'play: async ({ canvasElement }) => {' },
	...codeLines.map((line) =>
		typeof line === 'string'
			? { text: tab(line) }
			: { text: tab(line.text), warning: line.warning },
	),
	{ text: '}' },
];

const withBody = (
	codeLines: (string | { text: string; warning?: Warning })[],
) => withPlay(['const body = canvasElement.ownerDocument.body;', ...codeLines]);

const withCanvas = (
	codeLines: (string | { text: string; warning?: Warning })[],
) =>
	withPlay([
		'const canvas = within(canvasElement.ownerDocument.body);',
		...codeLines,
	]);

const withBodyCanvas = (
	codeLines: (string | { text: string; warning?: Warning })[],
) =>
	withPlay([
		'const body = canvasElement.ownerDocument.body;',
		'const canvas = within(body);',
		...codeLines,
	]);

const TEST_CASES = [
	[
		'Click',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'click' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				{
					text: `await userEvent.click(await canvas.findByRole('button'));`,
					warning: 'ROLE_WITHOUT_NAME',
				},
			]),
		],
	],
	[
		'Double click',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'getByText',
					args: ['Submit'],
				},
				event: { type: 'dblclick' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([`await userEvent.dblClick(await canvas.getByText('Submit'));`]),
		],
	],
	[
		'Type',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByPlaceholderText',
					args: ['Enter your name'],
				},
				event: { type: 'type', value: 'John Doe' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				`await userEvent.type(await canvas.findByPlaceholderText('Enter your name'), 'John Doe');`,
			]),
		],
	],
	[
		'Type multiline',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByPlaceholderText',
					args: ['Enter your name'],
				},
				event: { type: 'type', value: 'hello\nworld' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				`await userEvent.type(await canvas.findByPlaceholderText('Enter your name'), \`hello
world\`);`,
			]),
		],
	],
	[
		'Type empty string calls clear',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByPlaceholderText',
					args: ['Enter your name'],
				},
				event: { type: 'type', value: '' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				`await userEvent.clear(await canvas.findByPlaceholderText('Enter your name'));`,
			]),
		],
	],
	[
		'Keydown',
		[
			{
				elementQuery: {
					object: 'body',
					method: 'querySelector',
					args: ['#input-field'],
				},
				event: { type: 'keydown', key: '{enter}' },
			},
		],
		[
			withImports(['userEvent']),
			withPlay([`await userEvent.keyboard('{enter}');`]),
		],
	],
	[
		'Select',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByLabelText',
					args: ['Choose your options'],
				},
				event: { type: 'select', options: ['Option1', 'Option2'] },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				`await userEvent.selectOptions(await canvas.findByLabelText('Choose your options'), ['Option1', 'Option2']);`,
			]),
		],
	],
	[
		'Upload',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByTestId',
					args: ['file-upload'],
				},
				event: { type: 'upload', files: ['file1.txt', 'file2.png'] },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				{
					text: `await userEvent.upload(await canvas.findByTestId('file-upload'), [new File(['file1.txt'], 'file1.txt'), new File(['file2.png'], 'file2.png')]);`,
					warning: 'TEST_ID',
				},
			]),
		],
	],
	[
		'Multiple interactions',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'click' },
			},
			{
				elementQuery: {
					object: 'body',
					method: 'querySelector',
					args: ['#input-field'],
				},
				event: {
					type: 'type',
					value: 'Sample Text with quotes and backslash \' " ` \\',
				},
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['input', { name: 'Description' }],
				},
				event: {
					type: 'type',
					value: `Multiline
with quotes and backslash \\\\
'single'
"double"
\`backticks\`
`,
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withBodyCanvas([
				{
					text: `await userEvent.click(await canvas.findByRole('button'));`,
					warning: 'ROLE_WITHOUT_NAME',
				},
				{
					text: `await waitFor(() => expect(body.querySelector('#input-field')).toBeInTheDocument());`,
					warning: 'QUERY_SELECTOR',
				},
				{
					text:
						"await userEvent.type(body.querySelector('#input-field') as HTMLElement, 'Sample Text with quotes and backslash \\' \" ` \\\\');",
					warning: 'QUERY_SELECTOR',
				},
				{
					text: `await userEvent.type(await canvas.findByRole('input', { name: 'Description' }), \`Multiline
with quotes and backslash \\\\\\\\
'single'
"double"
\\\`backticks\\\`
\`);`,
				},
			]),
		],
	],
	[
		'Tab',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'focus', shift: false },
			},
		],
		[withImports(['userEvent']), withPlay(['await userEvent.tab();'])],
	],
	[
		'Tab shift',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'focus', shift: true },
			},
		],
		[
			withImports(['userEvent']),
			withPlay(['await userEvent.tab({ shift: true });']),
		],
	],
	[
		'Some events are ignored',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'keydown', key: 'shift' },
			},
		],
		[[], []],
	],
	[
		'findAll*',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findAllByRole',
					args: ['button'],
					nth: 0,
				},
				event: { type: 'click' },
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findAllByRole',
					args: ['textarea'],
					nth: 1,
				},
				event: { type: 'type', value: 'test' },
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findAllByText',
					args: ['hello world', { exact: false, collapseWhitespace: false }],
					nth: 1,
				},
				event: { type: 'click' },
			},
		],
		[
			withImports(['userEvent', 'within']),
			withCanvas([
				{
					text: `await userEvent.click((await canvas.findAllByRole('button'))[0]);`,
					warning: 'ROLE_WITHOUT_NAME',
				},
				{
					text: `await userEvent.type((await canvas.findAllByRole('textarea'))[1], 'test');`,
					warning: 'ROLE_WITHOUT_NAME',
				},
				`await userEvent.click((await canvas.findAllByText('hello world', { exact: false, collapseWhitespace: false }))[1]);`,
			]),
		],
	],
	[
		'Query selector and find',
		[
			{
				elementQuery: {
					object: 'body',
					method: 'querySelector',
					args: ['input'],
				},
				event: { type: 'click' },
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'click' },
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withBodyCanvas([
				{
					text: `await waitFor(() => expect(body.querySelector('input')).toBeInTheDocument());`,
					warning: 'QUERY_SELECTOR',
				},
				{
					text: `await userEvent.click(body.querySelector('input') as HTMLElement);`,
					warning: 'QUERY_SELECTOR',
				},
				{
					text: `await userEvent.click(await canvas.findByRole('button'));`,
					warning: 'ROLE_WITHOUT_NAME',
				},
			]),
		],
	],
	[
		'Query selector',
		[
			{
				elementQuery: {
					object: 'body',
					method: 'querySelector',
					args: ['input'],
				},
				event: { type: 'click' },
			},
		],
		[
			withImports(['userEvent', 'waitFor', 'expect']),
			withBody([
				{
					text: `await waitFor(() => expect(body.querySelector('input')).toBeInTheDocument());`,
					warning: 'QUERY_SELECTOR',
				},
				{
					text: `await userEvent.click(body.querySelector('input') as HTMLElement);`,
					warning: 'QUERY_SELECTOR',
				},
			]),
		],
	],
	[
		'Assertion with toBeInTheDocument',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button'],
				},
				event: { type: 'assertion', assertionType: 'toBeInTheDocument', args: [] },
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				{
					text: `await waitFor(() => expect(canvas.queryByRole('button')).toBeInTheDocument())`,
					warning: 'ROLE_WITHOUT_NAME',
				},
			]),
		],
	],
	[
		'Assertion with toHaveValue',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByTestId',
					args: ['email-input'],
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveValue',
					args: ['test@example.com'],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				{
					text: `await waitFor(() => expect(canvas.queryByTestId('email-input')).toHaveValue('test@example.com'))`,
					warning: 'TEST_ID',
				},
			]),
		],
	],
	[
		'Assertion with toHaveText',
		[
			{
				elementQuery: {
					object: 'body',
					method: 'querySelector',
					args: ['.error-message'],
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveTextContent',
					args: ['Invalid email'],
				},
			},
		],
		[
			withImports(['userEvent', 'waitFor', 'expect']),
			withBody([
				{
					text: `await waitFor(() => expect(body.querySelector('.error-message')).toHaveTextContent('Invalid email'))`,
					warning: 'QUERY_SELECTOR',
				},
			]),
		],
	],
	[
		'Assertion without arguments',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button', { name: 'Submit' }],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toBeEnabled',
					args: [],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				`await waitFor(() => expect(canvas.queryByRole('button', { name: 'Submit' })).toBeEnabled())`,
			]),
		],
	],
	[
		'Assertion with string argument',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByLabelText',
					args: ['Name'],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveValue',
					args: ['John Doe'],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				`await waitFor(() => expect(canvas.queryByLabelText('Name')).toHaveValue('John Doe'))`,
			]),
		],
	],
	[
		'Assertion with numeric argument',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByLabelText',
					args: ['Age'],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveValue',
					args: [25],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				`await waitFor(() => expect(canvas.queryByLabelText('Age')).toHaveValue(25))`,
			]),
		],
	],
	[
		'Multiple assertion arguments',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByTestId',
					args: ['price-display'],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveTextContent',
					args: ['$99.99', { exact: false }],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				{
					text: `await waitFor(() => expect(canvas.queryByTestId('price-display')).toHaveTextContent('$99.99', { exact: false }))`,
					warning: 'TEST_ID',
				},
			]),
		],
	],
	[
		'Multiple assertions in one test',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['checkbox', { name: 'Accept terms' }],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toBeVisible',
					args: [],
				},
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['checkbox', { name: 'Accept terms' }],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'not.toBeChecked',
					args: [],
				},
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button', { name: 'Submit' }],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toBeDisabled',
					args: [],
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				`await waitFor(() => expect(canvas.queryByRole('checkbox', { name: 'Accept terms' })).toBeVisible())`,
				`await waitFor(() => expect(canvas.queryByRole('checkbox', { name: 'Accept terms' })).not.toBeChecked())`,
				`await waitFor(() => expect(canvas.queryByRole('button', { name: 'Submit' })).toBeDisabled())`,
			]),
		],
	],
	[
		'Combining interactions and assertions',
		[
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByLabelText',
					args: ['Name'],
					nth: null,
				},
				event: {
					type: 'type',
					value: 'John Doe',
				},
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByLabelText',
					args: ['Name'],
					nth: null,
				},
				event: {
					type: 'assertion',
					assertionType: 'toHaveValue',
					args: ['John Doe'],
				},
			},
			{
				elementQuery: {
					object: 'canvas',
					method: 'findByRole',
					args: ['button', { name: 'Submit' }],
					nth: null,
				},
				event: {
					type: 'click',
				},
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withCanvas([
				`await userEvent.type(await canvas.findByLabelText('Name'), 'John Doe');`,
				`await waitFor(() => expect(canvas.queryByLabelText('Name')).toHaveValue('John Doe'))`,
				`await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));`,
			]),
		],
	],
] satisfies [
	string,
	{
		elementQuery: Pick<
			Interaction['elementQuery'],
			'object' | 'method' | 'args'
		> & {
			nth?: Interaction['elementQuery']['nth'];
		};
		event: Interaction['event'];
	}[],
	[GeneratedCodeLine[], GeneratedCodeLine[]],
][];

describe('convertInteractionsToCode', () => {
	test.each(TEST_CASES)('%s', (_, interactions, [imports, play]) => {
		expect(
			convertInteractionsToCode(
				interactions.map((interaction) => ({
					elementQuery: {
						...interaction.elementQuery,
						nth: ('nth' in interaction.elementQuery
							? interaction.elementQuery.nth
							: null) as number | null,
					},
					event: interaction.event,
				})),
				true,
			),
		).toEqual({ imports, play });
	});

	test("doesn't generate 'as HTMLElement' without typescript", () => {
		const result = convertInteractionsToCode(
			[
				{
					elementQuery: {
						object: 'body',
						method: 'querySelector',
						args: ['input'],
						nth: null,
					},
					event: { type: 'click' },
				},
			],
			false,
		);
		// Check that one of the lines contains the expected text (without as HTMLElement)
		expect(
			result.play.some(
				(line) =>
					line.text === tab(`await userEvent.click(body.querySelector('input'));`),
			),
		).toBe(true);
	});
});
