import { expect, test } from '@playwright/test';
import { chromium } from 'playwright';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { PAGES } from './budget';
import { ms, report } from './summary';

// Lighthouse on its default mobile settings (a mid-range phone on a slow 4G connection,
// simulated) checks each page against its budget in perf/budget.ts (story 0.9). It runs the same
// Chromium that Playwright installs, against the production build the browser tests use.
// Each page is measured three times and the middle result used, as Lighthouse recommends,
// because a single run varies.

const RUNS = 3;

interface Measurement {
	lcpMs: number;
	tbtMs: number;
	scriptKb: number;
	totalKb: number;
	performanceScore: number;
}

function median(values: number[]): number {
	return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

test('every page loads within its budget on mobile settings', async ({ baseURL }) => {
	const chrome = await launch({
		chromePath: chromium.executablePath(),
		chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
	});
	const results: Record<string, Measurement & { budget: (typeof PAGES)[number] }> = {};
	try {
		for (const budget of PAGES) {
			const runs: Measurement[] = [];
			for (let i = 0; i < RUNS; i++) {
				const result = await lighthouse(new URL(budget.path, baseURL).href, {
					port: chrome.port,
					onlyCategories: ['performance'],
					output: 'json',
					logLevel: 'error'
				});
				if (!result) throw new Error(`Lighthouse returned nothing for ${budget.path}`);
				const { audits, categories, runtimeError } = result.lhr;
				if (runtimeError)
					throw new Error(`Lighthouse failed on ${budget.path}: ${runtimeError.message}`);
				const items = (
					audits['resource-summary'].details as unknown as {
						items: { resourceType: string; transferSize: number }[];
					}
				).items;
				const bytes = (type: string) =>
					items.find((item) => item.resourceType === type)?.transferSize ?? 0;
				runs.push({
					lcpMs: audits['largest-contentful-paint'].numericValue ?? NaN,
					tbtMs: audits['total-blocking-time'].numericValue ?? NaN,
					scriptKb: bytes('script') / 1024,
					totalKb: bytes('total') / 1024,
					performanceScore: Math.round((categories.performance.score ?? 0) * 100)
				});
			}
			results[budget.path] = {
				lcpMs: median(runs.map((r) => r.lcpMs)),
				tbtMs: median(runs.map((r) => r.tbtMs)),
				scriptKb: median(runs.map((r) => r.scriptKb)),
				totalKb: median(runs.map((r) => r.totalKb)),
				performanceScore: median(runs.map((r) => r.performanceScore)),
				budget
			};
		}
	} finally {
		await chrome.kill();
	}

	const over = Object.entries(results).flatMap(([path, r]) => [
		...(r.lcpMs > r.budget.lcpMs
			? [`${path}: Largest Contentful Paint ${ms(r.lcpMs)}, over ${ms(r.budget.lcpMs)}`]
			: []),
		...(r.tbtMs > r.budget.tbtMs
			? [`${path}: Total Blocking Time ${ms(r.tbtMs)}, over ${ms(r.budget.tbtMs)}`]
			: []),
		...(r.scriptKb > r.budget.scriptKb
			? [`${path}: JavaScript ${r.scriptKb.toFixed(1)} KB, over ${r.budget.scriptKb} KB`]
			: [])
	]);

	const cell = (value: string, limit: string, ok: boolean) =>
		`${ok ? '' : '**'}${value}${ok ? '' : '** ✗'} (limit ${limit})`;
	report(
		'lighthouse',
		[
			`## Page load: ${over.length === 0 ? 'within budget' : '**over budget**'}`,
			'',
			`Lighthouse ${RUNS} runs per page on mobile settings (simulated mid-range phone on slow 4G); the middle result of each.`,
			'',
			'| Page | Largest Contentful Paint | Total Blocking Time | JavaScript (gzipped) | Everything (gzipped) | Lighthouse score |',
			'|---|---|---|---|---|---|',
			...Object.entries(results).map(
				([path, r]) =>
					`| \`${path}\` | ${cell(ms(r.lcpMs), ms(r.budget.lcpMs), r.lcpMs <= r.budget.lcpMs)} | ${cell(ms(r.tbtMs), ms(r.budget.tbtMs), r.tbtMs <= r.budget.tbtMs)} | ${cell(`${r.scriptKb.toFixed(1)} KB`, `${r.budget.scriptKb} KB`, r.scriptKb <= r.budget.scriptKb)} | ${r.totalKb.toFixed(1)} KB | ${r.performanceScore} |`
			)
		].join('\n'),
		results
	);

	expect(over, 'Pages over their performance budget').toEqual([]);
});
