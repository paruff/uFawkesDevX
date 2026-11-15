# Plan: repair uFawkesPipe reusable workflow refs

**Traces to:** uFawkesDevX#155 (`fix(ci): refresh workflow refs`) | **Status:** In progress

## Problem

`ci-pipeline.yml` and `main-ci-guard.yml` were pinned to `d019b94` (commented
`v1.16.5`). That commit and release do not exist: the latest uFawkesPipe release
is `v1.16.0-beta.1` (`271154e`). GitHub cannot resolve the ref, so both
workflows fail before any job starts (`CI Pipeline`, `Main CI Guard`).

uFawkesPipe `main` (`28fde5f`) is not a safe replacement yet: its filesystem
Trivy step runs `--ignore-unfixed "$IGNORE_UNFIXED"`, but `--ignore-unfixed` is
a boolean flag, so Trivy receives a second target and aborts with
`multiple targets cannot be specified`.

## Change

- Restore every uFawkesPipe reusable to the latest valid release,
  `271154e53badbd96f3ef173f92ecb06545fc1cfb` (`v1.16.0-beta.1`).
- Keep the documented `MEDIUM` security threshold from
  `docs/ai-sdlc/dependency-security/plan.md`; the earlier `HIGH` /
  `ignore-unfixed: false` edit was not part of this repair.
- Keep the Terraform lockfile refresh produced by the validate hook and add
  this plan so the artifact-chain gate sees it in the same PR diff.

## Verification Strategy

| Check | How |
| --- | --- |
| Every ref resolves | `git ls-remote https://github.com/paruff/ufawkespipe.git` shows `271154e...`, and CI Pipeline / Main CI Guard start jobs instead of failing at workflow-call resolution |
| Workflows parse | `actionlint .github/workflows/ci-pipeline.yml .github/workflows/main-ci-guard.yml` exits 0 |
| Artifact chain | `bash scripts/check-artifact-chain.sh <base> HEAD` exits 0 |
| Security workflow runs | `Security Scanning` executes its Trivy step (it may still fail on the pre-existing dependency advisories tracked in `docs/ai-sdlc/dependency-security/plan.md`) |
| No collateral change | `git diff` touches only the two workflows, this plan, and the Terraform lockfile |
