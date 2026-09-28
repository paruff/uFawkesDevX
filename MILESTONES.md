# MILESTONES — uFawkesDevX

**Horizon:** Months | **Owner:** Platform Team | **Review Cadence:** Monthly (first Monday)

---

## Horizon Map

| Horizon | Timeframe | Theme | Success Signal |
|---|---|---|---|
| **H1** | Months 1–3 (Now → Nov 2026) | **Foundation** — Core stack runs locally, Backstage catalog populated, Score service validates specs, Coder provisions workspaces | `make up` brings up all 5 services healthy; `make test-acceptance` passes |
| **H2** | Months 4–6 (Dec 2026 → Feb 2027) | **Integration** — Plugin Manager installs plugins, Gateway enforces contracts, OTLP → uFawkesObs flows, DORA metrics visible | Developer completes "day in the life" in ≤45 min (VISION riskiest assumption) |
| **H3** | Months 7–9 (Mar → May 2027) | **Hardening** — Pre-commit/CI parity, zero-secrets hygiene, release automation, docs reality check | Weekly releases ship without manual steps; gitleaks/semgrep clean on `main` |

---

## Milestones

### H1: Foundation (Target: 2026-11-30)

| ID | Deliverable | Status | Issue Link | Vision Principle |
|---|---|---|---|---|
| M1.1 | **Compose stack v0.2 stable** — All 5 services (Coder, Backstage, Score, Plugin Manager, Gateway) start via `make up` with healthchecks passing | 🟡 In Progress | [#12](https://github.com/paruff/uFawkesDevX/issues/12) | 1, 2, 3 |
| M1.2 | **Backstage Software Catalog populated** — `catalog/` entities for all 5 services + 3 example workloads; TechDocs builds | 🔴 Not Started | [#13](https://github.com/paruff/uFawkesDevX/issues/13) | 2 |
| M1.3 | **Score Service CRUD API** — `POST /score`, `GET /score/:id`, `PUT /score/:id`, `DELETE /score/:id` with PostgreSQL persistence | 🟡 In Progress | [#14](https://github.com/paruff/uFawkesDevX/issues/14) | 3 |
| M1.4 | **Score spec validation** — `score validate` rejects invalid specs (missing required fields, bad refs) with actionable errors | 🔴 Not Started | [#15](https://github.com/paruff/uFawkesDevX/issues/15) | 3 |
| M1.5 | **Coder workspace provisioning** — `make coder-workspace` creates a devcontainer with Node, Go, Python, Docker CLI, kubectl, kustomize, Score CLI pre-installed | 🟢 Done | [#16](https://github.com/paruff/uFawkesDevX/issues/16) | 4 |
| M1.6 | **OTLP emission from all services** — Each service exports metrics/logs/traces to `otel-collector:4317` (uFawkesObs) | 🔴 Not Started | [#17](https://github.com/paruff/uFawkesDevX/issues/17) | 7 |
| M1.7 | **CI pipeline green** — Preflight → lint → security (gitleaks, semgrep, trivy) → build → unit → integration all pass on `main` | 🟡 In Progress | [#18](https://github.com/paruff/uFawkesDevX/issues/18) | 8 |

### H2: Integration (Target: 2027-02-28)

| ID | Deliverable | Status | Issue Link | Vision Principle |
|---|---|---|---|---|
| M2.1 | **Plugin Manager installs Backstage plugins** — `plugin-manager install <plugin>` fetches from registry, writes to `backstage-plugins` volume, Backstage hot-reloads | 🔴 Not Started | [#19](https://github.com/paruff/uFawkesDevX/issues/19) | 5 |
| M2.2 | **Plugin Manager registry** — Local file-based registry (`plugin-registry/` volume) with `index.json`; supports private npm/GitHub packages via token | 🔴 Not Started | [#20](https://github.com/paruff/uFawkesDevX/issues/20) | 5 |
| M2.3 | **Gateway OpenAPI contract enforcement** — nginx validates requests/responses against `gateway/api-docs/*.openapi.yaml`; breaking changes fail CI | 🔴 Not Started | [#21](https://github.com/paruff/uFawkesDevX/issues/21) | 6 |
| M2.4 | **Gateway routes to all services** — `/api/backstage/*`, `/api/score/*`, `/api/plugins/*`, `/api/coder/*` proxied with path rewriting | 🟡 Partial | [#22](https://github.com/paruff/uFawkesDevX/issues/22) | 6 |
| M2.5 | **uFawkesObs integration verified** — Grafana dashboards show: service uptime, request latency (p50/p95), error rate, trace spans for each service | 🔴 Not Started | [#23](https://github.com/paruff/uFawkesDevX/issues/23) | 7 |
| M2.6 | **DORA metrics pipeline** — uFawkesPipe emits deployment/commit events → uFawkesObs DORA API → Grafana "DORA Overview" dashboard | 🔴 Not Started | [#24](https://github.com/paruff/uFawkesDevX/issues/24) | 7 |
| M2.7 | **"Day in the Life" validation** — Scripted scenario (template → code → test → PR → local deploy) completes in ≤45 min by ≥3 developers | 🔴 Not Started | [#25](https://github.com/paruff/uFawkesDevX/issues/25) | 1, 2, 4 |

### H3: Hardening (Target: 2027-05-31)

| ID | Deliverable | Status | Issue Link | Vision Principle |
|---|---|---|---|---|
| M3.1 | **Pre-commit / CI parity** — All CI checks run locally via `pre-commit run --all-files`; zero "works locally, fails CI" | 🟡 Partial | [#26](https://github.com/paruff/uFawkesDevX/issues/26) | 8 |
| M3.2 | **Zero-secrets hygiene** — gitleaks clean on full history; `.env` never committed; `.env.example` is source of truth | 🟢 Done | [#27](https://github.com/paruff/uFawkesDevX/issues/27) | 8 |
| M3.3 | **Automated weekly release** — `release-please` generates changelog, creates GitHub Release, tags `v<semver>`, deploys to uFawkes.dev docs site | 🔴 Not Started | [#28](https://github.com/paruff/uFawkesDevX/issues/28) | 8 |
| M3.4 | **Docs reality check** — `make doc-check` validates: all documented commands run, all ports match compose, all diagrams reflect reality | 🔴 Not Started | [#29](https://github.com/paruff/uFawkesDevX/issues/29) | 1 |
| M3.5 | **CHANGE_IMPACT_MAP.md complete** — Every config file maps to affected services, tests, and docs; used in PR review checklist | 🔴 Not Started | [#30](https://github.com/paruff/uFawkesDevX/issues/30) | 8 |

---

## Release Gates

**Before any release (tag push) ships, ALL must be true:**

| Gate | Verification Command | Evidence Artifact |
|---|---|---|
| **Tests Pass** | `make test` (unit + integration + acceptance) | `test-results/*.xml` |
| **Security Clean** | `make security-scan` (gitleaks + semgrep + trivy) | `security-reports/*.sarif` |
| **Lint/Format Clean** | `make lint` (pre-commit all hooks) | stdout/stderr |
| **Build Success** | `make build` (all Docker images build, no `:latest`) | `docker images` output |
| **Docs Updated** | `make doc-check` (commands, ports, diagrams) | `doc-check-report.md` |
| **Changelog Entry** | `CHANGELOG.md` has entry for this version | `git show HEAD:CHANGELOG.md` |
| **GitHub Release** | Tag `vX.Y.Z` exists; release notes generated | GitHub Releases page |
| **Deploy + Verify** | `make up && ./scripts/health-check-all.sh` passes | `health-check-report.md` |

---

## Traceability: Milestone → Vision Principle

| Vision Principle | H1 Milestones | H2 Milestones | H3 Milestones |
|---|---|---|---|
| 1. Local-First, Production-Parity | M1.1, M1.7 | M2.7 | M3.4 |
| 2. Backstage as Single Pane | M1.2 | M2.7 | — |
| 3. Score-Driven Workload Specs | M1.3, M1.4 | — | — |
| 4. Inner-Loop in Cloud IDE | M1.5 | M2.7 | — |
| 5. Plugin Manager as Extension Plane | — | M2.1, M2.2 | — |
| 6. Gateway as Contract Enforcer | — | M2.3, M2.4 | — |
| 7. Observability by Default | M1.6 | M2.5, M2.6 | — |
| 8. Trunk-Based, Gate-Governed Delivery | M1.7 | — | M3.1, M3.2, M3.3, M3.5 |

---

## How This Connects

| Document | What It Answers |
|---|---|
| [VISION.md](VISION.md) | North star, principles, non-goals, riskiest assumption |
| [EXECUTION_QUEUE.md](EXECUTION_QUEUE.md) | Weekly priority queue (P0–P3) feeding these milestones |
| [plan-for-the-day.md](plan-for-the-day.md) | Today's work pulled from queue |
| [docs/product/discovery-draft.md](docs/product/discovery-draft.md) | JTBD and acceptance criteria behind M1.x/M2.x |
| [docs/product/spec.md](docs/product/spec.md) | Functional requirements for each milestone deliverable |
