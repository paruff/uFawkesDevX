"""Unit tests for base devcontainer definitions (DX-004)."""

import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
DEVCONTAINER_DIR = REPO_ROOT / "devcontainer"
BASE_DEVCONTAINER_FILES = sorted(DEVCONTAINER_DIR.glob("base-*.json"))

TEMPLATE_TO_BASE = {
    "python-flask-app": "base-python.json",
    "java-spring-app": "base-java.json",
    "node-express-app": "base-node.json",
    "go-http-app": "base-go.json",
}
TEMPLATES_DIR = REPO_ROOT / "templates"


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


class TestTemplateDevcontainerFiles:
    """Validate golden-path template devcontainer.json files (DX-006) stay
    in sync with the DX-004 base devcontainer definitions."""

    @pytest.mark.parametrize(
        "template_name, base_name", sorted(TEMPLATE_TO_BASE.items())
    )
    def test_template_image_matches_base(self, template_name, base_name):
        template_file = (
            TEMPLATES_DIR
            / template_name
            / "{{cookiecutter.project_slug}}"
            / ".devcontainer"
            / "devcontainer.json"
        )
        with open(template_file) as f:
            template_config = json.load(f)
        with open(DEVCONTAINER_DIR / base_name) as f:
            base_config = json.load(f)
        assert template_config["image"] == base_config["image"], (
            f"{template_file}: image {template_config['image']!r} does not "
            f"match {base_name} image {base_config['image']!r}"
        )
