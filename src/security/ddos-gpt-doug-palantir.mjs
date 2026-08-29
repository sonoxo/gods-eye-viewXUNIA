import { createHash } from 'node:crypto';

const CONTROL_ID = 'DDOS-GPT-DOUG-LLM-PALANTIR';
const SCHEMA_VERSION = 1;

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '').split(',')[0].trim();
}

function clientIdentity(req, trustProxy) {
  const socketAddress = req.socket?.remoteAddress || 'unknown';
  if (!trustProxy) return socketAddress;

  return (
    firstHeaderValue(req.headers['cf-connecting-ip']) ||
    firstHeaderValue(req.headers['x-real-ip']) ||
    firstHeaderValue(req.headers['x-forwarded-for']) ||
    socketAddress
  );
}

function privacyKey(identity) {
  return createHash('sha256').update(String(identity)).digest('hex').slice(0, 20);
}

function routeClass(url = '') {
  const path = String(url).split('?')[0];
  if (
    path.startsWith('/api/realtime/') ||
    path.startsWith('/api/openai/') ||
    path.startsWith('/api/google/')
  ) {
    return 'cost-sensitive-api';
  }
  if (path.startsWith('/api/')) return 'api';
  return 'static';
}

function setSecurityHeaders(res) {
  res.setHeader('X-XUNIA-DDoS-Control', CONTROL_ID);
  res.setHeader('Cache-Control', 'no-store');
}

export function createMitigationEngine(env = process.env) {
  const trustProxy =
    env.XUNIA_DDOS_TRUST_PROXY === '1' ||
    Boolean(env.REPL_ID) ||
    Boolean(env.REPL_SLUG);

  const limits = {
    globalWindowMs: boundedInt(env.XUNIA_DDOS_GLOBAL_WINDOW_MS, 10_000, 1_000, 60_000),
    globalMax: boundedInt(env.XUNIA_DDOS_GLOBAL_MAX, 1_200, 50, 100_000),
    apiWindowMs: boundedInt(env.XUNIA_DDOS_API_WINDOW_MS, 10_000, 1_000, 60_000),
    apiMax: boundedInt(env.XUNIA_DDOS_API_MAX, 80, 10, 10_000),
    costWindowMs: boundedInt(env.XUNIA_DDOS_COST_WINDOW_MS, 60_000, 5_000, 300_000),
    costMax: boundedInt(env.XUNIA_DDOS_COST_MAX, 20, 2, 2_000),
    maxClientConcurrent: boundedInt(env.XUNIA_DDOS_CLIENT_CONCURRENT_MAX, 24, 2, 1_000),
    maxGlobalConcurrent: boundedInt(env.XUNIA_DDOS_GLOBAL_CONCURRENT_MAX, 300, 10, 20_000),
    blockMs: boundedInt(env.XUNIA_DDOS_BLOCK_MS, 30_000, 1_000, 600_000),
    maxApiBodyBytes: boundedInt(env.XUNIA_DDOS_MAX_API_BODY_BYTES, 1_048_576, 1_024, 50_000_000),
    maxTrackedClients: boundedInt(env.XUNIA_DDOS_MAX_TRACKED_CLIENTS, 10_000, 100, 100_000),
  };

  const clients = new Map();
  let globalWindowStart = Date.now();
  let globalWindowCount = 0;
  let globalActive = 0;
  let blockedTotal = 0;
  let acceptedApiTotal = 0;
  let lastBlockAt = null;
  const recentEvents = [];

  function audit(event) {
    const record = {
      schemaVersion: SCHEMA_VERSION,
      ontologyCandidateType: 'MissionAssetSecurityEvent',
      missionAssetId: env.XUNIA_MISSION_ASSET_ID || 'xunia-glass-onion',
      controlId: CONTROL_ID,
      source: 'gods-eye-viewXUNIA',
      authoritative: false,
      timestamp: new Date().toISOString(),
      ...event,
    };

    recentEvents.push(record);
    if (recentEvents.length > 100) recentEvents.shift();
    console.warn(`[XUNIA_SECURITY_AUDIT] ${JSON.stringify(record)}`);
  }

  function stateFor(clientKey, now) {
    let state = clients.get(clientKey);
    if (!state) {
      state = {
        apiWindowStart: now,
        apiCount: 0,
        costWindowStart: now,
        costCount: 0,
        active: 0,
        blockedUntil: 0,
        lastSeen: now,
      };
      clients.set(clientKey, state);
    }
    state.lastSeen = now;
    return state;
  }

  function rotateWindow(state, now, startKey, countKey, windowMs) {
    if (now - state[startKey] >= windowMs) {
      state[startKey] = now;
      state[countKey] = 0;
    }
  }

  function sweep(now) {
    if (clients.size <= limits.maxTrackedClients) return;
    const cutoff = now - Math.max(limits.costWindowMs, limits.blockMs) * 2;
    for (const [key, state] of clients) {
      if (state.active === 0 && state.lastSeen < cutoff) clients.delete(key);
      if (clients.size <= limits.maxTrackedClients) break;
    }
  }

  function block(res, statusCode, reason, clientKey, category, retryAfterSeconds = 1) {
    blockedTotal += 1;
    lastBlockAt = new Date().toISOString();
    setSecurityHeaders(res);
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil(retryAfterSeconds))));
    res.end(JSON.stringify({
      error: 'request_throttled',
      controlId: CONTROL_ID,
      reason,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterSeconds)),
    }));
    audit({
      eventType: 'APPLICATION_DDOS_MITIGATION',
      decision: 'BLOCK',
      reason,
      clientKey,
      routeClass: category,
      statusCode,
    });
  }

  function middleware(req, res, next) {
    const now = Date.now();
    const category = routeClass(req.url);

    if (req.url?.split('?')[0] === '/api/xunia/ddos/status') {
      setSecurityHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        controlId: CONTROL_ID,
        mode: 'application-layer-mitigation',
        status: 'active',
        blockedTotal,
        acceptedApiTotal,
        activeRequests: globalActive,
        trackedClientKeys: clients.size,
        lastBlockAt,
        palantirTelemetry: 'candidate-schema-local-audit',
        upstreamEdgeRequiredForVolumetricDDoS: true,
      }));
      return;
    }

    if (category === 'static') {
      next();
      return;
    }

    if (req.method === 'TRACE' || req.method === 'CONNECT') {
      const key = privacyKey(clientIdentity(req, trustProxy));
      block(res, 405, 'method_not_allowed', key, category, 60);
      return;
    }

    const contentLength = Number.parseInt(String(req.headers['content-length'] || '0'), 10);
    if (Number.isFinite(contentLength) && contentLength > limits.maxApiBodyBytes) {
      const key = privacyKey(clientIdentity(req, trustProxy));
      block(res, 413, 'api_body_too_large', key, category, 60);
      return;
    }

    if (now - globalWindowStart >= limits.globalWindowMs) {
      globalWindowStart = now;
      globalWindowCount = 0;
    }
    globalWindowCount += 1;

    const key = privacyKey(clientIdentity(req, trustProxy));
    const state = stateFor(key, now);
    sweep(now);

    if (state.blockedUntil > now) {
      block(res, 429, 'temporary_client_block', key, category, (state.blockedUntil - now) / 1000);
      return;
    }

    if (globalWindowCount > limits.globalMax || globalActive >= limits.maxGlobalConcurrent) {
      block(res, 503, 'global_pressure_limit', key, category, limits.globalWindowMs / 1000);
      return;
    }

    if (state.active >= limits.maxClientConcurrent) {
      state.blockedUntil = now + limits.blockMs;
      block(res, 429, 'client_concurrency_limit', key, category, limits.blockMs / 1000);
      return;
    }

    rotateWindow(state, now, 'apiWindowStart', 'apiCount', limits.apiWindowMs);
    state.apiCount += 1;
    if (state.apiCount > limits.apiMax) {
      state.blockedUntil = now + limits.blockMs;
      block(res, 429, 'client_api_rate_limit', key, category, limits.blockMs / 1000);
      return;
    }

    if (category === 'cost-sensitive-api') {
      rotateWindow(state, now, 'costWindowStart', 'costCount', limits.costWindowMs);
      state.costCount += 1;
      if (state.costCount > limits.costMax) {
        state.blockedUntil = now + limits.blockMs;
        block(res, 429, 'cost_sensitive_rate_limit', key, category, limits.blockMs / 1000);
        return;
      }
    }

    acceptedApiTotal += 1;
    globalActive += 1;
    state.active += 1;

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      globalActive = Math.max(0, globalActive - 1);
      state.active = Math.max(0, state.active - 1);
    };

    res.once('finish', release);
    res.once('close', release);
    next();
  }

  return {
    middleware,
    snapshot() {
      return {
        controlId: CONTROL_ID,
        blockedTotal,
        acceptedApiTotal,
        activeRequests: globalActive,
        trackedClientKeys: clients.size,
        lastBlockAt,
        recentEvents: [...recentEvents],
      };
    },
  };
}

export function ddosGptDougPalantirPlugin(options = {}) {
  const engine = createMitigationEngine(options.env || process.env);
  const install = (server) => {
    server.middlewares.use(engine.middleware);
  };

  return {
    name: 'ddos-gpt-doug-llm-palantir',
    enforce: 'pre',
    configureServer: install,
    configurePreviewServer: install,
  };
}

export { CONTROL_ID };
