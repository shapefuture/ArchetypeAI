#!/usr/bin/env bash
# Setup script for Claude Code cloud environments.
#
# Paste this into the environment's "Setup script" field. It installs the
# Beads CLI that the SessionStart and PreCompact hooks need. The tracker
# database itself is restored by scripts/roadmap/restore-beads.sh, which
# the SessionStart hook runs once the repository is cloned.
set -euo pipefail

BD_VERSION=v1.3.1

if ! command -v bd >/dev/null 2>&1; then
  # bd links against ICU through Dolt.
  if ! dpkg -s libicu-dev >/dev/null 2>&1; then
    apt-get install -y -q libicu-dev || { apt-get update -q && apt-get install -y -q libicu-dev; }
  fi
  # The v1.x tags declare their module path as github.com/steveyegge/beads, so
  # installing through the gastownhall path fails with a version constraint
  # conflict. Install the module under the path its go.mod declares.
  GOBIN=/usr/local/bin GOFLAGS=-mod=mod go install "github.com/steveyegge/beads/cmd/bd@${BD_VERSION}"
fi
bd --version
