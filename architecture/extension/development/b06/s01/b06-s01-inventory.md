# B06.S01 — Inventory: optional practical progression and quests

- Bead: `ArchetypeAI-ntjo` (B06.S01, planning key `B06.S01`, planning task `ArchetypeAI-cyqe`).
- Base checked: `git:10d9608` on `claude/full-plan-handoff-gmgpkq` (the commit before this candidate).
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `architecture/extension/development/b06/s01/**` (this file only).
- Contracts: none published (`contract_versions: []`). `base_generation: null`. No lease.

## 1. Finding in one paragraph

The codebase contains **no** quest, reward-event, skill-graph, progression-repertoire or practice-progression implementation. A whole-word search of `src/` (non-spec) for `quest`, `quests`, `reward`, `rewards`, `progression`, `repertoire`, `achievement`, `achievements` and `badge` finds only: an event-type label `achievement` in the check-in panel, and sticker/character rendering (which is identity, not progression). Therefore this slice is a **gap statement plus a reuse map**, not a reconciliation of existing behaviour. Nothing here should be read as evidence that progression exists or works.

## 2. Existing code and what can be reused

| Area | Evidence (file:line) | Status for B06 |
|---|---|---|
| Event-type label `achievement` | `src/app/features/checkin-panel/checkin-panel.component.ts:156` | Label only. Not a reward event; no points, unlocks or state. |
| Storage port | `src/parts-cartographer/core/ports.ts:15` (`STORAGE_PORT`) and `src/parts-cartographer/core/local-store.ts:15` (`store`) | Reusable for device-local progression state, if B06 chooses device-local storage. |
| Store keys | `src/parts-cartographer/core/local-store.ts:56` (`KEYS`) | No progression key exists. A new key would be a new contract. |
| AI and billing ports | `src/parts-cartographer/core/ports.ts:24` (`AI_PORT`), `:35` (`BILLING_PORT`) | Not progression; listed so the coordinator does not treat them as reusable progression surfaces. |
| Part identity and stickers | `src/app/features/landing/stickers.ts:223` (`sticker`) | Identity rendering. Not progression. |

**Reuse packages (`C02`, `C08`).** The task metadata names them, but the planning documents do not define them consistently. The B01 inventory recorded the same ambiguity. This inventory does not resolve it. Until the coordinator confirms the mapping, `C02` and `C08` are unmapped reuse claims, not verified reuse.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Skill DAG and node completion | No | Would need a versioned schema and a migration rule. |
| State | Evidence label per practice (observed / self-report / model inference) | No | Must keep the user's own evidence distinct from model output. |
| State | Optional reward events | No | Must never change formal measurement scores (`64/147` provenance). |
| State | Shared quest state | No | Multi-party state. Needs consent and recipient rules. |
| State | User-chosen route | No | Route choice must be stored as user intent, not inferred. |
| Effect | Award on completion | No | Would be a write effect. Needs duplicate-award protection. |
| Effect | Notify on reward | No | Depends on the notification policy (B05). Not reused here. |
| Component | Progression panel | No | No screen exists. |
| Component | Quest chooser | No | No screen exists. |

## 4. Scenario matrix (specified, not exercised)

Each scenario is required by the acceptance criteria. Every cell is a planned expectation, not an observed result.

| Scenario | Expected behaviour for B06 | Exercised today |
|---|---|---|
| Normal grant | Choosing a route records intent; progress advances only on verified completion | No |
| Denied grant | A denied permission leaves progress unchanged and says so | No |
| Stale contract | An older progression schema is read as legacy, never silently reinterpreted | No |
| Account change | Progression is scoped to the account that earned it | No |
| Deleted source | Removing the source practice keeps history and marks the reward as orphaned | No |
| Duplicate or cancelled operation | A repeated completion awards once; a cancelled quest awards nothing | No |
| Offline or quiet alternative | Progression stays optional and can be ignored without penalty | No |

## 5. Six compatibility dimensions for `progression.repertoire`

The plan's fixture task (`B01.S04` in the same graph) names the six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases. B06 must cover the same six. None is implemented.

| Dimension | Planned case | Exercised today |
|---|---|---|
| Interface | Optional progression screens do not block core navigation | No |
| State | Progress schema versioned; legacy reads explicit | No |
| Effects | Reward writes are idempotent | No |
| Operations | Route choice and quest start are reversible | No |
| Performance | Progression lists stay bounded on large histories | No |
| Failure | Storage refusal reports the failure and keeps prior progress | No |

## 6. Source provenance

| File | SHA-256 |
|---|---|
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` |
| `src/parts-cartographer/core/local-store.ts` | `6e8c1f2dc9122fa917545041cc8cdcba5cc6619cc0181b4e71606e1d19db9a1d` |
| `src/app/features/checkin-panel/checkin-panel.component.ts` | `86c5148b239ee37cffb0b30dacfca4b91a6ce0a8323e018a65cc2b7a36b82214` |

## 7. Pending evidence (not claimed)

- Participant evidence on whether optional progression motivates or distracts: **pending**. No participants were contacted.
- Practitioner or tradition review of any reward framing: **pending**.
- Independent review of this inventory: **pending**.
- Real-device checks of any progression surface: **pending** (none exists).

## 8. Limitations and next handoff

- Limitation: the Beads live status of `C02`, `C08` and the B06 siblings was not read. The passive export is stale.
- Limitation: the six dimensions are taken from the plan's fixture task, not from a B06-specific list, because the plan defines none for `progression.repertoire`.
- Next handoff: **B06.S02** (authoritative state, grants and effects). The coordinator must confirm the `C02`/`C08` mapping before B06.S02 starts, and must record the Beads note in `ArchetypeAI-ntjo` (this commit does not touch Beads).
