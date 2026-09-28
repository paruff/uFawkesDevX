# INTENT — Read This Before Touching Anything

**uFawkesDevX** is the Developer Experience plane of the uFawkes suite. It's a
Docker Compose stack that gives developers:
- a cloud IDE workspace (Coder);
- a service catalog and scaffolding UI (Backstage);
- workload-spec validation that triggers uFawkesPipe (Score service);
- platform plugins (Plugin Manager), behind a single gateway;
- golden-path Cookiecutter templates.

## The one thing to know

**This stack does not run its own database, and its old database provider is
gone.** Coder, Backstage, and the Score service connect to an external
Postgres at `postgres:5432` on the `fawkes-net` network (see `compose.yaml`).
That used to be uFawkesRes, which is **deprecated**. What replaces it is
undecided (#57, suite plan AC-DEVX-01). Until that's settled, `make up` works
only if you supply that Postgres yourself. The quickstart also doesn't yet
create the `score` database that `score-service` connects to.

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
This repo's first release, `v0.1.0`, is Phase 3 of that plan. It's gated on
AC-DEVX-01: running without uFawkesRes.

## What "done" means here

- **Planning follows the uFawkesAI artifact chain:**
  `docs/ai-sdlc/<feature>/intent.md` → `spec.md` (requirements and design) →
  `plan.md`. The root `specification.md`, `design.md`, and `plan.md` are
  pre-convention; they move into `docs/ai-sdlc/v0.1.0/` in Phase 3.
- **A setup step is described only after it has been run for real** against
  the documented prerequisites.
- **Work goes through PRs.** Changes to `compose.yaml` service structure or
  CI/CD structure need a maintainer's OK first (`AGENTS.md` §5).

## Explicit non-goals

- **Kubernetes deployment.** That's the fawkes track.
- **Owning CI/CD or security scanning.** That's uFawkesPipe; this repo
  consumes its reusable workflows and must not modify their contracts.
