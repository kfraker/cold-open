import { describe, expect, it } from 'vitest';
import { paginate, wrap, type ScriptElement } from './layout';
import { LINES_PER_PAGE, SCREENPLAY } from './screenplay';
import { sampleScript } from './sample';

describe('wrap', () => {
	it('keeps short text on one line', () => {
		expect(wrap('Hello there.', 60)).toEqual([0]);
	});
	it('breaks after a space, leaving the space hanging', () => {
		// "aaaa bbbb" at width 6 -> "aaaa " / "bbbb"
		expect(wrap('aaaa bbbb', 6)).toEqual([0, 5]);
	});
	it('fits a word that ends exactly at the edge', () => {
		expect(wrap('aaaaaa bbbb', 6)).toEqual([0, 7]);
	});
	it('breaks after a hyphen between letters', () => {
		expect(wrap('half-open', 6)).toEqual([0, 5]);
	});
	it('hard-breaks a word longer than the line', () => {
		expect(wrap('abcdefghij', 4)).toEqual([0, 4, 8]);
	});
});

const line = (type: ScriptElement['type'], chars: number): ScriptElement => ({ type, text: 'x'.repeat(chars) });

function linesOnPages(els: ScriptElement[]) {
	const { lines, breaks } = paginate(els);
	return { lines, breaks };
}

describe('paginate', () => {
	it('fits 54 one-line action paragraphs... with spacing, 27 per page', () => {
		// Each action is 1 line plus 1 blank before (except at page top): 1 + 26*2 = 53, the 28th needs 2 more.
		const els = Array.from({ length: 28 }, () => line('action', 10));
		const { breaks } = linesOnPages(els);
		expect(breaks).toEqual([{ element: 27, line: 0, more: false }]);
	});

	it('does not leave a scene heading alone at the bottom of a page', () => {
		const filler = Array.from({ length: 26 }, () => line('action', 10)); // 1 + 25*2 = 51 lines
		const els = [...filler, { type: 'scene' as const, text: 'INT. DINER - NIGHT' }, line('action', 10)];
		// Heading would land on line 53, its action on 55: move the heading.
		const { breaks } = linesOnPages(els);
		expect(breaks[0]).toEqual({ element: 26, line: 0, more: false });
	});

	it('splits a long speech at a sentence with (MORE) and CONT\'D', () => {
		const filler = Array.from({ length: 20 }, () => line('action', 10)); // 39 lines
		const speech = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
		const els: ScriptElement[] = [...filler, { type: 'character', text: 'MAREN' }, { type: 'dialogue', text: speech }];
		const { breaks } = linesOnPages(els);
		expect(breaks).toHaveLength(1);
		expect(breaks[0]).toMatchObject({ element: 21, more: true, character: 'MAREN' });
	});

	it('never puts more than 54 lines on a page in a 150-page script', () => {
		const els = sampleScript(150);
		const { lines, breaks, pages } = paginate(els);
		expect(pages).toBeGreaterThanOrEqual(150);
		// Recount lines per page from the breaks.
		const bAt = new Map(breaks.map((b) => [`${b.element}:${b.line}`, b]));
		let used = 0;
		let max = 0;
		els.forEach((el, i) => {
			for (let l = 0; l < lines[i].length; l++) {
				const b = bAt.get(`${i}:${l}`);
				if (b) {
					max = Math.max(max, used + (b.more ? 1 : 0));
					used = b.more ? 1 : 0;
				} else if (l === 0 && used > 0) {
					used += SCREENPLAY[el.type].spaceBefore;
				}
				used++;
			}
		});
		expect(Math.max(max, used)).toBeLessThanOrEqual(LINES_PER_PAGE);
	});
});
