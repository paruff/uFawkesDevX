# CI Fix Report

## Changes

### Fix 1: Remove invalid workflow inputs (root cause)
- **File:** `.github/workflows/ci-pipeline.yml`
- **Change:** Removed `validate-docker-compose`, `validate-jcasc`, and `validate-k8s` from the `build` job's `with:` block
- **Why:** These input parameters were not defined in the called workflow `reusable-build.yml`, causing GitHub Actions to reject the workflow at parse time with a `startup_failure`
- **Pattern preserved:** `fail-on-latest` is the only input passed, which IS defined in `reusable-build.yml`

### Fix 2: Update actions/checkout v6 → v7
- **Files:** All 8 workflow files (19 occurrences total)
- **Change:** `uses: actions/checkout@v6` → `uses: actions/checkout@v7`
- **Why:** Applies Dependabot PR #16 which was already reviewed and merged to `main`

## Changes Summary
```
 9 files changed, 19 insertions(+), 22 deletions(-)
```

## Validation

| Check | Result |
|-------|--------|
| YAML syntax check (all 9 modified files) | ✅ All valid |
| Unit test suite (17 tests) | ✅ 17/17 passed |
| Pre-commit hooks | ✅ Pass |
| Diff reviewed | ✅ Only intended changes |

## Remaining Risks

- **Missing timeout-minutes warnings:** Existing pre-existing warnings about missing `timeout-minutes` on 3 jobs (`pipeline-complete`, `test-summary` ×2) are not related to this fix and were present before the change
- **Smoke/integration/acceptance tests** require Docker Compose stack to be running locally and were not executed
