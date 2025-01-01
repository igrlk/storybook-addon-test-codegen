import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { generateQuery } from './generate-query';

const TEST_CASES = {
	Role: [
		[
			`<label for="name">Name</label>
			<input id='name'  />`,
			{ selector: 'input' },
			{ method: 'findByRole', args: ['textbox', { name: 'Name' }] },
		],
		[
			`<input id='name' />`,
			{ selector: 'input' },
			{ method: 'findByRole', args: ['textbox'] },
		],
		[
			`<label for="name">Name</label>
			<input id='name'  />
			<input />`,
			{ selector: 'input', nth: 1 },
			{ method: 'findAllByRole', args: ['textbox'], nth: 1 },
		],
		[
			`<label for="name">Name</label>
			<input id='name'  />
			<input />
			<label for="password">Password</label>
			<input id='password' />`,
			{ selector: 'input', nth: 1 },
			{ method: 'findAllByRole', args: ['textbox'], nth: 1 },
		],
		[
			`<label for="name">Name</label>
			<input id='name'  />
			<input />
			<label for="password">Password</label>
			<input id='password' />`,
			{ selector: 'input', nth: 2 },
			{ method: 'findByRole', args: ['textbox', { name: 'Password' }] },
		],
		[
			'<button>Click me</button>',
			{ selector: 'button' },
			{ method: 'findByRole', args: ['button', { name: 'Click me' }] },
		],
		[
			'<button />',
			{ selector: 'button' },
			{ method: 'findByRole', args: ['button'] },
		],
		[
			'<button /><button />',
			{ selector: 'button', nth: 0 },
			{ method: 'findAllByRole', args: ['button'], nth: 0 },
		],
		[
			'<button /><button />',
			{ selector: 'button', nth: 1 },
			{ method: 'findAllByRole', args: ['button'], nth: 1 },
		],
		[
			'<button /><button>Click me</button>',
			{ selector: 'button', nth: 0 },
			{ method: 'findAllByRole', args: ['button'], nth: 0 },
		],
		[
			'<button /><button>Click me</button>',
			{ selector: 'button', nth: 1 },
			{ method: 'findByRole', args: ['button', { name: 'Click me' }] },
		],
		['<img />', { selector: 'img' }, { method: 'findByRole', args: ['img'] }],
		[
			`<img alt='test-alt-text' />`,
			{ selector: 'img' },
			{ method: 'findByRole', args: ['img', { name: 'test-alt-text' }] },
		],
	],
	Label: [
		[
			`<div aria-label='test-label' />`,
			{ selector: 'div' },
			{ method: 'findByLabelText', args: ['test-label', { exact: true }] },
		],
		[
			`<div /><div aria-label='test-label' /><div />`,
			{ selector: 'div', nth: 1 },
			{ method: 'findByLabelText', args: ['test-label', { exact: true }] },
		],
		[
			`<div id='label'>test-label</div><div aria-labelledby='label' />`,
			{ selector: 'div', nth: 1 },
			{ method: 'findByLabelText', args: ['test-label', { exact: true }] },
		],
	],
	Placeholder: [
		[
			`<input placeholder='test-placeholder' />`,
			{ selector: 'input' },
			{
				method: 'findByPlaceholderText',
				args: ['test-placeholder', { exact: true }],
			},
		],
		[
			`<input /><input placeholder='test-placeholder' /><input />`,
			{ selector: 'input', nth: 1 },
			{
				method: 'findByPlaceholderText',
				args: ['test-placeholder', { exact: true }],
			},
		],
	],
	'Exact text': [
		[
			'<div>test-text</div>',
			{ selector: 'div' },
			{ method: 'findByText', args: ['test-text', { exact: true }] },
		],
		[
			'<div></div><div>test-text</div>',
			{ selector: 'div', nth: 1 },
			{ method: 'findByText', args: ['test-text', { exact: true }] },
		],
		[
			`<div>test
multiline</div>`,
			{ selector: 'div' },
			{
				method: 'findByText',
				args: ['test\nmultiline', { exact: false, collapseWhitespace: false }],
			},
		],
	],
	'Partial text': [
		[
			`<div>${new Array(100).fill('a').join('')}</div>`,
			{ selector: 'div' },
			{
				method: 'findByText',
				args: [new Array(80).fill('a').join(''), { exact: false }],
			},
		],
		[
			`<div>${new Array(120).fill('a').join('')}</div><div>${new Array(100).fill('a').join('')}</div>`,
			{ selector: 'div', nth: 0 },
			{
				method: 'findAllByText',
				args: [new Array(80).fill('a').join(''), { exact: false }],
				nth: 0,
			},
		],
		[
			`<div>${new Array(120).fill('a').join('')}</div><div>${new Array(100).fill('a').join('')}</div>`,
			{ selector: 'div', nth: 1 },
			{
				method: 'findAllByText',
				args: [new Array(80).fill('a').join(''), { exact: false }],
				nth: 1,
			},
		],
		[
			`<div>${new Array(120).fill('a').join('')}</div><div>test
multiline${new Array(100).fill('a').join('')}</div>`,
			{ selector: 'div', nth: 1 },
			{
				method: 'findByText',
				args: [
					`test\nmultiline${new Array(80 - 'test\nmultiline'.length).fill('a').join('')}`,
					{ exact: false, collapseWhitespace: false },
				],
			},
		],
	],
	Title: [
		[
			`<div title='test-title' />`,
			{ selector: 'div' },
			{ method: 'findByTitle', args: ['test-title', { exact: true }] },
		],
		[
			`<div /><div title='test-title' /><div />`,
			{ selector: 'div', nth: 1 },
			{ method: 'findByTitle', args: ['test-title', { exact: true }] },
		],
		[
			`<div title='test-title' /><div title='test-title' />`,
			{ selector: 'div', nth: 0 },
			{ method: 'findAllByTitle', args: ['test-title', { exact: true }], nth: 0 },
		],
	],
	'Test id': [
		[
			`<div data-testid='test-id' />`,
			{ selector: 'div' },
			{ method: 'findByTestId', args: ['test-id'] },
		],
		[
			`<div /><div data-testid='test-id' /><div />`,
			{ selector: 'div', nth: 1 },
			{ method: 'findByTestId', args: ['test-id'] },
		],
		[
			`<div data-testid='test-id' /><div data-testid='test-id' />`,
			{ selector: 'div', nth: 0 },
			{ method: 'findAllByTestId', args: ['test-id'], nth: 0 },
		],
	],
	CSS: [
		[
			'<div><input /></div>',
			{ selector: 'div' },
			{ isCanvasElement: true, method: 'querySelector', args: ['div'] },
		],
		[
			'<div><div><div></div></div></div>',
			{ selector: 'div', nth: 2 },
			{
				isCanvasElement: true,
				method: 'querySelector',
				args: ['div > div > div'],
			},
		],
		[
			'<div><div><div id="test-div"></div></div></div>',
			{ selector: '#test-div' },
			{ isCanvasElement: true, method: 'querySelector', args: ['#test-div'] },
		],
		[
			'<div><div><div class="test-div"></div></div></div>',
			{ selector: '.test-div' },
			{ isCanvasElement: true, method: 'querySelector', args: ['.test-div'] },
		],
		[
			'<div><div><div class="test-div"></div><div class="test-div"></div></div></div>',
			{ selector: '.test-div', nth: 1 },
			{
				isCanvasElement: true,
				method: 'querySelector',
				args: ['div:nth-of-type(2)'],
			},
		],
		[
			`<div />
				<div class="test-div">
					<div class="test-div-2">
						<span class="test-span"></span>
						<span class="test-span"></span>
					</div>

					<div class="test-div-2">
						<span class="test-span"></span>
						<span class="test-span"></span>
					</div>
				</div>`,
			{ selector: '.test-span', nth: 1 },
			{
				isCanvasElement: true,
				method: 'querySelector',
				args: ['div:nth-of-type(1) > span:nth-of-type(2)'],
			},
		],
		[
			`<div />
				<div class="test-div">
					<div class="test-div-2">
						<span class="test-span"></span>
						<span class="test-span"></span>
					</div>

					<div class="test-div-2">
						<span class="test-span"></span>
						<span class="test-span target"></span>
					</div>
				</div>`,
			{ selector: '.target' },
			{ isCanvasElement: true, method: 'querySelector', args: ['.target'] },
		],
	],
	'Finds closest interactive element': [
		[
			'<button><span>Click me</span></button>',
			{ selector: 'span' },
			{ method: 'findByRole', args: ['button', { name: 'Click me' }] },
		],
		[
			'<a href="/"><span>Click me</span></a>',
			{ selector: 'span' },
			{ method: 'findByRole', args: ['link', { name: 'Click me' }] },
		],
	],
	'Various cases': [
		[
			`<div>
			  <label for="email">Email Address</label>
			  <input type="email" name="email" id="email" placeholder="Enter your email" />
			</div>`,
			{ selector: 'input' },
			{ method: 'findByRole', args: ['textbox', { name: 'Email Address' }] },
		],
		[
			`<div>
			  <label for="email">Email Address</label>
			  <input type="email" name="email" id="email" placeholder="Enter your email" />
			</div>`,
			{ selector: 'label' },
			{ method: 'findByText', args: ['Email Address', { exact: true }] },
		],
		[
			`<div>
	  <label for="email">Email Address</label>
	  <input type="email" name="email" id="email" placeholder="Enter your email" />
	</div>`,
			{ selector: 'div' },
			{ isCanvasElement: true, method: 'querySelector', args: ['div'] },
		],
	],
} satisfies Record<
	string,
	[
		string,
		{ selector: string; nth?: number },
		{
			isCanvasElement?: true;
			method: string;
			args: unknown[];
			nth?: number;
		},
	][]
>;

describe('generateQuery', () => {
	describe.each(Object.entries(TEST_CASES))('%s', (_, testCases) => {
		test.each(testCases)('%p, %p -> %p', async (html, target, expected) => {
			const {
				window: { document },
			} = new JSDOM(html);

			const isCanvasElement =
				'isCanvasElement' in expected && expected.isCanvasElement;

			expect(
				await generateQuery(
					document.body,
					document.querySelectorAll(target.selector)[
						('nth' in target ? target.nth : 0) as number
					] as HTMLElement,
					'data-testid',
				),
			).toEqual({
				object: isCanvasElement ? 'body' : 'canvas',
				method: expected.method,
				args: expected.args,
				nth: 'nth' in expected ? expected.nth : null,
			});
		});
	});
});
