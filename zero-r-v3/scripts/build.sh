#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
rm -rf dist
mkdir -p dist/assets
if ! command -v tsc >/dev/null 2>&1; then echo "tsc is required" >&2; exit 2; fi
tsc
cp index.html dist/index.html
cp public/manifest.webmanifest dist/manifest.webmanifest
cp public/sw.js dist/sw.js
mkdir -p dist/assets
cp public/assets/styles.css dist/assets/styles.css
cp -R public/icons dist/icons
mkdir -p dist/wasm
cp public/wasm/zero_runtime.wasm dist/wasm/zero_runtime.wasm
printf '%s\n' "ZERO-R V3 build complete: $ROOT/dist"
