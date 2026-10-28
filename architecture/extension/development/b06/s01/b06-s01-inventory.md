# B06.S01 — Inventory: optional practical progression and quests
<!-- cite-ref: 45c24ed -->

> **Independent review (2026-10-16).** Round 1 at `f8746dc`: FAIL (minor), the search list missed UI `badge` hits. Round 2 at `f8746dc`: FAIL (material), §1 said no progression exists, which was false. Round 3 at `8751dad`: FAIL. The guidance progression was overclaimed: `progressAfter` is called only from its spec, not from the mounted transfer panel. §§1-5 now say so, and the two weak §5 rows name their identifiers. Base note: §6 hashes are for the base-era `checkin-panel` file, not HEAD. Status is still **candidate, not accepted**; re-review is required.

- Bead: `ArchetypeAI-ntjo` (B06.S01, planning key `B06.S01`, planning task `ArchetypeAI-cyqe`).
- Base checked: `git:45c24ed` on `claude/full-plan-handoff-gmgpkq` (the commit before this candidate).
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `architecture/extension/development/b06/s01/**` (this file only).
- Contracts: none published (`contract_versions: []`). `base_generation: null`. No lease.

## 1. Finding in one paragraph

At the base commit 45c24ed there was no progression, reward, quest or skill-graph code. Two optional progression mechanisms were added after the base, and both are present at HEAD:

- **Artifact progression with user-chosen rewards** (`src/parts-cartographer/core/artifact-progression.ts@3683b0f`, added in commit 216a97b). Progress counts the artifacts a person keeps and their revisions. A reward is chosen by the person from their own list and never locks or unlocks anything. The state is stored in the practice toolkit under `INNERVERSE_TOOLKIT_V1` (`src/parts-cartographer/screens/practice-toolkit.jsx:22@3683b0f`, normalised at `:370`), and the toolkit is mounted in the practice screen (`src/parts-cartographer/screens/practice.jsx:330@3683b0f`).
- **Guidance progression for transfer** (`src/parts-cartographer/elevation/e08-transfer.ts@3683b0f`, `progressAfter`). After an unaided recall, one lighter help step is suggested, and nothing changes until the person chooses. The transfer panel that would call it is mounted in the practice screen (`src/parts-cartographer/screens/practice.jsx:327@3683b0f`), but that panel does not import `progressAfter`. The step is tested and not wired.

No quest, skill graph, repertoire or shared quest state exists. Optional rewards that would change formal measurement are absent by design (the 64/147 provenance). This inventory therefore reconciles two existing mechanisms against the B06 scope and records what is still missing. It is not evidence that progression helps anyone.

## 2. Existing code and what can be reused

| Area | Evidence (file:line) | Status for B06 |
|---|---|---|
| Artifact progression model | `src/parts-cartographer/core/artifact-progression.ts@3683b0f` (`progressFor`, `revise`, `chooseReward`, `isEssentialLocked`) | Present at HEAD (216a97b, after base). Reusable as the progression model. Essentials are never locked (`isEssentialLocked` returns false). |
| Guidance progression | `src/parts-cartographer/elevation/e08-transfer.ts@3683b0f` (`progressAfter`; HEAD only) | Present as a pure function with unit tests. Not called by the mounted transfer panel. One lighter help step after an unaided recall, if called. No points. |
| Practice toolkit storage | `src/parts-cartographer/screens/practice-toolkit.jsx:22@3683b0f` (HEAD) (`TOOLKIT_KEY`), `:370@3683b0f` (`normalizeToolkit`) | Stores `artifacts`, `rewardOptions` and `rewardChoice` alongside cards, outcomes and reviews. Device-local. |
| Event-type label `achievement` | `src/app/features/checkin-panel/checkin-panel.component.ts:156` | Label only. Not a reward event; no points, unlocks or state. |
| Storage port | `src/parts-cartographer/core/ports.ts:15-21`, `src/parts-cartographer/core/local-store.ts:15` (`store`) | Reusable for device-local state. |
| Part identity and stickers | `src/shared/features/landing/stickers.ts:223@3683b0f` (HEAD) (`sticker`) | Identity rendering. Not progression. |

**Reuse packages (`C02`, `C08`).** The task metadata names them, but the planning documents do not define them consistently. The B01 inventory recorded the same ambiguity. This inventory does not resolve it. Until the coordinator confirms the mapping, `C02` and `C08` are unmapped reuse claims, not verified reuse.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Artifact count and revisions | Yes at HEAD | `progressFor` and `revise`, stored in the practice toolkit. |
| State | Optional reward choice | Yes at HEAD | `chooseReward` accepts only an option the person chose. |
| State | Guidance level for transfer | Function only, not wired | `progressAfter` would suggest one lighter step; the person chooses. |
| State | Skill DAG and node completion | No | Would need a versioned schema and a migration rule. |
| State | Shared quest state | No | Multi-party state. Needs consent and recipient rules. |
| State | User-chosen route, separate from the goal | No | The E01 goal is the nearest user-chosen record. A separate route is absent. |
| Effect | Award on completion | No | Rewards are never awarded automatically. Revisions only add. |
| Effect | Notify on reward | No | Depends on the notification policy (B05). Not reused here. |
| Component | Progression view | Partly | The Artifacts tab of the practice toolkit. No dedicated progression screen. |

## 4. Scenario matrix (planned, not exercised)

Each row describes how the existing progression mechanisms behave, or how they must behave for the B06 scope. Rows marked "gap" are not implemented.

| Scenario | Expected behaviour (planned or existing) | Exercised today |
|---|---|---|
| Normal grant | Progress advances only when the person saves an artifact or revises one they kept. Opening the screen advances nothing. | Module tests only |
| Denied grant | `chooseReward` refuses an id outside the person's own list, or any option not marked as chosen by the user, and returns null. | Module tests only |
| Stale contract | A toolkit record without an `artifacts` field normalises to an empty list. It never shows as progress. | No |
| Account change | Gap: artifacts and rewards live under one device-local key, so a second account on the same device sees the same list. Progression is not account-scoped. | No |
| Deleted source | Progress is recomputed from the stored list, so removing an artifact lowers the count. The UI delete path was not verified in this pass. | No |
| Duplicate or cancelled operation | Revising twice adds two revisions (by design). A cancelled save writes nothing. | No |
| Offline or quiet alternative | Progress is local and works offline. No notification is sent. Progress never blocks an essential. | No |

## 5. Six compatibility dimensions for `progression.repertoire`

The plan's fixture task names six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases.

| Dimension | Planned or existing case for `progression.repertoire` | Exercised today |
|---|---|---|
| Interface | The Artifacts tab is one of four toolkit tabs (`src/parts-cartographer/screens/practice-toolkit.jsx@3683b0f`; HEAD 3683b0f, absent at 45c24ed). The core practice screen does not depend on it. | No |
| State | Progress is derived from the stored artifacts (`progressFor`, `src/parts-cartographer/core/artifact-progression.ts@3683b0f`; HEAD 3683b0f, absent at 45c24ed) rather than stored separately. `revise` keeps every artifact. | Module tests only |
| Effects | Reading progress writes nothing. Saving an artifact is one device-local write through `store` (`src/parts-cartographer/core/local-store.ts`). | No |
| Operations | `revise` only adds a revision. `chooseReward` replaces an earlier choice only with another option the person picked. | Module tests only |
| Performance | Progress is linear in the number of artifacts (`progressFor`). There is no pagination, so long lists are an untested bound. | No |
| Failure | `normalizeToolkit` falls back to empty fields for malformed input (`practice-toolkit.jsx:370@3683b0f`; HEAD only). Whether a corrupt original is copied aside before a save was not verified. | No |


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
