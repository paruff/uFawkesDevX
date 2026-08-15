.PHONY: help start stop restart logs build clean health status install test test-unit test-integration test-smoke test-acceptance validate pre-commit-setup pre-commit-run network check-gid up down coder-push-template

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install and setup the platform
	@echo "Setting up Developer Control Plane..."
	@cp -n .env.example .env || true
	@echo "Configuration file created. Edit .env if needed."
	@echo "Run 'make start' to start the platform"

network: ## Create the external fawkes-net Docker network (shared with uFawkesRes/uFawkesSec)
	docker network inspect fawkes-net >/dev/null 2>&1 || docker network create fawkes-net

check-gid: ## Print the host docker.sock group GID for DOCKER_GID in .env
	@stat -c '%g' /var/run/docker.sock 2>/dev/null || stat -f '%g' /var/run/docker.sock

start: network ## Start all services
	@echo "Starting Developer Control Plane..."
	@grep -q localhost .env 2>/dev/null && echo "WARNING: CODER_ACCESS_URL must not be localhost" || true
	docker compose up -d
	@echo "Services starting... Use 'make status' to check progress"
	@echo "Access the platform at http://localhost:8000"

up: start ## Alias for 'start' (matches compose.yaml usage docs)

stop: ## Stop all services
	@echo "Stopping Developer Control Plane..."
	docker compose stop

restart: ## Restart all services
	@echo "Restarting Developer Control Plane..."
	docker compose restart

logs: ## Show logs from all services
	docker compose logs -f

logs-%: ## Show logs from specific service (e.g., make logs-score-service)
	docker compose logs -f $*

build: ## Build all custom services
	@echo "Building services..."
	docker compose build

build-%: ## Build specific service (e.g., make build-score-service)
	docker compose build $*

status: ## Show status of all services
	docker compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health && echo "✓ Gateway: Healthy" || echo "✗ Gateway: Unhealthy"
	@curl -s http://localhost:8081/health && echo "✓ Score API: Healthy" || echo "✗ Score API: Unhealthy"
	@curl -s http://localhost:8082/health && echo "✓ Score Webhooks: Healthy" || echo "✗ Score Webhooks: Unhealthy"
	@curl -s http://localhost:8083/health && echo "✓ Plugin Manager: Healthy" || echo "✗ Plugin Manager: Unhealthy"

clean: ## Stop services and remove containers (keeps volumes)
	@echo "Cleaning up containers..."
	docker compose down

down: clean ## Alias for 'clean' (matches compose.yaml usage docs)

clean-all: ## Stop services and remove everything including volumes (WARNING: deletes data)
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "All data removed"; \
	fi

shell-%: ## Open shell in service container (e.g., make shell-score-service)
	docker compose exec $* sh

api-test: ## Test Score API endpoints
	@echo "Testing Score API..."
	@curl -s http://localhost:8081/api/v1/specs | jq .
	@echo ""
	@echo "Testing Plugin Manager..."
	@curl -s http://localhost:8083/api/v1/plugins | jq .

# ============================================================================
# Test Commands
# ============================================================================

test: test-unit ## Run all tests
	@echo "All tests passed"

test-unit: ## Run unit tests
	pytest tests/unit/ -v --tb=short

test-integration: ## Run integration tests (requires Docker)
	pytest tests/integration/ -v --tb=short

test-smoke: ## Run smoke tests (requires running stack)
	pytest tests/smoke/ -v --tb=short

test-acceptance: ## Run acceptance tests (requires running stack)
	pytest tests/acceptance/ -v --tb=short

test-coverage: ## Run tests with coverage report
	pytest tests/unit/ -v --tb=short --cov=tests/unit --cov-report=term-missing

# ============================================================================
# Validation Commands
# ============================================================================

validate: ## Run all validations
	@echo "Running validations..."
	pre-commit run --all-files

# ============================================================================
# Pre-commit Commands
# ============================================================================

pre-commit-setup: ## Install pre-commit hooks
	pip install pre-commit
	pre-commit install

pre-commit-run: ## Run pre-commit hooks on all files
	pre-commit run --all-files

# ============================================================================
# Coder Commands
# ============================================================================

coder-push-template: ## Push the devcontainer workspace template to Coder (requires Coder running)
	cd coder/templates/devcontainer-docker && coder templates push devcontainer-docker
