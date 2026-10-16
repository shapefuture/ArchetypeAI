# E10.01 audit: Rehearsal branches

- Bead: `ArchetypeAI-aft` (E10.01). Tracker status at audit: open.
- Checked at: HEAD `52002da`, generated 2026-10-16.
- Disposition: **candidate audit, awaiting independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e10-scene-response.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e10-rehearsal.jsx` | 2 (spec files: e10-rehearsal.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/practice.jsx` | - |
| Storage key | `INNERVERSE_REHEARSAL_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Change a practical limit or sentence and inspect hypothetical branch response | Not mapped one-to-one in this audit (see §3) |
| pause/leave clears unsaved rehearsal | Not mapped one-to-one in this audit (see §3) |
| guided text produces the same usable tool. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- moves along an authored exit with the scene text, its text alternative and the hypothetical label
- rejects a target that is not an exit of the current frame, including any move out of a terminal frame
- a practical limit changes the hypothetical options and blocks the branch it constrains until it is switched of
- refuses an undeclared limit, so no invented constraint can block a branch
- previews the person\
- rejects a sentence that predicts or reconstructs a real event and an empty sentence; an empty edit keeps the e
- saves only an explicit move as the person\
- guided text offers the same choices as the scene, and the choice it offers moves the same way

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.4.1` | Author one bounded everyday Replay and editable personal cast | in_progress |
| `ArchetypeAI-28h.4.2` | Build Watch and Director with meaningful constrained interactions | in_progress |
| `ArchetypeAI-28h.4.3` | Add inner negotiation, possibility wardrobe and experiment handoff | in_progress |
| `ArchetypeAI-28h.4.4` | Compare Replay against guided text with accessible parity | in_progress |

## 5. Gaps (judgement, not measurement)

- Leaving the screen clears unsaved rehearsal text. Two UI tests cover this.
- Guided text quality is not reviewed by a native speaker.

## 6. Smallest useful slice (educated guess)

Keep. Add the Russian copy review to the pending evidence list.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending**.
