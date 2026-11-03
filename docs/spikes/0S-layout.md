# Spike 0.S: page layout in the editor

**Question:** can TipTap, plus a layout engine of our own, show a long script as accurate pages while typing stays under the 50 ms target in [nfr.md](../nfr.md)?

**Answer: yes, with one change to how page breaks update, and a clearer definition of the target device.** The recommendation is **go**. The owner's decision is recorded at the end.

The spike code is on the `spike/layout` branch and is never merged. It's throwaway: the real editor (Epic 2) and layout engine (Epic 3) are written fresh, with tests, from what was learned here.

## What was built
- **A prototype layout engine** (`spike/src/layout.ts`), a pure TypeScript module:
  - word wrapping that copies the browser's rules (break after spaces and after hyphens between letters, hard-break over-long words);
  - pagination at 54 lines per page;
  - rules: a scene heading keeps 2 lines of what follows, a character cue stays with its speech, long speeches split at a sentence end with (MORE) and (CONT'D), action splits with 2+ lines on each side.
  - 9 unit tests. One caught a real bug on its first run: the keep-with-next rule ignored the blank line before the next element.
- **A TipTap editor** with 6 screenplay elements, Enter and Tab behaviour, and page breaks drawn as ProseMirror decorations from the engine's output.
- **A 157-page sample screenplay** (2,725 elements), generated from a fixed seed from word lists written for the project.
- **A Playwright benchmark.** It loads the script and checks that every element wraps to exactly the number of lines the engine predicted. Then it types 100+ characters and two Enters at the start, middle and end of the script, measuring each keystroke to the next screen paint.

## Results
Machine: Intel Core i9-13900K desktop, 64 GB. Times are milliseconds from keystroke to next paint, 50th / **95th** percentile / worst, across the start, middle and end positions. Typing speed: one key every 30 ms, faster than most people type.

| Browser and CPU | Page breaks every keystroke | Page breaks on pause (150 ms) | No page breaks at all |
|---|---|---|---|
| Chromium, full speed | 11 / **18** / 30 | 10 / **18** / 22 | — |
| Firefox, full speed | 8 / **10–11** / 23 | 6 / **7–8** / 14 | — |
| WebKit (Safari engine), full speed | 14 / **15–28** / 40 | 14 / **15–18** / 37 | — |
| Chromium, CPU 2× slower | 22 / **29–31** / 84 | 19 / **25–27** / 88 | — |
| Chromium, CPU 4× slower | 50 / **66–115** / 211 | 43 / **58–76** / 182 | 37 / **50–56** / 127 |

- **Wrapping accuracy:** in Chromium, Firefox and WebKit, all 2,725 elements wrapped to exactly the engine's predicted line count. That makes it reliable for the page view and the PDF to use the same engine.
- **Layout engine speed:** 1.5–3 ms per keystroke at full speed and about 8 ms at 4× slower, using a cache that skips paragraphs that haven't changed.
- **Loading the 157-page script:** 67–114 ms at full speed, and 542 ms at 4× slower.
- **`content-visibility: auto`** (letting the browser skip off-screen paragraphs) made typing **slower** (95th percentile 114–131 ms at 4×), so it was ruled out.

## What this means
1. **The approach works.** All three browser engines are well under 50 ms at full speed and at 2× slower. The page view matches the engine line for line.
2. **Update page breaks when typing pauses, not on every keystroke.** While typing, the existing breaks just move along with the text. About 150 ms after typing pauses, they're recalculated. This takes the page-break cost almost entirely off the typing path. At 4× slower, it brings the 95th percentile from 66–115 ms down to 58–76 ms, close to the editor's own floor with no page breaks (50–56 ms).
3. **The limit at 4× slower is the editor itself, not our pagination.** Plain TipTap/ProseMirror with one 157-page document is already around 50 ms there. 4× slower than this desktop is roughly a budget laptop or a mid-range phone. On those, a full-length script will feel slightly slower to type in, though still usable. Going faster there would mean splitting the script into separately rendered sections, which is a bigger change and not needed for v1.
4. **The target needs a precise, testable definition.** "Mid-range laptop profile" can't be checked in CI as written. Proposed: the CI benchmark runs Chromium **at full speed on GitHub's standard runner** and must stay under 50 ms at the 95th percentile on a 150-page script. GitHub's runner is a modest 4-core machine, close to a mid-range laptop. The same benchmark at 4× slower is reported but not enforced, so slow-device performance is visible and tracked. Story 0.9 calibrates the runner against these local numbers.

## Not covered by the spike (carried into the real stories)
- **Break visuals:** when a speech splits, the gap is drawn inside the dialogue column (narrower and offset). Ordinary breaks span the page correctly. Fix in 3.2 by positioning break widgets against the page, not the element.
- **Moving the cursor and selecting across page breaks:** arrow keys, selection and copying across a break weren't tested. Cover in 3.2. Breaks are decorations, not text, so copied text won't include (MORE) or (CONT'D), which is the right behaviour.
- **Real phones:** on-screen keyboards and touch weren't tested. Covered in 2.9 and 3.6, with a check on a real phone.
- **Dual dialogue, scene numbers, other script types:** layout rules only. Low risk, now the engine approach is proven.

## Recommendation
**Go** with TipTap, page breaks drawn as decorations, and one shared layout engine, plus:
- page breaks recalculated when typing pauses (about 150 ms), and moved along with the text in between;
- the typing target redefined as above (enforced: Chromium at full speed on the CI runner; reported: 4× slower);
- risk R1 downgraded from open to monitored, with slow-device typing in very long scripts noted as a known limit.

## Decision
**Go, as recommended** (owner, 2026-11-03). The approach, the typing-target definition and the known limit are recorded in the [decision log](../decisions.md), [nfr.md](../nfr.md) and [risks.md](../risks.md). Spike code: [`spike/layout` branch](https://github.com/kfraker/cold-open/tree/spike/layout/spike).
