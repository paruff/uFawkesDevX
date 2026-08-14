# {{ cookiecutter.project_name }}

Golden-path Express app scaffolded from `templates/node-express-app`.

## Develop

Open in Coder (see `docs/coder-guide.md` in the platform repo) — the
`.devcontainer/devcontainer.json` pulls in Node.js 20 automatically.

```bash
npm install
npm start
```

## Test

```bash
npm test
```

## Deploy

- `score.yaml` — Score workload spec (`score.dev/v1b1`).
- `.fawkespipe.yml` — uFawkesPipe build/test/deploy contract.
- `Dockerfile` — container build for local use.
