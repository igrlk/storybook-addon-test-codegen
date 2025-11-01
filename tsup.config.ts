import { exec } from 'node:child_process';
import { type Options, defineConfig } from 'tsup';

import { globalPackages as globalManagerPackages } from 'storybook/internal/manager/globals';
import { globalPackages as globalPreviewPackages } from 'storybook/internal/preview/globals';

// The current browsers supported by Storybook v7
const BROWSER_TARGET: Options['target'] = [
	'chrome100',
	'safari15',
	'firefox91',
];
const NODE_TARGET: Options['target'] = ['node20'];

export default defineConfig(async (options) => {
	const packageJson = (
		await import('./package.json', { with: { type: 'json' } })
	).default;
	const {
		bundler: { managerEntries = [], previewEntries = [], nodeEntries = [] },
	} = packageJson;

	const commonConfig: Options = {
		/*
     keep this line commented until https://github.com/egoist/tsup/issues/1270 is resolved
     clean: options.watch ? false : true,
    */
		clean: false,
		format: ['esm'],
		treeshake: true,
		sourcemap: false,
		splitting: false,
		/*
     The following packages are provided by Storybook and should always be externalized
     Meaning they shouldn't be bundled with the addon, and they shouldn't be regular dependencies either
    */
		external: ['react', 'react-dom', '@storybook/icons'],
	};

	const configs: Options[] = [];

	// manager entries are entries meant to be loaded into the manager UI
	// they'll have manager-specific packages externalized and they won't be usable in node
	// they won't have types generated for them as they're usually loaded automatically by Storybook
	if (managerEntries.length) {
		configs.push({
			...commonConfig,
			entry: managerEntries,
			format: ['esm'],
			platform: 'browser',
			target: 'esnext',
			splitting: false, // Disable splitting to avoid hundreds of syntax highlighter chunks
		});
	}

	/*
   preview entries are entries meant to be loaded into the preview iframe
   they'll have preview-specific packages externalized and they won't be usable in node
   they'll have types generated for them so they can be imported by users when setting up Portable Stories or using CSF factories
  */
	if (previewEntries.length) {
		configs.push({
			...commonConfig,
			entry: previewEntries,
			platform: 'browser',
			target: 'esnext',
		});
	}

	// node entries are entries meant to be used in node-only
	// this is useful for presets, which are loaded by Storybook when setting up configurations
	// they won't have types generated for them as they're usually loaded automatically by Storybook
	if (nodeEntries.length) {
		configs.push({
			...commonConfig,
			entry: nodeEntries,
			platform: 'node',
			target: NODE_TARGET,
		});
	}

	if (options.watch && process.env.RUN_STORYBOOK) {
		configs.push({
			entry: [...managerEntries, ...previewEntries, ...nodeEntries],
			external: [...globalManagerPackages, ...globalPreviewPackages],
			async onSuccess() {
				const process = exec('pnpm storybook --no-open');

				return () => {
					process.kill();
				};
			},
		});
	}

	return configs;
});
