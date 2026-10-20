// Writes a recorded play function and the current args into a story file. Stories are edited
// through csf-tools' `CsfObject` where it fits, and through the file's source editor for the rest,
// so code an edit does not touch stays as written.

import {
	type CsfFile,
	type CsfMutationResult,
	type CsfObject,
	type ESTree,
	appendStatement,
	isCsfFactoryCall,
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
	staticKey,
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
		// CSF2 stories, such as `Template.bind({})`, have no story object to edit, and csf-tools
		// reports why it skipped any other story.
		const diagnostic = csf.mutationDiagnostics.find(
			({ target }) => 'exportName' in target && target.exportName === exportName,
		);
		throw new SaveStoryError(
			diagnostic?.message ?? 'Updating a CSF2 story is not supported',
		);
	}
	return object;
};

const check = (result: CsfMutationResult) => {
	if (!result.ok) {
		throw new SaveStoryError(result.diagnostic.message);
	}
};

// The object literal of a story in the file's tree: `{ … }`, or the one in `meta.story({ … })`.
const storyLiteral = (csf: CsfFile, story: CsfObject) => {
	if (story.target.kind !== 'story') {
		return undefined;
	}
	const { localName } = story.target;
	const declarator = csf._program.body
		.map((statement) =>
			statement.type === 'ExportNamedDeclaration'
				? statement.declaration
				: statement,
		)
		.flatMap((declaration) =>
			declaration?.type === 'VariableDeclaration' ? declaration.declarations : [],
		)
		.find(({ id }) => id.type === 'Identifier' && id.name === localName);
	let init: ESTree.Expression | null | undefined = unwrapExpression(
		declarator?.init,
	);
	if (
		init?.type === 'CallExpression' &&
		init.arguments[0]?.type !== 'SpreadElement'
	) {
		init = unwrapExpression(init.arguments[0]);
	}
	return init?.type === 'ObjectExpression' ? init : undefined;
};

// The object literal of a story's `args`, if it has one.
const argsLiteral = (csf: CsfFile, story: CsfObject) => {
	const args = storyLiteral(csf, story)?.properties.find(
		(property) => property.type === 'Property' && staticKey(property) === 'args',
	);
	const value =
		args?.type === 'Property' ? unwrapExpression(args.value) : undefined;
	return value?.type === 'ObjectExpression' ? value : undefined;
};

/**
 * Lay out an object on one line one member per line. `set` keeps a one-line object on one line,
 * also when it adds a member that spans lines, such as a play function.
 */
const expandObject = (
	csf: CsfFile,
	object: ESTree.ObjectExpression | undefined,
) => {
	const editor = csf._editor;
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

// What the controls panel sends for a function arg, which it cannot serialize.
const EMPTY_FUNCTION_ARG = '__sb_empty_function_arg__';

const hasFunctionArg = (value: unknown): boolean =>
	value === EMPTY_FUNCTION_ARG ||
	(typeof value === 'object' &&
		value !== null &&
		Object.values(value).some(hasFunctionArg));

// Set an arg value. Function args, which `set` takes as expressions only, are written one by one.
const setArg = (story: CsfObject, path: string[], value: unknown) => {
	if (value === EMPTY_FUNCTION_ARG) {
		check(story.set(path, parseExpression('() => {}')));
		return;
	}
	if (value && typeof value === 'object' && hasFunctionArg(value)) {
		if (Array.isArray(value)) {
			throw new SaveStoryError(
				'Saving a function inside an array arg is not supported',
			);
		}
		check(story.set(path, {}));
		for (const [key, item] of Object.entries(value)) {
			setArg(story, [...path, key], item);
		}
		return;
	}
	check(story.set(path, value as Parameters<CsfObject['set']>[1]));
};

export const updateArgsInCsfFile = async (
	csf: CsfFile,
	exportName: string,
	// biome-ignore lint/suspicious/noExplicitAny:
	input: Record<string, any>,
) => {
	const story = storyObject(csf, exportName);
	const createsArgs = story.get(['args']) === undefined;
	for (const [key, value] of Object.entries(input)) {
		setArg(story, ['args', key], value);
	}
	// An args object the save creates is laid out one member per line, as before, in a story that
	// is laid out so as well.
	if (createsArgs) {
		expandObject(csf, storyLiteral(csf, story));
		expandObject(csf, argsLiteral(csf, story));
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
		(node.init.type === 'CallExpression' && !isCsfFactoryCall(node.init))
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
 * Set a story apart from the statement before it with a blank line. `appendStatement` adds none
 * for a copy of a one-line story, which the save then makes span lines.
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
		index > 0 &&
		statement &&
		editor.source(statement).includes('\n') &&
		!/\n[^\S\n]*\n/.test(editor.code.slice(previous.end, statement.start))
	) {
		editor.edits.appendRight(statement.start, '\n');
		editor.commit();
	}
};

// Function args stay `EMPTY_FUNCTION_ARG` strings, which `setArg` writes as `() => {}`.
// biome-ignore lint/suspicious/noExplicitAny:
export const parseArgs = (args: string): Record<string, any> =>
	JSON.parse(args);

export const updatePlayInCsfFile = async (
	csf: CsfFile,
	exportName: string,
	play: string[],
) => {
	expandObject(csf, storyLiteral(csf, storyObject(csf, exportName)));
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

		// Values cannot be added to a type-only import, and named ones not to a namespace import.
		const sameSource = csf._program.body.filter(
			(statement): statement is ESTree.ImportDeclaration =>
				statement.type === 'ImportDeclaration' &&
				statement.importKind !== 'type' &&
				statement.source.value === importNode.source.value,
		);
		const isNamespace = (declaration: ESTree.ImportDeclaration) =>
			declaration.specifiers.some(
				(specifier) => specifier.type === 'ImportNamespaceSpecifier',
			);
		const existingImport =
			sameSource.findLast((declaration) => !isNamespace(declaration)) ??
			sameSource.at(-1);

		if (existingImport) {
			const existingSpecifierNames = new Set(
				sameSource.flatMap((declaration) =>
					declaration.specifiers.map((specifier) => specifier.local.name),
				),
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
			if (isNamespace(existingImport)) {
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
