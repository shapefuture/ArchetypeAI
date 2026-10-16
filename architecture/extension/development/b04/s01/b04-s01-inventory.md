# B04.S01 — Inventory: messages, invitations and reviewed contributions

> **Independent review (2026-10-16).** Round 1 at `42116d6`: FAIL, because the "no matches for contribution or reviewed" premise was false at HEAD. Round 2 at `b36bde2`: FAIL. Round 3 at `930edc1`: FAIL. The §4 and §5 rows were still generic, and the quiet-hours row overstated B05. Both are rewritten to name files and identifiers. Base note: `src/parts-cartographer/screens/elevation/e02-entry.jsx` and `src/parts-cartographer/screens/suggestion-review.jsx` are HEAD paths, not present at base 10d9608. Status is still **candidate, not accepted**; re-review is required.

- Bead: `ArchetypeAI-3mdv` (B04.S01).
- Base checked: `git:10d9608` on `claude/full-plan-handoff-gmgpkq`.
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `architecture/extension/development/b04/s01/**` (this file only).
- Contracts: none published. `base_generation: null`. No lease.

## 1. Finding

Peer messaging and shared contributions do not exist. The coach conversation and therapist client invite codes are the only nearby mechanisms, and both are scoped to a single relationship. No reviewed-contribution workflow exists. The words `reviewed` and `review` do appear in non-spec source, for example in coach-evidence copy (`src/parts-cartographer/screens/elevation/e02-entry.jsx:23`, `src/parts-cartographer/screens/suggestion-review.jsx:18`), but none is a shared-contribution or review-queue feature.

## 2. Existing code and reuse

| Area | Evidence (file:line) | Status |
|---|---|---|
| Coach messages | `src/app.component.html:499` (`[messages]="coachMessages()"`) | A one-to-one coach conversation, not peer messaging. Reusable only as a pattern. |
| Therapist client invite codes | `src/app/features/therapist-panel/therapist-panel.component.ts:3` (claim client invite codes) | Scoped therapist-client link. Not a social invitation. |
| AI-authored text overlay | `src/parts-cartographer/core/legacy-universe-adapter.ts:60` | Content overlay, not a message or contribution. |
| Peer messages | none | Absent. |
| Reviewed contributions | none | Absent. |

**Reuse packages named by the task.** The planning documents define these codes inconsistently across streams (the B01 inventory recorded the same ambiguity). Each code is an unresolved reuse claim until the coordinator confirms its mapping.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Message thread between two people | No | Needs consent, blocking and recipient authority. |
| State | Invitation (issued, accepted, declined, expired) | No | Invite codes exist only for therapist claims. |
| State | Reviewed contribution (submitted, reviewed, published or rejected) | No | No review workflow. |
| Effect | Delivery of a message or invitation | No | Depends on the notification policy (B05). |
| Component | Thread view, invitation card, review queue | No | No screens exist. |

## 4. Scenario matrix (planned, not exercised)

Each row is planned behaviour for peer messages and invitations. No messages collection exists today. The nearest existing mechanisms are named in each row.

| Scenario | Expected behaviour (planned) | Exercised today |
|---|---|---|
| Normal grant | A message or invitation is accepted only when a server rule for the relationship allows it. The nearest rules are the therapist link and roster blocks (`firestore.rules`, `therapistLinks` and `therapistClients`, near lines 458-533) and `hasTrustedTherapistClientLink`, used at `firestore.rules:560`. A `messages` rule would be new. | No |
| Denied grant | A send without a grant is refused by the planned `messages` rule. The nearest existing refusal is the therapist claim (`claimTherapistLink`, `src/parts-cartographer/core/therapist-link.ts:105`), which is keyed to a code, not to a person, so it does not reveal whether a recipient exists. | No |
| Stale contract | A client on an older schema reads a thread as legacy text. The nearest pattern is `normalizeToolkit` (`src/parts-cartographer/screens/practice-toolkit.jsx:370`), which keeps known fields and drops malformed ones. Keeping unknown fields on write-back is not in that pattern and is planned. | No |
| Account change | Threads would be readable only by the owning uid. Sign-out removes only `ifs.auth` (`src/parts-cartographer/core/auth.service.ts:141-147`), so a thread cache needs its own clearing step on sign-out. | No |
| Deleted source | When a sender deletes an account, the recipient keeps the message with a "removed by sender" marker. The nearest pattern deletes outright: the share-code revoke (`src/parts-cartographer/core/cloud-storage.ts:286`, `deleteDoc` on `shareCodes`). The planned messages must mark, not delete. | No |
| Duplicate or cancelled operation | A repeated send or accept carries one operation id and creates one record. The nearest duplicate guard is the one-holder reservation lock (`src/parts-cartographer/core/booking.ts:378-399`, with rules 340-364), which refuses a second reservation of the same slot. | No |
| Offline or quiet alternative | A composed message would be kept in the device-local store (`src/parts-cartographer/core/local-store.ts`) until the connection returns, and the thread stays readable offline. The B05 policy governs notifications, and no delivery quiet hours exist yet (N-11). Notifications never hide the thread. | No |

## 5. Six compatibility dimensions for `messages, invitations and contributions`

The plan's fixture task names six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases.

| Dimension | Planned case for `messages, invitations and contributions` | Exercised today |
|---|---|---|
| Interface | Thread and invitation views are reached from the existing navigation without displacing the coach conversation bound at `src/app.component.html:499` (`[messages]="coachMessages()"`). | No |
| State | The message record carries a schema version. Coach messages stay in their current store and are not migrated implicitly. | No |
| Effects | A send writes one document keyed by its operation id, so retries are idempotent. Notification is a separate effect routed through the B05 policy. | No |
| Operations | A sender can retract a message within a fixed window (planned). The nearest existing reversible write is the share-code revoke at `src/parts-cartographer/core/cloud-storage.ts:286`. | No |
| Performance | Thread lists would page by cursor in batches of 50 (planned). The therapist roster read is bounded by the `therapistClients` rule (`firestore.rules`, near line 532). | No |
| Failure | A storage refusal would mark the message unsent and keep its text in the composer. The nearest existing save-state display is the save-status panel (`src/parts-cartographer/screens/elevation/e17-save-status.jsx`). | No |

## 6. Source provenance

| File | SHA-256 |
|---|---|
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` |

## 7. Pending evidence (not claimed)

- Participant evidence on whether people want peer messages: **pending**.
- Safeguarding and moderation review for any messaging: **pending**.
- Independent review of this inventory: **pending**. No participant, practitioner, device or live-service evidence is claimed.

## 8. Limitations and next handoff

- The Beads live status of the reuse packages and sibling tasks was not read. The passive export is stale.
- The six dimensions come from the plan's fixture task, because the plan gives no stream-specific list.
- Next handoff: **B04.S02 (authoritative state, grants and effects)**. The coordinator must confirm the reuse mapping and record the Beads note (this commit does not touch Beads).
