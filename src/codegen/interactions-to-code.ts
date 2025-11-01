import type { Interaction } from '../state';
import { argsToString, wrapInQuotes } from './args-to-string';

const EVENT_TO_USER_EVENT = {
	click: 'click',
	dblclick: 'dblClick',
	keydown: 'keyboard',
	type: 'type',
	select: 'selectOptions',
	upload: 'upload',
	focus: 'focus',
};

export type Warning = 'ROLE_WITHOUT_NAME' | 'QUERY_SELECTOR' | 'TEST_ID';

export type GeneratedCodeLine = {
	text: string;
	warning?: Warning;
};

type GeneratedPlayCode = {
	imports: GeneratedCodeLine[];
	play: GeneratedCodeLine[];
};

type GeneratedTestCode = {
	imports: GeneratedCodeLine[];
	parameters: string[];
	tests: GeneratedCodeLine[];
};

export type GeneratedCode = GeneratedPlayCode | GeneratedTestCode;

export const isPlay = (code: GeneratedCode): code is GeneratedPlayCode =>
	'play' in code;

export const convertInteractionsToCode = ({
	interactions,
	hasTypescript = false,
	useNewTestSyntax = false,
}: {
	interactions: Interaction[];
	hasTypescript?: boolean;
	useNewTestSyntax?: boolean;
}): GeneratedCode => {
	const codeLines: GeneratedCodeLine[] = [];
	let usesBody = false;
	let usesCanvas = false;
	let needsExpect = false;

	for (const interaction of interactions) {
		const { event } = interaction;
		if (
			event.type === 'keyup' ||
			(event.type === 'keydown' && ['shift', 'tab'].includes(event.key))
		) {
			continue;
		}

		if (event.type === 'assertion') {
			needsExpect = true;

			const { queryString, asElementPostfix, warning } = getQueryString(
				interaction.elementQuery,
				hasTypescript,
			);

			let assertCode = `expect(${queryString.replace(asElementPostfix, '')})`
				.replace('await ', '')
				.replace('canvas.find', 'canvas.query');

			if (event.args && event.args.length > 0) {
				// Handle args for all assertion types
				assertCode += `.${event.assertionType}(${argsToString(event.args)})`;
			} else {
				// No args provided
				assertCode += `.${event.assertionType}()`;
			}

			if (interaction.elementQuery.object === 'body') {
				usesBody = true;
			}

			if (interaction.elementQuery.object === 'canvas') {
				usesCanvas = true;
			}

			codeLines.push({
				text: `await waitFor(() => ${assertCode})`,
				warning,
			});

			continue;
		}

		let beginning = `await userEvent.${EVENT_TO_USER_EVENT[event.type]}`;
		let { queryString, assertion, warning } = getQueryString(
			interaction.elementQuery,
			hasTypescript,
		);
		let valueStr = '';

		if (event.type === 'type') {
			if (event.value === '') {
				beginning = beginning.replace(EVENT_TO_USER_EVENT[event.type], 'clear');
				valueStr = '';
			} else {
				valueStr = `, ${wrapInQuotes(event.value)}`;
			}
		} else if (event.type === 'keydown') {
			queryString = '';
			assertion = null;
			warning = undefined;

			valueStr = `'${event.key}'`;
		} else if (event.type === 'select') {
			valueStr = `, [${event.options.map((option) => `'${option}'`).join(', ')}]`;
		} else if (event.type === 'upload') {
			valueStr = `, [${event.files.map((file) => `new File(['${file}'], '${file}')`).join(', ')}]`;
		} else if (event.type === 'focus') {
			beginning = beginning.replace('focus', 'tab');
			queryString = '';
			assertion = null;
			warning = undefined;
			valueStr = event.shift ? '{ shift: true }' : '';
		}

		if (queryString) {
			if (interaction.elementQuery.object === 'body') {
				usesBody = true;
			} else {
				usesCanvas = true;
			}
		}

		if (assertion) {
			codeLines.push({
				text: assertion,
				warning,
			});
			needsExpect = true;
		}
		codeLines.push({
			text: `${beginning}(${queryString}${valueStr});`,
			warning,
		});
	}

	if (!codeLines.length) {
		return useNewTestSyntax
			? {
					imports: [],
					parameters: [],
					tests: [],
				}
			: {
					imports: [],
					play: [],
				};
	}

	if (useNewTestSyntax) {
		const parameters: string[] = [];
		const importNames: string[] = [];

		// Add parameters based on what's used in the test
		if (usesCanvas || usesBody) {
			parameters.push('canvas');
		}
		// userEvent is needed for any user interactions or assertions
		if (
			usesBody ||
			usesCanvas ||
			needsExpect ||
			codeLines.some((line) => line.text.includes('userEvent.'))
		) {
			parameters.push('userEvent');
		}

		// Generate imports for new test syntax - only include expect and waitFor when needed
		if (needsExpect) {
			importNames.push('waitFor', 'expect');
		}

		const tests: GeneratedCodeLine[] = [];

		// Only add body constant if needed
		if (usesBody) {
			tests.push({
				text: 'const body = canvas.ownerDocument.body;',
			});
		}

		// Add test lines without canvas constant
		tests.push(
			...codeLines.map((codeLine) => ({
				text: codeLine.text,
				warning: codeLine.warning,
			})),
		);

		return {
			imports:
				importNames.length > 0
					? [
							{
								text: `import { ${importNames.join(', ')} } from 'storybook/test';`,
							},
						]
					: [],
			parameters,
			tests,
		};
	}

	const importNames = ['userEvent'];

	if (usesCanvas) {
		importNames.push('within');
	}

	// Always include waitFor and expect when we have assertions
	if (needsExpect || usesBody) {
		importNames.push('waitFor', 'expect');
	}

	const play: GeneratedCodeLine[] = [
		{
			text: 'play: async ({ canvasElement }) => {',
		},
	];

	if (usesBody) {
		play.push({
			text: tab('const body = canvasElement.ownerDocument.body;'),
		});
	}

	if (usesCanvas) {
		if (usesBody) {
			play.push({
				text: tab('const canvas = within(body);'),
			});
		} else {
			play.push({
				text: tab('const canvas = within(canvasElement.ownerDocument.body);'),
			});
		}
	}

	play.push(
		...codeLines.map((codeLine) => ({
			text: tab(codeLine.text),
			warning: codeLine.warning,
		})),
		{ text: '}' },
	);

	return {
		imports: [
			{
				text: `import { ${importNames.join(', ')} } from 'storybook/test';`,
			},
		],
		play,
	};
};

export const tab = (str: string) => `\t${str}`;

const getQueryString = (
	query: Interaction['elementQuery'],
	hasTypescript: boolean,
) => {
	const asElementPostfix = ' as HTMLElement';

	const beginning = `${query.object === 'canvas' ? 'await ' : ''}${query.object}.${query.method}`;
	const args = argsToString(query.args);

	let warning: Warning | undefined;

	if (query.method === 'querySelector') {
		warning = 'QUERY_SELECTOR';
	} else if (
		query.method.includes('ByRole') &&
		(!query.args[1] || !('name' in (query.args[1] as { name?: string })))
	) {
		warning = 'ROLE_WITHOUT_NAME';
	} else if (query.method.includes('ByTestId')) {
		warning = 'TEST_ID';
	}

	const asElement =
		query.object === 'body' && hasTypescript ? asElementPostfix : '';
	const queryString = `${beginning}(${args})${asElement}`;

	const result =
		query.nth === null ? queryString : `(${queryString})[${query.nth}]`;

	const queryStringWithoutAsElement = result.replace(asElement, '');

	const assertion =
		query.object === 'body'
			? `await waitFor(() => expect(${queryStringWithoutAsElement}).toBeInTheDocument());`
			: null;

	return {
		assertion,
		queryString: result,
		asElementPostfix,
		warning,
	};
};
