# XUNIA Ontology Architecture

XUNIA treats the map as a presentation surface over a typed semantic graph rather than as the system of record.

## Runtime pipeline

`SOURCE -> DATA LAYER -> DATASET -> RUNTIME OBSERVATION -> ONTOLOGY -> UI / EXPORT / ANALYSIS`

The ontology bridge reads DataLayerManager descriptors and aggregate runtime state. It does **not** duplicate raw feed records. Source-specific modules remain responsible for acquisition, licensing, refresh logic, and rendering.

## Core object model

- **Jurisdiction** — Commonwealth, city, or other civic scope.
- **Place** — geospatial location used by the map and ontology.
- **Organization** — organization represented in the semantic graph.
- **DataSource** — runtime or public source supplying a dataset.
- **Dataset** — logical feed/data product registered with XUNIA.
- **Observation** — source-backed aggregate runtime snapshot with provenance.
- **Application** — XUNIA or another represented software application.
- **ReferenceSource** — public architecture/research material used as a reference, not a runtime feed.

## Provenance rules

Every runtime-derived ontology object carries source metadata. The bridge preserves a hard distinction between:

- `observed` — normal runtime/public-source feed state.
- `simulation` — only data explicitly marked as `sim`, `simulation`, or synthetic.

Simulation state must never be silently promoted to observed state.

## Richmond / Virginia scope

The seed ontology includes:

- Commonwealth of Virginia
- City of Richmond
- Richmond place object
- Richmond Virginia Intelligence Agency organization reference using `https://github.com/RichmondVirginiaIntelligenceAgency` as the supplied public provenance URL
- God's Eye View XUNIA application object

## Spatial Intelligence reference

`https://www.spatialintelligence.ai/` is stored as a **ReferenceSource** for public spatial-intelligence architecture/research. It is not treated as an application dependency, data provider, affiliation, endorsement, or certification.

## Palantir compatibility layer

`src/ontology/palantirAdapter.js` exports XUNIA object/link/action definitions into a Palantir-oriented manifest shape and provides Foundry Ontologies v2 route construction helpers. This is an interoperability model; it does not imply a live Foundry tenant, Palantir certification, or endorsement.

## UI behavior

The `ONTOLOGY / RVIA` console can search the graph, focus Richmond, and export the XUNIA graph or Palantir-oriented ontology manifest. The console and toggle are intentionally hidden in clean-view and recording modes, and are positioned above the required Cesium/Google attribution area.
