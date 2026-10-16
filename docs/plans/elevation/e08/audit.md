# E08.01 audit: Transfer across situations

- Bead: `ArchetypeAI-60s` (E08.01). Tracker status at audit: open.
- Checked at: HEAD `b60e65d`, regenerated after an independent review of the first version.
- Disposition: **candidate audit, awaiting a second independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e08-transfer.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e08-transfer.jsx` | 3 (spec files: e08-transfer.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/practice.jsx` | - |
| Storage key | `INNERVERSE_TRANSFER_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Try recall, cue, immediate reveal and cannot-recall | Not mapped one-to-one in this audit (see §3) |
| vary a practical constraint | Not mapped one-to-one in this audit (see §3) |
| adapt the move elsewhere without reducing access to help. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- try recall: an unaided recall is recorded as recalled, with no cue or reveal
- cue: a cue after a miss is honoured, and the recall that follows counts as cue-helped
- immediate reveal: open before any attempt, and it closes the recall
- cannot-recall is a complete answer: cue and reveal stay open afterwards, and nothing is locked at the start
- denied: declining the invitation is a clean outcome, and it is allowed only as the first step
- varies one practical constraint into an if-then card the person wrote, and refuses an empty constraint
- adapting the move elsewhere keeps every help option and the move itself, and adds a season endpoint only when 
- authority: the model cannot author a variation, record a recall, record a revisit or choose guidance

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.3.1` | Connect contextual check-in and reviewed practices without irrelevant gates | in_progress |
| `ArchetypeAI-28h.3.2` | Create editable if-then experiment cards and Repair/resource flow | in_progress |
| `ArchetypeAI-28h.3.3` | Add recall-first review, boundary probes and environmental alternatives | in_progress |
| `ArchetypeAI-28h.4.4` | Compare Replay against guided text with accessible parity | in_progress |

## 5. Gaps (judgement, not measurement)

- Transfer is shown as a card with situation and action fields. Whether transfer happens is not measured.
- Only the two card fields are displayed, so any other variation field is not shown.

## 6. Smallest useful slice (educated guess)

None beyond the recorded measurement plan.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (the first review found errors, now corrected; a second review is needed).
