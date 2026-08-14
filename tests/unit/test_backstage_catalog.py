"""Unit tests for the Backstage service catalog (DX-005)."""

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).parent.parent.parent
APP_CONFIG = REPO_ROOT / "backstage" / "app-config.yaml"
CATALOG_DIR = REPO_ROOT / "backstage" / "catalog"

# app-config.yaml catalog.locations use /app/catalog/... (the compose.yaml
# volume mount target); map that prefix back to the local catalog dir.
APP_CATALOG_PREFIX = "/app/catalog/"


def _load_all_docs(path: Path) -> list[dict]:
    with open(path) as f:
        return [doc for doc in yaml.safe_load_all(f) if doc]


def _resolve_local_target(target: str) -> Path:
    assert target.startswith(APP_CATALOG_PREFIX), f"unexpected target: {target}"
    return CATALOG_DIR / target[len(APP_CATALOG_PREFIX) :]


def _collect_all_entities() -> list[dict]:
    """Walk app-config.yaml's catalog.locations, resolving Location kind
    entities recursively, and return every entity doc found."""
    with open(APP_CONFIG) as f:
        app_config = yaml.safe_load(f)

    entities = []
    for location in app_config["catalog"]["locations"]:
        for doc in _load_all_docs(_resolve_local_target(location["target"])):
            entities.append(doc)
            if doc.get("kind") == "Location":
                for sub_target in doc["spec"]["targets"]:
                    sub_path = (
                        _resolve_local_target(location["target"]).parent / sub_target
                    ).resolve()
                    entities.extend(_load_all_docs(sub_path))
    return entities


class TestBackstageCatalog:
    """Validate the catalog covers all 5 uFawkes planes and is schema-valid."""

    def test_catalog_files_are_valid_yaml(self):
        for path in CATALOG_DIR.glob("*.yaml"):
            docs = _load_all_docs(path)
            assert docs, f"{path.name} has no entity documents"

    def test_all_entities_have_required_fields(self):
        for path in CATALOG_DIR.glob("*.yaml"):
            for doc in _load_all_docs(path):
                assert "apiVersion" in doc, f"{path.name}: missing apiVersion"
                assert "kind" in doc, f"{path.name}: missing kind"
                assert "name" in doc.get("metadata", {}), (
                    f"{path.name}: missing metadata.name"
                )

    def test_catalog_locations_cover_all_five_planes(self):
        entities = _collect_all_entities()
        names = {
            e["metadata"]["name"]
            for e in entities
            if e.get("kind") in ("System", "Component")
        }
        expected_planes = {
            "ufawkes-devx",
            "ufawkes-pipe",
            "ufawkes-sec",
            "ufawkes-res",
            "ufawkes-obs",
        }
        missing = expected_planes - names
        assert not missing, f"catalog is missing plane entities: {missing}"

    def test_no_eclipse_che_references(self):
        """Eclipse Che was removed from compose.yaml in DX-002 — the catalog
        must not reference it."""
        for path in CATALOG_DIR.glob("*.yaml"):
            content = path.read_text()
            assert "eclipse-che" not in content and "che-api" not in content, (
                f"{path.name} still references removed Eclipse Che service"
            )
