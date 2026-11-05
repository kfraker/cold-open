import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

/** The WCAG 2.2 AA rule sets, including the A and AA rules carried over from 2.0 and 2.1. */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Records everything that should never happen on a page: uncaught JavaScript errors,
 * console errors, requests that fail, and responses with an error status.
 */
export function watchPage(page: Page): string[] {
	const problems: string[] = [];
	page.on('pageerror', (error) => problems.push(`JavaScript error: ${error.message}`));
	page.on('console', (message) => {
		if (message.type() === 'error') problems.push(`Console error: ${message.text()}`);
	});
	page.on('requestfailed', (request) =>
		problems.push(`Request failed: ${request.url()} (${request.failure()?.errorText})`)
	);
	page.on('response', (response) => {
		if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
	});
	return problems;
}

/** WCAG 2.2 AA violations on the page as it is now, one line per rule. */
export async function axeViolations(page: Page): Promise<string[]> {
	const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
	return violations.map((v) => `${v.id} (${v.impact}): ${v.help}, on ${v.nodes.length} element(s)`);
}

/**
 * Use this `test` in every browser test. When a test ends, it fails if the page had any
 * problem from `watchPage`, or any accessibility violation in its final state.
 * A test that has a reason to skip the accessibility check can set `test.use({ axe: false })`.
 */
export const test = base.extend<{ axe: boolean }>({
	axe: [true, { option: true }],
	page: async ({ page, axe }, use) => {
		const problems = watchPage(page);
		await use(page);
		expect(problems, 'The page had errors').toEqual([]);
		if (axe && page.url() !== 'about:blank') {
			expect(await axeViolations(page), 'Accessibility violations').toEqual([]);
		}
	}
});

export { expect };
