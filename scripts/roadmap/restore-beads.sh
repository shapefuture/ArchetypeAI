#!/usr/bin/env bash
# Rebuild the local Beads database from refs/dolt/data on the sync remote.
#
# Fresh clones (and cloud sessions) have no .beads/embeddeddolt. Running
# `bd` there would create an empty database and import .beads/issues.jsonl,
# which is only a passive export. This script restores the synced tracker
# instead, then exits. It does nothing when a database already exists.
#
# The sync remote is the one .beads/config.yaml names under `sync:`, the same
# remote bd syncs with. origin is not consulted, because it normally has no
# such ref. The ref is fetched into a private bare copy, so this repository's
# refs are not written and nothing is pushed. Needs `bd` on PATH or in BEADS_BIN.
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

# sync.remote as written in config.yaml, without quotes. Commented lines and other sections are ignored.
sync_remote="$(awk '
  /^[^[:space:]#]/ { in_sync = ($0 ~ /^sync:/) }
  in_sync && /^[[:space:]]+remote:/ {
    value = $0
    sub(/^[[:space:]]+remote:[[:space:]]*/, "", value)
    gsub(/"/, "", value)
    sub(/[[:space:]]+$/, "", value)
    print value
    exit
  }
' "$repo/.beads/config.yaml")"
if [ -z "$sync_remote" ]; then
  echo "restore-beads: .beads/config.yaml names no sync.remote; there is nothing to restore from" >&2
  exit 1
fi
# bd writes the remote as git+https://... (or git+file://...); git needs the plain URL.
fetch_url="${sync_remote#git+}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git init -q --bare "$work/data.git"
# GIT_TERMINAL_PROMPT=0 makes a missing credential fail at once instead of waiting for input in a hook.
GIT_TERMINAL_PROMPT=0 git -C "$work/data.git" fetch -q "$fetch_url" "+refs/dolt/data:refs/dolt/data"
want="$(git -C "$work/data.git" rev-parse refs/dolt/data)"

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
# Point only the sync remote at the private copy. Every other line is copied unchanged.
awk -v local_url="git+file://$work/data.git" '
  /^[^[:space:]#]/ { in_sync = ($0 ~ /^sync:/) }
  in_sync && !done && /^[[:space:]]+remote:/ {
    indent = $0
    sub(/[^[:space:]].*$/, "", indent)
    $0 = indent "remote: \"" local_url "\""
    done = 1
  }
  { print }
' "$repo/.beads/config.yaml" > "$ws/.beads/config.yaml"
grep -qF "git+file://$work/data.git" "$ws/.beads/config.yaml" || {
  echo "restore-beads: could not point the sync remote at the local copy" >&2
  exit 1
}
chmod 700 "$ws/.beads"

(cd "$ws" && BEADS_DIR="$ws/.beads" "$bd" bootstrap --yes >/dev/null)

total="$(cd "$ws" && BEADS_DIR="$ws/.beads" "$bd" stats 2>/dev/null | awk '/Total Issues:/ {print $3}' || true)"
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
