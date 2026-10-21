import { loadCsf } from 'storybook/internal/csf-tools';
import { expect, test } from 'vitest';
import { describeFor } from './csf-tools-generation';
import { generateStoryCode } from './generate-story-code';
import type { GeneratedCode } from './interactions-to-code';
import { loadStorySaver } from './story-saver';

const TEST_CASES = [
	[
		'New story and new imports',
		{
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const NewStory: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story with spaces in name and some existing imports',
		{
			story: `import { userEvent } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const NewStory: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story and all existing imports',
		{
			story: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const NewStory: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'Existing story',
		{
			storyName: 'Default',
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--default',
		},
	],

	[
		'Pure javascript',
		{
			storyName: '!@#$%^&*() New Story1 2!@#$%^&*()',
			story: `import { Component } from './Component';

export default {
    component: Component
};

export const Default = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

export default {
    component: Component
};

export const Default = {};

export const NewStory12 = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--new-story-12',
		},
	],

	[
		'New story with args',
		{
			storyName: 'NewStory',
			args: JSON.stringify({
				hello: {
					world: {
						foo: 'bar',
						baz: [1, 2, { boo: 'bee' }],
					},
				},
			}),
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const NewStory: Story = {
    args: { hello: { world: { foo: 'bar', baz: [1, 2, { boo: 'bee' }] } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'Existing story with args',
		{
			storyName: 'Default',
			args: JSON.stringify({
				hello: {
					world: {
						foo: 'bar',
						baz: [1, 2, { boo: 'bee' }],
					},
				},
			}),
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    args: {
        existing: "existing value",
		someFunction: () => 42
    }
};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    args: {
        existing: "existing value",
		someFunction: () => 42,
		hello: { world: { foo: 'bar', baz: [1, 2, { boo: 'bee' }] } }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--default',
		},
	],
	[
		'New story without copying name',
		{
			storyName: 'NewStory',
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    name: "Default"
};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    name: "Default"
};

export const NewStory: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--new-story',
		},
	],
	[
		'Existing story with custom name',
		{
			storyName: 'My cool name',
			csfId: 'form--custom-name',
			story: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const CustomName: Story = {
    name: "My cool name"
};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const CustomName: Story = {
    name: "My cool name",
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--custom-name',
		},
	],
	[
		'Existing one-line story with args, below a header comment',
		{
			storyName: 'Primary',
			csfId: 'form--primary',
			args: JSON.stringify({ primary: false, label: 'Click' }),
			story: `// Stories for the button
import { Button } from './Button';

export default {
    component: Button
};

export const Primary = { args: { primary: true } };`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `// Stories for the button
import { Button } from './Button';
import { userEvent, within } from 'storybook/test';

export default {
    component: Button
};

export const Primary = {
    args: { primary: false, label: 'Click' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--primary',
		},
	],
	[
		'Existing story with a play function and a function arg',
		{
			storyName: 'Primary',
			csfId: 'form--primary',
			args: JSON.stringify({ onClick: '__sb_empty_function_arg__' }),
			story: `import { Button } from './Button';

export default {
    component: Button
};

export const Primary = {
    play: async () => {
        // recorded before
    },
};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Button } from './Button';
import { userEvent, within } from 'storybook/test';

export default {
    component: Button
};

export const Primary = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
    args: { onClick: () => {} },
};`,
			newStoryId: 'form--primary',
		},
	],
	[
		'New import after an import with a comment above it',
		{
			storyName: 'Default',
			csfId: 'form--default',
			story: `// @ts-expect-error untyped
import { Component } from './Component';

export default {
    component: Component
};

export const Default = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `// @ts-expect-error untyped
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

export default {
    component: Component
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--default',
		},
	],
	[
		'New import in a file with a Flow pragma',
		{
			storyName: 'Default',
			csfId: 'form--default',
			story: `// @flow
import { Component } from './Component';

type Props = { label: string };

export default {
    component: Component
};

export const Default = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `// @flow
import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

type Props = { label: string };

export default {
    component: Component
};

export const Default = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    },
};`,
			newStoryId: 'form--default',
		},
	],
	[
		'New story from a story whose removed name shares a line with code',
		{
			storyName: 'NewStory',
			csfId: 'form--default',
			story: `import { Component } from './Component';

export default {
    component: Component
};

export const Default = {
    render: () => null, // custom render
    name() { return { name: 'Default' }; } };`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Component } from './Component';
import { userEvent, within } from 'storybook/test';

export default {
    component: Component
};

export const Default = {
    render: () => null, // custom render
    name() { return { name: 'Default' }; } };

export const NewStory = {
    render: () => null, // custom render
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--new-story',
		},
	],
	[
		'Existing CSF2 story',
		{
			storyName: 'Primary',
			csfId: 'form--primary',
			args: JSON.stringify({
				label: 'Click',
				onClick: '__sb_empty_function_arg__',
			}),
			story: `import { Button } from './Button';

export default {
    component: Button
};

const Template = (args) => Button(args);

export const Primary = Template.bind({});
Primary.args = { label: 'Button' };`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Button } from './Button';
import { userEvent, within } from 'storybook/test';

export default {
    component: Button
};

const Template = (args) => Button(args);

export const Primary = Template.bind({});
Primary.args = { label: 'Click', onClick: () => {} };
Primary.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('button'));
};`,
			newStoryId: 'form--primary',
		},
	],
	[
		'Existing story that only spreads another, with args',
		{
			storyName: 'Primary',
			csfId: 'form--primary',
			args: JSON.stringify({ label: 'Click' }),
			story: `import { Button } from './Button';

export default {
    component: Button
};

const Base = { args: { primary: true } };

export const Primary = { ...Base };`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Button } from './Button';
import { userEvent, within } from 'storybook/test';

export default {
    component: Button
};

const Base = { args: { primary: true } };

export const Primary = {
    ...Base,
    args: { ...Base.args, label: 'Click' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--primary',
		},
	],
	[
		'New story with args from a story that spreads another',
		{
			csfId: 'form--secondary',
			args: JSON.stringify({ label: 'Click' }),
			story: `import { Button } from './Button';

export default {
    component: Button
};

export const Primary = { args: { primary: true } };

export const Secondary = { ...Primary, args: { primary: false } };`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Button } from './Button';
import { userEvent, within } from 'storybook/test';

export default {
    component: Button
};

export const Primary = { args: { primary: true } };

export const Secondary = { ...Primary, args: { primary: false } };

export const NewStory = {
    ...Primary,
    args: { ...Primary.args, label: 'Click' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--new-story',
		},
	],
	[
		'New story in a file without semicolons',
		{
			story: `import { Component } from './Component'

export default {
  component: Component
}

export const Default = {
  render: () => null,
}`,
			code: {
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { Component } from './Component'
import { userEvent, within } from 'storybook/test'

export default {
  component: Component
}

export const Default = {
  render: () => null,
}

export const NewStory = {
  render: () => null,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(await canvas.findByRole('button'))
  },
}`,
			newStoryId: 'form--new-story',
		},
	],
] satisfies [
	string,
	{
		storyName?: string;
		args?: string;
		story: string;
		code: GeneratedCode;
		result: string;
		newStoryId: string;
		csfId?: string;
	},
][];

describeFor('estree', 'generateStoryCode', () => {
	test.each(TEST_CASES)('%s', async (_, params) => {
		const { storyCode, newStoryId } = await generateStoryCode({
			saver: await loadStorySaver(),
			code: params.code,
			name: 'storyName' in params ? params.storyName : 'NewStory',
			args: 'args' in params ? params.args : '{}',
			csfId: 'csfId' in params ? params.csfId : 'form--default',
			csf: loadCsf(params.story, { makeTitle: () => 'story' }),
		});
		expect(storyCode).toBe(params.result);
		expect(newStoryId).toBe(params.newStoryId);
	});
});

const REFUSED_CASES = [
	[
		'New story from a function declaration',
		{
			csfId: 'form--primary',
			story: `export default { title: 'Button' };

export function Primary() {}
Primary.args = { label: 'Button' };`,
			error: 'Creating a new story based on a CSF2 story is not supported',
		},
	],
	[
		'New story from a function expression',
		{
			csfId: 'form--primary',
			story: `export default { title: 'Button' };

export const Primary = function () {};
Primary.args = { label: 'Button' };`,
			error: 'Creating a new story based on a CSF2 story is not supported',
		},
	],
	[
		'Story with two play functions',
		{
			storyName: 'Primary',
			csfId: 'form--primary',
			story: `export default { title: 'Button' };

export const Primary = { play: async () => {}, play: async () => {} };`,
			error: 'Cannot mutate play because the target contains duplicate field',
		},
	],
] satisfies [
	string,
	{ storyName?: string; csfId: string; story: string; error: string },
][];

describeFor('estree', 'generateStoryCode refuses', () => {
	test.each(REFUSED_CASES)('%s', async (_, params) => {
		await expect(
			generateStoryCode({
				saver: await loadStorySaver(),
				code: {
					imports: [],
					play: ['play: async () => {', '}'].map((text) => ({ text })),
				},
				name: 'storyName' in params ? params.storyName : 'NewStory',
				args: '{}',
				csfId: params.csfId,
				csf: loadCsf(params.story, { makeTitle: () => 'story' }),
			}),
		).rejects.toThrow(params.error);
	});
});
