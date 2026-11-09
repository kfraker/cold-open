// Story 0.8: it's always clear which database is in use, and wrong settings stop the app.
import { spawn } from 'node:child_process';
import { expect, test } from './fixtures';
import { E2E_SETTINGS } from './settings';

const PRODUCTION_URL = E2E_SETTINGS.DATABASE_URL.replace('cold_open_sandbox', 'cold_open');

test('the sandbox shows a SANDBOX badge', async ({ page }) => {
	await page.goto('/');
	const badge = page.getByTestId('sandbox-badge');
	await expect(badge).toBeVisible();
	await expect(badge).toHaveText('SANDBOX Test data only, not real scripts');
});

/**
 * Starts the built app with the given settings, and returns everything it printed, plus the home
 * page's HTML if it started. The settings fully replace the test ones, and an empty value
 * overrides a local .env, so it counts as missing. The system picks a free port, and the address
 * comes from the app's own output, so a test can never reach some other server by mistake.
 */
async function startWith(settings: Record<string, string>): Promise<{
	html?: string;
	output: string;
}> {
	const child = spawn(
		process.execPath,
		['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '0'],
		{
			// NO_COLOR keeps colour codes out of the output, so the address can be read from it.
			env: {
				...process.env,
				NO_COLOR: '1',
				APP_ENV: '',
				DATABASE_URL: '',
				VERCEL_ENV: '',
				...settings
			},
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);
	let output = '';
	child.stdout.on('data', (chunk) => (output += chunk));
	child.stderr.on('data', (chunk) => (output += chunk));
	const exited = new Promise<void>((resolve) => child.on('exit', () => resolve()));
	try {
		const deadline = Date.now() + 30_000;
		while (Date.now() < deadline) {
			// The address Vite prints once it's listening.
			const address = output.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
			if (address) return { html: await (await fetch(address)).text(), output };
			if (child.exitCode !== null || child.signalCode !== null) return { output };
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		throw new Error(`The app neither started nor stopped within 30 seconds:\n${output}`);
	} finally {
		if (child.exitCode === null && child.signalCode === null) child.kill();
		await exited;
	}
}

// These start the app themselves rather than use a browser, so they run once, not per browser.
test.describe('startup settings', () => {
	test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'runs once');
	// Each starts a server, which takes a few seconds on a busy CI runner.
	test.describe.configure({ timeout: 60_000 });

	test('missing settings stop the app with a clear message', async () => {
		const { html, output } = await startWith({});
		expect(html, output).toBeUndefined();
		expect(output).toContain('APP_ENV\n  - Missing. Set it to sandbox or production.');
		expect(output).toContain('DATABASE_URL\n  - Missing. Run `npm run db:paste-url`');
	});

	test('a sandbox given the production database refuses to start', async () => {
		const { html, output } = await startWith({ APP_ENV: 'sandbox', DATABASE_URL: PRODUCTION_URL });
		expect(html, output).toBeUndefined();
		expect(output).toContain(
			'APP_ENV is sandbox, so it must use the cold_open_sandbox database, not cold_open.'
		);
	});

	test('a Vercel preview set up as production refuses to start', async () => {
		const { html, output } = await startWith({
			VERCEL_ENV: 'preview',
			APP_ENV: 'production',
			DATABASE_URL: PRODUCTION_URL
		});
		expect(html, output).toBeUndefined();
		expect(output).toContain(
			'this is a Vercel preview deployment, so it must be sandbox, not production.'
		);
	});

	test('production starts without the SANDBOX badge', async () => {
		const { html, output } = await startWith({
			APP_ENV: 'production',
			DATABASE_URL: PRODUCTION_URL
		});
		expect(html, output).toContain('<h1>Cold Open</h1>');
		expect(html).not.toContain('sandbox-badge');
	});
});
