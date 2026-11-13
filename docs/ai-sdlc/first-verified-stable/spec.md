# Spec: uFawkesDevX first verified stable release

**Traces to:** [`intent.md`](intent.md) | **Plan:** [`plan.md`](plan.md)

## Acceptance Criteria

- **AC-DEVX-01** (suite): an ADR records the paruff/uFawkesDevX#57 decision,
  and `make up` brings up Coder and Backstage against storage defined inside
  the documented setup. The text and its verification are in the
  [suite spec](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/spec.md#release-5--ufawkesdevx-first-verified-stable-1x).

## Design

The stack runs no separate database service
([ADR-0001](../../adr/0001-no-separate-database-service.md)). Nothing else
about the architecture changes in this release.

## Interfaces

The full inventory, with the internal contracts between Backstage, the Score
service and the Plugin Manager, is [`docs/CONTRACTS.md`](../../CONTRACTS.md).
These are uFawkesDevX's rows in the suite's [cross-repo interface contracts](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/spec.md#cross-repo-interface-contracts):

| Contract | Role | Defined in |
| --- | --- | --- |
| Release tags | Provides, to uFawkesDojo (White Belt labs pin a tag) | GitHub Releases |
| Reusable workflows (`reusable-main-ci-guard`, `-preflight`, `-lint`, `-security-scanning`, `-dependency-review`, `-build`, `-tests`) | Consumes, from uFawkesPipe. This repo must not change their contracts | uFawkesPipe `README.md` |
| `.fawkespipe.yml` pipeline contract, in the golden-path templates | Consumes, from uFawkesPipe | uFawkesPipe `docs/pipeline-contract.md` |
| Pipeline trigger from the Score service (`PIPELINE_WEBHOOK_URL`) | Consumes, from uFawkesPipe | **Not defined** by uFawkesPipe (paruff/uFawkesPipe#217). The URL and payload are provisional, the variable is unset by default, and this release doesn't claim the trigger works |
| `ufawkes-ci` CI job image and `fawkes-space` devcontainer image | Consumes, from uFawkesPipe and uFawkesAI | Pinned by digest |

## Pipeline invariants

The [suite pipeline invariants](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/suite-release/spec.md#pipeline-invariants) apply here unchanged. This repo adds:

- `live-acceptance.yml` runs `make up` on a fresh Linux runner on every release.
- A change to `compose.yaml` service structure or CI/CD structure needs a maintainer's OK first (`AGENTS.md` §5).
- A setup step is described only after it has been run against the documented prerequisites (`INTENT.md`).
