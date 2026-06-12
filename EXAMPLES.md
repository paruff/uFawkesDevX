# Examples

This document provides practical examples of using the Developer Control Plane.

## Example 1: Deploy a Simple Application

### Step 1: Create a Score Specification

```bash
curl -X POST http://localhost:8081/api/v1/specs \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "score.dev/v1b1",
    "metadata": {
      "name": "hello-world",
      "annotations": {
        "team": "platform",
        "env": "dev"
      }
    },
    "containers": {
      "web": {
        "image": "nginx:alpine",
        "variables": {
          "PORT": "8080"
        }
      }
    },
    "service": {
      "ports": {
        "http": {
          "port": 80,
          "targetPort": 8080,
          "protocol": "TCP"
        }
      }
    },
    "resources": {
      "requests": {
        "cpu": "100m",
        "memory": "128Mi"
      },
      "limits": {
        "cpu": "200m",
        "memory": "256Mi"
      }
    }
  }'
```

### Step 2: Trigger Deployment

```bash
curl -X POST http://localhost:8082/webhooks/pipeline/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "hello-world",
    "action": "deploy",
    "metadata": {
      "environment": "dev",
      "requestedBy": "developer@example.com"
    }
  }'
```

### Step 3: Check Deployment Status

```bash
curl http://localhost:8081/api/v1/pipelines/hello-world | jq
```

## Example 2: Create a Backstage Template for Score Workloads

The platform includes a pre-configured template. Access it via Backstage:

1. Open Backstage: http://localhost:7007
2. Navigate to "Create" section
3. Select "Deploy Score Workload" template
4. Fill in the form:
   - Name: my-service
   - Description: My awesome service
   - Image: nginx:latest
   - Replicas: 2
5. Click "Create"

The template will automatically:

- Create the Score specification
- Validate it
- Trigger the deployment pipeline

## Example 3: Install a Custom Plugin

### Create Plugin Files

```bash
# Create plugin directory
mkdir -p my-custom-plugin

# Create plugin manifest
cat > my-custom-plugin/plugin.json <<EOF
{
  "name": "my-custom-plugin",
  "version": "1.0.0",
  "type": "score",
  "description": "Custom validation and enhancement plugin",
  "extensionPoints": [
    "spec-validator",
    "pipeline-trigger"
  ],
  "config": {
    "enabled": true,
    "strict": false
  }
}
EOF

# Create plugin implementation
cat > my-custom-plugin/index.js <<EOF
module.exports = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'Custom validation and enhancement plugin',

  async validateSpec(spec) {
    const errors = [];

    // Check for required annotations
    if (!spec.metadata.annotations?.team) {
      errors.push('Missing required annotation: team');
    }

    if (!spec.metadata.annotations?.env) {
      errors.push('Missing required annotation: env');
    }

    // Check resource limits
    for (const [name, container] of Object.entries(spec.containers || {})) {
      if (!spec.resources?.limits) {
        errors.push(\`Container \${name} missing resource limits\`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  async onPipelineTrigger(workload, action, metadata) {
    console.log(\`Custom plugin: Processing \${action} for \${workload}\`);

    // Add custom pipeline logic here
    // For example, notify Slack, update JIRA, etc.
  }
};
EOF
```

### Install via API

```bash
# Copy plugin to the Score service plugins directory
docker compose cp my-custom-plugin/. score-service:/app/plugins/my-custom-plugin/

# Restart Score service to load the plugin
docker compose restart score-service

# Verify plugin is loaded
curl http://localhost:8081/api/v1/plugins | jq
```

### Or Install via Plugin Manager

```bash
curl -X POST http://localhost:8083/api/v1/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-plugin",
    "source": "local",
    "type": "score"
  }'
```

## Example 4: Webhook Integration

### Setup External CI/CD Integration

```bash
# From your CI/CD pipeline (e.g., GitHub Actions, Jenkins)
# Trigger deployment after successful build

curl -X POST http://platform.example.com:8000/webhooks/score/pipeline/trigger \
  -H "Content-Type: application/json" \
  -H "X-CI-Source: github-actions" \
  -d '{
    "workload": "api-service",
    "action": "deploy",
    "metadata": {
      "commit": "'"$COMMIT_SHA"'",
      "branch": "'"$BRANCH_NAME"'",
      "buildNumber": "'"$BUILD_NUMBER"'",
      "triggeredBy": "'"$GITHUB_ACTOR"'"
    }
  }'
```

### Custom Webhook Handler

Create a plugin to handle custom webhook events:

```javascript
// custom-webhook-plugin.js
module.exports = {
  name: "custom-webhook-handler",
  version: "1.0.0",

  async onWebhook(integration, event, payload) {
    if (integration === "github" && event === "push") {
      // Extract branch and commit info
      const branch = payload.ref.replace("refs/heads/", "");
      const commit = payload.after;

      // Auto-deploy main branch
      if (branch === "main") {
        console.log(`Auto-deploying commit ${commit}`);
        // Trigger deployment logic
      }
    }

    if (integration === "jira" && event === "issue_updated") {
      // Handle JIRA webhook
      console.log(`JIRA issue ${payload.issue.key} updated`);
    }
  },
};
```

## Example 5: Eclipse Che Workspace

### Create a Development Workspace

1. Access Che: http://localhost:8080
2. Click "Create Workspace"
3. Select a devfile or git repository
4. Wait for workspace to start
5. Access web-based IDE

### Using Che with Score Workloads

Create a devfile that references your Score workload:

```yaml
apiVersion: 1.0.0
metadata:
  name: my-app-workspace
components:
  - type: chePlugin
    id: ms-vscode/node-debug/latest
  - type: dockerimage
    alias: dev-tools
    image: node:18
    memoryLimit: 2Gi
    mountSources: true
    command: ["tail"]
    args: ["-f", "/dev/null"]
commands:
  - name: Deploy to Dev
    actions:
      - type: exec
        component: dev-tools
        command: |
          curl -X POST http://score-service:8081/api/v1/specs \
            -H "Content-Type: application/json" \
            -d @score.yaml
```

## Example 6: Query Catalog via Backstage API

```bash
# Get all components
curl http://localhost:7007/api/catalog/entities?filter=kind=Component | jq

# Get specific component
curl http://localhost:7007/api/catalog/entities/by-name/component/default/score-service | jq

# Search entities
curl http://localhost:7007/api/catalog/entities?filter=metadata.name=score-service | jq
```

## Example 7: Multi-Container Score Workload

```bash
curl -X POST http://localhost:8081/api/v1/specs \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "score.dev/v1b1",
    "metadata": {
      "name": "full-stack-app",
      "annotations": {
        "team": "engineering",
        "env": "dev"
      }
    },
    "containers": {
      "frontend": {
        "image": "myapp/frontend:latest",
        "variables": {
          "API_URL": "http://backend:8080"
        }
      },
      "backend": {
        "image": "myapp/backend:latest",
        "variables": {
          "DATABASE_URL": "${resources.db.connection_string}"
        }
      },
      "worker": {
        "image": "myapp/worker:latest",
        "variables": {
          "QUEUE_URL": "${resources.queue.url}"
        }
      }
    },
    "service": {
      "ports": {
        "http": {
          "port": 80,
          "targetPort": 3000,
          "protocol": "TCP"
        },
        "api": {
          "port": 8080,
          "targetPort": 8080,
          "protocol": "TCP"
        }
      }
    },
    "resources": {
      "db": {
        "type": "postgres"
      },
      "queue": {
        "type": "redis"
      }
    }
  }'
```

## Example 8: Monitoring and Observability

### View Pipeline History

```bash
# Get all pipeline runs
curl http://localhost:8081/api/v1/pipelines | jq

# Get pipelines for specific workload
curl http://localhost:8081/api/v1/pipelines/hello-world | jq

# Filter by status
curl http://localhost:8081/api/v1/pipelines | jq '.pipelines[] | select(.status=="completed")'
```

### View Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f score-service

# Follow logs with timestamps
docker compose logs -f --timestamps score-service

# Last 100 lines
docker compose logs --tail=100 score-service
```

## Example 9: Backup and Restore

### Backup Data

```bash
# Backup PostgreSQL databases
docker compose exec postgres pg_dump -U backstage backstage > backup-backstage.sql
docker compose exec postgres pg_dump -U backstage score > backup-score.sql

# Backup Score specifications
docker compose cp score-service:/app/specs ./backup-specs/

# Backup plugins
docker compose cp score-service:/app/plugins ./backup-plugins/
```

### Restore Data

```bash
# Restore databases
cat backup-backstage.sql | docker compose exec -T postgres psql -U backstage backstage
cat backup-score.sql | docker compose exec -T postgres psql -U backstage score

# Restore specifications
docker compose cp ./backup-specs/. score-service:/app/specs/

# Restore plugins
docker compose cp ./backup-plugins/. score-service:/app/plugins/
docker compose restart score-service
```

## Example 10: CI/CD Integration with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy with Score

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create Score Spec
        run: |
          curl -X POST ${{ secrets.PLATFORM_URL }}/api/score/specs \
            -H "Content-Type: application/json" \
            -d @score.yaml

      - name: Trigger Deployment
        run: |
          curl -X POST ${{ secrets.PLATFORM_URL }}/webhooks/score/pipeline/trigger \
            -H "Content-Type: application/json" \
            -d '{
              "workload": "my-app",
              "action": "deploy",
              "metadata": {
                "commit": "${{ github.sha }}",
                "branch": "${{ github.ref_name }}",
                "actor": "${{ github.actor }}"
              }
            }'

      - name: Wait for Deployment
        run: |
          sleep 30
          curl ${{ secrets.PLATFORM_URL }}/api/score/pipelines/my-app | jq
```

## Tips and Best Practices

1. **Always validate Score specs locally** before deploying
2. **Use annotations** for metadata and organizational purposes
3. **Implement custom validators** for organization-specific requirements
4. **Monitor pipeline runs** to catch issues early
5. **Use webhooks** for event-driven automation
6. **Version your Score specs** in git alongside your code
7. **Test plugins** in development before production
8. **Back up databases regularly**
9. **Use resource limits** to prevent resource exhaustion
10. **Document your workloads** in the Backstage catalog
