import type { Interaction } from '../state';
import { argsToString, wrapInQuotes } from './generate-query';

const EVENT_TO_USER_EVENT = {
	click: 'click',
	dblclick: 'dblClick',
	keydown: 'keyboard',
	type: 'type',
	select: 'selectOptions',
	upload: 'upload',
	focus: 'focus',
};

export const convertInteractionsToCode = (
	interactions: Interaction[],
): {
	imports: string[];
	play: string[];
} => {
	const codeLines: string[] = [];
	let usesBody = false;
	let usesCanvas = false;

	for (const interaction of interactions) {
		const { event } = interaction;
		if (
			event.type === 'keyup' ||
			(event.type === 'keydown' && ['shift', 'tab'].includes(event.key))
		) {
			continue;
		}

		let beginning = `await userEvent.${EVENT_TO_USER_EVENT[event.type]}`;
		let { queryString, assertion } = getQueryString(interaction.elementQuery);
		let valueStr = '';

		if (event.type === 'type') {
			if (event.value === '') {
				beginning = beginning.replace(EVENT_TO_USER_EVENT[event.type], 'clear');
				valueStr = '';
			} else {
				const isMultiLine = event.value.includes('\n');
				valueStr = `, ${wrapInQuotes(isMultiLine ? event.value : event.value.replace("'", "\\'"))}`;
			}
		} else if (event.type === 'keydown') {
			queryString = '';
			assertion = null;

			valueStr = `'${event.key}'`;
		} else if (event.type === 'select') {
			valueStr = `, [${event.options.map((option) => `'${option}'`).join(', ')}]`;
		} else if (event.type === 'upload') {
			valueStr = `, [${event.files.map((file) => `new File(['${file}'], '${file}')`).join(', ')}]`;
		} else if (event.type === 'focus') {
			beginning = beginning.replace('focus', 'tab');
			queryString = '';
			assertion = null;
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
			codeLines.push(assertion);
		}
		codeLines.push(`${beginning}(${queryString}${valueStr});`);
	}

	if (!codeLines.length) {
		return {
			imports: [],
			play: [],
		};
	}

	const importNames = ['userEvent'];

	if (usesCanvas) {
		importNames.push('within');
	}

	if (usesBody) {
		importNames.push('waitFor', 'expect');
	}

	const play = ['play: async ({ canvasElement }) => {'];

	if (usesBody) {
		play.push(tab('const body = canvasElement.ownerDocument.body;'));
	}

	if (usesCanvas) {
		if (usesBody) {
			play.push(tab('const canvas = within(body);'));
		} else {
			play.push(tab('const canvas = within(canvasElement.ownerDocument.body);'));
		}
	}

	play.push(...codeLines.map(tab), '}');

	return {
		imports: [`import { ${importNames.join(', ')} } from '@storybook/test';`],
		play,
	};
};

export const tab = (str: string) => `\t${str}`;

const getQueryString = (query: Interaction['elementQuery']) => {
	const beginning = `${query.object === 'canvas' ? 'await ' : ''}${query.object}.${query.method}`;
	const args = argsToString(query.args);

	const asElement = query.object === 'body' ? ' as HTMLElement' : '';
	const queryString = `${beginning}(${args})${asElement}`;

	const result =
		query.nth === null ? queryString : `(${queryString})[${query.nth}]`;

	const assertion =
		query.object === 'body'
			? `await waitFor(() => expect(${result.replace(asElement, '')}).toBeInTheDocument());`
			: null;

	return {
		assertion,
		queryString: result,
	};
};
