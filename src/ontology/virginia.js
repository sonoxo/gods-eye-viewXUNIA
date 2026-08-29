import { XuniaOntology } from './core.js';

export const RICHMOND_VA = Object.freeze({
  id: 'richmond-va',
  name: 'Richmond',
  region: 'Virginia',
  country: 'United States',
  latitude: 37.5407,
  longitude: -77.4360,
});

export function createVirginiaOntology() {
  const ontology = new XuniaOntology({
    apiName: 'rvia_xunia',
    displayName: 'RVIA / XUNIA Virginia Ontology',
    version: '1.1.0',
  });

  ontology.defineObjectType({
    apiName: 'Jurisdiction',
    displayName: 'Jurisdiction',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A civic or administrative geographic jurisdiction represented in the console.',
    properties: { id: 'string', name: 'string', level: 'string', country: 'string' },
  });
  ontology.defineObjectType({
    apiName: 'Place',
    displayName: 'Place',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A geospatial place with an optional map coordinate.',
    properties: { id: 'string', name: 'string', latitude: 'double', longitude: 'double', region: 'string' },
    interfaces: ['GeospatialObject'],
  });
  ontology.defineObjectType({
    apiName: 'Organization',
    displayName: 'Organization',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'An organization represented in the XUNIA semantic graph.',
    properties: { id: 'string', name: 'string', website: 'string', region: 'string' },
  });
  ontology.defineObjectType({
    apiName: 'DataSource',
    displayName: 'Data Source',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A public, local, or application source supplying observations or datasets.',
    properties: { id: 'string', name: 'string', url: 'string', license: 'string', sourceClass: 'string' },
  });
  ontology.defineObjectType({
    apiName: 'ReferenceSource',
    displayName: 'Reference Source',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A public architecture, doctrine, or research source referenced by XUNIA but not treated as a runtime feed.',
    properties: { id: 'string', name: 'string', url: 'string', category: 'string', role: 'string' },
  });
  ontology.defineObjectType({
    apiName: 'Dataset',
    displayName: 'Dataset',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A bounded collection of records available to the intelligence console.',
    properties: {
      id: 'string',
      name: 'string',
      category: 'string',
      freshness: 'string',
      dataClass: 'string',
      sourceId: 'string',
      recordCount: 'integer',
      status: 'string',
    },
  });
  ontology.defineObjectType({
    apiName: 'Observation',
    displayName: 'Observation',
    primaryKey: 'id',
    titleProperty: 'summary',
    description: 'A source-backed observation or runtime state snapshot with explicit provenance.',
    properties: {
      id: 'string',
      summary: 'string',
      observedAt: 'timestamp',
      confidence: 'double',
      sourceId: 'string',
      status: 'string',
      recordCount: 'integer',
      dataClass: 'string',
      eventType: 'string',
    },
  });
  ontology.defineObjectType({
    apiName: 'Application',
    displayName: 'Application',
    primaryKey: 'id',
    titleProperty: 'name',
    description: 'A software application or analytical console represented in the ontology.',
    properties: { id: 'string', name: 'string', repository: 'string', runtime: 'string' },
  });

  ontology.defineLinkType({ apiName: 'placeWithinJurisdiction', displayName: 'Place within jurisdiction', fromType: 'Place', toType: 'Jurisdiction', cardinality: 'many-to-one' });
  ontology.defineLinkType({ apiName: 'organizationAssociatedWithPlace', displayName: 'Organization associated with place', fromType: 'Organization', toType: 'Place', cardinality: 'many-to-many' });
  ontology.defineLinkType({ apiName: 'datasetSourcedFrom', displayName: 'Dataset sourced from', fromType: 'Dataset', toType: 'DataSource', cardinality: 'many-to-many' });
  ontology.defineLinkType({ apiName: 'observationSourcedFrom', displayName: 'Observation sourced from', fromType: 'Observation', toType: 'DataSource', cardinality: 'many-to-one' });
  ontology.defineLinkType({ apiName: 'observationLocatedAt', displayName: 'Observation located at', fromType: 'Observation', toType: 'Place', cardinality: 'many-to-one' });
  ontology.defineLinkType({ apiName: 'observationDescribesDataset', displayName: 'Observation describes dataset', fromType: 'Observation', toType: 'Dataset', cardinality: 'many-to-one' });
  ontology.defineLinkType({ apiName: 'applicationUsesDataset', displayName: 'Application uses dataset', fromType: 'Application', toType: 'Dataset', cardinality: 'many-to-many' });
  ontology.defineLinkType({ apiName: 'applicationReferencesOrganization', displayName: 'Application references organization', fromType: 'Application', toType: 'Organization', cardinality: 'many-to-many' });
  ontology.defineLinkType({ apiName: 'applicationReferencesSource', displayName: 'Application references source', fromType: 'Application', toType: 'ReferenceSource', cardinality: 'many-to-many' });
  ontology.defineLinkType({ apiName: 'applicationCoversJurisdiction', displayName: 'Application covers jurisdiction', fromType: 'Application', toType: 'Jurisdiction', cardinality: 'many-to-many' });

  ontology.defineActionType({
    apiName: 'focusPlace',
    displayName: 'Focus place',
    objectType: 'Place',
    description: 'Moves the local map camera to the selected ontology place.',
    parameters: { rangeMeters: 'integer' },
  });
  ontology.defineActionType({
    apiName: 'inspectProvenance',
    displayName: 'Inspect provenance',
    objectType: 'Observation',
    description: 'Opens the source and provenance metadata for an observation without changing source data.',
  });

  ontology.upsertObject('Jurisdiction', {
    id: 'commonwealth-of-virginia',
    name: 'Commonwealth of Virginia',
    level: 'state',
    country: 'United States',
  }, { provenance: { kind: 'geographic-reference', suppliedBy: 'XUNIA configuration' } });

  ontology.upsertObject('Jurisdiction', {
    id: 'city-of-richmond',
    name: 'City of Richmond',
    level: 'independent-city',
    country: 'United States',
  }, { provenance: { kind: 'geographic-reference', suppliedBy: 'XUNIA configuration' } });

  ontology.upsertObject('Place', RICHMOND_VA, {
    provenance: { kind: 'geographic-reference', suppliedBy: 'XUNIA configuration' },
  });

  ontology.upsertObject('Organization', {
    id: 'richmond-virginia-intelligence-agency',
    name: 'Richmond Virginia Intelligence Agency',
    website: 'https://github.com/RichmondVirginiaIntelligenceAgency',
    region: 'Richmond, Virginia',
  }, {
    provenance: {
      kind: 'organization-reference',
      source: 'https://github.com/RichmondVirginiaIntelligenceAgency',
      suppliedBy: 'repository owner',
    },
  });

  ontology.upsertObject('DataSource', {
    id: 'rvia-github-organization',
    name: 'RichmondVirginiaIntelligenceAgency GitHub organization',
    url: 'https://github.com/RichmondVirginiaIntelligenceAgency',
    license: 'repository-specific',
    sourceClass: 'public-github',
  }, { provenance: { kind: 'public-url', source: 'https://github.com/RichmondVirginiaIntelligenceAgency' } });

  ontology.upsertObject('ReferenceSource', {
    id: 'spatial-intelligence-ai',
    name: 'Spatial Intelligence by Bilawal Sidhu',
    url: 'https://www.spatialintelligence.ai/',
    category: 'spatial-intelligence-research',
    role: 'public architecture and research reference',
  }, {
    provenance: {
      kind: 'public-publication-reference',
      source: 'https://www.spatialintelligence.ai/',
      relationship: 'reference-only; not a runtime dependency or endorsement',
    },
  });

  ontology.upsertObject('Application', {
    id: 'gods-eye-view-xunia',
    name: "God's Eye View XUNIA",
    repository: 'https://github.com/sonoxo/gods-eye-viewXUNIA',
    runtime: 'CesiumJS + Vite',
  }, { provenance: { kind: 'repository', source: 'https://github.com/sonoxo/gods-eye-viewXUNIA' } });

  ontology.link('placeWithinJurisdiction', 'richmond-va', 'city-of-richmond');
  ontology.link('organizationAssociatedWithPlace', 'richmond-virginia-intelligence-agency', 'richmond-va', { association: 'regional namespace' });
  ontology.link('applicationReferencesOrganization', 'gods-eye-view-xunia', 'richmond-virginia-intelligence-agency');
  ontology.link('applicationReferencesSource', 'gods-eye-view-xunia', 'spatial-intelligence-ai');
  ontology.link('applicationCoversJurisdiction', 'gods-eye-view-xunia', 'commonwealth-of-virginia');
  ontology.link('applicationCoversJurisdiction', 'gods-eye-view-xunia', 'city-of-richmond');

  return ontology;
}
