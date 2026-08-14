# {{ cookiecutter.project_name }}

Golden-path Spring Boot app scaffolded from `templates/java-spring-app`.

## Develop

Open in Coder (see `docs/coder-guide.md` in the platform repo) — the
`.devcontainer/devcontainer.json` pulls in Java 21 automatically.

```bash
mvn spring-boot:run
```

## Test

```bash
mvn test
```

## Deploy

- `score.yaml` — Score workload spec (`score.dev/v1b1`).
- `.fawkespipe.yml` — uFawkesPipe build/test/deploy contract.
- `Dockerfile` — container build for local use.
