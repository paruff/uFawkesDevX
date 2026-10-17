# Plan: nightly live acceptance workflow

**Traces to:** uFawkesDevX#88 | AC-DEVX-01

## Changes

1. Add `.github/workflows/live-acceptance.yml` (nightly, on release, `workflow_dispatch`): `make up` on a clean runner, then the live checks, teardown, evidence on failure.
2. Add `scripts/live-acceptance.sh`: Backstage, Coder, Score API/webhooks, Plugin Manager and gateway answer 200; no container unhealthy.
3. No Postgres service container: ADR-0001 (#57) removed the external database.

## Verification Strategy

| Criterion                        | Evidence                                         | How                                                  |
| -------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Workflow is valid                | `actionlint` clean                               | pre-commit `actionlint` hook                         |
| Checks pass against a live stack | Six `PASS` lines, exit 0                         | `scripts/live-acceptance.sh` after `make up`         |
| Passes on a clean runner         | A green `Live Acceptance` run on `main`          | `gh workflow run live-acceptance.yml` after merge    |
| A broken service fails the run   | Script exits 1 and prints `FAIL <name>`          | Stop one container, run the script                   |

## Follow-up

Add `Live Acceptance` to `live-checks.yml` in uFawkes.dev once it has run green.
