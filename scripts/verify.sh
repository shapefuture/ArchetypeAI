#!/usr/bin/env bash
# Runs the same checks as .github/workflows/ci.yml (guard + verify) on this machine.
# Use it when GitHub Actions cannot run, and paste the summary into the PR.
# Needs: Node (see .nvmrc), Python 3, Java 21 for the Firestore emulator, and Chromium for Playwright
# (set CHROMIUM_PATH to use a browser that is already installed).
set -uo pipefail
cd "$(dirname "$0")/.."

results=()
failed=0
step() {
  local name=$1; shift
  printf '\n=== %s\n' "$name"
  if "$@"; then results+=("PASS  $name"); else results+=("FAIL  $name"); failed=1; fi
}

# guard job
step "continuity guard" bash -c "python3 scripts/roadmap/continuity.py schema \
  && python3 -m unittest discover -s scripts/roadmap -p 'test_*.py' \
  && python3 -m unittest discover -s .agents/skills/full-plan-delivery/tests -p 'test_*.py'"
step "AAA source pin" python3 -I -m unittest discover -s tests/architecture/a01 -p 'test_*.py'
step "citation checker tests" python3 -m unittest discover -s scripts/docs -p 'test_*.py'
step "document citations" bash -c "python3 scripts/docs/check_cites.py --strict \$(git grep -l 'cite-ref:' -- '*.md')"

# verify job
step "audit production dependencies" npm audit --omit=dev
step "type-check" npm run lint
step "unit tests" npm test
step "Firestore rules" npm run test:rules
step "build" npm run build
step "browser tests" npm run test:browser

printf '\nLocal CI on %s (%s)\n' "$(git rev-parse --short HEAD)" "$(git status --porcelain | grep -q . && echo 'uncommitted changes' || echo 'clean tree')"
printf '%s\n' "${results[@]}"
exit $failed
