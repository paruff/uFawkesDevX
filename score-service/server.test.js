const test = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const execFileAsync = promisify(execFile);

// server.js reads env vars (PIPELINE_WEBHOOK_URL, SPECS_DIR) at module load
// time, so each test that needs a specific value sets it before requiring
// a fresh copy of the module.
function freshServerModule(env) {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
  delete require.cache[require.resolve('./server.js')];
  return require('./server.js');
}

test('triggerPipelineWebhook posts workload/action/metadata as JSON and does not throw on success', async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    const { triggerPipelineWebhook } = freshServerModule({
      PIPELINE_WEBHOOK_URL: 'http://pipe.example/webhooks/trigger',
    });

    await triggerPipelineWebhook('my-workload', 'spec-updated', { version: 3 });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://pipe.example/webhooks/trigger');
    assert.equal(calls[0].options.method, 'POST');
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.workload, 'my-workload');
    assert.equal(body.action, 'spec-updated');
    assert.deepEqual(body.metadata, { version: 3 });
  } finally {
    global.fetch = originalFetch;
  }
});

test('triggerPipelineWebhook does not throw when the target is unreachable', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('ECONNREFUSED');
  };

  try {
    const { triggerPipelineWebhook } = freshServerModule({
      PIPELINE_WEBHOOK_URL: 'http://unreachable.example/webhooks/trigger',
    });

    await assert.doesNotReject(() => triggerPipelineWebhook('wl', 'spec-updated', {}));
  } finally {
    global.fetch = originalFetch;
  }
});

test('triggerPipelineWebhook is a no-op when PIPELINE_WEBHOOK_URL is unset', async () => {
  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 200 };
  };

  try {
    const { triggerPipelineWebhook } = freshServerModule({ PIPELINE_WEBHOOK_URL: '' });
    await triggerPipelineWebhook('wl', 'spec-updated', {});
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('generateComposeFromSpec runs score-compose and returns the generated manifest', async (t) => {
  try {
    await execFileAsync('score-compose', ['--version']);
  } catch {
    t.skip('score-compose CLI not installed on this machine');
    return;
  }

  const specsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'score-specs-'));
  const specPath = path.join(specsDir, 'demo.yaml');
  await fs.writeFile(
    specPath,
    [
      'apiVersion: score.dev/v1b1',
      'metadata:',
      '  name: demo',
      'containers:',
      '  main:',
      '    image: nginx:latest',
      '',
    ].join('\n')
  );

  const { generateComposeFromSpec } = freshServerModule({ SPECS_DIR: specsDir });

  const { outputPath, compose } = await generateComposeFromSpec('demo', specPath);

  assert.ok(await fs.access(outputPath).then(() => true, () => false));
  assert.match(compose, /nginx:latest/);
});

test('SQLite store: upsert bumps version, JSON columns round-trip as objects, RETURNING works', async () => {
  const { initDatabase, query } = freshServerModule({ DATABASE_PATH: ':memory:' });
  await initDatabase();

  const upsert = `INSERT INTO score_specs (name, spec, status) VALUES (?, ?, 'validated')
    ON CONFLICT (name) DO UPDATE SET spec = excluded.spec, version = score_specs.version + 1,
    updated_at = CURRENT_TIMESTAMP, status = 'validated' RETURNING *`;
  const first = query(upsert, ['web', JSON.stringify({ a: 1 })]).rows[0];
  const second = query(upsert, ['web', JSON.stringify({ a: 2 })]).rows[0];
  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.deepEqual(second.spec, { a: 2 });

  const run = query(
    `INSERT INTO pipeline_runs (workload, action, status, metadata) VALUES (?, ?, 'running', ?) RETURNING *`,
    ['web', 'deploy', JSON.stringify({ k: 'v' })]
  ).rows[0];
  assert.deepEqual(run.metadata, { k: 'v' });

  const deleted = query('DELETE FROM score_specs WHERE name = ? RETURNING *', ['web']).rows;
  assert.equal(deleted.length, 1);
  assert.equal(query('SELECT * FROM score_specs WHERE name = ?', ['web']).rows.length, 0);
});

test('loadPlugins ignores plugin filenames that resolve outside the plugins directory', async () => {
  const { loadPlugins } = freshServerModule({
    PLUGINS_DIR: '/tmp/score-plugins-test',
  });

  const pluginsDir = '/tmp/score-plugins-test';
  const privilegedDir = '/tmp';
  await fs.mkdir(pluginsDir, { recursive: true });
  await fs.mkdir(privilegedDir, { recursive: true });

  const pluginPath = path.join(pluginsDir, 'good.js');
  await fs.writeFile(pluginPath, 'module.exports = { name: "good", validateSpec: () => ({ valid: true }) };');

  const escapeName = '../escape.js';
  const escapePath = path.join(pluginsDir, escapeName);
  await fs.writeFile(escapePath, 'module.exports = { name: "escape", validateSpec: () => ({ valid: true }) };');

  await loadPlugins();

  assert.ok((await fs.readFile(pluginPath, 'utf8')).includes('good'));
  const pluginNames = Array.from(require.cache[require.resolve('./server.js')].exports || {}).map(([name]) => name);
  assert.ok(!pluginNames.includes('escape'));
});
