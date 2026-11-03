// Spike: TipTap editor with screenplay elements and page breaks drawn as
// decorations from the layout engine.

import { Editor, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { paginate, type ScriptElement } from './layout';
import { SCREENPLAY, type ElementType } from './screenplay';

export const layoutTimes: number[] = [];
const debounce = new URLSearchParams(location.search).has('debounce');
export const pagesKey = new PluginKey<{ deco: DecorationSet; pages: number; enabled: boolean }>('pages');

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
			Enter: () => {
				const next = SCREENPLAY[current()].enter;
				return this.editor.chain().splitBlock().updateAttributes('element', { type: next }).run();
			},
			Tab: () => {
				const { parent } = this.editor.state.selection.$from;
				const next = SCREENPLAY[current()].tab;
				if (parent.content.size > 0 && current() !== 'dialogue') return true;
				return this.editor.commands.updateAttributes('element', { type: next });
			}
		};
	}
});

function breakWidget(page: number, more?: { character: string }) {
	const el = document.createElement(more ? 'span' : 'div');
	el.className = more ? 'pb pb-inline' : 'pb';
	el.setAttribute('contenteditable', 'false');
	el.innerHTML =
		(more ? '<span class="pb-more">(MORE)</span>' : '') +
		`<span class="pb-gap"><span class="pb-num">${page}.</span></span>` +
		(more ? `<span class="pb-contd">${more.character} (CONT'D)</span>` : '');
	return el;
}

function buildDecorations(doc: import('@tiptap/pm/model').Node) {
	const t0 = performance.now();
	const els: ScriptElement[] = [];
	const keys: object[] = [];
	const positions: number[] = [];
	doc.forEach((node, offset) => {
		els.push({ type: node.attrs.type, text: node.textContent });
		keys.push(node);
		positions.push(offset);
	});
	const layout = paginate(els, keys);
	const decos = layout.breaks.map((b, i) => {
		const page = i + 2;
		if (b.line === 0) return Decoration.widget(positions[b.element], () => breakWidget(page), { side: -1, key: `p${page}` });
		const textOffset = layout.lines[b.element][b.line];
		const pos = positions[b.element] + 1 + textOffset;
		return Decoration.widget(pos, () => breakWidget(page, b.more ? { character: b.character ?? '' } : undefined), {
			side: -1,
			key: `p${page}-${b.character ?? ''}`
		});
	});
	const deco = DecorationSet.create(doc, decos);
	layoutTimes.push(performance.now() - t0);
	return { deco, pages: layout.pages };
}

const PageBreaks = Node.create({
	name: 'pageBreaks',
	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: pagesKey,
				state: {
					init: (_, state) => ({ ...buildDecorations(state.doc), enabled: true }),
					apply(tr, old) {
						const meta = tr.getMeta(pagesKey);
						const enabled = meta?.enabled ?? old.enabled;
						if (!enabled) return { deco: DecorationSet.empty, pages: old.pages, enabled };
						if (!tr.docChanged && !meta) return old;
						// Debounced mode: while typing, just shift the existing breaks along.
						if (debounce && tr.docChanged && !meta?.recompute) return { ...old, deco: old.deco.map(tr.mapping, tr.doc) };
						return { ...buildDecorations(tr.doc), enabled };
					}
				},
				props: { decorations: (state) => pagesKey.getState(state)?.deco },
				view: () => {
					let timer: ReturnType<typeof setTimeout> | undefined;
					return {
						update: (view, prev) => {
							if (!debounce || view.state.doc === prev.doc) return;
							clearTimeout(timer);
							timer = setTimeout(() => view.dispatch(view.state.tr.setMeta(pagesKey, { recompute: true })), 150);
						},
						destroy: () => clearTimeout(timer)
					};
				}
			})
		];
	}
});

export function createEditor(mount: HTMLElement, els: ScriptElement[]) {
	const content = {
		type: 'doc',
		content: els.map((e) => ({ type: 'element', attrs: { type: e.type }, content: e.text ? [{ type: 'text', text: e.text }] : [] }))
	};
	return new Editor({ element: mount, extensions: [Doc, Text, Element, PageBreaks], content });
}
