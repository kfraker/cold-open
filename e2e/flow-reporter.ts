// Records which user flows each browser project proved, for scripts/flow-report.ts.
// A test proves a flow by tagging it: test('...', { tag: '@F05' }, ...).
// Only tests that pass count. A tag that isn't in e2e/flows.json fails the run.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

const RESULTS = 'test-results/flows.json';

interface FlowList {
	groups: { flows: { id: string }[] }[];
}

export default class FlowReporter implements Reporter {
	private known = new Set(
		(JSON.parse(readFileSync('e2e/flows.json', 'utf8')) as FlowList).groups.flatMap((g) =>
			g.flows.map((f) => f.id)
		)
	);
	private proven: Record<string, Record<string, string[]>> = {};
	private projects = new Set<string>();
	private unknown = new Set<string>();

	onTestEnd(test: TestCase, result: TestResult) {
		const project = test.parent.project()?.name ?? 'default';
		this.projects.add(project);
		const flows = test.tags.filter((t) => /^@F\d+$/.test(t)).map((t) => t.slice(1));
		for (const id of flows) {
			if (!this.known.has(id)) this.unknown.add(id);
			else if (result.status === 'passed' && test.outcome() === 'expected') {
				const name = `${test.location.file.split(/[/\\]/).pop()} › ${test.title}`;
				((this.proven[id] ??= {})[project] ??= []).push(name);
			}
		}
	}

	async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
		mkdirSync('test-results', { recursive: true });
		const output = { projects: [...this.projects].sort(), flows: this.proven };
		writeFileSync(RESULTS, JSON.stringify(output, null, 2) + '\n');
		if (this.unknown.size) {
			console.error(
				`\nTests name flows that aren't in e2e/flows.json: ${[...this.unknown].join(', ')}`
			);
			return { status: 'failed' };
		}
		return { status: result.status };
	}

	printsToStdio() {
		return false;
	}
}
