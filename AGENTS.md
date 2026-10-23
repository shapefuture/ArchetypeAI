# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `python3 scripts/roadmap/continuity.py session` to recover the full mission, workflow and live scope.

## Full implementation mission and continuity

The persistent user goal is implementation of the **entire approved program**, including later stages, product elevation, architecture and social/creative/practice extensions. Its four live roots are `ArchetypeAI-28h`, `ArchetypeAI-d6d`, `ArchetypeAI-n0h`, and `ArchetypeAI-we2s`. [Mission scope](scripts/roadmap/mission.json) declares the objective and carried-forward user decisions; [execution protocol](docs/roadmap-continuity.md) explains recovery and handoff. Beads remains the sole task-status authority.

1. At session entry, after compaction/resumption, and before choosing the next implementation slice, run `python3 scripts/roadmap/continuity.py session`. It locates the configured Beads binary, supplies a writable Dolt configuration, explicitly recalls the mission/handoff, and reads the entire scope from live Dolt. A bare missing `bd` on PATH is a setup issue to repair. Do not substitute the passive JSONL export or reinitialize/import the tracker.
2. Inspect the next Bead, acceptance criteria, predecessor outputs and applicable contracts. Validate selection with `python3 scripts/roadmap/continuity.py status --task <id>`. Choose ready enabling work or an already-authorized active slice; the scope report is not an AAA workcell lease.
3. User authorization to implement through later stages and past implementation gates persists. Keep empirical acceptance pending when evidence is missing. A research, hardware, role or service blocker holds its exact scope; continue independent work, implement its enabling prerequisites, or choose another eligible stream. Do not turn a local blocker into a whole-program stop.
4. After each coherent slice, compare remaining acceptance criteria and the complete four-root scope. Avoid repeated cosmetic/heuristic-review passes without material criterion progress. After two such passes, explicitly reassess and select enabling or unfinished implementation work; explain any evidence-based exception in the Bead.
5. Informational/status/critique requests are steering unless the user explicitly pauses, cancels or replaces the program. Answer them briefly, then resume active authorized implementation. At an unavoidable session boundary, persist the full-scope handoff and actual next Bead; a question never silently resets the goal.
6. Before a session handoff, use `python3 scripts/roadmap/continuity.py handoff --task <id> --next <actual-ready-or-active-id> --completed '<criterion/slice>' --remaining '<criteria/scope>' --evidence '<checks, artifact identity and limits>' --external-blocker '<exact unavailable prerequisite, if any>'`. This appends a Beads comment and saves `full-plan-handoff`; never store private participant data or credentials in it. Record real remaining work, not a vague promise to continue.
7. A slice's success does not finish the program. `python3 scripts/roadmap/continuity.py status --require-complete` must pass before claiming complete implementation. The command rejects unresolved scope records and acceptance gates. An ambition or heuristic rubric score cannot supply missing empirical evidence.

The Claude startup and pre-compaction hooks run the same recovery command; Codex follows this AGENTS section directly. These checks make omissions detectable and continuity persistent. They do not provide an always-running agent or a guarantee that an agent can never make an error.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

## Innerverse roadmap context

The core implementation specification is [docs/80-20-plan.md](docs/80-20-plan.md); the preserved archive is [docs/oldplan.md](docs/oldplan.md). [docs/beads-roadmap.md](docs/beads-roadmap.md) maps the dependency-aware core roadmap rooted at `ArchetypeAI-28h`. The elevation, AAA and social/creative roots in the full mission above are equally in scope. Use the continuity guard to account for all roots, then inspect actual ready implementation work; do not mark a feature complete because its plan was written. Preserve the authored loading screen, merged Felt identity, independently controllable sensory richness, the plush inner-cosmos grammar, the four core paths, and the therapist's complete 3+1-axis analytical workspace with explicit 64/147 coordinate provenance. Apply the plan's unprompted intuitiveness and real-service acceptance criteria.

## Client app: React only (owner decision, 2026-10-23)

- **React is the only maintained client.** All product work goes into `src/parts-cartographer/` (React/Vite) and the framework-free code it imports from `src/shared/` and `src/environments/`.
- **The Angular app is frozen.** Do not add features, fixes or refactors to `src/app/`, `src/main.ts` or `angular.json`, and do not port React changes back to Angular. Keep it building only until it is removed. Removal is tracked as `ArchetypeAI-hi8.6` and happens after PR #7 merges.
- **Tasks that name Angular** (for example "Bridge React, Angular and worker consumers") are scoped to React and the worker. Each such Bead carries a dated comment recording this; their acceptance criteria text is unchanged.
- **Russian copy** follows the consolidated `src/shared/i18n/strings.ts`. Address the user as «вы», never «ты», and use its terms: «Self-энергия», «сравнение» (synastry), «ИИ-коуч», «потребность», «нагрузка», «копия» (backup), «практика». Reuse an existing string before writing a new one.

<!-- full-plan-delivery:begin -->
## Full-plan delivery continuity

Use `.agents/skills/full-plan-delivery/SKILL.md` for the approved planning/execution process. The entire mission, scope and carried-forward decisions are in `.delivery/mission.json`; the configured live tracker is the only task-status authority.

- At entry, resumption/compaction and task transitions, run `python3 .agents/skills/full-plan-delivery/scripts/delivery.py session --project .` and inspect the actual selected task, dependencies and acceptance criteria.
- Recover every approved roadmap root and criterion. Planning is not implementation; closed status alone is not acceptance evidence. Never substitute an export for the live tracker.
- Continue within existing authorization. Informational questions do not silently cancel the mission; explicit pauses/cancellations do. Setup authorization alone does not authorize implementation or production changes.
- Attribute missing human/service/hardware evidence to its exact criterion. Prepare enabling work and continue independent eligible slices. Never fabricate observations or silently bypass dependencies.
- Use bounded sweeps, declared source/write/contract scopes and coordinator reservations before parallel writes. A scheduling proposal is not a lock or sandbox. Serialize shared wiring and integration.
- After a coherent slice, record criterion progress, candidate identity, checks and limitations in the tracker. After two review/polish passes without material progress, reassess the entire frontier.
- Before handing off, persist evidence and an actual eligible next task with the skill's `handoff` command. If no eligible work remains, record the exact blockers, owners and unblock actions instead of inventing a next task.
- Before a full-program completion claim, run the skill's `complete` command and obtain the required independent acceptance review. Publish only through already-authorized transports; report actual failures truthfully.

These controls preserve scope and detect drift. They do not provide an always-running agent.
<!-- full-plan-delivery:end -->
