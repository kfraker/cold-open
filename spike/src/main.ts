// Spike: page setup and measurement hooks used by the Playwright benchmark.

import '@fontsource/courier-prime/400.css';
import './style.css';
import { createEditor, layoutTimes, pagesKey } from './editor';
import { paginate } from './layout';
import { sampleScript } from './sample';
import { SCREENPLAY } from './screenplay';
import type { Editor } from '@tiptap/core';

let editor: Editor | null = null;
const latencies: number[] = [];
const slowEvents: number[] = [];

// Keystroke to next paint: rAF runs just before the paint, setTimeout just after it.
document.addEventListener(
	'keydown',
	() => {
		const t0 = performance.now();
		requestAnimationFrame(() => setTimeout(() => latencies.push(performance.now() - t0), 0));
	},
	true
);

// Browser-reported event durations (Event Timing API, Chromium only), as a cross-check.
try {
	new PerformanceObserver((list) => {
		for (const e of list.getEntries()) if (e.name === 'keydown' || e.name === 'keypress') slowEvents.push(e.duration);
	}).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
} catch {
	/* not supported */
}

const params = new URLSearchParams(location.search);
const pages = Number(params.get('pages') ?? 3);
if (params.get('cv')) document.body.classList.add('cv');
const noBreaks = !!params.get('nobreaks');

async function load(n: number) {
	await document.fonts.ready;
	const els = sampleScript(n);
	const t0 = performance.now();
	editor?.destroy();
	editor = createEditor(document.getElementById('editor')!, els);
	if (noBreaks) editor.view.dispatch(editor.state.tr.setMeta(pagesKey, { enabled: false }));
	await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
	return { elements: els.length, pages: paginate(els).pages, loadMs: performance.now() - t0 };
}

/** Compare each element's rendered line count with the layout engine's, with breaks hidden. */
function mismatches() {
	const ed = editor!;
	if (document.body.classList.contains('cv') || noBreaks) return { checked: 0, bad: [], badCount: 0, skipped: true };
	ed.view.dispatch(ed.state.tr.setMeta(pagesKey, { enabled: false }));
	const lh = parseFloat(getComputedStyle(document.querySelector('.el')!).lineHeight);
	const els: { type: keyof typeof SCREENPLAY; text: string }[] = [];
	ed.state.doc.forEach((n) => els.push({ type: n.attrs.type, text: n.textContent }));
	const { lines } = paginate(els);
	const bad: { i: number; type: string; dom: number; engine: number; text: string }[] = [];
	document.querySelectorAll<HTMLElement>('#editor .el').forEach((p, i) => {
		const dom = Math.round(p.getBoundingClientRect().height / lh) || 1;
		if (dom !== lines[i].length) bad.push({ i, type: els[i].type, dom, engine: lines[i].length, text: els[i].text });
	});
	ed.view.dispatch(ed.state.tr.setMeta(pagesKey, { enabled: true }));
	return { checked: els.length, bad: bad.slice(0, 10), badCount: bad.length };
}

/** Put the cursor at the end of the dialogue element nearest a fraction of the script. */
function cursorAt(fraction: number) {
	const ed = editor!;
	const target = Math.floor(ed.state.doc.childCount * fraction);
	let pos = 0;
	let idx = 0;
	let found = -1;
	ed.state.doc.forEach((node, offset) => {
		if (found === -1 && idx >= target && node.attrs.type === 'dialogue') found = offset + node.nodeSize - 1;
		idx++;
		pos = offset;
	});
	ed.chain().focus().setTextSelection(found === -1 ? pos : found).scrollIntoView().run();
}

function reset() {
	latencies.length = 0;
	slowEvents.length = 0;
	layoutTimes.length = 0;
}

function stats() {
	const q = (a: number[], p: number) => {
		if (!a.length) return 0;
		const s = [...a].sort((x, y) => x - y);
		return s[Math.min(s.length - 1, Math.floor(p * s.length))];
	};
	return {
		keystrokes: latencies.length,
		p50: q(latencies, 0.5),
		p95: q(latencies, 0.95),
		max: q(latencies, 1),
		layoutP95: q(layoutTimes, 0.95),
		layoutMax: q(layoutTimes, 1),
		slowEventCount: slowEvents.length,
		slowEventMax: q(slowEvents, 1),
		pages: editor ? pagesKey.getState(editor.state)?.pages : 0
	};
}

Object.assign(window, { __spike: { load, mismatches, cursorAt, reset, stats } });
load(pages);
