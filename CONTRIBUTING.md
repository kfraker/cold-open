# Contributing

How work gets done on Cold Open. Requirements are written down and agreed before work starts, every change goes through a pull request with passing tests, and a person approves every release to production.

## Branches
- `main` is production. It only changes through a pull request from `dev`, and those pull requests are merged by hand. A [ruleset](.github/rulesets/README.md) enforces the pull request: CI and CodeQL must pass, a pull request whose scan finds a high or critical alert can't merge, and nobody can bypass it, admins included. That the pull request comes from `dev` and is merged by hand is a working rule.
- `dev` also changes only through a pull request with the same checks passing, and can't be force-pushed or deleted.
- If a fix ever has to land on `main` without going through `dev`, merge `main` back into `dev` straight after, so the next release is tested as it will be merged.
- `dev` is where work comes together. Every push to it builds the Vercel preview. Other branches don't deploy. Each story can have its own short-lived branch off `dev` (`story-0.4-skeleton`), merged back by pull request.
- Never push directly to `main`.

## Commits
[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, with the story number in the body or summary.

| Type | Use for |
|---|---|
| `feat` | A new feature users can see |
| `fix` | A bug fix (always with a test that failed before the fix) |
| `docs` | Documentation only |
| `test` | Tests only |
| `refactor` | A code change with no change in behavior |
| `perf` | A speed or size improvement |
| `build` / `ci` | Dependencies, tooling or the CI pipeline |
| `chore` | Anything else |

## Pull requests
- Fill in the [template](.github/pull_request_template.md) checklist.
- Each pull request gets an automated code review before a person is asked to review it. A security review runs before anything goes public.
- All required checks must pass. A check that fails intermittently gets investigated until the cause is found. It is never just rerun until it passes.

## Definition of Ready
A story can start when:
- its acceptance criteria are written in [the roadmap](docs/requirements/roadmap.md) and agreed;
- the user flows it touches are listed in `docs/user-flows.md` *(from story 0.3)*;
- its design is known (a mockup, or the agreed design tokens and components);
- anything it depends on is done.

## Definition of Done
A story is done when:
- every acceptance criterion is met and proven by an automated test, or by a named manual check where a test isn't possible;
- browser tests pass on desktop and phone sizes, with no accessibility (axe) violations;
- code coverage hasn't dropped, and the flows it touches are marked covered;
- the changelog, the release notes and any affected docs are updated;
- it has been checked on the `dev` preview.

Items that depend on tooling not yet in place (from Epic 0) apply as soon as that tooling exists.

## Getting started
Install Node.js 24 (the exact version is in `.nvmrc`), then:

```sh
npm ci                            # exact locked versions; also installs the git hooks
npx playwright install chromium   # browser for the browser tests
npm run dev                       # the app at http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run lint` | Prettier formatting check, then ESLint |
| `npm run format` | Fix formatting |
| `npm run check` | Type check (`svelte-check`), failing on warnings |
| `npm run test:unit` | Unit tests in watch mode (add `-- --run` to run once) |
| `npm run test:coverage` | Unit tests once, with coverage (fails if coverage drops) |
| `npm run test:e2e` | Browser tests in all five browser projects, against a production build |
| `npm run flows:report` | User flow coverage after a full browser run (fails if a covered flow lost its test) |
| `npm run flows:update` | Accept new flow coverage, and regenerate `docs/user-flows.md`. Refuses if coverage dropped, unless you add `-- --allow-drop` and say why in the PR |
| `npm run licenses` | Dependency license check |
| `npm test` | Unit tests with coverage, browser tests and the flow report |

For browser tests, install all three engines once: `npx playwright install chromium firefox webkit`.

## Writing tests
- Import `test` and `expect` from `e2e/fixtures.ts`, not from `@playwright/test`. A test then fails on any JavaScript error, console error, failed request or error response, and on any WCAG 2.2 AA violation when it ends. Requests the browser cancels, for example by navigating away, don't count.
- If a test expects one of those problems, such as a 403 on a refused sign-in, list it narrowly: `test.use({ expectedProblems: [/^HTTP 403: /] })`.
- Tag the user flows a test proves: `test('...', { tag: '@F05' }, async ({ page }) => ...)`. New flows go in `e2e/flows.json` first. After a full run, `npm run flows:update` records the new coverage.
- Tests aren't retried. If a test fails some of the time, find the cause.
- Shared code in `src/lib` needs unit tests. Coverage can't drop below the floor in `vite.config.ts`, and lowering the floor is a visible change that needs a reason.

## Tools and versions
- Node.js version is pinned in `.nvmrc` and `package.json` `engines`.
- Dependencies are exact versions (`save-exact`). `.npmrc` refuses any release less than 14 days old (`min-release-age`), so a just-published hijacked release can't slip in.
- Dependency install scripts are blocked unless approved, and none are. npm's warning about Lefthook's `postinstall` is expected: the hooks are installed by this project's own `prepare` script.
- Before every commit, a Lefthook hook:
  1. formats the staged files (Prettier);
  2. lints them (ESLint, with no warnings allowed);
  3. type-checks the project (`svelte-check`).

  CI runs the same checks, so skipping the hook doesn't skip them.
- Prettier formats code, config and YAML, but not Markdown ([why](docs/decisions.md#app-skeleton-tooling-choices-2026-11-03)).
- Dependencies must use licenses compatible with MIT. CI checks this (`npm run licenses`). Only the open-source parts of TipTap are used, never paid extensions.

## Dependency updates
Dependabot opens update pull requests into `dev` every Monday, only for releases at least 14 days old. Minor and patch updates come grouped in one pull request. Review them like any other change: CI must pass, and check the changelog of anything that changes behavior.

## Secrets
Never commit secrets or paste them into issues, pull requests or chat. Secret scanning with push protection is on, so a push containing a recognised secret is refused. Local settings live in `.env`, which Git ignores. Production secrets live only in the hosting provider's encrypted settings.
