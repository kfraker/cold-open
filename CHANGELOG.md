# Changelog

The complete technical record of changes, written for developers. Plain-language summaries are in the [release notes](RELEASE_NOTES.md). Versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Added
- Repo basics (story 0.1): MIT `LICENSE`, `README.md` for visitors, this changelog, `RELEASE_NOTES.md`, `CONTRIBUTING.md` (branches, Conventional Commits, pull requests, code review, Definitions of Ready and Done), `.github/pull_request_template.md`, `docs/decisions.md`, and `docs/requirements/roadmap.md` with Epic 0's stories and acceptance criteria.
- `.gitattributes` makes text files use LF line endings on every platform. `.editorconfig` sets shared indentation and encoding rules, and `.gitignore` excludes `.env` files, build output and test reports.
- Branches: `main` (production) and `dev` (integration).
- Planning documents (story 0.2) in `docs/`:
  - `product-brief.md`: goals, non-goals and success measures.
  - `nfr.md`: 14 measurable targets, including 50 ms p95 typing latency on a 150-page script, 300-page maximum, LCP under 2.5 s, and RPO 24 h / RTO 1 h.
  - `architecture.md`: component diagram, data model, environments.
  - `services.md`: service map and free-tier budget.
  - `security.md`: data inventory and 11-item threat model, each with a protection and a test.
  - `releasing.md`: SemVer, expand/contract migrations, rollback, encrypted daily backups.
  - `risks.md`: 9 risks.
  - `process.md`: how the project is run.
- Full requirements (story 0.3): Epics 1–9 in `docs/requirements/roadmap.md`, broken into 60 stories with sizes and acceptance criteria, linked to flows and threat ids. `docs/user-flows.md` lists 36 user flows (68 flow-by-device pairs, all gaps for now), with desktop-only exceptions explained.
- Spike 0.S write-up in `docs/spikes/0S-layout.md`. Code is on the unmerged `spike/layout` branch: TipTap + decoration page breaks + a pure TS layout engine, with 157 pages and 2,725 elements.
  - Typing p95: 7–28 ms in Chromium, Firefox and WebKit at full speed; 25–31 ms at 2× CPU slowdown; 58–76 ms at 4× with breaks recalculated on a 150 ms pause.
  - Zero wrap mismatches between the DOM and the engine.
  - Decision: go. `nfr.md` redefines the typing target as enforced on the CI runner unthrottled, with 4× reported. `risks.md` R1 is now monitored. Roadmap 0.9 and 3.2 gain acceptance criteria from the findings.
- App skeleton (story 0.4):
  - Scaffolded with `sv@1.1.1` (minimal template, TypeScript): SvelteKit 3.1, Svelte 5.57 (runes), Vite 8.3, TypeScript 6.0 with `strict`.
  - Node pinned: `.nvmrc` is 24.18.0 and `engines` is `>=24.18.0 <25`. `.npmrc` sets `engine-strict`, `save-exact` and `min-release-age=14`. No dependency install scripts are approved.
  - Every dev dependency is an exact version published before 2026-10-20.
  - `adapter-auto`, with `@sveltejs/adapter-vercel@7.0.1` also installed so the deploy build uses a pinned adapter.
  - Prettier 3.9 with the Svelte plugin (Markdown excluded). ESLint 10 flat config with typescript-eslint and eslint-plugin-svelte. `svelte-check --fail-on-warnings`.
  - Lefthook 2.2 pre-commit hook, installed by `prepare`, running in order: Prettier on staged files (fixes re-staged), ESLint with `--max-warnings 0`, then `npm run check`. Tested with a formatting error, a lint error and a type error.
  - Vitest 5 with `server` (Node) and `client` (browser, for later component tests) projects. One unit test: `src/lib/page-title.spec.ts`.
  - Playwright 1.64 runs `e2e/*.e2e.ts` against the production build on port 4173 (`--strictPort`), in `desktop` (Desktop Chrome) and `phone` (Pixel 7) projects. One test: `e2e/home.e2e.ts`.
  - The hook's type check also runs when only JSON or HTML files are staged. The root `*.config.js` files are type-checked too.
  - Placeholder home page at `/`.
  - `npm audit`: 19 findings from three build-time advisories, accepted until 2026-11-11 (see the decision log).
- CI pipeline (story 0.5), `.github/workflows/ci.yml`. Runs on every push, with a read-only token and actions pinned to commit SHAs. Two jobs:
  - **checks:** Prettier and ESLint, `svelte-check`, Vitest with v8 coverage, a dependency license check, and `npm audit --audit-level=high`.
    - Coverage thresholds start at 100% for `src/lib`; `autoUpdate` raises them, rounded down, on local runs only. Totals go to the run summary.
    - `scripts/check-licenses.ts` allows permissive licenses, plus MPL-2.0 for dev-only packages. It parses SPDX expressions with grouping, AND/OR precedence and `WITH` exceptions, and reads the legacy `licenses` array.
  - **browsers:** Playwright in five projects (`chromium`, `firefox`, `webkit`, `pixel-7`, `iphone-14`) with no retries, then the flow report. The HTML report is uploaded on failure.
  - `e2e/fixtures.ts`: every browser test fails on an uncaught JavaScript error, a console error, a failed request or an HTTP status of 400 or above. It also runs an axe scan (WCAG 2.0–2.2 A and AA tags) when the test ends. Requests the browser cancels (`net::ERR_ABORTED`, `NS_BINDING_ABORTED`, `NS_ERROR_ABORT`, WebKit `Load request cancelled`) are ignored, and so are the console's "Failed to load resource" messages, which repeat an error response or failed request already recorded. A test can list problems it expects with the `expectedProblems` option. `e2e/guards.e2e.ts` proves each of these behaviors.
  - User flow coverage:
    - `e2e/flows.json` holds the flow list, converted from `docs/user-flows.md`.
    - `e2e/flow-reporter.ts` records the `@Fnn` tags on passing tests, and fails the run on an unknown flow ID.
    - `scripts/flow-report.ts` writes the run summary, guards against losing coverage against `e2e/flow-baseline.json`, and regenerates `docs/user-flows.md` with `--update`. `--update` refuses to drop covered pairs unless `--allow-drop` is passed. CI runs it only when the browser tests ran.
  - The Playwright web server binds to `127.0.0.1`. On Windows, `vite preview` listened only on `::1`, and Firefox sometimes tried IPv4 first and was refused (1 run in 30).
  - The accessibility guard test adds its element outside the app root. Svelte hydration removed it under load, so the test failed in all five projects in parallel runs.
  - New dev dependencies: `@axe-core/playwright@4.14.0`, `@vitest/coverage-v8@5.0.5`. New scripts: `test:coverage`, `flows:report`, `flows:update`, `licenses`. `npm test` now runs everything.
- Security scanning and branch protection (story 0.6):
  - `.github/dependabot.yml`: weekly npm and GitHub Actions version updates into `dev`, with a 14-day cooldown, minor and patch updates grouped, and Conventional Commit prefixes (`build(deps)`, `ci(deps)`).
  - `.github/workflows/codeql.yml`: CodeQL `security-extended` for `javascript-typescript` and `actions`, `build-mode: none`, `github/codeql-action@v4.39.1` pinned by SHA. Runs on pull requests and pushes to `main` and `dev`, weekly, and by hand.
  - Repo settings: Dependabot alerts and private vulnerability reporting turned on. Secret scanning and push protection were already on. Dependabot security update pull requests stay off (see the decision log).
  - Rulesets, copied in `.github/rulesets/`. `main`: pull request only, merge commits only, conversations resolved, required checks (both CI jobs and both CodeQL jobs, bound to the GitHub Actions app), CodeQL merge protection (errors, and high or critical security alerts), no force push or deletion, and no bypass actors. `dev`: the same, without CodeQL merge protection.
  - `SECURITY.md`: how to report a vulnerability privately.
  - Proven by a manual check: a direct push to `main` as the repo owner was refused with `GH013` (pull request required, 4 of 4 checks expected, code scanning results awaited), and `main` was unchanged.
  - Code review fixes: Dependabot includes indirect dependencies; `dev` also requires pull requests and the four checks; CodeQL cancels only superseded pull request runs, so push and scheduled baselines always finish; comments next to the CI and CodeQL job names point to the rulesets; docs say exactly what the rulesets enforce; the decision log records the cooldown's lockfile gap and how to handle a blocking advisory.
- Previews and deploy gate (story 0.7):
  - `vercel.json`: Vercel installs with `npm ci`, and only `main` and `dev` deploy (`git.deploymentEnabled`).
  - Vercel project with `main` as production and a `dev` preview behind Vercel Authentication, with Deployment Checks on the four required checks. Settings are recorded in `docs/services.md`, confirmed 2026-11-09.
  - Temporary CI step "Deploy gate proof" that failed on every CI run on `main`, to prove the gate. On 2026-11-09 the merge of release A (`3730935`) failed CI at that step, and Vercel held the production deployment ("Checks for Deployment have failed"). The step is now removed.
  - Release B (`eef5960`) passed all four checks and Vercel promoted it, so production went live.
  - Addresses: production `cold-open-bay.vercel.app`, preview `cold-open-git-dev-kfraker.vercel.app` (behind Vercel Authentication).
  - CI runs on `main` and `dev` are no longer cancelled by a newer push, since the deploy gate waits for each commit's checks.
  - Roadmap 0.7: the preview criterion is now "checked on a phone".

- Database sandbox (story 0.8):
  - Dependencies: `drizzle-orm@0.45.4` and `postgres@3.4.9` (postgres.js); dev: `drizzle-kit@0.31.11`.
  - `src/lib/server/settings.ts`: checks for `APP_ENV` (`sandbox` or `production`) and `DATABASE_URL`. The sandbox may only use the `cold_open_sandbox` database and production only `cold_open`. A Vercel preview must be a sandbox and Vercel production must be production. Messages never include the connection string. Also derives the direct (unpooled) address, and hides the host and password in driver errors.
  - `src/env.ts` declares both settings with SvelteKit 3's `defineEnvVars`, so a missing or invalid one stops the build and the app with a clear message. `src/hooks.server.ts` `init` checks they agree when the app starts. A `vite.config.ts` plugin runs the same agreement check during Vercel builds, so crossed production settings fail the build instead of being promoted.
  - SANDBOX badge in `src/routes/+layout.svelte`, shown when `APP_ENV` is `sandbox` (placeholder styling until story 1.1).
  - Drizzle: `drizzle.config.ts` (no database address in it), an empty `src/lib/server/db/schema.ts`, and `drizzle/meta/_journal.json`. Scripts `db:generate`, `db:check`, `db:migrate` (`scripts/db-migrate.ts`: sandbox only, uses the direct address, reports how many migrations it applied) and `db:paste-url` (`scripts/db-paste-url.ts`: saves the pooled sandbox connection string from the clipboard into `.env` without showing it, clears the clipboard, and checks the connection). `src/lib/server/env-file.ts` holds its tested helpers. `.env.example` lists the settings. `drizzle/` is excluded from Prettier, so it stays exactly as generated.
  - CI `checks` job: a throwaway `postgres:17-alpine` service, pinned by digest. New steps check the schema and the migrations agree, then apply the migrations twice, and the second run must apply nothing.
  - Browser tests run the app with sandbox settings (`e2e/settings.ts`), which override any local `.env`. `e2e/sandbox.e2e.ts` checks the badge, and starts the built app with missing settings, a sandbox given the production database, a preview set up as production, and production. Each server gets a free port from the system, so a test can't reach another server by mistake (a fixed port did, under `--repeat-each`). Passed 180 of 180 runs at 8 workers.
  - `docs/security.md` threat T12 (development or testing touches real data). `docs/services.md` lists where each setting lives, plus the Neon setup. `docs/architecture.md`, `docs/releasing.md` and `CONTRIBUTING.md` cover the settings, local setup and migrations.
  - `npm audit`: 21 findings (4 low, 17 moderate), adding esbuild GHSA-67mh-4wv8-2f99 through `drizzle-kit`. Accepted until 2026-11-11 with the others (see the decision log).
  - Code review fixes, before the first commit:
    - A connection string may only carry `sslmode` and `channel_binding` after `?`. postgres.js passes any other setting to the server, so `?database=cold_open` could have connected to production behind the name check.
    - The database name is checked as written, not decoded, because that's what the driver uses.
    - `driverUrl()` drops `channel_binding` from Neon's snippet before connecting, since postgres.js would pass it on as an unknown server parameter.
    - `.env` values with `$`, `#`, quotes, spaces or line breaks are refused, not saved for Vite to misread.
    - Clipboard-clearing commands no longer capture output, which could hang on Linux with xclip.
    - `redact()` copes with a password that isn't valid percent-encoding.
    - Playwright no longer reuses an already-running server, which could have had other settings.
    - The startup tests also notice a server ended by a signal.
  - CodeQL fix (`js/file-system-race`): `db:paste-url` reads `.env` once, treating a missing file as empty, rather than checking it exists and then reading it. A new `.env` is created readable only by its owner (on macOS and Linux).
  - Migration tests proven on pull request #15: a schema change without a migration, and a migration that can't apply, each turned CI red at the intended step, then were reverted.

### Changed
- Dependabot skips major versions of `@types/node` (kept on 24 to match the Node pin) and `typescript` (`svelte-check@4.7.7` doesn't support 7 yet).
- First Dependabot updates, merged into `dev` 2026-11-09: #7 (`vite` 8.3.4 → 8.3.5, plus the lockfile's `rolldown` 1.2.15, `@rollup/pluginutils` 5.5.1, `postcss-selector-parser` 7.1.7, `svelte-eslint-parser` 1.10.0) and #10 (`@babel/parser`, `@babel/types` and `@babel/helper-string-parser` 7.29.11). Every new locked version was at least 16 days old when reviewed.
