# EXECUTION_QUEUE — uFawkesDevX

**Horizon:** Weeks | **Owner:** Platform Team | **Review Cadence:** Weekly (Monday planning)

---

## Priority Tiers

| Tier | Definition | SLA | Current Count |
|---|---|---|---|
| **P0 — Blocks Release** | Must complete before next tag; failure = no release | ≤1 week | 3 |
| **P1 — This Sprint** | Committed for current 2-week sprint; spillover = sprint fail | ≤2 weeks | 5 |
| **P2 — Next Sprint** | Prioritized for next sprint; ready for planning | ≤4 weeks | 4 |
| **P3 — Backlog** | Valuable but not time-bound; re-evaluated each planning | No SLA | 8 |

---

## P0 — Blocks Release (Do These First)

| ID | Task | Milestone | Owner | Started | Notes |
|---|---|---|---|---|---|
| P0-1 | **Fix CI pipeline: preflight → lint → security → build → test all green on `main`** | M1.7 | @platform | 2026-09-08 | See `.github/workflows/ci.yml`; gitleaks false positive on test fixtures |
| P0-2 | **Backstage catalog entities for all 5 services + 3 example workloads** | M1.2 | @platform | — | Blocked on P0-1 (CI must pass to validate catalog-info.yaml) |
| P0-3 | **OTLP emission from Coder, Backstage, Score, Plugin Manager, Gateway** | M1.6 | @platform | — | Requires uFawkesObs running; use `make up-obs` first |

---

## P1 — This Sprint (Week of 2026-09-14)

| ID | Task | Milestone | Owner | Started | Notes |
|---|---|---|---|---|---|
| P1-1 | **Score Service: implement POST/GET/PUT/DELETE /score with PG persistence** | M1.3 | @backend | 2026-09-10 | TDD: write contract tests first (`tests/contract/score-api.test.ts`) |
| P1-2 | **Score spec validation: reject invalid specs with actionable errors** | M1.4 | @backend | — | Depends on P1-1; use `score-spec` npm pkg for parsing |
| P1-3 | **Gateway nginx.conf: route /api/score/* to score-service:8081** | M2.4 | @platform | — | Add healthcheck endpoint proxy |
| P1-4 | **Coder workspace Make target: `make coder-workspace` provisions devcontainer** | M1.5 | @platform | 2026-09-12 | Verify toolchain: node@20, go@1.22, python@3.12, docker-cli, kubectl, kustomize, score@latest |
| P1-5 | **Pre-commit hooks parity: add missing hooks (shellcheck, shfmt, yamllint, markdownlint)** | M3.1 | @platform | — | Run `pre-commit run --all-files` locally before push |

---

## P2 — Next Sprint (Week of 2026-09-28)

| ID | Task | Milestone | Owner | Notes |
|---|---|---|---|---|
| P2-1 | **Plugin Manager: implement `install` command with local registry** | M2.1 | @backend | Registry = `plugin-registry/` volume with `index.json` |
| P2-2 | **Plugin Manager: Backstage hot-reload on plugin install** | M2.1 | @backend | Requires Backstage `plugins` directory watch |
| P2-3 | **Gateway: OpenAPI response validation middleware** | M2.3 | @platform | Use `nginx-openapi-validator` or custom Lua |
| P2-4 | **uFawkesObs dashboards: create per-service overview (uptime, latency, errors, traces)** | M2.5 | @platform | Import from uFawkesObs `dashboards/` dir |

---

## P3 — Backlog (Groom Monthly)

| ID | Task | Milestone | Notes |
|---|---|---|---|
| P3-1 | **Backstage Software Templates: create-service, create-library, create-plugin** | M1.2 | Scaffold from uFawkesPipe golden paths |
| P3-2 | **Score Service: webhook receiver for uFawkesPipe deployment events** | M1.3 | `PIPELINE_WEBHOOK_URL` env var |
| P3-3 | **Score Service: spec versioning & rollback** | M1.4 | Git-backed spec store in `score-specs` volume |
| P3-4 | **Plugin Manager: private npm/GitHub registry auth via token** | M2.2 | `PLUGIN_REGISTRY_TOKEN` secret |
| P3-5 | **Gateway: rate limiting & circuit breaker** | M2.3 | nginx `limit_req_zone` + `proxy_next_upstream` |
| P3-6 | **DORA metrics: wire uFawkesPipe → uFawkesObs DORA API** | M2.6 | Requires uFawkesPipe `dora` profile |
| P3-7 | **Inner-loop measurement script: `scripts/measure-inner-loop.sh`** | M2.7 | Times: template → code → test → PR → local deploy |
| P3-8 | **Docs reality check: `make doc-check` implementation** | M3.4 | Validate commands, ports, diagrams |

---

## Scope-Drift Protection

> **Before adding ANY item to this queue, verify against VISION.md § Non-Goals:**
> - Does this require multi-cluster, HA, multi-tenancy, or RBAC? → **Reject (H3/Fawkes track)**
> - Does this add a custom plugin authoring framework? → **Reject (out of scope)**
> - Does this add a self-hosted Git provider integration? → **Reject (GitHub only)**
> - Does this add database migration tooling? → **Reject (manual SQL OK for pre-alpha)**
> - Does this add cost optimization/quotas? → **Reject (not a SaaS)**

**Escalation:** If a stakeholder requests a non-goal item, document the request in `docs/deferred/<slug>.md` with "Revisit at H3/Fawkes graduation" tag.

---

## Bottom-Up Feedback Loop

**Learnings from `plan-for-the-day.md` retrospective route back here:**

| Date | Learning | Queue Impact |
|---|---|---|
| 2026-09-14 | Score Service DB migration failed in CI due to missing `pg_trgm` extension | Added `pg_trgm` to `postgres/Dockerfile`; moved to P0-1 |
| 2026-09-14 | Backstage catalog validation needs `catalog-info.yaml` schema check in CI | Added to P1-5 (pre-commit: `catalog-validate` hook) |

---

## How This Connects

| Document | What It Answers |
|---|---|
| [VISION.md](VISION.md) | North star and principles that define "done" |
| [MILESTONES.md](MILESTONES.md) | Monthly deliverables this queue feeds |
| [plan-for-the-day.md](plan-for-the-day.md) | Today's single goal pulled from P0/P1 |
| [docs/product/spec.md](docs/product/spec.md) | Functional requirements for each queued task |
