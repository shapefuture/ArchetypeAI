# E17.01 audit: Save status and operations

- Bead: `ArchetypeAI-ugua` (E17.01). Tracker status at audit: open.
- Checked at: HEAD `3683b0f`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e17-operation-status.ts` | 14 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e17-save-status.jsx` | 2 (spec files: e17-save-status.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_NOTE_DRAFT_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Exercise save failure/quota, offline read, canceled and late coach reply, duplicate/conflicting booking, revoked grant and restored renderer | Not mapped one-to-one in this audit (see §3) |
| acknowledgement matches authority. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- retries a read with exponential backoff capped by maxDelayMs and stops at maxAttempts
- an ambiguous timeout of a non-idempotent write without a key becomes unknown and is never re-sent
- an ambiguous write with an idempotency key retries with the same key
- recovers a duplicate booking: the same key returns the existing confirmation, not a second booking
- recovers a competing booking: a clash is a conflict, a declined slot is released, and a server conflict never auto-retries
- recovers a late coach reply after cancel: the reply is ignored and never shown
- recovers a superseded request: a reply to the earlier request id is stale and the newer request stays pending
- recovers quota and verify failures: the draft is kept, and a save is acknowledged only after a matching read-back

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.1` | Preserve authored loading while replacing fixed wait with real readiness | in_progress |
| `ArchetypeAI-28h.2.5` | Make assessment answers durable and interrupted use recoverable | in_progress |
| `ArchetypeAI-28h.2.9` | Complete accessible map alternatives and graphics lifecycle recovery | open |
| `ArchetypeAI-28h.2.12` | Complete genuine coach request, cancellation and recovery states | open |
| `ArchetypeAI-28h.2.15` | Complete real availability, booking confirmation and failure recovery | open |
| `ArchetypeAI-28h.2.17` | Verify real auth, coach access and declared entitlement scope | open |

## 5. Gaps (judgement, not measurement)

- The panel shows local save state and the note draft. A failed write is read back and shown as not saved (`src/parts-cartographer/screens/elevation/e17-save-status.jsx:61-62`; tested at `e17-save-status.spec.ts:54`).
- The store swallows the quota cause (`src/parts-cartographer/core/local-store.ts:23`), so only that reason is hidden from the panel.
- Remote save failure and offline read are not wired.

## 6. Smallest useful slice (educated guess)

Show the quota reason: pass the cause up from `local-store.ts:23` to the status, with a test.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
