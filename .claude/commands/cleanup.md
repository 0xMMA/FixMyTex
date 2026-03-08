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
   - Run `git branch -vv` and find branches whose upstream is marked `[gone]`
   - Skip the current branch — never delete the branch you're on
   - For each stale branch: `git branch -d <branch>` (safe delete — will refuse if unmerged)
   - If `-d` fails on a branch (unmerged work): warn the user and skip that branch
   - List any deleted branches and any that were skipped

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
