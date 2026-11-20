import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      // Dev server injects <style> tags for HMR; relax style-src in dev only.
      name: 'dev-csp',
      apply: 'serve',
      transformIndexHtml: (html) =>
        html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'"),
    },
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: true },
  server: {
    // Same-site API in dev: no CORS, cookies stay first-party.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
        configure: (proxy) =>
          // No backend running: answer 503 quietly instead of logging ECONNREFUSED per request.
          proxy.on('error', (_err, _req, res) => {
            if ('writeHead' in res && !res.headersSent) res.writeHead(503).end();
          }),
      },
    },
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
});
