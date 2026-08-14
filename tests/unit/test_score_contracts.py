"""Unit tests for golden-path template Score contracts (DX-006)."""

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).parent.parent.parent
TEMPLATES_DIR = REPO_ROOT / "templates"
SCORE_FILES = sorted(TEMPLATES_DIR.glob("*/{{cookiecutter.project_slug}}/score.yaml"))


class TestScoreContracts:
    """Validate each template's score.yaml as raw (unrendered) template
    content — {{ cookiecutter.* }} is treated as a literal string."""

    def test_score_files_exist_for_all_templates(self):
        template_dirs = {p.parent.parent.name for p in SCORE_FILES}
        assert template_dirs == {
            "python-flask-app",
            "java-spring-app",
            "node-express-app",
            "go-http-app",
        }

    def test_is_valid_yaml(self):
        for path in SCORE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc is not None, f"{path}: empty document"

    def test_api_version_is_score_v1b1(self):
        for path in SCORE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc.get("apiVersion") == "score.dev/v1b1", (
                f"{path}: unexpected apiVersion {doc.get('apiVersion')!r}"
            )

    def test_has_metadata_name(self):
        for path in SCORE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc.get("metadata", {}).get("name"), f"{path}: missing metadata.name"

    def test_has_containers(self):
        for path in SCORE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc.get("containers"), f"{path}: missing containers"
