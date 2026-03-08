# Cleanup — Fetch, Prune & Pull

Sync the local repo with `origin`, prune stale remote refs, and fast-forward the current branch.

## Context

- Run this between tasks or after shipping to keep the local clone tidy
- Safe by default: refuses to proceed if there are uncommitted changes

## Steps

1. **Guard against uncommitted changes**
   - Run `git status --porcelain`
   - Filter out lines starting with `!!` (ignored files) and `??` entries inside
     directories already in `.gitignore` (e.g. `.idea/`, `bin/`, `frontend/dist/`)
   - If any relevant changes remain: list them, warn the user, and **stop** — do not proceed

2. **Fetch and prune**
   - `git fetch --prune`
   - If any remote-tracking branches were pruned, list them
   - If fetch fails, report the error and stop

3. **Delete stale local branches**
   - Collect candidate branches: all local branches other than `main` (including the current one)
   - For each candidate, determine its status:
     a. **Has a merged PR** — check with `gh pr list --head <branch> --state merged --json number --jq '.[0].number'`
     b. **Has an open PR** — skip, still in progress
     c. **No PR exists** — skip, could be local WIP (just mention it in the report)
   - For branches with a merged PR, try `git branch -d <branch>` first
   - If `-d` fails (common with squash merges), verify the branch's work is in `main`:
     1. Find files the branch changed: `git diff --name-only $(git merge-base main <branch>) <branch>`
     2. Check those files against main: `git diff main <branch> -- <those files>`
     3. If that diff is empty (or only shows files added to main *after* the branch): safe to `git branch -D <branch>`
     4. If the branch has content not present in main: warn the user and skip it
   - If the current branch is being deleted, `git checkout main` first, then delete it
   - List deleted branches, skipped branches (with reasons), and any local-only branches

4. **Pull**
   - `git pull`
   - If pull fails (e.g. diverged history): report the error and stop — never force-pull

5. **Report outcome**
   - Current branch (`git branch --show-current`)
   - Latest commit (`git log --oneline -1`)
   - Confirm clean status

## Notes
- Stop and report clearly if any step fails — never skip a failure silently
- Never use `--force` on pull or fetch
- If $ARGUMENTS is provided, ignore it — this command takes no arguments
