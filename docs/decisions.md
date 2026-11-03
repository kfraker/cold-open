# Decision log

Key decisions behind Cold Open and why they were made. Newest first. The decisions from initial planning (2026-11-03) were made before any code was written.

## Encrypt backups before they leave the CI runner (2026-11-03)
**Decision:** the daily `pg_dump` is encrypted with age, using a public key kept in the repo, before it's saved as a GitHub Actions artifact. The private key stays offline with the owner.
**Why:** artifacts on a public repo can be downloaded by any signed-in GitHub user, and the scripts are unpublished creative work. Paid backup storage isn't needed: encrypted artifacts are free and the restore can be tested.

## Spike the page layout before building the editor (2026-11-03)
**Decision:** before the real editor is built, a short, throwaway proof of concept checks that TipTap and a prototype layout engine can paginate a 150-page script while typing stays under 50 ms.
**Why:** a page-accurate view inside a rich-text editor is the project's biggest technical unknown. Finding out it's too slow after Epics 2–3 are built would be expensive. One or two sessions now settles it.

## Make PDFs in the browser (2026-11-03)
**Decision:** PDF export runs in the browser, using the same layout engine as the on-screen page view.
**Why:** there are no server time limits on Vercel's free plan to worry about, scripts don't leave the device to be exported, it works offline, and the PDF's pages always match what's on screen.

## Leave room for co-writing, but don't build it (2026-11-03)
**Decision:** projects have a membership table, though only the owner is a member for now. Edits are saved as editor steps, not whole-document overwrites.
**Why:** real-time co-writing is hard to add later if the data model assumes a single writer. This costs little now and avoids a rewrite if sharing is ever wanted. Co-writing itself is a non-goal for v1.

## Keep a copy of every change in the browser (2026-11-03)
**Decision:** every change is saved in the browser (IndexedDB) as well as to the server. Writing continues offline and syncs on reconnect. If the two copies disagree, the writer chooses which to keep.
**Why:** losing typed work is the worst thing a writing tool can do. A full offline app (PWA) was considered but would add a lot of build and test work for little extra benefit to a single writer.

## Release v0.1.0 for real use after Epic 3 (2026-11-03)
**Decision:** the first release comes once sign-in, projects, the screenplay editor, the page view and PDF export work. Backups, error alerts and an uptime check go in before it.
**Why:** real use should shape the later epics. Real scripts exist from that point, so their protection can't wait until v1.0.0.

## Real accounts only for the owner; everyone else uses the demo (2026-11-03)
**Decision:** sign-in is restricted to an allow-list (`ALLOWED_EMAILS`). Reviewers use a demo that needs no sign-up.
**Why:** it's a personal tool. Open sign-up would need a privacy policy, terms, account deletion, abuse limits and a plan for staying inside free-tier limits. That would be its own epic if it's ever wanted.

## No analytics at launch (2026-11-03)
**Decision:** no analytics or tracking.
**Why:** it isn't needed for a personal tool, and leaving it out means no cookie banner and nothing to disclose.

## Dark "studio" look, three panes, light and dark themes (2026-11-03)
**Decision:** the white script page sits on a dark charcoal workspace. A navigator is on the left and a details panel on the right, both collapsible, and on phones they become drawers. Light and dark themes follow the device setting. The exact visual direction is chosen from 2–3 mockups in story 0.10.
**Why:** this is a professional tool for long writing sessions. A dark surround keeps the page the focus and is easier on the eyes at night.

## Script types are data, with one shared layout engine (2026-11-03)
**Decision:** each script type is a definition (elements, margins, caps, spacing, Enter and Tab behavior, page rules), checked against a schema. The built-in formats use the same definition format as custom types.
**Why:** custom script types are a core requirement. If the built-in types used special code, custom types would always lag behind them.

## Stack: SvelteKit, TipTap, Neon, Auth.js, Vercel (2026-11-03)
**Decision:** SvelteKit + TypeScript, TipTap (open-source parts only), Neon Postgres with Drizzle, Google sign-in through Auth.js, hosted on Vercel.
**Why:** an editor that formats as you type does most of its work in the browser, so one language (TypeScript) from the browser to the server keeps it simpler to build and test than Sweat Equity's Flask. TipTap/ProseMirror is the proven base for structured editors. Neon, Google sign-in and Vercel reuse setup already proven on Sweat Equity. Everything has a free tier.

## Public repo under the MIT license (2026-11-03)
**Decision:** the code is public and open source under MIT.
**Why:** it's a portfolio showcase, so reviewers should be able to see the requirements, decisions, tests and CI, not just the app. MIT is the most widely recognised license. The Cold Open name isn't covered by it.

## Name: Cold Open (2026-11-03)
**Decision:** the app is called Cold Open, a TV term for the scene that plays before the opening titles.
**Why:** it's short and memorable and shows knowledge of the field. A web search found no screenwriting app with this name, and the repo name was free. Draftroom was also considered, but a student screenwriting project already uses it. Names already used by script tools (Slugline, Fade In, Highland, Beat, Scriptwright and others) were ruled out.
