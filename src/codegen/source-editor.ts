// Text edits on a story file's source. The file is parsed with this package's own Babel parser,
// as Storybook 10 and 11 expose different ASTs from `storybook/internal/csf-tools`. Code that an
// edit does not touch stays as written.

import { parse } from '@babel/parser';

// A Babel AST node, walked generically.
export type Node = {
	type: string;
	start: number;
	end: number;
	// biome-ignore lint/suspicious/noExplicitAny:
	[key: string]: any;
};

type Comment = { start: number; end: number; value: string };

// A comment about the line below it.
const NEXT_LINE_COMMENT =
	/@ts-expect-error|@ts-ignore|(?:eslint|oxlint)-disable-next-line|prettier-ignore|biome-ignore/;

type Edit = { start: number; end: number; text: string };

type Plugins = ['typescript'] | ['typescript', 'jsx'] | ['flow', 'jsx'];

// TypeScript, with JSX first unless the file is a `.ts` file. A file starting with an `@flow`
// comment is parsed as Flow, as Storybook 10 does.
const parseCode = (code: string, fileName?: string) => {
	const preferJsx = !fileName || !/\.[cm]?ts$/.test(fileName);
	const attempts: Plugins[] = /^\s*(?:\/\/|\/\*+)\s*@flow\b/.test(code)
		? [['flow', 'jsx']]
		: preferJsx
			? [['typescript', 'jsx'], ['typescript']]
			: [['typescript'], ['typescript', 'jsx']];
	let error: unknown;
	for (const plugins of attempts) {
		try {
			return parse(code, {
				sourceType: 'module',
				plugins: [...plugins, 'decorators-legacy'],
				errorRecovery: false,
			});
		} catch (caught) {
			// The first attempt's error is the one about the file's own syntax.
			error ??= caught;
		}
	}
	throw error;
};

const isNode = (value: unknown): value is Node =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as Node).type === 'string' &&
	typeof (value as Node).start === 'number';

const SKIPPED_KEYS = new Set([
	'loc',
	'extra',
	'leadingComments',
	'trailingComments',
	'innerComments',
]);

/** Visit `node` and its descendants in source order. Return `false` to skip a node's children. */
export const walk = (
	node: Node,
	enter: (node: Node, parent: Node | null) => boolean | undefined,
	parent: Node | null = null,
) => {
	if (enter(node, parent) === false) {
		return;
	}
	for (const [key, value] of Object.entries(node)) {
		if (SKIPPED_KEYS.has(key)) {
			continue;
		}
		if (Array.isArray(value)) {
			for (const child of value) {
				if (isNode(child)) {
					walk(child, enter, node);
				}
			}
		} else if (isNode(value)) {
			walk(value, enter, node);
		}
	}
};

/** The name of a property's key when it is written statically, as `name`, `'name'` or `1`. */
export const staticKey = (property: Node): string | undefined => {
	if (property.type !== 'ObjectProperty' && property.type !== 'ObjectMethod') {
		return undefined;
	}
	const { key } = property;
	if (key.type === 'StringLiteral') {
		return key.value;
	}
	if (key.type === 'NumericLiteral') {
		return String(key.value);
	}
	if (key.type === 'Identifier' && !property.computed) {
		return key.name;
	}
	return undefined;
};

/** Leading whitespace of the line that `index` is on. */
export const lineIndent = (code: string, index: number) =>
	/^[ \t]*/.exec(code.slice(code.lastIndexOf('\n', index - 1) + 1))?.[0] ?? '';

/** Indent the lines after the first one of `text`. */
export const reindent = (text: string, indent: string) =>
	text
		.split('\n')
		.map((line, index) =>
			index === 0 || line === '' ? line : `${indent}${line}`,
		)
		.join('\n');

/**
 * A story file's source with pending edits. `commit()` applies them and parses the result again,
 * so nodes read before a commit must not be edited after it.
 */
export class SourceEditor {
	code = '';

	program: Node = { type: 'Program', start: 0, end: 0 };

	comments: Comment[] = [];

	edits: Edit[] = [];

	readonly fileName: string | undefined;

	// A file whose first line ends in CRLF is written back with CRLF line endings.
	readonly crlf: boolean;

	// The quote and indent step of generated code: the ones of the file as it was read, or of the
	// file that a copy of a part of it was taken from.
	readonly style: { quote: "'" | '"'; indent: string };

	constructor(
		source: string,
		fileName?: string,
		style?: { quote: "'" | '"'; indent: string },
	) {
		this.fileName = fileName;
		this.crlf = /^[^\n]*\r\n/.test(source);
		this.load(source.replace(/\r\n?/g, '\n'));
		this.style = style ?? {
			quote: this.inferQuote(),
			indent: this.inferIndent(),
		};
	}

	get quote() {
		return this.style.quote;
	}

	get indent() {
		return this.style.indent;
	}

	private load(code: string) {
		const file = parseCode(code, this.fileName);
		this.code = code;
		this.program = file.program as unknown as Node;
		this.comments = (file.comments ?? []) as Comment[];
		this.edits = [];
	}

	source(node: { start: number; end: number }) {
		return this.code.slice(node.start, node.end);
	}

	replace(start: number, end: number, text: string) {
		this.edits.push({ start, end, text });
	}

	insert(index: number, text: string) {
		this.edits.push({ start: index, end: index, text });
	}

	/** Apply pending edits and parse the result again. */
	commit() {
		if (this.edits.length === 0) {
			return;
		}
		// Sorted by start; edits at the same position keep the order they were made in.
		const edits = this.edits
			.map((edit, order) => ({ ...edit, order }))
			.sort((a, b) => a.start - b.start || a.order - b.order);
		let result = '';
		let cursor = 0;
		for (const edit of edits) {
			if (edit.start < cursor) {
				throw new Error('Overlapping edits to the story file');
			}
			result += this.code.slice(cursor, edit.start) + edit.text;
			cursor = edit.end;
		}
		this.load(result + this.code.slice(cursor));
	}

	toString() {
		this.commit();
		return this.crlf ? this.code.replace(/\n/g, '\r\n') : this.code;
	}

	/** The quote most string literals of the file use; a tie goes to the first one. */
	private inferQuote(): "'" | '"' {
		const counts = { "'": 0, '"': 0 };
		let first: "'" | '"' | undefined;
		walk(this.program, (node, parent) => {
			if (node.type === 'StringLiteral' && parent?.type !== 'JSXAttribute') {
				const quote = this.code[node.start];
				if (quote === "'" || quote === '"') {
					counts[quote]++;
					first ??= quote;
				}
			}
			return undefined;
		});
		if (counts["'"] === counts['"']) {
			return first ?? '"';
		}
		return counts["'"] > counts['"'] ? "'" : '"';
	}

	/** The indent step of the file's first multi-line block, two spaces without one. */
	private inferIndent(): string {
		let indent: string | undefined;
		walk(this.program, (node) => {
			if (indent !== undefined) {
				return false;
			}
			const first =
				node.type === 'ObjectExpression'
					? node.properties[0]
					: node.type === 'ArrayExpression'
						? node.elements[0]
						: node.type === 'BlockStatement'
							? node.body[0]
							: undefined;
			if (first && this.code.slice(node.start, first.start).includes('\n')) {
				const outer = lineIndent(this.code, node.start);
				const inner = lineIndent(this.code, first.start);
				if (inner.length > outer.length && inner.startsWith(outer)) {
					indent = inner.slice(outer.length);
				}
			}
			return undefined;
		});
		return indent ?? '  ';
	}

	// The index of the next code after `index`, past whitespace and comments.
	private tokenAfter(index: number) {
		let position = index;
		while (position < this.code.length) {
			const comment = this.comments.find(
				(candidate) => candidate.start === position,
			);
			if (comment) {
				position = comment.end;
			} else if (/\s/.test(this.code[position])) {
				position++;
			} else {
				break;
			}
		}
		return position;
	}

	/** The index of the comma after a list item, if it has one. */
	commaAfter(node: Node) {
		const next = this.tokenAfter(node.end);
		return this.code[next] === ',' ? next : undefined;
	}

	// The end of the line at `index` when only whitespace and comments follow on it.
	private lineEndAfterTrivia(index: number): number | undefined {
		const lineEnd = this.code.indexOf('\n', index);
		const end = lineEnd === -1 ? this.code.length : lineEnd;
		let position = index;
		while (position < end) {
			const comment = this.comments.find(
				(candidate) => candidate.start === position,
			);
			if (comment && comment.end <= end) {
				position = comment.end;
			} else if (/[ \t]/.test(this.code[position])) {
				position++;
			} else {
				return undefined;
			}
		}
		return end;
	}

	hasCommentsIn(node: Node) {
		return this.comments.some(
			(comment) => comment.start > node.start && comment.end < node.end,
		);
	}

	/** An object literal one member per line, without a trailing comma. */
	printObject(members: string[], outer = '') {
		if (members.length === 0) {
			return '{}';
		}
		const inner = `${outer}${this.indent}`;
		const lines = members.map((member) => `${inner}${reindent(member, inner)}`);
		return `{\n${lines.join(',\n')}\n${outer}}`;
	}

	/**
	 * Add members at the start or end of an object, following its layout. An object on one line is
	 * laid out one member per line when a new member spans lines.
	 */
	insertMembers(object: Node, texts: string[], position: 'start' | 'end') {
		const { code } = this;
		const { properties } = object;
		const multilineObject = this.source(object).includes('\n');
		const multilineTexts = texts.some((text) => text.includes('\n'));

		if (!multilineObject && multilineTexts && !this.hasCommentsIn(object)) {
			const existing = properties.map((property: Node) => this.source(property));
			const members =
				position === 'start' ? [...texts, ...existing] : [...existing, ...texts];
			this.replace(
				object.start,
				object.end,
				this.printObject(members, lineIndent(code, object.start)),
			);
			return;
		}

		if (properties.length === 0) {
			const inner = code.slice(object.start + 1, object.end - 1);
			if (!inner.trim() && !multilineTexts) {
				this.replace(object.start + 1, object.end - 1, ` ${texts.join(', ')} `);
				return;
			}
			// Only comments, or a multi-line text: the members go one per line after the comments.
			const outer = lineIndent(code, object.start);
			const indent = `${outer}${this.indent}`;
			const end = object.start + 1 + inner.trimEnd().length;
			const lines = texts.map((text) => `${indent}${reindent(text, indent)}`);
			this.replace(end, object.end - 1, `\n${lines.join(',\n')}\n${outer}`);
			return;
		}

		if (!multilineObject) {
			if (position === 'start') {
				this.insert(properties[0].start, `${texts.join(', ')}, `);
			} else {
				const last = properties.at(-1);
				const comma = this.commaAfter(last);
				this.insert(
					comma === undefined ? last.end : comma + 1,
					`${comma === undefined ? ',' : ''} ${texts.join(', ')}${comma === undefined ? '' : ','}`,
				);
			}
			return;
		}

		if (position === 'start') {
			const first = properties[0];
			const ownLine = !code
				.slice(code.lastIndexOf('\n', first.start - 1) + 1, first.start)
				.trim();
			const indent = ownLine
				? lineIndent(code, first.start)
				: `${lineIndent(code, object.start)}${this.indent}`;
			this.insert(
				object.start + 1,
				texts.map((text) => `\n${indent}${reindent(text, indent)},`).join(''),
			);
			return;
		}

		const last = properties.at(-1);
		const indent = lineIndent(code, last.start);
		const comma = this.commaAfter(last);
		if (comma === undefined) {
			this.insert(last.end, ',');
		}
		const after = comma === undefined ? last.end : comma + 1;
		const at = this.lineEndAfterTrivia(after) ?? after;
		const lines = texts.map((text) => `${indent}${reindent(text, indent)}`);
		this.insert(at, `\n${lines.join(',\n')}${comma === undefined ? '' : ','}`);
	}

	/** Remove members from an object with their commas and, when they have them, their lines. */
	removeMembers(object: Node, removed: Node[]) {
		const { code } = this;
		const properties: Node[] = object.properties;
		if (properties.every((property) => removed.includes(property))) {
			this.replace(object.start + 1, object.end - 1, '');
			return;
		}
		for (let first = 0; first < properties.length; first++) {
			if (!removed.includes(properties[first])) {
				continue;
			}
			let last = first;
			while (
				last + 1 < properties.length &&
				removed.includes(properties[last + 1])
			) {
				last++;
			}
			if (last === properties.length - 1) {
				// A trailing run: the comma of the member before it goes too, unless the run ends
				// with a trailing comma that can stay in its place. Lines of their own go whole, but
				// code after the run on its line stays, and so does the line break before the run.
				const keptComma = this.commaAfter(properties[first - 1]) as number;
				const runComma = this.commaAfter(properties[last]);
				const runStart = properties[first].start;
				const lineStart = code.lastIndexOf('\n', runStart - 1) + 1;
				const ownLine = !code.slice(lineStart, runStart).trim();
				const runEnd = runComma === undefined ? properties[last].end : runComma + 1;
				const lineEnd = this.lineEndAfterTrivia(runEnd);
				if (runComma === undefined) {
					this.replace(keptComma, keptComma + 1, '');
				}
				this.replace(
					ownLine ? lineStart : keptComma + 1,
					ownLine && lineEnd !== undefined ? lineEnd + 1 : runEnd,
					'',
				);
			} else {
				const lineStart = code.lastIndexOf('\n', properties[first].start - 1) + 1;
				const comma = this.commaAfter(properties[last]) as number;
				const lineEnd = this.lineEndAfterTrivia(comma + 1);
				if (
					lineEnd !== undefined &&
					!code.slice(lineStart, properties[first].start).trim()
				) {
					this.replace(lineStart, lineEnd + 1, '');
				} else {
					this.replace(properties[first].start, this.tokenAfter(comma + 1), '');
				}
			}
			first = last;
		}
	}

	/** Insert a statement before the first one, below the comments above it. */
	prependStatement(text: string) {
		const [first] = this.program.body;
		if (!first) {
			this.appendStatement(text);
			return;
		}
		// Above the comments right on the first statement that are about the line below them, such
		// as a `@ts-expect-error`, so they stay with it. Other comments, such as a file header or an
		// `@flow` pragma, stay above.
		let start = first.start;
		for (;;) {
			const comment = this.comments.findLast(
				(candidate) => candidate.end <= start,
			);
			const between = comment ? this.code.slice(comment.end, start) : '';
			if (
				!comment ||
				between.trim() ||
				between.split('\n').length > 2 ||
				!(
					NEXT_LINE_COMMENT.test(comment.value) ||
					this.code.startsWith('/**', comment.start)
				)
			) {
				break;
			}
			start = comment.start;
		}
		this.insert(start, `${text}\n`);
	}

	/** Insert a statement after the last one, a blank line apart when either spans lines. */
	appendStatement(text: string) {
		const last = this.program.body.at(-1);
		if (!last) {
			this.insert(
				this.code.length,
				`${this.code && !this.code.endsWith('\n') ? '\n' : ''}${text}\n`,
			);
			return;
		}
		const blankLine = text.includes('\n') || this.source(last).includes('\n');
		this.insert(
			this.lineEndAfterTrivia(last.end) ?? last.end,
			`\n${blankLine ? '\n' : ''}${text}`,
		);
	}
}
