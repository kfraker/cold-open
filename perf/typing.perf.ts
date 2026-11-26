import { expect, test, type Page } from '@playwright/test';
import { watchPage } from '../e2e/fixtures';
import { SLOW_CPU_RATE, TYPING_P95_MS, TYPING_PAGES } from './budget';
import { ms, report } from './summary';

// The typing benchmark (story 0.9), built from spike 0.S's. It types into a 150-page script at
// the start, middle and end, and measures each keystroke to the next screen paint.
// - Chromium at full speed fails the build when the 95th percentile is over the budget.
// - The same run with the CPU 4× slower (a budget laptop or mid-range phone) is reported in the
//   run summary, not enforced, as decided after the spike.

interface Stats {
	keystrokes: number;
	p50: number;
	p95: number;
	max: number;
	samples: number[];
}

const SENTENCE = 'She waits by the door, keys in hand. Nobody comes. ';
const POSITIONS = [
	['start', 0.02],
	['middle', 0.5],
	['end', 0.98]
] as const;

/** One key every 30 ms: faster than most people type, as in the spike. */
const KEY_DELAY_MS = 30;

async function typeAt(page: Page, fraction: number): Promise<Stats> {
	await page.evaluate((f) => window.__typingBench.cursorAt(f), fraction);
	await page.evaluate(() => window.__typingBench.reset());
	// About 100 characters, then two Enters that create a character cue and a speech.
	await page.keyboard.type(SENTENCE + SENTENCE.slice(0, 49), { delay: KEY_DELAY_MS });
	await page.keyboard.press('Enter');
	await page.keyboard.type('MAREN', { delay: KEY_DELAY_MS });
	await page.keyboard.press('Enter');
	await page.keyboard.type('Not tonight.', { delay: KEY_DELAY_MS });
	// Let the last keystroke's paint be measured.
	await page.waitForTimeout(300);
	return page.evaluate(() => window.__typingBench.stats());
}

function percentile(values: number[], p: number): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

async function run(page: Page) {
	await page.goto(`/bench/typing?pages=${TYPING_PAGES}`);
	await expect(page.getByTestId('bench-status')).toContainText('loaded in', { timeout: 60_000 });
	const loadMs = await page.evaluate(() => window.__typingBench.loadMs);
	const positions: Record<string, Stats> = {};
	for (const [name, fraction] of POSITIONS) positions[name] = await typeAt(page, fraction);
	const all = Object.values(positions).flatMap((s) => s.samples);
	return {
		loadMs,
		keystrokes: all.length,
		p50: percentile(all, 0.5),
		p95: percentile(all, 0.95),
		max: percentile(all, 1),
		// Each position's figures, without its raw samples (all are kept above, combined).
		positions: Object.fromEntries(
			Object.entries(positions).map(([name, s]) => [
				name,
				{ keystrokes: s.keystrokes, p50: s.p50, p95: s.p95, max: s.max }
			])
		),
		samples: all
	};
}

type Run = Awaited<ReturnType<typeof run>>;

function row(label: string, r: Run, limit: string) {
	const where = POSITIONS.map(([name]) => ms(r.positions[name].p95)).join(' / ');
	return `| ${label} | ${ms(r.p50)} | **${ms(r.p95)}** | ${ms(r.max)} | ${where} | ${ms(r.loadMs)} | ${limit} |`;
}

test('typing stays within budget in a 150-page script', async ({ browser }) => {
	const fast = await browser.newPage();
	const fastProblems = watchPage(fast);
	const full = await run(fast);
	await fast.close();

	const slow = await browser.newPage();
	const slowProblems = watchPage(slow);
	const cdp = await slow.context().newCDPSession(slow);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW_CPU_RATE });
	const throttled = await run(slow);
	await slow.close();

	const passed = full.p95 <= TYPING_P95_MS;
	report(
		'typing',
		[
			`## Typing speed: ${passed ? 'within budget' : '**over budget**'}`,
			'',
			`Keystroke to next paint in a ${TYPING_PAGES}-page script, typing at the start, middle and end (${full.keystrokes} keystrokes per run).`,
			'',
			'| Chromium | 50th percentile | 95th percentile | Worst | 95th at start / middle / end | Script load | Limit |',
			'|---|---|---|---|---|---|---|',
			row('Full speed', full, `${TYPING_P95_MS} ms at the 95th percentile (enforced)`),
			row(`CPU ${SLOW_CPU_RATE}× slower`, throttled, 'Reported, not enforced')
		].join('\n'),
		{ budgetP95Ms: TYPING_P95_MS, pages: TYPING_PAGES, full, throttled }
	);

	expect([...fastProblems, ...slowProblems], 'The page had errors').toEqual([]);
	// About 119 keys at each of the three positions. Too few means the measuring broke.
	expect(full.keystrokes, 'Keystrokes measured').toBeGreaterThanOrEqual(3 * 100);
	expect(
		full.p95,
		`Typing at full speed: 95th percentile over the ${TYPING_P95_MS} ms budget`
	).toBeLessThanOrEqual(TYPING_P95_MS);
});
