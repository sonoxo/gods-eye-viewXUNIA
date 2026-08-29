const APPLICATION_ID = 'gods-eye-view-xunia';

function safeId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function asCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

function asTimestamp(value, fallback = new Date().toISOString()) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

/**
 * Classify a presentation layer without confusing synthetic/simulation state
 * with observed public-source data. Only explicit simulation signals produce
 * the `simulation` class.
 */
export function classifyLayerData(layer = {}) {
  const stats = layer.stats || {};
  const mode = String(stats.mode || '').trim().toLowerCase();
  const text = `${layer.source || ''} ${stats.source || ''}`.toLowerCase();
  const simulation = mode === 'sim'
    || mode === 'simulation'
    || /\bsynthetic\b|\bsimulation\b/.test(text);
  return Object.freeze({
    dataClass: simulation ? 'simulation' : 'observed',
    simulation,
  });
}

function freshnessFor(layer) {
  const stats = layer.stats || {};
  if (stats.loading || stats.refreshing) return 'loading';
  if (stats.stale) return 'stale';
  if (stats.status) return String(stats.status).toLowerCase();
  return layer.lifecycleState || (layer.enabled ? 'enabled' : 'disabled');
}

function idsFor(layerId) {
  const suffix = safeId(layerId);
  return Object.freeze({
    sourceId: `runtime-source-${suffix}`,
    datasetId: `runtime-dataset-${suffix}`,
    observationId: `runtime-observation-${suffix}`,
  });
}

/**
 * Connect DataLayerManager lifecycle/refresh events to the ontology. The bridge
 * stores only layer descriptors and aggregate runtime state; raw feed records
 * remain owned by their source-specific layers.
 */
export function attachDataManagerOntology({ ontology, dataManager, now = () => new Date().toISOString() } = {}) {
  if (!ontology) throw new Error('ontology is required');
  if (!dataManager || typeof dataManager.getAll !== 'function' || typeof dataManager.subscribe !== 'function') {
    throw new Error('dataManager with getAll()/subscribe() is required');
  }

  const syncLayer = (layerId, eventType = 'snapshot') => {
    const layer = dataManager.getAll().find((candidate) => candidate.id === layerId);
    if (!layer) return null;

    const stats = layer.stats || {};
    const semantic = classifyLayerData(layer);
    const ids = idsFor(layer.id);
    const runtimeAt = asTimestamp(stats.lastUpdate, now());
    const sourceLabel = String(stats.source || layer.source || layer.name || layer.id);
    const count = asCount(stats.count);
    const status = freshnessFor(layer);

    ontology.upsertObject('DataSource', {
      id: ids.sourceId,
      name: sourceLabel,
      url: '',
      license: 'source-specific',
      sourceClass: semantic.simulation ? 'simulation-runtime' : 'runtime-feed',
    }, {
      provenance: {
        kind: 'runtime-layer-descriptor',
        layerId: layer.id,
        source: sourceLabel,
        dataClass: semantic.dataClass,
      },
    });

    ontology.upsertObject('Dataset', {
      id: ids.datasetId,
      name: layer.name || layer.id,
      category: layer.id,
      freshness: status,
      dataClass: semantic.dataClass,
      sourceId: ids.sourceId,
      recordCount: count,
      status,
    }, {
      provenance: {
        kind: 'runtime-layer-descriptor',
        layerId: layer.id,
        source: sourceLabel,
        dataClass: semantic.dataClass,
      },
    });

    ontology.upsertObject('Observation', {
      id: ids.observationId,
      summary: `${layer.name || layer.id} runtime state · ${status} · ${count} records`,
      observedAt: runtimeAt,
      sourceId: ids.sourceId,
      status,
      recordCount: count,
      dataClass: semantic.dataClass,
      eventType,
    }, {
      provenance: {
        kind: 'runtime-layer-state',
        layerId: layer.id,
        source: sourceLabel,
        dataClass: semantic.dataClass,
        simulation: semantic.simulation,
        eventType,
        observedAt: runtimeAt,
      },
    });

    ontology.link('datasetSourcedFrom', ids.datasetId, ids.sourceId);
    ontology.link('applicationUsesDataset', APPLICATION_ID, ids.datasetId);
    ontology.link('observationSourcedFrom', ids.observationId, ids.sourceId);
    ontology.link('observationDescribesDataset', ids.observationId, ids.datasetId);

    return ontology.getObject('Dataset', ids.datasetId);
  };

  const syncAll = (eventType = 'snapshot') => {
    for (const layer of dataManager.getAll()) syncLayer(layer.id, eventType);
    return ontology.stats();
  };

  syncAll('bootstrap');
  const unsubscribe = dataManager.subscribe((change) => {
    if (!change?.layerId) return;
    if (![
      'visibility',
      'visibility-transition',
      'visibility-failed',
      'refresh',
      'refresh-failed',
      'refresh-cancelled',
      'params',
      'params-failed',
    ].includes(change.type)) return;
    syncLayer(change.layerId, change.type);
  });

  return Object.freeze({
    syncAll,
    syncLayer,
    destroy: unsubscribe,
  });
}
