# VISION — uFawkesDevX

**Horizon:** Years | **Owner:** Platform Team | **Review Cadence:** Quarterly

---

## North Star

> **Leverage Backstage developer portal, services inventory, and Cloud IDE (Coder) to support developers with a cohesive, local-first Developer Experience plane that reduces context-switching and accelerates inner-loop velocity.**

---

## Core Principles (4–8)

1. **Local-First, Production-Parity** — Everything runs via `docker compose` on a developer's machine with the same service definitions, health checks, and networking topology used in CI/CD. No "works on my machine" drift.
2. **Backstage as the Single Pane of Glass** — Software Catalog, TechDocs, and Software Templates are the primary interface. All services (Score, Plugin Manager, Gateway) register themselves and expose APIs/docs through Backstage.
3. **Score-Driven Workload Specs** — Score (the workload specification) is the source of truth for service definitions. The Score Service validates, renders, and gates deployments — no raw K8s manifests in developer hands.
4. **Inner-Loop in the Cloud IDE** — Coder provisions ephemeral, pre-configured workspaces (devcontainers) with the full toolchain pre-installed. Developers code, build, and test in-browser or via VS Code Remote — no local setup friction.
5. **Plugin Manager as the Extension Plane** — Internal and third-party Backstage plugins are discovered, versioned, and installed via the Plugin Manager — no manual `yarn add` in the Backstage repo.
6. **Gateway as the Contract Enforcer** — The API Gateway (nginx) routes, validates, and documents all north-south traffic. OpenAPI specs are the contract; breaking changes fail CI.
7. **Observability by Default** — All services emit OTLP to uFawkesObs (Prometheus, Loki, Tempo, Grafana). DORA metrics flow from uFawkesPipe → uFawkesObs. No service ships without metrics, logs, and traces.
8. **Trunk-Based, Gate-Governed Delivery** — All changes flow through short-lived feature branches → PR → CI gates (lint, security, build, test) → squash-merge to `main`. No direct pushes. Release tags trigger automated changelogs and GitHub Releases.

---

## Explicit Non-Goals (Pre-Alpha Stage)

| Non-Goal | Rationale |
|---|---|
| Multi-cluster / multi-region deployment | uFawkesDevX is the Compose-tier DevX plane; Kubernetes track is **Fawkes** (separate repo) |
| Horizontal scaling of Backstage, Score, Plugin Manager | Single-instance is sufficient for teams ≤15; HA adds operational complexity prematurely |
| Multi-tenancy (isolated orgs/workspaces in one Backstage) | Backstage's permission framework is immature; defer to Fawkes track |
| Custom Backstage plugin development framework | Plugin Manager installs/distributes plugins; authoring is out of scope |
| Self-hosted Git provider (Gitea/GitLab) integration | GitHub is the source of truth; webhook-based triggers suffice |
| RBAC / fine-grained authorization in Backstage | Local dev environment; trust boundary is the developer's machine |
| Database migration tooling for Backstage/Score/Coder | Schema changes are rare in pre-alpha; manual SQL is acceptable |
| Cost optimization / resource quotas | Not a production SaaS; local resource limits via Docker Compose are sufficient |

---

## Single Riskiest Assumption

> **"Developers will adopt a local Backstage + Coder workflow instead of their current IDE + terminal + browser tab sprawl."**

**Why this is the riskiest:** The entire value proposition hinges on developers *choosing* to run `make up` and work inside the provided Coder workspace with Backstage as their homepage. If the inner-loop latency (edit → reload → test) exceeds their current local setup by >20%, or if Backstage's catalog/search doesn't demonstrably save time over `grep` + GitHub UI, adoption stalls and the plane becomes shelfware.

**Validation Signal (Pre-Alpha Exit Criterion):** ≥3 developers on the team complete a "day in the life" scenario (create service from template → code → test → open PR → deploy to local stack) in ≤45 min total, with ≤15 min spent on environment/tooling friction, measured via `scripts/measure-inner-loop.sh` (to be created).

---

## How This Connects

| Document | What It Answers |
|---|---|
| [MILESTONES.md](MILESTONES.md) | Monthly/quarterly deliverables that ladder up to vision principles |
| [EXECUTION_QUEUE.md](EXECUTION_QUEUE.md) | Weekly priority queue (P0–P3) with scope-drift guardrails |
| [plan-for-the-day.md](plan-for-the-day.md) | Today's single goal, pulled from queue, with TDD protocol |
| [docs/product/discovery-draft.md](docs/product/discovery-draft.md) | JTBD statement, riskiest assumption, acceptance criterion, test-type reasoning |
| [docs/product/spec.md](docs/product/spec.md) | Numbered functional requirements referencing discovery draft |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System components, data flows, external dependencies, boundaries |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | External integration surface and contract-change protocol |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | Active known issues and workarounds |
| [docs/CHANGE_IMPACT_MAP.md](docs/CHANGE_IMPACT_MAP.md) | Co-change map: what touches what when configs change |
| [AI_STANCE.md](AI_STANCE.md) | AI tooling policy, model selection, agent guardrails for this repo |
| [docs/MODEL_POLICY.md](docs/MODEL_POLICY.md) | Grade-based model routing; no hardcoded model names |
| [RELEASE_PROCESS.md](RELEASE_PROCESS.md) | Weekly release checklist: README → CHANGELOG → tag → deploy → verify |
| [DEPLOYMENT_STRATEGY.md](DEPLOYMENT_STRATEGY.md) | Local Compose profiles, networking, secrets, health checks, rollback |
