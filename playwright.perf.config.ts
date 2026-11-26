import { defineConfig, devices } from '@playwright/test';
import { E2E_SETTINGS } from './e2e/settings';

// The performance budget (story 0.9): the typing benchmark and Lighthouse, run with
// `npm run test:perf`. Chromium only (CPU slowdown and Lighthouse both need it), one test at a
// time so timings don't compete for the CPU, and no retries, like the browser tests.
export default defineConfig({
	testDir: 'perf',
	testMatch: '**/*.perf.ts',
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	timeout: 180_000,
	reporter: [[process.env.CI ? 'github' : 'list']],
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } }
		}
	],
	// The same production build and sandbox settings as the browser tests (playwright.config.ts).
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: false,
		env: E2E_SETTINGS
	},
	use: { baseURL: 'http://127.0.0.1:4173' }
});
