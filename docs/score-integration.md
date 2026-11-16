# Score Service Integration (DX-003)

How `score-service` turns a Score workload spec into a running docker-compose
manifest and notifies uFawkesPipe that a workload changed.

## Flow

```text
client                score-service                  score-compose CLI      uFawkesPipe
  |  POST /api/v1/specs      |                               |                     |
  |-------------------------->|                               |                     |
  |                            | validate spec (ajv)          |                     |
  |                            | save to Postgres + SPECS_DIR |                     |
  |                            |------------------------------>|                     |
  |                            |   score-compose init (once)  |                     |
  |                            |   score-compose generate     |                     |
  |                            |<------------------------------|                     |
  |                            | compose.yaml written          |                     |
  |                            |-------------------------------------------------->  |
  |                            |   POST PIPELINE_WEBHOOK_URL  (fire-and-forget)      |
  |<---------------------------|                               |                     |
  |  201 { ...spec, composeGenerated }                          |                     |
```

- Spec validation and persistence (Postgres + `${SPECS_DIR}/<name>.yaml`) happen first and are the source of truth for the `201` response — a failure in the compose-generation or webhook steps below never rolls this back or blocks the response.
- `score-compose generate` failures are logged; the response still returns `201` with `composeGenerated: false`.
- The pipeline webhook call is non-blocking: an unreachable or misconfigured `PIPELINE_WEBHOOK_URL` only logs a warning (see `server.js`'s `triggerPipelineWebhook`).

## score-compose generation

For a spec named `my-workload`, generation runs in an isolated working
directory so `score-compose init`'s state (`.score-compose/`) doesn't collide
across workloads:

```text
${SPECS_DIR}/.compose-projects/my-workload/
├── .score-compose/        # written by `score-compose init` (once per workload)
└── compose.yaml           # written by `score-compose generate -o compose.yaml`
```

Example input Score spec (`POST /api/v1/specs` body):

```yaml
apiVersion: score.dev/v1b1
metadata:
  name: my-workload
containers:
  main:
    image: nginx:latest
service:
  ports:
    web:
      port: 80
      targetPort: 80
```

Example generated `compose.yaml` output (abridged):

```yaml
services:
  my-workload-main:
    image: nginx:latest
    ports:
      - "80:80"
```

## Pipeline webhook trigger

The trigger follows uFawkesPipe's
[pipeline-trigger contract](https://github.com/paruff/uFawkesPipe/blob/main/docs/pipeline-trigger-contract.md):
a Woodpecker "create pipeline" call. `PIPELINE_WEBHOOK_URL` is the full
`.../api/repos/<repo-id>/pipelines` URL, `PIPELINE_WEBHOOK_TOKEN` a Woodpecker API
token (sent as a bearer token) and `PIPELINE_BRANCH` the branch to run.

Request sent by `triggerPipelineWebhook`:

```json
{
  "branch": "main",
  "variables": {
    "SCORE_WORKLOAD": "my-workload",
    "SCORE_ACTION": "spec-updated",
    "SCORE_METADATA": "{\"version\":3}",
    "SCORE_TIMESTAMP": "2026-08-14T12:00:00.000Z"
  }
}
```

The call has not been run against a live Woodpecker server from this repo; the
unit tests check the request shape.

If `PIPELINE_WEBHOOK_URL` is unset, this step is skipped entirely (logged as
a warning) and spec creation still succeeds.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `composeGenerated: false` in the API response | `score-compose` binary missing or spec invalid for generation | Check `score-service` container logs for the `score-compose generate failed for <name>` error |
| `Pipeline webhook unreachable` warning in logs | `PIPELINE_WEBHOOK_URL` unset, unreachable, or the token or repo id is wrong (Woodpecker answers 401/404 and a `Pipeline webhook responded with status` warning is logged) | Check the URL and token against the pipeline-trigger contract — spec creation is unaffected |
| `score-compose: command not found` at build time | Dockerfile's `TARGETARCH` build arg didn't resolve | Ensure you're building with BuildKit enabled (default in recent Docker) |
