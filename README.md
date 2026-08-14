# uFawkesDevX — Developer Experience Plane

uFawkesDevX is the Developer Experience plane of the Fawkes internal
developer platform: Coder provisions cloud IDE workspaces, Backstage
catalogs and scaffolds services, the Score service validates workload specs
and triggers uFawkesPipe, and golden-path Cookiecutter templates give
developers a pre-wired starting point in one command.

## Architecture

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
```

## Services

| Service | Port | Role |
| --- | --- | --- |
| Coder | 7080 | Cloud IDE — provisions ephemeral devcontainer workspaces |
| Backstage | 7007 | Service catalog and scaffolding UI |
| Score service | 8081 (API), 8082 (webhooks) | Validates Score workload specs, triggers uFawkesPipe |
| Plugin Manager | 8083 | Manages platform extensions and plugins |
| Gateway | 8000 | Unified entry point — `/api/score`, `/api/plugins` |

Postgres is **not** run in this repo — `coder` and `backstage` connect to the
shared Postgres instance owned by [uFawkesRes](https://github.com/paruff/uFawkesRes).

## Quick start

```bash
make check-gid   # find your Docker socket GID, set DOCKER_GID in .env
make network
make build && make up
```

See [docs/quickstart.md](docs/quickstart.md) for the full setup walkthrough,
including database prerequisites and first-run steps.

## Coder cloud IDE

Coder provisions per-developer devcontainer workspaces on the host Docker
daemon — open a workspace and you're in a container built from your
project's `.devcontainer/devcontainer.json`, no local toolchain setup
required. See [docs/coder-guide.md](docs/coder-guide.md).

## Golden paths

Cookiecutter templates that scaffold a new service pre-wired for this
platform: a pinned devcontainer, a Score workload spec, and a
`.fawkespipe.yml` CI/CD contract. See [docs/golden-paths.md](docs/golden-paths.md).

## Score integration

Score workload specs (`score.yaml`) describe a service declaratively; the
Score service validates them and triggers uFawkesPipe builds. See
[docs/score-integration.md](docs/score-integration.md).

## Eclipse Che

Eclipse Che has been removed from this platform and replaced by Coder.

## License

See [LICENSE](LICENSE).
