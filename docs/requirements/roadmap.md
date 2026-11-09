# Roadmap and requirements

Planned work as epics and stories, in dependency order. Each story is done when its acceptance criteria are met and it meets the [Definition of Done](../../CONTRIBUTING.md#definition-of-done). Finished work moves to the [changelog](../../CHANGELOG.md), and the reasoning behind big choices is in the [decision log](../decisions.md).

Sizes: **S** is about one sitting, **M** is a couple of sittings.

## Epic 0: Plan and foundation
*Status: in progress.* Everything a project needs before feature code: the planning documents, a proof of concept of the riskiest part, and the pipeline that guards every later change.

- **0.1 Repo basics** (S). *Done.*
  - The repo is public at `kfraker/cold-open` under the MIT license, with `main` and `dev` branches.
  - It has a README written for visitors that only claims what exists, a changelog, release notes, a contribution guide with Definitions of Ready and Done, a pull request template, and a decision log.
  - Text files use LF line endings, and `.env` files are ignored by Git.
- **0.2 Planning documents** (M). *Done.*
  - The repo has a product brief (problem, users, goals, non-goals, success measures), non-functional targets, an architecture and services map with free-tier limits, a threat model, release safety, risks, and a process record.
  - Each target and threat names the test or check that will prove it.
  - The owner has approved them.
- **0.3 Full requirements and user flows** (M). *Done.*
  - Epics 1–9 are broken into stories with acceptance criteria.
  - `docs/user-flows.md` lists every user flow, with the planned tests and devices for each.
  - The owner has approved them.
- **0.S Layout spike** (S–M, timeboxed, throwaway code). *Done: go ([write-up](../spikes/0S-layout.md)).*
  - A prototype shows TipTap plus a layout engine paginating a 150-page sample screenplay into correct pages.
  - Typing latency is measured. The result, a go or change-approach recommendation, is written up and decided by the owner.
- **0.4 App skeleton** (S). *Done.*
  - A SvelteKit + TypeScript (strict) app runs locally, with the Node version pinned.
  - Prettier, ESLint and `svelte-check` pass, and pre-commit hooks run them.
  - There is one unit test and one browser test.
- **0.5 CI pipeline** (M). *Done.*
  - Every push runs lint, type checks, unit tests with coverage that can't drop, and browser tests in Chromium, Firefox, WebKit and two phone sizes with axe accessibility checks.
  - It also produces a flow coverage report naming the gaps, runs a dependency license check and `npm audit`.
  - Browser tests fail on any JavaScript error or failed request.
  - A deliberately failing test turns the run red.
- **0.6 Security scanning and branch protection** (S). *Done.*
  - Dependabot, secret scanning with push protection, and CodeQL are on.
  - `main` accepts changes only through pull requests with the required checks passing, admins included. A direct push is tested and refused.
- **0.7 Previews and deploy gate** (S). *Done.*
  - Vercel builds a preview of `dev`, checked on a phone.
  - A production deploy waits for the tests to pass on `main`, proven with a deliberate failure.
  - *Status: preview checked on a phone, and a deploy held on a deliberate failure (2026-11-09). Release B, going live once the checks pass, completes the story.*
- **0.8 Database sandbox** (M).
  - Neon has `main` (production) and `dev` (sandbox) branches.
  - Drizzle migrations are tested in CI against a throwaway database.
  - Local runs and the preview show a SANDBOX badge.
  - A preview with no database setting fails instead of falling back to production.
  - Missing settings stop the app at startup with a clear message.
  - Connection strings are entered without ever being shown.
- **0.9 Performance budget** (S).
  - Lighthouse CI checks page weight, LCP and blocking time on mobile settings.
  - A typing benchmark, built from the spike's, measures keystroke-to-paint time on a 150-page script. In Chromium at full speed on the CI runner, it fails the build above 50 ms at the 95th percentile. The 4×-slower result is reported in the run summary, not enforced.
  - The CI runner's results are calibrated against the spike's numbers, and recorded.
  - Both checks fail the build when over budget, proven with a deliberate breach.
- **0.10 Design direction** (M).
  - 2–3 clickable mockups of the dark studio, three-pane look, each in light and dark.
  - The owner picks one, which becomes design tokens and base components that pass WCAG 2.2 AA contrast in both themes.

## Epic 1: Accounts and projects
*Status: planned.* Sign in, and manage the projects that hold each script. Flows: F01–F08, F36.

- **1.1 App shell and themes** (M).
  - Every page uses the design tokens and base components from 0.10.
  - The three-pane layout's side panels collapse and expand by mouse, touch and keyboard. Their state is remembered on that device.
  - Below 768 px wide, the side panels become drawers that open over the page and close with Escape or a close button. No sideways scrolling.
  - The theme follows the device setting. A toggle overrides it, and the choice is remembered.
  - Local and the preview show the SANDBOX badge.
  - Checked on desktop and both phone sizes, in both themes, with visual snapshots.
- **1.2 Sign in with Google, allow-list only** (M).
  - A Google OAuth client is registered for local, the `dev` preview and live.
  - Signing in with an email on `ALLOWED_EMAILS` opens the project list. Signing in with any other email shows "This account doesn't have access" and creates no account.
  - If `ALLOWED_EMAILS` is missing or empty, nobody can sign in.
  - Visiting any app page while signed out goes to the sign-in page, then back to that page after signing in.
  - Signing out ends the session on the server and returns to the sign-in page.
  - Session cookies are `Secure`, `HttpOnly` and `SameSite=Lax`.
  - CI uses a test session; a real Google sign-in is checked by hand on the preview.
- **1.3 Project access layer** (S).
  - Every project query goes through one module that checks the signed-in user's membership. A test fails if any route reads project tables directly.
  - As user B, every page, API and export URL for user A's project returns "not found," the same as a project that doesn't exist (threat T1).
- **1.4 Project list** (M).
  - Shows each project's title, script type, page count and when it was last edited, newest first.
  - With no projects, it shows a short welcome and a "New project" button.
  - Works by keyboard and on phone sizes.
- **1.5 Create a project** (S).
  - "New project" asks for a title and a script type, offering only the types available so far. It then opens the editor on an empty script whose first element is the type's starting element (a scene heading for screenplays).
  - A blank title is refused with a message beside the field.
  - The creator becomes the project's owner in `project_members`.
- **1.6 Rename and duplicate** (S).
  - A project can be renamed from the list or the editor.
  - Duplicating one copies its script, title page, notes and cards (not its revisions) into a new project called "<title> (copy)".
- **1.7 Delete, with a 30-day trash** (S).
  - Deleting asks for confirmation, then moves the project to Recently deleted, where it can be restored for 30 days.
  - After 30 days, the daily cleanup job removes it permanently.
  - A deleted project's URLs return "not found."

## Epic 2: Editor core (feature screenplay)
*Status: planned. Depends on the spike's outcome.* Write a screenplay with formatting applied as you type. Flows: F09–F16.

- **2.1 Screenplay type definition** (M).
  - The feature screenplay is defined in the script-type format from the [decision log](../decisions.md): scene heading, action, character, parenthetical, dialogue, transition, shot and general. Each element has its margins, caps, spacing and alignment.
  - Its source formatting guide is cited in the definition.
  - The definition passes the schema check, and a broken definition fails with a clear error.
- **2.2 Element nodes in the editor** (M).
  - Each paragraph is one element and shows that element's margins, caps and spacing.
  - The current element's name shows in the toolbar and the details panel.
  - Pasting from other apps keeps only the text. The pasted text becomes action, or dialogue if the cursor is in dialogue (threat T3).
- **2.3 Enter and Tab move between elements** (M).
  - Enter and Tab follow the type definition. For example: Enter after a scene heading gives action, Enter after a character gives dialogue, and Tab on an empty action line gives a character.
  - Every rule in the definition is covered by a test generated from the definition itself.
  - Pressing Enter on an empty element cycles to the next sensible element, and Backspace at the start of an empty element removes it.
- **2.4 Change an element directly** (S).
  - Keyboard shortcuts (`Ctrl`/`⌘` + 1–8) and a toolbar menu change the current element type.
  - A shortcut cheat sheet opens from the help menu and with `?`.
- **2.5 Auto-complete** (M).
  - In a character element, names already in the script are suggested.
  - In a scene heading, `INT.`, `EXT.` and `INT./EXT.`, known locations and times of day (`DAY`, `NIGHT`, and so on) are suggested.
  - Suggestions are a proper listbox: arrow keys move, Enter or Tab accepts, Escape closes, and screen readers announce them.
- **2.6 Autosave and save status** (M).
  - Changes are saved about 1 second after typing pauses, as editor steps with the version they apply to.
  - The status reads "Saved," "Saving…" or "Offline – saved on this device," and screen readers announce it politely.
  - A failed save retries with back-off, and the status never says "Saved" until the server has confirmed it.
- **2.7 Browser copy, offline writing and recovery** (M).
  - Every change is written to IndexedDB before it's sent.
  - With the network cut, writing continues, and the changes sync when it's back.
  - Reloading or crashing the tab, then reopening the project, shows every change, online or offline.
  - If the browser copy and the server copy have both changed, for example after another tab or device was used, a dialog shows both and asks which to keep. The other copy is kept as a revision, so nothing is silently lost.
  - Browser tests cover going offline, reloading, a crashed tab, reconnecting, and the conflict dialog.
- **2.8 Undo and redo** (S).
  - Undo and redo work by shortcut and toolbar, including for element changes and auto-completed text.
- **2.9 Writing on phones** (M).
  - On phone sizes, a toolbar above the keyboard offers an element picker and "next element" in place of Tab.
  - The cursor stays visible above the on-screen keyboard.
  - Tested on both phone sizes, and checked by hand on a real phone on the preview.
- **2.10 Editor accessibility** (S).
  - The editor is a labelled multi-line text box.
  - Moving into an element announces its type ("Character," "Dialogue").
  - All editor features work by keyboard alone, and axe passes in the editor's states (empty, writing, suggestions open, dialogs open).
  - NVDA spot check by hand.

## Epic 3: Layout engine, page view and screenplay PDF
*Status: planned.* What you see is what prints. Flows: F17, F18. Ends with **v0.1.0, first real use**.

- **3.1 Layout engine** (M).
  - A pure TypeScript function turns a script and its type definition into pages of lines. It uses a fixed grid: 12pt Courier Prime, 10 characters per inch, 6 lines per inch, US Letter, and the type's margins.
  - It follows these rules from the cited guide:
    - a scene heading isn't left alone at the bottom of a page;
    - a character name stays with its dialogue;
    - dialogue that splits across pages breaks at a sentence where possible, with (MORE) at the bottom and "NAME (CONT'D)" at the top;
    - transitions don't start a page if avoidable.
  - Reference scripts written for the project have expected page breaks, checked by unit tests.
- **3.2 Page view** (M).
  - The editor shows page edges and page numbers (top right, from page 2), matching the layout engine exactly.
  - Page breaks are recalculated about 150 ms after typing pauses, and move along with the text in between.
  - Every break, including one that splits a speech, spans the full page width.
  - Arrow keys, selection and copying work across page breaks. Copied text never includes (MORE), (CONT'D) or page numbers.
  - Writing in page view still meets the typing target.
  - On phone sizes the page view scales to fit, or a reflowed draft view is offered.
- **3.3 Dual dialogue** (S).
  - Two consecutive speeches can be marked as dual dialogue. They show side by side in the page view and the PDF.
- **3.4 Scene numbers** (S).
  - Scene numbers can be turned on per project. They show in both margins, in the page view and the PDF.
- **3.5 Screenplay PDF export** (M).
  - Export makes the PDF in the browser.
  - It has embedded Courier Prime and selectable text, and it's named after the project.
  - It has the same page count and page breaks as the page view (tested by comparing the layout engine's output with the PDF's text per page).
  - It works offline.
- **3.6 Large scripts** (S).
  - A generated 300-page script opens, scrolls, accepts typing within the target, paginates and exports in CI.
- **3.7 Safety net before real data** (M).
  - Sentry reports errors from the browser and the server, with script text scrubbed (threat T7). A test error reaches the owner.
  - UptimeRobot checks the live site every 5 minutes, and a test outage reaches the owner.
  - The daily encrypted backup runs (threat T10).
  - A restore drill is done and timed, with the result recorded in [releasing.md](../releasing.md).
  - `coldopen.kfraker.dev` points at the live site over HTTPS, through a DNS record on kfraker.dev, and it's the address registered with Google OAuth.
- **3.8 Release v0.1.0** (S).
  - A release pull request with the changelog, release notes and version goes from `dev` to `main`. The owner merges it.
  - The tag and GitHub Release are created, and the owner signs in and writes on the live site.

## Epic 4: Script type system
*Status: planned.* Write in every format, including your own. Flows: F19–F21.

- **4.1 TV single-camera** (M).
  - Adds teaser or cold open, act headings and end-of-act lines. Each act starts on a new page.
  - It's defined, tested and has a cited guide, like the screenplay.
- **4.2 TV multi-camera** (M). *May move to just after v1.0.0 (open item).*
  - Adds caps action, double-spaced dialogue, scene letters, act and scene headings on new pages, and entrances and exits underlined.
- **4.3 Stage play** (M).
  - Adds act and scene headings, centred character cues, indented stage directions in parentheses, and a cast list on the title page.
- **4.4 Audio drama** (M).
  - Adds `SFX:` and `MUSIC:` cues, and character cues with numbered speeches or cues.
- **4.5 Create a custom type** (M).
  - A new type starts as a copy of a built-in type or blank.
  - Each element's name, margins, caps, spacing, alignment and its Enter and Tab rules can be edited, with a live preview.
  - Invalid settings, such as margins that leave no room on the page or Enter rules pointing to an element that doesn't exist, are refused with a message beside the setting.
- **4.6 Use and manage custom types** (S).
  - Custom types appear when creating a project.
  - Editing a type updates every project that uses it.
  - A type in use can't be deleted. The message lists the projects using it.
- **4.7 Change a project's script type** (S).
  - Elements are mapped to the new type by name, or to the closest element. The writer sees the mapping and confirms it before anything changes.
  - A revision is saved first.

## Epic 5: Project contents
*Status: planned.* Everything about the script, in one project. Flows: F22–F27.

- **5.1 Title page** (S).
  - Fields: title, credit, author(s), source, contact, draft date and notes. Each is formatted per the script type.
  - The title page appears in the PDF and can be turned off.
- **5.2 Characters** (M).
  - The navigator lists every character found in the script, with their number of scenes and first appearance. Selecting one shows their scenes and notes.
  - Renaming a character updates every character element and every "(CONT'D)", with a preview of the number of changes, and it can be undone.
- **5.3 Locations** (S).
  - Lists every location found in scene headings, with their scenes and notes.
- **5.4 Scene outline** (M).
  - The navigator lists scenes from the scene headings, with page numbers. Selecting a scene jumps to it.
  - Scenes can be reordered by drag, or by keyboard ("move up" and "move down"), which moves the scene's content in the script, and it can be undone.
- **5.5 Notes** (S).
  - Project notes, and notes attached to a scene, which show in the details panel when the cursor is in that scene.
  - Notes are never printed.
- **5.6 Beat board** (M).
  - Index cards with a title, text, colour and an optional linked scene, arranged freely on a board.
  - Cards can be moved by mouse, touch and keyboard. Colour is never the only way to tell cards apart.
  - On phones the board shows as an ordered list.

## Epic 6: Drafts and revisions
*Status: planned.* Go back to any earlier version. Flows: F28–F30.

- **6.1 Automatic snapshots** (M).
  - While writing, a compressed snapshot is saved every 10 minutes and when the project is closed.
  - They're thinned out over time: all of them for a day, then one per day for 30 days, then one per week.
  - Named drafts are never thinned. Tested with fake clocks.
- **6.2 Named drafts** (S).
  - "Save draft" stores a named snapshot ("Second draft," "Notes from the table read") with its date. They're listed in the details panel.
- **6.3 Compare two versions** (M).
  - Any two versions can be compared element by element.
  - Additions and removals are marked by text styles and labels as well as colour, so the difference is clear without colour and to screen readers.
- **6.4 Restore** (S).
  - Restoring a version first saves the current script as a snapshot, so a restore can always be undone.
- **6.5 Storage check** (S).
  - A test confirms a 120-page script with a year of simulated revisions stays within the storage budget in [services.md](../services.md).

## Epic 7: Import and export
*Status: planned.* Scripts come in and go out in standard formats. Flows: F18, F31–F34.

- **7.1 PDF for every script type** (S).
  - Each built-in type and a sample custom type export to PDF, with page breaks matching the page view.
- **7.2 Fountain export** (S).
  - Exports to the [Fountain](https://fountain.io/) syntax, including the title page, and opens in other Fountain apps.
- **7.3 Fountain import** (M).
  - A `.fountain` file becomes a new project with its title page and elements. Anything unrecognised becomes action and is reported.
  - Files over the size limit are refused.
  - Hostile files are tested, and text never becomes HTML (threat T3).
- **7.4 FDX export** (M).
  - Exports to Final Draft's `.fdx` with elements and title page. It opens in Final Draft's free trial or a free FDX reader, with any gaps listed as known limitations.
- **7.5 FDX import** (M).
  - An `.fdx` file becomes a new project.
  - XML entity tricks and oversized files are refused (threat T4).
- **7.6 Round-trip tests** (S).
  - Importing then exporting the sample scripts gives back the same text and elements, for Fountain and FDX.

## Epic 8: Demo mode
*Status: planned.* Anyone can try Cold Open in under a minute, without signing up. Flow: F35.

- **8.1 Separate demo database** (M).
  - The demo uses its own Neon database with no connection to real accounts.
  - A demo session can't reach any real-account URL or data (tested).
- **8.2 "Try it"** (M).
  - The sign-in page has a "Try it – no sign-up" button. It creates a temporary workspace with sample projects in each built-in type and opens one.
  - A banner says it's a demo and that work is deleted after 24 hours.
  - A timed browser test shows a formatted sample script in under 1 minute from landing on the site, on desktop and phone.
- **8.3 Demo limits** (S).
  - Caps on script size, number of projects and request rate. Each limit shows a clear message and has a test (threat T6).
- **8.4 Daily cleanup** (S).
  - A scheduled job, at most once a day, deletes demo workspaces older than 24 hours and permanently removes trash older than 30 days. It reports what it removed.
- **8.5 Security review** (S).
  - `/security-review` runs before the demo goes public. Findings are fixed, or logged in the decision log with a reason.

## Epic 9: Production readiness and v1.0.0
*Status: planned.*

- **9.1 Alerts and rollback tested** (S).
  - A test error, a test outage and a failed backup each reach the owner.
  - A Vercel Instant Rollback is done and undone, with the steps checked in [releasing.md](../releasing.md).
- **9.2 Second restore drill** (S).
  - Timed against the 1-hour target and recorded.
- **9.3 Standards audit** (S).
  - A `project-standards` audit finds every standard met or N/A, with evidence. Any gaps are fixed first.
- **9.4 README for reviewers** (S).
  - Screenshots in light and dark, on desktop and phone; the live and demo links; how it's built and tested, with real numbers; and what's next. Every claim is backed by the repo.
- **9.5 Release v1.0.0** (S).
  - Release pull request merged by the owner, then the tag and GitHub Release.
- **9.6 Case study** (S).
  - A Cold Open project page on kfraker.dev, written from [process.md](../process.md) at product-owner level. This is done in the kfraker.dev repo, under its own process.
