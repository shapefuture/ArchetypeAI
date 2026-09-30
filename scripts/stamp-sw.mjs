#!/usr/bin/env node
/**
 * Stamps the deployed service worker with a content hash of the build.
 *
 * Why: browsers only treat a service worker as "updated" when its byte
 * content changes. sw.js itself is tiny and rarely edited, so deploys used
 * to ship byte-identical workers — the update flow (install → skipWaiting →
 * controllerchange → controlled reload) never fired, and users kept the old
 * cached shell until they manually cleared site data.
 *
 * The stamp is derived from dist/index.html (which references every hashed
 * chunk), so it changes exactly when the build content changes — and stays
 * stable across re-uploads of the same build.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const swPath = join(dist, 'sw.js');
const indexPath = join(dist, 'index.html');

const sw = readFileSync(swPath, 'utf8');
const stamped = sw.match(/BUILD_ID = '([0-9a-zA-Z_-]+)'/);
if (!sw.includes('__BUILD_ID__')) {
  // Already stamped (idempotent re-runs) — verify and exit.
  if (stamped) {
    console.log(`sw.js already stamped: ${stamped[1]}`);
    process.exit(0);
  }
  console.error('stamp-sw: dist/sw.js has neither __BUILD_ID__ nor an existing stamp');
  process.exit(1);
}

// Content hash part: changes only when the built shell (dist/index.html)
// changes — i.e. not necessarily on every deploy.
const contentHash = createHash('sha256')
  .update(readFileSync(indexPath))
  .digest('hex')
  .slice(0, 10);

// Git part: changes on EVERY deploy even when index.html is byte-identical,
// so the SW always gets a fresh build id → the browser always detects an
// update (fixes stale-version-until-clear). Falls back to a time-ish value
// when git isn't available so the stamp still changes per run.
let git;
try {
  git = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  git = Date.now().toString(36);
}

const buildId = `${git}-${contentHash}`;

writeFileSync(swPath, sw.replaceAll('__BUILD_ID__', buildId));
console.log(`sw.js stamped with build id ${buildId}`);
