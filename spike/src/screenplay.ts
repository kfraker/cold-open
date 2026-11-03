// Spike: a minimal feature-screenplay type definition.
// Positions are in characters on a 10-characters-per-inch grid, measured from
// the left margin (1.5in from the page edge). Values follow common screenplay
// formatting guides; the real definition (story 2.1) will cite one guide.

export type ElementType =
	| 'scene'
	| 'action'
	| 'character'
	| 'parenthetical'
	| 'dialogue'
	| 'transition';

export interface ElementDef {
	indent: number; // characters from the left margin
	width: number; // characters per line
	spaceBefore: number; // blank lines before, dropped at the top of a page
	caps: boolean;
	enter: ElementType; // element created by Enter
	tab: ElementType; // element Tab switches an empty element to
}

export const LINES_PER_PAGE = 54; // 11in page, 1in top and bottom margins, 6 lines per inch

export const SCREENPLAY: Record<ElementType, ElementDef> = {
	scene: { indent: 0, width: 60, spaceBefore: 1, caps: true, enter: 'action', tab: 'action' },
	action: { indent: 0, width: 60, spaceBefore: 1, caps: false, enter: 'action', tab: 'character' },
	character: { indent: 22, width: 38, spaceBefore: 1, caps: true, enter: 'dialogue', tab: 'transition' },
	parenthetical: { indent: 16, width: 25, spaceBefore: 0, caps: false, enter: 'dialogue', tab: 'dialogue' },
	dialogue: { indent: 10, width: 35, spaceBefore: 0, caps: false, enter: 'action', tab: 'parenthetical' },
	transition: { indent: 45, width: 15, spaceBefore: 1, caps: true, enter: 'scene', tab: 'scene' }
};
