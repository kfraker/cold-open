# Product brief

## Problem
Writing a script that looks professional means following strict formatting rules. Margins, capitalisation, spacing and page breaks differ for film, TV, stage and audio. Industry tools either cost a subscription, lock scripts into their own format, or are built for production teams rather than a single writer. Writers fear losing work more than anything, and many tools only save when the connection holds.

## Who it's for
- **Primary: the owner,** writing seriously as a hobby in several formats, at a desk and sometimes on a phone or tablet.
- **Secondary: portfolio reviewers** (hiring managers, product and engineering leads) who try the demo for a minute or two and read the repo to judge how the product was planned and built.

## Goals (v1.0.0)
1. **Formatting is automatic.** Choosing an element (scene heading, action, character, dialogue, and so on) or pressing Enter or Tab gives the right layout. You never set margins by hand.
2. **Several formats, and your own.** Feature screenplay, TV (single-camera and multi-camera), stage play and audio drama are built in. You can define your own script types with their own elements and rules.
3. **Everything for a script in one project:** title page, characters and locations, notes, outline, beat board, and drafts with revision history.
4. **Your work is never lost.** Autosave, a copy kept in the browser, offline writing, and a tested backup and restore.
5. **Scripts can leave the app.** PDF in industry format, Final Draft (`.fdx`) and Fountain. Fountain and FDX can also be imported.
6. **Reviewers can try it immediately,** in a demo with no sign-up.

## Non-goals (v1.0.0)
- Co-writing or sharing. The design leaves room for it, but it isn't built.
- Public sign-up. Only the owner has a real account.
- App-store mobile apps. The website works on phones instead.
- Production tools: scheduling, budgets, script breakdowns, call sheets.
- AI writing features.
- Languages other than English, and page sizes other than US Letter. A4 may come later.
- Paid tiers or monetisation.

## How success is measured
| Measure | Target | How we know |
|---|---|---|
| Real use | The owner writes and exports a complete script in Cold Open | The owner confirms; the script exists in the app |
| Format accuracy | Exported PDFs match the cited formatting guide for each type | Layout engine tests against reference pages; a manual check against the guide per type |
| No lost work | Zero incidents of lost typing | Offline, reload and crash browser tests; incident log in `docs/releasing.md` |
| Reviewer experience | A visitor reaches a formatted sample script in under 1 minute, without signing up | A timed browser test of the demo flow |
| Standards | Every standard in the project-standards checklist is met with evidence | An audit with the `project-standards` skill before v1.0.0 |
| Cost | $0 a month | Services notes in `docs/services.md` |
