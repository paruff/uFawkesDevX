# uFawkesDevX — Implementation Plan v0.2
*Lean issues for Deepseek v4 flash implementation*

**Status:** Draft — 2026-06-23 (revised from DevPod → Coder + devcontainer standard)
**Branch strategy:** One branch per issue: `feat/DX-001-repo-structure`, etc. PRs to `main`.
**Test gate:** `pytest tests/unit/` + `pre-commit run --all-files` must pass on every PR.
**Definition of done:** All acceptance criteria checked + test gate passing + `yamllint compose.yaml` clean.

---

## Existing issues — disposition

| Issue | Action |
|---|---|
| DVX-001 | **Close** — replaced by DX-001 |
| DVX-002 | **Close** — replaced by DX-008 |
| DVX-003 | **Close with comment:** "Infisical owned by uFawkesSec. uFawkesDevX consumes secrets from Infisical at runtime; no action in this repo." |
| DVX-004 | **Close** — replaced by DX-004 (Coder + devcontainer, not Eclipse Che or DevPod) |
| DVX-005 | **Close** — replaced by DX-005 |
| DVX-006 | **Close** — replaced by DX-006 |
| DVX-007 | **Label v0.3** — depends on uFawkesObs |
| DVX-008 | **Label v0.3** |
| DVX-009 | **Label v0.3** |
| DVX-010 | **Close** — replaced by DX-007 |
| DVX-011 | **Close** — replaced by DX-002 |
| GITOPS-001 | **Label v0.3** |

---

## Prerequisites (human actions — Deepseek cannot proceed until these are resolved)

- [ ] **P1:** Confirm Postgres and Valkey DNS names in uFawkesRes (blocks DX-002)
- [ ] **P2:** Run `getent group docker | cut -d: -f3` (Linux) or `stat -f %g /var/run/docker.sock` (macOS) on the target host; record the GID as `DOCKER_GID` in `.env`
- [ ] **P3:** Set `CODER_ACCESS_URL` to the host's LAN IP (e.g. `http://192.168.1.x:7080`) — not `localhost`. Run `ip route get 1` (Linux) or `ipconfig getifaddr en0` (macOS) to find it
- [ ] **P4:** Confirm Woodpecker v3 webhook trigger API path at woodpecker-ci.org/docs (blocks DX-003)
- [ ] **P5:** Determine whether `score-service/` and `plugin-manager/` Dockerfiles exist in repo history or must be written from scratch
- [ ] **P6:** Pin Backstage version — check current stable at https://github.com/backstage/backstage/releases
- [ ] **P7:** Create `coder` and `backstage` databases in uFawkesRes Postgres before running `make up` (see quickstart.md prerequisite SQL)

---

## DX-001 · Initialize repo structure, pre-commit, and foundational tooling

**Type:** chore
**Estimated effort:** 45 min
**Depends on:** nothing
**Branch:** `feat/DX-001-repo-structure`

### Context
The repo contains only `LICENSE` and `README.md`. No tooling, directories, or tests exist.
This issue lays the scaffold every subsequent issue builds on. Closes DVX-001.

### Acceptance criteria
- [ ] `.pre-commit-config.yaml` created with hooks: `gitleaks` v8.18.2, `detect-secrets`,
  `yamllint`, `markdownlint-cli`, `prettier`
- [ ] `.gitleaks.toml` created (minimal config — standard default rules only, no custom patterns)
- [ ] `.secrets.baseline` generated: `detect-secrets scan > .secrets.baseline`
- [ ] `.yamllint` created (max line length 120)
- [ ] `.markdownlint.json` created (disable MD013 for tables)
- [ ] `.env.example` created with all config variables and comments; no secret values;
  includes `DOCKER_GID`, `CODER_ACCESS_URL`, `CODER_DB_PASSWORD` (placeholder),
  `BACKSTAGE_DB_PASSWORD` (placeholder), `APP_BASE_URL`, `WOODPECKER_WEBHOOK_URL`
- [ ] `tests/unit/__init__.py` created (empty)
- [ ] `tests/requirements.txt` created: `pytest`, `pyyaml`
- [ ] Directory skeleton created: `backstage/`, `score-service/`, `plugin-manager/`,
  `gateway/`, `coder/templates/devcontainer-docker/`, `templates/`, `devcontainer/`,
  `catalog/`, `docs/`, `tests/unit/`
- [ ] `Makefile` skeleton: `pre-commit-setup`, `pre-commit-run`, `test`, `help` targets
- [ ] `pre-commit run --all-files` passes on files created in this issue

### Implementation notes for Deepseek
Do not write any content into subdirectories beyond empty `.gitkeep` files — those
are filled by subsequent issues. The `.env.example` should document every variable
that will eventually appear in `compose.yaml`, even though `compose.yaml` does not
exist yet. This gives the operator a complete reference before starting.

---

## DX-002 · Write `compose.yaml`, Dockerfiles, gateway config, and Makefile `up`/`down`

**Type:** feat / infra
**Estimated effort:** 2.5 hr
**Depends on:** DX-001, P1 (uFawkesRes DNS), P5 (Dockerfiles), P6 (Backstage version)
**Branch:** `feat/DX-002-compose`

### Context
The largest single issue. Creates the full service stack: Coder, Backstage, Score,
Plugin Manager, Gateway. Removes Postgres (to uFawkesRes) and Eclipse Che (replaced
by Coder). Closes DVX-011.

### Acceptance criteria

**`compose.yaml`:**
- [ ] Exactly 5 services: `coder`, `backstage`, `score-service`, `plugin-manager`, `gateway`
- [ ] `postgres` service absent; `eclipse-che` service absent
- [ ] `coder` image: `ghcr.io/coder/coder:2.34.3` (pinned)
- [ ] `coder` has `CODER_PG_CONNECTION_URL` pointing to `postgres:5432`, `CODER_HTTP_ADDRESS`,
  `CODER_ACCESS_URL`, `CODER_TELEMETRY_ENABLE: "false"`
- [ ] `coder` mounts `/var/run/docker.sock:/var/run/docker.sock`
- [ ] `coder` has `group_add: ["${DOCKER_GID}"]`
- [ ] `coder` has `coder-home` named volume at `/home/coder/.config`
- [ ] `backstage` built from `./backstage/Dockerfile`; uses Docker secret `backstage_db_password`
- [ ] `gateway` image `nginx:1.27-alpine`; mounts `./gateway/nginx.conf`
- [ ] `fawkes-net` declared as external network; all 5 services on it
- [ ] All 5 services have `healthcheck` blocks
- [ ] `secrets` top-level block declares `backstage_db_password` with `environment:` key
- [ ] `volumes` top-level block declares `coder-home`

**`backstage/Dockerfile`:**
- [ ] Multi-stage: stage 1 `node:20-alpine` builds the Backstage app; stage 2 `node:20-alpine`
  runs it (verify Node.js version against P6 Backstage target version before writing)
- [ ] `COPY app-config.yaml /app/app-config.yaml`
- [ ] `COPY ../../catalog /app/catalog` (copies catalog entries into image)
- [ ] Final `CMD` starts the Backstage backend with the config file

**`backstage/app-config.yaml`:**
- [ ] Created per design.md §5: `app`, `backend.database` (pointing to `postgres:5432`),
  `catalog.locations` (5 absolute `/app/catalog/` paths), `auth.providers: {}`
- [ ] No secret values; password read via `$env: POSTGRES_PASSWORD`

**`gateway/nginx.conf`:**
- [ ] Created per design.md §6: routes `/backstage/`, `/api/score/`, `/webhooks/score/`,
  `/api/plugins/`, `/health` to correct upstream services

**`score-service/Dockerfile`** and **`plugin-manager/Dockerfile`:**
- [ ] Created or verified present (resolve P5 first)
- [ ] If creating from scratch: minimal Node.js 20 Alpine image with `npm install` and `npm start`

**`Makefile`** (extend DX-001 skeleton):
- [ ] `network` target: `docker network create fawkes-net || true`
- [ ] `build` target: `docker compose build`
- [ ] `up` target: calls `make network`, then `docker compose up -d`, then prints service URLs
- [ ] `up` target: prints a **warning** if `CODER_ACCESS_URL` contains the string `localhost`
  (use `grep -q localhost .env && echo "WARNING: CODER_ACCESS_URL must not be localhost"`)
- [ ] `down` target: `docker compose down`
- [ ] `logs-coder`, `logs-backstage` targets
- [ ] `check-gid` target with Linux + macOS fallback:
  ```makefile
  check-gid:
      @getent group docker 2>/dev/null | cut -d: -f3 || \
       stat -f %g /var/run/docker.sock 2>/dev/null || \
       echo "Cannot detect docker GID — check manually"
  ```

**Tests:**
- [ ] `tests/unit/test_compose_yaml.py` created per design.md §9
- [ ] `pytest tests/unit/test_compose_yaml.py` passes
- [ ] `yamllint compose.yaml` reports zero errors

### Implementation notes for Deepseek
`group_add` in Docker Compose expects a list of strings. `${DOCKER_GID}` will be
an integer when set in `.env`. Docker Compose interpolates it as a string, which is
correct. Do not cast it or quote it differently.

The `backstage_db_password` Docker secret uses `environment: BACKSTAGE_DB_PASSWORD`
syntax (Compose v2.4+). This makes the secret available at
`/run/secrets/backstage_db_password` inside the container. Backstage must read it
from this file path, not from an env var. Verify the Backstage backend config option
for reading the DB password from a file before writing `app-config.yaml`.

Do not invent nginx upstream directive names. Every directive in `nginx.conf` must
come from https://nginx.org/en/docs/http/ngx_http_proxy_module.html.

---

## DX-003 · Implement Score → uFawkesPipe webhook integration

**Type:** feat
**Estimated effort:** 1.5 hr
**Depends on:** DX-002, P4 (Woodpecker webhook API)
**Branch:** `feat/DX-003-score-pipeline`

### Context
Score translates `score.yaml` to a hardened compose file and triggers the Woodpecker
pipeline. Without this, Score is a spec storage API only. Same scope as previous plan —
no change from the Coder migration.

### Acceptance criteria
- [ ] `score-compose` binary installed in `score-service/Dockerfile`
  (verify install method at https://github.com/score-spec/score-compose)
- [ ] `POST /api/v1/specs` endpoint: validates YAML → runs `score-compose generate` →
  stores output in named volume → POSTs webhook trigger to `WOODPECKER_WEBHOOK_URL`
- [ ] Webhook POST is non-blocking: if Woodpecker unreachable, Score returns 202 + logs warning
- [ ] If P4 is unresolved: implement stub that logs payload to stdout + returns 200 with
  `# TODO: verify Woodpecker v3 webhook API format` comment — **do not invent the payload**
- [ ] `WOODPECKER_WEBHOOK_URL` documented in `.env.example`
- [ ] `docs/score-integration.md` created: sequence diagram (text), example `score.yaml`,
  example generated `docker-compose.yaml`, troubleshooting steps

### Implementation notes for Deepseek
`score-compose` is a standalone binary released at https://github.com/score-spec/score-compose/releases.
Install it in the Dockerfile via `curl -L <release-url> -o /usr/local/bin/score-compose && chmod +x`.
Verify the current release URL and binary name before writing the Dockerfile `RUN` instruction.

---

## DX-004 · Add Coder devcontainer workspace template and base devcontainer definitions

**Type:** feat
**Estimated effort:** 2 hr
**Depends on:** DX-002 (Coder service must exist in compose), P2 (DOCKER_GID), P3 (CODER_ACCESS_URL)
**Branch:** `feat/DX-004-coder-devcontainer`

### Context
This issue replaces Eclipse Che with Coder as the cloud IDE, using the devcontainer
standard as the environment definition format. It has two parts:
(A) base devcontainer JSON files in `devcontainer/` that golden path templates reference
(B) a Coder Terraform workspace template in `coder/templates/devcontainer-docker/` that
    provisions Docker-backed devcontainer workspaces

Closes DVX-004.

### Acceptance criteria

**Part A — base devcontainer definitions:**
- [ ] `devcontainer/base-python.json` created per design.md §7; `image` field pinned
  to `mcr.microsoft.com/devcontainers/python:3.12` (verify tag at mcr.microsoft.com)
- [ ] `devcontainer/base-java.json` — image `mcr.microsoft.com/devcontainers/java:21`
- [ ] `devcontainer/base-node.json` — image `mcr.microsoft.com/devcontainers/javascript-node:20`
- [ ] `devcontainer/base-go.json` — image `mcr.microsoft.com/devcontainers/go:1.22`
- [ ] All four files: `postCreateCommand` installs pre-commit; `remoteUser: vscode`;
  language-appropriate VS Code extensions; no `:latest` tags
- [ ] `tests/unit/test_devcontainer.py` created and passes (validates all four base files)

**Part B — Coder Terraform workspace template:**
- [ ] `coder/templates/devcontainer-docker/main.tf` created as an outline per design.md §4
- [ ] `main.tf` must have a `# VERIFY` comment on every resource type and field name,
  referencing https://registry.terraform.io/providers/coder/coder — this file is an
  outline for human review, not a ready-to-apply template
- [ ] `coder/templates/devcontainer-docker/README.md` created documenting:
  what the template does, how to push it to Coder (`coder templates push`), prerequisites
- [ ] `Makefile` extended: `coder-push-template` target added per design.md §8
- [ ] `docs/coder-guide.md` created covering: Coder first-run setup (create admin user),
  how to push the workspace template, how to create a workspace from a repo with
  `.devcontainer/devcontainer.json`, how to connect via browser and VS Code SSH

### Implementation notes for Deepseek
The Coder Terraform template in `main.tf` is an **outline for human review** — not
production-ready Terraform. Every resource type (`coder_agent`, `docker_container`,
`coder_devcontainer`) must have a `# VERIFY: see https://registry.terraform.io/providers/coder/coder`
comment. This is intentional: the Terraform provider schema changes between Coder
versions and must be verified against the pinned version (2.34.3) before use.

Do not attempt to run `terraform validate` or `coder templates push` as part of this
issue — those are manual human steps documented in the template README.

---

## DX-005 · Seed Backstage service catalog

**Type:** feat
**Estimated effort:** 45 min
**Depends on:** DX-001 (directory structure)
**Branch:** `feat/DX-005-catalog`

### Context
Backstage starts with an empty catalog. This issue seeds it with all five uFawkes
planes so platform engineers can find every service on first startup. Closes DVX-005.

### Acceptance criteria
- [ ] `catalog/uFawkesDevX.yaml` — `kind: Component`, `type: service`,
  `owner: platform-team`, links to GitHub repo
- [ ] `catalog/uFawkesPipe.yaml` — `kind: System` representing the CI/CD plane
- [ ] `catalog/uFawkesSec.yaml` — `kind: System` representing the security plane
- [ ] `catalog/uFawkesRes.yaml` — `kind: System` representing the resource plane
- [ ] `catalog/uFawkesObs.yaml` — `kind: System` representing the observability plane
- [ ] All 5 files use valid Backstage catalog schema — **VERIFY field names at**
  **https://backstage.io/docs/features/software-catalog/descriptor-format**
  **before writing. Do not invent field names.**
- [ ] `backstage/app-config.yaml` `catalog.locations` references all 5 files
  (already declared in DX-002; verify it is not overwritten)
- [ ] `yamllint catalog/*.yaml` passes
- [ ] Test in `tests/unit/test_compose_yaml.py` extended: asserts
  `backstage/app-config.yaml` contains `catalog.locations` with at least 5 entries

---

## DX-006 · Add Cookiecutter golden path templates with devcontainer + Score + pipeline contracts

**Type:** feat
**Estimated effort:** 2 hr
**Depends on:** DX-004 (base devcontainer definitions must exist first)
**Branch:** `feat/DX-006-golden-paths`

### Context
The core developer-facing deliverable. Four Cookiecutter templates produce complete,
pipeline-ready app skeletons. Each includes a `.devcontainer/devcontainer.json` that
Coder will auto-discover. Closes DVX-006.

### Acceptance criteria
- [ ] `templates/python-flask-app/`, `templates/java-spring-app/`,
  `templates/node-express-app/`, `templates/go-http-app/` created
- [ ] Each template `cookiecutter.json` has variables:
  `project_name`, `project_slug`, `language`, `registry_namespace`
- [ ] Each template `{{cookiecutter.project_slug}}/` contains all 6 required files:
  `.devcontainer/devcontainer.json`, `score.yaml`, `.fawkespipe.yml`, `Dockerfile`,
  `README.md`, minimal `src/` and `tests/`
- [ ] `.devcontainer/devcontainer.json` in each template uses the correct MCR base
  image for the language (matches `devcontainer/base-<lang>.json` from DX-004)
- [ ] `score.yaml` has `apiVersion: score.dev/v1b1` (verify current API version at
  https://docs.score.dev before writing)
- [ ] `.fawkespipe.yml` has `app.name`, `app.language`, `build.builder: cnb`, `stages`
- [ ] `tests/unit/test_score_contracts.py` created and passes
- [ ] `tests/unit/test_pipeline_contracts.py` created and passes
- [ ] `tests/unit/test_devcontainer.py` extended to validate template devcontainer.json files
- [ ] `docs/golden-paths.md` created: how to use each template, how to open in Coder,
  how to add a new template language

### Implementation notes for Deepseek
Tests operate on raw template files — `{{ cookiecutter.project_slug }}` is treated
as a literal string (not rendered). Load YAML as string, check structural patterns.
Do not try to render templates in tests; that requires `cookiecutter` as a dependency
and produces non-deterministic output.

Each language template's `.devcontainer/devcontainer.json` `image` field must exactly
match the pinned tag in the corresponding `devcontainer/base-<lang>.json` file from
DX-004. Test this consistency in `test_devcontainer.py`.

---

## DX-007 · Add `.woodpecker.yml` self-CI

**Type:** chore
**Estimated effort:** 30 min
**Depends on:** DX-001, DX-002
**Branch:** `feat/DX-007-self-ci`

### Context
No CI exists. PRs merge without any automated check. Closes DVX-010.

### Acceptance criteria
- [ ] `.woodpecker.yml` created with 3 steps: `lint-yaml`, `lint-markdown`,
  `contract-tests`
- [ ] `lint-yaml`: `python:3.12-slim`, runs `yamllint`; non-blocking (`|| true`)
- [ ] `lint-markdown`: `node:20-alpine`, runs `markdownlint`; non-blocking (`|| true`)
- [ ] `contract-tests`: `python:3.12-slim`, installs `tests/requirements.txt`,
  runs `pytest tests/unit/ -v --tb=short`; **hard gate** (no `|| true`)
- [ ] `yamllint .woodpecker.yml` passes
- [ ] Step names consistent with uFawkesPipe convention

---

## DX-008 · Rewrite `README.md` and write `docs/quickstart.md`

**Type:** docs
**Estimated effort:** 1 hr
**Depends on:** DX-002 through DX-007 all merged
**Branch:** `feat/DX-008-readme-docs`

### Context
README is empty. Quickstart does not exist. This is always the last issue.
Closes DVX-002. Merges DVX-004 documentation.

### Acceptance criteria

**`README.md`:**
- [ ] Title: `uFawkesDevX — Developer Experience Plane`
- [ ] One-paragraph description: Coder + Backstage + Score + golden paths
- [ ] ASCII architecture diagram consistent with design.md §1
- [ ] Services table: 5 services (Coder, Backstage, Score, Plugin Manager, Gateway)
  with ports and roles; explicitly notes Postgres absent (in uFawkesRes)
- [ ] Quick start: 4-line snippet pointing to `docs/quickstart.md`
- [ ] Section: Coder cloud IDE — what it is, link to `docs/coder-guide.md`
- [ ] Section: Golden paths — what they are, link to `docs/golden-paths.md`
- [ ] Section: Score integration — link to `docs/score-integration.md`
- [ ] Eclipse Che explicitly noted as removed, replaced by Coder
- [ ] `markdownlint README.md` passes

**`docs/quickstart.md`:**
- [ ] Section 0 — Prerequisites: uFawkesRes running; `coder` and `backstage` databases
  created in uFawkesRes Postgres (include the exact SQL: `CREATE DATABASE coder; CREATE USER coder...`)
- [ ] Section 1 — Find your docker GID: `make check-gid`, set `DOCKER_GID` in `.env`
- [ ] Section 2 — Set `CODER_ACCESS_URL`: explain why `localhost` fails; how to find
  LAN IP on Linux (`ip route get 1`) and macOS (`ipconfig getifaddr en0`)
- [ ] Section 3 — Build and start: `make build && make up`
- [ ] Section 4 — Coder first-run: navigate to `CODER_ACCESS_URL`, create admin user,
  push workspace template via `make coder-push-template`
- [ ] Section 5 — Smoke test checklist (8 steps matching spec acceptance criteria)
- [ ] Troubleshooting: Coder stuck "Connecting..." → check `CODER_ACCESS_URL`;
  Backstage crash-loop → check DB exists; wrong `DOCKER_GID` → rerun `make check-gid`
- [ ] `markdownlint docs/quickstart.md` passes

---

## Milestone summary

| Milestone | Issues | Target week |
|---|---|---|
| **v0.2-scaffold** | DX-001 | Week 5 |
| **v0.2-infra** | DX-002, DX-003 | Week 5 |
| **v0.2-devx** | DX-004, DX-005, DX-006 | Week 6 |
| **v0.2-ci-docs** | DX-007, DX-008 | Week 6 |

**Dependency graph:**
```
DX-001
  └── DX-002 ──── DX-003
      └── DX-004 ─┬── DX-005 ── DX-008
                  └── DX-006 ──┘
  └── DX-007 ── DX-008
```

---

## Notes for Deepseek implementation

1. **Coder image is pinned to `2.34.3`.** Do not use `:latest`. Do not upgrade without
   verifying the Terraform provider schema still matches `main.tf`.

2. **`CODER_ACCESS_URL` is the single most common failure point.** Every doc that
   mentions starting Coder must include the warning that `localhost` does not work.

3. **`group_add` takes the host docker GID as a string.** `${DOCKER_GID}` from `.env`
   is an integer; Docker Compose interpolates it as a string in the `group_add` list.
   This is correct. Do not add explicit quoting.

4. **The Coder Terraform template in `main.tf` is an outline for human review.**
   Every line that references a Coder or Docker Terraform resource must have a
   `# VERIFY` comment. This is not optional — it prevents a future engineer from
   treating unverified Terraform as production-ready.

5. **Do not invent Backstage catalog field names.** Load the Backstage catalog
   descriptor format docs before writing any `catalog-info.yaml`. Wrong field names
   fail silently — Backstage ignores unrecognised fields without errors.

6. **One PR per issue, in dependency order.** DX-001 merges first in every case.
   DX-008 merges last in every case.

7. **The `score-compose` binary name may have changed.** The project was active
   as of mid-2025 but the binary and repository name are subject to change.
   Always fetch the releases page before writing the Dockerfile install command.
