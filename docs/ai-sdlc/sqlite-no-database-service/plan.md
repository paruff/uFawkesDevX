# Plan: no separate database service for v0.1.0

**Traces to:** AC-DEVX-01, uFawkesDevX#57 | **Status:** In review

uFawkesRes (the shared Postgres) is deprecated. The owner decided on SQLite where
a component supports it and Coder's built-in Postgres where it does not, so
`compose.yaml` no longer needs a database service.

| Step | What                                                                                          |
| ---- | --------------------------------------------------------------------------------------------- |
| S1   | `score-service` moves from `pg` to `node:sqlite`, file on the `score-data` volume            |
| S2   | Coder drops `CODER_PG_CONNECTION_URL` and mounts its volume at `/home/coder`                  |
| S3   | Backstage config moves to `better-sqlite3` with `connection.directory: /data`, on a volume    |
| S4   | Docs, `.env.example` and the compose test drop the external Postgres                          |

## Verification Strategy

| Check                                           | How                                                                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| score-service stores and reads specs and runs   | `npm test` in `score-service/` (SQLite upsert, JSON round-trip, RETURNING); the image builds on `node:24-alpine`, boots and passes `healthcheck.js` |
| Coder runs without an external Postgres         | `ghcr.io/coder/coder:v2.34.3` with no PG URL and a `/home/coder` volume: `/healthz` returns 200, again after a restart      |
| Backstage works on SQLite and keeps its data    | Scaffolded `create-app` on Node 24 with `better-sqlite3` and a file directory: catalog entities present before and after a backend restart |
| Not covered yet                                 | The repo's own `backstage/Dockerfile` and compose service, because `backstage/` has no app source; `make api-test` through the gateway |
| Compose is still valid and the tag exists       | `docker compose --env-file .env.example config -q`; `tests/unit/test_compose_yaml.py` |
