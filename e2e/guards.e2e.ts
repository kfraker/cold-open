// Proves the checks every browser test relies on: each one must catch the problem it's for.
// These use Playwright's plain `test`, so the checks can be observed without failing the test.
import { expect, test } from '@playwright/test';
import { axeViolations, watchPage } from './fixtures';

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
