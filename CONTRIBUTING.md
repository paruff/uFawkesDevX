# Contributing to Developer Control Plane

Thank you for your interest in contributing! This guide will help you extend and customize the platform.

## Ways to Contribute

1. **Create Custom Plugins** - Extend Score service, Backstage, or Che
2. **Add Features** - Enhance existing services
3. **Improve Documentation** - Help others understand and use the platform
4. **Report Issues** - Help identify bugs and improvements
5. **Share Templates** - Create reusable Backstage templates

## Creating Custom Plugins

### Score Service Plugin

Create a new plugin file in `score-service/plugins/`:

```javascript
// my-custom-plugin.js
module.exports = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My custom validation and automation plugin',
  
  // Validate Score specifications
  async validateSpec(spec) {
    const errors = [];
    
    // Add your validation logic
    if (!spec.metadata.annotations?.owner) {
      errors.push('Missing required annotation: owner');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Handle pipeline triggers
  async onPipelineTrigger(workload, action, metadata) {
    console.log(`Processing ${action} for ${workload}`);
    
    // Add your automation logic
    // Examples:
    // - Send notifications
    // - Update external systems
    // - Trigger additional workflows
  },
  
  // Handle webhook events
  async onWebhook(integration, event, payload) {
    console.log(`Received webhook: ${integration}/${event}`);
    
    // Process webhook payload
    // Examples:
    // - GitHub push events
    // - JIRA updates
    // - External system notifications
  }
};
```

**Testing Your Plugin**:
```bash
# Restart Score service to load plugin
docker compose restart score-service

# Verify plugin is loaded
curl http://localhost:8081/api/v1/plugins | jq

# Test validation with a spec
curl -X POST http://localhost:8081/api/v1/specs \
  -H "Content-Type: application/json" \
  -d @test-spec.yaml
```

### Backstage Plugin

Add custom Backstage plugins by mounting them into the container:

```yaml
# In docker-compose.yml
backstage:
  volumes:
    - ./backstage-plugins/my-plugin:/app/plugins/my-plugin
```

Create plugin following [Backstage plugin development guide](https://backstage.io/docs/plugins/create-a-plugin).

### Plugin Best Practices

1. **Error Handling**: Always catch and log errors
2. **Validation**: Validate all inputs
3. **Logging**: Use structured logging
4. **Documentation**: Document your plugin's purpose and usage
5. **Testing**: Test thoroughly before deploying
6. **Security**: Never expose sensitive information
7. **Performance**: Avoid blocking operations

## Adding Features to Services

### Modifying Score Service

1. **Edit the code**:
```bash
# Edit service
vi score-service/server.js

# Or use a dev environment
docker compose exec score-service sh
```

2. **Add new endpoint**:
```javascript
// In score-service/server.js
apiApp.get('/api/v1/custom-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ message: 'Custom endpoint' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
```

3. **Rebuild and test**:
```bash
docker compose build score-service
docker compose up -d score-service
curl http://localhost:8081/api/v1/custom-endpoint
```

### Modifying Plugin Manager

Similar process to Score Service. Edit `plugin-manager/server.js` and rebuild.

### Modifying API Gateway

Edit `gateway/nginx.conf` to add new routes:

```nginx
# Add to server block in gateway/nginx.conf
location /custom-route/ {
    proxy_pass http://score-service:8081/api/v1/custom/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Restart gateway:
```bash
docker compose restart gateway
```

## Creating Backstage Templates

Create reusable templates in `backstage/catalog/templates/`:

```yaml
# my-template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: my-service-template
  title: My Service Template
  description: Deploy my custom service type
  tags:
    - custom
    - service
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Service Information
      required:
        - name
        - owner
      properties:
        name:
          title: Name
          type: string
          pattern: '^[a-z0-9-]+$'
        owner:
          title: Owner
          type: string
  
  steps:
    - id: create-spec
      name: Create Score Specification
      action: http:post
      input:
        url: http://score-service:8081/api/v1/specs
        method: POST
        body:
          apiVersion: score.dev/v1b1
          metadata:
            name: ${{ parameters.name }}
            annotations:
              owner: ${{ parameters.owner }}
          containers:
            app:
              image: my-app:latest
    
    - id: trigger-pipeline
      name: Deploy
      action: http:post
      input:
        url: http://score-service:8082/webhooks/pipeline/trigger
        body:
          workload: ${{ parameters.name }}
          action: deploy
  
  output:
    links:
      - title: View Service
        url: http://localhost:8081/specs/${{ parameters.name }}
```

Register template in `backstage/catalog/all.yaml`:
```yaml
spec:
  targets:
    - ./templates/my-template.yaml
```

## Testing Your Changes

### Unit Testing

For JavaScript services, add tests:

```javascript
// score-service/__tests__/validation.test.js
const { validateScore } = require('../server.js');

describe('Score Validation', () => {
  test('valid spec passes', () => {
    const spec = {
      apiVersion: 'score.dev/v1b1',
      metadata: { name: 'test' },
      containers: { app: { image: 'nginx' } }
    };
    
    const valid = validateScore(spec);
    expect(valid).toBe(true);
  });
});
```

Run tests:
```bash
cd score-service
npm install --dev jest
npm test
```

### Integration Testing

Use the provided test script:
```bash
./test-platform.sh
```

Or create custom tests:
```bash
# Test new endpoint
curl -X POST http://localhost:8081/api/v1/custom-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq
```

### Load Testing

For performance testing:
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test endpoint
ab -n 1000 -c 10 http://localhost:8081/api/v1/specs
```

## Code Style

### JavaScript

- Use 2-space indentation
- Use semicolons
- Use async/await (not callbacks)
- Handle all errors
- Add JSDoc comments for functions

```javascript
/**
 * Validates a Score specification
 * @param {Object} spec - The Score specification to validate
 * @returns {Object} Validation result with valid flag and errors
 */
async function validateSpec(spec) {
  // Implementation
}
```

### YAML

- Use 2-space indentation
- Quote strings with special characters
- Add comments for complex sections

### Shell Scripts

- Use bash
- Add shebang: `#!/bin/bash`
- Set error handling: `set -e`
- Add comments

## Documentation

When adding features:

1. **Update README.md** if it affects getting started
2. **Update ARCHITECTURE.md** for architectural changes
3. **Update EXAMPLES.md** with usage examples
4. **Update API documentation** in `gateway/api-docs/index.html`
5. **Add inline comments** for complex logic

## Submitting Changes

While this is currently a standalone project, if you're extending it:

1. **Test thoroughly** - Use the test script
2. **Document changes** - Update relevant docs
3. **Follow conventions** - Match existing code style
4. **Security check** - Review SECURITY.md guidelines
5. **Validate configs** - Run validation checks

## Development Environment

### Setting Up for Development

```bash
# Clone repository
git clone https://github.com/paruff/developerd.git
cd developerd

# Copy environment file
cp .env.example .env

# Start services
docker compose up -d

# View logs
docker compose logs -f
```

### Hot Reload for Development

Enable hot reload in `docker-compose.override.yml`:

```yaml
services:
  score-service:
    volumes:
      - ./score-service:/app
      - /app/node_modules
    command: npm run dev
```

### Debugging

Enable debug logging:
```bash
# In .env
LOG_LEVEL=debug
NODE_ENV=development
```

View detailed logs:
```bash
docker compose logs -f score-service
```

Access service shell:
```bash
docker compose exec score-service sh
```

## Common Development Tasks

### Add New Database Table

1. Create migration script in `postgres/init/`:
```sql
-- 02-add-custom-table.sql
CREATE TABLE IF NOT EXISTS custom_data (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. Rebuild database:
```bash
docker compose down postgres
docker volume rm developerd_postgres-data
docker compose up -d postgres
```

### Add New Service

1. Create service directory:
```bash
mkdir my-service
```

2. Add Dockerfile, package.json, server.js

3. Add to docker-compose.yml:
```yaml
services:
  my-service:
    build:
      context: ./my-service
    ports:
      - "8084:8084"
    networks:
      - control-plane
```

4. Add route to gateway if needed

### Change Service Port

1. Update `.env`:
```bash
SCORE_API_PORT=8085
```

2. Update docker-compose.yml if using hardcoded port

3. Restart:
```bash
docker compose up -d
```

## Troubleshooting Development Issues

### Service won't start
```bash
# Check logs
docker compose logs <service>

# Rebuild
docker compose build <service>
docker compose up -d <service>
```

### Database issues
```bash
# Reset database
docker compose down
docker volume rm developerd_postgres-data
docker compose up -d
```

### Port conflicts
```bash
# Change port in .env
SCORE_API_PORT=8090

# Restart
docker compose up -d
```

### Permission issues
```bash
# Fix file permissions
chmod +x test-platform.sh
chmod 755 score-service/plugins/
```

## Resources

- [Backstage Documentation](https://backstage.io/docs)
- [Score Specification](https://score.dev)
- [Eclipse Che Documentation](https://eclipse.dev/che/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [NGINX Configuration](https://nginx.org/en/docs/)
- [Express.js Guide](https://expressjs.com/)

## Getting Help

- Read the [Architecture](ARCHITECTURE.md) document
- Check [Examples](EXAMPLES.md) for usage patterns
- Review [Quick Reference](QUICK-REFERENCE.md) for commands
- Look at existing plugins for examples

## License

See LICENSE file for details.
