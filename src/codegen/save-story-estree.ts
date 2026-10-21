// The save steps on the csf-tools of storybookjs/storybook#36613
// (Storybook 11), which hand out ESTree nodes and edit the source as text.
// `save-story-babel.ts` does the same with the Babel csf-tools.

import {
	type CsfFile,
	type CsfMutationResult,
	type CsfValue,
	type ESTree,
	SourceEditor,
	objectList,
	outerSpan,
	parseExpression,
	parseModule,
	printCsf,
	removeFromList,
	staticKey,
	textOf,
	unwrapExpression,
} from 'storybook/internal/csf-tools';
import type { StorySaver } from './story-saver';

class SaveStoryError extends Error {}

const storyObject = (csf: CsfFile, exportName: string) => {
	const found = csf.storyObject(exportName);
	if (!found?.ok) {
		throw new SaveStoryError(
			found?.diagnostic.message ?? `Cannot edit the story ${exportName}`,
		);
	}
	return found.object;
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
	const { editor } = csf;
	const story = csf.stories.find(
		({ exportName }) => exportName === originalStoryName,
	);
	const node = story
		? editor.scopes.program.bindings.get(story.localName ?? story.exportName)
				?.node
		: undefined;
	const declarator = node?.type === 'VariableDeclarator' ? node : undefined;
	const value = unwrapExpression(declarator?.init);
	if (
		!story ||
		!declarator?.init ||
		!value ||
		value.type === 'ArrowFunctionExpression' ||
		value.type === 'FunctionExpression' ||
		(value.type === 'CallExpression' && !story.factory)
	) {
		throw new SaveStoryError(
			'Creating a new story based on a CSF2 story is not supported',
		);
	}

	const typeAnnotation =
		declarator.id.type === 'Identifier' && declarator.id.typeAnnotation
			? textOf(declarator.id.typeAnnotation)
			: '';

	// The copy is parsed on its own, so its `args` and `name` can be removed even after a spread,
	// which csf-tools refuses to do on the story itself.
	const copy = new SourceEditor(
		`(${editor.source(outerSpan(declarator.init))})`,
		editor.fileName,
	);
	const { expression } = copy.program.body[0] as ESTree.ExpressionStatement;
	const copied = unwrapExpression(expression);
	const object =
		story.factory && copied?.type === 'CallExpression'
			? unwrapExpression(copied.arguments[0])
			: copied;
	if (object?.type === 'ObjectExpression') {
		const removed = object.properties.filter((property) => {
			const key = staticKey(property);
			return key === 'args' || key === 'name';
		});
		if (removed.length > 0) {
			removeFromList(copy, objectList(copy, object), removed);
		}
	}

	csf.appendStatement(
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

	const { editor } = csf;
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

/** Adds each import statement's bindings through `CsfFile.setImport`. */
export const updateImportsInCsfFile = (csf: CsfFile, imports: string[]) => {
	for (const importString of imports) {
		const [importNode] = parseModule(importString).program.body;
		if (importNode?.type !== 'ImportDeclaration') {
			throw new SaveStoryError(`Not an import: ${importString}`);
		}
		const source = importNode.source.value;
		const named: string[] = [];
		for (const specifier of importNode.specifiers) {
			if (specifier.type === 'ImportSpecifier') {
				named.push(textOf(specifier));
			} else if (specifier.type === 'ImportDefaultSpecifier') {
				check(csf.setImport(specifier.local.name, source));
			} else {
				check(csf.setImport({ namespace: specifier.local.name }, source));
			}
		}
		if (named.length > 0) {
			check(csf.setImport(named, source));
		} else if (importNode.specifiers.length === 0) {
			check(csf.setImport(null, source));
		}
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
