# Change Impact Map — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

> **Purpose:** Before modifying any config file, service definition, or shared contract, consult this map to know what else breaks. This is the co-change map — every entry means "changing X requires verifying Y and Z."

---

## How to Use This Map

1. **You're about to change file/column A?** → Find the row for A → verify all "Affected By" columns still pass.
2. **You're about to add a new service?** → Check "Add New Service" checklist at bottom.
3. **PR reviewer:** Verify the diff includes changes to all affected files, or document why not.

---

## Config & Service Change Matrix

| File / Config | Changes In | Tests to Re-run | Docs to Update | Compose Services Affected |
|---|---|---|---|---|
| `compose.yaml` | `make up`, `make build`, CI build stage | `make health`, `make test-acceptance`, `make security-scan` | README.md (ports, services), QUICK-REFERENCE.md, ARCHITECTURE.md | All |
| `compose.override.yaml` | Dev-only overrides | `make health`, `make test-acceptance` | README.md (dev overrides section) | All |
| `.env.example` | `make check-env`, CI env validation | `make health` | README.md (prerequisites) | All (env vars) |
| `backstage/catalog/*.yaml` | Backstage catalog | `curl localhost:7007/api/catalog/entities`, TechDocs build | README.md (catalog section) | Backstage |
| `backstage/Dockerfile` | `make build-backstage` | `make health`, TechDocs build | docs/quickstart.md | Backstage |
| `score-service/src/*` | `make build-score-service` | `make api-test`, `make test` | docs/score-integration.md | Score Service |
| `score-service/Dockerfile` | `make build-score-service` | `make health` | — | Score Service |
| `plugin-manager/src/*` | `make build-plugin-manager` | `make test` | docs/quickstart.md | Plugin Manager |
| `plugin-manager/Dockerfile` | `make build-plugin-manager` | `make health` | — | Plugin Manager |
| `gateway/nginx.conf` | `docker compose restart gateway` | `make health`, gateway routing tests | ARCHITECTURE.md (routes) | Gateway |
| `gateway/api-docs/*.yaml` | Gateway contract validation | `make contract-test` | — | Gateway |
| `devcontainer/*` | `make coder-workspace` | Toolchain version checks | docs/coder-guide.md | Coder |
| `templates/*` | Cookiecutter scaffolding | Template validation tests | docs/golden-paths.md | None (host-side) |
| `Makefile` | All `make` targets | Full test suite | CONTRIBUTING.md (targets section) | All |
| `.pre-commit-config.yaml` | `pre-commit run --all-files`, CI lint stage | `pre-commit run --all-files` | CONTRIBUTING.md (local dev section) | None (host-side) |
| `.gitleaks.toml` | CI security stage (gitleaks) | `make security-scan` | SECURITY.md | None (host-side) |
| `scripts/*` | CI/script execution | Script-specific tests | docs/quickstart.md | Various |
| `tests/*` | CI test stages | `make test` | — | None (host-side) |

---

## Service Dependency Graph

```
Gateway (nginx:8000)
  ├── depends_on: Backstage, Score Service
  ├── routes to: Backstage:7007, Score:8081, Plugin Manager:8083, Coder:7080
  └── CONFLICT: changing gateway/nginx.conf affects all routed services

Backstage (:7007)
  ├── depends_on: PostgreSQL (external; provider TBD, #57)
  ├── reads: backstage/catalog/*.yaml
  └── CONFLICT: new catalog entity YAMLs need Backstage restart

Score Service (:8081/:8082)
  ├── depends_on: PostgreSQL (external; provider TBD, #57)
  ├── reads: score-service/config/*
  ├── writes: score-specs/ volume
  └── CONFLICT: DB schema changes affect all score-service clients

Plugin Manager (:8083)
  ├── reads: plugin-registry/ volume
  ├── writes: backstage-plugins/ volume
  └── CONFLICT: plugin install affects Backstage hot-reload

Coder (:7080)
  ├── depends_on: PostgreSQL (external; provider TBD, #57)
  ├── mounts: /var/run/docker.sock
  └── CONFLICT: CODER_ACCESS_URL must be set correctly for workspace URLs
```

---

## External Dependency Impact

| Dependency | Change | Impact on uFawkesDevX | Verification |
|---|---|---|---|
| **External Postgres** | Schema change, port change, or downtime | `coder`, `backstage`, `score-service` fail to start | `psql -h postgres -U backstage -c "SELECT 1"` |
| **uFawkesObs OTLP** (future) | Collector port or protocol change | Telemetry silently dropped; no metrics/logs/traces | `curl http://localhost:8888/metrics` |
| **uFawkesPipe** (future) | Webhook URL or payload change | Score Service pipeline triggers fail | `curl http://localhost:8081/api/v1/pipelines` |
| **Backstage upstream** (npm) | Breaking change in @backstage/* packages | Backstage build fails; catalog/templates break | `docker compose build backstage` |
| **Coder upstream** (ghcr.io) | Breaking change in `coder:2.34.3` | Workspace provisioning fails | `make coder-workspace && curl http://localhost:7080/healthz` |

---

## Add New Service Checklist

Before adding a new service to `compose.yaml`, verify:

- [ ] Healthcheck declared in `compose.yaml`
- [ ] Port mapped in `compose.override.yaml` (dev)
- [ ] Added to `gateway/nginx.conf` routing table
- [ ] Added to `gateway/api-docs/*.openapi.yaml` if exposing API
- [ ] Catalog entity added to `backstage/catalog/`
- [ ] OTLP emission configured (uFawkesObs collector endpoint)
- [ ] Added to `Makefile` health check targets
- [ ] README.md services table updated
- [ ] ARCHITECTURE.md component diagram updated
- [ ] `CHANGE_IMPACT_MAP.md` (this file) updated
- [ ] No `:latest` tag in image reference
- [ ] No secrets hardcoded; env vars via `.env`

---

## How This Connects

| Document | What It Answers |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Full component descriptions and data flows |
| [docs/KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) | Active issues that affect change impact |
| [SECURITY.md](../SECURITY.md) | Security implications of config changes |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to make changes safely |
