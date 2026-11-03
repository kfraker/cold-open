# Roadmap and requirements

Planned work as epics and stories, in dependency order. Each story is done when its acceptance criteria are met and it meets the [Definition of Done](../../CONTRIBUTING.md#definition-of-done). Finished work moves to the [changelog](../../CHANGELOG.md), and the reasoning behind big choices is in the [decision log](../decisions.md).

Sizes: **S** is about one sitting, **M** is a couple of sittings.

## Epic 0: Plan and foundation
*Status: in progress.* Everything a project needs before feature code: the planning documents, a proof of concept of the riskiest part, and the pipeline that guards every later change.

- **0.1 Repo basics** (S). *Done.*
  - The repo is public at `kfraker/cold-open` under the MIT license, with `main` and `dev` branches.
  - It has a README written for visitors that only claims what exists, a changelog, release notes, a contribution guide with Definitions of Ready and Done, a pull request template, and a decision log.
  - Text files use LF line endings, and `.env` files are ignored by Git.
- **0.2 Planning documents** (M).
  - The repo has a product brief (problem, users, goals, non-goals, success measures), non-functional targets, an architecture and services map with free-tier limits, a threat model, release safety, risks, and a process record.
  - Each target and threat names the test or check that will prove it.
  - The owner has approved them.
- **0.3 Full requirements and user flows** (M).
  - Epics 1–9 are broken into stories with acceptance criteria.
  - `docs/user-flows.md` lists every user flow, with the planned tests and devices for each.
  - The owner has approved them.
- **0.S Layout spike** (S–M, timeboxed, throwaway code).
  - A prototype shows TipTap plus a layout engine paginating a 150-page sample screenplay into correct pages.
  - Typing latency is measured. The result, a go or change-approach recommendation, is written up and decided by the owner.
- **0.4 App skeleton** (S).
  - A SvelteKit + TypeScript (strict) app runs locally, with the Node version pinned.
  - Prettier, ESLint and `svelte-check` pass, and pre-commit hooks run them.
  - There is one unit test and one browser test.
- **0.5 CI pipeline** (M).
  - Every push runs lint, type checks, unit tests with coverage that can't drop, and browser tests in Chromium, Firefox, WebKit and two phone sizes with axe accessibility checks.
  - It also produces a flow coverage report naming the gaps, runs a dependency license check and `npm audit`.
  - Browser tests fail on any JavaScript error or failed request.
  - A deliberately failing test turns the run red.
- **0.6 Security scanning and branch protection** (S).
  - Dependabot, secret scanning with push protection, and CodeQL are on.
  - `main` accepts changes only through pull requests with the required checks passing, admins included. A direct push is tested and refused.
- **0.7 Previews and deploy gate** (S).
  - Vercel builds a preview of `dev`.
  - A production deploy waits for the tests to pass on `main`. Both are proven with a deliberate failure.
- **0.8 Database sandbox** (M).
  - Neon has `main` (production) and `dev` (sandbox) branches.
  - Drizzle migrations are tested in CI against a throwaway database.
  - Local runs and the preview show a SANDBOX badge.
  - A preview with no database setting fails instead of falling back to production.
  - Missing settings stop the app at startup with a clear message.
  - Connection strings are entered without ever being shown.
- **0.9 Performance budget** (S).
  - Lighthouse CI checks page weight, LCP and blocking time on mobile settings.
  - A typing benchmark harness can measure editor latency.
  - Both fail the build when over budget, proven with a deliberate breach.
- **0.10 Design direction** (M).
  - 2–3 clickable mockups of the dark studio, three-pane look, each in light and dark.
  - The owner picks one, which becomes design tokens and base components that pass WCAG 2.2 AA contrast in both themes.

## Epic 1: Accounts and projects
*Status: planned. Stories come in 0.3.* Allow-list Google sign-in, the project list, and creating, renaming, duplicating and deleting projects. One user can never see another's data.

## Epic 2: Editor core (feature screenplay)
*Status: planned.* Script elements, Enter and Tab switching, automatic caps, auto-complete, autosave with a browser copy and offline sync, undo, shortcuts, and screen-reader announcements.

## Epic 3: Layout engine, page view and screenplay PDF
*Status: planned.* Page-accurate view, page numbers, (MORE)/(CONT'D), dual dialogue, scene numbers and PDF export. Then **v0.1.0, first real use**, with backups, error alerts and an uptime check in place first.

## Epic 4: Script type system
*Status: planned.* Built-in TV, stage play and audio drama types, and an editor for custom types.

## Epic 5: Project contents
*Status: planned.* Title page, characters and locations, notes, outline and beat board.

## Epic 6: Drafts and revisions
*Status: planned.* Snapshots, comparing two versions, restoring, and thinning out old snapshots.

## Epic 7: Import and export
*Status: planned.* PDF for every script type, Fountain and FDX import and export, with round-trip and hostile-file tests.

## Epic 8: Demo mode
*Status: planned.* A separate demo database, sample scripts, a "Try it" button with no sign-up, limits, and a daily cleanup.

## Epic 9: Production readiness and v1.0.0
*Status: planned.* Alerts tested, a restore drill, a security review, a finished README with screenshots, a tested rollback, the `coldopen.kfraker.dev` address, the v1.0.0 GitHub Release, and a case study on kfraker.dev.
