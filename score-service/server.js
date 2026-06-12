const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const Ajv = require('ajv');
const YAML = require('yaml');
const fs = require('fs').promises;
const path = require('path');

// Initialize Express apps for API and Webhooks
const apiApp = express();
const webhookApp = express();

// Middleware
apiApp.use(cors());
apiApp.use(bodyParser.json());
apiApp.use(morgan('combined'));

webhookApp.use(cors());
webhookApp.use(bodyParser.json());
webhookApp.use(morgan('combined'));

// Configuration
const API_PORT = process.env.API_PORT || 8081;
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 8082;
const SPECS_DIR = process.env.SPECS_DIR || '/app/specs';
const PLUGINS_DIR = process.env.PLUGINS_DIR || '/app/plugins';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JSON Schema validator for Score specs
const ajv = new Ajv();
const scoreSchemaV1 = {
  type: 'object',
  required: ['apiVersion', 'metadata', 'containers'],
  properties: {
    apiVersion: { type: 'string', pattern: '^score\\.dev/v1b1$' },
    metadata: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', pattern: '^[a-z0-9-]+$' },
      },
    },
    containers: {
      type: 'object',
      minProperties: 1,
    },
    service: {
      type: 'object',
      properties: {
        ports: { type: 'object' },
      },
    },
    resources: { type: 'object' },
  },
};

const validateScore = ajv.compile(scoreSchemaV1);

// Plugin system
const plugins = new Map();

async function loadPlugins() {
  try {
    const files = await fs.readdir(PLUGINS_DIR);
    for (const file of files) {
      if (file.endsWith('.js')) {
        // Validate filename to prevent path traversal
        if (!/^[a-zA-Z0-9_-]+\.js$/.test(file)) {
          console.warn(`Skipping plugin with invalid filename: ${file}`);
          continue;
        }
        
        const pluginPath = path.join(PLUGINS_DIR, file);
        
        // Ensure the resolved path is still within PLUGINS_DIR
        const resolvedPath = path.resolve(pluginPath);
        const resolvedPluginDir = path.resolve(PLUGINS_DIR);
        if (!resolvedPath.startsWith(resolvedPluginDir)) {
          console.warn(`Skipping plugin outside plugins directory: ${file}`);
          continue;
        }
        
        try {
          const plugin = require(pluginPath);
          if (plugin.name && typeof plugin.name === 'string') {
            plugins.set(plugin.name, plugin);
            console.log(`Loaded plugin: ${plugin.name}`);
          } else {
            console.warn(`Plugin ${file} missing required 'name' property`);
          }
        } catch (error) {
          console.error(`Failed to load plugin ${file}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log('No plugins to load:', error.message);
  }
}

// Initialize database
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS score_specs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        spec JSONB NOT NULL,
        version INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_runs (
        id SERIAL PRIMARY KEY,
        workload VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

// REST API Routes

// Health check
apiApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'score-api' });
});

// List all Score specs
apiApp.get('/api/v1/specs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, version, status, created_at, updated_at FROM score_specs ORDER BY created_at DESC'
    );
    res.json({ specs: result.rows });
  } catch (error) {
    console.error('Error listing specs:', error);
    res.status(500).json({ error: 'Failed to list specs' });
  }
});

// Get a specific Score spec
apiApp.get('/api/v1/specs/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(
      'SELECT * FROM score_specs WHERE name = $1',
      [name]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spec not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting spec:', error);
    res.status(500).json({ error: 'Failed to get spec' });
  }
});

// Create or update a Score spec
apiApp.post('/api/v1/specs', async (req, res) => {
  try {
    const spec = req.body;
    
    // Validate the Score spec
    const valid = validateScore(spec);
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid Score specification',
        details: validateScore.errors,
      });
    }
    
    const name = spec.metadata.name;
    
    // Validate name to prevent path traversal
    if (!/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({
        error: 'Invalid workload name. Use only lowercase letters, numbers, and hyphens.',
      });
    }
    
    // Run validation plugins
    for (const [pluginName, plugin] of plugins) {
      if (plugin.validateSpec) {
        const validationResult = await plugin.validateSpec(spec);
        if (!validationResult.valid) {
          return res.status(400).json({
            error: `Plugin ${pluginName} validation failed`,
            details: validationResult.errors,
          });
        }
      }
    }
    
    // Save spec to database
    const result = await pool.query(
      `INSERT INTO score_specs (name, spec, status)
       VALUES ($1, $2, 'validated')
       ON CONFLICT (name)
       DO UPDATE SET spec = $2, version = score_specs.version + 1, updated_at = NOW(), status = 'validated'
       RETURNING *`,
      [name, JSON.stringify(spec)]
    );
    
    // Save spec to file system
    const specPath = path.join(SPECS_DIR, `${name}.yaml`);
    await fs.writeFile(specPath, YAML.stringify(spec));
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating spec:', error);
    res.status(500).json({ error: 'Failed to create spec' });
  }
});

// Delete a Score spec
apiApp.delete('/api/v1/specs/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(
      'DELETE FROM score_specs WHERE name = $1 RETURNING *',
      [name]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spec not found' });
    }
    
    // Delete spec file
    const specPath = path.join(SPECS_DIR, `${name}.yaml`);
    try {
      await fs.unlink(specPath);
    } catch (error) {
      console.log('Spec file not found:', error.message);
    }
    
    res.json({ message: 'Spec deleted', spec: result.rows[0] });
  } catch (error) {
    console.error('Error deleting spec:', error);
    res.status(500).json({ error: 'Failed to delete spec' });
  }
});

// List pipeline runs
apiApp.get('/api/v1/pipelines', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ pipelines: result.rows });
  } catch (error) {
    console.error('Error listing pipelines:', error);
    res.status(500).json({ error: 'Failed to list pipelines' });
  }
});

// Get pipeline run by workload
apiApp.get('/api/v1/pipelines/:workload', async (req, res) => {
  try {
    const { workload } = req.params;
    const result = await pool.query(
      'SELECT * FROM pipeline_runs WHERE workload = $1 ORDER BY created_at DESC',
      [workload]
    );
    res.json({ pipelines: result.rows });
  } catch (error) {
    console.error('Error getting pipeline runs:', error);
    res.status(500).json({ error: 'Failed to get pipeline runs' });
  }
});

// Webhook Routes

// Health check
webhookApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'score-webhooks' });
});

// Trigger pipeline webhook
webhookApp.post('/webhooks/pipeline/trigger', async (req, res) => {
  try {
    const { workload, action, metadata } = req.body;
    
    if (!workload || !action) {
      return res.status(400).json({ error: 'workload and action are required' });
    }
    
    // Create pipeline run
    const result = await pool.query(
      `INSERT INTO pipeline_runs (workload, action, status, metadata)
       VALUES ($1, $2, 'running', $3)
       RETURNING *`,
      [workload, action, JSON.stringify(metadata || {})]
    );
    
    const pipelineRun = result.rows[0];
    
    // Trigger plugins
    for (const [pluginName, plugin] of plugins) {
      if (plugin.onPipelineTrigger) {
        try {
          await plugin.onPipelineTrigger(workload, action, metadata);
        } catch (error) {
          console.error(`Plugin ${pluginName} trigger failed:`, error);
        }
      }
    }
    
    // Simulate pipeline execution (in real implementation, this would trigger actual pipeline)
    setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE pipeline_runs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [pipelineRun.id]
        );
      } catch (error) {
        console.error('Failed to update pipeline status:', error);
        // Attempt to mark as failed
        try {
          await pool.query(
            `UPDATE pipeline_runs SET status = 'failed', completed_at = NOW() WHERE id = $1`,
            [pipelineRun.id]
          );
        } catch (updateError) {
          console.error('Failed to mark pipeline as failed:', updateError);
        }
      }
    }, 5000);
    
    res.status(202).json({
      message: 'Pipeline triggered',
      pipelineRun,
    });
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    res.status(500).json({ error: 'Failed to trigger pipeline' });
  }
});

// Generic webhook endpoint for integrations
webhookApp.post('/webhooks/:integration/:event', async (req, res) => {
  try {
    const { integration, event } = req.params;
    const payload = req.body;
    
    console.log(`Webhook received: ${integration}/${event}`, payload);
    
    // Trigger integration plugins
    for (const [pluginName, plugin] of plugins) {
      if (plugin.onWebhook) {
        try {
          await plugin.onWebhook(integration, event, payload);
        } catch (error) {
          console.error(`Plugin ${pluginName} webhook failed:`, error);
        }
      }
    }
    
    res.json({ message: 'Webhook received', integration, event });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Plugin management routes
apiApp.get('/api/v1/plugins', (req, res) => {
  const pluginList = Array.from(plugins.values()).map(p => ({
    name: p.name,
    version: p.version,
    description: p.description,
  }));
  res.json({ plugins: pluginList });
});

// Extension point: Custom routes can be added by plugins
apiApp.get('/api/v1/extensions', (req, res) => {
  res.json({
    message: 'Extension points available',
    endpoints: [
      '/api/v1/specs - Score specification management',
      '/api/v1/pipelines - Pipeline run management',
      '/api/v1/plugins - Plugin information',
      '/webhooks/pipeline/trigger - Pipeline trigger webhook',
      '/webhooks/:integration/:event - Generic webhook endpoint',
    ],
  });
});

// Start servers
async function start() {
  try {
    await initDatabase();
    await loadPlugins();
    
    apiApp.listen(API_PORT, () => {
      console.log(`Score API server listening on port ${API_PORT}`);
    });
    
    webhookApp.listen(WEBHOOK_PORT, () => {
      console.log(`Score Webhook server listening on port ${WEBHOOK_PORT}`);
    });
  } catch (error) {
    console.error('Failed to start services:', error);
    process.exit(1);
  }
}

start();
