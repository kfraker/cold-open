// Proves the checks every browser test relies on: each one must catch the problem it's for.
// Most use Playwright's plain `test`, so the checks can be observed without failing the test.
import { expect, test } from '@playwright/test';
import { axeViolations, test as appTest, watchPage } from './fixtures';

test('a JavaScript error is caught', async ({ page }) => {
	const problems = watchPage(page);
	await page.goto('/');
	await Promise.all([
		page.waitForEvent('pageerror'),
		page.evaluate(() =>
			setTimeout(() => {
				throw new Error('deliberate');
			})
		)
	]);
	expect(problems).toContain('JavaScript error: deliberate');
});

test('a console error is caught', async ({ page }) => {
	const problems = watchPage(page);
	await page.goto('/');
	await page.evaluate(() => console.error('deliberate'));
	await expect.poll(() => problems).toContain('Console error: deliberate');
});

test('an error response is caught', async ({ page }) => {
	const problems = watchPage(page);
	await page.goto('/');
	await page.evaluate(() => fetch('/no-such-page').catch(() => {}));
	await expect.poll(() => problems.some((p) => p.startsWith('HTTP 404:'))).toBe(true);
});

test('a failed request is caught', async ({ page }) => {
	const problems = watchPage(page);
	await page.goto('/');
	await page.route('**/deliberately-blocked', (route) => route.abort());
	await page.evaluate(() => fetch('/deliberately-blocked').catch(() => {}));
	await expect.poll(() => problems.some((p) => p.startsWith('Request failed:'))).toBe(true);
});

test('a request cancelled by navigating away is not a problem', async ({ page }) => {
	const problems = watchPage(page);
	// Waits until the app's code has loaded. Leaving while it's still loading makes WebKit report
	// "Importing a module script failed", a real error the check rightly catches.
	await page.goto('/', { waitUntil: 'networkidle' });
	// Holds the request open, so it's still in flight when the page navigates away.
	await page.route('**/slow-request', () => new Promise(() => {}));
	await Promise.all([
		page.waitForRequest('**/slow-request'),
		page.evaluate(() => void fetch('/slow-request').catch(() => {}))
	]);
	await page.goto('/?again');
	expect(problems).toEqual([]);
});

test('an accessibility violation is caught', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => {
		const img = document.createElement('img');
		img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
		// Outside the app's root element: if the page is still hydrating, Svelte removes elements
		// it didn't render inside its root, which made this test pass or fail by timing.
		document.body.append(img);
	});
	expect(await axeViolations(page)).toEqual([expect.stringMatching(/^image-alt /)]);
});

appTest.describe('a problem the test expects', () => {
	appTest.use({ expectedProblems: [/^HTTP 404: .*\/expected-missing$/] });

	appTest('does not fail the test', async ({ page }) => {
		await page.goto('/');
		const status = await page.evaluate(() => fetch('/expected-missing').then((r) => r.status));
		expect(status).toBe(404);
	});
});
