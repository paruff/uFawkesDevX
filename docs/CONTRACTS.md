# Contracts — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

> **Purpose:** Documents the external integration surface of uFawkesDevX — what contracts other planes (`uFawkesObs`, `uFawkesPipe`) expect from this repo, and what this repo expects from them. A breaking change to any contract requires coordination with the owning plane before merging.

---

## Contract Inventory

### C1 — External Postgres (inbound to DevX)

| Aspect | Value |
|---|---|
| Direction | uFawkesDevX consumes an external Postgres (formerly uFawkesRes, which is deprecated; replacement TBD, #57) |
| Transport | TCP on `fawkes-net`, host `postgres`, port `5432` |
| DBs used | `coder`, `backstage`, `score` |
| Credentials | `.env` → `CODER_DB_PASSWORD`, `BACKSTAGE_DB_PASSWORD`, `POSTGRES_PASSWORD` |
| Owner | Undecided until #57 picks a provider |
| Breaking change | Postgres hostname/port/schema change, DB drop, or version bump (PG 15 → 16) |
| Verification | `psql -h postgres -U <user> -c "SELECT 1"` for each DB |
| Change process | Coordinate with the Postgres provider's owner once #57 decides one; require both repos' CI green |

**Schema expectations (DevX side):** Backstage manages its own schema; Coder manages its own. Score Service expects a `specs` table (id UUID, name, spec YAML, timestamps) — created by its own migration on startup.

### C2 — uFawkesObs OTLP (outbound from DevX, planned in M1.6)

| Aspect | Value |
|---|---|
| Direction | uFawkesDevX emits telemetry to uFawkesObs |
| Transport | OTLP gRPC `otel-collector:4317`, OTLP HTTP `otel-collector:4318` |
| Protocol | OpenTelemetry Protocol v0.120.0 compatible |
| Signals | metrics, logs, traces |
| Owner | uFawkesObs |
| Recommended companion version | **v0.3.17-alpha.1** (latest; pre-beta track) — pin the same minor when OTLP wiring lands in M1.6 |
| Breaking change | Collector address, OTLP protocol version, or exporter config change |
| Verification | `curl http://otel-collector:8888/metrics` shows per-service metrics; Loki `{service="..."}` returns logs |
| Change process | Coordinate with uFawkesObs maintainer; both repos' telemetry must remain queryable in Grafana |

### C3 — uFawkesPipe webhook (outbound from DevX, planned in M1.3)

| Aspect | Value |
|---|---|
| Direction | Score Service triggers pipelines in uFawkesPipe |
| Transport | HTTPS POST to `PIPELINE_WEBHOOK_URL` (from `.env`) |
| Payload | See `score-service/config/pipeline-payload.schema.json` |
| Owner | uFawkesPipe |
| Breaking change | Webhook URL, auth scheme, or payload field rename |
| Verification | `curl http://localhost:8081/api/v1/pipelines` shows a successful run after a spec trigger |
| Change process | Contract owned by uFawkesPipe — **must not be modified by DevX** (AGENTS.md §5 Must Never #5) |

### C4 — fawkes-net shared network (cross-cutting)

| Aspect | Value |
|---|---|
| Direction | Shared by all uFawkes planes |
| Transport | Docker external bridge network named `fawkes-net` |
| Owner | Inherited; created by any plane via `make network` (idempotent) |
| Breaking change | Network rename/removal breaks all inter-plane DNS |
| Verification | `docker network inspect fawkes-net` shows containers from Res, DevX, Obs, Pipe |
| Change process | Coordinate across all planes; update every `compose.yaml` |

---

## Backstage ↔ Score ↔ Plugin Manager (internal contracts)

These are internal to uFawkesDevX but MUST NOT change without updating `docs/product/spec.md` and `gateway/api-docs/`:

| Contract | Definition | Source of Truth |
|---|---|---|
| **Score REST API** | `POST/GET/PUT/DELETE /api/v1/score/:id`, `POST /api/v1/score/validate` | `spec.md` FR-3.x, `gateway/api-docs/score.openapi.yaml` |
| **Plugin Manager API** | `install`, `list`, `uninstall` operations | `spec.md` FR-5.x, `gateway/api-docs/plugins.openapi.yaml` |
| **Gateway routes** | `/api/backstage/*`, `/api/score/*`, `/api/plugins/*`, `/api/coder/*` | `gateway/nginx.conf`, `ARCHITECTURE.md` |

---

## Contract Change Protocol

1. **RFC first** — Document the proposed change in a GitHub issue (tag `comp:contracts`) before touching code.
2. **Impact assessment** — Update `docs/CHANGE_IMPACT_MAP.md` with co-changes across planes.
3. **Implement in owning repo** — The repo that owns the contract makes the change.
4. **Update docs** — `spec.md`, `gateway/api-docs/`, this file.
5. **CI green in BOTH repos** — DevX and the dependent plane must pass their gates.
6. **Coordinate release** — Sequence releases so consumers aren't left behind (contract-owner releases first).

---

## How This Connects

| Document | What It Answers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Where these contracts live in the system |
| [VISION.md](../VISION.md) | Why these contracts exist (plot-plane integration) |
| [docs/CHANGE_IMPACT_MAP.md](CHANGE_IMPACT_MAP.md) | What breaks when a contract changes |
| [docs/product/spec.md](spec.md) | The consumer-side requirements these contracts serve |
