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
			),
		).toEqual({ imports, play });
	});
});
