import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

/** The WCAG 2.2 AA rule sets, including the A and AA rules carried over from 2.0 and 2.1. */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * How each browser reports a request it cancelled on purpose, for example because the page
 * navigated away while it was in flight. That's normal, not a failure. Measured in story 0.5:
 * Chromium `net::ERR_ABORTED`, Firefox `NS_BINDING_ABORTED` or `NS_ERROR_ABORT`, WebKit
 * `Load request cancelled`.
 */
const CANCELLED = /ERR_ABORTED|NS_BINDING_ABORTED|NS_ERROR_ABORT|cancelled/i;

/**
 * Records everything that should never happen on a page: uncaught JavaScript errors,
 * console errors, requests that fail, and responses with an error status.
 */
export function watchPage(page: Page): string[] {
	const problems: string[] = [];
	page.on('pageerror', (error) => problems.push(`JavaScript error: ${error.message}`));
	page.on('console', (message) => {
		// Chromium and WebKit also log every error response and failed request to the console.
		// The handlers below already record those, with the address, so this would only repeat them.
		if (message.type() === 'error' && !message.text().startsWith('Failed to load resource'))
			problems.push(`Console error: ${message.text()}`);
	});
	page.on('requestfailed', (request) => {
		const reason = request.failure()?.errorText ?? 'unknown';
		if (!CANCELLED.test(reason)) problems.push(`Request failed: ${request.url()} (${reason})`);
	});
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

interface Options {
	/** Run the accessibility check when the test ends. */
	axe: boolean;
	/**
	 * Problems this test expects, such as the 403 when a refused sign-in is the point of the
	 * test. Each pattern is matched against a problem line, for example `/^HTTP 403: /`.
	 * Keep them as narrow as the test allows.
	 */
	expectedProblems: RegExp[];
}

/**
 * Use this `test` in every browser test of the app. When a test ends, it fails if the page had
 * any problem from `watchPage`, or any accessibility violation in its final state.
 * - A test that has a reason to skip the accessibility check can set `test.use({ axe: false })`.
 * - A test that expects a problem lists it: `test.use({ expectedProblems: [/^HTTP 403: /] })`.
 */
export const test = base.extend<Options>({
	axe: [true, { option: true }],
	expectedProblems: [[], { option: true }],
	page: async ({ page, axe, expectedProblems }, use) => {
		const problems = watchPage(page);
		await use(page);
		const unexpected = problems.filter((p) => !expectedProblems.some((e) => e.test(p)));
		expect(unexpected, 'The page had errors').toEqual([]);
		if (axe && page.url() !== 'about:blank') {
			expect(await axeViolations(page), 'Accessibility violations').toEqual([]);
		}
	}
});

export { expect };
