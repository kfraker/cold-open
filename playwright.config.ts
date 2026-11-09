import { defineConfig, devices } from '@playwright/test';

// Project names are the browser names used in e2e/flows.json. Keep the two in step.
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	forbidOnly: !!process.env.CI,
	// No retries: a test that only passes on a second try is a bug to find, not to hide.
	retries: 0,
	reporter: [
		[process.env.CI ? 'github' : 'list'],
		['html', { open: 'never' }],
		['./e2e/flow-reporter.ts']
	],
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'pixel-7', use: { ...devices['Pixel 7'] } },
		{ name: 'iphone-14', use: { ...devices['iPhone 14'] } }
	],
	// 127.0.0.1, not localhost: the preview server listened only on IPv6 (::1), and Firefox sometimes
	// tried IPv4 first and was refused, which failed about 1 test in 30.
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: !process.env.CI
	},
	use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' }
});
