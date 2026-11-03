// Spike: generates an original sample screenplay of a given length.
// Seeded, so every run produces the same script. No real script text is used.

import { paginate, type ScriptElement } from './layout';

function rng(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 2 ** 32;
	};
}

const NAMES = ['MAREN', 'OSKAR', 'DELIA', 'THEO', 'JUNE WALLACE', 'RAFI', 'DETECTIVE OKAFOR', 'BEA'];
const PLACES = ['KITCHEN', 'LIGHTHOUSE', 'CAR PARK', 'DINER', 'TRAIN PLATFORM', 'ROOFTOP', 'WAREHOUSE OFFICE', 'BEACH'];
const TIMES = ['DAY', 'NIGHT', 'DUSK', 'MORNING', 'CONTINUOUS', 'LATER'];
const WORDS = (
	'the a light door window rain coffee keys radio map engine phone letter table ' +
	'slowly quietly suddenly almost never always again outside inside across under ' +
	'waits turns looks lifts drops opens closes reads hides finds runs stops listens ' +
	'cold bright empty broken old-fashioned half-open long narrow distant familiar ' +
	'she he they someone nobody everyone something nothing because until while before after'
).split(' ');
const TRANSITIONS = ['CUT TO:', 'SMASH CUT TO:', 'DISSOLVE TO:', 'MATCH CUT TO:'];
const PARENS = ['(quietly)', '(beat)', '(to Theo)', '(not looking up)', '(laughing despite herself)'];

function sentence(r: () => number, min: number, max: number) {
	const n = min + Math.floor(r() * (max - min));
	const w: string[] = [];
	for (let i = 0; i < n; i++) w.push(WORDS[Math.floor(r() * WORDS.length)]);
	const s = w.join(' ');
	const end = r() < 0.15 ? '?' : r() < 0.1 ? '!' : '.';
	return s[0].toUpperCase() + s.slice(1) + end;
}

function para(r: () => number, sentences: number, min = 5, max = 14) {
	return Array.from({ length: sentences }, () => sentence(r, min, max)).join(' ');
}

/** A script at least `pages` long. */
export function sampleScript(pages: number, seed = 189): ScriptElement[] {
	const r = rng(seed);
	const els: ScriptElement[] = [];
	const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
	while (true) {
		const ie = r() < 0.6 ? 'INT.' : r() < 0.85 ? 'EXT.' : 'INT./EXT.';
		els.push({ type: 'scene', text: `${ie} ${pick(PLACES)} - ${pick(TIMES)}` });
		els.push({ type: 'action', text: para(r, 1 + Math.floor(r() * 4)) });
		const exchanges = 2 + Math.floor(r() * 7);
		for (let x = 0; x < exchanges; x++) {
			els.push({ type: 'character', text: pick(NAMES) });
			if (r() < 0.2) els.push({ type: 'parenthetical', text: pick(PARENS) });
			// Occasionally a long speech, to exercise splitting across pages.
			els.push({ type: 'dialogue', text: para(r, r() < 0.1 ? 6 + Math.floor(r() * 6) : 1 + Math.floor(r() * 3), 4, 12) });
			if (r() < 0.25) els.push({ type: 'action', text: para(r, 1 + Math.floor(r() * 2)) });
		}
		if (r() < 0.3) els.push({ type: 'transition', text: pick(TRANSITIONS) });
		if (els.length % 40 < 8 && paginate(els).pages >= pages) return els;
	}
}
