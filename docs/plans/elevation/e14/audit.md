# E14.01 audit: Export and portability

- Bead: `ArchetypeAI-1kgk` (E14.01). Tracker status at audit: open.
- Checked at: HEAD `d481c3e`, regenerated after an independent review of the first version.
- Disposition: **candidate audit, awaiting a second independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e14-export.ts` | 14 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e14-export.jsx` | 2 (spec files: e14-export.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | none Also reads `MEMORY_KEY` (`src/parts-cartographer/screens/elevation/e14-export.jsx:8, 40`) and exports saved memories only. | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Preview exact exported fields, read accessible file/print, export selected version and recover unsupported shortcut API | Not mapped one-to-one in this audit (see §3) |
| copied files have truthful revocation limits. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- previews the exact fields and the selected version, and lists every exclusion
- refuses an unsaved source, because unsaved drafts, chat and memories are never exported
- refuses an empty selection
- refuses a private version unless the person includes private content explicitly
- never exports a third-party field, and exports a private field only when it is included
- refuses a locale with no version instead of substituting another language
- exports the selected version rather than the latest one
- derives an artifact whose text matches the previewed fields and carries the preview fingerprint

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.3.2` | Create editable if-then experiment cards and Repair/resource flow | in_progress |
| `ArchetypeAI-28h.3.4` | Implement artifact-based progression and chosen workshop rewards | in_progress |
| `ArchetypeAI-28h.5.4` | Deliver Quiet mode, graduation and longitudinal continuity evaluation | in_progress |
| `ArchetypeAI-28h.5.6` | Create a user-controlled personal evidence library | open |

## 5. Gaps (judgement, not measurement)

- Export writes a local file. Reading the file in print and with assistive technology has not been checked.
- The shortcut export API is refused and not implemented, which is the intended behaviour.

## 6. Smallest useful slice (educated guess)

Keep. Add a browser check that the preview lists exactly the fields in the exported file.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (the first review found errors, now corrected; a second review is needed).
