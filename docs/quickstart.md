# Quickstart (DX-008)

## 0. Prerequisites

No database service is needed (#57): `score-service` and Backstage keep
SQLite files on Docker volumes, and Coder runs its built-in Postgres. Back up by
copying the `developerd-score-data`, `developerd-backstage-data` and
`developerd-coder-home` volumes.

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
- **Backstage or Score can't write their database** — check the
  `developerd-backstage-data` / `developerd-score-data` volumes are mounted and
  writable by the container user.
- **Coder can't reach the Docker socket** — `DOCKER_GID` is wrong. Re-run
  `make check-gid` and update `.env`.
