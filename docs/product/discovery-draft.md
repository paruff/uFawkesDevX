# Discovery Draft — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

---

## Jobs-to-be-Done (JTBD)

> **When a developer starts their day, they want to run one command (`make up`) and have a fully configured developer portal (Backstage), workload specification service (Score), cloud IDE (Coder), plugin manager, and API gateway running locally — so they can create, code, test, and deploy services without context-switching between terminal, browser tabs, and IDE windows.**

### Current Struggle (The "Before" State)

- Developer opens terminal → runs `docker compose up` for postgres → opens another tab for Backstage → another for local API → another for Coder → another for logs
- Service specs live in scattered repos; no single source of truth for "what does this service look like?"
- Creating a new service = copy-paste from old repo → edit 15 files → hope it works
- Plugin installation = `cd backstage && yarn add @internal/plugin-x && yarn install && rebuild` → 10 min wait
- No visibility into "what deployed when" or "why is this slow?" without jumping to Grafana Cloud

### Desired Outcome (The "After" State)

- `make up` → 5 healthy services in < 60 seconds
- Backstage catalog shows all services, APIs, and dependencies at a glance
- `score init` → creates valid spec → `score validate` → passes → `score render` → manifests
- `make coder-workspace` → browser-based VS Code with full toolchain in 30 seconds
- `plugin-manager install <plugin>` → Backstage hot-reloads, plugin works immediately
- Gateway enforces OpenAPI contracts; breaking changes caught in CI
- All telemetry flows to uFawkesObs; DORA dashboard shows lead time, deployment frequency, change failure rate, MTTR

---

## Riskiest Assumption (from VISION.md)

> **"Developers will adopt a local Backstage + Coder workflow instead of their current IDE + terminal + browser tab sprawl."**

### Why This Assumption Makes or Breaks the Product

- If inner-loop latency (edit → reload → test) exceeds current local setup by >20%, developers revert to old habits
- If Backstage catalog search doesn't save time over `grep` + GitHub UI, it becomes an unused dashboard
- If Coder workspace startup > 60 seconds or toolchain missing, developers won't use it

### Validation Approach

**Test Type:** Live-system acceptance test (not unit, not contract)
- **Script:** `scripts/measure-inner-loop.sh` (to be created)
- **Scenario:** Create service from template → code a trivial endpoint → run unit tests → open PR → deploy to local stack
- **Success Metric:** ≥3 developers complete in ≤45 min total, with ≤15 min on environment/tooling friction
- **Test Environment:** Real `make up` stack, real Coder workspace, real Backstage, real Gateway

---

## Measurable Acceptance Criterion (Pre-Alpha Exit)

| Criterion | Metric | Target | Measurement Method |
|---|---|---|---|
| **Stack Startup** | `make up` → all 5 services healthy | ≤60 seconds | `scripts/measure-startup.sh` |
| **Inner Loop** | Template → code → test → PR → local deploy | ≤45 minutes | `scripts/measure-inner-loop.sh` (3 developers) |
| **Tooling Friction** | Time spent on env setup vs. coding | ≤15 minutes / 45 minutes | Same script, segmented timing |
| **Catalog Utility** | "Find service X's API docs" task | ≤30 seconds vs. ≥3 min (grep) | Timed user study, 3 developers |
| **Plugin Install** | `plugin-manager install` → working in Backstage | ≤60 seconds | `scripts/measure-plugin-install.sh` |
| **Telemetry Coverage** | % services emitting metrics/logs/traces | 100% (5/5) | `make check-telemetry` (queries uFawkesObs) |

---

## Test-Type Reasoning

| Test Type | Scope | Why This Type |
|---|---|---|
| **Unit** | Score Service CRUD, Plugin Manager registry, Gateway routing logic | Pure functions, deterministic, fast feedback |
| **Contract** | Score API schema, Plugin Manager install API, Gateway OpenAPI validation | Consumer-driven contracts between services |
| **Integration** | Backstage ↔ Catalog, Score ↔ Postgres, Plugin Manager ↔ Backstage plugins | Real DB, real file system, real HTTP calls |
| **E2E / Live-System** | **Full inner-loop scenario** (primary validation) | Only way to measure *developer experience* latency and friction; mocks hide real-world overhead (container startup, network, hot-reload) |
| **Acceptance** | Stack startup, telemetry emission, DORA pipeline | Binary pass/fail gates for release |

**Key Decision:** The riskiest assumption (adoption) can ONLY be validated by live-system testing. Unit/contract/integration tests verify correctness; they cannot measure "does this feel faster than my current workflow?"

---

## How This Connects

| Document | What It Answers |
|---|---|
| [VISION.md](../VISION.md) | North star and principles this discovery supports |
| [MILESTONES.md](../MILESTONES.md) | Milestones derived from these JTBDs |
| [docs/product/spec.md](spec.md) | Numbered functional requirements traced to this discovery |
| [EXECUTION_QUEUE.md](../EXECUTION_QUEUE.md) | Weekly tasks that implement these requirements |
