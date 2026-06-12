# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Developer Control Plane                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     API Gateway (NGINX)                        │    │
│  │                     Port: 8000                                 │    │
│  │  Routes: /backstage, /api/score, /webhooks, /che, /api/plugins│    │
│  └─────┬──────────────┬──────────────┬──────────────┬─────────────┘    │
│        │              │              │              │                   │
│  ┌─────▼─────┐  ┌────▼─────┐  ┌────▼──────┐  ┌───▼──────┐            │
│  │ Backstage │  │  Score   │  │ Eclipse   │  │ Plugin   │            │
│  │  Portal   │  │ Service  │  │   Che     │  │ Manager  │            │
│  │ Port:7007 │  │ 8081/8082│  │ Port:8080 │  │Port:8083 │            │
│  └─────┬─────┘  └────┬─────┘  └───────────┘  └──────────┘            │
│        │             │                                                  │
│        │             │                                                  │
│        └─────────────┴──────────────────────┐                         │
│                                              │                          │
│                                    ┌─────────▼─────────┐               │
│                                    │   PostgreSQL      │               │
│                                    │   Port: 5432      │               │
│                                    │   DBs: backstage, │               │
│                                    │        score      │               │
│                                    └───────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

External Access Points:
  - http://localhost:8000  → API Gateway (unified entry)
  - http://localhost:7007  → Backstage Portal (direct)
  - http://localhost:8080  → Eclipse Che (direct)
  - http://localhost:8081  → Score API (direct)
  - http://localhost:8082  → Score Webhooks (direct)
  - http://localhost:8083  → Plugin Manager (direct)
```

## Component Responsibilities

### API Gateway (NGINX)

**Purpose**: Unified entry point for all services

**Routes**:

- `/` → API documentation (HTML)
- `/backstage/*` → Backstage Portal
- `/api/score/*` → Score REST API
- `/webhooks/score/*` → Score Webhooks
- `/api/plugins/*` → Plugin Manager API
- `/che/*` → Eclipse Che

**Features**:

- CORS handling
- Request routing
- Health check endpoint
- Static documentation serving

### Backstage Portal

**Purpose**: Developer portal and service catalog

**Features**:

- Service catalog
- Software templates (scaffolder)
- Tech docs
- Integration with Score and Che
- Local guest authentication

**Catalog Entities**:

- Components: score-service, eclipse-che, plugin-manager
- Systems: developer-control-plane
- APIs: score-api, score-webhooks, che-api, plugin-api
- Templates: score-workload-template

**Port**: 7007

### Score Service

**Purpose**: Workload specification management

**APIs**:

- **REST API (Port 8081)**:

  - `GET /api/v1/specs` - List specifications
  - `POST /api/v1/specs` - Create/update specification
  - `GET /api/v1/specs/:name` - Get specification
  - `DELETE /api/v1/specs/:name` - Delete specification
  - `GET /api/v1/pipelines` - List pipeline runs
  - `GET /api/v1/pipelines/:workload` - Get workload pipelines
  - `GET /api/v1/plugins` - List loaded plugins

- **Webhooks (Port 8082)**:
  - `POST /webhooks/pipeline/trigger` - Trigger pipeline
  - `POST /webhooks/:integration/:event` - Generic webhooks

**Features**:

- Score specification validation (JSON Schema)
- Plugin system for extensibility
- Pipeline trigger management
- Database persistence
- File-based spec storage

**Extension Points**:

- `spec-validator` - Custom validation logic
- `pipeline-trigger` - Custom pipeline handlers
- `webhook-handler` - Custom webhook processing

### Eclipse Che

**Purpose**: Cloud development environments

**Features**:

- Web-based IDE
- Workspace management
- Container-based development
- Devfile support
- Basic authentication

**Port**: 8080

### Plugin Manager

**Purpose**: Platform extension management

**APIs**:

- `GET /api/v1/plugins` - List installed plugins
- `POST /api/v1/plugins` - Install plugin
- `PUT /api/v1/plugins/:name` - Update plugin
- `DELETE /api/v1/plugins/:name` - Uninstall plugin
- `GET /api/v1/extension-points` - List available extension points
- `GET /api/v1/extension-points/:type/:point` - Get plugins by extension point

**Plugin Types**:

- `backstage` - Backstage portal plugins
- `score` - Score service plugins
- `che` - Eclipse Che plugins
- `platform` - Cross-cutting platform plugins

**Port**: 8083

### PostgreSQL

**Purpose**: Data persistence

**Databases**:

- `backstage` - Backstage catalog and configuration
- `score` - Score specifications and pipeline runs

**Tables** (Score DB):

- `score_specs` - Workload specifications
- `pipeline_runs` - Pipeline execution history

**Port**: 5432 (internal only)

## Data Flow

### Workload Deployment Flow

```
Developer → Backstage Template → Score API → Validation → Database
                                      ↓
                                   Plugins
                                      ↓
                              Pipeline Webhook
                                      ↓
                              Delivery Pipeline
```

### Plugin Loading Flow

```
Plugin Files → Plugin Manager → Validation → Registry
                                      ↓
                            Service Restart (if needed)
                                      ↓
                              Plugin Active
```

### Webhook Integration Flow

```
External System → Gateway → Score Webhooks → Plugin Handlers
                                ↓
                          Pipeline Trigger
                                ↓
                          Database Update
```

## Extension Points

### Score Service Extensions

#### 1. Spec Validator

**Interface**:

```javascript
async validateSpec(spec) {
  return {
    valid: boolean,
    errors: string[]
  };
}
```

**Use Cases**:

- Organization-specific validation rules
- Security policy enforcement
- Resource limit validation
- Naming convention enforcement

#### 2. Pipeline Trigger

**Interface**:

```javascript
async onPipelineTrigger(workload, action, metadata) {
  // Custom logic
}
```

**Use Cases**:

- Notify external systems (Slack, JIRA)
- Update deployment tracking
- Execute pre/post-deployment hooks
- Integrate with CI/CD systems

#### 3. Webhook Handler

**Interface**:

```javascript
async onWebhook(integration, event, payload) {
  // Custom logic
}
```

**Use Cases**:

- Process GitHub webhooks
- Handle JIRA events
- Integrate monitoring alerts
- Custom event processing

### Backstage Extensions

#### 1. Catalog Entity Provider

**Use Cases**:

- Import services from external systems
- Sync with service registries
- Dynamic catalog updates

#### 2. Scaffolder Action

**Use Cases**:

- Custom deployment actions
- Infrastructure provisioning
- Service registration

### Platform Extensions

#### 1. Auth Provider

**Use Cases**:

- Custom authentication
- SSO integration
- Token management

#### 2. Metrics Collector

**Use Cases**:

- Custom metrics
- Usage tracking
- Performance monitoring

## Network Architecture

### Docker Network

```
Name: developerd-control-plane
Type: bridge

Services on network:
- backstage (7007)
- postgres (5432)
- che (8080)
- score-service (8081, 8082)
- gateway (80)
- plugin-manager (8083)
```

### Service Discovery

Services use DNS names on the Docker network:

- `postgres:5432`
- `backstage:7007`
- `score-service:8081` / `score-service:8082`
- `che:8080`
- `plugin-manager:8083`

## Storage Architecture

### Volumes

| Volume              | Purpose                | Size Consideration |
| ------------------- | ---------------------- | ------------------ |
| `postgres-data`     | Database files         | Growing with data  |
| `backstage-plugins` | Backstage plugins      | Fixed              |
| `che-data`          | Che configuration      | Small, fixed       |
| `che-workspaces`    | Development workspaces | Large, growing     |
| `score-specs`       | Score spec files       | Growing slowly     |
| `score-plugins`     | Score plugins          | Small, fixed       |
| `plugin-registry`   | Platform plugins       | Small, fixed       |

### File System Layout

```
/home/runner/work/developerd/developerd/
├── backstage/
│   ├── app-config.yaml           # Backstage configuration
│   └── catalog/                  # Catalog entities
│       ├── all.yaml
│       ├── components.yaml
│       ├── systems.yaml
│       └── templates/
│           └── score-workload.yaml
├── score-service/
│   ├── server.js                 # Main service
│   ├── healthcheck.js            # Health check
│   ├── package.json              # Dependencies
│   ├── config/
│   │   └── service.yaml          # Service config
│   └── plugins/                  # Plugin directory
│       └── example-plugin.js
├── plugin-manager/
│   ├── server.js                 # Main service
│   ├── healthcheck.js
│   └── package.json
├── gateway/
│   ├── nginx.conf                # NGINX config
│   └── api-docs/
│       └── index.html            # API documentation
├── postgres/
│   └── init/
│       └── 01-init-databases.sh  # DB initialization
├── docker-compose.yml            # Service definitions
├── docker-compose.override.yml   # Development overrides
└── .env                          # Environment variables
```

## Promotion to Kubernetes

The architecture is designed for easy Kubernetes promotion:

### Service → Deployment

Each service becomes a Kubernetes Deployment with:

- ReplicaSet for scaling
- ConfigMaps for configuration
- Secrets for credentials
- PersistentVolumeClaims for storage

### Gateway → Ingress

NGINX Gateway becomes Kubernetes Ingress with:

- Ingress rules for routing
- TLS termination
- Path-based routing

### Network → Service Mesh

Docker network becomes:

- Kubernetes Services for discovery
- Service mesh (Istio/Linkerd) for mTLS
- Network policies for isolation

See [KUBERNETES.md](KUBERNETES.md) for detailed migration guide.

## Scalability Considerations

### Horizontal Scaling

Services that can be scaled horizontally:

- ✅ Backstage (stateless)
- ✅ Score Service (stateless, shared DB)
- ⚠️ Eclipse Che (requires orchestration)
- ⚠️ Plugin Manager (coordination needed)
- ❌ PostgreSQL (requires replication setup)

### Performance Bottlenecks

- Database: Use connection pooling, read replicas
- Score Service: Scale to multiple instances
- Gateway: Use CDN for static content
- Che: Workspace limit per instance

### Resource Requirements

| Service        | CPU (min) | Memory (min) | Storage             |
| -------------- | --------- | ------------ | ------------------- |
| Backstage      | 0.5 core  | 512 MB       | None                |
| Score Service  | 0.25 core | 256 MB       | Minimal             |
| Eclipse Che    | 1 core    | 1 GB         | Workspace-dependent |
| Plugin Manager | 0.1 core  | 128 MB       | Minimal             |
| PostgreSQL     | 0.5 core  | 512 MB       | 10+ GB              |
| Gateway        | 0.1 core  | 64 MB        | None                |

**Total Minimum**: 2.5 cores, 2.5 GB RAM, 10 GB storage
**Recommended**: 4+ cores, 4+ GB RAM, 50+ GB storage
