#!/usr/bin/env bash
# Rebuild the local Beads database from refs/dolt/data on GitHub.
#
# Fresh clones (and cloud sessions) have no .beads/embeddeddolt. Running
# `bd` there would create an empty database and import .beads/issues.jsonl,
# which is only a passive export. This script restores the synced tracker
# instead, then exits. It does nothing when a database already exists.
#
# The restore reads a private local copy of the ref, so it can never push
# to the remote. Needs `bd` on PATH or in BEADS_BIN.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bd="${BEADS_BIN:-$(command -v bd || true)}"
[ -z "$bd" ] && [ -x /tmp/beads-bin/bd ] && bd=/tmp/beads-bin/bd

if [ -d "$repo/.beads/embeddeddolt" ]; then
  exit 0
fi
if [ -z "$bd" ]; then
  echo "restore-beads: bd not found; install it (see scripts/roadmap/cloud-setup.sh)" >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git -C "$repo" fetch -q origin "+refs/dolt/data:refs/remotes/origin/dolt-data"
want="$(git -C "$repo" rev-parse refs/remotes/origin/dolt-data)"

git init -q --bare "$work/data.git"
git -C "$repo" push -q "$work/data.git" "refs/remotes/origin/dolt-data:refs/dolt/data" 2>/dev/null
# Dolt will not clone from a git remote without a branch, so add an empty one.
empty_tree="$(git -C "$work/data.git" hash-object -t tree -w /dev/null)"
placeholder="$(GIT_AUTHOR_NAME=restore GIT_AUTHOR_EMAIL=restore@localhost \
  GIT_COMMITTER_NAME=restore GIT_COMMITTER_EMAIL=restore@localhost \
  git -C "$work/data.git" commit-tree "$empty_tree" -m placeholder)"
git -C "$work/data.git" update-ref refs/heads/main "$placeholder"
git -C "$work/data.git" symbolic-ref HEAD refs/heads/main

ws="$work/ws"
mkdir -p "$ws/.beads"
git -C "$ws" init -q
git -C "$ws" remote add origin "file://$work/data.git"
cp "$repo/.beads/metadata.json" "$ws/.beads/metadata.json"
sed "s#remote: \"git+https://github.com/shapefuture/ArchetypeAI.git\"#remote: \"git+file://$work/data.git\"#" \
  "$repo/.beads/config.yaml" > "$ws/.beads/config.yaml"
grep -q "git+file://$work/data.git" "$ws/.beads/config.yaml" || {
  echo "restore-beads: could not point the sync remote at the local copy" >&2
  exit 1
}
chmod 700 "$ws/.beads"

(cd "$ws" && BEADS_DIR="$ws/.beads" "$bd" bootstrap --yes >/dev/null)

total="$(cd "$ws" && BEADS_DIR="$ws/.beads" "$bd" stats 2>/dev/null | awk '/Total Issues:/ {print $3}')"
if [ -z "$total" ] || [ "$total" -eq 0 ]; then
  echo "restore-beads: restored database is empty; leaving .beads untouched" >&2
  exit 1
fi

# Another process may have created a database meanwhile; never overwrite it.
if [ -d "$repo/.beads/embeddeddolt" ]; then
  exit 0
fi
cp -a "$ws/.beads/embeddeddolt" "$repo/.beads/embeddeddolt"
chmod 700 "$repo/.beads"
echo "restore-beads: restored $total issues from refs/dolt/data ${want:0:7}"
