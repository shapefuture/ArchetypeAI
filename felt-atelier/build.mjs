// Bundles each entry point into one self-contained HTML file (no network needed at all).
// usage: node build.mjs [path-to-node_modules-with-three-delaunator-esbuild]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const nm = process.argv[2] || path.join(here, 'node_modules');
const require = createRequire(path.join(nm, 'x.js'));
const esbuild = require('esbuild');

// The sewing worker is inlined once and shared by every entry (a Blob worker, or a main-thread fallback).
const w = await esbuild.build({ entryPoints: [path.join(here, 'src/worker.js')], bundle: true, format: 'iife', minify: !process.env.DEV, write: false, nodePaths: [nm], target: 'es2020', legalComments: 'none' });
const wjs = w.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const page = (js, body) => `${body}\n<script type="text/plain" id="wsrc">${wjs}</script>\n<script>\n/* three.js (MIT) and delaunator (ISC) are bundled below. */\n${js}\n</script>\n`;
const file = (body) => `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n${body}</body>\n</html>\n`;

for (const { entry, body: html, out, artifact } of [
  { entry: 'src/app.js', body: 'src/page.html', out: 'customizer.html', artifact: 'artifact.html' },
  { entry: 'src/preview.js', body: 'src/preview.html', out: 'preview.html' },
]) {
  const r = await esbuild.build({ entryPoints: [path.join(here, entry)], bundle: true, format: 'iife', minify: !process.env.DEV, write: false, nodePaths: [nm], target: 'es2020', legalComments: 'none' });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const body = page(js, readFileSync(path.join(here, html), 'utf8'));
  if (artifact) writeFileSync(path.join(here, artifact), body);
  writeFileSync(path.join(here, out), file(body));
  console.log(out, (body.length / 1024).toFixed(0) + ' KB', '· bundle', (js.length / 1024).toFixed(0) + ' KB', '· worker', (wjs.length / 1024).toFixed(0) + ' KB');
}
