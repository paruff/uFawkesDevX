"""Unit tests for base devcontainer definitions (DX-004)."""

import json
from pathlib import Path

import pytest

DEVCONTAINER_DIR = Path(__file__).parent.parent.parent / "devcontainer"
BASE_DEVCONTAINER_FILES = sorted(DEVCONTAINER_DIR.glob("base-*.json"))


class TestBaseDevcontainerFiles:
    """Validate devcontainer/base-*.json structure and configuration."""

    def test_base_devcontainer_files_exist(self):
        """All four language base devcontainer files must exist."""
        names = {f.name for f in BASE_DEVCONTAINER_FILES}
        assert names == {
            "base-python.json",
            "base-java.json",
            "base-node.json",
            "base-go.json",
        }

    @pytest.mark.parametrize(
        "devcontainer_file", BASE_DEVCONTAINER_FILES, ids=lambda p: p.name
    )
    def test_is_valid_json(self, devcontainer_file):
        """Each base devcontainer file must be valid JSON."""
        with open(devcontainer_file) as f:
            config = json.load(f)
        assert config is not None

    @pytest.mark.parametrize(
        "devcontainer_file", BASE_DEVCONTAINER_FILES, ids=lambda p: p.name
    )
    def test_has_pinned_image(self, devcontainer_file):
        """image field must be present and not use the ':latest' tag."""
        with open(devcontainer_file) as f:
            config = json.load(f)
        assert "image" in config, f"{devcontainer_file.name} missing 'image'"
        assert not config["image"].endswith(":latest"), (
            f"{devcontainer_file.name} must not use ':latest'"
        )

    @pytest.mark.parametrize(
        "devcontainer_file", BASE_DEVCONTAINER_FILES, ids=lambda p: p.name
    )
    def test_has_post_create_command(self, devcontainer_file):
        """postCreateCommand field must be present."""
        with open(devcontainer_file) as f:
            config = json.load(f)
        assert "postCreateCommand" in config, (
            f"{devcontainer_file.name} missing 'postCreateCommand'"
        )

    @pytest.mark.parametrize(
        "devcontainer_file", BASE_DEVCONTAINER_FILES, ids=lambda p: p.name
    )
    def test_remote_user_is_vscode(self, devcontainer_file):
        """remoteUser must be 'vscode'."""
        with open(devcontainer_file) as f:
            config = json.load(f)
        assert config.get("remoteUser") == "vscode", (
            f"{devcontainer_file.name} remoteUser must be 'vscode'"
        )
