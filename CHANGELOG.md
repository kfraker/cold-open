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

