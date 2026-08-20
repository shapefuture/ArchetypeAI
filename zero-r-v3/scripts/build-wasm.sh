#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if ! command -v rustc >/dev/null 2>&1; then
  echo "Rust toolchain not installed. The repository includes a validated WASM artifact; this script rebuilds it when Rust is available." >&2
  exit 2
fi
mkdir -p "$ROOT/public/wasm"
rustc --target wasm32-unknown-unknown -O --crate-type=cdylib "$ROOT/crates/zero-runtime/src/lib.rs" -o "$ROOT/public/wasm/zero_runtime.wasm"
