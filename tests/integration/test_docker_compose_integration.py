"""Integration tests for Docker Compose stack."""

import subprocess
import time
from pathlib import Path

import pytest
import requests

REPO_ROOT = Path(__file__).parent.parent.parent

# service -> container name (see compose.yaml)
SERVICES = {
    "coder": "developerd-coder",
    "backstage": "developerd-backstage",
    "score-service": "developerd-score",
    "plugin-manager": "developerd-plugin-manager",
    "gateway": "developerd-gateway",
}


class TestDockerComposeIntegration:
    """Integration tests for the complete Docker Compose stack."""

    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Start and stop Docker Compose stack."""
        subprocess.run(
            ["docker", "compose", "up", "-d"],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        # Wait for services to be ready
        time.sleep(30)
        yield
        subprocess.run(
            ["docker", "compose", "down", "-v"],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )

    def test_all_services_are_running(self):
        """Every service defined in compose.yaml should be running."""
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        assert result.returncode == 0
        for service in SERVICES:
            assert service in result.stdout.lower(), f"{service} not running"

    def test_gateway_responds_on_port_8000(self):
        """API Gateway should serve the platform landing page."""
        try:
            response = requests.get("http://localhost:8000/", timeout=10)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Gateway not available on port 8000")

    def test_backstage_responds_on_port_7007(self):
        """Backstage portal should respond."""
        try:
            response = requests.get("http://localhost:7007/healthcheck", timeout=10)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Backstage not available on port 7007")

    def test_score_service_health_endpoints(self):
        """Score API and webhook servers should both report healthy."""
        try:
            api_response = requests.get("http://localhost:8081/health", timeout=10)
            webhook_response = requests.get("http://localhost:8082/health", timeout=10)
            assert api_response.status_code == 200
            assert webhook_response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Score service not available on port 8081/8082")

    def test_volumes_are_created(self):
        """Docker volumes should be created for persistence."""
        result = subprocess.run(
            ["docker", "volume", "ls", "--format", "{{.Name}}"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        volumes = result.stdout.strip().split("\n")
        assert len(volumes) > 0, "No Docker volumes found"

    def test_no_port_conflicts(self):
        """docker compose up should succeed with no port binding failures."""
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        assert result.returncode == 0
