# Decision log

Key decisions behind Cold Open and why they were made. Newest first. The decisions from initial planning (2026-11-03) were made before any code was written.

## Held-back major versions (2026-11-09)
**Decision:** Dependabot skips major versions of two packages, listed in `.github/dependabot.yml`:
- **`@types/node` stays on 24,** because Node is pinned to 24. Types for a newer Node would let code use APIs the runtime doesn't have. Dependabot's 24 → 26 pull request (#8) passed CI but was closed for this reason. It moves when the Node pin moves, in the same pull request.
- **`typescript` stays on 6.** Dependabot's TypeScript 7 pull request (#9) failed CI at `npm ci`: `svelte-check@4.7.7` accepts TypeScript `^5.0.0 || ^6.0.0` only. The ignore rule hides future TypeScript majors, so the check moves to `svelte-check`: whenever Dependabot proposes a `svelte-check` update, its `peerDependencies` are checked, and the hold ends once they accept TypeScript 7. Either way it's reviewed again by 2027-02-09.
- Minor and patch updates of both still arrive as usual.

## Previews and the deploy gate (2026-11-09)
**Decision:** for story 0.7:
- **Only `main` and `dev` get Vercel deployments.** `vercel.json` turns deployments off for every other branch (`"**": false`; a branch deploys if any matching rule is `true`). That matches the release path (local, then the `dev` preview, then production) and saves the free plan's build time. Story branches are tested locally and by CI.
- **Vercel installs with `npm ci`,** exactly as CI does, so a deployment uses the locked versions and fails if the lockfile is out of step.
- **Deployment Checks hold production until all four required checks pass on `main`.** The rulesets already stop failing code reaching `main`, so the gate is a second net: it catches a failure after the merge, such as a merged result that behaves differently or an intermittent test.
- **How the gate is proven:** because nothing failing can reach `main` by pull request, the proof used a temporary CI step that failed on every CI run on `main`. Story branches and `dev` skipped it, so the release pull request passed, and the merge into `main` failed CI on purpose. A second release, without the step, shows production going live once the checks pass. Nothing was loosened.
- **CI runs on `main` and `dev` always finish.** A newer push only cancels a story branch's older run. Otherwise a quick second merge would cancel the first commit's checks, and the gate would hold that deploy forever.
- **No version number or tag for setup merges into `main`.** Merges before the app is usable carry no version. The first numbered release is v0.1.0, after Epic 3.
- **Proof (2026-11-09):** release A (pull request #5) merged `dev` into `main` as commit `3730935`. The `checks` job failed at the deliberate step, its first, so its lint, types, unit test, license and audit steps didn't run on that commit. The browser tests and both CodeQL checks passed. Vercel built the production deployment and marked it "Checks for Deployment have failed", and didn't promote it: `cold-open-bay.vercel.app` still returned 404. The step was then removed. Release B (pull request #12) then merged `dev` into `main` as commit `eef5960`, without the step. All four checks passed, Vercel promoted the deployment, and `cold-open-bay.vercel.app` returned 200 with the placeholder page.
- **The first `dev` preview was created by hand.** PR #4 merged before the Vercel project existed, so Vercel → Deployments → Create Deployment (branch `dev`) built it. It succeeded and was checked on a phone.
- **The preview acceptance criterion is reworded** to "checked on a phone": a deliberate failure on `dev` can't be shown either, because `dev` also requires passing checks.

## Security scanning and branch protection (2026-11-05)
**Decision:** for story 0.6:
- **Dependabot version updates go to `dev`, weekly, with a 14-day cooldown.** That matches `min-release-age=14`. They include indirect dependencies, so fixes deep in the tree (like the accepted advisories below) are proposed too. Minor and patch updates are grouped, so a normal week brings at most one npm pull request and one for Actions.
- **Known gap: the cooldown covers the package being bumped, not everything its lockfile update brings along.** A Dependabot pull request could pull in a sub-dependency newer than 14 days, and CI's `npm ci` installs exactly what the lockfile says without checking ages. For now, Dependabot lockfile diffs are reviewed before merging. A CI check of every locked package's publish date is a possible follow-up.
- **Dependabot security update pull requests are off; alerts are on.** GitHub always opens security update pull requests against the default branch (`main`), which would skip `dev` and the preview. Instead, an alert is visible at once, `npm audit` fails CI on a high or critical finding, and the fix goes through `dev` like any other change.
- **If a high or critical advisory blocks CI and its fix is under 14 days old:** CI fails on every branch until it's dealt with, which is intended. Either install the fixed release early on a branch off `dev` with `npm install <package>@<version> --min-release-age=0`, or, if the advisory can't affect Cold Open, accept it for a fixed time and adjust the CI audit step until then. Either way the exception and its end date are logged here.
- **CodeQL as a workflow file, not GitHub's default setup.** The file is in the repo, pins its actions to commit SHAs like the rest of CI, and uses the `security-extended` queries. It scans the TypeScript and JavaScript and the workflow files.
- **Rulesets instead of classic branch protection.** Rulesets can block a merge on open CodeQL alerts, and their JSON is kept in `.github/rulesets/` as the record of what's set.
- **No required approvals on `main`.** There's one maintainer, and GitHub doesn't let you approve your own pull request. The human check is that the owner merges every pull request by hand. Required checks still apply to everyone, with no bypass.
- **Branches don't have to be up to date before merging.** Each merge of `dev` into `main` adds a merge commit that `dev` lacks, so requiring up-to-date branches would mean an extra sync before every release. As long as `main` only receives `dev`, CI on `dev` tests exactly what's merged. If a fix ever lands on `main` another way, `main` is merged back into `dev` straight after.
- **`dev` requires pull requests and the same checks.** Story branches and Dependabot updates reach `dev` only through a pull request, so every change gets the pull request CodeQL scan and the Definition of Done checklist.
- **Proof:** on 2026-11-05 a throwaway commit pushed straight to `main` as the repo owner was refused (`GH013: Repository rule violations`: a pull request is required, 4 of 4 required checks are expected, and code scanning results are awaited). `main` was unchanged. The rulesets report `current_user_can_bypass: never`.

## CI pipeline design (2026-11-03)
**Decision:** for story 0.5:
- **Coverage floor:** Vitest coverage thresholds act as the floor. They start at 100% for shared code (`src/lib`). A local run that beats the floor raises it, rounded down, by rewriting `vite.config.ts`, so the higher floor is committed with the work. CI never rewrites it. Lowering it is always a visible change to that file. Pages and routes are covered by browser tests and user flows, not line coverage.
- **Codecov not yet:** Codecov isn't connected yet. The floor enforces "coverage can't drop" without it, and the totals appear in each run's summary. Codecov would add coverage comments on pull requests, but it needs the owner to sign in at codecov.io, so it's an optional follow-up.
- **No browser cache in CI:** Playwright's docs advise against caching browsers, since restoring takes about as long as downloading, and Actions minutes are free for public repos.
- **Browser tests:** all five browser projects run in one job, so the flow report sees every result at once. Splitting them across jobs can come later if the run gets slow.
- **No retries:** a test that passes only on a second try is a bug to find, not to hide.
- **Flow coverage:** the flow list is data (`e2e/flows.json`), and tests prove flows with Playwright tags. `docs/user-flows.md` is generated from a real run. A covered flow-by-device pair that loses its test fails CI.
- **License rule:** permissive licenses are allowed everywhere, MPL-2.0 only in development tools, and nothing else.
- **`npm audit`:** fails on high and critical findings.

**Why:**
- Every check fails on a real problem, with no paid service and no manual step.
- MPL-2.0 is file-level copyleft. `axe-core` uses it, and it's fine to use unchanged as a test tool, but it shouldn't be bundled into the app without a deliberate decision.
- A moderate advisory in a build tool shouldn't block every push. A high one should.

## App skeleton tooling choices (2026-11-03)
**Decision:** for story 0.4:
- **Adapter:** SvelteKit's `adapter-auto`, with the Vercel adapter also installed at a pinned version. The auto adapter uses it when building on Vercel and does a plain build everywhere else.
- **Pre-commit hooks:** Lefthook alone. It hands only the staged files to Prettier and ESLint, re-stages Prettier's fixes, and hides unstaged edits while it runs (tested with a partly staged file), so lint-staged isn't needed.
- **Release age:** `.npmrc` sets `min-release-age=14`, so every install, including `npm update` and Dependabot's lockfile updates run locally, refuses releases under two weeks old.
- **Install scripts:** none approved. npm 11 blocks dependency install scripts unless they're approved. The only one is Lefthook's `postinstall`, and the project's own `prepare` script already installs the hooks.
- **Markdown formatting:** Prettier formats code, config and YAML, but not Markdown.
- **Node:** pinned to 24.18.0 in `.nvmrc`, with `engines` allowing any 24.x from that version up.

**Why:**
- The Vercel adapter creates symbolic links, which Windows refuses without Developer Mode, so a local build failed. Keeping it installed stops the auto adapter from downloading an unpinned copy at deploy time.
- One hook tool is simpler than two and does the same job.
- A rule in a setting can't be forgotten the way a documented `--before` flag can.
- Install scripts are the most common way a hijacked package runs code on a developer's machine.
- Prettier pads every table cell to the widest one. In docs like `risks.md` that makes rows hundreds of characters long, and any wording change rewrites the whole table in the diff. GitHub renders Markdown the same either way.
- Node 24 is the current long-term support line.

## Accept three dev-tool advisories until their fixes are two weeks old (2026-11-03)
**Decision:** `npm audit` reports 19 findings (16 moderate, 3 low). They all come from three advisories in build-time tools: `minimatch` (a slow pattern match, through ESLint), `glob` (through the Vercel adapter's file tracer) and `deepmerge` (through the Svelte Vite plugin). They're accepted for now and rechecked on 2026-11-11.

**Why:**
- None of them ships to users or handles user input. They only process glob patterns and config the project writes itself.
- The fixed `minimatch` and `glob` releases came out on 2026-10-27 and 28. That's inside the project's rule that a release must be two weeks old before it's installed. The rule protects against hijacked releases, which are a bigger risk than these advisories.
- `deepmerge` has no fixed release.
- The `npm audit` step in CI (story 0.5) will fail on high and critical findings, so these moderate ones won't block it. Dependabot (story 0.6) proposes updates to indirect dependencies too, so it will propose the fixes once they're 14 days old.

## Go with TipTap and our own layout engine; update page breaks on a typing pause (2026-11-03)
**Decision:** following [spike 0.S](spikes/0S-layout.md):
- the editor is TipTap, with page breaks drawn as decorations from one shared layout engine;
- breaks are recalculated about 150 ms after typing pauses, and move along with the text in between;
- the typing target is enforced in CI in Chromium at full speed on GitHub's standard runner, and the 4×-slower result is reported but not enforced.
**Why:** the spike measured 7–31 ms at the 95th percentile in Chromium, Firefox and WebKit, at full speed and at 2× slower, with zero wrapping mismatches across 2,725 elements. Recalculating on a pause took most of the page-break cost off each keystroke. At 4× slower, the editor itself is about 50 ms on a 157-page document. Enforcing that would mean rendering the script in sections, which is a large change for budget hardware the owner doesn't write on. The original "mid-range laptop profile" couldn't be checked in CI, so the target now names a machine CI actually runs on.
**Rejected:** `content-visibility: auto`, measured slower. A separate page preview instead of pages in the editor: not needed, since the main approach works.

## Live at coldopen.kfraker.dev, set up before v0.1.0 (2026-11-03)
**Decision:** the live site's address is `coldopen.kfraker.dev`, a subdomain of the owner's portfolio site. It's set up in story 3.7, before the first release, rather than at v1.0.0.
**Why:** a subdomain is free and ties the app to the portfolio. Setting it up before v0.1.0 means Google sign-in is registered once, on the final address, and the address shared with reviewers never changes.

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
