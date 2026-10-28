// Dev server for plush-shots.html: renders each cast plush with the app's own feltThumbnail
// and saves it as plush/<id>.png beside this file. Convert to WebP afterwards (see build.py).
// Usage (repo root): npx vite --config docs/plans/research/prototype/plush.vite.config.mjs
//   then open http://127.0.0.1:5199/docs/plans/research/prototype/plush-shots.html
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = here + 'plush/';

export default defineConfig({
  root: fileURLToPath(new URL('../../../../', import.meta.url)),
  server: { host: '127.0.0.1', port: 5199, strictPort: true },
  plugins: [{
    name: 'save-plush',
    configureServer(server) {
      server.middlewares.use('/__plush/', (req, res) => {
        const id = (req.url || '').replace(/^\//, '');
        if (req.method !== 'POST' || !/^[a-z-]+$/.test(id)) { res.statusCode = 400; res.end(); return; }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          const m = /^data:image\/png;base64,(.+)$/.exec(body);
          if (!m) { res.statusCode = 422; res.end('not a PNG (WebGL unavailable?)'); return; }
          mkdirSync(out, { recursive: true });
          writeFileSync(out + id + '.png', Buffer.from(m[1], 'base64'));
          res.end('ok');
        });
      });
    },
  }],
});
