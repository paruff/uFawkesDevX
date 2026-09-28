# plan-for-the-day — uFawkesDevX

**Date:** 2026-09-14 | **Horizon:** Today | **Owner:** @platform | **Review Cadence:** Daily (EOD retrospective)

---

## Single Primary Goal

> **Unblock P0-1: Fix CI pipeline so preflight → lint → security → build → test all pass on `main`, enabling M1.2 (Backstage catalog) and M1.6 (OTLP emission) to proceed.**

---

## Target Issues (Pulled from EXECUTION_QUEUE.md)

| Queue ID | Issue | Milestone | TDD Step |
|---|---|---|---|
| **P0-1** | CI pipeline: gitleaks false positive on test fixtures blocks security stage | M1.7 | 1. Write failing test: `tests/security/gitleaks-fixture.test.sh` expecting clean scan<br>2. Fix: update `.gitleaks.toml` allowlist for test fixtures<br>3. Verify: `make security-scan` passes |
| **P0-1** | CI pipeline: shellcheck fails on `scripts/wait-healthy.sh` (SC2155) | M1.7 | 1. Write failing test: `tests/lint/shellcheck.test.sh` expecting clean<br>2. Fix: declare and assign separately<br>3. Verify: `pre-commit run shellcheck --all-files` passes |
| **P1-4** | Coder workspace: verify toolchain versions in devcontainer | M1.5 | 1. Write failing test: `tests/acceptance/coder-toolchain.test.sh` checking versions<br>2. Fix: update `devcontainer/Dockerfile` base image/toolchain<br>3. Verify: `make coder-workspace && ./tests/acceptance/coder-toolchain.test.sh` |

---

## TDD Execution Protocol (Per Task)

> **For EACH task above, execute this exact sequence. Do not skip steps.**

### Phase 1: RED — Write Failing Test

```bash
# 1. Create test file in correct location (see TDD Step column)
# 2. Run test to confirm it FAILS for the right reason
make test-<task-id>  # e.g., make test-gitleaks-fixture
# Expected: Test fails with specific error message matching the bug
```

### Phase 2: GREEN — Minimal Implementation

```bash
# 3. Make the SMALLEST change to make the test pass
# 4. Re-run test to confirm PASS
make test-<task-id>
# Expected: Test passes
```

### Phase 3: REFACTOR — Clean Up (Only if Needed)

```bash
# 5. Run full test suite to ensure no regressions
make test
# 6. Run lint/security locally
pre-commit run --all-files
# 7. If all green, commit with conventional message
git add -A && git commit -m "fix(ci): resolve gitleaks false positive on test fixtures"
```

### Phase 4: VERIFY — Evidence Before Push

```bash
# 8. Push branch and open PR
git push origin fix/ci-gitleaks-fixture
gh pr create --title "fix(ci): resolve gitleaks false positive on test fixtures" --body "Fixes #P0-1"
# 9. Wait for CI to pass on PR (all stages green)
# 10. Squash-merge to main
```

---

## Session Retrospective (Complete at EOD)

### What Shipped Today

| Task | Status | Evidence (Link/Output) |
|---|---|---|
| P0-1 gitleaks fixture |  |  |
| P0-1 shellcheck SC2155 |  |  |
| P1-4 coder toolchain verify |  |  |

### Blockers Encountered

| Blocker | Resolution | Queue Impact |
|---|---|---|

### Learnings → EXECUTION_QUEUE.md

| Learning | Action |
|---|---|

### Scope-Drift Check
>
> Did any work today violate VISION.md Non-Goals? **Yes / No**
> If Yes: Document in `docs/deferred/<slug>.md` and add to retrospective.

---

## Tomorrow's Primary Goal (Preview)

> Based on today's outcome, tomorrow's focus will be: **[P0-2 Backstage catalog entities] or [P1-1 Score Service CRUD API]**

---

## How This Connects

| Document | What It Answers |
|---|---|
| [EXECUTION_QUEUE.md](EXECUTION_QUEUE.md) | Source of truth for priority tiers and task definitions |
| [MILESTONES.md](MILESTONES.md) | Milestones these tasks feed |
| [docs/product/spec.md](docs/product/spec.md) | Functional requirements for each task |
