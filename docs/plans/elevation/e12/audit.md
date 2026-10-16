# E12.01 audit: Presentation without WebGL, audio or motion

- Bead: `ArchetypeAI-xu75` (E12.01). Tracker status at audit: open.
- Checked at: HEAD `52002da`, generated 2026-10-16.
- Disposition: **candidate audit, awaiting independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e12-quiet-presentation.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e12-presentation.jsx` | 3 (spec files: e12-presentation.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/innerverse.jsx` | - |
| Storage key | `INNERVERSE_PRESENTATION_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Finish the same tasks without WebGL/audio/motion, with keyboard/screen reader, large text and narrow EN/RU layouts | Not mapped one-to-one in this audit (see §3) |
| preserve source and action information. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- no WebGL: the accessible list carries the same rows, source and action as the map
- a failed or lost WebGL context mid-session keeps the selected item and the chosen sensory settings
- no audio: sound is off with reason unavailable, motion and texture stay, and sound returns without a new choic
- system reduced motion stops decorative motion and camera inertia whatever the preset or motion setting
- mixed sensory settings: each choice keeps its own reason, and the preset label never overrides the motion fiel
- extreme text expansion keeps every row, uses one column and opens compact density without rewriting the choice
- a 400 percent zoom on a 1280 px window reflows to a single column at 320 CSS px
- narrow Russian layout keeps long labels with their source and action

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.1.6` | Validate independent sensory controls and unprompted intuitiveness | in_progress |
| `ArchetypeAI-28h.2.2` | Implement persistent sensory preferences and scene attention coordination | in_progress |
| `ArchetypeAI-28h.2.9` | Complete accessible map alternatives and graphics lifecycle recovery | open |
| `ArchetypeAI-28h.2.18` | Finish bilingual, sensory, accessibility, real-device and intuitive core acceptance | open |
| `ArchetypeAI-28h.4.4` | Compare Replay against guided text with accessible parity | in_progress |

## 5. Gaps (judgement, not measurement)

- jsdom has no WebGL, so the no-WebGL path is tested. The WebGL path is tested with a stub only.
- Keyboard, screen-reader and large-text behaviour were not checked with real assistive technology.

## 6. Smallest useful slice (educated guess)

Keep. Run the existing phone-width browser check on this panel and record the result.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending**.
