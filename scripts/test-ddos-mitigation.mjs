import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createMitigationEngine } from '../src/security/ddos-gpt-doug-palantir.mjs';

class FakeResponse extends EventEmitter {
  constructor() {
    super();
    this.headers = new Map();
    this.statusCode = 200;
    this.body = '';
  }

  setHeader(name, value) {
    this.headers.set(String(name).toLowerCase(), String(value));
  }

  end(body = '') {
    this.body = String(body);
    this.emit('finish');
  }
}

function request(url, { method = 'GET', contentLength = 0 } = {}) {
  return {
    url,
    method,
    headers: contentLength ? { 'content-length': String(contentLength) } : {},
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function execute(engine, req) {
  const res = new FakeResponse();
  let passed = false;
  engine.middleware(req, res, () => {
    passed = true;
    res.emit('finish');
  });
  return { res, passed };
}

const originalWarn = console.warn;
console.warn = () => {};

try {
  const engine = createMitigationEngine({
    XUNIA_DDOS_API_MAX: '10',
    XUNIA_DDOS_GLOBAL_MAX: '100',
    XUNIA_DDOS_BLOCK_MS: '1000',
    XUNIA_DDOS_MAX_API_BODY_BYTES: '1024',
  });

  const staticResult = execute(engine, request('/assets/globe.js'));
  assert.equal(staticResult.passed, true, 'static assets must bypass application API throttling');

  for (let i = 0; i < 10; i += 1) {
    const result = execute(engine, request('/api/earthquakes'));
    assert.equal(result.passed, true, `API request ${i + 1} should pass within the configured window`);
  }

  const limited = execute(engine, request('/api/earthquakes'));
  assert.equal(limited.passed, false, 'request above the per-client API limit must be blocked');
  assert.equal(limited.res.statusCode, 429);
  assert.match(limited.res.body, /client_api_rate_limit/);

  const freshEngine = createMitigationEngine({ XUNIA_DDOS_MAX_API_BODY_BYTES: '1024' });
  const oversized = execute(freshEngine, request('/api/overpass', { method: 'POST', contentLength: 2048 }));
  assert.equal(oversized.passed, false, 'oversized API bodies must be rejected before proxy handling');
  assert.equal(oversized.res.statusCode, 413);

  const trace = execute(freshEngine, request('/api/earthquakes', { method: 'TRACE' }));
  assert.equal(trace.passed, false, 'TRACE must not reach application middleware');
  assert.equal(trace.res.statusCode, 405);

  const status = execute(freshEngine, request('/api/xunia/ddos/status'));
  assert.equal(status.res.statusCode, 200);
  const statusBody = JSON.parse(status.res.body);
  assert.equal(statusBody.status, 'active');
  assert.equal(statusBody.upstreamEdgeRequiredForVolumetricDDoS, true);

  console.log('DDOS-GPT-DOUG-LLM-PALANTIR mitigation tests passed');
} finally {
  console.warn = originalWarn;
}
