// Example plugin for Score Service
// Place custom plugins in the plugins directory

module.exports = {
  name: 'example-validator',
  version: '1.0.0',
  description: 'Example validation plugin',
  
  // Validate Score specification
  async validateSpec(spec) {
    // Add custom validation logic
    const errors = [];
    
    // Example: Check for required annotations
    if (!spec.metadata.annotations) {
      errors.push('Missing required annotations');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  // Handle pipeline trigger events
  async onPipelineTrigger(workload, action, metadata) {
    console.log(`Example plugin: Pipeline triggered for ${workload} with action ${action}`);
    // Add custom pipeline logic
  },
  
  // Handle webhook events
  async onWebhook(integration, event, payload) {
    console.log(`Example plugin: Webhook received from ${integration}: ${event}`);
    // Add custom webhook handling
  },
};
