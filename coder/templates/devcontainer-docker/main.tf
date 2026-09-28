# MIT License
#
# Copyright (c) 2026 Phil Ruff
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# DX-004 outline — for human review before `coder templates push`.
# Do NOT run `terraform validate` or push this until a human has verified
# every block below against the live provider docs:
#   https://registry.terraform.io/providers/coder/coder/latest/docs
#   https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs
#
# Modeled on Coder's own official Docker-backed devcontainer example
# (coder/coder repo, examples/templates/docker-devcontainer/main.tf), which
# uses the modern `coder_devcontainer` resource (Coder v2.21+ — we pin
# ghcr.io/coder/coder:2.34.3 in compose.yaml, see DX-002) rather than the
# older envbuilder-image approach. # VERIFY this is still the recommended
# pattern for the Coder version in use.

terraform {
  required_version = ">= 1.4"
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 2.18"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.6"
    }
  }
}

variable "docker_socket" {
  default     = ""
  description = "(Optional) Docker socket URI"
  type        = string
}

# The repo to clone into the workspace; must contain a .devcontainer/devcontainer.json
# (see devcontainer/base-*.json for the base definitions this repo maintains).
data "coder_parameter" "repo_url" {
  type         = "string"
  name         = "repo_url"
  display_name = "Git Repository"
  description  = "Git repository containing a .devcontainer/devcontainer.json"
  mutable      = true
}

provider "docker" {
  host = var.docker_socket != "" ? var.docker_socket : null
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# VERIFY: coder_agent fields (arch, os, startup_script, env, metadata) against
# https://registry.terraform.io/providers/coder/coder/latest/docs/resources/agent
resource "coder_agent" "main" {
  arch = data.coder_provisioner.me.arch
  os   = "linux"

  env = {
    GIT_AUTHOR_NAME     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL    = data.coder_workspace_owner.me.email
    GIT_COMMITTER_NAME  = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL = data.coder_workspace_owner.me.email
  }
}

# VERIFY module version pins — see https://registry.coder.com/modules/coder/devcontainers-cli
module "devcontainers_cli" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/devcontainers-cli/coder"
  agent_id = coder_agent.main.id
  version  = "~> 1.0" # VERIFY latest non-breaking version
}

# VERIFY module version pins — see https://registry.coder.com/modules/coder/git-clone
module "git_clone" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/git-clone/coder"
  agent_id = coder_agent.main.id
  url      = data.coder_parameter.repo_url.value
  base_dir = "~"
  version  = "~> 2.0" # VERIFY latest non-breaking version
}

# VERIFY: coder_devcontainer resource requires agent_id + workspace_folder,
# optional config_path — see
# https://registry.terraform.io/providers/coder/coder/latest/docs/resources/devcontainer
resource "coder_devcontainer" "repo" {
  count            = data.coder_workspace.me.start_count
  agent_id         = coder_agent.main.id
  workspace_folder = "~/${module.git_clone[0].folder_name}"
}

# VERIFY: docker_volume fields — see
# https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs/resources/volume
resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
  lifecycle {
    ignore_changes = all
  }
}

resource "docker_volume" "docker_volume" {
  name = "coder-${data.coder_workspace.me.id}-docker"
  lifecycle {
    ignore_changes = all
  }
}

# VERIFY: docker_container fields (privileged, host, volumes) — see
# https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs/resources/container
#
# `privileged = true` is required for Docker-in-Docker inside the workspace
# container. Mounting the host Docker socket instead is discouraged because
# workspaces would then compete for control of devcontainers — see
# https://coder.com/docs/admin/templates/extending-templates/docker-in-workspaces
resource "docker_container" "workspace" {
  count      = data.coder_workspace.me.start_count
  image      = "codercom/enterprise-node:ubuntu" # VERIFY base workspace image
  privileged = true
  name       = "coder-${data.coder_workspace_owner.me.name}-${lower(data.coder_workspace.me.name)}"
  hostname   = data.coder_workspace.me.name

  # Use the docker gateway if CODER_ACCESS_URL resolves to 127.0.0.1/localhost
  # from inside the container. See .env.example: CODER_ACCESS_URL must be a
  # LAN-reachable address for workspace agents to connect (DX-002).
  command = ["sh", "-c", replace(coder_agent.main.init_script, "/localhost|127\\.0\\.0\\.1/", "host.docker.internal")]
  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
  ]
  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  volumes {
    container_path = "/home/coder"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }
  volumes {
    container_path = "/var/lib/docker"
    volume_name    = docker_volume.docker_volume.name
    read_only      = false
  }
}
