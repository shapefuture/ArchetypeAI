import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:process';
import { spawnSync } from 'node:child_process';

if (platform !== 'darwin' || !existsSync('node_modules')) {
  process.exit(0);
}

const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.bin' || entry.name === '.cache') continue;
      walk(path);
      continue;
    }
    if (entry.isFile() && path.endsWith('.node')) files.push(path);
  }
}

walk('node_modules');

for (const file of files) {
  if (!statSync(file).isFile()) continue;
  const res = spawnSync('codesign', ['--force', '--sign', '-', file], { stdio: 'ignore' });
  if (res.status !== 0) {
    console.error(`codesign failed for ${file}`);
    process.exit(res.status ?? 1);
  }
}
