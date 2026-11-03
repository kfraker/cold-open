# How this project is run

A running record of how Cold Open was planned and built. It's the source for the project's case study.

## The approach
Cold Open is the first project planned and built to a written set of standards from the very first commit. The standards cover:
- protecting real data;
- requirements written before work starts;
- automated testing, including phone sizes and user-flow coverage;
- security, accessibility and performance checks;
- releases a person approves by hand;
- monitoring, backups, and honest public claims.

Work is done with Claude Code as the build partner. The owner acts as product owner and human in the loop. They make the product, design and scope decisions, approve each story, and merge every release to production themselves.

## Timeline

### 2026-11-03: Planning
- **The idea:** a professional script-writing website with built-in and custom script types, automatic formatting, and one project per script.
- **Questions before planning:**
  - Product: which script types and formats, what a project contains, and the export formats.
  - Accounts: who signs in and where scripts are stored.
  - Tech: the stack.
  - Repo: whether it's public, and whether there's a demo.
- **The owner sent the plan back three times** before approving it. Each time it added something:
  1. **Design.** The first draft hadn't asked about look and feel. The owner chose a dark studio look, a three-pane layout, light and dark themes, and mockups to choose from.
  2. **Naming.** Brainstormed names, then checked the shortlist for clashes with similar products. Draftroom was dropped because a student screenwriting project already uses it, and Cold Open was chosen.
  3. **What else should be settled before code?** This added:
     - scope decisions: an allow-list for sign-in, a browser copy so no work is lost, room for co-writing later, and an early first release;
     - measurable non-functional targets, including typing speed, which a page-load budget alone wouldn't catch;
     - a threat model;
     - database changes that keep rollback safe;
     - Definitions of Ready and Done;
     - a timeboxed spike for the riskiest part;
     - backups and alerts in place before the first real data, not at the end.
- **The process became a standard.** Everything that applies to any project became a 14-item "before any code" checklist, added to the owner's global standards. Every future project starts the same way.
- **Story 0.1:** public repo created under the MIT license, with the README, contribution guide, decision log and Epic 0 requirements.
- **Story 0.2:** these planning documents.
- **Story 0.3:** 60 stories for Epics 1–9 and 36 user flows, approved. The owner confirmed `coldopen.kfraker.dev` as the address, so setting it up moved from the last epic to before the first release.
- **Spike 0.S:** a throwaway prototype proved the editor approach before any real code depended on it.
  - Typing stayed well under target in all three browser engines, and the page view matched the layout engine line for line.
  - The layout engine's first unit tests caught a real pagination bug.
  - Two variants were measured and compared. One was rejected because it was slower, and one was adopted: recalculating page breaks on a typing pause.
  - The spike also showed the typing target couldn't be checked in CI as written. It now names the CI machine.
  - The owner chose go.

## Lessons
- Ask about design and naming. Don't fill them in. The first draft assumed a look, and the owner caught it.
- A page-load budget doesn't measure what matters most in an editor. Typing latency needed its own target and test.
- Artifacts on a public repo can be downloaded by any signed-in GitHub user, so backups must be encrypted before they're uploaded.
