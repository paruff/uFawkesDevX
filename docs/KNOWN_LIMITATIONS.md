# Known Limitations — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Last Updated:** 2026-09-14

---

## Active Known Issues

### Stack & Infrastructure

| ID | Limitation | Impact | Workaround | Target Fix |
|---|---|---|---|---|
| KL-1 | **PostgreSQL is external** (uFawkesRes is deprecated; replacement TBD, #57) — `coder`, `backstage`, and `score-service` connect to the shared Postgres at `postgres:5432` on `fawkes-net` | Cannot run uFawkesDevX standalone without an external Postgres running first | Provide a Postgres reachable as `postgres:5432` on `fawkes-net`, then run `make up` | H2: embedded SQLite fallback for `score-service` dev mode (M2.x) |
| KL-2 | **`CODER_ACCESS_URL` must not be localhost** — Coder uses the access URL to build workspace URLs; if it's `localhost`, Coder workspace apps (VS Code) can't be reached from the browser on the same host | Workspace URLs don't resolve; developer can't open workspace | Set `CODER_ACCESS_URL` to LAN IP (e.g. `http://192.168.1.x:7080`) in `.env` | H2: mDNS/local TLS to make `localhost` work |
| KL-3 | **No TLS/SSL** — All services expose plain HTTP | Not suitable for shared network; credentials visible in transit | Acceptable for single-developer localhost; don't expose ports to LAN | H3: self-signed cert generation in `make tls-init` |
| KL-4 | **CORS wildcard (`*`) on all services** — Gateway and all services allow any origin | Cross-origin requests from any page succeed; could be exploited if ports exposed to LAN | Acceptable for localhost dev; no public exposure | H3: configure CORS to `localhost:<port>` per service |
| KL-5 | **Docker socket mounted in Coder and Plugin Manager** — `/var/run/docker.sock` gives root-level host access | Containers can escape to host; plugin manager could destroy host containers | Document the risk; only mount for local dev; production: remove socket mount | H3: replace with Docker-in-Docker or Kubernetes API |

### Backstage

| ID | Limitation | Impact | Workaround | Target Fix |
|---|---|---|---|---|
| KL-6 | **Backstage catalog entities not auto-discovered** — Services must be manually added to `backstage/catalog/` as YAML files | New services don't appear in catalog without manual step | Add `catalog-info.yaml` to each service directory | H2: score-service emits catalog entity on startup via Backstage API |
| KL-7 | **Backstage TechDocs uses local filesystem** — Docs built with `mkdocs` stored in volume, no multi-developer sync | Each Coder workspace has its own TechDocs; changes don't propagate | Use the Backstage UI directly for docs viewing | H2: shared TechDocs volume or Git-backed docs |
| KL-8 | **No Backstage auth provider** — Local guest auth only; no GitHub/OIDC | Anyone on `localhost:7007` can access; no audit trail | Acceptable for single-developer localhost | H3: GitHub OAuth or OIDC when LAN-shared |

### Score Service

| ID | Limitation | Impact | Workaround | Target Fix |
|---|---|---|---|---|
| KL-9 | **Score spec validation is schema-only** — No semantic validation (e.g. "does this image exist?", "is this port already in use?") | Invalid specs pass validation but fail at deploy time | Run `score validate` AND `score render` to catch semantic issues | H2: add semantic validation rules (M1.4) |
| KL-10 | **No spec versioning** — `PUT /score/:id` overwrites; no history or rollback | Accidentally overwriting a spec requires manual re-creation | Back up `score-specs/` volume before edits | P3: git-backed spec store (P3-3) |

### CI/CD

| ID | Limitation | Impact | Workaround | Target Fix |
|---|---|---|---|---|
| KL-11 | **CI pipeline blocks on gitleaks false positive** — Test fixtures trigger secret detection | Security stage fails on clean code; blocks all merges | Whitelist specific patterns in `.gitleaks.toml` (temporary) | P0: fix CI (P0-1) |
| KL-12 | **No automated release** — Manual `git tag` + `gh release create` | Releases are error-prone; changelog not auto-generated | Follow `docs/release-process.md` checklist | H3: `release-please` (M3.3) |

### Cross-Cutting

| ID | Limitation | Impact | Workaround | Target Fix |
|---|---|---|---|---|
| KL-13 | **Single-developer only** — No multi-user concurrency | Can't run in shared dev environment; port conflicts | Each developer runs their own stack on different ports | Fawkes track (Kubernetes) |
| KL-14 | **No RBAC** — Backstage has no role-based access control | Any user can see/edit everything | Acceptable for localhost | Fawkes track: Backstage permission framework |
| KL-15 | **No observability dashboards yet** — OTLP emission not wired (M1.6) | Can't see service health, latency, or errors in Grafana | `docker compose logs` for debugging | H1: M1.6 OTLP emission; H2: M2.5 dashboards |

---

## Resolved Limitations

| ID | Limitation | Resolution | Date |
|---|---|---|---|
| ~~KL-R1~~ | ~~Eclipse Che was the cloud IDE~~ | Replaced by Coder (v0.2) | 2026-08-14 |
| ~~KL-R2~~ | ~~No Docker Compose profiles~~ | Added `core`, `apps`, `notifications` profiles | 2026-07-04 |

---

## How This Connects

| Document | What It Answers |
|---|---|
| [VISION.md](../VISION.md) | Non-goals that explain why some limitations are accepted |
| [MILESTONES.md](../MILESTONES.md) | Milestones that resolve these limitations |
| [CHANGE_IMPACT_MAP.md](CHANGE_IMPACT_MAP.md) | What breaks when limitations are addressed |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Technical context for these limitations |
