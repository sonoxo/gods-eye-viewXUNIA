import { createServer, preview } from 'vite';
import { ddosGptDougPalantirPlugin } from '../src/security/ddos-gpt-doug-palantir.mjs';

const mode = process.argv.includes('--preview') ? 'preview' : 'dev';
const host = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT || '4173', 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 4173;

const common = {
  clearScreen: false,
  plugins: [ddosGptDougPalantirPlugin()],
  server: {
    host,
    port,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host,
    port,
    strictPort: true,
    allowedHosts: true,
  },
};

if (mode === 'preview') {
  const server = await preview(common);
  server.printUrls();
} else {
  const server = await createServer(common);
  await server.listen();
  server.printUrls();
}
