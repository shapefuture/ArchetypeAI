# E06.01 audit: Corrections that propagate

- Bead: `ArchetypeAI-wbc` (E06.01). Tracker status at audit: open.
- Checked at: HEAD `56088ca`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e06-corrections.ts` | 14 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e06-corrections.jsx` | 3 (spec files: e06-corrections.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_CORRECTIONS_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Reject a hypothesis, inspect affected summaries/context, undo it and delete its source | Not mapped one-to-one in this audit (see §3) |
| rejected interpretation never reappears through stale retrieval. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- rejecting a hypothesis marks its derived summary and context stale and writes a receipt naming what was left alone
- undo restores the hypothesis, while projections stay stale until rebuilt from active sources
- deleting a source erases its wording and everything derived from it; undo afterwards is refused and cached copies stay blocked
- a rejected interpretation never reappears through stale or fresh retrieval, by id or by wording
- revising a reading supersedes its wording, keeps the old wording on record as rejected, and marks its summaries stale
- canonical measurements are never modified, corrected, deleted or used as a parent
- the model may add interpretations and rebuild projections, but cannot reject, undo, revise, delete or author observations
- a model rebuild cannot reintroduce rejected wording or build on a rejected source

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.11` | Implement visible bounded consent/context handoff | open |
| `ArchetypeAI-28h.2.13` | Review coach usefulness, retained artifacts and conversational boundaries | open |
| `ArchetypeAI-28h.5.1` | Define inspectable personal-memory provenance and deletion propagation | in_progress |
| `ArchetypeAI-28h.5.6` | Create a user-controlled personal evidence library | open |
| `ArchetypeAI-28h.5.7` | Enable user-directed AI edits to personal part memory | open |

## 5. Gaps (judgement, not measurement)

- The panel lists each node with its status and Reject, Undo and Remove actions (`src/parts-cartographer/screens/elevation/e06-corrections.jsx:100-121`). It does not list the summaries each node affects; none is listed in `e06-corrections.jsx`.
- Source deletion has one UI test (`e06-corrections.spec.ts:62-69`). Undo is covered by module tests only.

## 6. Smallest useful slice (educated guess)

If the step needs it, show the summaries each node affects, and test that list against the module output.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
