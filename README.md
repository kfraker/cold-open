# Cold Open

A professional script-writing web app. Write feature screenplays, TV scripts, stage plays and audio dramas, and the formatting is applied for you as you type. Each script lives in its own project, with its title page, characters and locations, notes, outline, beat board and revision history. Scripts export to PDF, Final Draft (`.fdx`) and Fountain.

> **Status: foundation.** Planning is done, and the app skeleton exists: a placeholder page, formatting, lint and type checks, and the first tests. No features yet. This project is being planned and built to a written set of standards from the first commit, and the planning itself is part of the repo. See [What's here so far](#whats-here-so-far).

## Live link
Not deployed yet. A demo you can try without signing up is planned (Epic 8).

## Screenshots
None yet. They'll be added when there's something to show.

## How it's built
Stack, all on free tiers. SvelteKit and TypeScript are in place; the rest is planned:

| Part | Choice |
|---|---|
| App | SvelteKit + TypeScript |
| Editor | TipTap / ProseMirror (open-source parts only) |
| Database | Neon Postgres with Drizzle ORM |
| Sign-in | Google, through Auth.js |
| Hosting | Vercel |

Reasons for each choice are in the [decision log](docs/decisions.md).

## How it's tested
**On every push** ([CI workflow](.github/workflows/ci.yml)), and any failure turns the run red:
- formatting, lint and type checks;
- unit tests (Vitest), with a coverage floor that can't drop;
- browser tests in Chromium, Firefox and WebKit, and at Pixel 7 and iPhone 14 sizes (Playwright);
- every browser test of the app also fails on a JavaScript error, a failed request, or a WCAG 2.2 AA accessibility violation (axe), and separate tests prove each of those checks catches its problem;
- a [user flow coverage report](docs/user-flows.md) that names the gaps, and fails if a proven flow loses its test;
- a dependency license check and `npm audit`.

The same formatting, lint and type checks also run before every commit.

**Security scanning:** CodeQL scans the code and workflows on every pull request, and a pull request whose scan finds a high or critical alert can't merge into `main`. Dependabot watches dependencies and proposes updates weekly, and secret scanning blocks a push containing a recognised secret. `main` and `dev` change only through a pull request with every check passing, with no bypass for anyone ([rules](.github/rulesets/README.md), [security policy](SECURITY.md)).

There are no features yet, so there are only a few tests. Most of them prove the checks above actually catch problems.

**Planned:** a performance budget and a typing-speed benchmark (story 0.9).

This section only describes what's actually running.

## What's here so far
- [Product brief](docs/product-brief.md): the problem, who it's for, goals, non-goals and how success is measured.
- [Roadmap and requirements](docs/requirements/roadmap.md): epics and stories with acceptance criteria.
- [User flows](docs/user-flows.md): every goal a person can achieve in the app, the devices each must be proven on, and which are covered. Generated from the tests.
- [Non-functional targets](docs/nfr.md): measurable speed, size, accessibility, browser and data-safety targets, each with the check that proves it.
- [Architecture](docs/architecture.md) and [services](docs/services.md): how it fits together, its environments, and the free-tier budget.
- [Security and privacy](docs/security.md): the threat model, with the protection and test for each threat.
- [Releasing](docs/releasing.md): versions, database change rules, rollback, and backups.
- [Risks](docs/risks.md) and [how this project is run](docs/process.md).
- [Spike 0.S](docs/spikes/0S-layout.md): a throwaway prototype that proved the editor's page layout is accurate and fast enough before real code depended on it.
- [Decision log](docs/decisions.md): key decisions and why they were made.
- [Contributing](CONTRIBUTING.md): how to run it locally, branches, commits, pull requests, and the Definitions of Ready and Done.
- [Changelog](CHANGELOG.md) (technical) and [release notes](RELEASE_NOTES.md) (plain language).

## What's next
Epic 0 sets up the planning documents and the foundation: requirements, a proof of concept of the page layout, CI, security scanning, previews and the database sandbox. The first usable version, v0.1.0, comes after Epic 3, and will let you write a feature screenplay and export it as a PDF.

## License
[MIT](LICENSE)
