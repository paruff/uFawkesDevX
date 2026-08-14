# Coder Guide (DX-004)

How to push the `devcontainer-docker` workspace template and create your
first Coder-backed devcontainer workspace.

## Prerequisites

- `make up` running (Coder reachable at `CODER_ACCESS_URL`, see `.env.example`).
- A human has reviewed and resolved every `# VERIFY` comment in
  `coder/templates/devcontainer-docker/main.tf` against the live provider docs
  (see that directory's `README.md`).
- `coder` CLI installed locally and logged in: `coder login $CODER_ACCESS_URL`.

## First-run setup

1. Push the template:

   ```bash
   make coder-push-template
   ```

2. Create a workspace, providing a Git repo that contains a
   `.devcontainer/devcontainer.json` (see `devcontainer/base-*.json` in this
   repo for reference base definitions — Python, Java, Node.js, Go):

   ```bash
   coder create --template devcontainer-docker my-workspace
   ```

3. Connect:
   - **Browser**: open the workspace from the Coder dashboard at
     `CODER_ACCESS_URL` and launch the web IDE.
   - **VS Code SSH**: `coder config-ssh`, then connect VS Code's Remote-SSH
     extension to `coder.my-workspace`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Workspace agent never connects | `CODER_ACCESS_URL` set to `localhost` | Set it to a LAN-reachable address in `.env` (see DX-002) |
| `coder templates push` fails on provider resolution | A `# VERIFY` field in `main.tf` doesn't match the installed provider version | Check the version pinned against https://registry.terraform.io/providers/coder/coder/latest/docs |
| Devcontainer never builds inside the workspace | Repo's `.devcontainer/devcontainer.json` missing or invalid | Validate against `devcontainer/base-*.json` in this repo, or `tests/unit/test_devcontainer.py` |
