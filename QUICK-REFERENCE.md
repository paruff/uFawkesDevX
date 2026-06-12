# Quick Reference Guide

Quick command reference for Developer Control Plane operations.

**⚠️ PREREQUISITE**: Create `.env` file from `.env.example` and set secure passwords before starting!

```bash
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD to a secure value
```

## Starting & Stopping

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove everything including volumes
docker compose down -v
```

## Service Management

```bash
# View running services
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Rebuild and restart a service
docker compose up -d --build [service-name]
```

## Health Checks

```bash
# Gateway
curl http://localhost:8000/health

# Score API
curl http://localhost:8081/health

# Score Webhooks
curl http://localhost:8082/health

# Plugin Manager
curl http://localhost:8083/health
```

## Score Operations

### List Workloads

```bash
curl http://localhost:8081/api/v1/specs | jq
```

### Create Workload

```bash
curl -X POST http://localhost:8081/api/v1/specs \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "score.dev/v1b1",
    "metadata": {"name": "my-app"},
    "containers": {
      "my-app": {"image": "nginx:latest"}
    }
  }'
```

### Get Workload

```bash
curl http://localhost:8081/api/v1/specs/my-app | jq
```

### Delete Workload

```bash
curl -X DELETE http://localhost:8081/api/v1/specs/my-app
```

### Trigger Pipeline

```bash
curl -X POST http://localhost:8082/webhooks/pipeline/trigger \
  -H "Content-Type: application/json" \
  -d '{"workload": "my-app", "action": "deploy"}'
```

### List Pipelines

```bash
curl http://localhost:8081/api/v1/pipelines | jq
```

## Plugin Operations

### List Plugins

```bash
curl http://localhost:8083/api/v1/plugins | jq
```

### List Extension Points

```bash
curl http://localhost:8083/api/v1/extension-points | jq
```

### Install Plugin

```bash
curl -X POST http://localhost:8083/api/v1/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-plugin",
    "source": "local",
    "type": "score"
  }'
```

### Update Plugin

```bash
curl -X PUT http://localhost:8083/api/v1/plugins/my-plugin \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Delete Plugin

```bash
curl -X DELETE http://localhost:8083/api/v1/plugins/my-plugin
```

## Database Operations

### Connect to PostgreSQL

```bash
docker compose exec postgres psql -U backstage -d backstage
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U backstage backstage > backup.sql
docker compose exec postgres pg_dump -U backstage score > backup-score.sql
```

### Restore Database

```bash
cat backup.sql | docker compose exec -T postgres psql -U backstage backstage
```

## Access Points

| Service        | URL                   | Purpose                 |
| -------------- | --------------------- | ----------------------- |
| API Gateway    | http://localhost:8000 | Unified API entry point |
| Backstage      | http://localhost:7007 | Developer portal        |
| Eclipse Che    | http://localhost:8080 | Cloud dev environments  |
| Score API      | http://localhost:8081 | Direct Score API access |
| Score Webhooks | http://localhost:8082 | Webhook endpoints       |
| Plugin Manager | http://localhost:8083 | Plugin management       |

## API Gateway Routes

| Route               | Target              | Description       |
| ------------------- | ------------------- | ----------------- |
| `/`                 | Gateway docs        | API documentation |
| `/backstage/*`      | Backstage:7007      | Portal access     |
| `/api/score/*`      | Score:8081          | Score REST API    |
| `/webhooks/score/*` | Score:8082          | Score webhooks    |
| `/api/plugins/*`    | Plugin Manager:8083 | Plugin API        |
| `/che/*`            | Che:8080            | Eclipse Che       |

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Database
POSTGRES_USER=backstage
POSTGRES_PASSWORD=secure_password

# Ports
BACKSTAGE_PORT=7007
SCORE_API_PORT=8081
SCORE_WEBHOOK_PORT=8082
CHE_PORT=8080
GATEWAY_PORT=8000
PLUGIN_MANAGER_PORT=8083

# Features
PIPELINE_TRIGGER_ENABLED=true
LOG_LEVEL=info
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker compose logs [service-name]

# Check if port is in use
netstat -tuln | grep [port]

# Rebuild service
docker compose build [service-name]
docker compose up -d [service-name]
```

### Database connection issues

```bash
# Test connection
docker compose exec postgres psql -U backstage -d backstage -c "SELECT 1"

# Check database status
docker compose exec postgres pg_isready -U backstage

# View PostgreSQL logs
docker compose logs postgres
```

### Reset everything

```bash
# WARNING: Deletes all data
docker compose down -v
docker compose up -d
```

## Useful Makefile Targets

```bash
make help          # Show all available commands
make install       # Setup platform
make start         # Start services
make stop          # Stop services
make logs          # View all logs
make status        # Show service status
make health        # Check service health
make clean         # Remove containers
make clean-all     # Remove everything
make api-test      # Test APIs
```

## Testing

```bash
# Run test script
./test-platform.sh

# Test specific endpoint
curl -v http://localhost:8000/health
```

## Common Workflows

### Deploy New Workload

1. Create Score spec: `POST /api/v1/specs`
2. Verify spec: `GET /api/v1/specs/{name}`
3. Trigger pipeline: `POST /webhooks/pipeline/trigger`
4. Check status: `GET /api/v1/pipelines/{name}`

### Add Custom Plugin

1. Create plugin code in `score-service/plugins/`
2. Restart service: `docker compose restart score-service`
3. Verify: `curl http://localhost:8081/api/v1/plugins`

### Access Development Environment

1. Open Che: http://localhost:8080
2. Create workspace
3. Start coding

### Update Configuration

1. Edit `.env` file
2. Restart services: `docker compose up -d`

## Security Notes

⚠️ **This configuration is for development only!**

For production:

- Enable authentication
- Use HTTPS
- Restrict CORS
- Use secrets management
- Follow [SECURITY.md](SECURITY.md)

## Getting Help

- Documentation: [README.md](README.md)
- Examples: [EXAMPLES.md](EXAMPLES.md)
- Kubernetes: [KUBERNETES.md](KUBERNETES.md)
- Security: [SECURITY.md](SECURITY.md)
