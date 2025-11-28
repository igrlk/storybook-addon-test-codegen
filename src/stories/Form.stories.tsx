import { userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview';
import { Form } from './Form';

const meta = preview.meta({
	component: Form,
	parameters: {
		testCodegen: {
			useNewTestSyntax: true,
		},
	},
});

export const Default = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement.ownerDocument.body);
		await userEvent.click(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
		);
		await userEvent.type(
			await canvas.findByRole('textbox', { name: 'Email Address' }),
			'asdasds',
		);
		await userEvent.tab();
		await userEvent.type(
			await canvas.findByPlaceholderText('Enter your username', { exact: true }),
			'asdsad',
		);
		await userEvent.keyboard('{esc}');
	},
});

Default.test('typed-test-name', async ({ canvas, userEvent }) => {
	await userEvent.click(
		await canvas.findByRole('textbox', {
			name: 'Email Address',
		}),
	);

	await userEvent.type(
		await canvas.findByRole('textbox', {
			name: 'Email Address',
		}),
		'asdasds',
	);

	await userEvent.tab();

	await userEvent.type(
		await canvas.findByPlaceholderText('Enter your username', {
			exact: true,
		}),
		'asdsad',
	);

	await userEvent.keyboard('{esc}');
});
