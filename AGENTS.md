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

Read in priority order. Planning docs define *what*; architecture/governance docs define *how*; the queue defines *now*.

| Priority | File | Why |
| --- | --- | --- |
| 1 | `VISION.md` | North star, core principles, non-goals, riskiest assumption (years) |
| 2 | `MILESTONES.md` | Horizon map (H1/H2/H3), milestone deliverables, release gates, traceability to vision (months) |
| 3 | `EXECUTION_QUEUE.md` | Priority tiers P0–P3, scope-drift protection, bottom-up feedback loop (weeks) |
| 4 | `plan-for-the-day.md` | Today's single goal, target issues, TDD execution protocol, retrospective (today) |
| 5 | `docs/product/discovery-draft.md` | JTBD statement, riskiest assumption, measurable acceptance criterion, test-type reasoning |
| 6 | `docs/product/spec.md` | Numbered functional requirements (FR-1.x … FR-8.x, NFR) traced to discovery draft |
| 7 | `ARCHITECTURE.md` | System architecture, components, data flows |
| 8 | `docs/CONTRACTS.md` | External integration surface: uFawkesRes Postgres, uFawkesObs OTLP, uFawkesPipe webhook, fawkes-net |
| 9 | `docs/CHANGE_IMPACT_MAP.md` | Co-change map: what breaks when configs change |
| 10 | `docs/KNOWN_LIMITATIONS.md` | Active known issues and workarounds |
| 11 | `DEPLOYMENT_STRATEGY.md` | Local Compose profiles, networking, secrets, health checks, rollback |
| 12 | `RELEASE_PROCESS.md` | Release checklist (tests → docs → changelog → tag → deploy+verify), rollback |
| 13 | `AI_STANCE.md` | AI tooling policy, agent guardrails, hard vs. soft rules |
| 14 | `docs/MODEL_POLICY.md` | Grade-based model routing (S/A/B/C/F); no hardcoded model names |
| 15 | `compose.yaml` | Service definitions, profiles, volumes, networks |
| 16 | `docker-compose.override.yml` | Dev overrides (ports, volumes, env) |
| 17 | `docs/PR_STANDARD.md` | PR naming and commit rules |
| 18 | `.github/workflows/` | CI/CD pipeline definitions |

## §3.1 Hard Rules vs. Docs (Never Delegate)

**Hard rules — never delegated to an agent's judgment; enforced by CI/branch protection:**

| Rule | Enforcement |
| --- | --- |
| No `:latest` tags in `compose.yaml` | CI gate |
| No `.env`/real secrets committed | gitleaks CI gate |
| No direct push to `main` | GitHub branch protection |
| PR titles follow Conventional Commits | CI gate |
| Don't modify reusable workflow contracts from `paruff/ufawkespipe` | CI validation |
| TDD commit order: test → implement → verify → commit | PR review checklist |

**Soft rules — lived in docs; agent may reason about but must document:**

| Rule | Source Doc |
| --- | --- |
| Adding a new service to `compose.yaml` | CHANGE_IMPACT_MAP.md + §5 Must Ask |
| Changing DB schema/seed data | §5 Must Ask + CHANGE_IMPACT_MAP.md |
| CI/CD pipeline structure changes | §5 Must Ask |
| Milestone scope changes | MILESTONES.md |
| New queue item | EXECUTION_QUEUE.md (scope-drift check against VISION non-goals) |

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
| --- | --- |
| **uFawkesDevX** | DevX — Backstage, Coder, Score, Plugin Manager |
| **uFawkesRes** | Deprecated — was the shared Postgres/Valkey resource plane (replacement TBD, #57) |
| **uFawkesObs** | Observability (Prometheus, Grafana, Loki, Tempo) |
| **fawkes** | Platform CLI, integration orchestration |
| **uFawkesPipe** | Reusable CI/CD workflow library |

## Design and brand

Fawkes and the uFawkes suite share one design reference, owned by
uFawkes.dev: [DESIGN.md](https://github.com/paruff/uFawkes.dev/blob/main/DESIGN.md) and the machine-readable tokens at
<https://ufawkes.dev/design/tokens.json>. Read it before changing colours, logos, fonts or UI copy in this
repo. Link to it; don't copy it here.

- Links, focus rings and secondary buttons are Indigo `#4f46e5`. The primary
  button is Flame `#f06300` with a Night `#061723` label (5.62:1).
- Orange (Flame) is for marks, large graphics and the primary button fill,
  never for text. Green means pass or live, never decoration.
- Text must meet 4.5:1 contrast. `#16a34a` on white is 3.30:1 and fails.
- If this repo needs a value the reference does not have, propose it in
  uFawkes.dev rather than adding a local one.
