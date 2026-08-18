# AGENTS — uFawkesDevX

## §1 Identity

uFawkesDevX = Developer Experience plane of the Fawkes IDP family.
It provides Backstage, Score service, Eclipse Che, Plugin Manager, and the gateway that ties them together — all running locally via Docker Compose.

## §2 Where the Agents Live

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub                                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ PR       │  │ CI       │  │ Security  │  │ Reusable         │  │
│  │ Gate     │  │ Pipeline │  │ Scanning  │  │ Workflows        │  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘  │
│        │              │              │               │             │
│        ▼              ▼              ▼               ▼             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Repository (main)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## §3 Context Files

| File | Why |
|---|---|
| `compose.yaml` | Service definitions, profiles, volumes, networks |
| `docker-compose.override.yml` | Dev overrides (ports, volumes, env) |
| `ARCHITECTURE.md` | System architecture, components, data flows |
| `docs/ARCHITECTURE.md` | (future) dedicated docs architecture |
| `docs/KNOWN_LIMITATIONS.md` | Active known issues |
| `docs/CHANGE_IMPACT_MAP.md` | Co-change map |
| `docs/PR_STANDARD.md` | PR naming and commit rules |
| `.github/workflows/` | CI/CD pipeline definitions |

## §4 Architecture Rules

### Compose Rules

- No `:latest` tags in `compose.yaml` (CI gate enforces this).
- Services must declare healthchecks.
- Named volumes for persistent data.
- Profiles separate core observability from app services.
- `.env` is gitignored; `.env.example` is the source of truth.

### Scripts Rules

- Shell scripts in `scripts/` pass `shellcheck` and `shfmt`.
- Pre-commit config is the local gate; CI runs the same checks.
- All scripts are idempotent.
- Never swallow an exception in a check/validator without logging what broke — a bare catch-and-continue makes a check that never ran look identical to one that ran and found nothing.

## §5 PM-Agent Contract

### May Do

- Create branches prefixed with `feat/`, `fix/`, `chore/`, `docs/`.
- Edit workflow files to add DORA observability timestamps.
- Create/edit `AGENTS.md`, `docs/PR_STANDARD.md`.
- Run pre-commit, lint, format checks locally.
- Propose architecture changes via spec/design/tasks workflow.

### Must Ask

- Before modifying `compose.yaml` service structure.
- Before changing database schema or seed data.
- Before pushing to `main` (all work goes through PRs).
- Before modifying CI/CD pipeline structure (stages, gates).

### Must Never

1. Use `:latest` tags in `compose.yaml`.
2. Commit `.env` files or real secrets.
3. Bypass CI gates without documented emergency procedure.
4. Push/merge directly to `main`.
5. Modify reusable workflow contracts (inputs/outputs) from `paruff/ufawkespipe`.

## §6 TDD Commit Order

1. Write failing test
2. Write implementation
3. Verify test passes
4. Commit (conventional commit message)
5. Push and open PR

## §7 AI-Assisted Review Block

Before merging any AI-assisted PR:
- [ ] All CI stages pass (preflight → lint → security → build → tests).
- [ ] No secrets committed (gitleaks clean).
- [ ] No `:latest` tags in compose files.
- [ ] PR title follows Conventional Commits format.
- [ ] Branch is up to date with `main`.
- [ ] Architecture change impact assessed (CHANGE_IMPACT_MAP.md).

## §8 GitOps / Trunk-Based Delivery Contract

### Branch & PR Discipline

- All work on feature branches off `main` (trunk-based, short-lived).
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Every branch opens a PR through CI gates before merge.
- PR titles follow Conventional Commits: `type(scope): description`.
- Squash-merge to `main` with a clean commit message.

### Deployment Lifecycle Gates

- `main-ci-guard.yml` enforces CI pass before merge.
- Every job emits `job-start` / `job-finish` timestamps for DORA observability.
- Pipeline result logged as `pipeline-result: success|failure`.

## §9 Known Limitations

See `docs/KNOWN_LIMITATIONS.md`.

## §10 Suite Integration

uFawkesDevX is the Developer Experience plane of the Fawkes IDP suite:

| Repository | Role |
|---|---|
| **uFawkesDevX** | DevX — Backstage, Score, Che, Plugin Manager |
| **uFawkesRes** | Resource management and provisioning |
| **uFawkesObs** | Observability (Prometheus, Grafana, Loki, Tempo) |
| **fawkes** | Platform CLI, integration orchestration |
| **uFawkesPipe** | Reusable CI/CD workflow library |
