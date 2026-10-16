# INTENT — Read This Before Touching Anything

**uFawkesDevX** is the Developer Experience plane of the uFawkes suite. It's a
Docker Compose stack that gives developers:
- a cloud IDE workspace (Coder);
- a service catalog and scaffolding UI (Backstage);
- workload-spec validation that triggers uFawkesPipe (Score service);
- platform plugins (Plugin Manager), behind a single gateway;
- golden-path Cookiecutter templates.

## The one thing to know

**This stack runs no separate database service.** `score-service` and
Backstage use SQLite on named volumes; Coder uses its built-in Postgres
(see [ADR-0001](docs/adr/0001-no-separate-database-service.md)). The old
shared provider, uFawkesRes, is archived and is not needed.

## Where this sits in the suite

| Plane | Repo |
| --- | --- |
| Developer experience | **uFawkesDevX** (this repo) |
| CI/CD + security (Woodpecker; merged uFawkesSec) | uFawkesPipe |
| Observability | uFawkesObs |
| Learning | uFawkesDojo (White Belt targets this stack) |
| Kubernetes graduation track | fawkes |

The suite release plan is at
[uFawkes.dev `docs/ai-sdlc/suite-release/`](https://github.com/paruff/uFawkes.dev/tree/main/docs/ai-sdlc/suite-release).
This repo's first release, `v0.1.0`, is Phase 5 of that plan. It's gated on
AC-DEVX-01: running without uFawkesRes.

## What "done" means here

- **Planning follows the uFawkesAI artifact chain:**
  `docs/ai-sdlc/<feature>/intent.md` → `spec.md` (requirements and design) →
  `plan.md`. The pre-convention `specification.md`, `design.md`, and `plan.md` now live in
  `docs/ai-sdlc/v0.1.0/`.
- **A setup step is described only after it has been run for real** against
  the documented prerequisites.
- **Work goes through PRs.** Changes to `compose.yaml` service structure or
  CI/CD structure need a maintainer's OK first (`AGENTS.md` §5).

## Explicit non-goals

- **Kubernetes deployment.** That's the fawkes track.
- **Owning CI/CD or security scanning.** That's uFawkesPipe; this repo
  consumes its reusable workflows and must not modify their contracts.
