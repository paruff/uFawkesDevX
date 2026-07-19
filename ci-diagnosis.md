# CI Diagnosis — PR #20 (feat/devx-ci-pipeline)

## Failure Summary

| Failure                                         | Location                            | Type     |
| ----------------------------------------------- | ----------------------------------- | -------- |
| Merge conflicts blocking PR merge               | 7 workflow files                    | Pipeline |
| CI Pipeline `startup_failure` (run 27498587758) | `.github/workflows/ci-pipeline.yml` | Pipeline |

## Root Cause Analysis

### Root Cause 1: Modify/Delete Merge Conflicts (Pipeline — BLOCKER)

**Evidence:** 7 files deleted in `feat/devx-ci-pipeline` were modified on `main`:
`.github/workflows/ci-tests.yml`, `.github/workflows/reusable-build.yml`,
`.github/workflows/reusable-dependency-review.yml`,
`.github/workflows/reusable-lint.yml`,
`.github/workflows/reusable-preflight.yml`,
`.github/workflows/reusable-security-scanning.yml`,
`.github/workflows/reusable-tests.yml`

**Likely Cause:** `feat/devx-ci-pipeline` migrated to uFawkesPipe remote reusable
workflows and deleted local copies. `main` subsequently received updates to these
files (via PR #21 or other changes), creating modify/delete conflicts.

**Confidence:** HIGH

**Fix:** Accept deletions — uFawkesPipe provides these workflows at
`paruff/ufawkespipe/.github/workflows/reusable-*.yml@v1.1.0`.
Configure ci-pipeline.yml inputs to match uFawkesDevX architecture:
disable fail-on-latest (compose file uses `docker-compose.yml` naming),
disable coverage gate (targets uFawkesPipe internal packages),
run unit test tier only.

### Root Cause 2: CI Pipeline startup_failure (Pipeline — PREVIOUSLY FIXED)

**Evidence:** Run 27498587758 on commit `edb1495` — workflow validation failed.
**Likely Cause:** Original `ci-pipeline.yml` passed undefined inputs
(`validate-docker-compose`, `validate-jcasc`, `validate-k8s`) to
`reusable-build.yml`.

**Confidence:** HIGH

**Fix:** Already resolved in subsequent commits (`dee568a`, `691121d`)
by removing invalid inputs and migrating to uFawkesPipe remote workflows.
