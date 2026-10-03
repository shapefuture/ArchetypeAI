// Bundles the customizer into one self-contained HTML file (no network needed except optional web fonts).
// usage: node build.mjs [path-to-node_modules-with-three-delaunator-esbuild]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const nm = process.argv[2] || path.join(here, 'node_modules');
const require = createRequire(path.join(nm, 'x.js'));
const esbuild = require('esbuild');
const r = await esbuild.build({ entryPoints: [path.join(here, 'src/app.js')], bundle: true, format: 'iife', minify: !process.env.DEV, write: false, nodePaths: [nm], target: 'es2020', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = readFileSync(path.join(here, 'src/page.html'), 'utf8');
const body = `${page}\n<script>\n/* three.js (MIT) and delaunator (ISC) are bundled below. */\n${js}\n</script>\n`;
writeFileSync(path.join(here, 'artifact.html'), body);
writeFileSync(path.join(here, 'customizer.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n${body}</body>\n</html>\n`);
console.log('bundle', (js.length / 1024).toFixed(0) + ' KB');
