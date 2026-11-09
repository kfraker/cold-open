# Services

How Cold Open connects to each external service, and what each costs. This file holds no secrets. Connection strings and keys live only in the hosting provider's encrypted settings and in the local `.env`, which Git ignores.

*Status: in progress. GitHub, Vercel and Neon are set up; the other rows are filled in with real settings and dashboard paths as their stories are done.*

## Map
| Service | Used for | Set up in | Status |
|---|---|---|---|
| GitHub (`kfraker/cold-open`) | Code, CI (Actions), Dependabot, secret scanning, CodeQL, Releases | 0.1, 0.5, 0.6 | Repo created 2026-11-03. CI (`.github/workflows/ci.yml`) runs on every push, with no secrets. CodeQL (`.github/workflows/codeql.yml`) and Dependabot (`.github/dependabot.yml`) set up 2026-11-05. Repo settings (Settings → Code security): Dependabot alerts on, Dependabot security updates off, secret scanning and push protection on, private vulnerability reporting on. Auto-merge off. Branch rulesets (Settings → Rules → Rulesets) are copied in `.github/rulesets/`: `Protect main` (id 26639104) and `Protect dev` (id 26639105). |
| Vercel (Hobby) | Hosting, `dev` preview, deploy gate | 0.7 | `vercel.json`: installs with `npm ci`; only `main` (production) and `dev` (preview) deploy. Dashboard settings: see [Vercel](#vercel) below. |
| Neon (Free) | Postgres: `main` (real), `dev` (sandbox), separate demo database | 0.8, Epic 8 | Sandbox and production set up in story 0.8: see [Neon](#neon) below. Demo database not yet. |
| Google Cloud | OAuth client for sign-in | Epic 1 | Not yet |
| kfraker.dev DNS | `coldopen.kfraker.dev` pointing at Vercel | 3.7 | Not yet |
| Codecov | Coverage reports on pull requests | Optional follow-up | Not connected. Needs the owner to sign in at codecov.io. The coverage floor works without it ([why](decisions.md#ci-pipeline-design-2026-11-03)). |
| Sentry | Error alerts | before v0.1.0 | Not yet |
| UptimeRobot | Uptime check | before v0.1.0 | Not yet |

## Vercel
Set up 2026-11-09 (story 0.7).

- **Project:** `cold-open` on the `kfraker` Hobby account, imported from GitHub. Framework preset SvelteKit; the build and install commands come from `package.json` and `vercel.json`. Environment variables: see [Settings](#settings) below.
- **Production branch:** `main` (Settings → Environments → Production). Production address: `cold-open-bay.vercel.app` (Vercel added `-bay` because `cold-open.vercel.app` was taken). `coldopen.kfraker.dev` comes in story 3.7.
- **Preview:** `dev` builds at https://cold-open-git-dev-kfraker.vercel.app, behind Vercel's login (Deployment Protection → Vercel Authentication, the default). Other branches don't deploy.
- **Deploy gate:** Settings → Build and Deployment → Deployment Checks lists the four required GitHub checks. They were imported from a commit SHA with **Show All Checks** on, because `main` had no checks yet. `CodeQL` (GitHub's summary check) is not selected. A production deployment is built but not promoted until they all pass on its commit. Force Promote on the deployment page overrides it; it's never used without the owner's say-so.
- **Rollback:** Instant Rollback (see [releasing.md](releasing.md)).

## Settings
The app needs two settings everywhere, with no defaults. A missing or wrong one stops the build or the app with a message saying what's wrong (see the [decision log](decisions.md#database-sandbox-2026-11-09)).

| Setting | Local (`.env`) | `dev` preview | Production | CI |
|---|---|---|---|---|
| `APP_ENV` | `sandbox` | `sandbox` | `production` | `sandbox` |
| `DATABASE_URL` | Neon `dev` → `cold_open_sandbox`, pooled | Neon `dev` → `cold_open_sandbox`, pooled | Neon `main` → `cold_open`, pooled | Browser tests: a local placeholder that nothing connects to yet. Migration tests: the job's throwaway Postgres. |
| Where it's set | `npm run db:paste-url` | Vercel → Settings → Environment Variables, Preview, branch `dev` only | Vercel → Settings → Environment Variables, Production only | `playwright.config.ts` (`e2e/settings.ts`) and `.github/workflows/ci.yml` |

- On Vercel, both `DATABASE_URL` values are **Sensitive**: they can't be read back after saving. They're pasted from Neon's Copy snippet straight into Vercel, never through chat or a file.
- A setting change on Vercel takes effect on the next deployment: Deployments → the deployment's **⋯** → Redeploy.
- `VERCEL_ENV` is set by Vercel itself. The app uses it to check that a preview is a sandbox and production is production.
- The address Neon shows for a pooled connection has `-pooler` in its host. Migrations use the same address without it.

## Neon
Set up 2026-11-09 (story 0.8). *(Project details are filled in once the owner has created it.)*

- **Project:** `cold-open`, Free plan.
- **Branches:** `main` (default; production) and `dev` (sandbox, a child of `main`).
- **Databases:** `cold_open` exists only on `main`; `cold_open_sandbox` only on `dev`. Neon's default `neondb` is left alone and unused; the app refuses it.
- **To get a connection string:** the branch → **Connect** → choose the database, keep connection pooling on → **Copy snippet**. Check the database name before pasting anywhere.
- **Resetting the sandbox** (`dev` → Reset from parent) replaces it with a copy of `main`, which doesn't have `cold_open_sandbox`. The sandbox then refuses to start until `cold_open_sandbox` is created again on `dev` and `npm run db:migrate` is rerun. Don't reset it once `main` holds real data, because the reset copies that data into the sandbox.

## Cost budget
Every service is on a free plan. The limits below are what's published as of 2026-11. Each one is re-checked against the provider's pricing page when its story is set up, and corrected here if it differs.

| Service | Free-tier limit that matters | Expected use | What happens near the limit |
|---|---|---|---|
| GitHub Actions | Unlimited minutes for public repos | Every push, plus at most one scheduled job a day | n/a |
| Vercel Hobby | Non-commercial use only; about 100 GB bandwidth a month | Personal use plus occasional reviewers | Far below the limit; Cold Open stays non-commercial |
| Neon Free | About 0.5 GB storage per project; limited monthly compute; short point-in-time restore window | Text scripts are small (about 100–300 KB each); revisions are the main growth | Revisions are compressed and thinned out over time; usage is noted here each release; old automatic snapshots are pruned first |
| Sentry Developer | About 5,000 errors a month | Very low | Alert rules limit noise; script text is never sent |
| UptimeRobot Free | 50 monitors, checking every 5 minutes | 1–2 monitors | n/a |
| Codecov | Free for public repos | Every pull request | n/a |
| Google OAuth | Free | Sign-in only | n/a |

Anything that can't be done for free goes in the [decision log](decisions.md), with the closest free alternative.
