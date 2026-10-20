import {
	type CsfFile,
	type CsfMutationResult,
	type CsfObject,
	type ESTree,
	SourceEditor,
	appendStatement,
	isCsfFactoryCall,
	objectList,
	outerSpan,
	parseExpression,
	parseModule,
	prependStatement,
	removeFromList,
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
		const diagnostic = csf.mutationDiagnostics.find(
			({ target }) => 'exportName' in target && target.exportName === exportName,
		);
		throw new SaveStoryError(
			diagnostic?.message ?? `Cannot edit the story ${exportName}`,
		);
	}
	return object;
};

const check = (result: CsfMutationResult) => {
	if (!result.ok) {
		throw new SaveStoryError(result.diagnostic.message);
	}
};

// What the controls panel sends for a function arg, which it cannot serialize.
const EMPTY_FUNCTION_ARG = '__sb_empty_function_arg__';

type ArgValue = Parameters<CsfObject['set']>[1];

// An arg value for `set`, with function args as `() => {}` expressions at any depth.
const argValue = (value: unknown): ArgValue => {
	if (value === EMPTY_FUNCTION_ARG) {
		return parseExpression('() => {}');
	}
	if (Array.isArray(value)) {
		return value.map(argValue);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, argValue(item)]),
		);
	}
	return value as ArgValue;
};

export const updateArgsInCsfFile = (
	csf: CsfFile,
	exportName: string,
	input: Record<string, unknown>,
) => {
	const story = storyObject(csf, exportName);
	// Each arg is set on its own, so the story's other args stay.
	for (const [key, value] of Object.entries(input)) {
		check(story.set(['args', key], argValue(value)));
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

	// The copy is parsed on its own, so its `args` and `name` can be removed even after a spread,
	// which csf-tools refuses to do on the story itself.
	const copy = new SourceEditor(
		`(${editor.source(outerSpan(node.init))})`,
		csf._options.fileName,
	);
	const [statement] = copy.program.body;
	let init =
		statement?.type === 'ExpressionStatement'
			? unwrapExpression(statement.expression)
			: undefined;
	if (init?.type === 'CallExpression') {
		// A CSF4 story, `meta.story({ … })`.
		init = unwrapExpression(init.arguments[0] as ESTree.Expression | undefined);
	}
	if (init?.type === 'ObjectExpression') {
		const removed = init.properties.filter((property) =>
			['args', 'name'].includes(staticKey(property) ?? ''),
		);
		if (removed.length > 0) {
			removeFromList(copy, objectList(copy, init), removed);
		}
	}

	appendStatement(
		editor,
		`export const ${newStoryName}${typeAnnotation} = ${copy.toString().slice(1, -1)};`,
	);
	editor.commit();
};

export const updatePlayInCsfFile = (
	csf: CsfFile,
	exportName: string,
	play: string[],
) => {
	const story = storyObject(csf, exportName);

	const { indent } = csf._editor;
	const lines = preparePlay(play).map((line) => `${indent}${line};`);
	check(
		story.set(
			['play'],
			parseExpression(
				lines.length > 0
					? `async ({ canvasElement }) => {\n${lines.join('\n')}\n}`
					: 'async ({ canvasElement }) => {}',
			),
		),
	);
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

const isNamespace = (declaration: ESTree.ImportDeclaration) =>
	declaration.specifiers.some(
		(specifier) => specifier.type === 'ImportNamespaceSpecifier',
	);

export const updateImportsInCsfFile = (csf: CsfFile, imports: string[]) => {
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
		const imported = new Set(
			sameSource.flatMap((declaration) =>
				declaration.specifiers.map((specifier) => specifier.local.name),
			),
		);
		const added = importNode.specifiers
			.filter(
				(specifier) =>
					specifier.type === 'ImportSpecifier' &&
					!imported.has(specifier.local.name),
			)
			.map((specifier) => parsed.code.slice(specifier.start, specifier.end));
		const mergeInto = sameSource.findLast(
			(declaration) => !isNamespace(declaration),
		);

		if (sameSource.length === 0) {
			prependStatement(
				editor,
				importString.endsWith(';') ? importString : `${importString};`,
			);
		} else if (added.length === 0) {
			continue;
		} else if (mergeInto) {
			setImportSpecifiers(editor, mergeInto, mergeInto.specifiers, {
				named: added,
			});
		} else {
			prependStatement(
				editor,
				`import { ${added.join(', ')} } from ${editor.source(sameSource[0].source)};`,
			);
		}
		editor.commit();
	}
};
