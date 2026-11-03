// Spike: prototype layout engine. Pure functions, no DOM.
// Turns a list of script elements into pages on a fixed monospace grid.

import { LINES_PER_PAGE, SCREENPLAY, type ElementType } from './screenplay';

export interface ScriptElement {
	type: ElementType;
	text: string;
}

/** Start offset (in the element's text) of each wrapped line. */
export type LineStarts = number[];

/**
 * Word-wrap the way a browser does with `white-space: pre-wrap`:
 * break after spaces and after hyphens between letters, and hard-break
 * words longer than the line.
 */
export function wrap(text: string, width: number): LineStarts {
	const starts: LineStarts = [0];
	if (text.length <= width) return starts;
	let lineStart = 0;
	while (text.length - lineStart > width) {
		// Trailing spaces "hang" past the edge, so a space at index lineStart+width still fits.
		let breakAt = -1;
		for (let i = lineStart + width; i > lineStart; i--) {
			const prev = text[i - 1];
			if (text[i] === ' ' && i === lineStart + width) {
				breakAt = i;
				break;
			}
			if (prev === ' ') {
				breakAt = i;
				break;
			}
			if (prev === '-' && /\p{L}/u.test(text[i - 2] ?? '') && /\p{L}/u.test(text[i] ?? '')) {
				breakAt = i;
				break;
			}
		}
		if (breakAt === -1) breakAt = lineStart + width; // no opportunity: hard break
		// Skip the spaces that hang at the end of the line.
		while (text[breakAt] === ' ') breakAt++;
		if (breakAt >= text.length) break;
		starts.push(breakAt);
		lineStart = breakAt;
	}
	return starts;
}

/** A page break, placed before an element or before one of its lines. */
export interface PageBreak {
	element: number;
	line: number; // 0 = before the whole element
	more: boolean; // dialogue split: (MORE) at the bottom, CHARACTER (CONT'D) at the top
	character?: string;
}

export interface Layout {
	lines: LineStarts[];
	breaks: PageBreak[];
	pages: number;
}

const cache = new WeakMap<object, LineStarts>();

/** Wrap with a cache keyed on an immutable object (a ProseMirror node in the editor). */
export function wrapCached(key: object | null, el: ScriptElement): LineStarts {
	if (key) {
		const hit = cache.get(key);
		if (hit) return hit;
	}
	const def = SCREENPLAY[el.type];
	const lines = wrap(def.caps ? el.text.toUpperCase() : el.text, def.width);
	if (key) cache.set(key, lines);
	return lines;
}

/**
 * Paginate. Rules (prototype):
 * - space before an element is dropped at the top of a page;
 * - a scene heading needs 2 lines of what follows on the same page;
 * - a character cue stays with its first 2 lines of speech;
 * - a speech that doesn't fit splits at a sentence end, leaving 2+ lines
 *   on each side and room for (MORE); otherwise the whole speech moves;
 * - action splits with 2+ lines on each side; otherwise it moves.
 */
export function paginate(els: ScriptElement[], keys: (object | null)[] = []): Layout {
	const lines = els.map((el, i) => wrapCached(keys[i] ?? null, el));
	const breaks: PageBreak[] = [];
	let used = 0; // lines used on the current page
	let pages = 1;
	let speaker = '';

	const newPage = (b: PageBreak) => {
		breaks.push(b);
		pages++;
		used = 0;
	};

	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		const def = SCREENPLAY[el.type];
		const n = lines[i].length;
		const gap = used === 0 ? 0 : def.spaceBefore;
		const room = LINES_PER_PAGE - used - gap;
		if (el.type === 'character') speaker = el.text.toUpperCase();

		if (el.type === 'scene' || el.type === 'character') {
			// Keep with the next element's first 2 lines (or the whole thing if shorter).
			const next = els[i + 1];
			const nextLines = next ? SCREENPLAY[next.type].spaceBefore + Math.min(2, lines[i + 1].length) : 0;
			let need = n + nextLines;
			if (el.type === 'character' && els[i + 1]?.type === 'parenthetical') {
				need += i + 2 < els.length ? Math.min(1, lines[i + 2].length) : 0;
			}
			if (need > room && used > 0) {
				newPage({ element: i, line: 0, more: false });
				used = n;
				continue;
			}
			used += gap + n;
			continue;
		}

		if (n <= room) {
			used += gap + n;
			continue;
		}

		// Doesn't fit. Try to split.
		if (el.type === 'dialogue' && room >= 3) {
			// Leave a line for (MORE); split after a sentence end.
			const starts = lines[i];
			const text = el.text;
			let split = -1;
			for (let k = Math.min(room - 1, n - 2); k >= 2; k--) {
				const prevEnd = text.slice(0, starts[k]).trimEnd();
				if (/[.?!]["')]?$/.test(prevEnd)) {
					split = k;
					break;
				}
			}
			if (split !== -1) {
				newPage({ element: i, line: split, more: true, character: speaker });
				used = 1 + (n - split); // CHARACTER (CONT'D) line + the rest
				continue;
			}
		}
		if (el.type === 'action' && room >= 2 && n - room >= 2) {
			newPage({ element: i, line: room, more: false });
			used = n - room;
			continue;
		}

		// Move the element, or the whole speech it belongs to.
		let start = i;
		if (el.type === 'dialogue' || el.type === 'parenthetical') {
			while (start > 0 && els[start].type !== 'character') start--;
		}
		if (used === 0) {
			// Taller than a page: let it run over.
			used = n % LINES_PER_PAGE;
			pages += Math.floor(n / LINES_PER_PAGE);
			continue;
		}
		newPage({ element: start, line: 0, more: false });
		used = 0;
		for (let j = start; j <= i; j++) used += (j === start ? 0 : SCREENPLAY[els[j].type].spaceBefore) + lines[j].length;
	}
	return { lines, breaks, pages };
}
