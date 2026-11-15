# Plan: refresh uFawkesPipe reusable workflow refs

**Traces to:** uFawkesDevX#155 (`fix(ci): refresh workflow refs`) | **Status:** In progress

## Problem

`ci-pipeline.yml` and `main-ci-guard.yml` pinned the uFawkesPipe reusables to
`d019b94` (commented `v1.16.5`). That commit and release do not exist: the
latest uFawkesPipe release is `v1.16.0-beta.1` (`271154e`), and its `main` tip is
`28fde5f`. GitHub cannot resolve the ref, so both workflows fail before any job
starts (`CI Pipeline`, `Main CI Guard`).

The released security reusable also fails: `trivy-action` v0.36.0 ignores the
`version` input and runs Trivy 0.74.0, which exits non-zero. uFawkesPipe `main`
replaced that step with a direct Trivy 0.76.2 install for filesystem scans.

## Change

- Pin every uFawkesPipe reusable to `main` commit
  `28fde5fbe86aa949ec397b887a06efc220aebe0f` (2026-11-15), which contains the
  Trivy fix and keeps every input this repo passes.
- Keep the CI security policy at the documented `MEDIUM` threshold; the earlier
  `HIGH`/`ignore-unfixed` edit was not part of this fix.
- Keep the Terraform lockfile refresh produced by the validate hook, so the hook
  does not rewrite the file in CI.

## Verification Strategy

| Check | How |
| --- | --- |
| Every ref resolves | `git ls-remote https://github.com/paruff/ufawkespipe.git` shows `28fde5f...`, and CI Pipeline / Main CI Guard start jobs instead of failing at workflow-call resolution |
| Workflows parse | `actionlint .github/workflows/ci-pipeline.yml .github/workflows/main-ci-guard.yml` exits 0 |
| Artifact chain | `bash scripts/check-artifact-chain.sh <base> HEAD` exits 0 |
| Security gate | CI Pipeline's Security Scanning passes with the documented `MEDIUM` threshold |
| No collateral change | `git diff` touches only the two workflows, this plan, and the Terraform lockfile |
