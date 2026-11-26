import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

/**
 * Adds a section to the CI run's summary page, and prints it locally. Also saves the raw
 * results as JSON in test-results/perf/, so a run can be compared with an earlier one.
 */
export function report(name: string, markdown: string, results: unknown): void {
	mkdirSync('test-results/perf', { recursive: true });
	writeFileSync(`test-results/perf/${name}.json`, JSON.stringify(results, null, 2));
	const summary = process.env.GITHUB_STEP_SUMMARY;
	if (summary) appendFileSync(summary, `${markdown}\n\n`);
	else console.log(`\n${markdown}\n`);
}

/** Milliseconds, rounded for a table. */
export const ms = (value: number) => `${Math.round(value)} ms`;
