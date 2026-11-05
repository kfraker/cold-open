# Services

How Cold Open connects to each external service, and what each costs. This file holds no secrets. Connection strings and keys live only in the hosting provider's encrypted settings and in the local `.env`, which Git ignores.

*Status: planned. Each row is filled in with real settings and dashboard paths as its story is done.*

## Map
| Service | Used for | Set up in | Status |
|---|---|---|---|
| GitHub (`kfraker/cold-open`) | Code, CI (Actions), Dependabot, secret scanning, CodeQL, Releases | 0.1, 0.5, 0.6 | Repo created 2026-11-03. CI (`.github/workflows/ci.yml`) runs on every push, with no secrets. CodeQL (`.github/workflows/codeql.yml`) and Dependabot (`.github/dependabot.yml`) set up 2026-11-05. Repo settings (Settings → Code security): Dependabot alerts on, Dependabot security updates off, secret scanning and push protection on, private vulnerability reporting on. Branch rulesets (Settings → Rules → Rulesets) are copied in `.github/rulesets/`. |
| Vercel (Hobby) | Hosting, `dev` preview, deploy gate | 0.7 | Not yet |
| Neon (Free) | Postgres: `main` (real), `dev` (sandbox), separate demo database | 0.8, Epic 8 | Not yet |
| Google Cloud | OAuth client for sign-in | Epic 1 | Not yet |
| kfraker.dev DNS | `coldopen.kfraker.dev` pointing at Vercel | 3.7 | Not yet |
| Codecov | Coverage reports on pull requests | Optional follow-up | Not connected. Needs the owner to sign in at codecov.io. The coverage floor works without it ([why](decisions.md#ci-pipeline-design-2026-11-03)). |
| Sentry | Error alerts | before v0.1.0 | Not yet |
| UptimeRobot | Uptime check | before v0.1.0 | Not yet |

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
