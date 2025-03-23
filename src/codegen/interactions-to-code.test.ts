import { describe, expect, test } from 'vitest';
import type { Interaction } from '../state';
import { convertInteractionsToCode, tab } from './interactions-to-code';

const withImports = (imports: string[]) => [
	`import { ${imports.join(', ')} } from '@storybook/test';`,
];

const withPlay = (codeLines: string[]) => [
	'play: async ({ canvasElement }) => {',
	...codeLines.map(tab),
	'}',
];

const withBody = (codeLines: string[]) =>
	withPlay(['const body = canvasElement.ownerDocument.body;', ...codeLines]);

const withCanvas = (codeLines: string[]) =>
	withPlay([
		'const canvas = within(canvasElement.ownerDocument.body);',
		...codeLines,
	]);

const withBodyCanvas = (codeLines: string[]) =>
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
			withCanvas([`await userEvent.click(await canvas.findByRole('button'));`]),
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
				`await userEvent.upload(await canvas.findByTestId('file-upload'), [new File(['file1.txt'], 'file1.txt'), new File(['file2.png'], 'file2.png')]);`,
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
				event: { type: 'type', value: 'Sample Text with quotes \'"`' },
			},
		],
		[
			withImports(['userEvent', 'within', 'waitFor', 'expect']),
			withBodyCanvas([
				`await userEvent.click(await canvas.findByRole('button'));`,
				`await waitFor(() => expect(body.querySelector('#input-field')).toBeInTheDocument());`,
				`await userEvent.type(body.querySelector('#input-field') as HTMLElement, 'Sample Text with quotes \\'"\`');`,
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
				`await userEvent.click((await canvas.findAllByRole('button'))[0]);`,
				`await userEvent.type((await canvas.findAllByRole('textarea'))[1], 'test');`,
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
				`await waitFor(() => expect(body.querySelector('input')).toBeInTheDocument());`,
				`await userEvent.click(body.querySelector('input') as HTMLElement);`,
				`await userEvent.click(await canvas.findByRole('button'));`,
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
				`await waitFor(() => expect(body.querySelector('input')).toBeInTheDocument());`,
				`await userEvent.click(body.querySelector('input') as HTMLElement);`,
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
				`await waitFor(() => expect(canvas.queryByRole('button')).toBeInTheDocument())`,
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
				`await waitFor(() => expect(canvas.queryByTestId('email-input')).toHaveValue('test@example.com'))`,
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
				`await waitFor(() => expect(body.querySelector('.error-message')).toHaveTextContent('Invalid email'))`,
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
				`await waitFor(() => expect(canvas.queryByTestId('price-display')).toHaveTextContent('$99.99', { exact: false }))`,
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
	[string[], string[]],
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
		expect(
			convertInteractionsToCode(
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
			),
		).toMatchObject({
			play: expect.arrayContaining([
				tab(`await userEvent.click(body.querySelector('input'));`),
			]),
		});
	});
});
