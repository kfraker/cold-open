# Security policy

## Reporting a vulnerability
Please report security problems privately through GitHub: on this repo's **Security** tab, choose **Report a vulnerability**. Don't open a public issue.

The aim is to reply within a week. Fixes are released as soon as they're tested, and the release notes credit the reporter unless they'd rather not be named.

## Supported versions
Only the latest release is supported.

## How the project is protected
- **Dependabot** watches dependencies for known vulnerabilities and proposes updates every week.
- **CodeQL** scans the code and the CI workflows on every pull request. A high or critical alert blocks a merge to `main`.
- **Secret scanning with push protection** stops a push that contains a recognised secret.
- **CI** runs `npm audit` and a dependency license check on every push.
- **`main` is protected:** it changes only through a pull request with every check passing, and no one can bypass that, the owner included.

The threat model, with the protection and test for each threat, is in [docs/security.md](docs/security.md).
