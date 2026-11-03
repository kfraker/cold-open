# Cold Open

A professional script-writing web app. Write feature screenplays, TV scripts, stage plays and audio dramas, and the formatting is applied for you as you type. Each script lives in its own project, with its title page, characters and locations, notes, outline, beat board and revision history. Scripts export to PDF, Final Draft (`.fdx`) and Fountain.

> **Status: planning.** No app code exists yet. This project is being planned and built to a written set of standards from the first commit, and the planning itself is part of the repo. See [What's here so far](#whats-here-so-far).

## Live link
Not deployed yet. A demo you can try without signing up is planned (Epic 8).

## Screenshots
None yet. They'll be added when there's something to show.

## How it's built
Planned stack, all on free tiers:

| Part | Choice |
|---|---|
| App | SvelteKit + TypeScript |
| Editor | TipTap / ProseMirror (open-source parts only) |
| Database | Neon Postgres with Drizzle ORM |
| Sign-in | Google, through Auth.js |
| Hosting | Vercel |

Reasons for each choice are in the [decision log](docs/decisions.md).

## How it's tested
Planned: unit tests with coverage, browser tests on desktop and phone sizes in Chromium, Firefox and WebKit, automated accessibility checks (WCAG 2.2 AA), a performance budget, and a user flow coverage report. All of them run on every push. None of this is in place yet. This section will describe only what's actually running.

## What's here so far
- [Roadmap and requirements](docs/requirements/roadmap.md): epics and stories with acceptance criteria.
- [Decision log](docs/decisions.md): key decisions and why they were made.
- [Contributing](CONTRIBUTING.md): branches, commits, pull requests, and the Definitions of Ready and Done.
- [Changelog](CHANGELOG.md) (technical) and [release notes](RELEASE_NOTES.md) (plain language).

## What's next
Epic 0 sets up the planning documents and the foundation: requirements, a proof of concept of the page layout, CI, security scanning, previews and the database sandbox. The first usable version, v0.1.0, comes after Epic 3, and will let you write a feature screenplay and export it as a PDF.

## License
[MIT](LICENSE)
