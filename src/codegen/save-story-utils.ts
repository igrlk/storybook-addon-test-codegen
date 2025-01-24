// Copied from storybook package
// Except for "updatePlayInCsfFile" and "updateImportsInCsfFile"

import { parser, types as t, traverse } from 'storybook/internal/babel';
import type { CsfFile } from 'storybook/internal/csf-tools';

class SaveStoryError extends Error {}

// biome-ignore lint/suspicious/noExplicitAny:
export function valueToAST<T>(literal: T): any {
	if (literal === null) {
		return t.nullLiteral();
	}
	switch (typeof literal) {
		case 'function':
			return parser.parse(literal.toString(), {
				allowReturnOutsideFunction: true,
				allowSuperOutsideMethod: true,
				// @ts-expect-error (it's the contents of the function, it's an expression, trust me)
			}).program.body[0]?.expression;

		case 'number':
			return t.numericLiteral(literal);
		case 'string':
			return t.stringLiteral(literal);
		case 'boolean':
			return t.booleanLiteral(literal);
		case 'undefined':
			return t.identifier('undefined');
		default:
			if (Array.isArray(literal)) {
				return t.arrayExpression(literal.map(valueToAST));
			}
			return t.objectExpression(
				Object.keys(literal)
					.filter((k) => {
						// @ts-expect-error (it's a completely unknown object)
						const value = literal[k];
						return typeof value !== 'undefined';
					})
					.map((k) => {
						// @ts-expect-error (it's a completely unknown object)
						const value = literal[k];
						return t.objectProperty(t.stringLiteral(k), valueToAST(value));
					}),
			);
	}
}

export const updateArgsInCsfFile = async (
	node: t.Node,
	// biome-ignore lint/suspicious/noExplicitAny:
	input: Record<string, any>,
) => {
	let found = false;
	const args = Object.fromEntries(
		Object.entries(input).map(([k, v]) => {
			return [k, valueToAST(v)];
		}),
	);

	// detect CSF2 and throw
	if (t.isArrowFunctionExpression(node) || t.isCallExpression(node)) {
		throw new SaveStoryError('Updating a CSF2 story is not supported');
	}

	if (t.isObjectExpression(node)) {
		const properties = node.properties;
		const argsProperty = properties.find((property) => {
			if (t.isObjectProperty(property)) {
				const key = property.key;
				return t.isIdentifier(key) && key.name === 'args';
			}
			return false;
		});

		if (argsProperty) {
			if (t.isObjectProperty(argsProperty)) {
				const a = argsProperty.value;
				if (t.isObjectExpression(a)) {
					for (const p of a.properties) {
						if (t.isObjectProperty(p)) {
							const key = p.key;
							if (t.isIdentifier(key) && key.name in args) {
								p.value = args[key.name];
								delete args[key.name];
							}
						}
					}

					const remainder = Object.entries(args);
					if (Object.keys(args).length) {
						for (const [key, value] of remainder) {
							a.properties.push(t.objectProperty(t.identifier(key), value));
						}
					}
				}
			}
		} else {
			properties.unshift(
				t.objectProperty(
					t.identifier('args'),
					t.objectExpression(
						Object.entries(args).map(([key, value]) =>
							t.objectProperty(t.identifier(key), value),
						),
					),
				),
			);
		}
		return;
	}

	traverse(node, {
		ObjectExpression(path) {
			if (found) {
				return;
			}

			found = true;
			const properties = path.get('properties');
			const argsProperty = properties.find((property) => {
				if (property.isObjectProperty()) {
					const key = property.get('key');
					return key.isIdentifier() && key.node.name === 'args';
				}
				return false;
			});

			if (argsProperty) {
				if (argsProperty.isObjectProperty()) {
					const a = argsProperty.get('value');
					if (a.isObjectExpression()) {
						a.traverse({
							ObjectProperty(p) {
								const key = p.get('key');
								if (key.isIdentifier() && key.node.name in args) {
									p.get('value').replaceWith(args[key.node.name]);
									delete args[key.node.name];
								}
							},
							noScope: true,
						});

						const remainder = Object.entries(args);
						if (Object.keys(args).length) {
							for (const [key, value] of remainder) {
								a.pushContainer(
									'properties',
									t.objectProperty(t.identifier(key), value),
								);
							}
						}
					}
				}
			} else {
				path.unshiftContainer(
					'properties',
					t.objectProperty(
						t.identifier('args'),
						t.objectExpression(
							Object.entries(args).map(([key, value]) =>
								t.objectProperty(t.identifier(key), value),
							),
						),
					),
				);
			}
		},

		noScope: true,
	});
};

type In = ReturnType<CsfFile['parse']>;

export const duplicateStoryWithNewName = (
	csfFile: In,
	originalStoryName: string,
	newStoryName: string,
) => {
	const node = csfFile._storyExports[originalStoryName];
	const cloned = t.cloneNode(node) as t.VariableDeclarator;

	if (!cloned) {
		throw new SaveStoryError('cannot clone Node');
	}

	let found = false;
	traverse(cloned, {
		Identifier(path) {
			if (found) {
				return;
			}

			if (path.node.name === originalStoryName) {
				found = true;
				path.node.name = newStoryName;
			}
		},
		ObjectProperty(path) {
			const key = path.get('key');
			if (key.isIdentifier() && key.node.name === 'args') {
				path.remove();
			}
		},

		noScope: true,
	});

	// detect CSF2 and throw
	if (
		t.isArrowFunctionExpression(cloned.init) ||
		t.isCallExpression(cloned.init)
	) {
		throw new SaveStoryError(
			'Creating a new story based on a CSF2 story is not supported',
		);
	}

	traverse(csfFile._ast, {
		Program(path) {
			path.pushContainer(
				'body',
				t.exportNamedDeclaration(t.variableDeclaration('const', [cloned])),
			);
		},
	});

	return cloned;
};

// biome-ignore lint/suspicious/noExplicitAny:
export const parseArgs = (args: string): Record<string, any> =>
	JSON.parse(args, (_, value) => {
		if (value === '__sb_empty_function_arg__') {
			return () => {};
		}
		return value;
	});

// Removes extra newlines between story properties. See https://github.com/benjamn/recast/issues/242
// Only updates the part of the code for the story with the given name.
export const removeExtraNewlines = (code: string, name: string) => {
	const anything = '([\\s\\S])'; // Multiline match for any character.
	const newline = '(\\r\\n|\\r|\\n)'; // Either newlines or carriage returns may be used in the file.
	const closing = `${newline}};${newline}`; // Marks the end of the story definition.
	const regex = new RegExp(
		// Looks for an export by the given name, considers the first closing brace on its own line
		// to be the end of the story definition.
		`^(?<before>${anything}*)(?<story>export const ${name} =${anything}+?${closing})(?<after>${anything}*)$`,
	);
	const { before, story, after } = code.match(regex)?.groups || {};
	return story
		? before +
				story.replaceAll(
					/(\r\n|\r|\n)(\r\n|\r|\n)([ \t]*[a-z0-9_]+): /gi,
					'$2$3:',
				) +
				after
		: code;
};

export const updatePlayInCsfFile = async (node: t.Node, play: string[]) => {
	let found = false;

	// detect CSF2 and throw
	if (t.isArrowFunctionExpression(node) || t.isCallExpression(node)) {
		throw new SaveStoryError('Updating a CSF2 story is not supported');
	}

	traverse(node, {
		ObjectExpression(path) {
			if (found) {
				return;
			}

			found = true;
			const properties = path.get('properties');
			const playProperty = properties.find((property) => {
				if (property.isObjectProperty()) {
					const key = property.get('key');
					return key.isIdentifier() && key.node.name === 'play';
				}
				return false;
			});

			const playExpression = t.arrowFunctionExpression(
				[t.identifier('async ({ canvasElement })')],
				t.blockStatement(
					preparePlay(play).map((line) => t.expressionStatement(t.identifier(line))),
				),
			);

			if (playProperty) {
				if (playProperty.isObjectProperty()) {
					playProperty.get('value').replaceWith(playExpression);
				}
			} else {
				path.pushContainer(
					'properties',
					t.objectProperty(t.identifier('play'), playExpression),
				);
			}
		},

		noScope: true,
	});
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
	node: t.Node,
	imports: string[],
) => {
	let found = false;

	// detect CSF2 and throw an error
	if (t.isArrowFunctionExpression(node) || t.isCallExpression(node)) {
		throw new SaveStoryError('Updating a CSF2 story is not supported');
	}

	traverse(node, {
		Program(path) {
			if (found) {
				return;
			}

			found = true;

			const parser = require('@babel/parser');

			const packagesToImport = imports.map((importString) => {
				const importStatement = parser.parse(importString, {
					sourceType: 'module',
				});

				return {
					importNode: importStatement.program.body[0],
					importString,
				};
			});

			const importNodesBySource = new Map<string, t.ImportDeclaration>();
			for (const { node } of path.get('body')) {
				if (t.isImportDeclaration(node)) {
					importNodesBySource.set(node.source.value, node);
				}
			}

			for (const { importNode, importString } of packagesToImport) {
				const source = importNode.source.value;
				const existingImport = importNodesBySource.get(source);

				if (existingImport) {
					const specifiers = importNode.specifiers;
					const existingSpecifiers = existingImport.specifiers;

					const existingSpecifierNames = new Set(
						existingSpecifiers.map((s) => s.local.name),
					);

					for (const specifier of specifiers) {
						if (!existingSpecifierNames.has(specifier.local.name)) {
							existingSpecifiers.push(specifier);
						}
					}
				} else {
					if (t.isFile(node)) {
						node.program.body.unshift(
							t.expressionStatement(
								t.identifier(
									importString.endsWith(';') ? importString.slice(0, -1) : importString,
								),
							),
						);
					}
				}
			}
		},

		noScope: true,
	});
};
