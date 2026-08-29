import { initXuniaOntologyRuntime } from './bootstrap.js';

function waitForRuntime(attempt = 0) {
  const runtime = typeof window !== 'undefined' ? window.__godsEyeView : null;
  if (runtime?.viewer && runtime?.dataManager) {
    initXuniaOntologyRuntime({ viewer: runtime.viewer, dataManager: runtime.dataManager });
    return;
  }
  if (attempt >= 600) return;
  setTimeout(() => waitForRuntime(attempt + 1), 100);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForRuntime();
