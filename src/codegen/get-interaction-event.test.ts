import { describe, expect, test } from 'vitest';
import { getInteractionEvent } from './get-interaction-event';

describe('getInteractionEvent', () => {
	test.each([
		['Unsupported event', new Event('unsupported'), null],
		['pointerdown', new Event('pointerdown'), { type: 'click' }],
		['dblclick', new Event('dblclick'), { type: 'dblclick' }],
		[
			'file upload',
			(() => {
				const inputElement = document.createElement('input');
				inputElement.type = 'file';
				inputElement.files = new FileList();
				inputElement.files[0] = new File(['content'], 'file.txt', {
					type: 'text/plain',
				});

				const event = new Event('input', { bubbles: true });
				Object.defineProperty(event, 'target', { value: inputElement });
				return event;
			})(),
			{ type: 'upload', files: ['file.txt'] },
		],
		[
			'range input',
			(() => {
				const inputElement = document.createElement('input');
				inputElement.type = 'range';
				inputElement.value = '42';

				const event = new Event('input', { bubbles: true });
				Object.defineProperty(event, 'target', { value: inputElement });
				return event;
			})(),
			{ type: 'type', value: '42' },
		],
		[
			'text input',
			(() => {
				const inputElement = document.createElement('input');
				inputElement.type = 'text';
				inputElement.value = 'hello';

				const event = new Event('input', { bubbles: true });
				Object.defineProperty(event, 'target', { value: inputElement });
				return event;
			})(),
			{ type: 'type', value: 'hello' },
		],
		[
			'select input',
			(() => {
				const selectElement = document.createElement('select');

				const option1 = document.createElement('option');
				option1.value = 'option1';

				const option2 = document.createElement('option');
				option2.value = 'option2';
				option2.selected = true;

				selectElement.appendChild(option1);
				selectElement.appendChild(option2);

				const event = new Event('input', { bubbles: true });
				Object.defineProperty(event, 'target', { value: selectElement });
				return event;
			})(),
			{ type: 'select', options: ['option2'] },
		],
		[
			'keydown for escape',
			new KeyboardEvent('keydown', { key: 'Escape' }),
			{ type: 'keydown', key: '{esc}' },
		],
		[
			'keydown for enter',
			(() => {
				const input = document.createElement('input');
				input.value = 'hello';

				const event = new KeyboardEvent('keydown', { key: 'Enter' });
				Object.defineProperty(event, 'target', { value: input });
				return event;
			})(),
			{ type: 'keydown', key: '{enter}' },
		],
		[
			'keydown for tab',
			(() => {
				const input = document.createElement('input');
				input.value = 'hello';

				const event = new KeyboardEvent('keydown', { key: 'Tab' });
				Object.defineProperty(event, 'target', { value: input });
				return event;
			})(),
			{ type: 'keydown', key: 'tab' },
		],
		[
			'keydown for shift',
			new KeyboardEvent('keydown', { key: 'Shift' }),
			{ type: 'keydown', key: 'shift' },
		],
		[
			'keydown for not allowed key',
			new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
			null,
		],
		[
			'keyup for shift',
			new KeyboardEvent('keyup', { key: 'Shift' }),
			{ type: 'keyup', key: 'shift' },
		],
		[
			'keyup for not allowed key',
			new KeyboardEvent('keyup', { key: 'ArrowLeft' }),
			null,
		],
		[
			'space keydown on checkbox',
			(() => {
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';

				const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
				Object.defineProperty(event, 'target', { value: checkbox });
				return event;
			})(),
			{ type: 'click' },
		],
		['focus', new FocusEvent('focus'), { type: 'focus', shift: false }],
	])('%s', (_, event, expected) => {
		expect(getInteractionEvent(event)).toEqual(expected);
	});
});
