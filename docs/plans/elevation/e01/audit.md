# E01.01 audit: Goal and graduation

- Bead: `ArchetypeAI-epv` (E01.01). Tracker status at audit: open.
- Checked at: HEAD `b60e65d`, regenerated after an independent review of the first version.
- Disposition: **candidate audit, awaiting a second independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e01-goal.ts` | 16 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e01-goal.jsx` | 4 (spec files: e01-goal.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/practice.jsx` | - |
| Storage key | `INNERVERSE_GOAL_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Choose a concrete goal, revise it without losing tools, pause, graduate and export | Not mapped one-to-one in this audit (see §3) |
| missing real-world outcome remains unknown. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- chooses a concrete goal and keeps the wording the person typed
- revises the goal without losing linked tools or endpoints, and keeps the earlier wording
- recovers a resumed journey after rest: pausing and resuming leave tools and outcomes as they were
- graduates only on an explicit yes and keeps the tool shelf
- exports a graduated goal and keeps a missing real-world outcome unknown
- labels observation, hypothesis, user authorship and canonical measurement separately in the export
- keeps app hypotheses labelled until the person adopts them, and refuses overclaims and rejected repeats
- has no universal readiness score, streak or rank in any state or export

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.5.3` | Build optional practice palette, flexible season and creative endpoints | in_progress |
| `ArchetypeAI-28h.5.4` | Deliver Quiet mode, graduation and longitudinal continuity evaluation | in_progress |
| `ArchetypeAI-28h.3.5` | Evaluate multi-use return loop and opt-in reminder lifecycle | in_progress |

## 5. Gaps (judgement, not measurement)

- The chosen goal is stored on this device only (`INNERVERSE_GOAL_V1`). Nothing reads it from a remote store.
- The goal key is not in the backup allowlist (`src/parts-cartographer/core/backup.ts:11-19`), so a backup does not carry it.
- A real-world outcome is recorded as unknown. Nothing measures whether the goal helped.

## 6. Smallest useful slice (educated guess)

Decide whether the goal belongs in the backup allowlist (`backup.ts:11-19`). If yes, add it with one round-trip test; if no, record that the goal is device-only.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (the first review found errors, now corrected; a second review is needed).
