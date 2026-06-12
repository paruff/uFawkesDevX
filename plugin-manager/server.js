const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const Ajv = require('ajv');

const execAsync = promisify(exec);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Configuration
const API_PORT = process.env.API_PORT || 8083;
const PLUGIN_DIR = process.env.PLUGIN_DIR || '/plugins';

// Plugin registry
const plugins = new Map();

// Plugin schema validator
const ajv = new Ajv();
const pluginSchema = {
  type: 'object',
  required: ['name', 'version', 'type'],
  properties: {
    name: { type: 'string', pattern: '^[a-z0-9-]+$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    type: { enum: ['backstage', 'score', 'che', 'platform'] },
    description: { type: 'string' },
    extensionPoints: {
      type: 'array',
      items: { type: 'string' },
    },
    dependencies: {
      type: 'object',
    },
    config: { type: 'object' },
  },
};

const validatePlugin = ajv.compile(pluginSchema);

// Load plugins from directory
async function loadPlugins() {
  try {
    const entries = await fs.readdir(PLUGIN_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(PLUGIN_DIR, entry.name);
        const manifestPath = path.join(pluginPath, 'plugin.json');
        
        try {
          const manifestData = await fs.readFile(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestData);
          
          if (validatePlugin(manifest)) {
            plugins.set(manifest.name, {
              ...manifest,
              path: pluginPath,
              enabled: true,
            });
            console.log(`Loaded plugin: ${manifest.name} v${manifest.version}`);
          } else {
            console.error(`Invalid plugin manifest: ${entry.name}`, validatePlugin.errors);
          }
        } catch (error) {
          console.error(`Failed to load plugin ${entry.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log('No plugins directory or plugins to load:', error.message);
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'plugin-manager' });
});

// List all plugins
app.get('/api/v1/plugins', (req, res) => {
  const pluginList = Array.from(plugins.values()).map(p => ({
    name: p.name,
    version: p.version,
    type: p.type,
    description: p.description,
    enabled: p.enabled,
    extensionPoints: p.extensionPoints || [],
  }));
  res.json({ plugins: pluginList });
});

// Get specific plugin
app.get('/api/v1/plugins/:name', (req, res) => {
  const { name } = req.params;
  const plugin = plugins.get(name);
  
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  
  res.json(plugin);
});

// Install a plugin
app.post('/api/v1/plugins', async (req, res) => {
  try {
    const { name, source, type } = req.body;
    
    if (!name || !source) {
      return res.status(400).json({ error: 'name and source are required' });
    }
    
    // Check if plugin already exists
    if (plugins.has(name)) {
      return res.status(409).json({ error: 'Plugin already installed' });
    }
    
    const pluginPath = path.join(PLUGIN_DIR, name);
    
    // Create plugin directory
    await fs.mkdir(pluginPath, { recursive: true });
    
    // Download or copy plugin (simplified - in production would handle various sources)
    console.log(`Installing plugin ${name} from ${source}`);
    
    // Create a basic plugin manifest
    const manifest = {
      name,
      version: '1.0.0',
      type: type || 'platform',
      description: `Plugin ${name}`,
      extensionPoints: [],
      installedAt: new Date().toISOString(),
    };
    
    await fs.writeFile(
      path.join(pluginPath, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    plugins.set(name, { ...manifest, path: pluginPath, enabled: true });
    
    res.status(201).json({ message: 'Plugin installed', plugin: manifest });
  } catch (error) {
    console.error('Error installing plugin:', error);
    res.status(500).json({ error: 'Failed to install plugin' });
  }
});

// Update a plugin
app.put('/api/v1/plugins/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled, config } = req.body;
    
    const plugin = plugins.get(name);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Update plugin settings
    if (typeof enabled === 'boolean') {
      plugin.enabled = enabled;
    }
    
    if (config) {
      plugin.config = { ...plugin.config, ...config };
    }
    
    // Save updated manifest
    const manifestPath = path.join(plugin.path, 'plugin.json');
    await fs.writeFile(manifestPath, JSON.stringify(plugin, null, 2));
    
    plugins.set(name, plugin);
    
    res.json({ message: 'Plugin updated', plugin });
  } catch (error) {
    console.error('Error updating plugin:', error);
    res.status(500).json({ error: 'Failed to update plugin' });
  }
});

// Uninstall a plugin
app.delete('/api/v1/plugins/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const plugin = plugins.get(name);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Validate that plugin.path is within PLUGIN_DIR to prevent directory traversal
    const resolvedPath = path.resolve(plugin.path);
    const resolvedPluginDir = path.resolve(PLUGIN_DIR);
    if (!resolvedPath.startsWith(resolvedPluginDir)) {
      return res.status(400).json({ error: 'Invalid plugin path' });
    }
    
    // Remove plugin directory
    await fs.rm(plugin.path, { recursive: true, force: true });
    
    plugins.delete(name);
    
    res.json({ message: 'Plugin uninstalled', name });
  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    res.status(500).json({ error: 'Failed to uninstall plugin' });
  }
});

// List available extension points
app.get('/api/v1/extension-points', (req, res) => {
  const extensionPoints = {
    backstage: [
      {
        name: 'catalog-entity-provider',
        description: 'Provide custom catalog entities',
        interface: 'EntityProvider',
      },
      {
        name: 'scaffolder-action',
        description: 'Custom scaffolder actions',
        interface: 'ScaffolderAction',
      },
    ],
    score: [
      {
        name: 'spec-validator',
        description: 'Validate Score specifications',
        interface: 'validateSpec(spec) => { valid, errors }',
      },
      {
        name: 'pipeline-trigger',
        description: 'Handle pipeline trigger events',
        interface: 'onPipelineTrigger(workload, action, metadata)',
      },
      {
        name: 'webhook-handler',
        description: 'Handle incoming webhooks',
        interface: 'onWebhook(integration, event, payload)',
      },
    ],
    che: [
      {
        name: 'workspace-configurator',
        description: 'Configure workspace templates',
        interface: 'WorkspaceConfigurator',
      },
    ],
    platform: [
      {
        name: 'auth-provider',
        description: 'Custom authentication providers',
        interface: 'AuthProvider',
      },
      {
        name: 'metrics-collector',
        description: 'Collect custom metrics',
        interface: 'MetricsCollector',
      },
    ],
  };
  
  res.json({ extensionPoints });
});

// Get plugins by extension point
app.get('/api/v1/extension-points/:type/:point', (req, res) => {
  const { type, point } = req.params;
  
  const matchingPlugins = Array.from(plugins.values())
    .filter(p => p.type === type && p.extensionPoints?.includes(point))
    .map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      enabled: p.enabled,
    }));
  
  res.json({ extensionPoint: `${type}:${point}`, plugins: matchingPlugins });
});

// Start server
async function start() {
  try {
    await loadPlugins();
    
    app.listen(API_PORT, () => {
      console.log(`Plugin Manager listening on port ${API_PORT}`);
      console.log(`Loaded ${plugins.size} plugins`);
    });
  } catch (error) {
    console.error('Failed to start Plugin Manager:', error);
    process.exit(1);
  }
}

start();
