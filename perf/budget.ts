// The performance budget's limits (story 0.9), from docs/nfr.md. Tightening one is a normal
// change. Loosening one needs a decision log entry saying why, as nfr.md requires.

/** Keystroke to next paint, 95th percentile, Chromium at full speed (enforced). */
export const TYPING_P95_MS = 50;

/** The script the typing benchmark types into, in pages. */
export const TYPING_PAGES = 150;

/** CPU slowdown for the reported, not enforced, slow-device run. */
export const SLOW_CPU_RATE = 4;

export interface PageBudget {
	/** Address on the app. */
	path: string;
	/** Largest Contentful Paint, on Lighthouse's mobile settings. */
	lcpMs: number;
	/** Total Blocking Time, on Lighthouse's mobile settings. */
	tbtMs: number;
	/** JavaScript transferred, gzipped, in KB. */
	scriptKb: number;
}

/**
 * Pages Lighthouse checks. Every page except the editor gets 100 KB of JavaScript; the editor
 * page gets 250 KB. Each new page joins this list in its story, and the editor page with 250 KB
 * in Epic 2. The typing benchmark's test page isn't here: it isn't part of the app.
 */
export const PAGES: PageBudget[] = [{ path: '/', lcpMs: 2500, tbtMs: 200, scriptKb: 100 }];
