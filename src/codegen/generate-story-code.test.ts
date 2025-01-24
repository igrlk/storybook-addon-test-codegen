import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, it } from 'vitest';
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
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
		},
	],

	[
		'Pure javascript',
		{
			storyName: '123New Story',
			story: `import { Component } from './Component';

export default {
    component: Component
};

export const Default = {};`,
			code: {
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
				],
			},
			result: `import { userEvent, within } from '@storybook/test';
import { Component } from './Component';

export default {
    component: Component
};

export const Default = {};

export const NewStory = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement.ownerDocument.body);
        await userEvent.click(await canvas.findByRole('button'));
    }
};`,
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
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
        existing: "existing value"
    }
};`,
			code: {
				imports: ["import { userEvent, within } from '@storybook/test';"],
				play: [
					'play: async ({ canvasElement }) => {',
					'\tconst canvas = within(canvasElement.ownerDocument.body);',
					"\tawait userEvent.click(await canvas.findByRole('button'));",
					'}',
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
	},
][];

describe('generate-story-code', () => {
	it.each(TEST_CASES)('%s', async (_, params) => {
		expect(
			await generateStoryCode({
				code: params.code,
				name: 'storyName' in params ? params.storyName : 'NewStory',
				args: 'args' in params ? params.args : '{}',
				csfId: 'form--default',
				csf: loadCsf(params.story, { makeTitle: () => 'story' }),
			}),
		).toBe(params.result);
	});
});
