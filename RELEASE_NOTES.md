# Release notes

What changed in each version, in plain language, one line per change. The [changelog](CHANGELOG.md) has the full technical detail.

## Unreleased
- Started the project: license, README, contribution guide, decision log and the first set of requirements.
- Wrote the planning documents: what the app is for, quality targets, how it's built, how it stays secure, how releases and backups work, and the main risks.
- Wrote every planned feature as stories with acceptance criteria, and listed all 36 things a person can do in the app, with the devices each must be tested on.
- Tested the riskiest idea first with a throwaway prototype: a 157-page script shows accurate pages while typing stays fast in Chrome, Firefox and Safari's engines.
- Set up the app's foundation: a placeholder home page, automatic formatting and code checks before every commit, and the first two automated tests.
- Every change pushed to GitHub is now tested automatically in Chrome, Firefox and Safari's engines and at two phone sizes, with accessibility, license and security checks.
- The code is now scanned for security bugs, dependencies are watched and updated weekly, and the live version can only change through a pull request with every check passing.
- Every change merged into the development branch gets a private preview site, and an update to the live site is held back if any test fails.
- The live site is up, showing a placeholder page.
- Automatic dependency updates now skip two major upgrades the project isn't ready for, with the reasons recorded.
- The first automatic dependency updates (small fixes to the build tools) are in.
