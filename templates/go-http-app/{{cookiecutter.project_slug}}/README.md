# {{ cookiecutter.project_name }}

Golden-path Go net/http app scaffolded from `templates/go-http-app`.

## Develop

Open in Coder (see `docs/coder-guide.md` in the platform repo) — the
`.devcontainer/devcontainer.json` pulls in Go 1.22 automatically.

```bash
go run ./src
```

## Test

```bash
go test ./...
```

## Deploy

- `score.yaml` — Score workload spec (`score.dev/v1b1`).
- `.fawkespipe.yml` — uFawkesPipe build/test/deploy contract.
- `Dockerfile` — container build for local use.
