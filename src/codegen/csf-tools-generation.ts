// Test helpers: which csf-tools the installed Storybook has, and a `describe`
// for tests of one of them. Not part of the addon's build.
import { describe } from 'vitest';

const csfTools = await import('storybook/internal/csf-tools');

/**
 * Picked the way `loadStorySaver` picks: ESTree when csf-tools have
 * `parseModule` (storybookjs/storybook#36613), Babel otherwise (Storybook
 * 10, and 11 prereleases without #36613).
 */
export const csfToolsGeneration: 'babel' | 'estree' =
	'parseModule' in csfTools && typeof csfTools.parseModule === 'function'
		? 'estree'
		: 'babel';

const needs = {
	babel: 'the Babel csf-tools: Storybook 10, or 11 without #36613',
	estree: 'the ESTree csf-tools of storybookjs/storybook#36613',
};

/** `describe` that runs on one csf-tools generation and is skipped, with the reason, on the other. */
export const describeFor = (
	generation: 'babel' | 'estree',
	name: string,
	fn: () => void,
) =>
	generation === csfToolsGeneration
		? describe(name, fn)
		: describe.skip(`${name} (needs ${needs[generation]})`, fn);
