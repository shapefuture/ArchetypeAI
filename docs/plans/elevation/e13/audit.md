# E13.01 audit: Interaction grammar

- Bead: `ArchetypeAI-n215` (E13.01). Tracker status at audit: open.
- Checked at: HEAD `5de92d4`, regenerated after an independent review of the first version.
- Disposition: **candidate audit, awaiting a second independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e13-grammar.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e13-grammar.jsx` | 2 (spec files: e13-grammar.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | none The module names `INNERVERSE_DESCENT_V2` as the assessment save target (`src/parts-cartographer/elevation/e13-grammar.ts:36`). | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Predict save, undo, pause, inspect and return across four core paths | Not mapped one-to-one in this audit (see §3) |
| interrupted modal/Back preserves meaningful focus and accurate persisted state. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- predicts save, undo, pause, inspect and return on all four core paths, with a reason for each refusal
- keeps coach pause, return and inspect available without a completed assessment
- distinguishes observation, hypothesis, user authorship and canonical measurement
- produces no canonical result from an incomplete assessment and resumes at the stored item
- keeps canonical coordinates through a rename, an addition and an undo, and refuses a moved or deleted placement
- marks a save as saved only after the read-back matches what was written
- shows an undone value as unsaved until it is saved again, so the stored value never changes silently
- pause with unsaved edits is not safe to leave; after a verified save it is

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.3` | Unify intuitive navigation, responsive layouts and focus continuity | in_progress |
| `ArchetypeAI-28h.2.5` | Make assessment answers durable and interrupted use recoverable | in_progress |
| `ArchetypeAI-28h.2.10` | Author core interaction states and a small original delight catalogue | open |
| `ArchetypeAI-28h.7.1` | Extract reviewed scene grammar and validation from proven manual units | in_progress |
| `ArchetypeAI-28h.7.2` | Build reviewed content editor and reusable authored asset/rig system | in_progress |

## 5. Gaps (judgement, not measurement)

- The interaction registry is local only, so save and undo across the four core paths do not reach a remote store.
- Focus after closing a modal has not been checked in a browser. Focus after Back is checked (`tests/browser/parity.spec.mjs:153-170`).

## 6. Smallest useful slice (educated guess)

Add one browser test for focus after closing the cabinet panel.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (the first review found errors, now corrected; a second review is needed).
