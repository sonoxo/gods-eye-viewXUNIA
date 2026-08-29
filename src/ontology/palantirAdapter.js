/**
 * Export the local XUNIA semantic graph into a Foundry/Palantir-oriented
 * manifest shape. This does not claim a live Foundry connection; it creates
 * deterministic object/link/action metadata that can be mapped into an
 * authorized Ontology Manager / OSDK deployment.
 */
export function toPalantirOntologyManifest(ontology) {
  const manifest = ontology.exportManifest();
  return {
    ontology: {
      apiName: manifest.apiName,
      displayName: manifest.displayName,
      version: manifest.version,
    },
    objectTypes: manifest.objectTypes.map((type) => ({
      apiName: type.apiName,
      displayName: type.displayName,
      description: type.description,
      primaryKey: type.primaryKey,
      titleProperty: type.titleProperty,
      properties: type.properties,
      interfaces: type.interfaces,
      status: type.status,
    })),
    linkTypes: manifest.linkTypes.map((type) => ({
      apiName: type.apiName,
      displayName: type.displayName,
      description: type.description,
      fromObjectType: type.fromType,
      toObjectType: type.toType,
      cardinality: type.cardinality,
      status: type.status,
    })),
    actionTypes: manifest.actionTypes.map((type) => ({
      apiName: type.apiName,
      displayName: type.displayName,
      description: type.description,
      objectType: type.objectType,
      parameters: type.parameters,
      status: type.status,
    })),
  };
}

export function buildFoundryLinkedObjectPath({ ontology, objectType, primaryKey, linkType, linkedObjectPrimaryKey }) {
  const encode = (value) => encodeURIComponent(String(value));
  return `/api/v2/ontologies/${encode(ontology)}/objects/${encode(objectType)}/${encode(primaryKey)}/links/${encode(linkType)}/${encode(linkedObjectPrimaryKey)}`;
}
