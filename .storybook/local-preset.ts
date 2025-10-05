import { fileURLToPath } from 'node:url';
import { experimental_serverChannel } from '../dist/preset.js';

/**
 * to load the built addon in this test Storybook
 */
export function previewAnnotations(entry = []) {
	return [...entry, fileURLToPath(import.meta.resolve('../dist/preview.js'))];
}

export function managerEntries(entry = []) {
	return [...entry, fileURLToPath(import.meta.resolve('../dist/manager.js'))];
}

// TODO: Fix this later
export { experimental_serverChannel };
