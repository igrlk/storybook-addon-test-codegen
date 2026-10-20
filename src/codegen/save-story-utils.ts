// Ported from Storybook's save-story utilities, except for "updatePlayInCsfFile" and
// "updateImportsInCsfFile". Stories are edited through csf-tools' `CsfObject` where it fits, and
// through the file's source editor for the rest; code an edit does not touch stays as written.

import {
	type CsfFile,
	type CsfMutationResult,
	type CsfObject,
	type ESTree,
	appendStatement,
	itemText,
	lineIndent,
	objectList,
	outerSpan,
	parseExpression,
	parseModule,
	prependStatement,
	printMembers,
	reindent,
	setImportSpecifiers,
	unwrapExpression,
} from 'storybook/internal/csf-tools';

class SaveStoryError extends Error {}

const storyObject = (csf: CsfFile, exportName: string): CsfObject => {
	const object = csf
		.objects({ meta: false })
		.find(
			({ target }) => target.kind === 'story' && target.exportName === exportName,
		);
	if (!object) {
		// CSF2 stories, such as `Template.bind({})`, have no story object to edit.
		throw new SaveStoryError('Updating a CSF2 story is not supported');
	}
	return object;
};

const check = (result: CsfMutationResult) => {
	if (!result.ok) {
		throw new SaveStoryError(result.diagnostic.message);
	}
};

// The object literal of a story in the file's tree: `{ … }`, or the one in `meta.story({ … })`.
const storyLiteral = (csf: CsfFile, exportName: string) => {
	const declarator = csf._storyExports[exportName];
	let init: ESTree.Expression | null | undefined =
		declarator?.type === 'VariableDeclarator'
			? unwrapExpression(declarator.init)
			: undefined;
	if (
		init?.type === 'CallExpression' &&
		init.arguments[0]?.type !== 'SpreadElement'
	) {
		init = unwrapExpression(init.arguments[0]);
	}
	return init?.type === 'ObjectExpression' ? init : undefined;
};

/**
 * Lay out a story object on one line one member per line, as `set` keeps a one-line object on
 * one line when it adds a member that spans lines, such as a play function.
 */
const expandStoryObject = (csf: CsfFile, exportName: string) => {
	const editor = csf._editor;
	const object = storyLiteral(csf, exportName);
	if (
		!object ||
		object.properties.length === 0 ||
		editor.source(object).includes('\n') ||
		editor.comments.some(
			(comment) => comment.start > object.start && comment.end < object.end,
		)
	) {
		return;
	}
	const list = objectList(editor, object);
	const members = object.properties.map((property) =>
		itemText(editor, list, property),
	);
	editor.edits.overwrite(
		object.start,
		object.end,
		reindent(
			printMembers(members, editor.indent),
			'',
			lineIndent(editor.code, object.start),
		),
	);
	editor.commit();
};

// Set an arg value. Functions, which `set` takes as expressions only, are written one by one.
const setArg = (story: CsfObject, path: string[], value: unknown) => {
	if (typeof value === 'function') {
		check(story.set(path, parseExpression(value.toString())));
		return;
	}
	if (value && typeof value === 'object' && hasFunction(value)) {
		if (Array.isArray(value)) {
			throw new SaveStoryError(
				'Saving a function inside an array arg is not supported',
			);
		}
		check(story.set(path, {}));
		for (const [key, item] of Object.entries(value)) {
			if (typeof item !== 'undefined') {
				setArg(story, [...path, key], item);
			}
		}
		return;
	}
	check(
		story.set(path, withoutUndefined(value) as Parameters<CsfObject['set']>[1]),
	);
};

const hasFunction = (value: unknown): boolean =>
	typeof value === 'function' ||
	(typeof value === 'object' &&
		value !== null &&
		Object.values(value).some(hasFunction));

// Members set to `undefined` are left out, as before.
const withoutUndefined = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(withoutUndefined);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, item]) => typeof item !== 'undefined')
				.map(([key, item]) => [key, withoutUndefined(item)]),
		);
	}
	return value;
};

export const updateArgsInCsfFile = async (
	csf: CsfFile,
	exportName: string,
	// biome-ignore lint/suspicious/noExplicitAny:
	input: Record<string, any>,
) => {
	const story = storyObject(csf, exportName);
	for (const [key, value] of Object.entries(input)) {
		setArg(story, ['args', key], value);
	}
};

/** Copy a story without its `args` and `name` and export it as `newStoryName`. */
export const duplicateStoryWithNewName = (
	csf: CsfFile,
	originalStoryName: string,
	newStoryName: string,
) => {
	const node = csf._storyExports[originalStoryName];
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

	const editor = csf._editor;
	const typeAnnotation =
		node.id.type === 'Identifier' && node.id.typeAnnotation
			? editor.source(node.id.typeAnnotation)
			: '';
	appendStatement(
		editor,
		`export const ${newStoryName}${typeAnnotation} = ${editor.source(outerSpan(node.init))};`,
	);
	editor.commit();

	// Remove args and name properties when duplicating a story
	const story = storyObject(csf, newStoryName);
	check(story.remove(['args']));
	check(story.remove(['name']));
};

/**
 * Set a story apart from the statement before it with a blank line, as `appendStatement` adds
 * none for a copy of a one-line story, which the save then makes span lines.
 */
export const separateStory = (csf: CsfFile, exportName: string) => {
	const { body } = csf._program;
	const index = body.findIndex(
		(statement) =>
			statement.type === 'ExportNamedDeclaration' &&
			statement.declaration?.type === 'VariableDeclaration' &&
			statement.declaration.declarations.some(
				(declarator) =>
					declarator.id.type === 'Identifier' && declarator.id.name === exportName,
			),
	);
	const [previous, statement] = [body[index - 1], body[index]];
	const editor = csf._editor;
	if (
		previous &&
		statement &&
		editor.source(statement).includes('\n') &&
		!/\n[^\S\n]*\n/.test(editor.code.slice(previous.end, statement.start))
	) {
		editor.edits.appendRight(statement.start, '\n');
		editor.commit();
	}
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
	csf: CsfFile,
	exportName: string,
	play: string[],
) => {
	expandStoryObject(csf, exportName);
	const story = storyObject(csf, exportName);

	const { indent } = csf._editor;
	const lines = preparePlay(play).map((line) => `${indent}${line};`);
	const playExpression = parseExpression(
		lines.length > 0
			? `async ({ canvasElement }) => {\n${lines.join('\n')}\n}`
			: 'async ({ canvasElement }) => {}',
	);

	// `set` would replace an existing play in place but keep the indentation of the new code, so
	// the play is removed and added again, which indents it.
	check(story.remove(['play']));
	check(story.set(['play'], playExpression));
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
	csf: CsfFile,
	imports: string[],
) => {
	const editor = csf._editor;
	for (const importString of imports) {
		const parsed = parseModule(importString);
		const importNode = parsed.program.body[0];
		if (importNode?.type !== 'ImportDeclaration') {
			throw new SaveStoryError(`Not an import: ${importString}`);
		}

		// Values cannot be added to a type-only import.
		const existingImport = csf._program.body.findLast(
			(statement): statement is ESTree.ImportDeclaration =>
				statement.type === 'ImportDeclaration' &&
				statement.importKind !== 'type' &&
				statement.source.value === importNode.source.value,
		);

		if (existingImport) {
			const existingSpecifierNames = new Set(
				existingImport.specifiers.map((specifier) => specifier.local.name),
			);
			const added = importNode.specifiers
				.filter(
					(specifier) =>
						specifier.type === 'ImportSpecifier' &&
						!existingSpecifierNames.has(specifier.local.name),
				)
				.map((specifier) => parsed.code.slice(specifier.start, specifier.end));
			if (added.length === 0) {
				continue;
			}
			if (
				existingImport.specifiers.some((s) => s.type === 'ImportNamespaceSpecifier')
			) {
				// A namespace import cannot take named specifiers.
				prependStatement(
					editor,
					`import { ${added.join(', ')} } from ${editor.source(existingImport.source)};`,
				);
			} else {
				setImportSpecifiers(editor, existingImport, existingImport.specifiers, {
					named: added,
				});
			}
		} else {
			prependStatement(
				editor,
				importString.endsWith(';') ? importString : `${importString};`,
			);
		}
		editor.commit();
	}
};
