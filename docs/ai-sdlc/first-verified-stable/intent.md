# Intent: uFawkesDevX first verified stable release

**Traces to:** the suite release plan,
[Phase 5](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/plan.md#phase-5--devx-stable--dojo-05-gate-ac-devx-01).

**Who:** a developer who wants a cloud IDE workspace, a service catalog and
golden-path templates on one Docker host.

**Job:** run `make up` from the README on a clean host and get a working
stack, with no outside database.

**Why now:** Release Please has published stable 1.x tags, but none has been
verified. Public pages call uFawkesDevX unverified until one passes AC-DEVX-01.

**Outcome:** the first 1.x tag with a clean-host transcript. This folder is
renamed to that version when it is known.

## Non-goals

Kubernetes deployment (the fawkes track), and owning CI/CD or security
scanning (uFawkesPipe). The June plan for a `v0.1.0` beta is kept in
[`../v0.1.0/`](../v0.1.0/) as history; it was dropped on 2026-10-17.
