# {{ cookiecutter.project_name }}

Golden-path Flask app scaffolded from `templates/python-flask-app`.

## Develop

Open in Coder (see `docs/coder-guide.md` in the platform repo) — the
`.devcontainer/devcontainer.json` pulls in Python 3.12 automatically.

```bash
pip install -r requirements.txt
python src/app.py
```

## Test

```bash
pytest
```

## Deploy

- `score.yaml` — Score workload spec (`score.dev/v1b1`).
- `.fawkespipe.yml` — uFawkesPipe build/test/deploy contract.
- `Dockerfile` — container build for local use.
