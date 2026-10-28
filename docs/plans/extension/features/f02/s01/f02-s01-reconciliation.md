# F02.S01 — Inventory: finite life-event gatherings and cohorts (reconciliation)

- Bead: `ArchetypeAI-3byv` (F02.S01).
- Base checked: `git:45c24ed` on `claude/full-plan-handoff-gmgpkq`.
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `docs/plans/extension/features/f02/s01/**` (this file only).
- Contracts: none published. `base_generation: null`. No lease.

## 1. Finding

No gathering or cohort entity exists. The closest vocabulary is the check-in event categories (`relational`, `achievement`, `loss`, `boundary`, `change`, `calm`), which are personal check-in categories and not gatherings. This reconciliation is a gap map, not a rebuild of existing behaviour.

## 2. Existing code and reuse

| Area | Evidence (file:line) | Status |
|---|---|---|
| Check-in event categories | `src/app/features/checkin-panel/checkin-panel.component.ts:156` | Personal life-event vocabulary. Reusable as a label set, not as gatherings. |
| Gathering or cohort entity | none | Absent. |
| Cohort membership | none | Absent. |
| Finite lifecycle (open, closed, archived) | none | Absent. |

**Reuse packages named by the task.** The planning documents define these codes inconsistently across streams (the B01 inventory recorded the same ambiguity). Each code is an unresolved reuse claim until the coordinator confirms its mapping.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Gathering (purpose, dates, finite capacity) | No | Needs an end date and a closed state. |
| State | Cohort membership (who, when, consent) | No | Needs recipient authority and removal. |
| Effect | Opening and closing a gathering | No | One-way close needs a clear undo window or explicit warning. |
| Component | Gathering card, cohort roster | No | No screens exist. |

## 4. Scenario matrix (specified, not exercised)

| Scenario | Expected behaviour (planned) | Exercised today |
|---|---|---|
| Normal grant | The capability is used only after an explicit grant | No |
| Denied grant | A denied grant leaves the state unchanged and says so | No |
| Stale contract | An older version is read as legacy, never reinterpreted | No |
| Account change | State is scoped to the account that owns it | No |
| Deleted source | Removing the source keeps history and marks dependants | No |
| Duplicate or cancelled operation | A repeated or cancelled operation has no second effect | No |
| Offline or quiet alternative | The feature stays optional and can be ignored | No |


## 5. Six compatibility dimensions for `finite life-event gatherings and cohorts`

The plan's fixture task names six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases.

| Dimension | Planned case for `finite life-event gatherings and cohorts` | Exercised today |
|---|---|---|
| Interface | The surface does not block core navigation | No |
| State | State is versioned; legacy reads are explicit | No |
| Effects | Writes are idempotent | No |
| Operations | Operations are reversible or clearly one-way | No |
| Performance | Lists stay bounded on large histories | No |
| Failure | A storage refusal is reported and prior state is kept | No |

## 6. Source provenance

| File | SHA-256 |
|---|---|
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` |

## 7. Pending evidence (not claimed)

- Participant evidence on whether finite gatherings help: **pending**.
- Independent review of this inventory: **pending**. No participant, practitioner, device or live-service evidence is claimed.

## 8. Limitations and next handoff

- The Beads live status of the reuse packages and sibling tasks was not read. The passive export is stale.
- The six dimensions come from the plan's fixture task, because the plan gives no stream-specific list.
- Next handoff: **F02.S02 (smallest missing slice: a gathering schema with a finite lifecycle, specified not implemented)**. The coordinator must confirm the reuse mapping and record the Beads note (this commit does not touch Beads).
