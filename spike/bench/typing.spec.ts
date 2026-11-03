import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

type Stats = {
	keystrokes: number;
	p50: number;
	p95: number;
	max: number;
	layoutP95: number;
	layoutMax: number;
	slowEventCount: number;
	slowEventMax: number;
	pages: number;
};

const PAGES = Number(process.env.PAGES ?? 150);
const VARIANT = process.env.VARIANT ?? ''; // '', 'cv=1' or 'nobreaks=1'
const TEXT = 'She waits by the door, keys in hand. Nobody comes. ';

async function typeAt(page: Page, fraction: number) {
	await page.evaluate((f) => (window as any).__spike.cursorAt(f), fraction);
	await page.evaluate(() => (window as any).__spike.reset());
	// 100 characters of typing at ~30 ms per key (faster than most people type),
	// plus two Enters to create new elements.
	await page.keyboard.type(TEXT + TEXT.slice(0, 49), { delay: 30 });
	await page.keyboard.press('Enter');
	await page.keyboard.type('MAREN', { delay: 30 });
	await page.keyboard.press('Enter');
	await page.keyboard.type('Not tonight.', { delay: 30 });
	await page.waitForTimeout(300);
	return (await page.evaluate(() => (window as any).__spike.stats())) as Stats;
}

async function run(page: Page, label: string, browserName: string) {
	await page.goto(`/?pages=${PAGES}&${VARIANT}`);
	await page.waitForFunction(() => document.querySelectorAll('.el').length > 1000 || (window as any).__spike);
	const loaded = await page.evaluate((n) => (window as any).__spike.load(n), PAGES);
	const mism = await page.evaluate(() => (window as any).__spike.mismatches());
	const results: Record<string, unknown> = { label, browser: browserName, loaded, wrapMismatches: mism };
	for (const [name, f] of [
		['start', 0.02],
		['middle', 0.5],
		['end', 0.98]
	] as const) {
		results[name] = await typeAt(page, f);
	}
	mkdirSync('results', { recursive: true });
	writeFileSync(`results/${label}.json`, JSON.stringify(results, null, 2));
	console.log(JSON.stringify(results));
	return results;
}

test('typing latency in a long script', async ({ page, browserName }) => {
	const r = await run(page, browserName, browserName);
	expect((r.wrapMismatches as { badCount: number }).badCount).toBe(0);
});

test('typing latency with 4x CPU slowdown (Chromium only)', async ({ page, browserName }) => {
	test.skip(browserName !== 'chromium', 'CPU throttling needs the Chrome DevTools Protocol');
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.RATE ?? 4) });
	await run(page, `chromium-4x${VARIANT ? '-' + VARIANT.split('=')[0] : ''}`, browserName);
});
