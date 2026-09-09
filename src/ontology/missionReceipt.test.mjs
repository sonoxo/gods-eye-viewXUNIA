import test from 'node:test';
import assert from 'node:assert/strict';
import { createVirginiaOntology } from './virginia.js';

function reply() {
  return { status:'ACCEPTED', mission:{ missionId:'test-1',target:'ZYRA',result:{executionState:'MISSION_CONTRACT_ACCEPTED'},evidence:[{
    schemaVersion:'xunia.route-evidence/v1',type:'RouteEvidence',controlPlane:'THE_BLACK_HOUSE_V1',kernelVersion:'3.0.0',source:'RVIA',executionVerified:false,status:'ACCEPTED',missionId:'test-1',target:'ZYRA',executionState:'MISSION_CONTRACT_ACCEPTED',observedAt:'2026-09-09T12:00:00Z',
  }]}};
}
test('RVIA result becomes a searchable typed XUNIA receipt', () => {
  const ontology = createVirginiaOntology();
  const record = ontology.importMissionResult(reply());
  assert.equal(record.status,'ACCEPTED');
  assert.equal(record.__provenance.authenticated,false);
  assert.equal(ontology.search('test-1')[0].executionVerified,false);
});
test('direct upsert cannot manufacture completion', () => {
  const ontology = createVirginiaOntology();
  const receipt = reply().mission.evidence[0];
  assert.throws(() => ontology.upsertObject('RouteEvidence',{id:'test-1',...receipt,status:'COMPLETED'}));
  assert.equal(ontology.listObjects('RouteEvidence').length,0);
});
test('older receipts cannot overwrite newer observations', () => {
  const ontology = createVirginiaOntology();
  ontology.importMissionResult(reply());
  const older = reply(); older.mission.evidence[0].observedAt = '2026-09-08T12:00:00Z';
  assert.throws(() => ontology.importMissionResult(older),/STALE_ROUTE_EVIDENCE/);
});
