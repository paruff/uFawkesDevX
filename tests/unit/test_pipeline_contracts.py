"""Unit tests for golden-path template pipeline contracts (DX-006)."""

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).parent.parent.parent
TEMPLATES_DIR = REPO_ROOT / "templates"
PIPELINE_FILES = sorted(
    TEMPLATES_DIR.glob("*/{{cookiecutter.project_slug}}/.fawkespipe.yml")
)


class TestPipelineContracts:
    """Validate each template's .fawkespipe.yml as raw (unrendered) template
    content — {{ cookiecutter.* }} is treated as a literal string."""

    def test_pipeline_files_exist_for_all_templates(self):
        template_dirs = {p.parent.parent.name for p in PIPELINE_FILES}
        assert template_dirs == {
            "python-flask-app",
            "java-spring-app",
            "node-express-app",
            "go-http-app",
        }

    def test_is_valid_yaml(self):
        for path in PIPELINE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc is not None, f"{path}: empty document"

    def test_has_app_name_and_language(self):
        for path in PIPELINE_FILES:
            doc = yaml.safe_load(path.read_text())
            app = doc.get("app", {})
            assert app.get("name"), f"{path}: missing app.name"
            assert app.get("language"), f"{path}: missing app.language"

    def test_build_builder_is_valid(self):
        for path in PIPELINE_FILES:
            doc = yaml.safe_load(path.read_text())
            builder = doc.get("build", {}).get("builder")
            assert builder in ("cnb", "docker"), (
                f"{path}: build.builder must be 'cnb' or 'docker', got {builder!r}"
            )

    def test_has_stages(self):
        for path in PIPELINE_FILES:
            doc = yaml.safe_load(path.read_text())
            assert doc.get("stages"), f"{path}: missing stages"
