# Branch rulesets

These files are the branch protection rules applied to the GitHub repo (story 0.6). GitHub stores rulesets in the repo's settings, not in Git, so these copies are the record of what's set. If you change one, apply it and commit the file in the same pull request.

- `main.json`: changes only through a pull request, merged as a merge commit. Both CI jobs and both CodeQL jobs must pass. CodeQL merge protection blocks the merge if the pull request's scan reports an error-level alert or a high or critical security alert. No force pushes or deletion. No bypass, admins included.
- `dev.json`: changes only through a pull request, with the same four checks passing. No force pushes or deletion. No bypass.

What the rules don't enforce, so it stays a working rule: pull requests into `main` come from `dev`, and the owner merges them by hand (auto-merge is turned off in the repo settings). CodeQL merge protection judges the alerts a pull request's scan finds. Alerts already open on `main`, for example from a new weekly query, are fixed as their own change.

The required check names are copies of the job names in `.github/workflows/ci.yml` and `codeql.yml`. If a job is renamed, update the ruleset in the same pull request, or merges wait forever for a check that no longer reports. After applying a change, compare the live ruleset with this copy: `gh api repos/kfraker/cold-open/rulesets/<id>`.

Apply a changed ruleset (find its id with `gh api repos/kfraker/cold-open/rulesets`):

```sh
gh api -X PUT repos/kfraker/cold-open/rulesets/<id> --input .github/rulesets/main.json
```

Create one that doesn't exist yet:

```sh
gh api -X POST repos/kfraker/cold-open/rulesets --input .github/rulesets/main.json
```
