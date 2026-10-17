# ADR-0001: No separate database service for v0.1.0

**Status:** Accepted (decided in #57, implemented in #119) | **Traces to:** AC-DEVX-01

## Context

uFawkesDevX consumed a shared Postgres from uFawkesRes, which is archived. The
stack needs storage that is defined inside this repo's own setup.

## Decision

- `score-service` uses SQLite (`node:sqlite`), file on the `score-data` volume.
- Backstage uses SQLite (`better-sqlite3`), directory `/data`, on a volume.
- Coder uses its built-in Postgres, data under `/home/coder` on a volume.
- `compose.yaml` has no database service and no external Postgres dependency.

## Consequences

- `make up` needs no pre-provisioned databases.
- Each component is single-instance. Moving to multiple replicas means moving that
  component to a real Postgres, which is a new ADR.
- Backstage SQLite is for a local, single-user stack, not production.
