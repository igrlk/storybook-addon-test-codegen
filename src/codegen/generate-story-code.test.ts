import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, test } from 'vitest';
import { generateStoryCode } from './generate-story-code';
import type { GeneratedCode } from './interactions-to-code';

const TEST_CASES = [
	[
		'New story and new imports',
		{
			story: `import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
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
    }
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story with spaces in name and some existing imports',
		{
			story: `import { userEvent } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
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
    }
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story and all existing imports',
		{
			story: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
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
    }
};`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'Existing story',
		{
			storyName: 'Default',
			story: `import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
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
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import { Component } from './Component';

export default {
    component: Component
};

export const Default = {};

export const NewStory12 = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
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
			story: `import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const NewStory: Story = {
    args: {
        hello: {
            "world": {
                "foo": "bar",

                "baz": [1, 2, {
                    "boo": "bee"
                }]
            }
        }
    },

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
			story: `import type { Meta, StoryObj } from '@storybook/react';
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
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    args: {
        existing: "existing value",
        someFunction: () => 42,

        hello: {
            "world": {
                "foo": "bar",

                "baz": [1, 2, {
                    "boo": "bee"
                }]
            }
        }
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
			story: `import type { Meta, StoryObj } from '@storybook/react';
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
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

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
    }
};`,
			newStoryId: 'form--new-story',
		},
	],
	[
		'Existing story with custom name',
		{
			storyName: 'CustomName',
			story: `import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    name: "CustomName"
};`,
			code: {
				imports: [{ text: "import { userEvent, within } from '@storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
    name: "CustomName",

    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
			newStoryId: 'form--customname',
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
	},
][];

describe('generateStoryCode', () => {
	test.each(TEST_CASES)('%s', async (_, params) => {
		const { storyCode, newStoryId } = await generateStoryCode({
			code: params.code,
			name: 'storyName' in params ? params.storyName : 'NewStory',
			args: 'args' in params ? params.args : '{}',
			csfId: 'form--default',
			csf: loadCsf(params.story, { makeTitle: () => 'story' }),
		});
		expect(storyCode).toBe(params.result);
		expect(newStoryId).toBe(params.newStoryId);
	});
});
