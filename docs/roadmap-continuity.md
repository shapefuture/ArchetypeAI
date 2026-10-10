# Full-plan execution continuity

This protocol implements the user's 2026-10-10 instruction to diagnose and repair execution drift. It is an execution policy, not another task tracker. Current status, acceptance, dependencies and handoff live in Beads.

## What went wrong

Repository evidence supports these causes; it does not establish a private explanation for every earlier model decision:

- The previous AGENTS roadmap paragraph named only `ArchetypeAI-28h`. The elevation, AAA and social expansion existed in plan files/Beads but were not all restored by the default session instructions.
- Both existing Claude hooks invoked bare `bd prime`. The current environment retains Beads under `.onboarding/bin`, outside the default PATH, and Dolt needs the configured writable root. Several gauntlet entries incorrectly treated CLI unavailability as a reason to leave findings unsynchronized. The CLI and database are usable with the preserved setup.
- The custom `.beads/PRIME.md` returns a lean pointer rather than injecting the full memory. Merely running prime did not establish that the mission or next task was recovered.
- The gauntlet repeatedly addressed local moment/Practice/guide presentation and heuristic scores. It identified missing social identity/moderation/contracts and an immutable baseline, but did not systematically move into their ready enabling tasks. The focus on the current slice displaced the complete delivery scope.
- The plans defined many intermediary tasks but there was no executed full-scope check, required next-task handoff, or rejection of a whole-product completion claim with unresolved roots. Extensive uncommitted implementation and sparse live status updates made continuity harder.
- Real participant, service and hardware evidence was correctly left unclaimed. The execution error was allowing those exact blockers to dominate unrelated implementation. The user's conditional authorization permits further implementation; it does not fabricate acceptance.

## Recovery command

Run at entry, compaction/resumption and task transitions:

```bash
python3 scripts/roadmap/continuity.py session
python3 scripts/roadmap/continuity.py status --task ArchetypeAI-9ulr
```

The guard checks all four roots and the task IDs in both expansion graphs against live Beads, includes new descendants through their live hierarchy, and lists eligible and active slices per root. The root/task counts are status counts, not feature-completion percentages. Only IDs/titles/statuses enter the report; issue descriptions, private notes and credentials are not copied.

If the CLI is unavailable, use the preserved onboarding executable or restore its documented installation. If the database cannot open, diagnose configuration/access. If plan artifacts or IDs are missing, restore/publish the exact artifacts and reconcile the live graph. Do not import the passive export, silently reduce scope, or mark placeholders accepted. Missing access does not erase the mission.

## Selecting work

Read the actual selected task and acceptance criteria. Use predecessor outputs and exact contracts; compare current code before adding duplicate implementations. The readiness report does not grant a workcell, allow concurrent shared writes, satisfy a scientific/service prerequisite or permit unsupported deployment.

Complete a bounded useful slice, run relevant checks, and update that Bead with evidence. Separate implementation remaining from outside observations remaining. If a current slice needs real participants or accounts, prepare the actual prerequisites and then choose independent ready work. An already-authorized active prototype may continue while stage acceptance remains pending.

After two cosmetic/review passes without material criterion progress, reassess the full frontier and work on an unfinished behavior or enabling prerequisite. This prevents an indefinitely polished narrow prototype from displacing architecture, social, notification, evidence-library or later-stage work. A justified extra review pass names the exact defect and criterion it will resolve.

## Handoff in Beads

```bash
python3 scripts/roadmap/continuity.py handoff \
  --task <work-bead> --next <ready-or-active-bead> \
  --completed '<implemented criterion or concrete slice>' \
  --remaining '<unfinished criteria and scope>' \
  --evidence '<candidate identity, checks actually run, limitations>' \
  --external-blocker '<exact unavailable evidence/access/resource>'
```

This appends a comment without overwriting notes, and stores `full-plan-handoff` using `bd remember`. Startup explicitly reads that memory because the custom prime pointer does not guarantee injection. The handoff names an actual eligible/active continuation and covers every root. Historical handoff counts never supersede fresh live status. No command automatically closes a task or changes dependencies.

Store the objective as `full-plan-implementation` using `bd remember`. Preserve the user-approved gated implementation, educated design guesses, qualitative phone report, approved Firebase use, skipped billing-dependent Cloud Storage and declined key rotation. Never put a credential, raw private app content or participant record into mission/handoff comments.

## Completion and publication

```bash
python3 scripts/roadmap/continuity.py status --require-complete
```

This must pass before whole-program completion is claimed. A slice-level estimate or build pass is not whole-product acceptance. Genuine external blockers remain attributed and visible; other eligible work continues.

Publish the narrow workflow changes and Beads updates using the authorized repository transports. Preserve unrelated dirty files. If publication fails, record the exact transport failure and local persistence; do not describe an unpushed change as available on another machine. The existing Beads API fallback handles tracker transport only; it is not a code-branch push.

## Checks and limits

`python3 -m unittest discover -s scripts/roadmap -p 'test_*.py'` exercises scope omission, live-root loss, dynamic hierarchy, blocked selection, unfinished-gate completion, plan-ID loss, handoff requirements and report privacy. CI runs the schema/regression checks without treating a repository export as current Beads state.

The Claude session/pre-compaction hooks invoke recovery. Codex is instructed through AGENTS to invoke it directly. This supplies persistent scope restoration and observable failure checks; it does not implement the rest of AAA, manufacture evidence, activate continuous background execution, or make an absolute never-forget guarantee.
