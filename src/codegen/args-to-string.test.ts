import { describe, expect, it } from 'vitest';
import { argsToString, wrapInQuotes } from './args-to-string';

describe('wrapInQuotes', () => {
	it.each([
		['hello', "'hello'"],
		['hello\nworld', '`hello\nworld`'],
		["don't", "'don\\'t'"],
		['code `const x = 1`', "'code `const x = 1`'"],
		['multiline\nwith `backticks`', '`multiline\nwith \\`backticks\\``'],
		["multiline\nwith 'quotes'", "`multiline\nwith 'quotes'`"],
	])('wrapInQuotes(%p) -> %p', (input, expected) => {
		expect(wrapInQuotes(input)).toBe(expected);
	});
});

describe('argsToString', () => {
	it.each([
		// Simple strings
		[['hello'], "'hello'"],
		[['hello\nworld'], '`hello\nworld`'],

		// Strings with quotes
		[["don't do this"], "'don\\'t do this'"],
		[['he said "hello"'], '\'he said "hello"\''],
		[['code is `const x = 1`'], "'code is `const x = 1`'"],
		[['multiline\nwith `backticks`'], '`multiline\nwith \\`backticks\\``'],

		// Objects with string values
		[[{ name: 'John' }], "{ name: 'John' }"],
		[[{ text: 'hello\nworld' }], '{ text: `hello\nworld` }'],
		[[{ quote: 'don\'t "do" this' }], "{ quote: 'don\\'t \"do\" this' }"],
		[
			[{ code: 'has `backticks`\nin multi line' }],
			'{ code: `has \\`backticks\\`\nin multi line` }',
		],

		// Multiple arguments
		[['hello', 123, { exact: true }], "'hello', 123, { exact: true }"],

		// Complex nested objects
		[
			[
				'button',
				{
					name: 'Click me',
					options: { case: 'sensitive', text: 'multi\nline' },
				},
			],
			"'button', { name: 'Click me', options: { case: 'sensitive', text: `multi\nline` } }",
		],

		// Arrays, null and undefined
		[
			[[1, 2, 'three', "don't", 'has `backticks`']],
			"[1, 2, 'three', 'don\\'t', 'has `backticks`']",
		],
		[[null, undefined], 'null, undefined'],
	])('argsToString(%p) -> %p', (input, expected) => {
		expect(argsToString(input)).toBe(expected);
	});
});
