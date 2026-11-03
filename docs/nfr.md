# Non-functional targets

Measurable quality targets. Each one names how it's proven. Checks marked **CI** run automatically on every push once their story is done. Those marked **manual** are done by a person at the stated point and recorded in the pull request.

| Area | Target | Proven by | From story |
|---|---|---|---|
| Typing speed | Keystroke to next paint under **50 ms at the 95th percentile** in a 150-page script, in Chromium at full speed on GitHub's standard CI runner (close to a mid-range laptop). The same benchmark with the CPU 4× slower (a budget laptop or mid-range phone) is reported, not enforced. | Typing benchmark in Playwright (CI). Spike 0.S measured 7–28 ms in all three engines on a fast desktop, 25–31 ms at 2× slower and 58–76 ms at 4× slower | 0.S, 0.9 |
| Script size | Scripts up to **300 pages** open, edit, paginate and export | Browser test with a generated 300-page script (CI) | 3.x |
| Page load | Largest Contentful Paint under **2.5 s** on Lighthouse mobile settings; Total Blocking Time under **200 ms** | Lighthouse CI budget (CI) | 0.9 |
| Page weight | Editor page JavaScript under **250 KB gzipped**; other pages under **100 KB** | Lighthouse CI budget (CI) | 0.9 |
| Accessibility | **WCAG 2.2 AA**. No axe violations on any page or editor state. Everything works by keyboard alone. Screen readers announce element types | axe in Playwright (CI); NVDA spot check once per epic (manual) | 0.5 |
| Contrast | All design tokens meet AA contrast in light and dark themes | Token contrast unit test (CI) | 0.10 |
| Browsers | Last 2 versions of Chrome, Edge, Firefox and Safari; iOS Safari; Android Chrome | Playwright on Chromium, Firefox and WebKit, plus Pixel 7 and iPhone 14 sizes (CI); real phone check on the preview before releases (manual) | 0.5 |
| Phone sizes | No sideways scrolling, tap targets at least 24×24 px (WCAG 2.5.8), panels reachable as drawers | Playwright phone tests (CI) | 0.5 |
| Lost typing | **None.** Changes are in the browser copy before the save request is sent | Offline, reload and tab-crash browser tests (CI) | 2.x |
| Server data loss (RPO) | At most **24 hours**, from daily backups | Backup job's success alert; restore drill (manual) | before v0.1.0 |
| Restore time (RTO) | Under **1 hour**, following `docs/releasing.md` | Restore drill timed and recorded (manual) | before v0.1.0 |
| Availability | Problems are noticed before a visitor reports them | UptimeRobot check every 5 minutes, plus Sentry error alerts, both tested (manual) | before v0.1.0 |
| Format accuracy | Page breaks and margins match each type's cited formatting guide | Layout engine tests against reference pages (CI) | 3.x, 4.x |
| Cost | **$0 a month** | Free-tier limits tracked in `docs/services.md` | ongoing |

Targets can be tightened when measurements show room, and loosened only with a decision log entry explaining why.
