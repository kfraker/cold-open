// The typing benchmark's editor and measurements (story 0.9), loaded only by the test page.
//
// A plain TipTap editor with the six screenplay elements and their Enter and Tab behaviour, as in
// spike 0.S, without the spike's page breaks. Epic 2 builds the real editor; when it lands, this
// page switches to it, so the benchmark measures what writers use.

import { Editor, Node } from '@tiptap/core';
import { estimatePages, sampleScript, type ElementType } from '#lib/bench/sample-script.ts';

/** The element Enter creates after each element, and the one Tab turns an empty element into. */
const NEXT: Record<ElementType, { enter: ElementType; tab: ElementType }> = {
	scene: { enter: 'action', tab: 'action' },
	action: { enter: 'action', tab: 'character' },
	character: { enter: 'dialogue', tab: 'transition' },
	parenthetical: { enter: 'dialogue', tab: 'dialogue' },
	dialogue: { enter: 'action', tab: 'parenthetical' },
	transition: { enter: 'scene', tab: 'scene' }
};

const Doc = Node.create({ name: 'doc', topNode: true, content: 'element+' });
const Text = Node.create({ name: 'text', group: 'inline' });
const Element = Node.create({
	name: 'element',
	content: 'text*',
	addAttributes() {
		return {
			type: {
				default: 'action',
				parseHTML: (el) => el.getAttribute('data-type'),
				renderHTML: (attrs) => ({ 'data-type': attrs.type, class: `el el-${attrs.type}` })
			}
		};
	},
	parseHTML: () => [{ tag: 'p[data-type]' }],
	renderHTML: ({ HTMLAttributes }) => ['p', HTMLAttributes, 0],
	addKeyboardShortcuts() {
		const current = (): ElementType => this.editor.state.selection.$from.parent.attrs.type;
		return {
			Enter: () =>
				this.editor
					.chain()
					.splitBlock()
					.updateAttributes('element', { type: NEXT[current()].enter })
					.run(),
			Tab: () => {
				// Tab only changes an empty element, so it never retypes text already written.
				if (this.editor.state.selection.$from.parent.content.size > 0) return true;
				return this.editor.commands.updateAttributes('element', { type: NEXT[current()].tab });
			}
		};
	}
});

const latencies: number[] = [];

// Keystroke to next paint. requestAnimationFrame runs just before the browser paints, and a
// timeout set from it runs just after, so the gap from the keydown is what the writer waits.
document.addEventListener(
	'keydown',
	() => {
		const start = performance.now();
		requestAnimationFrame(() => setTimeout(() => latencies.push(performance.now() - start), 0));
	},
	true
);

function percentile(values: number[], p: number): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

export interface LoadResult {
	elements: number;
	pages: number;
	loadMs: number;
	destroy: () => void;
}

/** Loads a sample script of about `pages` pages, and exposes the benchmark's controls. */
export async function startBenchmark(mount: HTMLElement, pages: number): Promise<LoadResult> {
	await document.fonts.ready;
	const script = sampleScript(pages);
	const start = performance.now();
	const editor = new Editor({
		element: mount,
		extensions: [Doc, Text, Element],
		editorProps: {
			attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Sample script' }
		},
		content: {
			type: 'doc',
			content: script.map((element) => ({
				type: 'element',
				attrs: { type: element.type },
				content: [{ type: 'text', text: element.text }]
			}))
		}
	});
	await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
	const loadMs = performance.now() - start;

	const controls = {
		loadMs,
		/** Puts the cursor at the end of the first speech at or after a fraction of the script. */
		cursorAt(fraction: number) {
			const target = Math.floor(editor.state.doc.childCount * fraction);
			let position = -1;
			editor.state.doc.forEach((node, offset, index) => {
				if (position === -1 && index >= target && node.attrs.type === 'dialogue')
					position = offset + node.nodeSize - 1;
			});
			if (position === -1) throw new Error(`No speech after ${fraction} of the script.`);
			editor.chain().focus().setTextSelection(position).scrollIntoView().run();
		},
		reset() {
			latencies.length = 0;
		},
		stats() {
			return {
				keystrokes: latencies.length,
				p50: percentile(latencies, 0.5),
				p95: percentile(latencies, 0.95),
				max: percentile(latencies, 1),
				samples: [...latencies]
			};
		}
	};
	Object.assign(window, { __typingBench: controls });

	return {
		elements: script.length,
		pages: estimatePages(script),
		loadMs,
		destroy: () => editor.destroy()
	};
}
