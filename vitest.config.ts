import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		exclude: [...defaultExclude, 'e2e/**/*'],
	},
});
