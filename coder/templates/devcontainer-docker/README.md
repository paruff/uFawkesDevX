# devcontainer-docker

Coder workspace template that provisions a Docker-backed devcontainer
workspace: cloning a Git repository, running its `.devcontainer/devcontainer.json`
via the Devcontainers CLI, and exposing it as a Coder workspace.

`main.tf` is an **outline for human review**, not a ready-to-apply template —
every `# VERIFY` comment marks a field or provider version that must be
checked against the live docs before use:

- https://registry.terraform.io/providers/coder/coder/latest/docs
- https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs
- https://registry.coder.com/modules/coder/devcontainers-cli
- https://registry.coder.com/modules/coder/git-clone

## Prerequisites

- Coder running (`make up`, see DX-002's `compose.yaml`) with `CODER_ACCESS_URL`
  set to a LAN-reachable address, not `localhost` (see `.env.example`).
- Docker socket reachable by the Coder container (`DOCKER_GID` set, see
  `make check-gid`).

## Pushing the template

Once a human has verified the `# VERIFY` items above:

```bash
make coder-push-template
```

This runs `coder templates push devcontainer-docker` from this directory.

## Creating a workspace

After the template is pushed, create a workspace via the Coder dashboard or:

```bash
coder create --template devcontainer-docker my-workspace
```

You'll be prompted for `repo_url` — a Git repository containing a
`.devcontainer/devcontainer.json` (see `devcontainer/base-*.json` in this repo
for reference base definitions).
