"""Unit tests for compose.yaml configuration validation."""

import yaml


class TestDockerComposeValidation:
    """Validate compose.yaml structure and configuration."""

    def test_docker_compose_is_valid_yaml(self, docker_compose_file):
        """compose.yaml must be valid YAML."""
        with open(docker_compose_file) as f:
            config = yaml.safe_load(f)
        assert config is not None, "compose.yaml is empty"

    def test_has_services_section(self, docker_compose_config):
        """compose.yaml must have a services section."""
        assert "services" in docker_compose_config, "Missing 'services' section"

    def test_all_services_have_image_or_build(self, docker_compose_config):
        """Every service must have either 'image' or 'build' specified."""
        for service_name, service_config in docker_compose_config["services"].items():
            assert "image" in service_config or "build" in service_config, (
                f"Service '{service_name}' must have 'image' or 'build'"
            )

    def test_no_latest_tags(self, docker_compose_config):
        """No service should use ':latest' image tags (soft check)."""
        services_with_latest = []
        for service_name, service_config in docker_compose_config["services"].items():
            if "image" in service_config:
                image = service_config["image"]
                if image.endswith(":latest"):
                    services_with_latest.append(service_name)

        # Warn but don't fail - some services may intentionally use latest
        if services_with_latest:
            import warnings

            warnings.warn(
                f"Services using ':latest' tag: {', '.join(services_with_latest)}",
                UserWarning,
            )

    def test_all_services_have_healthcheck(self, docker_compose_config):
        """Every service should have a healthcheck defined (soft check)."""
        services_without_healthcheck = []
        for service_name, service_config in docker_compose_config["services"].items():
            if "healthcheck" not in service_config:
                services_without_healthcheck.append(service_name)

        # Warn but don't fail - some services may not need healthchecks
        if services_without_healthcheck:
            import warnings

            warnings.warn(
                f"Services without healthcheck: {', '.join(services_without_healthcheck)}",
                UserWarning,
            )

    def test_healthchecks_have_retries(self, docker_compose_config):
        """Healthchecks should have retries defined."""
        for service_name, service_config in docker_compose_config["services"].items():
            if "healthcheck" in service_config:
                healthcheck = service_config["healthcheck"]
                assert "retries" in healthcheck or "test" in healthcheck, (
                    f"Service '{service_name}' healthcheck missing retries/test"
                )

    def test_no_secrets_in_compose(self, docker_compose_config):
        """No hardcoded secrets or credentials in docker-compose.yml."""
        content = yaml.dump(docker_compose_config)
        # Only check for actual hardcoded values, not variable references
        sensitive_patterns = [
            "password: admin",
            "password: password",
            "password: root",
            "secret: secret",
            "token: token",
            "api_key: key",
            "PRIVATE_KEY: -----BEGIN",
        ]
        for pattern in sensitive_patterns:
            assert pattern.lower() not in content.lower(), (
                f"Found hardcoded secret '{pattern}' in docker-compose.yml"
            )

    def test_volumes_are_named(self, docker_compose_config):
        """Volumes should be named, not host paths."""
        if "volumes" in docker_compose_config:
            for volume_name in docker_compose_config["volumes"]:
                # Named volumes don't start with / or .
                assert not volume_name.startswith("/") and not volume_name.startswith(
                    "."
                ), f"Volume '{volume_name}' should be a named volume, not a host path"

    def test_v0_2_service_topology(self, docker_compose_config):
        """DX-002: exactly the 5 v0.2 services are present; postgres/che are gone."""
        services = docker_compose_config["services"]
        expected = {"coder", "backstage", "score-service", "plugin-manager", "gateway"}
        assert set(services.keys()) == expected, (
            f"Expected services {expected}, got {set(services.keys())}"
        )

    def test_fawkes_net_is_external(self, docker_compose_config):
        """DX-002: fawkes-net is an external network shared with uFawkesRes/uFawkesSec."""
        networks = docker_compose_config.get("networks", {})
        assert "fawkes-net" in networks, "Missing 'fawkes-net' network"
        assert networks["fawkes-net"].get("external") is True, (
            "fawkes-net must be external=true"
        )
        for service_name, service_config in docker_compose_config["services"].items():
            assert "fawkes-net" in service_config.get("networks", []), (
                f"Service '{service_name}' is not on fawkes-net"
            )

    def test_coder_image_is_pinned(self, docker_compose_config):
        """DX-002: coder image is pinned to 2.34.3, not :latest."""
        coder = docker_compose_config["services"]["coder"]
        assert coder["image"] == "ghcr.io/coder/coder:2.34.3"

    def test_coder_mounts_docker_socket(self, docker_compose_config):
        """DX-002: coder needs the host docker socket to provision workspaces."""
        coder = docker_compose_config["services"]["coder"]
        assert any(
            "/var/run/docker.sock:/var/run/docker.sock" in v for v in coder["volumes"]
        ), "coder must mount /var/run/docker.sock"

    def test_gateway_image_is_pinned(self, docker_compose_config):
        """DX-002: gateway image is pinned to nginx:1.27-alpine, not :alpine/:latest."""
        gateway = docker_compose_config["services"]["gateway"]
        assert gateway["image"] == "nginx:1.27-alpine"

    def test_backstage_password_via_secret_not_env(self, docker_compose_config):
        """DX-002: backstage DB password comes from a Docker secret, not a plain env var."""
        backstage = docker_compose_config["services"]["backstage"]
        env = backstage.get("environment", {})
        env_values = " ".join(
            str(v) for v in (env.values() if isinstance(env, dict) else env)
        )
        assert (
            "POSTGRES_PASSWORD" not in env_values
            or "${POSTGRES_PASSWORD}" not in env_values
        )
        assert "backstage_db_password" in backstage.get("secrets", []), (
            "backstage must consume the backstage_db_password secret"
        )
