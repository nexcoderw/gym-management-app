import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'server-only': fileURLToPath(new URL('./test/server-only.ts', import.meta.url)),
		},
	},
	test: {
		env: {
			GYM_API_BASE_URL: 'https://api.manager.test',
			MANAGER_ORIGIN: 'https://manager.test',
		},
		environment: 'node',
		include: ['test/**/*.test.{ts,tsx}'],
		restoreMocks: true,
	},
});
