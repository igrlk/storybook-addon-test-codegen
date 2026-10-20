import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, test } from 'vitest';
import { generateStoryCode } from './generate-story-code';
import { loadStorySaver } from './story-saver';

// What `generateStoryCode` decides itself, on whichever csf-tools are
// installed: which story it edits and the id it reports. The exact output
// of each csf-tools generation is in `generate-story-code-babel.test.ts`
// and `generate-story-code-estree.test.ts`.

const story = `import type { Meta, StoryObj } from '@storybook/react-vite';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
    component: Component
};
export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const CustomName: Story = {
    name: 'My cool name',
};
`;

const save = async (name: string, csfId = 'form--default') =>
	generateStoryCode({
		saver: await loadStorySaver(),
		csf: loadCsf(story, { makeTitle: () => 'story' }),
		csfId,
		name,
		args: '{"label":"Go"}',
		code: {
			imports: [{ text: "import { userEvent } from 'storybook/test';" }],
			play: [
				{ text: 'play: async ({ canvasElement }) => {' },
				{ text: '\tawait userEvent.click(canvasElement);' },
				{ text: '}' },
			],
		},
	});

const exportsOf = (code: string) =>
	[...code.matchAll(/^export const (\w+)/gm)].map((match) => match[1]);

describe('generateStoryCode', () => {
	test('copies the story under a name made from the given one', async () => {
		const { storyCode, newStoryId } = await save('New fancy-story');
		expect(newStoryId).toBe('form--new-fancy-story');
		expect(exportsOf(storyCode)).toEqual([
			'Default',
			'CustomName',
			'NewFancyStory',
		]);
		expect(storyCode).toContain('userEvent.click(canvasElement)');
	});

	test('updates the story whose name property matches', async () => {
		const { storyCode, newStoryId } = await save(
			'My cool name',
			'form--custom-name',
		);
		expect(newStoryId).toBe('form--custom-name');
		expect(exportsOf(storyCode)).toEqual(['Default', 'CustomName']);
		expect(storyCode).toContain('userEvent.click(canvasElement)');
	});

	test('updates the story whose export name matches', async () => {
		const { storyCode, newStoryId } = await save('Default');
		expect(newStoryId).toBe('form--default');
		expect(exportsOf(storyCode)).toEqual(['Default', 'CustomName']);
	});

	test('rejects a source story the file does not have', async () => {
		await expect(save('NewStory', 'form--missing')).rejects.toThrow(
			'Source story not found.',
		);
	});
});
