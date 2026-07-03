# uFawkesDevX — Design v0.2
*Developer Experience Plane of the Fawkes IDP Family*

**Status:** Draft — 2026-06-23
**Depends on:** devx-specification.md v0.2

---

## 1. Component and Network Map

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  fawkes-net  (external Docker bridge)                                              │
│                                                                                    │
│  ╔══════════════════════════╗   ╔═════════════════════════════════════════════╗    │
│  ║  uFawkesRes              ║   ║  uFawkesDevX (this repo)                    ║    │
│  ║  postgres:5432 [VERIFY]  ║   ║                                             ║    │
│  ║  valkey:6379   [VERIFY]  ║   ║  gateway:8000  (nginx:1.27-alpine)          ║    │
│  ╚══════════════════════════╝   ║  backstage:7007  (custom build)             ║    │
│            ▲   ▲               ║  score-service:8081/8082  (custom build)     ║    │
│            │   │               ║  plugin-manager:8083  (custom build)         ║    │
│     Coder DB   Backstage DB    ║  coder:7080  (ghcr.io/coder/coder:2.34.3)   ║    │
│                                ╚═════════════════════════════════════════════╝    │
│                                        │                                          │
│                     mounts /var/run/docker.sock                                   │
│                                        │                                          │
│                                   Host Docker daemon                              │
│                                        │                                          │
│                           ┌────────────┴────────────┐                            │
│                           │  Ephemeral workspace     │                            │
│                           │  containers (devcontainer│                            │
│                           │  per developer session)  │                            │
│                           └──────────────────────────┘                            │
│                                                                                    │
│  ╔══════════════════════╗   ╔═════════════════════════════════════════════════╗   │
│  ║  uFawkesSec           ║   ║  uFawkesPipe                                    ║   │
│  ║  infisical:8082       ║   ║  woodpecker-server:8000                         ║   │
│  ╚══════════════════════╝   ╚═════════════════════════════════════════════════╝   │
└────────────────────────────────────────────────────────────────────────────────────┘

Developer browser:
  :7080  → Coder UI       (manage + open workspaces)
  :7007  → Backstage UI   (catalog, scaffolding)
  :8000  → Gateway        (unified entry: /api/score, /api/plugins)
```

---

## 2. Repository File Structure (target after all issues merged)

```
uFawkesDevX/
  compose.yaml
  Makefile
  .woodpecker.yml
  .env.example
  .pre-commit-config.yaml
  .gitleaks.toml
  .secrets.baseline
  .yamllint
  .markdownlint.json
  backstage/
    Dockerfile
    app-config.yaml
    packages/                  # Backstage monorepo (if customised; otherwise default)
  score-service/
    Dockerfile
    config/service.yaml
  plugin-manager/
    Dockerfile
  gateway/
    nginx.conf
  coder/
    templates/
      devcontainer-docker/
        main.tf                # Coder Terraform template for Docker devcontainer workspaces
        README.md
  templates/                   # Cookiecutter golden path templates
    python-flask-app/
      cookiecutter.json
      {{cookiecutter.project_slug}}/
        .devcontainer/devcontainer.json
        score.yaml
        .fawkespipe.yml
        Dockerfile
        README.md
        src/
        tests/
    java-spring-app/           # same structure
    node-express-app/          # same structure
    go-http-app/               # same structure
  devcontainer/                # base devcontainer definitions (referenced by templates)
    base-python.json
    base-java.json
    base-node.json
    base-go.json
  catalog/
    uFawkesDevX.yaml
    uFawkesPipe.yaml
    uFawkesSec.yaml
    uFawkesRes.yaml
    uFawkesObs.yaml
  docs/
    quickstart.md
    coder-guide.md
    score-integration.md
    golden-paths.md
  tests/
    unit/
      __init__.py
      test_compose_yaml.py
      test_devcontainer.py
      test_score_contracts.py
      test_pipeline_contracts.py
    requirements.txt
  README.md
```

---

## 3. `compose.yaml` Design

### 3.1 Key decisions

**Coder:** Image `ghcr.io/coder/coder:2.34.3` (pinned, confirmed from official docs).
Coder mounts the host Docker socket to provision workspace containers on the same Docker
daemon. This means workspace devcontainers run as sibling containers on the host, not
nested inside Coder. The `group_add` entry must use the **host** docker group GID —
this is machine-specific and must be set in `.env` as `DOCKER_GID`.

`CODER_ACCESS_URL` cannot be `localhost`. It must be a routable address that workspace
containers can reach. Set in `.env` by the operator. Document detection in quickstart.

**Backstage:** Multi-stage build; Node.js at build time, runtime image serves the
compiled backend. Postgres connection points to uFawkesRes. No embedded database.

**Postgres removed:** The v0.1 `postgres` service and `postgres-data` volume are gone.
Both Coder and Backstage connect to `postgres:5432` on `fawkes-net`.

**Eclipse Che removed:** Freed its port (8080). No replacement service in compose —
Coder takes the cloud IDE role.

### 3.2 Target `compose.yaml`

```yaml
# uFawkesDevX compose.yaml — v0.2
# Prerequisites:
#   - uFawkesRes running (postgres:5432, valkey:6379 on fawkes-net) [VERIFY names]
#   - Databases created: "coder" and "backstage" in uFawkesRes Postgres
#   - DOCKER_GID set in .env (run: getent group docker | cut -d: -f3)
#   - CODER_ACCESS_URL set to a LAN-reachable IP:port in .env
# Run: make network && make build && make up

services:

  coder:
    image: ghcr.io/coder/coder:2.34.3
    container_name: coder
    restart: unless-stopped
    environment:
      CODER_PG_CONNECTION_URL: "postgresql://coder:${CODER_DB_PASSWORD}@postgres:5432/coder?sslmode=disable"
      CODER_HTTP_ADDRESS: "0.0.0.0:7080"
      CODER_ACCESS_URL: "${CODER_ACCESS_URL}"
      # Disable telemetry for self-hosted
      CODER_TELEMETRY_ENABLE: "false"
    group_add:
      - "${DOCKER_GID}"          # host docker group GID — set in .env
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - coder-home:/home/coder/.config
    ports:
      - "7080:7080"
    networks:
      - fawkes-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7080/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  backstage:
    build:
      context: ./backstage
      dockerfile: Dockerfile
    container_name: backstage
    restart: unless-stopped
    environment:
      APP_BASE_URL: "${APP_BASE_URL:-http://localhost:7007}"
      POSTGRES_HOST: postgres
      POSTGRES_PORT: "5432"
      POSTGRES_USER: backstage
      POSTGRES_DATABASE: backstage
      # POSTGRES_PASSWORD injected via Docker secret — not here
    secrets:
      - backstage_db_password
    ports:
      - "7007:7007"
    networks:
      - fawkes-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7007/healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  score-service:
    build:
      context: ./score-service
      dockerfile: Dockerfile
    container_name: score-service
    restart: unless-stopped
    environment:
      SCORE_API_PORT: "8081"
      WEBHOOK_PORT: "8082"
      WOODPECKER_WEBHOOK_URL: "${WOODPECKER_WEBHOOK_URL:-}"
    ports:
      - "8081:8081"
      - "8082:8082"
    networks:
      - fawkes-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  plugin-manager:
    build:
      context: ./plugin-manager
      dockerfile: Dockerfile
    container_name: plugin-manager
    restart: unless-stopped
    environment:
      PLUGIN_MANAGER_PORT: "8083"
    ports:
      - "8083:8083"
    networks:
      - fawkes-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8083/api/v1/plugins"]
      interval: 15s
      timeout: 5s
      retries: 3

  gateway:
    image: nginx:1.27-alpine
    container_name: gateway
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - fawkes-net
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 15s
      timeout: 5s
      retries: 3

secrets:
  backstage_db_password:
    environment: BACKSTAGE_DB_PASSWORD

volumes:
  coder-home:

networks:
  fawkes-net:
    external: true
    name: fawkes-net
```

**Note on `secrets.*.environment` syntax:** Requires Docker Compose v2.4+. This injects
the env var value as a file at `/run/secrets/backstage_db_password`. Backstage reads it
via `POSTGRES_PASSWORD_FILE` or equivalent. Verify Backstage's secret file config
option before implementing — see https://backstage.io/docs/conf/writing.

---

## 4. Coder Workspace Template Design (`coder/templates/devcontainer-docker/`)

Coder uses Terraform to define workspace templates. For Docker-backed devcontainer
workspaces, the Terraform provider is `coder/docker`. The template must be uploaded
to the running Coder instance via `coder templates push`.

**CAUTION:** I am not fully certain of the current Coder Terraform Docker provider
schema. The `coder/docker` provider and the `coder_devcontainer` resource were
confirmed to exist in Coder v2.34.x docs but I did not fetch the full Terraform
schema. Verify at https://registry.coder.com before writing `main.tf`.

### 4.1 `coder/templates/devcontainer-docker/main.tf` outline

```hcl
terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

# Data source: the authenticated Coder user
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# Docker volume for the workspace home directory
resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
  lifecycle {
    ignore_changes = all
  }
}

# The workspace container — uses devcontainer if repo has devcontainer.json
resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  name  = "coder-${data.coder_workspace_owner.me.name}-${data.coder_workspace.me.name}"
  image = "ghcr.io/coder/envbuilder:latest"   # Envbuilder builds from devcontainer.json

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    "GIT_URL=${data.coder_workspace.me.owner_name}",   # verify exact field
  ]

  volumes {
    container_path = "/home/user"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }

  networks_advanced {
    name = "fawkes-net"
  }
}

resource "coder_agent" "main" {
  arch           = "amd64"
  os             = "linux"
  startup_script = "pre-commit install || true"
}
```

**This is an outline, not a working template.** The exact resource types, field names,
and agent configuration must be verified from the Coder Terraform registry at
https://registry.terraform.io/providers/coder/coder before implementing DX-004.

---

## 5. Backstage `app-config.yaml` Design

```yaml
app:
  title: Fawkes IDP
  baseUrl: ${APP_BASE_URL}

backend:
  baseUrl: ${APP_BASE_URL}
  listen:
    port: 7007
  database:
    client: pg
    connection:
      host: ${POSTGRES_HOST}
      port: ${POSTGRES_PORT}
      user: ${POSTGRES_USER}
      database: ${POSTGRES_DATABASE}
      # Password read from file injected by Docker secret
      # Backstage reads POSTGRES_PASSWORD or the connection string
      # VERIFY: exact env var name for secret-file injection at:
      # https://backstage.io/docs/conf/writing
      password:
        $env: POSTGRES_PASSWORD

catalog:
  locations:
    - type: file
      target: /app/catalog/uFawkesDevX.yaml
    - type: file
      target: /app/catalog/uFawkesPipe.yaml
    - type: file
      target: /app/catalog/uFawkesSec.yaml
    - type: file
      target: /app/catalog/uFawkesRes.yaml
    - type: file
      target: /app/catalog/uFawkesObs.yaml

auth:
  environment: development
  providers: {}
```

Catalog `target` paths use absolute `/app/catalog/` because the `catalog/` directory
is copied into the Docker image at `/app/catalog/` in the Backstage Dockerfile.
This avoids relative path resolution failures at runtime.

---

## 6. `gateway/nginx.conf` Design

```nginx
server {
    listen 8000;

    # Backstage portal
    location /backstage/ {
        proxy_pass http://backstage:7007/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Score service API
    location /api/score/ {
        proxy_pass http://score-service:8081/;
        proxy_set_header Host $host;
    }

    # Score webhooks
    location /webhooks/score/ {
        proxy_pass http://score-service:8082/;
        proxy_set_header Host $host;
    }

    # Plugin manager
    location /api/plugins/ {
        proxy_pass http://plugin-manager:8083/;
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

**VERIFY** that the trailing slash handling (`proxy_pass http://backstage:7007/`) is
correct for your nginx version. The trailing slash strips the location prefix from the
proxied request — confirm this is the intended behaviour for each service.

---

## 7. Devcontainer Base Definitions (`devcontainer/`)

These are base files that golden path templates reference. They are not used directly
by Coder — they exist as documentation and as a source for template generation.

### `devcontainer/base-python.json`

```json
{
  "name": "Python 3.12",
  "image": "mcr.microsoft.com/devcontainers/python:3.12",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "pip install pre-commit && pre-commit install",
  "remoteUser": "vscode",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.flake8",
        "ms-python.black-formatter"
      ]
    }
  }
}
```

Equivalent files for Java (image: `mcr.microsoft.com/devcontainers/java:21`),
Node.js (image: `mcr.microsoft.com/devcontainers/javascript-node:20`),
Go (image: `mcr.microsoft.com/devcontainers/go:1.22`).

**VERIFY all four image tags** at https://mcr.microsoft.com/devcontainers before
writing. Only Python and JavaScript-node tag formats were confirmed in search results.

---

## 8. Makefile Design

```makefile
.PHONY: network build up down check-gid logs-coder logs-backstage test help

network: ## Create fawkes-net if it does not exist
	docker network create fawkes-net || true

check-gid: ## Print the host docker group GID — set this as DOCKER_GID in .env
	@getent group docker | cut -d: -f3

build: ## Build all custom service images
	docker compose build

up: network ## Start uFawkesDevX stack (requires uFawkesRes running)
	docker compose up -d
	@echo ""
	@echo "  Coder:          http://localhost:7080  (use CODER_ACCESS_URL for workspaces)"
	@echo "  Backstage:      http://localhost:7007"
	@echo "  Gateway:        http://localhost:8000"
	@echo "  Score API:      http://localhost:8081"
	@echo "  Plugin Manager: http://localhost:8083"

down: ## Stop stack
	docker compose down

logs-coder: ## Tail Coder logs
	docker compose logs -f coder

logs-backstage: ## Tail Backstage logs
	docker compose logs -f backstage

test: ## Run contract tests
	pytest tests/unit/ -v

pre-commit-setup: ## Install pre-commit hooks
	pip install pre-commit && pre-commit install

pre-commit-run: ## Run pre-commit on all files
	pre-commit run --all-files

coder-push-template: ## Push the devcontainer workspace template to Coder (requires Coder running)
	cd coder/templates/devcontainer-docker && coder templates push devcontainer-docker

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  %-25s %s\n", $$1, $$2}'
```

---

## 9. Test Design

### `tests/unit/test_compose_yaml.py`
- Services present: `coder`, `backstage`, `score-service`, `plugin-manager`, `gateway`
- `postgres` and `eclipse-che` services **absent**
- `fawkes-net` declared as external network on all services
- All services have `healthcheck` blocks
- `coder` image is `ghcr.io/coder/coder:2.34.3` (pinned, not `:latest`)
- `gateway` image is `nginx:1.27-alpine`
- `coder` service has `/var/run/docker.sock` volume mount

### `tests/unit/test_devcontainer.py`
- For each `devcontainer/base-*.json`: valid JSON, `image` field present and not `:latest`,
  `postCreateCommand` present, `remoteUser` is `vscode`
- For each template `templates/*/{{cookiecutter.project_slug}}/.devcontainer/devcontainer.json`:
  valid JSON, `image` field present

### `tests/unit/test_score_contracts.py`
- For each `templates/*/{{cookiecutter.project_slug}}/score.yaml`:
  valid YAML, `apiVersion == score.dev/v1b1`, `metadata.name` present, `containers` present

### `tests/unit/test_pipeline_contracts.py`
- For each `templates/*/{{cookiecutter.project_slug}}/.fawkespipe.yml`:
  valid YAML, `app.name`, `app.language`, `build.builder`, `stages` all present,
  `build.builder` in `["cnb", "docker"]`

---

## 10. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `CODER_ACCESS_URL` set to `localhost` — workspace containers cannot connect to Coder | **High** (common mistake) | `make up` prints a warning if `CODER_ACCESS_URL` contains `localhost`; `docs/quickstart.md` explains how to find the host LAN IP |
| Wrong `DOCKER_GID` — Coder cannot reach Docker socket | **High** | `make check-gid` prints the correct GID; quickstart step 1 is always "run make check-gid and set DOCKER_GID in .env" |
| Backstage crashes on startup because `coder` or `backstage` DB not yet created in uFawkesRes | **High** | `docs/quickstart.md` section 1 is database provisioning; `make up` does not attempt to create DBs |
| Backstage Docker image takes >10 min to build on first run (Node.js compilation) | **Medium** | Document build time expectation; add `--cache-from` to Dockerfile for incremental builds |
| Coder Terraform Docker provider schema changes between versions | **Medium** | Pin Coder version (`2.34.3`); document the provider version in `coder/templates/devcontainer-docker/main.tf` |
| MCR devcontainer image tags verified now but change later | **Low** | Tags are pinned in devcontainer.json files; update via Dependabot or manual review |
| `getent` command unavailable on macOS for `make check-gid` | **Medium** | Add macOS fallback: `dscl . -read /Groups/docker PrimaryGroupID` or `stat -f %g /var/run/docker.sock` |
