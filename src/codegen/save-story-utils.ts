// Ported from Storybook's save-story utilities, except for "updatePlayInCsfFile" and
// "updateImportsInCsfFile". Every edit is a text edit of the story file's source, so code that an
// edit does not touch stays as written.

import { parse } from '@babel/parser';
import {
	type Node,
	SourceEditor,
	lineIndent,
	reindent,
	staticKey,
	walk,
} from './source-editor';

class SaveStoryError extends Error {}

/** Finds the story node again, as every commit parses the file again. */
type StoryLocator = () => Node | undefined;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const printString = (value: string, quote: string) => {
	const json = JSON.stringify(value);
	return quote === '"'
		? json
		: `'${json.slice(1, -1).replaceAll('\\"', '"').replaceAll("'", "\\'")}'`;
};

const printKey = (key: string, quote: string) =>
	IDENTIFIER.test(key) ? key : printString(key, quote);

/** Print an arg value as source in the story file's style. */
export function valueToSource(value: unknown, editor: SourceEditor): string {
	if (value === null) {
		return 'null';
	}
	switch (typeof value) {
		case 'function':
			// It's the source of a function, an expression.
			return value.toString();
		case 'number':
			return Object.is(value, -0) ? '-0' : String(value);
		case 'string':
			return printString(value, editor.quote);
		case 'boolean':
			return String(value);
		case 'undefined':
			return 'undefined';
		default:
			if (Array.isArray(value)) {
				return `[${value.map((item) => valueToSource(item, editor)).join(', ')}]`;
			}
			return editor.printObject(
				Object.entries(value as Record<string, unknown>)
					.filter(([, item]) => typeof item !== 'undefined')
					.map(
						([key, item]) =>
							`${printKey(key, editor.quote)}: ${valueToSource(item, editor)}`,
					),
			);
	}
}

/** The declaration of a story export: `export const Name = …`, or the local it re-exports. */
export const findStoryExport = (
	editor: SourceEditor,
	exportName: string,
): Node | undefined => {
	const declarationOf = (name: string) => {
		for (const statement of editor.program.body as Node[]) {
			const declaration =
				statement.type === 'ExportNamedDeclaration'
					? statement.declaration
					: statement;
			if (declaration?.type === 'VariableDeclaration') {
				const declarator = declaration.declarations.find(
					(candidate: Node) =>
						candidate.id.type === 'Identifier' && candidate.id.name === name,
				);
				if (declarator) {
					return declarator as Node;
				}
			}
			if (
				declaration?.type === 'FunctionDeclaration' &&
				declaration.id?.name === name
			) {
				return declaration as Node;
			}
		}
		return undefined;
	};

	for (const statement of editor.program.body as Node[]) {
		if (statement.type !== 'ExportNamedDeclaration' || statement.source) {
			continue;
		}
		if (statement.declaration) {
			const declared = declarationOf(exportName);
			if (
				declared &&
				declared.start >= statement.start &&
				declared.end <= statement.end
			) {
				return declared;
			}
		}
		for (const specifier of statement.specifiers ?? []) {
			const exported = specifier.exported.name ?? specifier.exported.value;
			if (specifier.type === 'ExportSpecifier' && exported === exportName) {
				return declarationOf(specifier.local.name);
			}
		}
	}
	return undefined;
};

// The first object literal in a story: the story object itself, or the first object inside it.
const storyObject = (node: Node | undefined): Node | undefined => {
	let object: Node | undefined;
	if (node) {
		walk(node, (child) => {
			if (object) {
				return false;
			}
			if (child.type === 'ObjectExpression') {
				object = child;
				return false;
			}
			return undefined;
		});
	}
	return object;
};

// The last member of a key, as that is the one that counts when the key is repeated.
const findProperty = (object: Node, key: string): Node | undefined =>
	object.properties.findLast((property: Node) => staticKey(property) === key);

// Replace a member's value. A shorthand or method is written out as `key: value`.
const replaceValue = (editor: SourceEditor, property: Node, text: string) => {
	const value = reindent(text, lineIndent(editor.code, property.start));
	if (property.type === 'ObjectMethod' || property.shorthand) {
		const key = editor.source(property.key);
		editor.replace(
			property.start,
			property.end,
			`${property.computed ? `[${key}]` : key}: ${value}`,
		);
		return;
	}
	editor.replace(property.value.start, property.value.end, value);
};

// Lay out a story object on one line one member per line, as the members that a save adds span
// lines.
const expandStoryObject = (editor: SourceEditor, locate: StoryLocator) => {
	const story = storyObject(locate());
	if (
		!story ||
		story.properties.length === 0 ||
		editor.source(story).includes('\n') ||
		editor.hasCommentsIn(story)
	) {
		return;
	}
	editor.replace(
		story.start,
		story.end,
		editor.printObject(
			story.properties.map((property: Node) => editor.source(property)),
			lineIndent(editor.code, story.start),
		),
	);
	editor.commit();
};

export const updateArgsInCsfFile = async (
	editor: SourceEditor,
	locate: StoryLocator,
	// biome-ignore lint/suspicious/noExplicitAny:
	input: Record<string, any>,
) => {
	const args = new Map(
		Object.entries(input).map(([key, value]) => [
			key,
			valueToSource(value, editor),
		]),
	);
	const member = ([key, value]: [string, string]) =>
		`${printKey(key, editor.quote)}: ${value}`;

	// A story exported through `export { … } from` has no declaration in the file to edit.
	if (!locate()) {
		throw new SaveStoryError('Updating a re-exported story is not supported');
	}

	expandStoryObject(editor, locate);
	const story = storyObject(locate());
	if (!story) {
		return;
	}

	const argsProperty = findProperty(story, 'args');
	if (!argsProperty) {
		if (args.size > 0) {
			editor.insertMembers(
				story,
				[`args: ${editor.printObject([...args].map(member))}`],
				'start',
			);
			editor.commit();
		}
		return;
	}

	if (
		argsProperty.type !== 'ObjectProperty' ||
		argsProperty.value.type !== 'ObjectExpression'
	) {
		return;
	}
	for (const property of argsProperty.value.properties) {
		const key = staticKey(property);
		if (key !== undefined && args.has(key)) {
			replaceValue(editor, property, args.get(key) as string);
			args.delete(key);
		}
	}
	editor.commit();

	if (args.size > 0) {
		const argsObject = findProperty(storyObject(locate()) as Node, 'args')
			?.value as Node;
		editor.insertMembers(argsObject, [...args].map(member), 'end');
		editor.commit();
	}
};

/**
 * Copy a story without its `args` and `name` into a source of its own, exported as
 * `newStoryName`. Edit the copy, then append it to the story file.
 */
export const duplicateStoryWithNewName = (
	editor: SourceEditor,
	originalStoryName: string,
	newStoryName: string,
): SourceEditor => {
	const node = findStoryExport(editor, originalStoryName);
	if (node?.type !== 'VariableDeclarator' || !node.init) {
		throw new SaveStoryError('cannot clone Node');
	}

	// detect CSF2 and throw
	if (
		node.init.type === 'ArrowFunctionExpression' ||
		node.init.type === 'CallExpression'
	) {
		throw new SaveStoryError(
			'Creating a new story based on a CSF2 story is not supported',
		);
	}

	const typeAnnotation = node.id.typeAnnotation
		? editor.source(node.id.typeAnnotation)
		: '';
	const copy = new SourceEditor(
		`export const ${newStoryName}${typeAnnotation} = ${editor.source(node.init)};`,
		editor.fileName,
		editor.style,
	);

	// Remove args and name properties when duplicating a story
	const isRemoved = (property: Node) =>
		['args', 'name'].includes(staticKey(property) ?? '');
	walk(copy.program, (child) => {
		if (isRemoved(child)) {
			return false;
		}
		if (child.type === 'ObjectExpression') {
			const removed = child.properties.filter(isRemoved);
			if (removed.length > 0) {
				copy.removeMembers(child, removed);
			}
		}
		return undefined;
	});
	copy.commit();

	return copy;
};

/**
 * Stands in for a function arg, which the controls panel cannot send. It prints as `() => {}`,
 * whatever the bundler made of its source.
 */
const emptyFunction: () => void = Object.assign(() => {}, {
	toString: () => '() => {}',
});

// biome-ignore lint/suspicious/noExplicitAny:
export const parseArgs = (args: string): Record<string, any> =>
	JSON.parse(args, (_, value) => {
		if (value === '__sb_empty_function_arg__') {
			return emptyFunction;
		}
		return value;
	});

export const updatePlayInCsfFile = async (
	editor: SourceEditor,
	locate: StoryLocator,
	play: string[],
) => {
	expandStoryObject(editor, locate);
	const story = storyObject(locate());
	if (!story) {
		return;
	}

	const lines = preparePlay(play).map((line) => `${editor.indent}${line};`);
	const playExpression =
		lines.length > 0
			? `async ({ canvasElement }) => {\n${lines.join('\n')}\n}`
			: 'async ({ canvasElement }) => {}';

	const playProperty = findProperty(story, 'play');
	if (playProperty) {
		replaceValue(editor, playProperty, playExpression);
	} else {
		editor.insertMembers(story, [`play: ${playExpression}`], 'end');
	}
	editor.commit();
};

const preparePlay = (play: string[]) => play.slice(1, -1).map(prepareLine);

const prepareLine = (line: string) => {
	let result = line;

	if (result.endsWith(';')) {
		result = result.slice(0, -1);
	}

	if (result.startsWith('\t')) {
		result = result.slice(1);
	}

	return result;
};

export const updateImportsInCsfFile = async (
	editor: SourceEditor,
	imports: string[],
) => {
	for (const importString of imports) {
		const importNode = parse(importString, { sourceType: 'module' }).program
			.body[0] as Node | undefined;
		if (importNode?.type !== 'ImportDeclaration') {
			throw new SaveStoryError(`Not an import: ${importString}`);
		}

		const importNodesBySource = new Map<string, Node>();
		for (const statement of editor.program.body as Node[]) {
			// Values cannot be added to a type-only import.
			if (
				statement.type === 'ImportDeclaration' &&
				statement.importKind !== 'type'
			) {
				importNodesBySource.set(statement.source.value, statement);
			}
		}

		const existingImport = importNodesBySource.get(importNode.source.value);
		if (existingImport) {
			const specifiers: Node[] = existingImport.specifiers;
			const existingSpecifierNames = new Set(
				specifiers.map((specifier) => specifier.local.name),
			);
			const added = (importNode.specifiers as Node[])
				.filter(
					(specifier) =>
						specifier.type === 'ImportSpecifier' &&
						!existingSpecifierNames.has(specifier.local.name),
				)
				.map((specifier) => importString.slice(specifier.start, specifier.end));
			const lastNamed = specifiers
				.filter((specifier) => specifier.type === 'ImportSpecifier')
				.at(-1);
			if (added.length === 0) {
				// Everything is imported already.
			} else if (lastNamed) {
				editor.insert(lastNamed.end, `, ${added.join(', ')}`);
			} else if (
				specifiers.length === 1 &&
				specifiers[0].type === 'ImportDefaultSpecifier'
			) {
				editor.insert(specifiers[0].end, `, { ${added.join(', ')} }`);
			} else {
				// A namespace or side-effect import cannot take named specifiers.
				editor.prependStatement(
					`import { ${added.join(', ')} } from ${editor.source(existingImport.source)};`,
				);
			}
		} else {
			editor.prependStatement(
				importString.endsWith(';') ? importString : `${importString};`,
			);
		}
		editor.commit();
	}
};
