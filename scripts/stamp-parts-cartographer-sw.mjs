/* postbuild: stamp dist/sw.js with a hash of dist/index.html (draft PWA requirement) */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'dist', 'index.html');
const swSrc = join(root, 'public', 'sw.js');
const swDst = join(root, 'dist', 'sw.js');

if (!existsSync(htmlPath)) {
  console.error('[stamp-sw] dist/index.html missing — run vite build first');
  process.exit(1);
}
if (!existsSync(swSrc)) {
  console.error('[stamp-sw] public/sw.js missing');
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const hash = createHash('sha256').update(html).digest('hex').slice(0, 16);
const stamp = `${hash}-${Date.now().toString(36)}`;

let sw = readFileSync(swSrc, 'utf8');
sw = sw.replace('__BUILD_ID__', stamp);

mkdirSync(dirname(swDst), { recursive: true });
writeFileSync(swDst, sw);

// keep manifest+icons referenced from the shell (no-store already set by server headers)
console.log(`[stamp-sw] stamped ${swDst} → build ${stamp}`);
