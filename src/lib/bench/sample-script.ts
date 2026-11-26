// A long, original sample screenplay for the typing benchmark (story 0.9), rewritten from spike
// 0.S's generator. It's seeded, so every run gets exactly the same script, and every word comes
// from the lists below: no real script text is used.
//
// The page count is an estimate from simple word wrapping, good enough to size a benchmark. Real
// pagination (keep-with-next, (MORE) and (CONT'D)) is the layout engine's job in Epic 3.

export type ElementType =
	'scene' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

export interface ScriptElement {
	type: ElementType;
	text: string;
}

/**
 * Where each element sits on the page, in characters of 12-point Courier (10 to the inch),
 * measured from the 1.5-inch left margin, and how many blank lines go before it. Common
 * screenplay layout; the real script type definitions, with a cited guide, come in story 2.1.
 */
export const ELEMENT_LAYOUT: Record<
	ElementType,
	{ indent: number; width: number; spaceBefore: number }
> = {
	scene: { indent: 0, width: 60, spaceBefore: 1 },
	action: { indent: 0, width: 60, spaceBefore: 1 },
	character: { indent: 22, width: 38, spaceBefore: 1 },
	parenthetical: { indent: 16, width: 25, spaceBefore: 0 },
	dialogue: { indent: 10, width: 35, spaceBefore: 0 },
	transition: { indent: 45, width: 15, spaceBefore: 1 }
};

/** An 11-inch page with 1-inch margins top and bottom, at 6 lines to the inch. */
export const LINES_PER_PAGE = 54;

/** How many lines a text takes when wrapped at spaces to `width` characters. */
export function wrappedLines(text: string, width: number): number {
	let lines = 1;
	let used = 0;
	for (const word of text.split(' ')) {
		// A word longer than the line is broken across lines.
		const length = Math.max(word.length, 1);
		const needed = used === 0 ? length : used + 1 + length;
		if (needed <= width) {
			used = needed;
		} else {
			lines += used === 0 ? 0 : 1;
			lines += Math.ceil(length / width) - 1;
			used = length % width || width;
		}
	}
	return lines;
}

/** The estimated page count: wrapped lines plus blank lines before elements. */
export function estimatePages(elements: ScriptElement[]): number {
	let lines = 0;
	elements.forEach((element, i) => {
		const layout = ELEMENT_LAYOUT[element.type];
		if (i > 0) lines += layout.spaceBefore;
		lines += wrappedLines(element.text, layout.width);
	});
	return Math.ceil(lines / LINES_PER_PAGE);
}

/** A small seeded random number generator (a linear congruential generator). */
function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 2 ** 32;
	};
}

const NAMES = [
	'MAREN',
	'OSKAR',
	'DELIA',
	'THEO',
	'JUNE WALLACE',
	'RAFI',
	'DETECTIVE OKAFOR',
	'BEA'
];
const PLACES = [
	'KITCHEN',
	'LIGHTHOUSE',
	'CAR PARK',
	'DINER',
	'TRAIN PLATFORM',
	'ROOFTOP',
	'WAREHOUSE OFFICE',
	'BEACH'
];
const TIMES = ['DAY', 'NIGHT', 'DUSK', 'MORNING', 'CONTINUOUS', 'LATER'];
const WORDS = (
	'the a light door window rain coffee keys radio map engine phone letter table ' +
	'slowly quietly suddenly almost never always again outside inside across under ' +
	'waits turns looks lifts drops opens closes reads hides finds runs stops listens ' +
	'cold bright empty broken old-fashioned half-open long narrow distant familiar ' +
	'she he they someone nobody everyone something nothing because until while before after'
).split(' ');
const TRANSITIONS = ['CUT TO:', 'SMASH CUT TO:', 'DISSOLVE TO:', 'MATCH CUT TO:'];
const PARENTHETICALS = [
	'(quietly)',
	'(beat)',
	'(to Theo)',
	'(not looking up)',
	'(laughing despite herself)'
];

/** A sample screenplay at least `pages` long (estimated). The same seed gives the same script. */
export function sampleScript(pages: number, seed = 189): ScriptElement[] {
	const random = seededRandom(seed);
	const pick = <T>(list: T[]): T => list[Math.floor(random() * list.length)];
	const between = (min: number, max: number) => min + Math.floor(random() * (max - min));

	const sentence = (minWords: number, maxWords: number) => {
		const words = Array.from({ length: between(minWords, maxWords) }, () => pick(WORDS));
		const text = words.join(' ');
		const end = random() < 0.15 ? '?' : random() < 0.1 ? '!' : '.';
		return text[0].toUpperCase() + text.slice(1) + end;
	};
	const paragraph = (sentences: number, minWords = 5, maxWords = 14) =>
		Array.from({ length: sentences }, () => sentence(minWords, maxWords)).join(' ');

	const elements: ScriptElement[] = [];
	let lines = 0;
	const add = (element: ScriptElement) => {
		const layout = ELEMENT_LAYOUT[element.type];
		if (elements.length > 0) lines += layout.spaceBefore;
		lines += wrappedLines(element.text, layout.width);
		elements.push(element);
	};

	while (Math.ceil(lines / LINES_PER_PAGE) < pages) {
		const where = random() < 0.6 ? 'INT.' : random() < 0.85 ? 'EXT.' : 'INT./EXT.';
		add({ type: 'scene', text: `${where} ${pick(PLACES)} - ${pick(TIMES)}` });
		add({ type: 'action', text: paragraph(between(1, 5)) });
		const exchanges = between(2, 9);
		for (let i = 0; i < exchanges; i++) {
			add({ type: 'character', text: pick(NAMES) });
			if (random() < 0.2) add({ type: 'parenthetical', text: pick(PARENTHETICALS) });
			// Now and then a long speech, as real scripts have.
			const sentences = random() < 0.1 ? between(6, 12) : between(1, 4);
			add({ type: 'dialogue', text: paragraph(sentences, 4, 12) });
			if (random() < 0.25) add({ type: 'action', text: paragraph(between(1, 3)) });
		}
		if (random() < 0.3) add({ type: 'transition', text: pick(TRANSITIONS) });
	}
	return elements;
}
