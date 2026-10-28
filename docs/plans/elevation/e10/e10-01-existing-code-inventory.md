# E10.01 — Existing-code inventory and evidence map

**Candidate status:** source-only proposal; independent review pending; task acceptance is on hold.
**Live task:** `ArchetypeAI-aft` (`[E10.01] Audit existing behavior and reconcile original Beads`).
**Pinned source generation:** `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
**Actual output:** `docs/plans/elevation/e10/e10-01-existing-code-inventory.md`.

## Scope and execution record

This candidate follows the live task's declared read set: `src/parts-cartographer/screens/replay.jsx`, `docs/80-20-plan.md`, and `architecture/contracts/**`. Its only declared write is this inventory under `docs/plans/elevation/e10/**`. The candidate was prepared in a clean isolated clone at the pinned commit.

- Actual cell manifest: `manifest-e10-01.json` in the isolated workcell; SHA-256 `9f1e7e732abe38b8e10f6b92e0401a1cf5c4756d797b38c1d5e81cae0f646758`.
- Local coordinator reservation: `4f36a4fc73cc4ab0bc5a15ee77b0417f`. This is workcell-local coordination, not a broker lease, task claim, or permission grant.
- Filtered live Beads status record: `/tmp/e10-01-live-status-snapshot.json`, SHA-256 `baf609c599dcfef24dbfb360d4b21a0f79b7186da07698c979729a38b8df127c`; read-only query ran from `2026-10-14T23:26:35.390438Z` to `2026-10-14T23:26:35.669712Z`. It records task revision `-7977452878222327334`, status `in_progress`, assignee `Виктор П`, lease expiry `2026-10-14T23:30:22Z`, parent `ArchetypeAI-al3` still `open`, the unchanged parent-child edge, and unchanged task read/write sets and unbound metadata. This is an operational status snapshot, not independent acceptance evidence. No task close or dependency edit occurred.
- The Beads metadata still has `base_generation: null` and no pinned contract versions. The cell pins a Git source generation for this proposal; it does not repair those task metadata gaps.
- No application files or contracts were changed. No tests, builds, services, participant or user contact, device checks, assistive-technology checks, or data collection were performed. No runtime behavior was observed.
- Rollback for this candidate is removal of this one document. There are no application, service, data, or deployment effects.

## Source inventory

| Declared source | Pinned-generation result | Evidence identity |
|---|---|---|
| `src/parts-cartographer/screens/replay.jsx` | Absent from the pinned Git tree; the path cannot be opened in this generation. This is an observed repository fact, not proof that no Replay behavior exists elsewhere or in another revision. | No file hash; no Git tree entry at the declared path. |
| `docs/80-20-plan.md` | Present and read. Its Stage 3 and execution/boundary sections describe desired Replay behavior and verification. These are plan statements, not implementation evidence or published contracts. | SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`. |
| `architecture/contracts/**` | No such directory or files in the pinned generation. No relevant contract version was available in this read set. | No file hashes; directory absent. |

The plan's Stage 3 (`§11`) proposes one manually authored scene before a generator; an opt-in, low-intensity situation; Watch pause/replay/skip and transcript; a small set of Director controls; an editable external constraint; multiple tentative readings; bounded inner negotiation; a try-another-sentence/action or leave choice; a persistent resource/return action; and an explicitly saved chosen move. It calls for hypothetical branches to remain labeled as hypothetical, accessible parity through text and non-3D alternatives, deterministic transition/provenance/return tests, and comparison with concise guided text. The same plan says Replay/memory/shared-content structures should follow contracts and prototypes rather than become unrestricted mutable state (`§16.5`).

These are **plan-only intentions**. This inventory does not establish that any of them exist in code, that a contract exists, or that a user has completed a scenario.

## Existing behavior versus intended behavior

### Direct observations

- The declared Replay implementation file is not present at the pinned base, so no screen, state transition, branch response, save path, or interruption behavior can be inspected here.
- The declared contract directory is absent, so there is no source-grounded answer for schema, producer/consumer, ownership, validation, offline behavior, migration, rollback, retention, or error semantics.
- No concrete Replay fixture, saved artifact, or trace was included in the declared read set.

### Plan-only intent

- A changed practical constraint should make an imagined scene change in a legible way; changing a sentence/action is another proposed branch.
- A person should be able to opt in, pause, replay, skip, use text, choose a practical move, or leave. The plan proposes preserving a clear return location and not forcing resumption.
- The plan asks that hypothetical branches remain labeled as hypothetical and that a narrator not declare one part the true cause or predict another person. It separately proposes a user-editable cast and user-drafted agreement; it does not state that branches themselves are user-authored.
- A concise guided-text version is the comparator. The plan requires evaluating comprehension, choice quality, comfort, cognitive load, and later usefulness rather than treating time spent playing as success.

### Inferences and open design questions

- A useful first implementation review would need to trace scene content, editable constraint/sentence input, branch generation, save/return ownership, and the guided-text alternative through their real producers and consumers. This is an investigation proposal, not an assertion about current architecture.
- The task scenario says “pause/leave clears unsaved rehearsal,” while the plan also asks for a clear return location. The evidence available here does not define whether a bookmark may persist while unsaved scene content is discarded. Keep those states distinct in a future contract and verify the intended behavior before calling either outcome correct.
- The plan's requirement to ask whether a selected move should be saved implies an explicit choice boundary, but storage, deletion, account scope, and failure recovery remain unspecified without the relevant contract and implementation.

## Scenario and state evidence map

The three task scenarios remain **unobserved**. The states below are the smallest review probes implied by those scenarios and the plan; they are not claims that such states or controls exist.

| Probe | Evidence available now | Required next evidence |
|---|---|---|
| Change one practical limit or sentence; inspect the hypothetical branch | None: Replay source, contract, and fixture are unavailable. | Exact implementation path and fixture; before/after output; provenance showing the branch stays hypothetical; confirm no canonical score or identity is mutated. |
| Pause or leave with an unsaved rehearsal | None: no state owner, save path, or lifecycle code is available. | Trace pause, leave, return, and save failure; establish what unsaved content is discarded and what location (if any) persists. |
| Use guided text for the same useful tool | Plan says to compare with concise guided text; no actual comparator or outcome is available. | Same-purpose scene/text fixture and independent evaluation of usability, comprehension, burden, and choice quality. |
| Normal entry | No observed normal route or scene exists in the declared source. | A real route trace from opt-in through chosen action. |
| Empty state | No observed empty-scene or no-input behavior. | Define and inspect first-entry/no-edit behavior without inventing user context. |
| Denied or declined entry | Plan proposes an opt-in invitation and a leave choice; implementation is unavailable. | Inspect decline/leave outcomes and confirm no forced continuation or unintended save. |
| Failed action or save | No persistence contract or failure path is available. | Exercise the actual failure boundary and record recovery, visible status, and duplicate-save behavior. |
| Interrupted state | Plan proposes pause and a clear return location; actual lifecycle is unavailable. | Interrupt and return using the real owner/storage boundary; verify the specified unsaved-content semantics. |
| Quiet/accessibility alternative | Plan calls for transcript, labeled choices, keyboard controls, static scene, and equivalent text output; none is observed. | Review the actual non-motion, keyboard, screen-reader, and text paths; obtain the required human/assistive-technology evidence separately. |

No “pass” is assigned to these probes. Automated checks, if later authorized and applicable, cannot establish participant, device, scientific, or assistive-technology acceptance on their own.

## Original-Bead reconciliation

The task description names `ArchetypeAI-28h.4.1` through `ArchetypeAI-28h.4.4` as original acceptance context. This candidate did not read those Beads, their predecessor outputs, or `docs/eleven-out-of-ten-plan.md`: they are outside the live task's declared source read set for this workcell. Consequently, this document **does not reconcile** their authored criteria, status, dependencies, or evidence and does not claim that older criteria are satisfied or preserved. It also does not inspect or infer predecessor findings.

To complete reconciliation, the task owner should authorize and bind those exact Bead records and required predecessor artifacts into the task's read set. Then compare each original criterion against the pinned implementation, current E10 criteria, and available evidence; record conflicts without silently dropping the original requirement.

## Smallest useful next slice

The useful result from this bounded workcell is a traceable inventory of what the pinned source set does and does not establish. The next implementation-facing review should wait for the actual Replay source and published contracts to be made available in the task's read set. With those in hand:

1. map the actual route, scene/state owner, branch inputs, hypothetical outputs, save/return behavior, and guided-text path;
2. resolve the pause/leave versus return-location semantics and the experiment-card ownership boundary;
3. exercise the three named scenarios and the relevant empty, denied, failed, interrupted, and quiet states against concrete fixtures; and
4. compare the authored scene to the concise guided-text tool with independent evidence, leaving empirical and accessibility criteria open until genuinely observed.

This is a proposed handoff only. It does not implement a scene, create a contract, rewrite a shared screen, run tests, reconcile old Beads, or close E10.01. Independent source review remains pending. The task must remain open until its actual acceptance criteria and all material evidence gaps are independently reviewed and recorded.
