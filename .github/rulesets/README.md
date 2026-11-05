# Branch rulesets

These files are the branch protection rules applied to the GitHub repo (story 0.6). GitHub stores rulesets in the repo's settings, not in Git, so these copies are the record of what's set. If you change one, apply it and commit the file in the same pull request.

- `main.json`: changes only through a pull request, merged as a merge commit. CI and CodeQL must pass, and no high or critical CodeQL alert can be open. No force pushes or deletion. No bypass, admins included.
- `dev.json`: no force pushes or deletion. Story branches still merge into `dev` by pull request.

Apply a changed ruleset (find its id with `gh api repos/kfraker/cold-open/rulesets`):

```sh
gh api -X PUT repos/kfraker/cold-open/rulesets/<id> --input .github/rulesets/main.json
```

Create one that doesn't exist yet:

```sh
gh api -X POST repos/kfraker/cold-open/rulesets --input .github/rulesets/main.json
```
