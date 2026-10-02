# Deployment Strategy — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

---

## Deployment Model

**Local-first, Docker Compose.** uFawkesDevX runs entirely on a developer's machine via `docker compose`. There is no remote deployment, no Kubernetes, no cloud infrastructure.

**This is intentional.** The Compose-tier DevX plane is the stepping stone before Kubernetes (Fawkes track). It must work locally first.

---

## Stack Topology

### Prerequisites (External)

| Dependency | Source | Required | Notes |
|---|---|---|---|
| **Docker** 20.10+ | Host install | Yes | `docker --version` |
| **Docker Compose** v2.0+ | Host install | Yes | `docker compose version` |
| **fawkes-net** | `make network` | Yes | Shared external network (the Postgres provider joins it) |
| **PostgreSQL** | External (uFawkesRes is deprecated; replacement TBD, #57) | Yes | `postgres:5432` on `fawkes-net` |
| **Valkey** (Redis) | External (same provider as Postgres) | Optional | Only if Coder needs session store |
| **DOCKER_GID** | `.env` | Yes | `make check-gid` to determine |

### Services (Internal)

| Service | Image | Port | Healthcheck | Profile |
|---|---|---|---|---|
| **Gateway** | `nginx:1.27-alpine` | 8000 | `nginx -t` | core |
| **Backstage** | Custom build (Node) | 7007 | `curl -f http://localhost:7007/healthcheck` | core |
| **Score Service** | Custom build (Node) | 8081 (API), 8082 (webhooks) | `node healthcheck.js` (in Dockerfile) | core |
| **Plugin Manager** | Custom build (Node) | 8083 | `node healthcheck.js` (in Dockerfile) | core |
| **Coder** | `ghcr.io/coder/coder:2.34.3` | 7080 | `curl -f http://localhost:7080/healthz` | core |

### Volumes

| Volume | Container Mount | Purpose | Persistence |
|---|---|---|---|
| `developerd-coder-home` | `/home/coder/.config` | Coder config/state | Persistent |
| `developerd-backstage-plugins` | `/app/plugins` | Installed Backstage plugins | Persistent |
| `developerd-score-specs` | `/app/specs` | Score workload specs | Persistent |
| `developerd-score-plugins` | `/app/plugins` | Score service plugins | Persistent |
| `developerd-plugin-registry` | `/plugins` | Plugin Manager local registry | Persistent |

---

## Network Configuration

```
┌─────────────────────────────────────────────────────────┐
│                   fawkes-net (external)                  │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Postgres    │  │  uFawkesDevX │  │  uFawkesObs    │ │
│  │  postgres    │  │  gateway     │  │  otel-collector│ │
│  │  valkey      │  │  backstage   │  │  prometheus    │ │
│  └──────┬──────┘  │  score       │  │  grafana       │ │
│         │         │  plugins     │  └─────────────────┘ │
│         │         │  coder       │                       │
│         └─────────┴─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## Secrets Management

| Secret | Storage | Access |
|---|---|---|
| `BACKSTAGE_DB_PASSWORD` | Docker Compose secret (`secrets:`) | Injected as `/run/secrets/backstage_db_password` |
| `CODER_DB_PASSWORD` | `.env` (gitignored) | Environment variable |
| `GRAFANA_ADMIN_PASSWORD` | `.env` (gitignored) | Environment variable |
| Docker socket | Host mount (`/var/run/docker.sock`) | Direct access (insecure; documented in KNOWN_LIMITATIONS) |

**Rules:**
- `.env` is gitignored; `.env.example` is the source of truth
- Never commit real secrets
- gitleaks CI gate catches accidental commits
- For production: use Docker secrets or external secret manager (not in scope for pre-alpha)

---

## Startup Sequence

```bash
# 1. Ensure prerequisites
make network        # create fawkes-net if missing
make check-gid      # verify DOCKER_GID in .env

# 2. Build custom images
make build          # backstage, score-service, plugin-manager

# 3. Start all services
make up             # docker compose up -d

# 4. Wait for health
make health         # check all services report healthy
```

**Dependency Order:**
1. PostgreSQL (external; uFawkesRes is deprecated, replacement TBD, #57) must be running first
2. Gateway depends on Backstage + Score Service (via `depends_on`)
3. Backstage depends on PostgreSQL (external)
4. Score Service depends on PostgreSQL (external)
5. Coder depends on PostgreSQL (external)
6. Plugin Manager has no runtime dependencies

---

## Health Checks

| Service | Check Command | Expected | Timeout |
|---|---|---|---|
| Gateway | `curl -f http://localhost:8000/health` | 200 OK | 5s |
| Backstage | `curl -f http://localhost:7007/healthcheck` | 200 OK | 10s |
| Score API | `curl -f http://localhost:8081/health` | 200 OK | 5s |
| Score Webhooks | `curl -f http://localhost:8082/health` | 200 OK | 5s |
| Plugin Manager | `curl -f http://localhost:8083/health` | 200 OK | 5s |
| Coder | `curl -f http://localhost:7080/healthz` | 200 OK | 5s |
| PostgreSQL | `psql -h postgres -U backstage -c "SELECT 1"` | 1 | 5s |

---

## Local Development Workflow

### Hot Reload (Score Service, Plugin Manager)

- Score Service: volume-mount `score-service/src/` → changes auto-reload (Node `--watch`)
- Plugin Manager: volume-mount `plugin-manager/src/` → changes auto-reload
- Backstage: requires `docker compose restart backstage` for plugin/config changes

### Clean Start

```bash
docker compose down -v    # stop + remove volumes
rm -rf data/              # optional: clear persistent data
make init                 # recreate data dirs with correct permissions
make up                   # fresh start
```

---

## Future: Fawkes Track (Kubernetes)

uFawkesDevX is the **Compose-tier stepping stone**. When the team outgrows local (multi-developer, shared environment, production parity with K8s), the graduation path is:

| Compose (uFawkesDevX) | Kubernetes (Fawkes) |
|---|---|
| `docker compose up` | Helm chart + ArgoCD |
| `make network` | K8s NetworkPolicy |
| `docker volume` | PVC (PersistentVolumeClaim) |
| `compose.yaml` | `kustomize` overlays |
| `secrets:` | External Secrets Operator |
| `healthcheck:` | liveness/readiness probes |

See `docs/fawkes-migration.md` in uFawkesObs for the detailed migration path.

---

## How This Connects

| Document | What It Answers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full component descriptions and data flows |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | Known issues with the current deployment model |
| [docs/CHANGE_IMPACT_MAP.md](docs/CHANGE_IMPACT_MAP.md) | What breaks when config changes |
| [SECURITY.md](SECURITY.md) | Security implications of this deployment model |
| [RELEASE_PROCESS.md](RELEASE_PROCESS.md) | How releases are validated and shipped |
