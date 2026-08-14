# Quickstart (DX-008)

## 0. Prerequisites

[uFawkesRes](https://github.com/paruff/uFawkesRes) must already be running
on the shared `fawkes-net` network. Create the `coder` and `backstage`
databases in its Postgres instance before running `make up`:

```sql
CREATE DATABASE coder;
CREATE USER coder WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE coder TO coder;

CREATE DATABASE backstage;
CREATE USER backstage WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE backstage TO backstage;
```

Set matching values in `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
`BACKSTAGE_DB_PASSWORD`, `CODER_DB_PASSWORD`).

## 1. Find your Docker GID

Coder needs your host's `docker.sock` group ID to manage workspace
containers:

```bash
make check-gid
```

Copy the printed value into `DOCKER_GID` in `.env`.

## 2. Set `CODER_ACCESS_URL`

`CODER_ACCESS_URL` must be a LAN-reachable address, **not** `localhost` —
workspace agents run in separate containers and need to dial back to the
Coder server. `localhost` inside a workspace container resolves to itself,
not the host, so workspaces get stuck at "Connecting...".

Find your LAN IP:

```bash
# Linux
ip route get 1 | awk '{print $7; exit}'

# macOS
ipconfig getifaddr en0
```

Set `CODER_ACCESS_URL=http://<that-ip>:7080` in `.env`.

## 3. Build and start

```bash
make build && make up
```

## 4. Coder first-run

1. Navigate to `CODER_ACCESS_URL` in a browser and create the admin user.
2. Push the devcontainer workspace template:

   ```bash
   make coder-push-template
   ```

See [docs/coder-guide.md](coder-guide.md) for workspace creation and connect
steps.

## 5. Smoke test checklist

- [ ] `make status` shows all 5 services running
- [ ] `make health` reports healthy for `coder`, `backstage`, `score-service`, `plugin-manager`, `gateway`
- [ ] Coder UI loads at `CODER_ACCESS_URL` and admin login succeeds
- [ ] Backstage UI loads at `http://localhost:7007` and the catalog lists all 5 uFawkes planes
- [ ] `make coder-push-template` succeeds
- [ ] A workspace created from the template reaches "Running" and connects
- [ ] `make api-test` gets a successful response from the Score API through the gateway
- [ ] `cookiecutter templates/python-flask-app` scaffolds a project with a valid `score.yaml`

## Troubleshooting

- **Coder stuck on "Connecting..."** — `CODER_ACCESS_URL` is probably set to
  `localhost`. Re-check step 2.
- **Backstage crash-loops on startup** — the `backstage` database likely
  doesn't exist yet in uFawkesRes Postgres. Re-check step 0.
- **Coder can't reach the Docker socket** — `DOCKER_GID` is wrong. Re-run
  `make check-gid` and update `.env`.
