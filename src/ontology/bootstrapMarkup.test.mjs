import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrapSource = readFileSync(new URL('./bootstrap.js', import.meta.url), 'utf8');

test('ontology chrome preserves required attribution clearance', () => {
  assert.match(bootstrapSource, /#\$\{TOGGLE_ID\}\{position:fixed;left:18px;bottom:64px/);
  assert.match(bootstrapSource, /#\$\{PANEL_ID\}\{position:fixed;left:18px;bottom:112px/);
});

test('ontology chrome is hidden in clean-view and recording modes', () => {
  assert.match(bootstrapSource, /body\.ui-clean-view #\$\{PANEL_ID\}/);
  assert.match(bootstrapSource, /body\.ui-clean-view #\$\{TOGGLE_ID\}/);
  assert.match(bootstrapSource, /body\.recording-mode #\$\{PANEL_ID\}/);
  assert.match(bootstrapSource, /body\.recording-mode #\$\{TOGGLE_ID\}/);
});
