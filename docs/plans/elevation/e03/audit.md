# E03.01 audit: Capacity modes and sensory independence

- Bead: `ArchetypeAI-4ct` (E03.01). Tracker status at audit: open.
- Checked at: HEAD `52002da`, generated 2026-10-16.
- Disposition: **candidate audit, awaiting independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e03-capacity.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e03-capacity.jsx` | 3 (spec files: e03-capacity.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_CAPACITY_PREF_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Switch capacity mid-inquiry without losing input | Not mapped one-to-one in this audit (see §3) |
| compare outcomes in all three modes | Not mapped one-to-one in this audit (see §3) |
| independently change sound/motion/density | Not mapped one-to-one in this audit (see §3) |
| recover preference write failure. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- maps capacity to inquiry steps and never exceeds the inquiry bound
- keeps the canonical 64 and 147 item count and order at every capacity
- keeps the 147 sitting boundaries at every capacity, and no step crosses a sitting
- compares the three modes: canonical identity is fixed and only presentation changes
- gives the same inquiry outcome in every capacity mode for the same answers
- switches capacity mid-inquiry without losing any input
- reverts a capacity change exactly, so the presentation is reversible
- keeps useful output when a lower step count is chosen after more answers

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.1.6` | Validate independent sensory controls and unprompted intuitiveness | in_progress |
| `ArchetypeAI-28h.2.2` | Implement persistent sensory preferences and scene attention coordination | in_progress |
| `ArchetypeAI-28h.2.3` | Unify intuitive navigation, responsive layouts and focus continuity | in_progress |
| `ArchetypeAI-28h.5.4` | Deliver Quiet mode, graduation and longitudinal continuity evaluation | in_progress |

## 5. Gaps (judgement, not measurement)

- The capacity preference is written by the cabinet panel. This audit did not verify whether other screens read the key.
- Independent sound, motion and density controls are covered by module tests only. No device check has been made.

## 6. Smallest useful slice (educated guess)

Verify with a grep of readers of the capacity key, then add one reader test for the most-used screen.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending**.
