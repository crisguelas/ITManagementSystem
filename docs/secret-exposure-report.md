/**
 * @file secret-exposure-report.md
 * @description Credential exposure assessment with commit evidence and remediation options.
 */

# Secret Exposure Report

## Summary

- Exposed credential pattern: `admin123`
- First introduction evidence: commit `edd0f71`
- Affected tracked files (historically/currently): `prisma/seed.ts`, `README.md`, `DEVELOPMENT_HISTORY.md`
- Local-only sensitive artifact found: `backups/db-data-backup-20260427-221407.json` (untracked at scan time)

## Evidence

- Commit search by content:
  - `git log --all -S admin123 --oneline`
  - Result: `edd0f71 refactor: unify asset and stock category model`
- File history containing references:
  - `git log --all --oneline -- prisma/seed.ts README.md DEVELOPMENT_HISTORY.md`
- Introduction commit scope:
  - `git show --stat --oneline edd0f71`

## Exposure Interpretation

- Since branch `main` tracks `origin/main`, and `admin123` appeared in tracked files, the value should be treated as published to remote history.
- Even after removing current references, old commits keep this value accessible until history rewrite is performed.

## Remediation Paths

### Path A — Fast containment (recommended immediate)

- Remove current hard-coded references from tracked files.
- Rotate all admin credentials for any environment seeded while this value existed.
- Keep monitoring and enforce secret scanning in CI.

### Path B — Full history purge (optional, higher coordination)

- Rewrite history to remove credential strings from all refs.
- Force-push rewritten branches and coordinate all collaborators to rebase/reset.
- Invalidate old forks/clones where possible.

## Decision Recommendation

- Execute Path A immediately (implemented in this change set).
- Schedule Path B only if policy requires complete historical purge from repository history.
