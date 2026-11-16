# Security and privacy

## What data is held
| Data | Where | Sensitivity |
|---|---|---|
| Scripts, notes, title pages and revisions | Neon (`main`); a copy in the writer's own browser (IndexedDB) | **High.** Unpublished creative work. |
| Google account id, email, name | Neon `users` | Personal data |
| Session cookie | Browser | Grants account access |
| Demo workspaces | Separate demo database, deleted after 24 hours | Low. Visitors are warned not to enter anything private. |
| Backups | Encrypted files (see [releasing.md](releasing.md)) | Same as the scripts they contain |

**Never logged or sent to third parties:** script text, notes, titles and title page contents. Error reports carry ids and error details only.

## Threat model
| # | Threat | Protection | Proven by |
|---|---|---|---|
| T1 | Another signed-in user reads or changes your project | Every query goes through one access layer that checks project membership. Missing or not-yours both return "not found." | Tests as user B on user A's project pages, API and exports, expecting "not found" (CI) |
| T2 | Someone outside the allow-list signs in | `ALLOWED_EMAILS` is checked on every sign-in. A missing setting allows **no one**. | Tests: unlisted account refused; missing setting refuses everyone (CI) |
| T3 | Harmful content arrives through an imported file or a paste (cross-site scripting) | The editor accepts only known script node types and plain text, never raw HTML. Imports are converted to those nodes. A strict Content Security Policy is set. | Unit tests with hostile Fountain, FDX and pasted HTML; CSP header test (CI) |
| T4 | An FDX file tries XML attacks (entity expansion, external entities) or is huge | Parsed with the browser's `DOMParser`, which doesn't load external entities. Import is refused above a size and node-count limit. | Tests with an entity-bomb file and an oversized file (CI) |
| T5 | Cross-site request forgery or a stolen session | SvelteKit's origin check on form and API posts. Session cookies are `Secure`, `HttpOnly` and `SameSite=Lax`. Security headers are set (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame blocking). | Header and cookie checks in browser tests; cross-origin post refused (CI) |
| T6 | Demo misuse (spam, storage abuse, reaching real data) | Separate demo database with no route to real accounts. Caps on script size, projects and request rate. 24-hour cleanup. | Browser tests of each limit and of the cleanup job (CI) |
| T7 | Script text leaks through logs or error reports | Sentry's `beforeSend` scrubs request bodies and editor content. Server logs record ids, not content. | Unit test of the scrubber with a sample script (CI) |
| T8 | Secrets leak | Push protection and secret scanning on the repo. Secrets live only in Vercel and the local `.env`. Connection strings are entered from the clipboard by a script that never displays them. | GitHub secret scanning (CI); `.gitignore` check |
| T9 | A compromised or vulnerable dependency | Lockfile committed; Dependabot updates aimed at `dev`; `npm audit` and a license check in CI; CodeQL. | CI |
| T10 | Backups expose scripts | Backups are encrypted before they leave the CI runner. Nothing unencrypted is uploaded, because artifacts on a public repo can be downloaded by any signed-in GitHub user. | Backup job test: the uploaded file can't be read without the key (CI) |
| T11 | A bad release damages data | Database changes use expand/contract and only move forward. A Neon snapshot is taken before each production migration. | See [releasing.md](releasing.md); migration tests (CI) |
| T12 | Development or testing touches real data | Each environment has its own database: `cold_open_sandbox` on Neon's `dev` branch, `cold_open` on `main`, and a throwaway Postgres in CI. `APP_ENV` must match the database name, a Vercel preview must be a sandbox, and missing settings have no fallback, so a wrong setup refuses to start or fails its build. Everything except the live site shows a SANDBOX badge. Migration and local scripts refuse anything but the sandbox. | Unit tests of every settings check; browser tests that start the app with missing and crossed settings, and check the badge (CI) |

## Reviews
- Each pull request gets an automated code review before the owner reviews it.
- A full security review (`/security-review`) runs before anything goes public: the demo (Epic 8) and v1.0.0. Findings are fixed or logged with a reason.
