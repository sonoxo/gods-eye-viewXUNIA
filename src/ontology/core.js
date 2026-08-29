function assertName(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeApiName(value) {
  const raw = assertName(value, 'API name');
  const normalized = raw
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!normalized) throw new Error('API name contains no usable characters');
  return normalized;
}

export class XuniaOntology {
  constructor({ apiName = 'xunia', displayName = 'XUNIA Ontology', version = '1.0.0' } = {}) {
    this.apiName = normalizeApiName(apiName);
    this.displayName = assertName(displayName, 'Ontology displayName');
    this.version = String(version || '1.0.0');
    this.objectTypes = new Map();
    this.linkTypes = new Map();
    this.actionTypes = new Map();
    this.objects = new Map();
    this.links = new Map();
  }

  defineObjectType(definition) {
    const apiName = normalizeApiName(definition?.apiName);
    if (this.objectTypes.has(apiName)) throw new Error(`Duplicate object type: ${apiName}`);
    const properties = Object.freeze({ ...(definition?.properties || {}) });
    const normalized = Object.freeze({
      apiName,
      displayName: assertName(definition?.displayName || apiName, 'Object type displayName'),
      description: String(definition?.description || ''),
      primaryKey: assertName(definition?.primaryKey || 'id', 'Object type primaryKey'),
      titleProperty: String(definition?.titleProperty || 'name'),
      properties,
      interfaces: Object.freeze([...(definition?.interfaces || [])]),
      status: definition?.status || 'active',
    });
    this.objectTypes.set(apiName, normalized);
    this.objects.set(apiName, new Map());
    return normalized;
  }

  defineLinkType(definition) {
    const apiName = normalizeApiName(definition?.apiName);
    if (this.linkTypes.has(apiName)) throw new Error(`Duplicate link type: ${apiName}`);
    const fromType = normalizeApiName(definition?.fromType);
    const toType = normalizeApiName(definition?.toType);
    if (!this.objectTypes.has(fromType) || !this.objectTypes.has(toType)) {
      throw new Error(`Link type ${apiName} references an undefined object type`);
    }
    const normalized = Object.freeze({
      apiName,
      displayName: assertName(definition?.displayName || apiName, 'Link type displayName'),
      description: String(definition?.description || ''),
      fromType,
      toType,
      cardinality: definition?.cardinality || 'many-to-many',
      status: definition?.status || 'active',
    });
    this.linkTypes.set(apiName, normalized);
    this.links.set(apiName, new Map());
    return normalized;
  }

  defineActionType(definition) {
    const apiName = normalizeApiName(definition?.apiName);
    if (this.actionTypes.has(apiName)) throw new Error(`Duplicate action type: ${apiName}`);
    const objectType = normalizeApiName(definition?.objectType);
    if (!this.objectTypes.has(objectType)) throw new Error(`Undefined action object type: ${objectType}`);
    const normalized = Object.freeze({
      apiName,
      displayName: assertName(definition?.displayName || apiName, 'Action type displayName'),
      objectType,
      description: String(definition?.description || ''),
      parameters: Object.freeze({ ...(definition?.parameters || {}) }),
      status: definition?.status || 'active',
    });
    this.actionTypes.set(apiName, normalized);
    return normalized;
  }

  upsertObject(typeName, value, { provenance = null } = {}) {
    const apiName = normalizeApiName(typeName);
    const type = this.objectTypes.get(apiName);
    if (!type) throw new Error(`Unknown object type: ${apiName}`);
    const record = { ...(value || {}) };
    const keyValue = record[type.primaryKey];
    if (keyValue === null || keyValue === undefined || String(keyValue).trim() === '') {
      throw new Error(`${apiName}.${type.primaryKey} is required`);
    }
    const key = String(keyValue);
    const previous = this.objects.get(apiName).get(key) || {};
    const next = Object.freeze({
      ...previous,
      ...record,
      [type.primaryKey]: key,
      __type: apiName,
      __provenance: provenance ? clone(provenance) : (previous.__provenance || null),
    });
    this.objects.get(apiName).set(key, next);
    return next;
  }

  getObject(typeName, primaryKey) {
    const apiName = normalizeApiName(typeName);
    return this.objects.get(apiName)?.get(String(primaryKey)) || null;
  }

  listObjects(typeName) {
    const apiName = normalizeApiName(typeName);
    if (!this.objects.has(apiName)) throw new Error(`Unknown object type: ${apiName}`);
    return [...this.objects.get(apiName).values()];
  }

  link(linkTypeName, fromPrimaryKey, toPrimaryKey, properties = {}) {
    const apiName = normalizeApiName(linkTypeName);
    const type = this.linkTypes.get(apiName);
    if (!type) throw new Error(`Unknown link type: ${apiName}`);
    const from = this.getObject(type.fromType, fromPrimaryKey);
    const to = this.getObject(type.toType, toPrimaryKey);
    if (!from || !to) throw new Error(`Cannot create ${apiName}: linked objects must exist`);
    const linkId = `${String(fromPrimaryKey)}::${String(toPrimaryKey)}`;
    const record = Object.freeze({
      id: linkId,
      linkType: apiName,
      fromType: type.fromType,
      fromPrimaryKey: String(fromPrimaryKey),
      toType: type.toType,
      toPrimaryKey: String(toPrimaryKey),
      properties: Object.freeze({ ...(properties || {}) }),
    });
    this.links.get(apiName).set(linkId, record);
    return record;
  }

  linkedObjects(typeName, primaryKey, { linkType = null, direction = 'both' } = {}) {
    const apiName = normalizeApiName(typeName);
    const key = String(primaryKey);
    const candidates = linkType
      ? [[normalizeApiName(linkType), this.links.get(normalizeApiName(linkType))]]
      : [...this.links.entries()];
    const results = [];
    for (const [linkApiName, linkMap] of candidates) {
      if (!linkMap) continue;
      for (const link of linkMap.values()) {
        if ((direction === 'both' || direction === 'out') && link.fromType === apiName && link.fromPrimaryKey === key) {
          const object = this.getObject(link.toType, link.toPrimaryKey);
          if (object) results.push({ linkType: linkApiName, direction: 'out', object, link });
        }
        if ((direction === 'both' || direction === 'in') && link.toType === apiName && link.toPrimaryKey === key) {
          const object = this.getObject(link.fromType, link.fromPrimaryKey);
          if (object) results.push({ linkType: linkApiName, direction: 'in', object, link });
        }
      }
    }
    return results;
  }

  search(query, { types = null, limit = 50 } = {}) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return [];
    const typeFilter = types ? new Set(types.map(normalizeApiName)) : null;
    const results = [];
    for (const [typeName, records] of this.objects.entries()) {
      if (typeFilter && !typeFilter.has(typeName)) continue;
      for (const record of records.values()) {
        const haystack = Object.entries(record)
          .filter(([key]) => !key.startsWith('__'))
          .map(([, value]) => typeof value === 'string' || typeof value === 'number' ? String(value) : '')
          .join(' ')
          .toLowerCase();
        if (haystack.includes(needle)) results.push(record);
        if (results.length >= limit) return results;
      }
    }
    return results;
  }

  stats() {
    return Object.freeze({
      objectTypes: this.objectTypes.size,
      linkTypes: this.linkTypes.size,
      actionTypes: this.actionTypes.size,
      objects: [...this.objects.values()].reduce((sum, map) => sum + map.size, 0),
      links: [...this.links.values()].reduce((sum, map) => sum + map.size, 0),
    });
  }

  exportManifest() {
    return {
      apiName: this.apiName,
      displayName: this.displayName,
      version: this.version,
      objectTypes: [...this.objectTypes.values()].map(clone),
      linkTypes: [...this.linkTypes.values()].map(clone),
      actionTypes: [...this.actionTypes.values()].map(clone),
      objects: Object.fromEntries([...this.objects.entries()].map(([type, records]) => [type, [...records.values()].map(clone)])),
      links: Object.fromEntries([...this.links.entries()].map(([type, records]) => [type, [...records.values()].map(clone)])),
    };
  }
}
