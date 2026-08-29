import * as Cesium from 'cesium';
import { createVirginiaOntology, RICHMOND_VA } from './virginia.js';
import { toPalantirOntologyManifest } from './palantirAdapter.js';
import { attachDataManagerOntology } from './dataBridge.js';

const PANEL_ID = 'xunia-ontology-console';
const TOGGLE_ID = 'xunia-ontology-toggle';
const STYLE_ID = 'xunia-ontology-console-style';
const ATTRIBUTION_CLEARANCE_VAR = '--xunia-attribution-clearance';
const MIN_ATTRIBUTION_CLEARANCE_PX = 64;
const ATTRIBUTION_GAP_PX = 12;
const ontology = createVirginiaOntology();
let initialized = false;
let dataSource = null;
let runtime = null;
let attributionResizeObserver = null;
let attributionResizeListenerInstalled = false;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${PANEL_ID}{position:fixed;left:18px;bottom:calc(var(${ATTRIBUTION_CLEARANCE_VAR},64px) + 48px);width:min(390px,calc(100vw - 36px));max-height:calc(100vh - var(${ATTRIBUTION_CLEARANCE_VAR},64px) - 72px);overflow:auto;z-index:1150;background:rgba(3,10,18,.90);border:1px solid rgba(91,230,255,.38);box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 0 24px rgba(33,205,255,.05);backdrop-filter:blur(14px);color:#d8f8ff;font:12px/1.4 'JetBrains Mono',monospace}
#${PANEL_ID}[hidden]{display:none}#${PANEL_ID} .xo-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(91,230,255,.2)}#${PANEL_ID} .xo-head strong{letter-spacing:.11em;color:#73ecff}#${PANEL_ID} .xo-head small{color:#7da0ae}#${PANEL_ID} .xo-body{padding:10px 12px;display:grid;gap:9px}#${PANEL_ID} .xo-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#${PANEL_ID} .xo-stat{padding:7px;background:rgba(27,73,91,.18);border:1px solid rgba(91,230,255,.12)}#${PANEL_ID} .xo-stat b{display:block;color:#7df6c7;font-size:15px}#${PANEL_ID} .xo-actions{display:flex;gap:6px;flex-wrap:wrap}#${PANEL_ID} button{cursor:pointer;border:1px solid rgba(91,230,255,.28);background:#071521;color:#d8f8ff;padding:7px 9px;font:600 11px 'JetBrains Mono',monospace}#${PANEL_ID} button:hover{border-color:#73ecff}#${PANEL_ID} input{width:100%;border:1px solid rgba(91,230,255,.2);background:#030b12;color:#d8f8ff;padding:8px;font:11px 'JetBrains Mono',monospace}#${PANEL_ID} .xo-results{max-height:155px;overflow:auto;display:grid;gap:5px}#${PANEL_ID} .xo-row{padding:7px 8px;border-left:2px solid #73ecff;background:rgba(0,0,0,.22)}#${PANEL_ID} .xo-row small{display:block;color:#7697a4;margin-top:2px}#${TOGGLE_ID}{position:fixed;left:18px;bottom:var(${ATTRIBUTION_CLEARANCE_VAR},64px);z-index:1151;border:1px solid rgba(91,230,255,.35);background:rgba(3,10,18,.88);color:#73ecff;padding:9px 11px;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.08em;cursor:pointer}
body.ui-clean-view #${PANEL_ID},body.ui-clean-view #${TOGGLE_ID},body.recording-mode #${PANEL_ID},body.recording-mode #${TOGGLE_ID}{display:none!important}
@media(max-width:720px){#${PANEL_ID}{left:8px;width:calc(100vw - 16px)}#${TOGGLE_ID}{left:8px}}
  `;
  document.head.appendChild(style);
}

export function attributionClearancePx(viewportHeight, creditTop, {
  minimum = MIN_ATTRIBUTION_CLEARANCE_PX,
  gap = ATTRIBUTION_GAP_PX,
} = {}) {
  const height = Number(viewportHeight);
  const top = Number(creditTop);
  if (!Number.isFinite(height) || !Number.isFinite(top)) return minimum;
  return Math.max(minimum, Math.ceil(height - top + gap));
}

function syncAttributionClearance() {
  const credits = document.getElementById('cesium-credits');
  const rect = credits?.getBoundingClientRect?.();
  const clearance = rect && rect.height > 0
    ? attributionClearancePx(window.innerHeight, rect.top)
    : MIN_ATTRIBUTION_CLEARANCE_PX;
  document.documentElement.style.setProperty(ATTRIBUTION_CLEARANCE_VAR, `${clearance}px`);
}

function watchAttributionClearance() {
  syncAttributionClearance();
  if (!attributionResizeListenerInstalled) {
    window.addEventListener('resize', syncAttributionClearance, { passive: true });
    attributionResizeListenerInstalled = true;
  }
  const credits = document.getElementById('cesium-credits');
  if (!credits || typeof ResizeObserver === 'undefined') return;
  attributionResizeObserver?.disconnect();
  attributionResizeObserver = new ResizeObserver(syncAttributionClearance);
  attributionResizeObserver.observe(credits);
}

function objectLabel(record) {
  return record.name || record.summary || record.id;
}

function defaultOntologyRecords() {
  return [
    ...ontology.listObjects('Organization'),
    ...ontology.listObjects('Place'),
    ...ontology.listObjects('Application'),
    ...ontology.listObjects('ReferenceSource'),
    ...ontology.listObjects('Dataset'),
  ];
}

function renderResults(panel, records) {
  const target = panel.querySelector('.xo-results');
  target.innerHTML = '';
  for (const record of records.slice(0, 25)) {
    const row = document.createElement('div');
    row.className = 'xo-row';
    const classification = record.dataClass ? ` · ${String(record.dataClass).toUpperCase()}` : '';
    row.innerHTML = `<strong>${escapeHtml(objectLabel(record))}</strong><small>${escapeHtml(record.__type)} · ${escapeHtml(record.id || '')}${escapeHtml(classification)}</small>`;
    target.appendChild(row);
  }
  if (!records.length) target.innerHTML = '<div class="xo-row"><small>No matching ontology objects.</small></div>';
}

function refreshConsoleStats(panel) {
  const stats = ontology.stats();
  for (const [key, value] of Object.entries({
    objectTypes: stats.objectTypes,
    linkTypes: stats.linkTypes,
    objects: stats.objects,
    links: stats.links,
  })) {
    const target = panel.querySelector(`[data-stat="${key}"]`);
    if (target) target.textContent = String(value);
  }
}

function renderConsoleQuery(panel, search) {
  const query = search.value.trim();
  renderResults(panel, query ? ontology.search(query) : defaultOntologyRecords());
  refreshConsoleStats(panel);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function focusRichmond(viewer) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(RICHMOND_VA.longitude, RICHMOND_VA.latitude, 42000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 },
    duration: 1.4,
  });
}

function createConsole(viewer, bridge) {
  ensureStyles();
  if (document.getElementById(PANEL_ID)) return;
  const stats = ontology.stats();
  const toggle = document.createElement('button');
  toggle.id = TOGGLE_ID;
  toggle.type = 'button';
  toggle.textContent = 'ONTOLOGY / RVIA';
  document.body.appendChild(toggle);

  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.hidden = true;
  panel.innerHTML = `
    <div class="xo-head"><strong>XUNIA ONTOLOGY // RVIA</strong><small>VIRGINIA · RICHMOND</small></div>
    <div class="xo-body">
      <div class="xo-stats">
        <div class="xo-stat">OBJECT TYPES<b data-stat="objectTypes">${stats.objectTypes}</b></div>
        <div class="xo-stat">LINK TYPES<b data-stat="linkTypes">${stats.linkTypes}</b></div>
        <div class="xo-stat">OBJECTS<b data-stat="objects">${stats.objects}</b></div>
        <div class="xo-stat">LINKS<b data-stat="links">${stats.links}</b></div>
      </div>
      <input class="xo-search" type="search" placeholder="Search organization, place, source, dataset..." aria-label="Search XUNIA ontology" />
      <div class="xo-actions">
        <button type="button" data-action="richmond">FOCUS RICHMOND</button>
        <button type="button" data-action="manifest">PALANTIR MANIFEST</button>
        <button type="button" data-action="graph">XUNIA GRAPH JSON</button>
      </div>
      <div class="xo-results"></div>
    </div>`;
  document.body.appendChild(panel);
  watchAttributionClearance();

  const search = panel.querySelector('.xo-search');
  renderConsoleQuery(panel, search);

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderConsoleQuery(panel, search);
  });
  search.addEventListener('input', () => renderConsoleQuery(panel, search));
  bridge.subscribe(() => {
    if (!panel.hidden) renderConsoleQuery(panel, search);
  });
  panel.querySelector('[data-action="richmond"]').addEventListener('click', () => focusRichmond(viewer));
  panel.querySelector('[data-action="manifest"]').addEventListener('click', () => downloadJson('rvia-xunia-palantir-ontology-manifest.json', toPalantirOntologyManifest(ontology)));
  panel.querySelector('[data-action="graph"]').addEventListener('click', () => downloadJson('rvia-xunia-ontology-graph.json', ontology.exportManifest()));
}

function renderOntologyPlaces(viewer) {
  dataSource = new Cesium.CustomDataSource('xunia-ontology');
  for (const place of ontology.listObjects('Place')) {
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) continue;
    dataSource.entities.add({
      id: `xunia-ontology:${place.id}`,
      position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 80),
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#73ecff'),
        outlineColor: Cesium.Color.fromCssColorString('#071521'),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `XUNIA · ${place.name}`,
        font: '600 12px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#d8f8ff'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      properties: {
        ontologyType: place.__type,
        ontologyId: place.id,
        region: place.region || '',
      },
    });
  }
  viewer.dataSources.add(dataSource);
}

export function initXuniaOntologyRuntime({ viewer, dataManager } = {}) {
  if (initialized) return runtime;
  if (!viewer) throw new Error('XUNIA ontology requires a Cesium viewer');
  if (!dataManager) throw new Error('XUNIA ontology requires the DataLayerManager');

  const bridge = attachDataManagerOntology({ ontology, dataManager });
  renderOntologyPlaces(viewer);
  createConsole(viewer, bridge);

  runtime = Object.freeze({
    ontology,
    bridge,
    toPalantirManifest: () => toPalantirOntologyManifest(ontology),
  });
  initialized = true;

  if (typeof window !== 'undefined') {
    window.__xuniaOntology = ontology;
    window.__xuniaOntologyBridge = bridge;
    window.__xuniaPalantirManifest = runtime.toPalantirManifest;
  }
  return runtime;
}

export { ontology };
