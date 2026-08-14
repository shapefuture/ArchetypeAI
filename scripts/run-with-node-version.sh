#!/usr/bin/env bash
set -euo pipefail

# nvm errors out if npm_config_prefix is set (common with Homebrew/global npm setups).
# Unset it to allow this script to run in more environments.
unset npm_config_prefix 2>/dev/null || true

node_version=""
if [ -f .nvmrc ]; then
  node_version="$(tr -d '[:space:]' < .nvmrc)"
fi

if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1 && [ -n "$node_version" ]; then
  node_path="$(nvm which "$node_version" 2>/dev/null || true)"
  if [ -n "$node_path" ] && [ -x "$node_path" ]; then
    exec "$node_path" "$@"
  fi
fi

exec "$@"
