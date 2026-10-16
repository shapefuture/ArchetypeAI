# E07.01 audit: Validity, context and resurfacing

- Bead: `ArchetypeAI-bqm` (E07.01). Tracker status at audit: open.
- Checked at: HEAD `52002da`, generated 2026-10-16.
- Disposition: **candidate audit, awaiting independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e07-validity.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e07-validity.jsx` | 2 (spec files: e07-validity.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_VALIDITY_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Mark one source contextual and another no-longer-fitting | Not mapped one-to-one in this audit (see §3) |
| preserve original wording | Not mapped one-to-one in this audit (see §3) |
| retrieval previews explain exclusions | Not mapped one-to-one in this audit (see §3) |
| declined resurfacing stays declined. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- marks one source as fitting in some contexts and another as no longer fitting, and keeps both
- preserves the original wording through every validity change, including after a later edit
- never downgrades the person
- denied: a context-specific mark is refused until the person names the context
- authority: the model cannot change validity, certainty or resurfacing
- separates observation, hypothesis, user wording and canonical measurement, and validity never changes them
- canonical measurement: a no-longer-fits note is kept beside the result, with no score field
- retrieval preview explains each exclusion, considers only selected sources, and infers nothing when none are s

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.5.1` | Define inspectable personal-memory provenance and deletion propagation | in_progress |
| `ArchetypeAI-28h.5.6` | Create a user-controlled personal evidence library | open |
| `ArchetypeAI-28h.2.29` | Preserve bipolar coexistence, contextual interpretation and analytical identity | open |

## 5. Gaps (judgement, not measurement)

- The memory key (`INNERVERSE_MEMORY_V1`) is shared with the memory panel, so a change here affects that panel.
- Declined resurfacing is stored locally only.

## 6. Smallest useful slice (educated guess)

Keep. Add one test that a declined resurfacing does not return after reload.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending**.
