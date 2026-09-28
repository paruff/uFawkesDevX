# Functional Specification — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

> **Traceability:** Each requirement references the [Discovery Draft](../product/discovery-draft.md) JTBD and acceptance criteria it satisfies.

---

## FR-1: Compose Stack Orchestration

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-1.1 | `make up` starts all 5 services (Coder, Backstage, Score, Plugin Manager, Gateway) via Docker Compose | JTBD: Stack Startup | All 5 containers report `healthy` within 60s | Live-System |
| FR-1.2 | Each service declares a healthcheck in `compose.yaml` | JTBD: Stack Startup | `docker compose ps` shows `healthy` for all | Live-System |
| FR-1.3 | Services communicate over `fawkes-net` (external network) | Architecture | `docker network inspect fawkes-net` shows all 5 containers | Integration |
| FR-1.4 | Named volumes persist data for Coder, Backstage, Score, Plugin Manager | Architecture | `docker volume ls` shows 5 `developerd-*` volumes | Integration |
| FR-1.5 | No `:latest` tags in `compose.yaml` (enforced by CI) | Architecture Rules | `grep -r ":latest" compose.yaml` returns nothing | Unit (CI gate) |
| FR-1.6 | `.env.example` documents all required environment variables | Architecture Rules | `make check-env` validates all required vars set | Unit |

---

## FR-2: Backstage Developer Portal

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-2.1 | Backstage serves on `http://localhost:7007` (configurable via `BACKSTAGE_PORT`) | JTBD: Single Pane | `curl -f http://localhost:7007/healthcheck` returns 200 | Live-System |
| FR-2.2 | Software Catalog contains entities for all 5 platform services + 3 example workloads | JTBD: Catalog Utility | `curl -s http://localhost:7007/api/catalog/entities \| jq '.items \| length'` ≥ 8 | Live-System |
| FR-2.3 | Each catalog entity has: `metadata.name`, `spec.type`, `spec.lifecycle`, `spec.owner`, `spec.system` | JTBD: Catalog Utility | Schema validation passes for all entities | Contract |
| FR-2.4 | TechDocs builds and serves documentation for all catalog entities | JTBD: Catalog Utility | `curl -f http://localhost:7007/docs/<entity>/` returns HTML | Integration |
| FR-2.5 | Backstage persists catalog to PostgreSQL (external, via uFawkesRes) | Architecture | `psql -h postgres -U backstage -c "SELECT count(*) FROM catalog_entities"` > 0 | Integration |
| FR-2.6 | Backstage authenticates via local provider (dev) | Architecture | Login with `user:user` works | Live-System |

---

## FR-3: Score Workload Specification Service

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-3.1 | `POST /api/v1/score` creates a new Score spec; returns 201 with `id` | JTBD: Score-Driven Specs | `curl -X POST -d @spec.yaml http://localhost:8081/api/v1/score` → 201 + JSON `{id}` | Contract |
| FR-3.2 | `GET /api/v1/score/:id` returns the stored spec | JTBD: Score-Driven Specs | `curl http://localhost:8081/api/v1/score/<id>` → 200 + spec YAML | Contract |
| FR-3.3 | `PUT /api/v1/score/:id` updates an existing spec; returns 200 | JTBD: Score-Driven Specs | `curl -X PUT -d @spec2.yaml http://localhost:8081/api/v1/score/<id>` → 200 | Contract |
| FR-3.4 | `DELETE /api/v1/score/:id` removes a spec; returns 204 | JTBD: Score-Driven Specs | `curl -X DELETE http://localhost:8081/api/v1/score/<id>` → 204 | Contract |
| FR-3.5 | `POST /api/v1/score/validate` validates a spec without persisting; returns 200 + errors[] | JTBD: Spec Validation | Invalid spec → 200 + `{errors: ["missing required field: ..."]}` | Contract |
| FR-3.6 | Specs persisted to PostgreSQL (external, via uFawkesRes) in `score` database | Architecture | `psql -h postgres -U score -c "SELECT count(*) FROM specs"` matches API count | Integration |
| FR-3.7 | Score CLI (`score` binary) works against local service | JTBD: Score-Driven Specs | `score validate spec.yaml --api http://localhost:8081` passes | Live-System |

---

## FR-4: Coder Cloud IDE Workspace Provisioning

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-4.1 | `make coder-workspace` provisions a Coder workspace with devcontainer | JTBD: Inner Loop in Cloud IDE | Workspace accessible at `http://localhost:7080` | Live-System |
| FR-4.2 | Devcontainer includes: Node 20, Go 1.22, Python 3.12, Docker CLI, kubectl, kustomize, Score CLI | JTBD: Inner Loop in Cloud IDE | `make check-toolchain` verifies all versions | Live-System |
| FR-4.3 | Workspace mounts `score-specs` and `plugin-registry` volumes for live editing | JTBD: Inner Loop in Cloud IDE | `ls /home/coder/workspace/specs` shows specs | Integration |
| FR-4.4 | Coder authenticates via local provider (dev) | Architecture | Login with `user:user` works | Live-System |
| FR-4.5 | Coder persists to PostgreSQL (external, via uFawkesRes) in `coder` database | Architecture | `psql -h postgres -U coder -c "SELECT count(*) FROM workspaces"` > 0 | Integration |

---

## FR-5: Plugin Manager

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-5.1 | `plugin-manager install <plugin-name>` fetches from local registry and installs | JTBD: Plugin Manager | `plugin-manager install @internal/plugin-example` → success | Live-System |
| FR-5.2 | Local registry at `plugin-registry/` volume with `index.json` mapping names to tarballs | JTBD: Plugin Manager | `cat /plugins/index.json` shows expected structure | Unit |
| FR-5.3 | Installed plugins written to `backstage-plugins` volume | JTBD: Plugin Manager | `ls /app/plugins/` shows installed plugin | Integration |
| FR-5.4 | Backstage hot-reloads on plugin install (no manual rebuild) | JTBD: Plugin Manager | New plugin appears in Backstage UI within 10s | Live-System |
| FR-5.5 | `plugin-manager list` shows installed plugins with versions | JTBD: Plugin Manager | Output includes name, version, status | Contract |
| FR-5.6 | `plugin-manager uninstall <plugin-name>` removes plugin and triggers reload | JTBD: Plugin Manager | Plugin removed from Backstage UI | Live-System |

---

## FR-6: API Gateway

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-6.1 | Gateway (nginx) listens on `http://localhost:8000` (configurable via `GATEWAY_PORT`) | JTBD: Contract Enforcer | `curl -f http://localhost:8000/health` returns 200 | Live-System |
| FR-6.2 | Routes: `/api/backstage/*` → `backstage:7007`, `/api/score/*` → `score-service:8081`, `/api/plugins/*` → `plugin-manager:8083`, `/api/coder/*` → `coder:7080` | JTBD: Contract Enforcer | Each route returns proxied service response | Integration |
| FR-6.3 | OpenAPI specs in `gateway/api-docs/*.openapi.yaml` validate requests/responses | JTBD: Contract Enforcer | Invalid request → 400 with validation error | Contract |
| FR-6.4 | Breaking API changes fail CI (contract test) | Architecture Rules | `make contract-test` fails on breaking change | Unit (CI gate) |
| FR-6.5 | Gateway serves API docs at `/api-docs/` (static files) | JTBD: Contract Enforcer | `curl -f http://localhost:8000/api-docs/score.openapi.yaml` returns spec | Integration |

---

## FR-7: Observability & Telemetry

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-7.1 | All 5 services emit OTLP metrics to `otel-collector:4317` (uFawkesObs) | JTBD: Observability by Default | `curl http://otel-collector:8888/metrics \| grep <service>` shows metrics | Live-System |
| FR-7.2 | All 5 services emit OTLP logs to `otel-collector:4317` | JTBD: Observability by Default | Loki query `{service="<service>"}` returns logs | Live-System |
| FR-7.3 | All 5 services emit OTLP traces to `otel-collector:4317` | JTBD: Observability by Default | Tempo query shows spans for each service | Live-System |
| FR-7.4 | Grafana dashboards exist for each service (uptime, latency p50/p95, error rate, traces) | JTBD: Observability by Default | Dashboards accessible at `http://localhost:3000` (uFawkesObs) | Live-System |
| FR-7.5 | DORA metrics pipeline: uFawkesPipe → uFawkesObs DORA API → Grafana "DORA Overview" | JTBD: Observability by Default | Dashboard shows lead time, deploy freq, CFR, MTTR | Integration |

---

## FR-8: CI/CD & Delivery Governance

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| FR-8.1 | CI pipeline stages: preflight → lint → security → build → test → release | Architecture Rules | `.github/workflows/ci.yml` has all stages | Unit |
| FR-8.2 | Security stage runs: gitleaks, semgrep, trivy (container) | Architecture Rules | All three tools run and pass | Unit |
| FR-8.3 | Pre-commit hooks mirror CI: `pre-commit run --all-files` catches same issues | Architecture Rules | Zero "works locally, fails CI" | Live-System |
| FR-8.4 | Conventional commit enforcement on PR titles | Architecture Rules | Invalid PR title → CI fails | Unit |
| FR-8.5 | Branch protection: `main` requires PR + CI pass + up-to-date | Architecture Rules | Direct push to `main` rejected | Integration |
| FR-8.6 | Release automation: `release-please` generates changelog, tag, GitHub Release | Architecture Rules | Tag push → GitHub Release created | Live-System |

---

## NFR: Non-Functional Requirements

| ID | Requirement | Discovery Ref | Acceptance Criterion | Test Type |
|---|---|---|---|---|
| NFR-1 | Stack startup ≤ 60 seconds on modern laptop (M2/16GB) | Discovery: Stack Startup | `scripts/measure-startup.sh` p95 ≤ 60s | Live-System |
| NFR-2 | Inner-loop (edit → reload → test) ≤ 10 seconds for Score/Backstage changes | Discovery: Inner Loop | `scripts/measure-inner-loop.sh` segment timing | Live-System |
| NFR-3 | Coder workspace ready ≤ 30 seconds from `make coder-workspace` | Discovery: Inner Loop | `scripts/measure-coder-startup.sh` p95 ≤ 30s | Live-System |
| NFR-4 | Zero secrets in Git history (gitleaks clean on full history) | Architecture Rules | `gitleaks detect --source . --log-level=debug` exits 0 | Unit |
| NFR-5 | All shell scripts pass `shellcheck` and `shfmt -d` | Architecture Rules | `pre-commit run shellcheck shfmt --all-files` passes | Unit |
| NFR-6 | All YAML passes `yamllint` | Architecture Rules | `pre-commit run yamllint --all-files` passes | Unit |
| NFR-7 | All Markdown passes `markdownlint` | Architecture Rules | `pre-commit run markdownlint --all-files` passes | Unit |

---

## How This Connects

| Document | What It Answers |
|---|---|
| [docs/product/discovery-draft.md](discovery-draft.md) | JTBD, riskiest assumption, acceptance criteria behind these requirements |
| [MILESTONES.md](../MILESTONES.md) | Milestones that deliver these requirements |
| [EXECUTION_QUEUE.md](../EXECUTION_QUEUE.md) | Weekly tasks implementing these requirements |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Technical design satisfying these requirements |
