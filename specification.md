# uFawkesDevX — Specification v0.2
*Developer Experience Plane of the Fawkes IDP Family*

**Status:** Draft — 2026-06-23
**Author:** Platform Engineering (solo contributor)
**Repo:** https://github.com/paruff/uFawkesDevX
**Companion repos:** uFawkesRes (resource plane), uFawkesPipe (CI/CD plane), uFawkesSec (security plane)

---

## Baseline state (observed from repo read, 2026-06-23)

| File | Content |
|---|---|
| `README.md` | 494 lines; describes v0.1 stack named `developerd` |
| `LICENSE` | MIT |
| Everything else | **Does not exist** — no compose.yaml, no Makefile, no tests/, no Dockerfiles |

Open issues: 12 (DVX-001 through DVX-011, GITOPS-001) — all open, none closed.

### Decisions resolved before this spec

| Decision | Answer |
|---|---|
| Canonical name | **uFawkesDevX** (README to be updated) |
| Cloud IDE | **Coder v2 + devcontainer standard** (replaces Eclipse Che) |
| Developer portal | **Backstage** (retained for v0.2) |

---

## 1. Purpose and Scope

uFawkesDevX is the developer experience plane of the Fawkes IDP family. It provides:

- A **developer portal** (Backstage) with a seeded service catalog and golden path scaffolding
- A **cloud development environment** (Coder) that provisions browser-accessible workspaces
  defined entirely by the devcontainer standard (`devcontainer.json`)
- A **Score workload abstraction layer** that shields developers from compose/network complexity
  and triggers the uFawkesPipe pipeline on spec submission

### 1.1 What changes from v0.1

| Component | v0.1 | v0.2 |
|---|---|---|
| Cloud IDE | Eclipse Che (removed — too large and complex for Docker) | **Coder v2** with devcontainer integration |
| Developer portal | Backstage (config missing from repo) | Backstage with `app-config.yaml` in repo |
| Database | Postgres embedded in this repo | **Removed** — consumed from uFawkesRes at `postgres:5432` |
| Network | `developerd-control-plane` (private) | `fawkes-net` (external shared) |
| Secrets | `.env` plaintext | Non-secret config in `.env`; passwords from Docker secrets |
| CI | None | `.woodpecker.yml` self-CI (lint + contract tests) |
| Dev environment definition | None | devcontainer standard; golden path templates include `.devcontainer/devcontainer.json` |
| Golden path templates | None | Cookiecutter templates (Python, Java, Node.js, Go) |
| Service catalog | Backstage (empty) | Seeded `catalog/` directory |

### 1.2 Out of scope for v0.2

- Backstage plugin development
- Grafana DevX dashboard (DVX-007 → v0.3, depends on uFawkesObs)
- AGENTS.md / uFawkesAI integration (DVX-008 → v0.3)
- OAuth / SSO for Coder or Backstage (guest/password auth is acceptable for local dev)
- Coder Envbuilder (use Dev Containers Integration with Docker socket instead)
- Terraform-based Coder workspace templates (Docker-native templates only for v0.2)

---

## 2. Personas and JTBD

| Persona | Job To Be Done |
|---|---|
| **App developer (new)** | Scaffold a new service from a golden path template and open a pre-configured Coder workspace in under 30 minutes — zero local toolchain setup |
| **App developer (existing)** | Push `.devcontainer/devcontainer.json` to a repo; Coder auto-discovers and offers a one-click workspace |
| **Platform engineer** | Register a new service in the catalog in < 5 min; verify it appears in Backstage |
| **Team lead** | View all services owned by the team in the catalog without maintaining a spreadsheet |

---

## 3. Functional Requirements

### 3.1 Services deployed by uFawkesDevX (`compose.yaml`)

| Service | Image | Host port | Role |
|---|---|---|---|
| `coder` | `ghcr.io/coder/coder:2.34.3` | `7080` | Cloud IDE control plane; spawns devcontainer workspaces |
| `backstage` | Custom build from `backstage/` | `7007` | Developer portal, service catalog, scaffolding |
| `score-service` | Custom build from `score-service/` | `8081` (API), `8082` (webhook) | Score workload spec + pipeline trigger |
| `plugin-manager` | Custom build from `plugin-manager/` | `8083` | Platform plugin registry |
| `gateway` | `nginx:1.27-alpine` | `8000` | Unified routing entry point |

**Removed:** `postgres` (to uFawkesRes), `eclipse-che` (replaced by Coder).

**Note on Coder version:** `2.34.3` is the current stable version confirmed from
the docs read (2026-06-23). Pin to this tag; do not use `:latest` for Coder.
Update the tag in `.env.example` as new stable versions are released.

### 3.2 Coder cloud IDE requirements

Coder is self-hosted on Docker. Key constraints confirmed from official docs:

- Mounts `/var/run/docker.sock` to spawn workspace containers on the host Docker daemon
- Requires `group_add: ["<docker-gid>"]` — the host docker group GID must be passed
  as a build arg or `.env` variable (`DOCKER_GID`)
- Requires `CODER_ACCESS_URL` set to a reachable IP or hostname — **not** `localhost`
  or `127.0.0.1`, because workspace containers must be able to reach the Coder server.
  For single-node dev, use the host's LAN IP (e.g. `http://192.168.1.x:7080`) or
  `http://host.docker.internal:7080` if on macOS/Windows Docker Desktop
- Connects to Postgres at `postgres:5432` on `fawkes-net` (from uFawkesRes)
  via `CODER_PG_CONNECTION_URL`
- Dev Containers Integration is **enabled by default** in Coder v2.34+; no extra flag needed
- Workspaces with devcontainer support require Docker-in-Docker or a mounted socket;
  the mounted socket approach (`/var/run/docker.sock`) is used for v0.2

### 3.3 Devcontainer standard integration

Coder auto-discovers `devcontainer.json` configurations in workspace repositories.
uFawkesDevX contributes:

- `devcontainer/` — four base devcontainer definitions (Python, Java, Node.js, Go)
- Every golden path template includes `.devcontainer/devcontainer.json` that references
  the appropriate base image from `mcr.microsoft.com/devcontainers/`

The devcontainer standard fields used must conform to the spec at
https://containers.dev/implementors/json_reference/ — do not invent field names.

Required fields in every `.devcontainer/devcontainer.json`:
- `name` — human-readable workspace name
- `image` — pinned MCR devcontainers base image (no `:latest`)
- `postCreateCommand` — installs project dependencies + pre-commit
- `customizations.vscode.extensions` — language-appropriate extensions
- `remoteUser` — `vscode` (standard non-root user in MCR images)

### 3.4 Network topology

All services join `fawkes-net` (external, pre-existing). Services reach:
- `postgres:5432` — uFawkesRes (Backstage DB, Coder DB) **[VERIFY DNS name]**
- `valkey:6379` — uFawkesRes (available for app workspaces) **[VERIFY DNS name]**
- `infisical:8082` — uFawkesSec (secrets, optional)
- `woodpecker-server:8000` — uFawkesPipe (Score webhook target)

### 3.5 Database provisioning (prerequisite, not automated)

Two databases must exist in uFawkesRes Postgres before `make up`:

| Database | User | Used by |
|---|---|---|
| `backstage` | `backstage` | Backstage backend |
| `coder` | `coder` | Coder control plane |

Document the SQL commands to create these in `docs/quickstart.md`. uFawkesDevX does
not run any provisioning SQL itself.

### 3.6 Score → uFawkesPipe integration

Same as previous spec. Score service:
1. Accepts `POST /api/v1/specs` with a `score.yaml`
2. Runs `score-compose generate` to produce a hardened `docker-compose.yaml`
3. Stores the generated compose in a named volume
4. POSTs a webhook trigger to `WOODPECKER_WEBHOOK_URL`

**[VERIFY]** Woodpecker v3 webhook trigger API path before implementing DX-003.

### 3.7 Golden path templates (Cookiecutter)

Four templates in `templates/`. Each produces: `score.yaml`, `.fawkespipe.yml`,
`.devcontainer/devcontainer.json`, `Dockerfile`, minimal `src/`, `tests/`, `README.md`.

| Template | Language | devcontainer base image |
|---|---|---|
| `python-flask-app` | Python 3.12 / Flask | `mcr.microsoft.com/devcontainers/python:3.12` |
| `java-spring-app` | Java 21 / Spring Boot | `mcr.microsoft.com/devcontainers/java:21` |
| `node-express-app` | Node.js 20 / Express | `mcr.microsoft.com/devcontainers/javascript-node:20` |
| `go-http-app` | Go 1.22 | `mcr.microsoft.com/devcontainers/go:1.22` |

**[VERIFY]** all four MCR image tags at https://mcr.microsoft.com/devcontainers before
writing devcontainer.json files. Tag format confirmed as `image:version` but the exact
available versions must be verified.

### 3.8 Service catalog (Backstage)

`catalog/` contains five `catalog-info.yaml` files seeding the Backstage catalog on
first startup. `backstage/app-config.yaml` `catalog.locations` references all five.

### 3.9 Secrets

| Secret / config var | Kind | Used by | Delivery |
|---|---|---|---|
| `CODER_PG_CONNECTION_URL` | Secret (contains password) | Coder | Docker secret |
| `BACKSTAGE_DB_PASSWORD` | Secret | Backstage | Docker secret |
| `CODER_ACCESS_URL` | Config (no secret) | Coder | `.env` |
| `DOCKER_GID` | Config | Coder `group_add` | `.env` |
| `WOODPECKER_WEBHOOK_URL` | Config | Score service | `.env` |

No secret values in any tracked file. `.env` is git-ignored; `.env.example` is tracked.

---

## 4. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| **RAM budget** | Coder ~300MB, Backstage ~500MB, Score + Plugin Manager ~200MB, Nginx ~20MB — total < 1.2 GB for uFawkesDevX services (Coder workspace containers are additional and ephemeral) |
| **Startup order** | uFawkesRes Postgres must be healthy before `make up` (Coder and Backstage both crash-loop without it) |
| **Coder access URL** | Must be a reachable LAN IP or hostname, documented in `docs/quickstart.md` with instructions for finding the host IP |
| **docker.sock permission** | `DOCKER_GID` must match the host docker group GID; `make check-gid` target prints the correct value |
| **Idempotency** | `make down && make up` restores clean working state; Backstage and Coder data persist in Postgres (uFawkesRes volume) |
| **Test coverage** | `pytest tests/unit/` passes; covers compose structure, score contracts, pipeline contracts, devcontainer structure |
| **Image pinning** | Coder pinned to `2.34.3`; Nginx pinned to `1.27-alpine`; MCR devcontainer images pinned to version tags; no `:latest` except where explicitly documented |

---

## 5. Acceptance Criteria

1. `make up` starts all 5 services (coder, backstage, score-service, plugin-manager, gateway) with no errors.
2. Coder UI is accessible at `http://<ACCESS_URL>:7080`; first-user setup completes successfully.
3. A Coder workspace created from a repo containing `.devcontainer/devcontainer.json` auto-discovers the devcontainer and offers a one-click start.
4. Backstage is accessible at `http://localhost:7007`; catalog shows at least 5 entries.
5. `POST http://localhost:8081/api/v1/specs` with a valid `score.yaml` returns HTTP 200.
6. `cookiecutter templates/python-flask-app` produces a directory with valid `.fawkespipe.yml`, `score.yaml`, and `.devcontainer/devcontainer.json`.
7. `pytest tests/unit/` passes with zero failures.
8. `pre-commit run --all-files` passes.

---

## 6. Open Questions

| # | Question | Blocks |
|---|---|---|
| Q1 | Postgres/Valkey DNS names in uFawkesRes — `postgres` and `valkey`? | DX-002 |
| Q2 | Host LAN IP or hostname for `CODER_ACCESS_URL` on your dev machine | DX-002 |
| Q3 | Woodpecker v3 webhook trigger API format | DX-003 |
| Q4 | Do score-service and plugin-manager Dockerfiles exist anywhere in repo history? | DX-002 |
| Q5 | Backstage version to pin in Dockerfile | DX-002 |
