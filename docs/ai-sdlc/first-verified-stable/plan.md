# Plan: uFawkesDevX first verified stable release

**Traces to:** [`spec.md`](spec.md) → [`intent.md`](intent.md)

This plan lists no tasks. The sequence is
[Phase 5 of the suite plan](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/plan.md#phase-5--devx-stable--dojo-05-gate-ac-devx-01),
and the tasks are issues on [Project #7](https://github.com/users/paruff/projects/7).

## Verification Strategy

| Criterion | Evidence |
| --- | --- |
| AC-DEVX-01 | A clean-host transcript of the latest 1.x (paruff/uFawkesDevX#146), plus that release's `live-acceptance.yml` run for Linux |
| The decision is recorded | [ADR-0001](../../adr/0001-no-separate-database-service.md) on `main` |

### Make commands

Per [the suite's rule for `make` commands](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/spec.md#make-verification-commands):

| Command | Proves | Needs |
| --- | --- | --- |
| `make validate` | Every pre-commit hook passes on every file | Nothing |
| `make test` | Unit tests pass | Nothing |
| `make test-integration` | Integration tests pass | Docker |
| `make up`, then `make health` | The stack starts with no outside database and every service is healthy (AC-DEVX-01) | Docker |
| `make test-smoke`, `make test-acceptance` | Smoke and acceptance tests pass | `make up` first |
| `make doctor` | This clone's hooks are installed and its tools are present | Nothing |
