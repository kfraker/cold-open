import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'bench',
	timeout: 600_000,
	workers: 1, // one browser at a time, so timings don't compete for the CPU
	reporter: [['list']],
	use: { baseURL: 'http://localhost:4317', viewport: { width: 1280, height: 900 } },
	webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4317', reuseExistingServer: true, timeout: 120_000 },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } } }
	]
});
