# Developer Control Plane (developerd)

A comprehensive Docker Compose stack for the Developer Control Plane of an internal developer platform. This platform provides a unified interface for managing workloads, development environments, and delivery pipelines.

> ⚠️ **Security Notice**: This configuration is designed for **development use only**. See [SECURITY.md](SECURITY.md) for production deployment requirements.

## 📚 Documentation

- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[Quick Reference](QUICK-REFERENCE.md)** - Command cheat sheet
- **[Examples](EXAMPLES.md)** - Practical usage examples
- **[Kubernetes Migration](KUBERNETES.md)** - Production deployment guide
- **[Security](SECURITY.md)** - Security best practices and requirements

## 🏗️ Architecture

The Developer Control Plane consists of the following services:

- **Backstage**: Developer portal and service catalog
- **Eclipse Che**: Cloud development environments
- **Score Service**: Workload specification management with REST API and webhooks
- **Plugin Manager**: Platform extension points and plugin management
- **PostgreSQL**: Shared database for platform services
- **API Gateway**: Unified REST API and webhook routing

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for containers
- Ports available: 7007, 8000, 8080, 8081, 8082, 8083

### Starting the Platform

1. Clone the repository:
```bash
git clone https://github.com/paruff/developerd.git
cd developerd
```

2. Copy environment configuration and set secure passwords:
```bash
cp .env.example .env
# IMPORTANT: Edit .env and set POSTGRES_PASSWORD to a secure value
# The default value is intentionally insecure and must be changed
nano .env  # or use your preferred editor
```

3. Start all services:
```bash
docker compose up -d
# or with older Docker Compose v1: docker-compose up -d
```

4. Wait for services to be ready (check health):
```bash
docker compose ps
```

5. Access the platform:
   - **API Gateway Dashboard**: http://localhost:8000
   - **Backstage Portal**: http://localhost:7007
   - **Eclipse Che**: http://localhost:8080
   - **Score API**: http://localhost:8081
   - **Plugin Manager**: http://localhost:8083

## 📦 Services Overview

### Backstage Portal (Port 7007)

The main developer portal providing:
- Service catalog
- Software templates
- Tech docs
- Integration with Score and Che

**Configuration**: `backstage/app-config.yaml`

### Eclipse Che (Port 8080)

Cloud development environments supporting:
- Web-based IDEs
- Workspace management
- Container-based development
- Kubernetes-ready workspaces

### Score Service (Ports 8081, 8082)

Manages Score workload specifications:

**REST API (8081)**:
- `GET /api/v1/specs` - List all workload specs
- `POST /api/v1/specs` - Create/update workload spec
- `GET /api/v1/specs/:name` - Get specific spec
- `DELETE /api/v1/specs/:name` - Delete spec
- `GET /api/v1/pipelines` - List pipeline runs
- `GET /api/v1/plugins` - List loaded plugins

**Webhooks (8082)**:
- `POST /webhooks/pipeline/trigger` - Trigger delivery pipeline
- `POST /webhooks/:integration/:event` - Generic integration webhooks

### Plugin Manager (Port 8083)

Manages platform extensions:
- `GET /api/v1/plugins` - List installed plugins
- `POST /api/v1/plugins` - Install new plugin
- `PUT /api/v1/plugins/:name` - Update plugin
- `DELETE /api/v1/plugins/:name` - Uninstall plugin
- `GET /api/v1/extension-points` - List available extension points

### API Gateway (Port 8000)

Unified entry point routing to:
- `/backstage/*` → Backstage Portal
- `/api/score/*` → Score REST API
- `/webhooks/score/*` → Score Webhooks
- `/api/plugins/*` → Plugin Manager
- `/che/*` → Eclipse Che

## 🔌 Plugin Architecture

The platform is designed as a shell with extension points for customization.

### Available Extension Points

#### Score Service Extensions
- **spec-validator**: Custom Score specification validation
- **pipeline-trigger**: Custom pipeline trigger handlers
- **webhook-handler**: Custom webhook processing

#### Backstage Extensions
- **catalog-entity-provider**: Custom catalog entities
- **scaffolder-action**: Custom scaffolder actions

#### Platform Extensions
- **auth-provider**: Custom authentication
- **metrics-collector**: Custom metrics

### Creating a Plugin

1. Create plugin manifest (`plugin.json`):
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "score",
  "description": "My custom plugin",
  "extensionPoints": ["spec-validator"]
}
```

2. Implement plugin interface (for Score plugins):
```javascript
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  
  async validateSpec(spec) {
    // Custom validation logic
    return { valid: true, errors: [] };
  }
};
```

3. Install plugin:
```bash
# Copy to plugins directory
cp -r my-plugin score-service/plugins/

# Or use Plugin Manager API
curl -X POST http://localhost:8083/api/v1/plugins \
  -H "Content-Type: application/json" \
  -d '{"name":"my-plugin","source":"local","type":"score"}'
```

## 📝 Score Workload Management

### Creating a Workload

Using the Score API:
```bash
curl -X POST http://localhost:8081/api/v1/specs \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "score.dev/v1b1",
    "metadata": {
      "name": "my-app"
    },
    "containers": {
      "my-app": {
        "image": "nginx:latest"
      }
    }
  }'
```

### Triggering Pipeline

Via webhook:
```bash
curl -X POST http://localhost:8082/webhooks/pipeline/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "my-app",
    "action": "deploy"
  }'
```

## 🔐 Authentication

The platform uses **local authentication only** for development:
- No external OAuth providers
- Guest access enabled for Backstage
- Basic authentication for Che
- No authentication on internal APIs (secured by network)

**Production Deployment**: Replace with proper authentication providers before production use.

## 🗂️ Data Persistence

Persistent volumes are used for:
- `postgres-data`: PostgreSQL database
- `backstage-plugins`: Backstage plugins
- `che-data`: Eclipse Che configuration
- `che-workspaces`: Development workspaces
- `score-specs`: Score specifications
- `score-plugins`: Score plugins
- `plugin-registry`: Platform plugins

## 🌐 Networking

All services communicate via the `developerd-control-plane` bridge network:
- Internal DNS resolution between services
- External access through configured ports
- Gateway provides unified external API

## ☸️ Kubernetes Promotion Path

The platform is designed for easy promotion to Kubernetes:

### Single-Node Development
- Docker Compose for local/dev
- Shared volumes for state
- Environment-based configuration

### Kubernetes Production
- Each service has a clear container boundary
- Stateless service design (state in PostgreSQL)
- ConfigMaps for environment variables
- PersistentVolumeClaims for volumes
- Service mesh ready (internal networking)
- Ingress controller for gateway

### Migration Steps

1. Convert volumes to PVCs:
```yaml
# Example for postgres-data
kind: PersistentVolumeClaim
metadata:
  name: developerd-postgres-data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 10Gi
```

2. Convert services to Deployments:
```yaml
# Example for Score service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: score-service
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: score-service
        image: developerd/score-service:latest
        ports:
        - containerPort: 8081
        - containerPort: 8082
        envFrom:
        - configMapRef:
            name: score-config
```

3. Replace gateway with Ingress:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: developerd-ingress
spec:
  rules:
  - host: platform.example.com
    http:
      paths:
      - path: /api/score
        backend:
          service:
            name: score-service
            port: 8081
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Database
POSTGRES_USER=backstage
POSTGRES_PASSWORD=<strong-password>

# Backstage
BACKSTAGE_PORT=7007
APP_BASE_URL=http://localhost:7007

# Score Service
SCORE_API_PORT=8081
PIPELINE_TRIGGER_ENABLED=true

# Eclipse Che
CHE_PORT=8080

# Gateway
GATEWAY_PORT=8000
```

### Service Configuration

- **Backstage**: `backstage/app-config.yaml`
- **Score Service**: `score-service/config/service.yaml`
- **API Gateway**: `gateway/nginx.conf`

## 🧪 Development

### Building Services

```bash
# Build Score service
docker-compose build score-service

# Build Plugin Manager
docker-compose build plugin-manager
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f score-service
```

### Restarting Services

```bash
# Restart single service
docker-compose restart score-service

# Restart all
docker-compose restart
```

## 📊 Monitoring

Check service health:
```bash
# Gateway health
curl http://localhost:8000/health

# Score API health
curl http://localhost:8081/health

# Score Webhooks health
curl http://localhost:8082/health

# Plugin Manager health
curl http://localhost:8083/health
```

## 🛠️ Troubleshooting

### Services Not Starting

1. Check logs:
```bash
docker-compose logs <service-name>
```

2. Verify ports are available:
```bash
netstat -tuln | grep -E '7007|8000|8080|8081|8082|8083'
```

3. Check database connection:
```bash
docker-compose exec postgres psql -U backstage -c '\l'
```

### Reset Platform

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## 🤝 Integration with Other Planes

The Developer Control Plane exposes APIs and webhooks for integration:

### REST APIs
- Score API for workload management
- Plugin Manager API for extensions
- Backstage API for catalog queries

### Webhooks
- Pipeline triggers for CI/CD integration
- Generic webhooks for event-driven workflows
- Integration hooks for external systems

### Example Integration

```bash
# External CI/CD triggering a deployment
curl -X POST http://platform.example.com:8000/webhooks/score/pipeline/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "payment-service",
    "action": "deploy",
    "metadata": {
      "commit": "abc123",
      "branch": "main"
    }
  }'
```

## 📄 License

See LICENSE file for details.

## 🙋 Support

For issues and questions, please open an issue in the GitHub repository.