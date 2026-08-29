import * as Cesium from 'cesium';
import { createVirginiaOntology, RICHMOND_VA } from './virginia.js';
import { toPalantirOntologyManifest } from './palantirAdapter.js';

const PANEL_ID = 'xunia-ontology-console';
const STYLE_ID = 'xunia-ontology-console-style';
const ontology = createVirginiaOntology();
let initialized = false;
let dataSource = null;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${PANEL_ID}{position:fixed;left:18px;bottom:74px;width:min(390px,calc(100vw - 36px));z-index:1150;background:rgba(3,10,18,.90);border:1px solid rgba(91,230,255,.38);box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 0 24px rgba(33,205,255,.05);backdrop-filter:blur(14px);color:#d8f8ff;font:12px/1.4 'JetBrains Mono',monospace}
#${PANEL_ID}[hidden]{display:none}#${PANEL_ID} .xo-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(91,230,255,.2)}#${PANEL_ID} .xo-head strong{letter-spacing:.11em;color:#73ecff}#${PANEL_ID} .xo-head small{color:#7da0ae}#${PANEL_ID} .xo-body{padding:10px 12px;display:grid;gap:9px}#${PANEL_ID} .xo-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#${PANEL_ID} .xo-stat{padding:7px;background:rgba(27,73,91,.18);border:1px solid rgba(91,230,255,.12)}#${PANEL_ID} .xo-stat b{display:block;color:#7df6c7;font-size:15px}#${PANEL_ID} .xo-actions{display:flex;gap:6px;flex-wrap:wrap}#${PANEL_ID} button{cursor:pointer;border:1px solid rgba(91,230,255,.28);background:#071521;color:#d8f8ff;padding:7px 9px;font:600 11px 'JetBrains Mono',monospace}#${PANEL_ID} button:hover{border-color:#73ecff}#${PANEL_ID} input{width:100%;border:1px solid rgba(91,230,255,.2);background:#030b12;color:#d8f8ff;padding:8px;font:11px 'JetBrains Mono',monospace}#${PANEL_ID} .xo-results{max-height:155px;overflow:auto;display:grid;gap:5px}#${PANEL_ID} .xo-row{padding:7px 8px;border-left:2px solid #73ecff;background:rgba(0,0,0,.22)}#${PANEL_ID} .xo-row small{display:block;color:#7697a4;margin-top:2px}#xunia-ontology-toggle{position:fixed;left:18px;bottom:18px;z-index:1151;border:1px solid rgba(91,230,255,.35);background:rgba(3,10,18,.88);color:#73ecff;padding:9px 11px;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.08em;cursor:pointer}
@media(max-width:720px){#${PANEL_ID}{left:8px;bottom:60px;width:calc(100vw - 16px)}#xunia-ontology-toggle{left:8px;bottom:8px}}
  `;
  document.head.appendChild(style);
}

function objectLabel(record) {
  return record.name || record.summary || record.id;
}

function renderResults(panel, records) {
  const target = panel.querySelector('.xo-results');
  target.innerHTML = '';
  for (const record of records.slice(0, 25)) {
    const row = document.createElement('div');
    row.className = 'xo-row';
    row.innerHTML = `<strong>${escapeHtml(objectLabel(record))}</strong><small>${escapeHtml(record.__type)} · ${escapeHtml(record.id || '')}</small>`;
    target.appendChild(row);
  }
  if (!records.length) target.innerHTML = '<div class="xo-row"><small>No matching ontology objects.</small></div>';
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

function createConsole(viewer) {
  ensureStyles();
  if (document.getElementById(PANEL_ID)) return;
  const stats = ontology.stats();
  const toggle = document.createElement('button');
  toggle.id = 'xunia-ontology-toggle';
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
        <div class="xo-stat">OBJECT TYPES<b>${stats.objectTypes}</b></div>
        <div class="xo-stat">LINK TYPES<b>${stats.linkTypes}</b></div>
        <div class="xo-stat">OBJECTS<b>${stats.objects}</b></div>
        <div class="xo-stat">LINKS<b>${stats.links}</b></div>
      </div>
      <input class="xo-search" type="search" placeholder="Search organization, place, source..." aria-label="Search XUNIA ontology" />
      <div class="xo-actions">
        <button type="button" data-action="richmond">FOCUS RICHMOND</button>
        <button type="button" data-action="manifest">PALANTIR MANIFEST</button>
        <button type="button" data-action="graph">XUNIA GRAPH JSON</button>
      </div>
      <div class="xo-results"></div>
    </div>`;
  document.body.appendChild(panel);

  const defaultRecords = [
    ...ontology.listObjects('Organization'),
    ...ontology.listObjects('Place'),
    ...ontology.listObjects('Application'),
  ];
  renderResults(panel, defaultRecords);

  toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  panel.querySelector('.xo-search').addEventListener('input', (event) => {
    const query = event.target.value.trim();
    renderResults(panel, query ? ontology.search(query) : defaultRecords);
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

function initialize(viewer) {
  if (initialized || !viewer) return false;
  initialized = true;
  renderOntologyPlaces(viewer);
  createConsole(viewer);
  window.__xuniaOntology = ontology;
  window.__xuniaPalantirManifest = () => toPalantirOntologyManifest(ontology);
  return true;
}

function waitForViewer(attempt = 0) {
  const viewer = window.__godsEyeView?.viewer;
  if (initialize(viewer)) return;
  if (attempt >= 600) return;
  setTimeout(() => waitForViewer(attempt + 1), 100);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForViewer();

export { ontology };
