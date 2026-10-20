// The save steps on Storybook 11, whose csf-tools hand out ESTree nodes and
// edit the source as text. `save-story-babel.ts` does the same on
// Storybook 10.

import {
	type CsfFile,
	type CsfMutationResult,
	type CsfObject,
	type CsfValue,
	type ESTree,
	SourceEditor,
	appendStatement,
	isCsfFactoryCall,
	objectList,
	outerSpan,
	parseExpression,
	parseModule,
	prependStatement,
	printCsf,
	removeFromList,
	setImportSpecifiers,
	staticKey,
	unwrapExpression,
} from 'storybook/internal/csf-tools';
import type { StorySaver } from './story-saver';

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

const statementEnd = (editor: SourceEditor) => (editor.semicolons ? ';' : '');

const check = (result: CsfMutationResult) => {
	if (!result.ok) {
		throw new SaveStoryError(result.diagnostic.message);
	}
};

// What the controls panel sends for a function arg, which it cannot serialize.
const EMPTY_FUNCTION_ARG = '__sb_empty_function_arg__';

type ArgValue = CsfValue<ESTree.Expression>;

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
	const declarator = node?.type === 'VariableDeclarator' ? node : undefined;
	const value = unwrapExpression(declarator?.init);
	if (
		!declarator?.init ||
		!value ||
		value.type === 'ArrowFunctionExpression' ||
		value.type === 'FunctionExpression' ||
		(value.type === 'CallExpression' && !isCsfFactoryCall(value))
	) {
		throw new SaveStoryError(
			'Creating a new story based on a CSF2 story is not supported',
		);
	}

	const editor = csf._editor;
	const typeAnnotation =
		declarator.id.type === 'Identifier' && declarator.id.typeAnnotation
			? editor.source(declarator.id.typeAnnotation)
			: '';

	// The copy is parsed on its own, so its `args` and `name` can be removed even after a spread,
	// which csf-tools refuses to do on the story itself.
	const copy = new SourceEditor(
		`(${editor.source(outerSpan(declarator.init))})`,
		csf._options.fileName,
	);
	const { expression } = copy.program.body[0] as ESTree.ExpressionStatement;
	const story = unwrapExpression(expression);
	const object = isCsfFactoryCall(story)
		? unwrapExpression(story.arguments[0])
		: story;
	if (object?.type === 'ObjectExpression') {
		const removed = object.properties.filter((property) => {
			const key = staticKey(property);
			return key === 'args' || key === 'name';
		});
		if (removed.length > 0) {
			removeFromList(copy, objectList(copy, object), removed);
		}
	}

	appendStatement(
		editor,
		`export const ${newStoryName}${typeAnnotation} = ${copy.toString().slice(1, -1)}${statementEnd(editor)}`,
	);
	editor.commit();
};

/** `play` holds the body's lines, as `generateStoryCode` prepares them. */
export const updatePlayInCsfFile = (
	csf: CsfFile,
	exportName: string,
	play: string[],
) => {
	const story = storyObject(csf, exportName);

	const editor = csf._editor;
	const lines = play.map(
		(line) => `${editor.indent}${line}${statementEnd(editor)}`,
	);
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
			(declaration) =>
				!declaration.specifiers.some(
					(specifier) => specifier.type === 'ImportNamespaceSpecifier',
				),
		);

		if (sameSource.length === 0) {
			prependStatement(
				editor,
				`${importString.replace(/;$/, '')}${statementEnd(editor)}`,
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
				`import { ${added.join(', ')} } from ${editor.source(sameSource[0].source)}${statementEnd(editor)}`,
			);
		}
		editor.commit();
	}
};

export const estreeStorySaver: StorySaver = {
	edit: (csf) => ({
		duplicateStory: (originalExportName, newExportName) =>
			duplicateStoryWithNewName(csf, originalExportName, newExportName),
		setArgs: (exportName, args) =>
			updateArgsInCsfFile(csf, exportName, args ? JSON.parse(args) : {}),
		setPlay: (exportName, play) => updatePlayInCsfFile(csf, exportName, play),
		addImports: (imports) => updateImportsInCsfFile(csf, imports),
		print: () => printCsf(csf).code,
	}),
};
