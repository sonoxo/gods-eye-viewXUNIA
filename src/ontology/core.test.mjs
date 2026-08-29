import test from 'node:test';
import assert from 'node:assert/strict';
import { XuniaOntology } from './core.js';
import { createVirginiaOntology } from './virginia.js';
import { buildFoundryLinkedObjectPath, toPalantirOntologyManifest } from './palantirAdapter.js';

test('XuniaOntology creates typed objects and traversable links', () => {
  const ontology = new XuniaOntology({ apiName: 'test' });
  ontology.defineObjectType({ apiName: 'A', primaryKey: 'id' });
  ontology.defineObjectType({ apiName: 'B', primaryKey: 'id' });
  ontology.defineLinkType({ apiName: 'relatedTo', fromType: 'A', toType: 'B' });
  ontology.upsertObject('A', { id: 'a1', name: 'Alpha' });
  ontology.upsertObject('B', { id: 'b1', name: 'Beta' });
  ontology.link('relatedTo', 'a1', 'b1');
  assert.equal(ontology.linkedObjects('A', 'a1')[0].object.name, 'Beta');
  assert.equal(ontology.search('alpha')[0].id, 'a1');
});

test('Virginia ontology includes Richmond and RVIA organization reference', () => {
  const ontology = createVirginiaOntology();
  const richmond = ontology.getObject('Place', 'richmond-va');
  const rvia = ontology.getObject('Organization', 'richmond-virginia-intelligence-agency');
  assert.equal(richmond.region, 'Virginia');
  assert.equal(rvia.website, 'https://github.com/RichmondVirginiaIntelligenceAgency');
  const links = ontology.linkedObjects('Organization', rvia.id);
  assert.ok(links.some((entry) => entry.object.id === 'richmond-va'));
});

test('Palantir manifest preserves object, link and action types', () => {
  const ontology = createVirginiaOntology();
  const manifest = toPalantirOntologyManifest(ontology);
  assert.ok(manifest.objectTypes.some((type) => type.apiName === 'Organization'));
  assert.ok(manifest.linkTypes.some((type) => type.apiName === 'applicationReferencesOrganization'));
  assert.ok(manifest.actionTypes.some((type) => type.apiName === 'focusPlace'));
  assert.equal(
    buildFoundryLinkedObjectPath({ ontology: 'rvia_xunia', objectType: 'Organization', primaryKey: 'rvia', linkType: 'locatedAt', linkedObjectPrimaryKey: 'richmond' }),
    '/api/v2/ontologies/rvia_xunia/objects/Organization/rvia/links/locatedAt/richmond',
  );
});
