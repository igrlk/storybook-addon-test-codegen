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

export const Default = meta.story({});
