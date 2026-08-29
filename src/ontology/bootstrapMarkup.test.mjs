import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrapSource = readFileSync(new URL('./bootstrap.js', import.meta.url), 'utf8');

test('ontology chrome derives clearance from live Cesium attribution geometry', () => {
  assert.match(bootstrapSource, /getElementById\('cesium-credits'\)/);
  assert.match(bootstrapSource, /getBoundingClientRect/);
  assert.match(bootstrapSource, /window\.innerHeight/);
  assert.match(bootstrapSource, /--xunia-attribution-clearance/);
  assert.match(bootstrapSource, /ResizeObserver/);
  assert.match(bootstrapSource, /bottom:var\(\$\{ATTRIBUTION_CLEARANCE_VAR\},64px\)/);
  assert.match(bootstrapSource, /bottom:calc\(var\(\$\{ATTRIBUTION_CLEARANCE_VAR\},64px\) \+ 48px\)/);
});

test('ontology chrome is hidden in clean-view and recording modes', () => {
  assert.match(bootstrapSource, /body\.ui-clean-view #\$\{PANEL_ID\}/);
  assert.match(bootstrapSource, /body\.ui-clean-view #\$\{TOGGLE_ID\}/);
  assert.match(bootstrapSource, /body\.recording-mode #\$\{PANEL_ID\}/);
  assert.match(bootstrapSource, /body\.recording-mode #\$\{TOGGLE_ID\}/);
});
