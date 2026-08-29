import test from 'node:test';
import assert from 'node:assert/strict';
import { createVirginiaOntology } from './virginia.js';
import { attachDataManagerOntology, classifyLayerData } from './dataBridge.js';

test('classifyLayerData separates observed feeds from explicit simulation feeds', () => {
  assert.deepEqual(classifyLayerData({ source: 'OpenSky', stats: { mode: 'live' } }), {
    dataClass: 'observed',
    simulation: false,
  });
  assert.deepEqual(classifyLayerData({ source: 'Synthetic training feed', stats: { mode: 'sim' } }), {
    dataClass: 'simulation',
    simulation: true,
  });
});

test('data manager bridge creates source, dataset and aggregate runtime observation objects', () => {
  const ontology = createVirginiaOntology();
  const layers = [
    {
      id: 'flights',
      name: 'Flights',
      source: 'OpenSky',
      enabled: true,
      lifecycleState: 'enabled',
      stats: { count: 12, status: 'nominal', lastUpdate: '2026-08-29T07:30:00Z' },
    },
    {
      id: 'training-sim',
      name: 'Training Simulation',
      source: 'Synthetic training feed',
      enabled: true,
      lifecycleState: 'enabled',
      stats: { count: 3, mode: 'sim', status: 'nominal', lastUpdate: '2026-08-29T07:30:00Z' },
    },
  ];
  let listener = null;
  const dataManager = {
    getAll: () => layers,
    subscribe(callback) {
      listener = callback;
      return () => { listener = null; };
    },
  };

  const bridge = attachDataManagerOntology({
    ontology,
    dataManager,
    now: () => '2026-08-29T07:31:00Z',
  });

  const flightsDataset = ontology.getObject('Dataset', 'runtime-dataset-flights');
  const simDataset = ontology.getObject('Dataset', 'runtime-dataset-training-sim');
  assert.equal(flightsDataset.recordCount, 12);
  assert.equal(flightsDataset.dataClass, 'observed');
  assert.equal(simDataset.dataClass, 'simulation');

  const observation = ontology.getObject('Observation', 'runtime-observation-flights');
  assert.equal(observation.sourceId, 'runtime-source-flights');
  assert.equal(observation.__provenance.kind, 'runtime-layer-state');
  assert.equal(observation.__provenance.simulation, false);

  const applicationLinks = ontology.linkedObjects('Application', 'gods-eye-view-xunia', {
    linkType: 'applicationUsesDataset',
    direction: 'out',
  });
  assert.ok(applicationLinks.some((entry) => entry.object.id === 'runtime-dataset-flights'));

  layers[0].stats.count = 21;
  listener({ type: 'refresh', layerId: 'flights' });
  assert.equal(ontology.getObject('Dataset', 'runtime-dataset-flights').recordCount, 21);
  assert.equal(ontology.getObject('Observation', 'runtime-observation-flights').eventType, 'refresh');

  bridge.destroy();
  assert.equal(listener, null);
});

test('Virginia ontology treats spatialintelligence.ai as a public reference, not a runtime dependency', () => {
  const ontology = createVirginiaOntology();
  const source = ontology.getObject('ReferenceSource', 'spatial-intelligence-ai');
  assert.equal(source.url, 'https://www.spatialintelligence.ai/');
  assert.match(source.role, /reference/i);
  assert.match(source.__provenance.relationship, /not a runtime dependency/i);
});
