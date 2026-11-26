import { describe, expect, it } from 'vitest';
import {
	ELEMENT_LAYOUT,
	estimatePages,
	sampleScript,
	wrappedLines,
	type ScriptElement
} from './sample-script.ts';

describe('wrappedLines', () => {
	it('fits a short text on one line', () => {
		expect(wrappedLines('She waits.', 60)).toBe(1);
	});

	it('counts an empty text as one line', () => {
		expect(wrappedLines('', 60)).toBe(1);
	});

	it('wraps at spaces, keeping a line exactly at the width', () => {
		expect(wrappedLines('aaaa bbbb', 9)).toBe(1);
		expect(wrappedLines('aaaa bbbb', 8)).toBe(2);
		expect(wrappedLines('aaaa bbbb cccc', 9)).toBe(2);
	});

	it('breaks a word longer than the line', () => {
		expect(wrappedLines('abcdefghij', 4)).toBe(3);
		expect(wrappedLines('ab abcdefgh', 4)).toBe(3);
		expect(wrappedLines('abcdefgh ab', 4)).toBe(3);
	});
});

describe('estimatePages', () => {
	it('adds blank lines before elements, except the first', () => {
		const oneScene: ScriptElement[] = [{ type: 'scene', text: 'INT. DINER - DAY' }];
		expect(estimatePages(oneScene)).toBe(1);
		// 27 one-line action elements: 27 lines plus 26 blank lines = 53, one page.
		const fits = Array.from({ length: 27 }, () => ({ type: 'action' as const, text: 'Rain.' }));
		expect(estimatePages(fits)).toBe(1);
		// One more makes 55 lines, onto a second page.
		expect(estimatePages([...fits, { type: 'action', text: 'Rain.' }])).toBe(2);
	});

	it('puts no blank line before dialogue or a parenthetical', () => {
		const speech: ScriptElement[] = [
			{ type: 'character', text: 'MAREN' },
			{ type: 'parenthetical', text: '(beat)' },
			{ type: 'dialogue', text: 'Not tonight.' }
		];
		expect(ELEMENT_LAYOUT.parenthetical.spaceBefore + ELEMENT_LAYOUT.dialogue.spaceBefore).toBe(0);
		expect(estimatePages(speech)).toBe(1);
	});
});

describe('sampleScript', () => {
	it('is the same script every time for the same seed', () => {
		expect(sampleScript(5)).toEqual(sampleScript(5));
		expect(sampleScript(5, 1)).not.toEqual(sampleScript(5, 2));
	});

	it('reaches the requested length without running far past it', () => {
		const script = sampleScript(150);
		const pages = estimatePages(script);
		expect(pages).toBeGreaterThanOrEqual(150);
		expect(pages).toBeLessThanOrEqual(152);
		expect(estimatePages(script.slice(0, -40))).toBeLessThan(150);
	});

	it('uses every element type, with no empty text', () => {
		const script = sampleScript(20);
		const types = new Set(script.map((element) => element.type));
		expect([...types].sort()).toEqual(Object.keys(ELEMENT_LAYOUT).sort());
		expect(script.every((element) => element.text.length > 0)).toBe(true);
	});

	it('starts with a scene heading in the usual form', () => {
		const [first] = sampleScript(1);
		expect(first.type).toBe('scene');
		expect(first.text).toMatch(/^(INT\.|EXT\.|INT\.\/EXT\.) [A-Z ]+ - [A-Z]+$/);
	});
});
