# Golden Path Templates (DX-006)

Cookiecutter templates that scaffold a new service pre-wired for this
platform: a pinned devcontainer (Coder-ready), a Score workload spec, and a
`.fawkespipe.yml` CI/CD contract.

| Template | Language | Framework |
|---|---|---|
| `templates/python-flask-app` | Python 3.12 | Flask |
| `templates/java-spring-app` | Java 21 | Spring Boot |
| `templates/node-express-app` | Node.js 20 | Express |
| `templates/go-http-app` | Go 1.22 | net/http |

## Scaffold a new project

```bash
pip install cookiecutter
cookiecutter templates/python-flask-app
```

You'll be prompted for `project_name`, `project_slug`, `language`, and
`registry_namespace`. The rendered project includes:

- `.devcontainer/devcontainer.json` — pinned base image matching
  `devcontainer/base-<lang>.json` (see `docs/coder-guide.md`).
- `score.yaml` — `score.dev/v1b1` workload spec.
- `.fawkespipe.yml` — uFawkesPipe build/test/deploy contract.
- `Dockerfile`, `README.md`, `src/`, `tests/`.

## Open in Coder

1. Push the rendered project to a Git repo.
2. Follow `docs/coder-guide.md` to create a workspace pointed at that repo —
   the `.devcontainer/devcontainer.json` is picked up automatically.

## Add a new template language

1. Add a pinned base devcontainer at `devcontainer/base-<lang>.json` (DX-004)
   if one doesn't already exist.
2. Create `templates/<lang>-<framework>-app/cookiecutter.json` with
   `project_name`, `project_slug`, `language`, `registry_namespace`.
3. Add a `{{cookiecutter.project_slug}}/` subtree matching the structure
   above, with the `.devcontainer/devcontainer.json` `image` field exactly
   matching the new `base-<lang>.json`.
4. Register the mapping in `TEMPLATE_TO_BASE` in
   `tests/unit/test_devcontainer.py` and run the full `tests/unit/` suite.
