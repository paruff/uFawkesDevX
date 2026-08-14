"""Shared test fixtures for uFawkesDevX unit tests."""

import pytest
import yaml
from pathlib import Path


@pytest.fixture
def project_root():
    """Return the project root directory."""
    return Path(__file__).parent.parent.parent


@pytest.fixture
def docker_compose_file(project_root):
    """Return the compose.yaml file path."""
    return project_root / "compose.yaml"


@pytest.fixture
def docker_compose_config(docker_compose_file):
    """Load and return the compose.yaml configuration."""
    with open(docker_compose_file) as f:
        return yaml.safe_load(f)


@pytest.fixture
def github_dir(project_root):
    """Return the .github directory."""
    return project_root / ".github"


@pytest.fixture
def workflows_dir(github_dir):
    """Return the workflows directory."""
    return github_dir / "workflows"


@pytest.fixture
def workflow_files(workflows_dir):
    """Return all workflow files."""
    return list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
