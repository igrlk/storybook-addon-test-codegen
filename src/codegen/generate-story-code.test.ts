import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, test } from 'vitest';
import { generateStoryCode } from './generate-story-code';
import type { GeneratedCode } from './interactions-to-code';

type TestCase = {
	storyName?: string;
	args?: string;
	story: string;
	code: GeneratedCode;
	result: string;
	newStoryId: string;
	csfId?: string;
};

const hasArgs = (params: TestCase): params is TestCase & { args: string } => {
	return 'args' in params && typeof params.args === 'string';
};

const hasCsfId = (params: TestCase): params is TestCase & { csfId: string } => {
	return 'csfId' in params && typeof params.csfId === 'string';
};

const PLAY_TEST_CASES = [
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
    }
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
    }
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
    }
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
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
				imports: [{ text: "import { userEvent, within } from 'storybook/test';" }],
				play: [
					{ text: 'play: async ({ canvasElement }) => {' },
					{ text: '\tconst canvas = within(canvasElement.ownerDocument.body);' },
					{ text: "\tawait userEvent.click(await canvas.findByRole('button'));" },
					{ text: '}' },
				],
			},
			result: `import { userEvent, within } from 'storybook/test';
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
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
			result: `import { userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

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
] satisfies [string, TestCase][];

const TEST_SYNTAX_TEST_CASES = [
	[
		'New story and new imports with test syntax',
		{
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});`,
			code: {
				imports: [{ text: "import { waitFor, expect } from 'storybook/test';" }],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
					{
						text:
							"await waitFor(() => expect(canvas.queryByRole('button')).toBeInTheDocument());",
					},
				],
			},
			result: `import { waitFor, expect } from 'storybook/test';
import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});
export const NewStory = meta.story({});

NewStory.test("typed-test-name", async (
  {
    canvas,
    userEvent
  }
) => {
  const body = canvas.ownerDocument.body;
  await userEvent.click(await canvas.findByRole("button"));
  await waitFor(() => expect(canvas.queryByRole("button")).toBeInTheDocument());
});`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story with spaces in name and some existing imports with test syntax',
		{
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});`,
			code: {
				imports: [],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
				],
			},
			result: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});
export const NewStory = meta.story({});

NewStory.test("typed-test-name", async (
  {
    canvas,
    userEvent
  }
) => {
  const body = canvas.ownerDocument.body;
  await userEvent.click(await canvas.findByRole("button"));
});`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'New story and all existing imports with test syntax',
		{
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});`,
			code: {
				imports: [],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
				],
			},
			result: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});
export const NewStory = meta.story({});

NewStory.test("typed-test-name", async (
  {
    canvas,
    userEvent
  }
) => {
  const body = canvas.ownerDocument.body;
  await userEvent.click(await canvas.findByRole("button"));
});`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'Existing story with test syntax',
		{
			storyName: 'Default',
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});`,
			code: {
				imports: [],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
				],
			},
			result: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});

Default.test("typed-test-name", async (
  {
    canvas,
    userEvent
  }
) => {
  const body = canvas.ownerDocument.body;
  await userEvent.click(await canvas.findByRole("button"));
});`,
			newStoryId: 'form--default',
		},
	],

	[
		'New story with args and test syntax',
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
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});`,
			code: {
				imports: [],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
				],
			},
			result: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({});

export const NewStory = meta.story({
  args: {
    hello: {
      "world": {
        "foo": "bar",

        "baz": [1, 2, {
          "boo": "bee"
        }]
      }
    }
  }
});

NewStory.test("typed-test-name", async (
  {
    canvas,
    userEvent
  }
) => {
  const body = canvas.ownerDocument.body;
  await userEvent.click(await canvas.findByRole("button"));
});`,
			newStoryId: 'form--new-story',
		},
	],

	[
		'Existing story with args and test syntax',
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
			story: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({
    args: {
        existing: "existing value",
		someFunction: () => 42
    }
});`,
			code: {
				imports: [],
				parameters: ['canvas', 'userEvent'],
				tests: [
					{ text: 'const body = canvas.ownerDocument.body;' },
					{ text: "await userEvent.click(await canvas.findByRole('button'));" },
				],
			},
			result: `import preview from '../.storybook/preview';
import { Component } from './Component';

const meta = preview.meta({
  component: Component
});

export const Default = meta.story({
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
    }
});

Default.test("typed-test-name", async (
    {
        canvas,
        userEvent
    }
) => {
    const body = canvas.ownerDocument.body;
    await userEvent.click(await canvas.findByRole("button"));
});`,
			newStoryId: 'form--default',
		},
	],
] satisfies [string, TestCase][];

describe('generateStoryCode', () => {
	describe('Play function syntax', () => {
		test.each(PLAY_TEST_CASES)('%s', async (_, params) => {
			const { storyCode, newStoryId } = await generateStoryCode({
				code: params.code,
				name: 'storyName' in params ? params.storyName : 'NewStory',
				args: hasArgs(params) ? params.args : '{}',
				csfId: hasCsfId(params) ? params.csfId : 'form--default',
				csf: loadCsf(params.story, { makeTitle: () => 'story' }),
			});
			expect(storyCode).toBe(params.result);
			expect(storyCode).toMatchSnapshot();
			expect(newStoryId).toBe(params.newStoryId);
		});
	});

	describe('Test syntax', () => {
		test.each(TEST_SYNTAX_TEST_CASES)('%s', async (_, params) => {
			const { storyCode, newStoryId } = await generateStoryCode({
				code: params.code,
				name: 'storyName' in params ? params.storyName : 'NewStory',
				args: hasArgs(params) ? params.args : '{}',
				csfId: hasCsfId(params) ? params.csfId : 'form--default',
				csf: loadCsf(params.story, { makeTitle: () => 'story' }),
			});
			expect(storyCode).toBe(params.result);
			expect(storyCode).toMatchSnapshot();
			expect(newStoryId).toBe(params.newStoryId);
		});
	});
});
