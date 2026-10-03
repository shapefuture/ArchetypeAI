#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
rm -rf dist
mkdir -p dist/assets
if ! command -v tsc >/dev/null 2>&1; then echo "tsc is required" >&2; exit 2; fi
tsc
# The browser loads exactly one module, assets/main.js. It is bundled so the character
# engine and its WebGL stack ship inside it: the PWA stays CDN-free and offline-first.
# tsc's per-file output stays next to it — that is the module tree the tests import.
node ./scripts/bundle.mjs
# The character modules reach the engine through that bundle-only alias, so their
# un-bundled tsc output is not browser-loadable. The bundles are what ships.
rm -f dist/assets/adapters/render/felt.js dist/assets/adapters/render/felt-dna.js dist/assets/adapters/compute/felt-worker.js
cp index.html dist/index.html
cp public/manifest.webmanifest dist/manifest.webmanifest
cp public/sw.js dist/sw.js
mkdir -p dist/assets
cp public/assets/styles.css dist/assets/styles.css
cp -R public/icons dist/icons
mkdir -p dist/wasm
cp public/wasm/zero_runtime.wasm dist/wasm/zero_runtime.wasm
printf '%s\n' "ZERO-R V3 build complete: $ROOT/dist"
