# CI Diagnosis

**Failure:** CI Pipeline (`ci-pipeline.yml`) — Startup Failure
**Location:** `.github/workflows/ci-pipeline.yml` line 57-59
**Evidence:**

- Workflow consistently fails with `startup_failure` across all branches (main, feat/devx-ci-pipeline, dependabot branches)
- Error from GitHub Actions: _".github/workflows/ci-pipeline.yml (Line: 57, Col: 32): Invalid input, validate-docker-compose is not defined in the referenced workflow. .github/workflows/ci-pipeline.yml (Line: 58, Col: 23): Invalid input, validate-jcasc is not defined in the referenced workflow."_
- The `build` job passes `validate-docker-compose`, `validate-jcasc`, `validate-k8s` inputs to `reusable-build.yml`, but `reusable-build.yml` does not define those inputs
- CI (`ci.yml`) succeeds because it doesn't use the broken workflow
- PR #16 (dependabot: `actions/checkout@v6` → `v7`) was merged to `main` but not applied to this branch
- Current branch still has 19 occurrences of `actions/checkout@v6`

**Likely Cause:** `ci-pipeline.yml` references input parameters (`validate-docker-compose`, `validate-jcasc`, `validate-k8s`) that are not defined in the called workflow `reusable-build.yml`, causing GitHub Actions to reject the workflow at parse time.

**Confidence:** HIGH

**Proposed Fix:** Remove the three undefined inputs from the `build` job call in `ci-pipeline.yml`, and apply the `actions/checkout@v7` upgrade from PR #16.
