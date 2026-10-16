# B02.S01 inventory: current ownership and actual reuse for opt-in explainable matching

> **Independent review (2026-10-16).** Round 1 at `42116d6`: FAIL. Round 2 at `b36bde2`: FAIL (minor). The consent-seam and eligibility corrections are accurate. The provenance-store sentence was not base-qualified and is now corrected. Status is still **candidate, not accepted**; re-review is required.
>
> - Base note: citations to `src/shared/...` or `src/parts-cartographer/...` paths that moved are HEAD paths (rename map `09194df..HEAD`).

**Status: candidate awaiting independent review. This is not an acceptance claim.**
No participant, device, live-account, community, practitioner or independent-review evidence exists for this artifact. Those items are listed as pending in section 9.

| Field | Value |
|---|---|
| Bead | ArchetypeAI-zwh2, [B02.S01] Inventory current ownership and actual reuse: Opt-in explainable matching |
| Parent | ArchetypeAI-64fs, [B02] Opt-in explainable matching (slot `matching.discovery`) |
| Planning | planning key `B02.S01`; planning Bead ArchetypeAI-cyqe; graph `docs/plans/social-creative-practice-beads-plan.json` |
| Successor | ArchetypeAI-2q6p, [B02.S02] Specify authoritative state, grants and effects (blocked by this Bead) |
| Stage / role | planning / slot-owner |
| Mutation / risk | M0 / R2, as assigned in planning metadata (see note in section 12) |
| Base | commit `09194df5f48326bff14e42a1e4eb8d66c457186d` on branch `worktree-agent-a33e74034facfd2a7`; working tree clean before this file was added |
| Immutable base generation | null. Not resolved; this run binds no generation |
| Published contract versions | none |
| Active leases | none. Planning paths and null generations are proposals, not leases |
| Artifact | this file only |
| Live Beads status | not read by this run (section 10) |

## 1. Summary

- **Matching and discovery are not implemented.** The repository has no matching port, collection, security rule, worker route or UI for opt-in matching, criteria, eligibility, decline or block. The `matching.discovery` slot has no code seam. Negative searches are logged in Appendix B.
- **The nearest surface is always-on, not consented.** `publicProfiles/{uid}` stores the account email and display name. Sign-in writes it automatically, and the rules let any signed-in user read it. The emulator spec asserts that a non-owner `get` succeeds. This conflicts with the B02 requirement that public discovery use chosen fields and per-purpose consent (F-01).
- **Booking is the strongest grant precedent.** A booking grant (`clientShares`, `therapistClients`) is tied to a live appointment. A deterministic busy-slot document acts as a concurrency lock. Decline or cancel revokes read access through rules. The create path has a non-atomic write window (F-03).
- **Bearer codes carry copies.** Map share codes and therapist invite codes contain copies of the data they expose. Neither has an expiry. Neither follows the source when it changes. A code issued by one account cannot be revoked by another (F-02, F-04).
- **Synastry is the existing "compatibility" feature.** The shipped React path uses the canonical scored-profile and 64-item bridges. A hash-seeded generator (`code-seed-v1`) also exists in `core/synastry-v2.ts`. It has no React call site in this tree and must not be reused as matching evidence (F-07).
- **The reuse keys C01 and C08 are ambiguous.** Three planning documents use them for different packages. This inventory adopts the reading supported by the social plan's own graph edges: the elevation plan's slot packages C01 (auth identity, ArchetypeAI-zzmm) and C08 (consent and provenance, ArchetypeAI-v2tj). Only `auth.service.ts` exists as a seam. The consent seam path `core/personal-memory.ts` was absent at the base 09194df (F-08, F-11). HEAD adds it in commit 3670a3a; it is not reviewed against this inventory.
- **Several required states are absent.** Eligibility, decline and block suppression, revocation propagation, quiet discovery and criteria provenance have no implementation. Section 5 records each with its nearest analogue.
- **No tests were executed.** Claims marked *static trace* come from reading source and rules. The worktree has no installed dependencies, and installing them would write outside the write set.

## 2. Scope

`matching.discovery` covers any mechanism that makes one person's attributes findable by, or compared with, another person's attributes. It also covers opt-in state, criteria provenance, eligibility, decline and block suppression (planning row `B02`, social plan `docs/plans/social-creative-practice-beads-plan.md:131`).

Included: identity projection, sharing and redemption of codes, synastry, booking and roster grants, reminder opt-in, local and server state, the server authority layer, and the Angular parity surfaces where they share data.

Excluded: source-specific research and method packages (linked method tasks), the AI coach beyond its data-flow role, and the Angular UI beyond what shares services with React. The Angular surface was sampled, not traced line by line.

## 3. Reconciliation of reuse packages C01 and C08

### 3.1 Three planning sources use the same keys

| Planning source | C01 | C08 | Relevance to B02.S01 |
|---|---|---|---|
| Elevation plan `docs/plans/elevation-aaa-v7-beads-plan.json` (prepared 2026-10-06) | Slot migration: auth identity and account lifecycle. Seam `src/parts-cartographer/core/auth.service.ts`. Live ArchetypeAI-zzmm. | Slot migration: consent, source lineage and corrections. Seam `src/parts-cartographer/core/personal-memory.ts`. Live ArchetypeAI-v2tj. | **Adopted.** The social graph has `B02` relates_to ArchetypeAI-zzmm and ArchetypeAI-v2tj. Platform reuse lists are consistent with this reading: B01 `[C01, C02, C08]`, B12 `[C08]`. |
| Social plan `docs/plans/social-creative-practice-beads-plan.json` (prepared 2026-10-06) | Used as a reuse key in platforms B01, B02, B03, B04 | Used as a reuse key in platforms B01, B02, B03, B04, B12 | Source of this Bead's metadata (`reuse_packages: [C01, C08]`). |
| Creative-commons plan `docs/plans/creative-commons-beads-plan.json` (prepared 2026-10-10) | Connected public threads. Reuses F01, F04, F15, B03, B04, B12. | Cross-circle expeditions. Reuses F07, F23, F24, F42, F43, F46. | Written after the social plan, in its own key space. Does not name B02 directly (see 3.4). |

The coordinator should confirm the intended referent before S02 is dispatched (F-08).

### 3.2 What the adopted packages contain

- **C01 (auth.identity).** The seam exists at `core/auth.service.ts` (148 lines). It covers anonymous bootstrap, Google and email sign-in, linking an anonymous account while keeping its UID, and sign-out (`auth.service.ts:81-147`). The only contract is `AUTH_PORT` (`core/ports.ts:6-13`). No versioned contract, compatibility suite or registry entry was found. Server-side identity is Firebase ID-token verification (`worker-security.ts:30-79`), which yields `uid`, `email` and `email_verified`.
- **C08 (consent.provenance).** The seam path `core/personal-memory.ts` was absent at the base 09194df (added at HEAD in 3670a3a). Consent exists only as UI controls and copy:
  - share-code checkbox (`overlays.jsx:503`; copy `i18n/strings.ts:193`);
  - booking checkbox that gates the confirm button (`overlays.jsx:842-852`; copy `i18n/strings.ts:351`);
  - therapist consent text (`core/therapist-link.ts:201`);
  - reminder opt-in (`core/push.ts:32-84`).

  At base 09194df no consent record type, version, provenance store, withdrawal log or shared consent check was found. At HEAD `src/parts-cartographer/core/personal-memory.ts` adds memory provenance (`source`, `derivedFrom`) but still no consent record type, withdrawal log or shared consent check. The status is planning-only.

### 3.3 Creative-commons C01 and C08 are not implemented

Searches for the named feature families (theme spaces, mutual reveals, expeditions, parallel jams, quests, cooperative mini-games) returned no matches in `src/` or `firestore.rules` (Appendix B). Reuse of those packages is therefore planning-only. Their `reuse_beads` IDs (C01: jten, 2lnj, tmuuj, tica, vlfx, nje6; C08: pxk9, 6nzhj, nsrho, ktaon, xwzgu, ot4ky) were not verified. They are not present in `.beads/issues.jsonl`.

### 3.4 Creative-commons C04 names B02

`C04` ("Explainable serendipity", `creative-commons-beads-plan.md:26` (workstream table)) reuses F05, F06, F07, F22, F23, F28 and B02. It is the only creative-commons stream that names B02. B02.S01's reuse list does not include it (F-09).

### 3.5 Verdict for reuse

No existing implementation can be reused as the matching capability. What can be reused is pattern material and the identity source:

- Firebase `uid` and server token verification (identity source).
- The booking grant lifecycle, deterministic lock and transactional release (`core/booking.ts`).
- The allowlisted projection used for share snapshots (`cloud-storage.ts:40`).
- Explicit opt-in, denied and withdraw states for reminders (`core/push.ts`).
- The degradation descriptor and offline fallback (`core/ai.adapter.ts`).

The delta is what B02 defines and nothing here provides: purpose-scoped matching consent, criteria provenance, server-enforced eligibility, decline and block suppression, and an explanation tied to the criteria that were used.

## 4. State, effect and component inventory

### 4.1 Owner classes

- **Local**: browser `localStorage`, no server authority.
- **Server authoritative**: Firestore documents governed by `firestore.rules`.
- **Derived copy**: a copy made at one time from a source record. The copy is not updated when the source changes.
- **External processor**: Firebase Auth, FCM, Stripe, and the AI provider reached through the Worker.

### 4.2 Stores

| Store | Owner class | Written by | Authority in rules | Contents and withdrawal | B02 relevance |
|---|---|---|---|---|---|
| `localStorage ifs.auth` | Local | `auth.service.ts:41-42`; removed at `:146` | none | Auth user record (uid, email, provider, linked) | Identity source for the client |
| `ifs.profile`, `ifs.parts`, `ifs.history` | Local | `app.jsx:163-166` | none | Private map and profile; included in portable backup (`backup.ts:10`) | Must not be discoverable unless the user opts in |
| `ifs.share.codes` | Local | `overlays.jsx:332-336`, filtered at `:353` | none | Issued share-code list, capped at 20 (`:332`, `:335`); filtered by uid at render (`:193`) | Mirrors server state; cannot revoke after an account change (F-02) |
| `ifs.syn.connections` (KEYS.syn) and `ARCHETYPE_SYNASTRY_*` | Local derived copy | `overlays.jsx:306`, `:401` | none | Partner comparison results; included in portable backup (`backup.ts:10-16`) | Derived copy of another person's data (F-15) |
| `INNERVERSE_PUSH_TOKEN_V1` | Local | `push.ts:71`; removed at `:98` | none | FCM token | Reminder state |
| `publicProfiles/{uid}` | Server authoritative | `core/user-directory.ts:34-46`, called from `auth.service.ts:41-49` on every linked sign-in | read: any signed-in user (`firestore.rules:310-311`); write: owner, with email equal to the token email (`:312-320`); delete: owner (`:321`) | `email`, `emailLower`, `displayName`, `updatedAt`. No schema version. No in-app withdrawal (F-01) | Existing discovery surface |
| `therapists/{uid}` | Server authoritative | `booking.ts:251` | read: signed-in (`:327`); write: owner (`:328-333`) | `email`, `availability` | Directory-like data |
| `therapistBusySlots/{uid_start}` | Server authoritative | `booking.ts:378-386` in batch | read: signed-in (`:341`); create only with matching appointment (`:342-364`); update denied (`:365`) | `therapistUid`, `appointmentId`, `start`, `end`. Deterministic id is the concurrency lock | Duplicate-prevention precedent |
| `appointments/{id}` | Server authoritative | `booking.ts:366-400` (random id) | read: parties (`:386-388`); create requires `accessGranted == true` (`:405`); updates restricted to status transitions (`:412-433`) | Parties, emails, times, status, `accessGranted` | `accessGranted` is written and rule-checked but no authorization decision reads it (F-18) |
| `clientShares/{t_c}` | Server authoritative | `booking.ts:401-412` | read: parties (`:443`); create/update require active appointment (`:444-465`); delete: client (`:466`) | Booking grant (`source: 'booking'`, `appointmentId`) | Purpose-specific grant precedent |
| `therapistClients/{t_c}` | Server authoritative, containing derived copies | `booking.ts:413`; `therapist-link.ts:114-124`; `setClientArchived` at `:166-170` | read: parties (`:475`); create/update gated by booking share or invite link (`:476-531`); delete: therapist only (`:532`) | Roster row, with an embedded `summary` copy for invite-sourced rows | Copy persists after link deletion (F-04) |
| `therapistLinks/{code}` | Server authoritative | `therapist-link.ts:96-100` | get: signed-in with valid code (`:242-243`); list denied (`:243`); delete: client (`:251`) | Invite code and summary projection | Bearer credential |
| `assignments/{id}` | Server authoritative | `therapist-link.ts:187` | read: parties (`:538-539`); create requires trusted roster (`:540-555`) | Exercise assignment | Out of B02 scope |
| `shareCodes/{code}` | Server authoritative, bearer | `cloud-storage.ts:224-247` (transaction) | get: signed-in with valid code (`:227`); list denied (`:228`); create and update validated (`:229-235`); delete: owner (`:236`) | Embedded map snapshot or 64-answer assessment; `uid`, `createdAt`; no expiry field (`validShareCodePayload`, `:80-112`) | Bearer copy; no expiry (F-02) |
| `users/{uid}/connections/{partner}` and `users/{uid}/synastry/{partner}` | Server authoritative, derived copy | `cloud-storage.ts:150-172` (batch, not `merge` for synastry) | owner only (`firestore.rules:175-181`) | Partner uid, share code used, synastry result, AI reflections | Deterministic key per partner; idempotent save |
| `users/{uid}/assessment/current`, `history/*` | Server authoritative | `cloud-storage.ts:82-96` | owner; admin and therapist read grants (`:166-172`) | Cloud copy of map and history | Source for share snapshots |
| `pushTokens/{token}` | Server authoritative | `push.ts:66-70`; deleted at `:65` and `:96` | read: denied (`:199`); owner write (`:200-214`) | FCM token, uid | Reminder state |
| `telemetryResponses/{id}` | Server authoritative, write-only | `core/telemetry.ts` | read: denied (`:187`) | Payload of up to 32 KiB | Not discovery data |
| `/api/ai` (Worker) | External processor | `ai.adapter.ts:89-100`; route `worker.ts:172`, `:185-` | none | Prompt and context sent to provider | Synastry summaries are sent here (F-16) |

### 4.3 Effects

The AAA effect classes E0 to E5 are defined in the source snapshot (`docs/plans/references/AAA-V7-SPEC.source.md:324-337`, section 9). The classes below are a **proposed** classification by this inventory for S02 to confirm or reject. They are not established classifications.

| Operation | Proposed class | Reversal or compensation | Idempotency or fencing identity | Evidence |
|---|---|---|---|---|
| Publish public identity at sign-in | E2 (merge upsert) | Owner delete exists in rules but no code path calls it | Key is uid; no operation id | `user-directory.ts:38-43`; `auth.service.ts:41-49` |
| Create map share code | Disclosure, becomes E5-equivalent once any recipient reads it | Revoke stops future reads only; copies already read are not recalled | Random 12-character code; retry loop on collision | `cloud-storage.ts:206-247` |
| Redeem share code | E1 read, then E2 local and server write (synastry save) | Revoke does not remove the saved copy from the redeemer's account | Synastry key is the partner uid | `cloud-storage.ts:249-280`; `:150-172`; `overlays.jsx:364-420` |
| Revoke share code | E2 delete | None; stops future redemption | Delete by code | `cloud-storage.ts:282-287` |
| Create booking | E2 batch (appointment and busy slot, atomic), then two grant writes (not atomic with the batch) | Cancel through status transition | Busy slot is the lock; appointment id is random | `booking.ts:366-420` (F-03) |
| Set appointment status | E2 terminal transition inside a transaction | None (terminal) | Busy slot released only if `appointmentId` matches | `booking.ts:339-357` |
| Save synastry result | E2, deterministic key | Overwrite only | Partner uid | `cloud-storage.ts:150-172` |
| Generate synastry narrative | External disclosure of derived partner data to the AI provider | None once sent | None; abort honoured on the client | `overlays.jsx:290-321`; `ai.adapter.ts:89-100`, `:240-246` |
| Enable or withdraw reminder | E2 token register; withdraw is a delete plus local removal | Re-enable creates a new token | Previous token deleted before the new one is written (`push.ts:64-70`) | `push.ts:32-99` |
| Local write | E2 | Quota failure is silently swallowed (F-13) | None | `local-store.ts:22-23` |
| Portable backup restore | E3 with rollback on quota failure | Rolled back in code; test definition exists | None | `backup.ts:10-16`; `backup.spec.ts:75` |

### 4.4 Components

| Component | Role | Verdict for B02 |
|---|---|---|
| `src/parts-cartographer/core/ports.ts` | Four ports: `AUTH_PORT`, `STORAGE_PORT`, `AI_PORT`, `BILLING_PORT` (`:6-40`). No matching, consent or discovery port. Also `isPremiumCached` reads a client-side flag (`:42-44`). | **Seam to add** in S03. The pattern is reusable. |
| `core/auth.service.ts` | Identity states and account linking (`:81-148`) | **Reuse as identity source.** Account-change caveats in F-05. |
| `core/user-directory.ts` (and Angular `src/services/user-directory.service.ts:102`, `:117`, `:152`) | Public email and display-name projection. Five-minute client cache (`:12-27`). | **Do not reuse as discovery consent** (F-01). |
| `core/booking.ts` | Appointments, busy slots, status transitions, grants (`:339-426`) | **Reuse the pattern** (grant tied to a live operation, deterministic lock, transactional release). Fix F-03 before reuse. |
| `core/therapist-link.ts` | Invite codes and roster summary projection (`:86-171`) | **Pattern only.** Bearer invite is not discovery. |
| `core/cloud-storage.ts` | Map snapshot projection (`:40`), share codes (`:206-287`), synastry save and load (`:150-195`), cloud map save (`:82-96`) | **Pattern only** for the allowlisted projection. Share codes are not discovery (F-02, F-06). |
| `core/synastry-v2.ts` | `code-seed-v1` generator (`:24-45`) and `synFromProfiles` (`:47-50`). No React call site found. | **Do not reuse** as matching evidence (F-07). |
| `core/synastry-bridge.ts` | Maps the canonical scored-profile engine to the React DTO (`:105-136`). Six metrics (`:24-32`). Dance labels (`:8-22`). | **Review before reuse.** Labels conflict with the "no compatibility verdict" rule (F-07). The six metrics are unrelated to the six slot dimensions (section 5.8). |
| `core/synastry-legacy64-bridge.ts` | 64-item bridge | Named and tested only; not traced further |
| `core/push.ts` | Opt-in, denied, ready and enabled states; withdraw; nudge throttle (`:101-115`) | **Reuse the pattern** for explicit opt-in and denial |
| `core/local-store.ts` | Latest and archive storage with silent quota handling (`:15-54`); keys (`:56-72`) | **Reuse for local-only state.** Fix F-13 for any matching state. |
| `core/backup.ts` | Portable key set (`:10-16`) | **Review** (F-15) |
| `core/ai.adapter.ts` | Cloud call with timeout (`:89-100`), offline check (`:95`), degradation descriptor (`:130-145`), heuristic fallbacks (`:147`, `:207`, `:228`) | **Reuse the pattern.** Degradation state is a static, process-wide value. |
| `core/sensory-preferences.ts` | Independent motion, sound, texture and density controls (`:1-12`) | **Preserve.** Not a discovery quiet mode. |
| `worker.ts` | Routes `/api/ai`, `/api/stripe-*`; `/api/gemini` returns 410 (`:172-178`). No matching route. Entitlement is not checked in the AI handler as read. | **Server authority seam** (none for matching yet) |
| `worker-security.ts` | Firebase ID-token verification and CORS (`:30-146`) | **Reuse as is** |
| `firestore.rules` | Server authority for every collection above. Broker-owned. | **Broker-owned.** Any change is out of this Bead. |
| `overlays.jsx` | Share, redeem, synastry and booking UI (`:188-420`, `:735-756`, `:842-852`) | **UI pattern** for consent gating and error states |
| `screens/cabinet.jsx`, `screens/innerverse.jsx` | Callers of booking status changes (`cabinet.jsx:74`, `innerverse.jsx:529`) | Consumers only |
| Angular `src/app/**` (booking-panel, therapist-panel, synastry-compare, `core/data/synastry-v2.ts:119`) | Retained parity surface | Sampled only |

### 4.5 Absent components

B02 needs these and this tree has none of them:

- purpose-scoped matching consent records and their versions;
- criteria provenance, meaning which fields and rules produced a match;
- server-enforced eligibility, with unknown treated as ineligible;
- decline and block records with suppression on both sides;
- a discovery index or query that applies those records;
- an explanation generator tied to the criteria actually used;
- revocation propagation to queued or future sends (there is no queue);
- a quiet or off state for discovery that keeps solo use complete;
- a matching port or versioned contract.

## 5. Scenario matrix

Columns: existing evidence; status (*implemented*, *partial*, *absent*, or *conflicts*); gap for `matching.discovery`; reuse candidate; pending evidence. All evidence is a *static trace* unless marked as an existing test definition.

### 5.1 Normal and denied grant

| Aspect | Existing evidence | Status | Gap | Reuse | Pending |
|---|---|---|---|---|---|
| Normal grant, booking | Consent checkbox gates confirm (`overlays.jsx:842-852`); `createBooking` writes `clientShares` (`booking.ts:401-412`); rules allow therapist read while appointment is pending or approved (`firestore.rules:62-71`, `:133-138`); test definition at `firestore.rules.emulator.spec.ts:327-329` | implemented (booking only) | Purpose-specific to one appointment; not a matching grant | Pattern | Emulator run; two-account run |
| Normal grant, share code | Consent checkbox (`overlays.jsx:503`) gates generation (`:326`) | implemented (one-off) | Bearer; no recipient scope; no expiry | Pattern for consent UI | Recipient-scope test |
| Implicit grant, public identity | `publicProfiles` written on linked sign-in (`user-directory.ts:34-46`); no consent step | **conflicts** | No consent, no field choice, no opt-out path in code | None | Consent review (B01, B02.S02) |
| Denied grant, booking | Non-appointment read denied (`firestore.rules:62-71`, `:441-465`); test definition `emulator.spec.ts:325-352` (fake shares denied) | implemented | None for booking | Pattern | Emulator run |
| Denied grant, share code | Revoked or unknown code returns null; UI shows "unavailable or revoked" (`cloud-storage.ts:249-277`; `overlays.jsx:373`) | partial | Conflates unknown schema with revoked (F-06); no recipient-visible denial reason | Pattern | Denial-copy review |
| Denied, matching | none | absent | No denial state; a non-consenting user remains listed | None | — |

### 5.2 Stale contract

| Aspect | Existing evidence | Status | Gap | Pending |
|---|---|---|---|---|
| Share-code payload schema | Create rules fix allowed shapes (`firestore.rules:80-112`); `parts-cartographer.v1` snapshot or 64-answer legacy payload | implemented | Shapes are fixed at create only; no migration for existing codes | Migration test |
| Legacy payload upgrade on read | Legacy 64-response payload is converted on read (`cloud-storage.ts:98-108`) | implemented | Converted copy is not written back | — |
| Unknown schema on redemption | Returns null (`cloud-storage.ts:249-277`); UI says "unavailable or revoked" | partial | Message conflates two cases | Copy review |
| Saved synastry rows | Rows with an unknown schema are dropped silently on load (`cloud-storage.ts:184-186`) | partial | Silent loss | Load test |
| Older synastry results | `engineVersion` optional; UI shows unknown-version copy (`synastry-v2.ts:12-13`; `overlays.jsx:586-591`) | implemented | Copy only | — |
| Directory staleness | Lookups cache for five minutes (`user-directory.ts:12-27`); no revocation can reach cached copies sooner | partial | A withdrawn projection stays visible up to five minutes in other clients | Timing test |
| Matching criteria version | none | absent | No version field on `publicProfiles` (`user-directory.ts:38-43`); no criteria version | — |

### 5.3 Account change

| Aspect | Existing evidence | Status | Gap | Pending |
|---|---|---|---|---|
| Anonymous to linked, same uid | Linking keeps the uid (`auth.service.ts:97-100`, `:116-119`, `:131-138`) | implemented | None | — |
| Anonymous to existing account | Credential already in use: falls back to sign-in, which creates a new uid (`auth.service.ts:101-107`) | partial | Cloud records under the anonymous uid are not migrated (no merge code found) | Two-account run |
| Sign-out | Only `ifs.auth` is removed (`auth.service.ts:146`); share list and synastry copies remain locally | **conflicts** | Local state of the previous account persists (F-05) | Two-account run |
| Cross-account revocation | Revoke requires the issuing uid (`firestore.rules:236`); the UI hides other accounts' codes (`overlays.jsx:193`) | partial | Codes issued by account A cannot be revoked from account B, and B cannot see them (F-02) | Two-account run |
| Public identity after sign-out | No delete on sign-out; no delete path in code (`auth.service.ts:141-147`) | **conflicts** | Projection persists after sign-out (F-01) | Two-account run |
| Booking identity | Client email must equal token email at create (`firestore.rules:391-392`) | implemented | Email is copied into several documents | — |

### 5.4 Deleted source

| Aspect | Existing evidence | Status | Gap | Pending |
|---|---|---|---|---|
| Account deletion | No code path (`grep` for `deleteUser`, `delete account`, `deleteAccount` in `src/` returned zero hits) | absent | Nothing to propagate | — |
| Share code after source change | Snapshot is embedded in the code (`cloud-storage.ts:206-214`; `firestore.rules:80-112`); deleting the cloud map does not revoke the code | **conflicts** | Copy outlives source (F-02) | Deletion test |
| Synastry copies | Copies in redeemer account (`cloud-storage.ts:150-172`); included in portable backup (`backup.ts:10-16`) | **conflicts** | Revocation does not reach copies (F-15) | Export test |
| Invite link deleted | Client may delete the link (`firestore.rules:251`); roster summary copy remains readable (`:472-480`); client has no delete on roster rows (`:532`) | **conflicts** | Client cannot withdraw roster copy (F-04) | Two-account run |
| Booking grant | Revoked by status transition, not by deleting the source (`firestore.rules:62-71`) | implemented | Grant doc persists (`:441-465`) but is inert | Emulator run |
| Public identity | Owner delete allowed in rules (`:321`); no code path calls it | partial | No in-app withdrawal | UI decision (B01) |

### 5.5 Duplicate and cancelled operations

| Aspect | Existing evidence | Status | Gap | Pending |
|---|---|---|---|---|
| Concurrent booking, same slot | Deterministic busy-slot id plus rules (`booking.ts:378-386`; `firestore.rules:340-364`); test definition `emulator.spec.ts:353-413`, including "exactly one concurrent reservation" at `:389` | implemented | None | Emulator run |
| Cancel releases slot only for its own appointment | `booking.ts:349-354` | implemented | None | — |
| Retried cancel after success | Client update allowed only from pending or approved (`firestore.rules:426-432`), so a second cancel is refused by rules (*static trace*) | partial | Error after success (F-19) | Retry test |
| Booking partial failure | Appointment and busy slot commit atomically (`booking.ts:400`), then grant writes separately (`:401-420`); UI shows failure (`overlays.jsx:749-752`) | **conflicts** | Appointment exists without its grant; a retry is refused because the busy slot exists and rules deny its update (`firestore.rules:365`) (F-03) | Fault-injection test |
| Share-code timeout | Retry runs the same transaction (`cloud-storage.ts:230`; `resilience.ts:13-38`). A committed first attempt makes the retry return "collision", and a new code is minted | partial | Orphan active code the user never sees (F-02, F-06) | Fault-injection test |
| Synastry save repeat | Key is partner uid (`cloud-storage.ts:159-170`) | implemented | None | — |
| AI narrative late reply | Client aborts and ignores late replies (`overlays.jsx:294-306`) | implemented | Server-side work is not cancelled | — |
| Reminder token rotation | Previous token deleted before the new one is written (`push.ts:64-70`) | partial | Failure between the two leaves no registered token | Fault-injection test |

### 5.6 Offline and quiet alternative

| Aspect | Existing evidence | Status | Gap | Pending |
|---|---|---|---|---|
| Offline navigation | Local navigation stays available while Firebase connects (`app.jsx:194`) | implemented | None | Device test |
| Offline identity | Local guest with a `local_` uid when Firebase is unavailable (`auth.service.ts:51-56`, `:81-90`) | implemented | Guest cannot publish or share (`overlays.jsx:325`) | — |
| Offline AI | Navigator offline check (`ai.adapter.ts:95`); heuristic fallbacks (`:147`, `:207`, `:228`) | implemented | Offline fallback is not a matching alternative | — |
| Offline social writes | Share, redeem and booking require Firestore (`overlays.jsx:325`, `:364-373`, `:735-745`); no offline queue found | absent | A discovery action would fail rather than queue or suppress | Device test |
| Quiet discovery | none | absent | No discovery quiet mode | — |
| Quiet analogue, reminders | At most one nudge per 20 hours (`push.ts:101-115`) | implemented | Reminder only | — |
| Quiet analogue, sensory | Independent controls (`sensory-preferences.ts:1-12`) | implemented | Not discovery | — |

### 5.7 Per-flow state matrix

Appendix A gives the normal, unknown, declined, denied, interrupted and quiet states for each existing flow.

### 5.8 Six compatibility dimensions for `matching.discovery`

The six dimensions come from AAA §11C.2 (`docs/plans/references/AAA-V7-SPEC.source.md:589-600`; restated in `docs/plans/aaa-v7-architecture-and-agent-sweeps.md:84`): interface, state, effects, operations, performance, failure semantics. They are not the six synastry metrics in `synastry-bridge.ts:24-32` (friction, resonance, balance, safety, growth, nourish).

| Dimension | Status for `matching.discovery` | Evidence | Gap for B02 |
|---|---|---|---|
| Interface | absent | No matching port (`core/ports.ts:6-40`). Services call Firestore directly (`booking.ts`, `therapist-link.ts`, `cloud-storage.ts`, `user-directory.ts`). AAA composition rule (`docs/plans/references/AAA-V7-SPEC.source.md:85-88`) is unmet. | Versioned contract (S03) |
| State | partial | Owners implied by rule shape (`firestore.rules:162-181`, `:310-322`, `:441-536`). No declared authority table. Local mirrors carry uid filters only. | Declare owner and authority per record (S02) |
| Effects | partial | Grants are copies (`cloud-storage.ts:206-214`; `therapist-link.ts:114-124`). Booking ids are random (`booking.ts:375`). No effect identity on grant writes. | Effect classes and identities (S02, S05) |
| Operations | minimal | `console` logging on failures only (`user-directory.ts`, `auth.service.ts:44-46`, `push.ts:80-82`). No control journal (AAA §10.1). | Observability and journal design (S04) |
| Performance | not measured | Five-minute cache (`user-directory.ts:12`). Single-get redemption (`cloud-storage.ts:254`). Email lookup is a query (`user-directory.ts:78-81`). | Envelope and device timing (pending) |
| Failure semantics | inconsistent | Three retries with 10-second timeout (`resilience.ts:7-38`) around commits and transactions (`cloud-storage.ts:94`, `:171`, `:230`). Booking has no retry and leaves partial state (`booking.ts:400-420`). | Per-operation timeout, retry and fallback (S02, S04) |

## 6. Findings for the coordinator

No behavior was changed. Severity is for S02 input only.

- **F-01 (high). `publicProfiles` is an always-on public identity surface.** Sign-in publishes the email and display name (`user-directory.ts:34-46`; `auth.service.ts:41-49`). The rule `allow read: if isSignedIn()` (`firestore.rules:311`) permits both `get` and `list`. The emulator spec asserts that a non-owner `get` succeeds (`firestore.rules.emulator.spec.ts:309-322`). The static spec asserts the same read permission (`firestore.rules.spec.ts:55-60`). `list` is not separately tested. The publish path ignores `emailVerified` (`user-directory.ts:35`), so an unverified address is published. The social plan requires that discovery use chosen fields and per-purpose consent (`docs/plans/social-creative-practice-beads-plan.md:208-212`). Owner: S02 with B01. Rules are broker-owned.
- **F-02 (high). Share codes are bearer copies with no expiry and cross-account gaps.** The code embeds a snapshot (`cloud-storage.ts:206-214`); there is no expiry field (`firestore.rules:80-112`); redemption returns the issuer's uid (`cloud-storage.ts:260`), which the UI stores as `partnerUid` (`overlays.jsx:399-401`); revoke requires the issuer (`firestore.rules:236`).
- **F-03 (high). Booking partial failure.** The batch at `booking.ts:400` commits the appointment and busy slot. The grant writes at `:401-420` are separate. On failure the UI reports "failed" (`overlays.jsx:749-752`) while a pending appointment exists. A retry is refused because the busy slot exists and rules deny its update (`firestore.rules:365`). *Static trace; fault injection not run.*
- **F-04 (medium). Clients cannot withdraw roster copies.** A client can delete an invite (`firestore.rules:251`). The roster row keeps its `summary` copy (`therapist-link.ts:114-124`), and only the therapist can delete the row (`firestore.rules:532`).
- **F-05 (medium). Sign-out leaves local state and can be blocked.** `signOut` removes only `ifs.auth` (`auth.service.ts:146`). Share and synastry copies remain. `disablePushReminder` is awaited with no error handling (`auth.service.ts:143-144`; `push.ts:87-99`); a rejected token deletion would reject sign-out. *Static trace.*
- **F-06 (medium). Retry semantics for writes.** `withResilience` retries commits and transactions (`cloud-storage.ts:94`, `:171`, `:230`; `resilience.ts:13-38`). A timed-out attempt may complete server-side. The batch retries reuse one `WriteBatch`. Firestore batches are single-use, so the retry is expected to fail rather than re-apply. **Verify against the installed SDK before relying on this.**
- **F-07 (high for reuse). Compatibility outputs need a decision before reuse.** `core/synastry-v2.ts:24-45` derives percentages and a bond label from two codes alone, using a hash seed (`engineVersion: 'code-seed-v1'`). No React call site was found. A display branch remains (`overlays.jsx:586-590`). The scored bridge emits relational labels such as "Mutual escalation" and "Deep freeze" (`synastry-bridge.ts:8-22`). The Stage 5 gate rejects a "compatibility verdict" (`docs/80-20-plan.md:118`). Owner: S02 and B01.
- **F-08 (high for planning). Ambiguous reuse keys.** See section 3.1. The adopted reading is supported by graph edges, but the three planning sources must be reconciled before S02 uses `C01` or `C08`.
- **F-09 (medium). Reuse list may be incomplete.** `C04` (creative commons) names B02; B02.S01 does not list it.
- **F-10 (low). Write-set mismatch.** The B02 epic metadata lists `docs/plans/extension/b02/**` (node `B02`); B02.S01 lists `architecture/extension/development/b02/s01/**`. This artifact follows the S01 value. No proposed conflicts involve B02.S01 in the 16,341-entry snapshot.
- **F-11 (medium). Consent seam absent at the base.** `core/personal-memory.ts` (the seam for `consent.provenance`) did not exist at 09194df. HEAD adds it (3670a3a), so this finding is superseded pending reconciliation. The C08 audit step (`C08.S01`, elevation plan) is the sibling reconciliation for this inventory.
- **F-12 (medium). No port for consent or matching.** Section 5.8.
- **F-13 (low). Silent local write failure.** `store.save` swallows quota errors (`local-store.ts:22-23`). Matching state would inherit this unless handled.
- **F-14 (high). No eligibility or entitlement gate.** No age, adult or minor logic exists in `src/parts-cartographer`, the rules or the worker (grep). Entitlement is a client-side cached receipt (`billing.service.ts:12`, `:58`; `ports.ts:42-44`). The AI handler authenticates and rate-limits but does not check entitlement as read (`worker.ts:185-`). Eligibility must be server-side.
- **F-15 (medium). Derived copies in backups.** Synastry keys are portable (`backup.ts:10-16`).
- **F-16 (medium). Derived partner data goes to the AI provider.** `summarizeSynastryForAi` builds metrics, labels and the computed summary (`overlays.jsx:247-262`), which `generateAiSynastryNarrative` sends through `callCloud` (`overlays.jsx:290-321`; `ai.adapter.ts:89-100`, `:240-246`). The narrative path has no consent gate in `overlays.jsx:290-321`.
- **F-17 (medium). Appointment grant flag is not authoritative.** `accessGranted` is required at create (`firestore.rules:405`), stored (`booking.ts:389`) and read (`booking.ts:265`), but no authorization decision uses it. Revocation is by status.
- **F-18 (low). Second cancel refused.** Rules refuse a client cancel of an already-cancelled appointment (`firestore.rules:426-432`). *Static trace.*
- **F-19 (low). Wall-clock times.** Appointment `start` and `end` are local strings without a zone (`firestore.rules:385-420`; `booking.ts:366-400`). This is outside B02 but affects any future time-based matching. The 80/20 plan already requires a zone contract (`docs/80-20-plan.md:66`).
- **F-20 (planning). Stale Beads export.** `.beads/issues.jsonl` contains 128 rows, the latest updated 2026-10-04T11:51:34Z. It contains none of ArchetypeAI-zwh2, -cyqe, -64fs, -2q6p, the C01 or C08 slot IDs, or the reuse Bead IDs. It cannot serve as status evidence.

**Risk note.** B02.S01 is R2 by planning metadata. Under AAA §21, risk is the maximum of component, effect and mutation class, and the classes include privacy (`docs/plans/references/AAA-V7-SPEC.source.md:846-857`). Later B02 work that exposes or grants personal data should expect R3 gates. The planning graph already marks S05 to S10 as R3 (`social-creative-practice-beads-plan.json`, `B02.S05`–`B02.S10`).

## 7. Source and data provenance

| Source | Path | Identity | Used for |
|---|---|---|---|
| Base repository state | branch `worktree-agent-a33e74034facfd2a7` | commit `09194df5f48326bff14e42a1e4eb8d66c457186d`; tree clean before this file | All code and doc reads |
| Social planning graph | `docs/plans/social-creative-practice-beads-plan.json` | sha256 `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c`; prepared 2026-10-06; `authority`: "Beads; planning snapshot, not live status"; `immutable_generation`: null | Task metadata, platform B02, features F05 F06 F07 F22 F23, B02 nodes and edges |
| Social planning narrative | `docs/plans/social-creative-practice-beads-plan.md` | sha256 `9c079c78f0a778d89b92a2b50149678744be37279c50fee4791ff22f0e35d2d9` | Slot table (`:131`), consent gate (`:208-212`), reuse rules |
| Social generator | `scripts/planning/build-social-creative-practice-plan.py` | 722 lines; read only | Confirms the graph is generated, not live |
| Elevation planning graph | `docs/plans/elevation-aaa-v7-beads-plan.json` | sha256 `88f5ffef002676450518f1cec4e526c9abf0452ecc5023d85613d3d00b39d82e` | Slot packages C01, C02, C08; live IDs in `beads_ids` |
| Creative-commons graph | `docs/plans/creative-commons-beads-plan.json` | sha256 `e5751250e3729e5d45e9f56e0ad886346a3573943bab5e804625ebcc5b1823a1`; prepared 2026-10-10 | C01 and C08 (creative-commons meaning), C04 |
| Creative-commons narrative | `docs/plans/creative-commons-beads-plan.md` | read: workstream table and reuse rules | C01, C04, C08 rows |
| 80/20 product plan | `docs/80-20-plan.md` | sha256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`; updated 2026-10-04 | Sections 1–6, 9.5, 13, 16.3, 16.5 |
| First-principles plan | `docs/plans/first-principles-elevation-beads.md` | sha256 `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` | Step pattern 01–12; dispatch rules |
| AAA sweep plan | `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | sha256 `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` | Slot dimensions (`:84`), workcell contract, risk selection |
| AAA source snapshot | `docs/plans/references/AAA-V7-SPEC.source.md` | sha256 `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc`, which matches the pin in the social JSON `baseline.architecture_source`; v7.1.0, draft normative | §4.1, §9 (effects), §10, §11C.2, §20–21 |
| Shared port contracts | `src/parts-cartographer/core/ports.ts` | sha256 `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` | Read set, full file |
| Security rules | `firestore.rules` | sha256 `726b3e108fe6fee73d3340a20130952e70aa56ad7c029b6d65ff07c699f8335a` | Server authority |
| Worker | `worker.ts`, `worker-security.ts` | sha256 `f51a86690459ae9d0cf8d90ba66126079e45c4ab4db3c971ecb70120517669e8`, `dd07e1ff40e2cf0e669992645ae01dfc6614a7922cdb5e9985c75c0f3303b265` | Routes, token verification |
| Core modules and UI | the paths cited in sections 4–6 | read at the base commit | Current behavior |
| Tests | `*.spec.ts` in `src/parts-cartographer/core/`, `firestore.rules.emulator.spec.ts`, `firestore.rules.spec.ts` | not executed | Existing test definitions only |
| Beads export | `.beads/issues.jsonl` | sha256 `e6d2b38ac2c44bd1824c03847cdd9afc98e00284849effa21060d632780eb5a5`; stale (F-20) | Checked for IDs; not status evidence |
| Live Beads | — | not read | — |

No external research was performed. The planning graphs record `source_references: []` for this Bead.

## 8. Checks

Checks run, all static, in this worktree:

1. **Read set.** All five declared read-set files were read (`ports.ts` in full; the two plan documents in full; the 80/20 plan in the sections above; the social graph parsed programmatically).
2. **JSON validity.** The social, elevation and creative-commons graphs were parsed with the Python standard library in isolated mode. The social graph has 1,807 nodes and 4,240 edges; B02.S01 has no predecessor edges and blocks B02.S02.
3. **Citations.** Line numbers were taken from `grep -n` or `sed -n` at commit `09194df`.
4. **Pinned source.** The AAA snapshot hash matches the pin in the social graph (see section 7).
5. **Negative searches.** Logged in Appendix B.
6. **Write set.** Only `architecture/extension/development/b02/s01/b02-s01-inventory.md` was created. Section 11 gives the check after the write.

Checks not run, and why:

- Unit tests (`vitest`), Firestore emulator and rules tests, typecheck, build and browser parity. The worktree has no `node_modules`. Installing would write outside the write set, and no emulator is configured for this task.

## 9. Evidence status

| Evidence | Status |
|---|---|
| Static trace of code, rules and planning documents (this file) | Actual (static). Candidate. Not independently reviewed |
| Unit, emulator and rules test runs | **Not run. Pending** |
| Deployed Firestore rules and live project configuration | **Not inspected. Pending** |
| Live Beads status for the IDs in this file | **Not read. Pending** |
| Participant observation (consent comprehension, discovery use) | **Pending. None collected; none claimed** |
| Device, accessibility and quiet-mode observation | **Pending** (`V05` preparation) |
| Two-account live-service checks (booking, share codes, sign-out) | **Pending** (`V04` preparation) |
| Community, tradition or practitioner review of matching criteria | **Pending** (`V01`–`V03` preparation) |
| Independent review of this inventory | **Pending** |

## 10. Limitations

- The inventory is static. Deployed rules, deployed configuration and runtime behavior were not checked. Repository rules are assumed to be the ones in force, which is unverified.
- Items marked *static trace* were not executed. F-03, F-05, F-06, F-18 and the two-account and retry scenarios need fault-injection or two-account runs.
- The `list` permission on `publicProfiles` is inferred from rule text. It is not separately tested.
- Live Beads status, the `reuse_beads` IDs of the creative-commons packages, and the elevation C01 and C08 step outputs were not checked. Their current state is unknown.
- The six-dimension reading uses the AAA §11C.2 definition. No matching contract exists yet to test against.
- The Angular surface was sampled. `synastry-legacy64-bridge.ts` was not traced beyond its test names.
- No legal, privacy or clinical review was made. Statements about eligibility and consent describe code and rule text only.
- The proposed effect classes (section 4.3) are this inventory's proposals.

## 11. Rollback and undo

This artifact is one new file under the write set. Rollback is `git revert` of its commit, or deleting the file. No app source, rules, locales, CI, lockfile, Beads export or tracker state was changed.

Post-write check: `git status` shows the new file and nothing else.

## 12. Next handoff: B02.S02

**Next Bead:** ArchetypeAI-2q6p, [B02.S02] Specify authoritative state, grants and effects. Its planning output is `ownership and permission/effect matrix` at `architecture/extension/development/b02/s02/**`. It is blocked by this Bead.

**Inputs the next consumer must read:**

- this file, at the commit recorded in the Bead;
- the elevation C01 (auth identity) and C08 (consent and provenance) outputs, when they exist;
- `docs/plans/references/AAA-V7-SPEC.source.md` §9, §10, §11C.2 and §21;
- the social graph node `B02.S02`.

**Decisions S02 must make:**

1. **Matching grant.** Authoritative owner (server or client), record shape, purpose scope, versioning.
2. **`publicProfiles`.** Keep it for therapist lookup, or replace it with grants. Decide whether unverified emails and `list` are allowed. Broker-owned rules change. (F-01)
3. **Decline and block.** Server records, symmetric effects on both parties, suppression of future matching. No queue exists today. (section 5.6)
4. **Eligibility.** Server-side policy, unknown denied, depends on D01 in the creative-commons plan. (F-14)
5. **Revocation.** Which copies can be withdrawn and which cannot. Recipients' copies are disclosures. (F-02, F-04, F-15)
6. **Account change.** Uid link versus new uid, migration or orphan policy, and cross-account revocation. (F-05)
7. **Deleted source.** No deletion path exists. Define propagation. (section 5.4)
8. **Idempotency.** Effect identities for grant, share and booking writes, replacing random ids where the effect is external. Review retry policy. (F-03, F-06)
9. **Quiet and offline.** No queue. Quiet means no discovery, and solo use stays complete. Keep sensory controls independent. (section 5.6)
10. **Criteria provenance.** Each explanation must name the fields and rules used. The current synastry labels are not a model. (F-07, F-16)
11. **Six dimensions.** S04 builds the compatibility suite from S02 outputs. Section 5.8 is the starting checklist.

**Blocking issues for S02 dispatch:** `base_generation` is null. The coordinator must bind an immutable base, and must resolve F-08 and F-09 before S02 uses the C01 and C08 keys.

**Not to be assumed by S02:** that `publicProfiles` is consent; that synastry output is matching evidence; that share codes or invite codes are discovery grants; that the reuse keys C01 and C08 mean the same thing in every plan.

**Checks after writing this file:** `git status` must show only this path, and no bd command was run.

## Appendix A. Per-flow state matrix

Each cell gives the existing behavior and its source, or "none" when no code exists. These are static traces.

| Flow | Normal | Unknown | Declined | Denied | Interrupted | Quiet |
|---|---|---|---|---|---|---|
| Public identity (`publicProfiles`) | Written on linked sign-in (`user-directory.ts:34-46`) | Unverified email is published; `emailVerified` is ignored (`user-directory.ts:35`) | None; no opt-out or delete path in code | None; any signed-in user may read (`firestore.rules:311`) | Best-effort; failure is logged and sign-in continues (`auth.service.ts:44-46`) | None |
| Map share code | Consent checkbox, then create (`overlays.jsx:323-345`, `:503`) | Unsupported payload: redemption returns null (`cloud-storage.ts:249-277`) | No decline; user withholds consent (`overlays.jsx:326`) | Revoked or unknown: "unavailable or revoked" (`overlays.jsx:373`); not signed in: login overlay (`overlays.jsx:325`) | Collision or timeout can mint an orphan code (`cloud-storage.ts:224-247`; F-02) | None |
| Synastry redeem and save | Redeem, compute, save (`overlays.jsx:364-420`) | Older result without `engineVersion`: unknown-version copy (`overlays.jsx:586-591`; `synastry-v2.ts:12-13`) | None | Not linked: error (`overlays.jsx:371`) | Save failure shows `synLoadFailed`; result stays on screen (`overlays.jsx:409`, `:414`) | None |
| AI synastry narrative | Generate and save reflections (`overlays.jsx:290-321`) | Degradation descriptor (`ai.adapter.ts:130-145`) | None | Unauthenticated Worker call is refused (`worker-security.ts:65-79`) | Late reply ignored after abort (`overlays.jsx:302`) | Heuristic fallback (`ai.adapter.ts:147`, `:207`, `:228`) |
| Booking request | Consent checkbox, then confirm (`overlays.jsx:842-852`, `:735-756`) | No availability message (`overlays.jsx:726`) | Therapist declines through `setAppointmentStatus` (`booking.ts:339-357`; `overlays.jsx:955`) | Busy slot refused by rules (`firestore.rules:340-364`; `emulator.spec.ts:389`) | Partial failure: appointment kept, grant missing (`booking.ts:400-420`; F-03) | None |
| Therapist invite and roster | Create and claim (`therapist-link.ts:86-126`) | Summary shape validated by rules (`firestore.rules:146-160`) | None; claim is therapist-initiated | Assignment needs a trusted roster (`firestore.rules:540-555`; `emulator.spec.ts:475`) | None specific | None |
| Reminder opt-in | Enable after permission (`push.ts:32-84`) | Ready state before consent (`push.ts:24-29`; `push.spec.ts:96`) | Permission denied is not asked again (`push.ts:34-40`; `push.spec.ts:110`) | Denied state (`push.ts:26`, `:34`) | Token rotation deletes old token before writing new (`push.ts:64-70`) | Nudge at most once per 20 hours (`push.ts:101-115`) |
| Sensory controls | Independent presets and overrides (`sensory-preferences.ts:1-12`) | Malformed values fall back (`sensory-preferences.spec.ts`, persistence test) | None | None | None | Not a discovery quiet mode |

## Appendix B. Negative search log

Searches were run in this worktree at commit `09194df`. Word-boundary matches were reviewed by hand. Hits that were media queries, `popup-blocked` handling or unrelated copy are excluded.

| Pattern (scope) | Result | Conclusion |
|---|---|---|
| `matching`, `matchmaking`, `discovery`, `discoverable`, `blocked`, `block list`, `decline` (`src/`, non-spec) | Only appointment decline in therapist UI and copy (`strings.ts:418`) | No opt-in matching or discovery feature |
| `block`, `report`, `mute`, `unfollow`, `purpose` (`firestore.rules`) | 0 hits | No block, report or purpose concept in rules |
| `expedition`, `shared experience`, `theme space` (`src/`, `firestore.rules`) | 0 hits | Creative-commons feature families not implemented |
| `personal-memory`, `personalMemory`; filenames matching `personal`, `consent`, `provenance` (`src/`) | 0 source hits at base 09194df; at HEAD `core/personal-memory.ts` matches (3670a3a) | Consent and provenance seam absent at base (F-11, superseded) |
| `deleteUser`, `delete account`, `deleteAccount`, `deleteAll` (`src/`) | 0 hits | No account deletion path |
| `adult`, `minor`, `eligib`, `dateOfBirth`, `age verification` (`src/parts-cartographer`, rules, worker) | 0 person-eligibility hits at base 09194df; at HEAD `eligib` matches only action eligibility (`src/parts-cartographer/elevation/e05-uncertainty-action.ts:39-56`) | No person-eligibility gate (F-14) |
| `deleteDoc`, `deleteUser` (`user-directory.ts`, `src/services/user-directory.service.ts`) | 0 hits | No in-app withdrawal of `publicProfiles` (F-01) |
| `synastry(`, `synFromProfiles` call sites (React tree) | Definitions only; bridge imports the Angular engine under an alias | `code-seed-v1` has no React call site (F-07) |
| `quiet` (`src/parts-cartographer`) | Sensory texture attribute (`app.jsx:376`) and copy | No social or discovery quiet mode |
| `accessGranted` (`src/`, rules) | Rules `firestore.rules:389-405`; `booking.ts:60`, `:265`, `:389` | Stored but no authorization decision reads it (F-17) |
| `premium`, `isPremium` (`src/parts-cartographer`, `worker.ts`) | Client-side cached receipt (`billing.service.ts:12`, `:58`); no entitlement check in the AI handler as read | Entitlement is not server-enforced (F-14) |
