import { describe, expect, test } from 'vitest';
import type { Interaction } from '../state';
import { combineInteractions } from './combine-interactions';

type TestInteraction = {
	elementQuery: Pick<
		Interaction['elementQuery'],
		'object' | 'method' | 'args'
	> & {
		nth?: Interaction['elementQuery']['nth'];
	};
	event: Interaction['event'];
};

const elementQuery: TestInteraction['elementQuery'] = {
	object: 'canvas',
	method: 'findByRole',
	args: ['button'],
};

const elementQuery2: TestInteraction['elementQuery'] = {
	object: 'body',
	method: 'querySelector',
	args: ['button'],
};

const TEST_CASES = [
	[
		'Double click removes 2 clicks',
		{
			elementQuery,
			event: { type: 'dblclick' },
		},
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'dblclick' },
			},
		],
	],
	[
		'Double click removes 2 clicks even if other events are in between',
		{
			elementQuery,
			event: { type: 'dblclick' },
		},
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'type', value: 'test' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'type', value: 'test' },
			},
			{
				elementQuery,
				event: { type: 'dblclick' },
			},
		],
	],
	[
		'Type replaces previous type event',
		{
			elementQuery,
			event: { type: 'type', value: 'test' },
		},
		[
			{
				elementQuery,
				event: { type: 'type', value: 'old' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'type', value: 'test' },
			},
		],
	],
	[
		'Type replaces previous type event even if shift key is in between',
		{
			elementQuery,
			event: { type: 'type', value: 'user@' },
		},
		[
			{
				elementQuery,
				event: { type: 'type', value: 'user' },
			},
			{
				elementQuery,
				event: { type: 'keydown', key: 'shift' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'type', value: 'user@' },
			},
			{
				elementQuery,
				event: { type: 'keydown', key: 'shift' },
			},
		],
	],
	[
		'Type doesnt replace previous type if it relates to different element',
		{
			elementQuery,
			event: { type: 'type', value: 'test' },
		},
		[
			{
				elementQuery: elementQuery2,
				event: { type: 'type', value: 'old' },
			},
		],
		[
			{
				elementQuery: elementQuery2,
				event: { type: 'type', value: 'old' },
			},
			{
				elementQuery,
				event: { type: 'type', value: 'test' },
			},
		],
	],
	[
		'Type doesnt replace previous type if there are other non-shift events in between',
		{
			elementQuery,
			event: { type: 'type', value: 'test' },
		},
		[
			{
				elementQuery,
				event: { type: 'type', value: 'old' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'type', value: 'old' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'type', value: 'test' },
			},
		],
	],
	[
		'Clicks are not combined',
		{
			elementQuery,
			event: { type: 'click' },
		},
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
	],
	[
		'Selects are not combined',
		{
			elementQuery,
			event: { type: 'select', options: ['test'] },
		},
		[
			{
				elementQuery,
				event: { type: 'select', options: ['old'] },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'select', options: ['old'] },
			},
			{
				elementQuery,
				event: { type: 'select', options: ['test'] },
			},
		],
	],
	[
		'File uploads are not combined',
		{
			elementQuery,
			event: { type: 'upload', files: ['test'] },
		},
		[
			{
				elementQuery,
				event: { type: 'upload', files: ['old'] },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'upload', files: ['old'] },
			},
			{
				elementQuery,
				event: { type: 'upload', files: ['test'] },
			},
		],
	],
	[
		'Keydowns are not combined',
		{
			elementQuery,
			event: { type: 'keydown', key: '{esc}' },
		},
		[
			{
				elementQuery,
				event: { type: 'keydown', key: '{enter}' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'keydown', key: '{enter}' },
			},
			{
				elementQuery,
				event: { type: 'keydown', key: '{esc}' },
			},
		],
	],
	[
		'Keyup shift removes keydown shift',
		{
			elementQuery,
			event: { type: 'keyup', key: 'shift' },
		},
		[
			{
				elementQuery,
				event: { type: 'keydown', key: 'shift' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
	],
	[
		'Focus removes keydown with key=tab',
		{
			elementQuery,
			event: { type: 'focus', shift: false },
		},
		[
			{
				elementQuery,
				event: { type: 'keydown', key: 'tab' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'focus', shift: false },
			},
		],
	],
	[
		'Focus removes keydown with key=tab even if other events are in between',
		{
			elementQuery,
			event: { type: 'focus', shift: false },
		},
		[
			{
				elementQuery,
				event: { type: 'keydown', key: 'tab' },
			},
			{
				elementQuery,
				event: { type: 'click' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'click' },
			},
			{
				elementQuery,
				event: { type: 'focus', shift: false },
			},
		],
	],
	[
		'Focus has shift: true if keydown shift is present',
		{
			elementQuery,
			event: { type: 'focus', shift: false },
		},
		[
			{
				elementQuery,
				event: { type: 'keydown', key: 'shift' },
			},
			{
				elementQuery,
				event: { type: 'keydown', key: 'tab' },
			},
		],
		[
			{
				elementQuery,
				event: { type: 'keydown', key: 'shift' },
			},
			{
				elementQuery,
				event: { type: 'focus', shift: true },
			},
		],
	],
] satisfies [string, TestInteraction, TestInteraction[], TestInteraction[]][];

const toFullInteraction = (testInteraction: TestInteraction): Interaction => ({
	elementQuery: {
		...testInteraction.elementQuery,
		nth: testInteraction.elementQuery.nth ?? null,
	},
	event: testInteraction.event,
});

describe('combineInteractions', () => {
	test.each(TEST_CASES)(
		'%s',
		(_, interaction, existingInteractions, expected) => {
			expect(
				combineInteractions(
					toFullInteraction(interaction),
					existingInteractions.map(toFullInteraction),
				),
			).toEqual(expected.map(toFullInteraction));
		},
	);
});
