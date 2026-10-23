# E02.01 audit: Need-based entry and first useful result

- Bead: `ArchetypeAI-r7r` (E02.01). Tracker status at audit: open.
- Checked at: HEAD `675118c`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e02-entry.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e02-entry.jsx` | 3 (spec files: e02-entry.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | none Also reads the saved profile (`src/parts-cartographer/screens/elevation/e02-entry.jsx:55`). | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| New person chooses each of three needs, obtains a useful stopping point, skips assessment, resumes a saved tool and recovers a failed deep link. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- routes each of the three needs to one first step: a calm practice, a labelled fallback, and the quick scan
- recovers an unavailable view: the situation need falls back to a labelled calm start, or to the chooser with a notice
- keeps the 64 and 147 routes as deeper options only, never as a default for any need
- never assumes a profile: a teaser may replace nothing when a canonical map exists, and a missing map is not invented
- finishing the first step reaches a useful stop that names what is still unknown, and Back returns to the step
- skipping the assessment keeps the chosen step, and assessment-free support is on in every state of a walk
- resumes a saved practice at the same step after an interruption, and refuses resume when nothing is saved
- resumes a saved 147 draft at its cursor, and refuses an unreadable draft without overwriting it

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.3` | Unify intuitive navigation, responsive layouts and focus continuity | in_progress |
| `ArchetypeAI-28h.2.4` | Clarify assessment routes and repair misleading seeded profiles | in_progress |
| `ArchetypeAI-28h.2.31` | Deliver a bounded, correction-first situation inquiry | in_progress |

## 5. Gaps (judgement, not measurement)

- The entry panel is mounted in the cabinet, not on the first-run path, so a new person does not meet it first.
- Whether a first result is useful is not measured with anyone.

## 6. Smallest useful slice (educated guess)

Confirm that first-run already offers the three routes on Base (`src/parts-cartographer/screens/landing.jsx:65-68`). If it does, keep the entry in the cabinet and close this slice as covered.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
