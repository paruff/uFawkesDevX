# Plan: the Score service calls uFawkesPipe's pipeline-trigger contract

**Traces to:** AC-DEVX-01, uFawkesPipe#217, paruff/uFawkes.dev#230 | **Status:** In review

uFawkesPipe defines the trigger as Woodpecker's create-pipeline call
(`docs/pipeline-trigger-contract.md` there). The Score service stops sending its
provisional body and sends that request.

| Step | What                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| S1   | `triggerPipelineWebhook` sends `{branch, variables}` with a bearer token; variables are strings               |
| S2   | `PIPELINE_WEBHOOK_TOKEN` and `PIPELINE_BRANCH` join `.env.example` and `compose.yaml`                          |
| S3   | `docs/score-integration.md`, `docs/CONTRACTS.md` C3 and the release spec's contract row describe the new call |

## Verification Strategy

| Check                                                  | How                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| The request has the contract's shape                   | `npm test` in `score-service/`: URL, bearer header, `branch`, string-only `variables` |
| An unset URL or an unreachable target does not block   | The two existing `triggerPipelineWebhook` tests in the same suite                     |
| No credential-shaped code                              | `bash scripts/check-secret-detection.sh` exits 0                                      |
| Not covered yet                                        | A real run against a live Woodpecker server                                           |
