# Services

How Cold Open connects to each external service, and what each costs. This file holds no secrets. Connection strings and keys live only in the hosting provider's encrypted settings and in the local `.env`, which Git ignores.

*Status: planned. Each row is filled in with real settings and dashboard paths as its story is done.*

## Map
| Service | Used for | Set up in | Status |
|---|---|---|---|
| GitHub (`kfraker/cold-open`) | Code, CI (Actions), Dependabot, secret scanning, CodeQL, Releases | 0.1, 0.5, 0.6 | Repo created 2026-11-03. CI (`.github/workflows/ci.yml`) runs on every push, with no secrets. CodeQL (`.github/workflows/codeql.yml`) and Dependabot (`.github/dependabot.yml`) set up 2026-11-05. Repo settings (Settings → Code security): Dependabot alerts on, Dependabot security updates off, secret scanning and push protection on, private vulnerability reporting on. Auto-merge off. Branch rulesets (Settings → Rules → Rulesets) are copied in `.github/rulesets/`: `Protect main` (id 26639104) and `Protect dev` (id 26639105). |
| Vercel (Hobby) | Hosting, `dev` preview, deploy gate | 0.7 | `vercel.json`: installs with `npm ci`; only `main` (production) and `dev` (preview) deploy. Dashboard settings: see [Vercel](#vercel) below. |
| Neon (Free) | Postgres: `main` (real), `dev` (sandbox), separate demo database | 0.8, Epic 8 | Not yet |
| Google Cloud | OAuth client for sign-in | Epic 1 | Not yet |
| kfraker.dev DNS | `coldopen.kfraker.dev` pointing at Vercel | 3.7 | Not yet |
| Codecov | Coverage reports on pull requests | Optional follow-up | Not connected. Needs the owner to sign in at codecov.io. The coverage floor works without it ([why](decisions.md#ci-pipeline-design-2026-11-03)). |
| Sentry | Error alerts | before v0.1.0 | Not yet |
| UptimeRobot | Uptime check | before v0.1.0 | Not yet |

## Vercel
*Being set up in story 0.7. The settings below are confirmed, with dates, by the pull request that records the deploy gate proof.*

- **Project:** `cold-open` on the `kfraker` Hobby account, imported from GitHub. Framework preset SvelteKit; the build and install commands come from `package.json` and `vercel.json`. No environment variables yet (the database arrives in story 0.8).
- **Production branch:** `main` (Settings → Environments → Production).
- **Preview:** `dev` builds at the branch address `cold-open-git-dev-kfraker.vercel.app`, behind Vercel's login (Deployment Protection → Vercel Authentication, the default). Other branches don't deploy.
- **Deploy gate:** Settings → Build and Deployment → Deployment Checks lists the four required GitHub checks. A production deployment is built but not promoted until they all pass on its commit. Force Promote on the deployment page overrides it; it's never used without the owner's say-so.
- **Rollback:** Instant Rollback (see [releasing.md](releasing.md)).

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
