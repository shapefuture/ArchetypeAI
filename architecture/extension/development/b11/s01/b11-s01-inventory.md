# B11.S01 inventory: current ownership and actual reuse for shared presence and finite group activities

**Status: candidate awaiting independent review.** This is a static source trace at a fixed base. No acceptance is claimed. No runtime, emulator, browser, device, live-service, participant, community, or practitioner evidence was collected for this step. Those rows are marked *pending* or *not collected*.

| Field | Value |
| --- | --- |
| Bead | ArchetypeAI-92wk, `[B11.S01] Inventory current ownership and actual reuse` (planning key B11.S01, planning task ArchetypeAI-cyqe) |
| Parent epic | ArchetypeAI-lub7, `[B11] Shared presence and finite group activities` |
| Next consumer | ArchetypeAI-ludh, `[B11.S02] Specify authoritative state, grants and effects` (BLOCKS edge from 92wk) |
| Slot named by the epic | `social.presence` (`owned_slots` is empty for this step) |
| Mutation / risk (task metadata) | M0 / R2 |
| Base | Branch `worktree-agent-a6ca915b6bc11030d`; HEAD `09194df5f48326bff14e42a1e4eb8d66c457186d`; worktree clean when inspection started |
| `base_generation` | `null`. No immutable generation exists for this base. |
| Published contract versions | None for `social.presence` |
| Write set | `architecture/extension/development/b11/s01/**`. This file is the only artifact. No app source, package, lockfile, CI, rules, or locale file was changed. |
| Commit | Reported in the final reply and the Bead update. It is not self-referenced in this file. |

Labels used below:

- **Source-traced**: read directly in the code at the base.
- **Rules-derived**: inferred from the text of `firestore.rules`. No emulator run exercised it.
- **Test-covered**: an existing test asserts the behavior.
- **Absent**: no code was found by search (see section 2).

---

## 1. Summary

1. **No shared presence, group session, participant-role, quiet-participation, or expiry mechanism exists** in `src/**`, `worker*.ts`, or `firestore.rules`. The closest existing structure is a **two-party booking** (`appointments`) with a status lifecycle and a per-therapist, per-start reservation lock.
2. **Existing grants are per party and checked by Firestore rules.** These are booking grants (`clientShares`), invite summaries (`therapistLinks` and `therapistClients`), share codes (`shareCodes`), and exercise assignments. **None has an expiry field.** Revocation happens by appointment status, by deleting a document, or not at all (invite summary copies).
3. **A booked therapist can read the client's saved assessment and history from the moment the request is created**, while the appointment is still pending. The read is not limited to the items the client selects (section 8.1, F4).
4. **Host control is incomplete.** The client can cancel a pending or approved session. The therapist can only approve or decline a pending one. Neither rules nor either UI lets a therapist cancel an approved session (F5).
5. **Role authority is client-asserted.** Therapist attestation is a `localStorage` flag. Any signed-in user can write `therapists/{uid}`. The UI copy says a license is verified at first claim, and no code does that (F9).
6. **The consent text promises an unlink.** `CONSENT_TEXT` says "You can unlink at any moment" (`therapist-link.ts:202`). No client path deletes an invite link or a therapist roster copy (F2).
7. **Reusable pieces exist.** These are the appointment-plus-busy-slot batch, the transactional status release, the emulator rule-test harness, the bearer-code pattern, the allowlisted snapshot projection (`cloud-storage.ts:40`), the account-bound billing receipt with a version fence (`billing.service.ts`), and the `withResilience` wrapper. Booking does not use the wrapper.
8. **C01 and C08 are design-stage creative-commons workstreams.** Their declared reuse targets (F/B packages) are largely unimplemented here. No membership, messaging, thread, invitation, presence, or expedition collection exists in the rules (section 3).
9. **Twenty candidate findings (section 10) need independent verification** before any behavior change. Several are rules-derived and need an emulator check.

---

## 2. Method and search evidence

- **Read set (task metadata):** `docs/80-20-plan.md`, `docs/plans/first-principles-elevation-beads.md`, `docs/plans/aaa-v7-architecture-and-agent-sweeps.md`, `docs/plans/social-creative-practice-beads-plan.json`, `src/parts-cartographer/core/ports.ts`. All five exist at the base. The pinned AAA source snapshot matches its recorded SHA-256 (section 12).
- **Also traced:** `firestore.rules` (all match blocks), `firestore.rules.emulator.spec.ts`, `firestore.rules.spec.ts`, `worker.ts`, `worker-security.ts`, the React retained surface (`src/parts-cartographer/**`), and the Angular retained surface (`src/app/**`, `src/services/**`) at the booking, cabinet, therapist, and synastry call sites.
- **Keyword search (src, worker files, rules, scripts):** presence, participant, invite, guest, expir, cancel, quiet, group, session, host, room, social, friend, member, block, report, consent, grant, therapist, synastry, community, thread, expedition, match.
  - *Presence:* only hits are prose ("presence") in i18n strings and a code comment. No presence model exists.
  - *Expiry:* hits are only the in-memory directory cache TTL (`user-directory.ts:12`) and billing receipt freshness (`billing.service.ts`). No TTL or expiry applies to any shared object.
  - *Group, participant, room, expedition, community, thread:* no group or multi-party session model. The only multi-party objects are two-party: the appointment, and the synastry pair.
- **Firestore TTL:** `firebase.json`, `firestore.indexes.json`, and the source contain no TTL policy.
- **Server routes:** `worker.ts:172-180` serves `/api/ai`, `/api/stripe-checkout`, `/api/stripe-verify`, and returns 410 for `/api/gemini`. No session, presence, or sharing route exists.
- **Server functions:** no `functions/` directory exists in the repository. Server-side notifications for status changes are not present in this repository.

---

## 3. Reuse package reconciliation (C01, C08, and B11's declared dependencies)

**Resolution note.** The task metadata names `C01` and `C08`. In `docs/plans/social-creative-practice-beads-plan.json`, the B11 platform entry lists reuse `["C01","C08"]` and dependencies `["B03","B04"]`. The `C` keys are defined in `docs/plans/creative-commons-beads-plan.md` (table rows for C01 at line 23 and C08 at line 30) and in the graph nodes of `docs/plans/creative-commons-beads-plan.json`. They are not in the social plan's `methods` or `features` tables. This file uses the creative-commons definitions. If the coordinator meant other packages, this section needs re-reconciliation.

| Key | Workstream (source) | Stage / owner | Reuse Beads listed in graph (status not verified here) | Declared reuse targets | What exists in code for those targets | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Connected public threads (`creative-commons-beads-plan.md:23`) | design / domain-owner | ArchetypeAI-jten, -2lnj, -tmuuj, -tica, -vlfx, -nje6 | F01, F04, F15, B03, B04, B12 | No thread, message, or public-content collection in `firestore.rules`. Public discovery is limited to `publicProfiles` (rules 310-322) and email lookup (`user-directory.ts:71`). | Design stage. B03 and B04 are absent as reusable models. Delta required. Reuse cannot be decided without live status of the six Beads. |
| C08 | Cross-circle expeditions (`creative-commons-beads-plan.md:30`) | design / domain-owner | ArchetypeAI-pxk9, -6nzhj, -nsrho, -ktaon, -xwzgu, -ot4ky | F07, F23, F24, F42, F43, F46 | No group, activity, expedition, or invitation collection. | Design stage. Same as C01. |
| B03 (B11 dependency) | Membership, moderation, recipient authority (`community.membership`) | planning / domain | Not in this export | C01, C08 reuse it | No membership or moderator model. The nearest objects are the therapist roster `therapistClients` (rules 472-533, therapist-scoped) and grants `clientShares` (rules 441-467, booking-scoped). Neither is group membership. | Absent as a group model. Partial grant patterns only. |
| B04 (B11 dependency) | Messages, invitations, reviewed contributions (`social.messaging`) | planning / domain | Not in this export | C01, C08 reuse it | No messages or invitations collection. `therapistLinks` is a bearer code that carries a summary, not a message. | Absent. |

**Live status check.** `bd` was not invoked (task rule). The passive export `.beads/issues.jsonl` (blob `1d9720ac266c`, 128 rows) contains none of the 16 IDs above (the 12 reuse IDs, `ArchetypeAI-lub7`, `ArchetypeAI-cyqe`, `ArchetypeAI-92wk`, `ArchetypeAI-we2s`, `ArchetypeAI-we2s.1`). The export is not the status authority in any case. Live status is **not verified** and is a prerequisite for B11.S02 (section 14).

---

## 4. State inventory

### 4.1 Server state (Firestore)

Authority fields are the uid fields that rules compare with `request.auth.uid`.

| ID | Path and shape | Authority | Writers (module:lines) | Readers | Lifecycle and expiry | Revocation / deletion | Rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | `therapists/{uid}`: `{email, availability[<=14]}` | owner uid | `booking.ts:245-252` (`saveTherapistAvailability`); `overlays.jsx:966-985` | any signed-in user | none | no delete (`allow delete: if false`, line 334) | 326-335 |
| S2 | `therapistBusySlots/{therapistUid}_{start}`: `{therapistUid, appointmentId, start, end}` | therapist (schedule); reservation tied to an appointment | `booking.ts:378-399` (batch with appointment); `booking.ts:339-356` (release); `booking.ts:311-337` (backfill) | any signed-in user; `appointmentId` is included (see F15) | exists while the appointment is pending or approved | released on decline or cancel by a rules-checked batch or transaction | 340-379 |
| S3 | `appointments/{id}`: `{clientUid, clientEmail, therapistUid, therapistEmail, start, end, status, createdAt, accessGranted}`; `start`/`end` are naive local strings | client and therapist parties | create: `booking.ts:375-400`. Status: therapist pending to approved or declined; client pending or approved to cancelled (`booking.ts:339-356`) | parties only (rules 386-387) | no expiry; pending never auto-expires; no delete | status-only transitions; no host cancel of approved (F5) | 385-436 |
| S4 | `clientShares/{therapistUid}_{clientUid}`: `{clientUid, clientEmail, therapistUid, grantedAt, source:'booking', appointmentId}` | client | `booking.ts:401-412` (merge) | parties; therapist also reads `users/{client}/assessment` and `history` via `hasTherapistReadGrant` (rules 133-137, 166, 171) | read window is "appointment pending or approved" (rules 43-46, 62-69) | lazy, by appointment status; client may delete the doc (rule 466) | 441-467 |
| S5 | `therapistClients/{therapistUid}_{clientUid}`: source `booking` (appointmentId, no summary) or `invite` (linkCode, summary copy); `archived` flag | therapist for invite rows and archive; client for booking rows | `booking.ts:413-424` (merge); `therapist-link.ts:114-124` (claim, no merge); `therapist-link.ts:162-171` (archive) | therapist | booking row valid while booking share is valid (rules 484-486, 521-530); invite row valid while the `therapistLinks` doc exists with an identical summary (rules 495-496, 517-518) | delete by therapist only (rule 532); client cannot remove an invite row | 472-533 |
| S6 | `therapistLinks/{code}`: `{clientUid, createdAt, summary}` (summary copy) | client | `therapist-link.ts:86-102` | any signed-in user who has the code (bearer `get`, rule 242) | no expiry, no reuse limit | client delete (rule 251); no client UI path (F2); no update (rule 250) | 241-252 |
| S7 | `assignments/{id}`: exercise assignment | therapist (create only) | `therapist-link.ts:174-191` | client and therapist | no expiry | no update or delete (rule 555) | 537-556 |
| S8 | `shareCodes/{code}`: `{uid, createdAt, schema:'parts-cartographer.v1', mapSnapshot}` or `{assessment}` (a copy) | owner uid | `cloud-storage.ts:206-214` (create); `cloud-storage.ts:282-286` (revoke) | any signed-in user who has the code (`get` only, rule 227) | no expiry | owner delete (rule 236) | 226-237 |
| S9 | `publicProfiles/{uid}`: `{emailLower, email, displayName, updatedAt}` | owner uid | `user-directory.ts:34-46`; auto-sync on linked sign-in `auth.service.ts:41-49`; Angular copy `src/services/user-directory.service.ts:102` | any signed-in user; `get` by uid or email, and list is not restricted by the rule text (F1) | refreshed at sign-in; 5-minute client cache (`user-directory.ts:12`) | owner delete (rule 321) | 310-322 |
| S10 | `users/{uid}/assessment`, `history`, `connections`, `synastry` | owner uid | `cloud-storage.ts:82-95` (save, batch with history); `cloud-storage.ts:150-171` (synastry save) | owner; therapist and admin via grants (rules 166, 171) | no expiry | owner write, including delete (rules 163, 167, 172); no client code deletes cloud history (see 8.4) | 162-182 |
| S11 | `users/{uid}/synastry/{partnerUid}`: saved result with partner uid and share code used | owner uid | `cloud-storage.ts:150-171`; `overlays.jsx:401` | owner | no expiry | not removed when the partner's code is revoked (F12) | 179-181 |
| S12 | `adminAllowlist`, `adminClients` | verified admin email | `admin.ts` (not traced in depth) | admin | none | admin | 257-306 |

### 4.2 Local state (browser)

| ID | Key or store | Content | Writers and readers | Scope | Notes |
| --- | --- | --- | --- | --- | --- |
| L1 | `ifs.auth` (`KEYS.auth`) | cached identity | `auth.service.ts:41-43` (persist); `auth.service.ts:77-79` (read); `app.jsx:62` | not account-bound beyond itself | Used as the app's identity at mount (F10) |
| L2 | `ifs.share.codes` (`KEYS.share`) | issued share-code list, capped at 20 | `overlays.jsx:189-193` (read, filtered by uid); `overlays.jsx:333-336` (append, `slice(-20)`); `overlays.jsx:347-355` (revoke) | per device | Codes beyond the cap leave the list, not the server (F6) |
| L3 | `ifs.syn.connections` (`KEYS.syn`) | synastry connections and result | `overlays.jsx:306` | not uid-scoped | Survives sign-out (F10) |
| L4 | `INNERVERSE_SYNASTRY_RUNS_V1` | run log of partner codes, capped at 50 | `overlays.jsx` (`rememberSynastryRun`) | not uid-scoped | In `BASE_KEYS` (backup) |
| L5 | `ifs.attested` | therapist attestation flag | `overlays.jsx:886`, `overlays.jsx:1005`; `innerverse.jsx:424`, `innerverse.jsx:636` | per device | Not a server claim (F9) |
| L6 | `ifs.avail` | therapist availability draft | `overlays.jsx` `loadAvail` (from line 871) | per device | |
| L7 | `ifs.sensory.v1` | motion, sound, texture, density presets | `sensory-preferences.ts:1-20` (presets), `:52-61` (load and save) | per device | Motion and texture only; not participation (see 8.6) |
| L8 | `ifs.history` archive | previous profiles, capped at 30 | `local-store.ts:5` (cap), `app.jsx:163-168` | not uid-scoped | Survives `setProfile(null)` (see 8.4) |
| L9 | Backup export (`exportBackup`) | portable keys (`BASE_KEYS`) | `backup.ts:10-18` (keys), `:148-156` (export), `:132-146` (apply) | none | No owner or account field. Restore is not account-checked |
| L10 | Overlay React state (booking step, therapist, slot, `shareConsent`) | in memory | `overlays.jsx:665-690` | ephemeral | Lost on reload; not a draft store |

---

## 5. Effect inventory (AAA v7.1 §9 classes)

Classes are from `docs/plans/references/AAA-V7-SPEC.source.md` §9 (lines 324-337): E0 pure, E1 read, E2 monotone write, E3 reversible write, E4 idempotent external, E5 irreversible external. The classification in this table is a proposal for B11.S02 to ratify.

| # | Operation | Code | Proposed class | Retry in code | Compensation in code | Dedupe or identity |
| --- | --- | --- | --- | --- | --- | --- |
| O1 | Create appointment and busy slot (one batch) | `booking.ts:375-400` | E3 (inverse: client cancel) | none | none beyond cancel | deterministic slot doc ID `therapistUid_start` blocks a second reservation (rules 340-365) |
| O2 | Create `clientShares` and `therapistClients` grants (separate writes after O1) | `booking.ts:401-424` | E3 | none | none; a failure here leaves O1 without grants (F7) | merge keyed by party uids |
| O3 | Approve or decline (therapist) | `booking.ts:339-356`; `overlays.jsx:951-960` | E3 (no reopen path; one-way) | Firestore transaction retry only | none | none beyond the transaction |
| O4 | Cancel (client) | `booking.ts:339-356`; `cabinet.jsx:69-86` | E3 (one-way) | none | none | busy-slot release conditioned on matching appointment ID; retry is not idempotent (F8) |
| O5 | Create invite code | `therapist-link.ts:86-102` | E2 | none | client delete exists in rules, not used in UI | random 10-character code; existence check by `getDoc`, not atomic |
| O6 | Claim invite (therapist) | `therapist-link.ts:105-126` | E3 (overwrites the roster document) | none | none | doc ID `therapistUid_clientUid`; overwrite drops booking fields (F17) |
| O7 | Archive or restore client | `therapist-link.ts:162-171` | E3 | none | toggle | doc ID |
| O8 | Create share code (map or legacy) | `cloud-storage.ts:206-226`, `:224-244` | E2 | loop of 4 attempts on collision or error | revoke (O10) | random 12-character code; a retry after a lost acknowledgement can create a second live code |
| O9 | Redeem share code | `cloud-storage.ts:249-279` | E1 read, then a disclosure (see note) | `withResilience` (`:249-279`) | none; copies are not recalled (F12) | code |
| O10 | Revoke share code | `cloud-storage.ts:282-286` | E3 | `withResilience` (3 retries) | n/a | code |
| O11 | Save synastry copy | `cloud-storage.ts:150-171` | E3 (upsert keyed by partner uid) | `withResilience` | overwrite | partner uid |
| O12 | Publish public profile | `user-directory.ts:34-46`; `auth.service.ts:41-49` | E3 | best effort; errors logged | overwrite | uid |
| O13 | Lookup therapist by email, or read busy intervals | `user-directory.ts:71-93`; `booking.ts:288-304` | E1 | none | n/a | n/a |
| O14 | Create exercise assignment | `therapist-link.ts:174-191` | E2 (rules forbid update and delete, line 555) | none | none | `clientUid_exerciseId_Date.now()`, not a stable key |
| O15 | Save cloud history entry | `cloud-storage.ts:82-95` | E2 (append-like) | `withResilience` | no delete path in client code | random doc ID |

**Disclosure note.** Operations O2, O5 to O6, O8 to O9, O11, and O14 give another party a copy of user data. The copy cannot be recalled by revocation. AAA §9 requires an `effect_id` or equivalent identity for E4 and E5 operations, and none of these carries one. The 80-20 plan states the limit as "copied/downloaded information cannot be recalled" (`docs/80-20-plan.md:575`). The proposed class for disclosure is **E5-like**, to be ratified in B11.S02. No E4 operation exists in the presence path. No outbound message is sent by any path (consistent with the plan's no-external-messaging rule).

---

## 6. Component inventory

Verdict: **reuse** (use as is), **adapt** (use with declared changes), **avoid** (do not use as a model), **absent** (no code exists).

### 6.1 React retained surface (`src/parts-cartographer`)

| Component | Path (lines) | Role for B11 | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Synastry and share-code overlay | `overlays.jsx:187-440` | issue, revoke, redeem share codes; saved synastry | adapt | Local-only issuance registry, cap 20 (F6). Consent text `strings.ts:193` |
| Booking overlay | `overlays.jsx:665-870` | find therapist by email, pick slot, consent, request | adapt | Two-party. Consent checkbox 843-848. Device-clock display 809. No offline path |
| Therapist overlay | `overlays.jsx:884-1097` | attestation (`:1005`), availability, pending decisions (`:1067-1077`) | adapt | Attestation is local (F9). Pending-only decisions |
| Therapist code share | `overlays.jsx:1437-1530` (`therapistShareSummary` `:1437-1456`; `createShareCode` `:1506-1516`) | create invite summary | adapt, with defect | Constant `activation: 1` at `:1451` (F19). No unlink |
| Client cabinet | `screens/cabinet.jsx:14-230` | list own appointments; cancel | reuse | Stale-response guard (`:16-18`, `:76`, `:81`). Cancel shown for pending or approved (`:226-228`) |
| Therapist dashboard | `screens/innerverse.jsx:421+` (`SpecialistView`) | claim codes, linked clients, archive, assign | adapt | Archive is a display filter, not revocation (`:438-439`, `:508-514`, `:727-731`) |
| Practice assignments | `screens/practice.jsx:79` | reads `myAssignments` | reuse (read) | |
| App shell identity | `app.jsx:62`, `app.jsx:195` | identity state | adapt | No Firebase auth subscription in the shell (F10) |
| Login overlay | `overlays.jsx:1098` (`Login`) | sign-in and linking | reuse | |

### 6.2 Angular retained surface (`src/app`, `src/services`)

| Component | Path (lines) | Role for B11 | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Booking panel | `src/app/features/booking-panel/booking-panel.component.ts` (`shareConsent` `:64`; anonymous gate `:181`; `createBooking` `:185`) | parallel booking UI | adapt | Calls the same core (`booking.ts` re-export, `booking.ts:3`) |
| Cabinet | `src/app/features/cabinet/cabinet.component.ts` (`myAppointments` `:143`; cancel `:164`) | parallel cancel UI | reuse core | |
| Therapist panel | `src/app/features/therapist-panel/therapist-panel.component.ts` (`pendingAppts` `:113-116`; `decide` `:132-135`); `.html` (decisions `:52-58`; activation shown `:102-103`) | pending decisions; complex activation display | adapt | Shows constant activation (F19) |
| Synastry panel and compare | `src/app/features/synastry-panel/*`, `src/app/features/synastry-compare/*` | pair results | adapt | Not traced in depth |
| Angular user directory | `src/services/user-directory.service.ts` (`class` `:47`; cache `:59`; write `:102`) | duplicate of `core/user-directory.ts` | avoid | Second implementation of the same contract (F13) |
| Angular therapist link | `src/app/core/data/therapist-link.ts:3` | re-export of the React module | reuse | Single implementation |
| Angular auth port | `src/app/core/ports/auth.port.ts` | second auth port | avoid as a model | Different interface from `core/ports.ts` (F13) |

### 6.3 Core data layer (`src/parts-cartographer/core`)

| Module | Lines | Role for B11 | Verdict | Notes |
| --- | --- | --- | --- | --- |
| `booking.ts` | 1-426 | slot math (pure), appointments, busy slots, booking grants, transactions | reuse for slot math and batch pattern; adapt for group capacity | Pure slot math has tests (`booking.spec.ts`, 3 tests). Single reservation per therapist and start (`:378-399`) |
| `therapist-link.ts` | 1-205 | invite codes, roster, assignments, consent text | adapt | Consent-unlink gap (F2). Claim overwrites (F17). Scale of summary fields |
| `cloud-storage.ts` | 1-287 | allowlisted snapshot (`:40-80`), cloud history, synastry copies, share codes | reuse snapshot and share-code pattern; adapt | Share-code create and revoke have no expiry |
| `user-directory.ts` | 1-100 | `publicProfiles` lookup and sync, 5-minute cache | adapt | Discovery privacy (F1) |
| `auth.service.ts` | 1-148 | auth port over Firebase; cached identity | adapt | Account change (F10) |
| `local-store.ts` | 1-72 | local key-value store, bounded history | adapt | Keys are not uid-scoped (`:56-72`) |
| `backup.ts` | 1-156 | export and import of portable local keys | avoid as an account boundary | No owner. Version gate exists (`:77` rejects unknown backup versions) |
| `billing.service.ts` | receipt binding (`:12`, `:58`, `:76`); spec `billing.service.spec.ts:18-60` | account-bound receipt and version fence | reuse pattern | Tested for account switch ("ignores a verification that finishes after account switching") |
| `push.ts` | 1-115 | FCM for check-in reminder only (`:102-109`) | absent for session notifications | |
| `sensory-preferences.ts` | 1-61 | motion, texture, density presets | reuse for presentation only | "still" affects motion and texture, not participation |
| `profile-contract.ts` | 1-33 | profile shape validation | reuse | |
| `clinical-profile-adapter.ts:149` | energy scaling 0..1 | scoring-to-part mapping | reuse with care | Mixed scales are documented in `universe-controls.ts:8` (F20) |
| `synastry-bridge.ts`, `synastry-v2.ts` | pure computation | two-party comparison | reuse if pair comparison is needed | Not traced in depth |

### 6.4 Infrastructure

| Component | Path (lines) | Role | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Firestore rules | `firestore.rules` 1-558 | authoritative ownership and grant checks | reuse; broker-owned writes | No collection for membership, messages, presence, sessions |
| Worker routes | `worker.ts:172-180` | AI, Stripe, 410 for old Gemini proxy | absent for social | No route for sessions or presence |
| Worker security | `worker-security.ts:65` (`authenticateFirebaseRequest`), `:162` (`checkRateLimit`) | Firebase ID-token verification and rate limit | reuse if a server route is needed | |
| Firestore init | `src/environments/firebase-init.ts:29-35` | `initializeFirestore` with long-polling detection | adapt | No persistence configured (F14) |
| Resilience wrapper | `src/app/core/adapters/resilience.ts:8-14` | 10-second timeout, 3 retries with jitter | reuse | Used by `cloud-storage.ts`; not by `booking.ts` or `therapist-link.ts` (F14) |

### 6.5 Tests that exist

| Test | Coverage |
| --- | --- |
| `booking.spec.ts` (3 tests) | DST, midnight, window deduplication (pure) |
| `cloud-storage.spec.ts` (2 tests) | share-code collision retry; legacy payload validation |
| `src/app/core/data/therapist-link.spec.ts` (4 tests) | code alphabet; summary projection; consent text in both languages; RED gate |
| `billing.service.spec.ts:18-60` | account-scoped verification; ignores results after account switch |
| `firestore.rules.spec.ts` | static text assertions of rule blocks (for example, `shareCodes` get and list) |
| `firestore.rules.emulator.spec.ts` | rule behavior with the emulator. Skipped unless `FIRESTORE_EMULATOR_HOST` is set (lines 24, 44). Covers: share codes (260-293), public profile get (309-322), fake booking grants (325-352), busy-slot privacy and duplicate reservation (353-387), exactly one concurrent reservation (389-412), grant read while pending and revocation on decline (414-425), field injection and transitions (427-452), invite claim, positive case only (454-474), assignment gate (475-) |

---

## 7. Roles, writes, and contract manifest

### 7.1 Roles observed

No role table exists. Roles are inferred from ownership fields.

| Role | Identity source | Authority evidence | Notes |
| --- | --- | --- | --- |
| Signed-in client (linked) | Firebase user with email | rules `isSignedIn()` (15-17); `request.auth.token.email` for appointments and shares (388-393, 444-448) | Requirement for booking in UI: `user.linked` (`overlays.jsx:690-700`) |
| Anonymous Firebase user | Firebase anonymous session | passes `isSignedIn()` (F18) | UI gates treat it as not linked |
| Offline guest | `local_` uid, not a Firebase identity | `auth.service.ts:51-57` | Cannot satisfy social rules |
| Therapist | `therapists/{uid}` profile plus local attestation | rules 326-333 (any owner may write); `ifs.attested` (L5) | Self-asserted (F9) |
| Admin | verified email in allowlist | rules 29-35; `adminClients` 275-306 | Cross-user read of assessment and history for linked clients (rules 139-144, 166, 171) |
| Share-code redeemer, synastry partner | any signed-in user with the code | rules 226-237 | No role beyond possession of the code |
| Host, participant, co-host, moderator, guest | none | section 2 | **Absent** |

### 7.2 Writes by module (manifest)

| Module | Collections written | Operation |
| --- | --- | --- |
| `booking.ts` | `therapists`, `therapistBusySlots`, `appointments`, `clientShares`, `therapistClients` | create booking (batch then merges), status transitions (transaction), profile and availability, backfill |
| `therapist-link.ts` | `therapistLinks`, `therapistClients`, `assignments` | create invite, claim (overwrite), archive (merge), assign |
| `cloud-storage.ts` | `users/{uid}/assessment/current`, `users/{uid}/history`, `users/{uid}/connections`, `users/{uid}/synastry`, `shareCodes` | save map (batch), synastry copy (batch), create and revoke share codes |
| `user-directory.ts`, `auth.service.ts`, `src/services/user-directory.service.ts` | `publicProfiles` | sync on linked sign-in (merge) |
| `push.ts` | `pushTokens` (rules) and local key `INNERVERSE_PUSH_TOKEN_V1` | token registration |
| `overlays.jsx`, `innerverse.jsx`, `cabinet.jsx` | none directly; call the modules above and local keys L2, L3, L4, L5, L6 | UI |
| `admin.ts` | `adminAllowlist`, `adminClients` (rules) | not traced in depth |

### 7.3 Contracts and versions observed

| Contract marker | Where | Version control |
| --- | --- | --- |
| `parts-cartographer.v1` | `cloud-storage.ts:21` (snapshot type), `:73`, `:112`, `:212` (share code map variant), rules 88 | literal string; `fromDocument` branches on it (`:100`) |
| `parts-cartographer.synastry.v1` | `cloud-storage.ts:165`, `:184` | literal string; load filters on it |
| `parts-cartographer.backup.v2` | `backup.ts:66`, `:77` (rejects other backup versions), `:128`, `:155` | version gate present |
| `angular-assessment64` | `cloud-storage.ts:26`, `:107` | literal string |
| Appointments, grants, roster, invite, assignments, busy slots, public profiles | rules key lists (`hasOnly`), e.g. rules 389-390, 445-446, 481-482, 491-492, 246-247, 514, 525 | **no schema version field** |
| Consent text | `therapist-link.ts:201-204` (en and ru) | **no consent version recorded** with any link or roster row (rules 246-247 list `clientUid`, `createdAt`, `summary` only) |

Consequence: any additive field in these documents fails closed until rules and clients deploy together. Old documents carry no marker that would let a new reader tell which consent text applied.

### 7.4 Write implications for B11 (not bound here)

- **Broker-owned (no B11 cell may write):** `firestore.rules` (appointments, roster, public profiles, invite links, share codes), shared locales (`src/parts-cartographer/i18n/strings.ts`, `src/i18n/strings.ts`), application composition (`app.jsx`, `overlays.jsx`), worker routes (`worker.ts`), and integration fixtures (`firestore.rules.emulator.spec.ts`).
- **Cell-owned (after binding):** a new B11 module and its tests under a path to be narrowed by the coordinator. No lease exists.

---

## 8. Scenario matrix

The acceptance criteria require these scenarios: normal and denied grant; stale contract; account change; deleted source; duplicate or cancelled operation; offline or quiet alternative; six compatibility dimensions for `social.presence`. Each row states existing behavior and the gap for B11. Finding IDs (F1 to F20) are in section 10.

### 8.1 Normal and denied grant

| ID | Scenario | Existing behavior (source) | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| G1 | Normal booking grant | `createBooking` writes appointment `pending`, busy slot, `clientShares` (booking), `therapistClients` (booking) (`booking.ts:375-424`). Therapist reads `users/{client}/assessment` and `history` while pending (rules 166, 171, 43-46, 62-69) | Test-covered: emulator 414-419 (therapist reads pending client's records) | Access starts at request, not confirmation (F4). Whole-history read, not selected items. The 80-20 plan requires exact disclosure and separate consent (`docs/80-20-plan.md:375`, `:434`). Consent copy: `strings.ts:351` |
| G2 | Normal invite grant | Client creates `therapistLinks/{code}` with summary (`therapist-link.ts:86-102`). Therapist claims (`:105-126`) and gets a roster row with summary copy | Test-covered: emulator 454-474 (positive path only) | No expiry (F2). No unlink (F2). Summary copy persists (F3) |
| G3 | Normal share-code grant (peer) | Owner confirms (checkbox), creates code (`overlays.jsx:323-345`). Redeemer resolves code (`cloud-storage.ts:249-279`), computes synastry, saves copy (`overlays.jsx:364-412`) | Test-covered: emulator 260-293 (create, get, list denied, revoke) | No expiry. Registry cap (F6). Copies not recalled (F12) |
| G4 | Denied booking grant | Without an active appointment, grant create and roster create are denied (rules 444-453, 475-486) | Test-covered: emulator 325-352 (fake share and roster rows denied) | Read after cancel is denied by rule (43-46) but **not asserted** by any test. Read after decline is asserted (414-425) |
| G5 | Denied invite claim | Claim requires a roster row whose summary matches the link and whose `therapistUid` is the caller (rules 488-496, 509-518) | **Untested** (only the positive claim is in emulator 454-474) | Negative cases (mismatched summary, non-therapist caller, unknown code) need tests |
| G6 | Denied share-code read | Unauthenticated `get` is denied; `list` is denied (rules 226-228) | Test-covered: emulator 266-267 | Anonymous Firebase user is not tested (F18) |
| G7 | Denied, not linked (UI only) | UI blocks share creation and redemption and booking for non-linked users (`overlays.jsx:326-327`, `:372-373`, `:690-700`) | UI check only | Rules do not require a linked or verified account for share codes, invite links, or therapist profile (F18) |

### 8.2 Stale contract

| ID | Scenario | Existing behavior | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| C-1 | Shape drift | Rules check exact key lists (`hasOnly`). A new field fails closed | rules 389-390, 445-446, 481-482, 491-492, 514, 525, 246-247, 82, 88-104, 148-149 | No version field on any shared document. Rolling change needs coordinated rules and client deploy |
| C-2 | Consent drift | `CONSENT_TEXT` can change; existing links and rows carry no consent version | `therapist-link.ts:201-204`; rules 246-247 | Cannot match an existing grant to the consent text it was given under |
| C-3 | Summary drift and fabrication | Share summary sets constant complex activation (`overlays.jsx:1451`), shown by Angular (`therapist-panel.component.html:102-103`) | source | Stored values can look measured when they are constants (F19) |
| C-4 | Duplicate implementations | Directory and auth ports exist twice (F13) | `user-directory.ts`, `src/services/user-directory.service.ts`; `core/ports.ts:6-13`, `src/app/core/ports/auth.port.ts` | Divergence risk for the same contract |
| C-5 | Timezone and time format | Appointment times are naive local strings (`booking.ts:55-56`; rules 348, 398 regex). Display uses device clock (`overlays.jsx:809`) | source | No timezone field and no version (F16) |
| C-6 | Backup format | Backup has a version gate (`backup.ts:77`) | source | Share codes and roster rows are not in backup. Backup has no owner (L9) |

Result: **no contract versions are published** for `social.presence`, and no compatibility suite exists (`aaa-v7` plan lines 69-72, 84).

### 8.3 Account change

| ID | Scenario | Existing behavior | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| A-1 | Identity in the app shell | App identity is read from cache at mount and set after bootstrap or login. No subscription to Firebase auth changes after boot | `app.jsx:62`, `app.jsx:195`; `overlays.jsx:1105`; `auth.service.ts:18` (subscription used only during client load) | Another tab or external sign-out is not reflected until reload (F10) |
| A-2 | Anonymous to existing Google account | Link fails with `credential-already-in-use`; code falls back to sign-in as the existing account. Local data is not merged or cleared | `auth.service.ts:97-108` | Local data follows the device, not the account (F10) |
| A-3 | Sign-out | Removes only `ifs.auth`; disables push | `auth.service.ts:143-148` (`store.remove(KEYS.auth)` at 146) | Local assessments, synastry, and share list remain on device |
| A-4 | Local data scope | Keys are not uid-scoped. Share list is filtered by uid on read only | `local-store.ts:56-72`; `overlays.jsx:189-193`; `overlays.jsx:306`; `backup.ts:10-18` | Next account on the same device sees prior local data |
| A-5 | Server-side data after account change | Rules bind to uid. Email stored on appointments and grants is not reconciled after an email change (only status updates are allowed on appointments, rules 412-434) | rules 388-393, 412-434, 461, 526 | Stale `clientEmail` at therapist side; no update path |
| A-6 | Stale responses | Cabinet ignores responses for a different account (`cabinet.jsx:16-18`, `:76`, `:81`). Billing binds receipts to uid with a version fence (`billing.service.ts:12`, `:58`, `:76`; spec `:40-52`) | source; billing has a test | Reuse the billing pattern. No account-switch test in social flows |

### 8.4 Deleted source

| ID | Scenario | Existing behavior | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| D-1 | Remove current profile | `setProfile(null)` removes only `ifs.profile`. Archive `ifs.history` remains (cap 30) | `app.jsx:163-168`; `local-store.ts:5` | Deletion is partial on device |
| D-2 | Delete cloud history | No client code deletes `users/{uid}/history` or `assessment`. Owner write (and delete) is allowed by rules 163, 167, 172 | grep: no `deleteDoc` on `users/*` in `src/**` | "Delete my data" cannot reach cloud records |
| D-3 | Copies outlive source | Share-code snapshot (`cloud-storage.ts:206-214`); invite summary (`therapist-link.ts:96-100`); roster summary (`therapist-link.ts:114-124`); saved synastry (`cloud-storage.ts:150-171`) | source | No propagation or tombstone policy (F12) |
| D-4 | Delete appointment or grant | Appointments cannot be deleted (rule 435). Client may delete `clientShares` (rule 466). Only the therapist may delete a roster row (rule 532) | rules | Asymmetric. Client cannot remove a therapist's roster copy (F2) |
| D-5 | Delete public profile | Owner may delete (rule 321). No UI path. Directory cache is 5 minutes (`user-directory.ts:12`) | source | Stale lookups for up to five minutes |

### 8.5 Duplicate and cancelled operations

| ID | Scenario | Existing behavior | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| X-1 | Duplicate reservation for one therapist start | Deterministic slot ID plus create-only rule. Second batch fails | rules 340-365; `booking.ts:378-399`. Test-covered: emulator 353-387 and 389-412 (exactly one of two concurrent succeeds) | None for this case. Covers the "two clients, one start" case only |
| X-2 | Repeated confirm after success | Second attempt is denied by the slot rule; UI reports "booking failed" although the request exists | `overlays.jsx:735-752` (error at `:752`) | Retry is not idempotent (F7) |
| X-3 | Failure after appointment write | Grants are written in separate calls after the batch. No compensation | `booking.ts:401-424` | Therapist cannot read; client sees failure (F7) |
| X-4 | Cancel retried after success | Second cancel throws "already closed" (`booking.ts:346-348`). UI shows cancel failure (`cabinet.jsx:81`) | source | Not idempotent (F8) |
| X-5 | Approve and cancel race | Client transaction and therapist update both depend on `status == pending` or the transaction read | rules 412-424; `booking.ts:339-356` | **Not tested** |
| X-6 | Duplicate share-code issue | Each call creates a new code. Retry after a lost acknowledgement can leave a second live code. Earlier codes stay valid until revoked | `cloud-storage.ts:224-244`; `overlays.jsx:323-345` | No idempotency key (F6) |
| X-7 | Invite claimed twice | Same summary overwrites the same row. Booking fields are dropped on overwrite | `therapist-link.ts:114-124`; `booking.ts:358-364` | F17 |
| X-8 | Cancel an in-flight booking | No abort path for the batch commit. Overlay state can be closed but the write continues | `overlays.jsx:665-752` | Not specified |
| X-9 | Pending hold never expires | A pending appointment and its busy slot block the start for every client. No expiry | `booking.ts:141` (pending and approved excluded from free slots); no TTL anywhere | F11 |

### 8.6 Offline and quiet alternative

| ID | Scenario | Existing behavior | Evidence | Gap for B11 |
| --- | --- | --- | --- | --- |
| O-1 | Connectivity loss during booking | Firestore is initialized without persistence (`firebase-init.ts:29-35`). Booking calls do not use `withResilience`, so there is no client-side timeout. Cloud-storage writes do (`resilience.ts:8-9`). The SDK resolves writes only on server acknowledgement (general SDK behavior; not verified here) | source | Offline booking has no defined state (F14) |
| O-2 | Offline identity | Offline guest uses a `local_` uid (`auth.service.ts:51-57`), which cannot satisfy social rules. UI then requires a linked account | `overlays.jsx:690-700` | No offline social path exists, by design or otherwise |
| O-3 | Asynchronous waiting | Therapist sees pending requests only on dashboard open or refresh (`overlays.jsx:923-949`). Client sees status on cabinet open (`cabinet.jsx:57-67`). No subscription | source | No live or push signal for status changes |
| O-4 | Notifications | Push is for the check-in reminder only (`push.ts:102-109`). No server sender for appointment events in the repository | source | No participant notification path |
| O-5 | Quiet alternative | None for booking. No "leave a note", "send later", or "decline with reason". Sensory "still" affects motion and texture only (`sensory-preferences.ts:16-19`). The plan's quiet mode (`docs/80-20-plan.md:530`) is not implemented as a participation mode | source | Quiet and asynchronous participation must be specified in B11.S02 |
| O-6 | Declined | Therapist decline is one-way. Client sees "declined" on refresh. No reason field and no alternative offered | `booking.ts:339-356`; `cabinet.jsx` status display | Declined-path alternative absent |

### 8.7 Six compatibility dimensions for `social.presence`

The six dimensions are the AAA v7.1 §11C.2 swap dimensions (`docs/plans/references/AAA-V7-SPEC.source.md` lines 589-600): interface, state, effects, operations, performance, failure semantics. The `aaa-v7` plan (`docs/plans/aaa-v7-architecture-and-agent-sweeps.md`, line 84) names the same six. No slot output exists for `social.presence`. The nearest existing behavior is the appointment and roster layer.

| Dimension | Nearest existing behavior (source) | Status | What B11.S02 and B11.S03 must specify |
| --- | --- | --- | --- |
| Interface | `booking.ts` exports about 15 functions called directly by React and Angular. No port for social or presence in `core/ports.ts:6-35` (only AUTH, STORAGE, AI, BILLING). No schema version | **Absent** | Versioned port: create, join, leave, cancel, decide, expire. Separate host and participant return shapes |
| State | Owner fields `clientUid`, `therapistUid`. Busy slot is a schedule projection. No session record, participant list, or capacity. Naive local times | **Partial**, two-party only | Owner per field. Capacity model (current lock admits one per start). Timezone policy. Retention of ended sessions |
| Effects | E3 status transitions; E5-like disclosure copies; no `effect_id` (section 5) | **Partial** | Effect class per operation. Dedupe key for join and cancel. Inverse for each reversible write. Disclosure labelled as such |
| Operations | Deployment: rules and client transactions only; no server function. Observability: `console.error` only (`overlays.jsx:955-962`; `cabinet.jsx:79-82`). No control journal (AAA §10.1 requires one for authority changes) | **Absent** | Journal entries for grant, revoke, cancel, decide. Operator path for stuck pending requests. Rollback path (rules revert) |
| Performance | `myAppointments` and `therapistAppointments` are unbounded queries (`booking.ts:269-285`). `therapistBusyIntervals` reads all busy slots for one therapist (`booking.ts:288-304`). Cache 5 minutes (`user-directory.ts:12`). No declared SLO | **Undeclared** | Declared envelope: maximum participants, page size, query cost, latency for join and cancel |
| Failure semantics | Batch atomic for appointment and busy slot (`booking.ts:378-400`). Grants after batch, non-atomic (`:401-424`). Status change in transaction (`:339-356`). `withResilience` only in cloud storage (`resilience.ts:8-9`) | **Inconsistent** | Per-operation timeout, retry, and fallback. Idempotent retry. Partial-failure compensation. User-visible state for each outcome |

---

## 9. State coverage (normal, unknown, declined, denied, interrupted, quiet)

"Handled" means the code has a defined outcome. "Tested" means an existing test asserts it. "Absent" means no defined outcome.

| Flow | Normal | Unknown | Declined | Denied | Interrupted | Quiet or asynchronous |
| --- | --- | --- | --- | --- | --- | --- |
| Booking request | Handled (`booking.ts:375-424`, `overlays.jsx:735-752`) | Handled: not found, not therapist, self (`overlays.jsx:700-716`) | Therapist decline releases slot and grant (`booking.ts:339-356`). **Tested** (414-425) | Duplicate slot denied. **Tested** (353-412). Not linked: UI only. No consent: button disabled (`overlays.jsx:848`) | **Absent**: partial grant failure reported as failure (F7). Reload loses overlay state (L10) | **Absent**: waits with no expiry, no notification (X-9, O-3, O-4) |
| Therapist decision | Handled: approve (`overlays.jsx:951-960`) | Not traced | Decline handled, **tested** (414-425) | Approve after cancel: denied by rule (412-416). **Not tested** | Handled as message: `therapistSaveFailed` (`overlays.jsx:957-962`) | No notification. Dashboard refresh only (O-3) |
| Host cancel of approved session | **Absent** (F5) | n/a | n/a | Denied by rule (412-424) | n/a | n/a |
| Client cancel | Handled, **tested** (427-452) | Closed appointment throws "already closed" (`booking.ts:346-348`) and shows failure (F8) | n/a | Non-party denied (rules 412-434) | Retry is not idempotent (F8) | No reason capture; no reschedule path |
| Share-code issue | Handled (`overlays.jsx:323-345`) | No profile, cannot share (`overlays.jsx:326`) | Confirmation not checked: button does nothing (`overlays.jsx:327`) | Not linked: login prompt (UI only) (F18) | Server created, local record failed: invisible code (F6) | none |
| Share-code revoke | Handled (`overlays.jsx:347-355`); **tested** (288-291) | Code not in local list: cannot revoke from UI (F6) | n/a | Non-owner delete denied (rule 236) | Partial: server deleted, local list not updated is handled by order, but failure shows generic error | none |
| Share-code redeem | Handled: snapshot to synastry (`overlays.jsx:364-412`) | Malformed or missing: null, shown as unavailable (`cloud-storage.ts:249-256`; `overlays.jsx:372-373`) | n/a | Unauthenticated denied (test 267); not linked UI only | Save failure: `synLoadFailed` while result shows (`overlays.jsx:401-404`) | n/a |
| Copy after revoke | Copy stays (F12) | n/a | n/a | n/a | n/a | n/a |
| Invite link create and claim | Handled (`overlays.jsx:1506-1516`; `therapist-link.ts:86-126`) | Unknown code: claim returns null (`therapist-link.ts:111`); UI handling not traced | No decline step: **absent** | Non-therapist claim denied by rule (488-490) | Create failure shows `therapistShareFailed` (`overlays.jsx:1515`) | n/a |
| Unlink (client) | **Absent** (F2) | n/a | n/a | n/a | n/a | n/a |
| Archive (therapist) | Handled as display filter (`innerverse.jsx:508-514`) | n/a | n/a | Does not revoke access (F2) | n/a | Archived section collapsed (`innerverse.jsx:727-731`) |
| Account switch | Partial (A-1 to A-6) | n/a | n/a | Server follows uid (correct) | Stale identity until reload (F10) | n/a |
| Offline | Local-first only (O-1, O-2) | Offline guest uid cannot write social data | n/a | Social writes denied | Booking hangs (F14) | Local presentation settings only (L7) |

---

## 10. Candidate findings for B11.S02

These are candidate defects or gaps from static reading. None is fixed here. Each needs independent verification. The "Check" column names the check that would confirm or refute it.

| ID | Finding | Evidence | Status | Check | Suggested priority for B11.S02 |
| --- | --- | --- | --- | --- | --- |
| F1 | `publicProfiles` is readable by any signed-in user. The rule does not restrict `list`, so the directory can be enumerated. Email is published automatically for linked accounts. The rule comment says the intent is lookup by email | rules 308-311; `auth.service.ts:41-49`; `user-directory.ts:34-46` | Rules-derived (list); source-traced (auto-publish) | Emulator: `getDocs` on `publicProfiles` by another signed-in user | High. Conflicts with per-purpose consent for discovery |
| F2 | Invite summary copies have no expiry and no client unlink. `CONSENT_TEXT` promises unlink. No code deletes `therapistLinks` or roster rows. Client cannot remove an invite roster row | `therapist-link.ts:202`; rules 241-252, 472-533; no `deleteDoc` on these in `src/**` | Source-traced | Code search and emulator delete as client | High |
| F3 | A booking merged into an invite roster row keeps the invite summary. Cancelling the booking does not remove it | `booking.ts:358-364` (comment: claimed client "keeps their summary"); `booking.ts:413-424` (merge); rules 521-530 allow the booking branch to update with `summary` and `linkCode` present | Rules-derived | Emulator: invite claim, then booking, then cancel, then read roster | High if confirmed |
| F4 | Booking grants whole-history read from request time, not selected items | rules 166, 171, 43-46, 62-69; emulator 414-419; consent `strings.ts:351`; plan `docs/80-20-plan.md:375`, `:434` | Source-traced | Product decision; emulator already shows read while pending | High. Consent model conflict |
| F5 | No host cancel of an approved session and no reschedule | rules 412-424; `overlays.jsx:1067-1077`; `therapist-panel.component.html:52-58` | Source-traced | Emulator: therapist cancel of approved, expect denial | Medium-high |
| F6 | Share codes never expire. The issuance registry is local, per device, and capped at 20. Codes beyond the cap cannot be revoked from the UI, though the server document stays valid | `overlays.jsx:189-193`, `:333-336` (`slice(-20)`), `:347-355`; `cloud-storage.ts:206-214`, `:282-286`; rules 226-237 | Source-traced | Unit: 21 issues, revoke oldest from UI | Medium-high. Privacy |
| F7 | Booking partial failure: appointment exists, grants do not. UI reports failure. Retry hits the slot rule. No reconciliation | `booking.ts:400-424`; `overlays.jsx:735-752`; rules 340-365 | Source-traced | Emulator with injected grant failure | Medium |
| F8 | Cancel is not idempotent. A retry after success throws, and UI shows failure | `booking.ts:346-348`; `cabinet.jsx:69-86`, `:81` | Source-traced | Unit: cancel twice | Medium |
| F9 | Role authority is client-asserted. Attestation is `localStorage`. Any owner can write `therapists/{uid}`. Copy says license is verified at first claim; no code does this | `overlays.jsx:886`, `:1005`; `innerverse.jsx:424`, `:636`; rules 326-333; `strings.ts:613`; `therapist-link.ts:105-126` | Source-traced | Review of copy against code; emulator: non-licensed owner writes profile | High for host-role trust |
| F10 | Account change: app shell does not follow Firebase auth changes; local data and synastry cache are not uid-scoped; sign-out keeps local data; backup has no owner | `app.jsx:62`, `:195`; `auth.service.ts:18`, `:77-79`, `:143-148`; `local-store.ts:56-72`; `overlays.jsx:306`; `backup.ts:10-18` | Source-traced | Manual two-account flow on one device (pending) | Medium-high |
| F11 | Pending requests never expire and hold the slot for everyone | `booking.ts:141`; no TTL; rules 340-379 | Source-traced | Emulator or unit with stale pending | Medium |
| F12 | Copies are not recalled. Share snapshots, synastry results, and invite summaries stay after revoke or source deletion. The share-code copy does not state this limit | `cloud-storage.ts:206-214`, `:150-171`; `therapist-link.ts:96-100`; `overlays.jsx:401`; `strings.ts:193` | Source-traced | Product copy review | Medium |
| F13 | Duplicate implementations: user directory (core and Angular service with its own cache) and two auth ports | `user-directory.ts:12`, `:34-46`; `src/services/user-directory.service.ts:47-59`, `:102`; `core/ports.ts:6-13`; `src/app/core/ports/auth.port.ts` | Source-traced | Diff of contract behavior | Low-medium |
| F14 | Failure semantics inconsistent: booking and roster writes have no timeout or retry wrapper; cloud storage has both. Firestore has no persistence configured | `booking.ts` (no resilience import); `therapist-link.ts:13-18`; `cloud-storage.ts` (`withResilience`); `resilience.ts:8-9`; `firebase-init.ts:29-35` | Source-traced | Offline test in browser (pending) | Medium |
| F15 | Busy-slot documents are readable by every signed-in user and include `appointmentId`. The code comment says "schedule data only" | rules 340-341, 342-364; `booking.ts:391-399` | Source-traced | Emulator read by non-party | Low |
| F16 | Appointment times are naive local strings with no timezone field. The plan requires timezone-correct confirmation | `booking.ts:55-56`; rules 348, 398; `overlays.jsx:809`; `docs/80-20-plan.md:62` | Source-traced | Product decision | Medium for cross-timezone sessions |
| F17 | Invite claim overwrites the roster document (no merge). It drops `appointmentId`, `clientEmail`, and `archived` | `therapist-link.ts:114-124` vs `booking.ts:413-424` | Rules-derived (acceptance) | Emulator: booking then claim, read row | Low-medium |
| F18 | Rules accept any signed-in Firebase user, including anonymous, for share codes, invite links, public profile reads, and therapist profile writes. Linked-account gating is UI only | rules 15-17, 226-231, 241-249, 311, 326-328; emulator uses unauthenticated or email-bearing contexts only (`firestore.rules.emulator.spec.ts:62-72`) | Rules-derived | Emulator with anonymous token | Medium |
| F19 | Therapist summary sets constant `activation: 1` and `tier: 'active'` for every active complex. Angular therapist panel displays it | `overlays.jsx:1451`; `therapist-panel.component.html:102-103` | Source-traced | Unit on `therapistShareSummary` | Medium. Data provenance |
| F20 | Summary energy scale: `toScore` clamps at 1 and assumes 0..1. `normalizedEnergy` documents native 0..100 values. Which path feeds the summary is unresolved | `overlays.jsx:1438`; `universe-controls.ts:8-12` | Source-traced (ambiguity) | Unit with native 0..100 profile | Low until resolved |

**Test gaps** (for the verifier, not run here): publicProfiles list denial; anonymous token behavior (F18); read revocation after cancel (G4); invite negative cases (G5); therapist approve after cancel (X-5); booking merge into invite row (F3); partial failure messaging (F7); share-code cap (F6); cancel idempotency (F8); account switch in social flows (A-1 to A-5).

---

## 11. Source and data provenance

### 11.1 Sources (blob IDs at HEAD `09194df5f483`)

| Source | Path | Blob (12 chars) | Used for |
| --- | --- | --- | --- |
| Read set | `docs/80-20-plan.md` | `0fbd09fe918b` | Plan requirements, consent and sharing stages, code entry points (§16.5) |
| Read set | `docs/plans/first-principles-elevation-beads.md` | `e724cd055bb8` | Twelve-step pattern; step 01 output definition |
| Read set | `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `ae04de5adf54` | Slot tasks, six compatibility dimensions (line 84), workcell contract |
| Read set | `docs/plans/social-creative-practice-beads-plan.json` | `d7acf515c30d` | B11 platform entry; feature consumers; `beads_ids` (B11 to `ArchetypeAI-lub7`, B11.S01 to `ArchetypeAI-92wk`) |
| Read set | `src/parts-cartographer/core/ports.ts` | `68e6214a0ec9` | Existing port interfaces (AUTH, STORAGE, AI, BILLING) |
| Reuse | `docs/plans/creative-commons-beads-plan.md` | `6e64b4760090` | C01 and C08 definitions (lines 23, 30) |
| Reuse | `docs/plans/creative-commons-beads-plan.json` | `cbe2605ef4f3` | C01 and C08 graph nodes and reuse Bead IDs |
| Reference | `docs/plans/references/AAA-V7-SPEC.source.md` | `2eb18f3f7725` | §9 effects, §10 state and journal, §11C.2 swap dimensions (lines 589-600) |
| Passive export | `.beads/issues.jsonl` | `1d9720ac266c` | Checked for IDs only; not a status authority |
| Rules | `firestore.rules` | `36ffb114d561` | All ownership and grant checks |
| Rules tests | `firestore.rules.emulator.spec.ts`, `firestore.rules.spec.ts` | `7f597a15b4f0`, `62fac0d9a079` | Test coverage |
| Server | `worker.ts`, `worker-security.ts` | `fec6be8dc79d`, `86e0cd1bff29` | Routes and token check |
| Core | `booking.ts`, `therapist-link.ts`, `cloud-storage.ts`, `user-directory.ts`, `auth.service.ts`, `local-store.ts`, `backup.ts`, `billing.service.ts`, `push.ts`, `sensory-preferences.ts` | `0e2a99f09ed4` (booking), `dd67642b240f` (therapist-link), `4d9bfe11f004` (cloud-storage), `6748f62c927b` (user-directory), `5591b67cc092` (auth.service), `e28e50d5ddd4` (local-store), `7917f0a360c6` (backup), `9144863698b0` (billing.service), `2a812b523553` (push), `0d56aef36bc1` (sensory-preferences) | Core modules |
| UI | `overlays.jsx`, `cabinet.jsx`, `innerverse.jsx`, `app.jsx` | `19a5784c393d`, `c7c91dbdc57e`, `3a7e8bcc746e`, `71c3c77a778c` | React surface |
| UI (Angular) | `booking-panel.component.ts`, `therapist-panel.component.ts`, `.html`, `user-directory.service.ts` | `fb9ddb7714c1`, `80ba8e12134d`, `b0ef4080a0da`, `3bdd1116a764` | Angular surface |
| Infrastructure | `firebase-init.ts`, `resilience.ts` | `3b397f3fe063`, `bb7f4b4e5ffb` | Persistence and retry |

### 11.2 Pinned-source check

`docs/plans/references/AAA-V7-SPEC.source.md` has SHA-256 `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc`, which equals the pinned value in `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` line 5 and the social plan `baseline.architecture_source.sha256`.

### 11.3 Data provenance

- All evidence is repository text at the base. No runtime, production, emulator, or participant data was read.
- No credentials, tokens, personal records, screenshots, or participant content were copied into this file. `firestore.rules` contains a hard-coded bootstrap admin email (line 32). It is not repeated here.
- Root-level binary and text files (screenshots and handbooks) are outside the read set and were not opened.
- Statements about Firestore SDK behavior (write acknowledgement, list semantics, merge semantics) are general knowledge and are marked as such where used.

---

## 12. Checks

| Check | Method | Result |
| --- | --- | --- |
| Read-set files exist (5 of 5) | `test -e` on each path | Pass |
| Pinned AAA snapshot hash | `sha256sum` against the pinned value | Pass (section 11.2) |
| Citation anchors | Script in the scratchpad (outside the write set) checks 237 `path:line` anchors with the expected token against the worktree at HEAD. Range citations (for example `overlays.jsx:665-752`) are not individually checked | Pass: 237 of 237 |
| Write set | `git status` shows only this new file under `architecture/extension/development/b11/s01/`; no app source, package, lockfile, CI, rules, or locale file changed | Pass |
| Whitespace | `git diff --check --cached` on the new file | Pass |
| Not run: `npm test` | No `node_modules` in the worktree | Not run |
| Not run: `npm run test:rules` | Requires the Firebase emulator (`FIRESTORE_EMULATOR_HOST`) | Not run |
| Not run: `test:browser`, builds, lint | Out of scope for an M0 documentation step | Not run |
| Not run: any `bd` command | Task rule | Not run. No active git hooks exist in the shared hooks directory (only `.sample` files), so the commit does not call `bd` |

---

## 13. Limitations

- Static trace at HEAD `09194df5f483`. Nothing was executed.
- Rules-derived findings (F1, F3, F17, F18, and the "Not tested" rows) are inferences from rule text until an emulator run confirms them.
- Live Bead status for the 12 reuse IDs under C01 and C08, for B03, B04, `ArchetypeAI-lub7`, `ArchetypeAI-92wk`, and `ArchetypeAI-ludh` is unknown. `bd` was not run and the passive export lacks them.
- `base_generation` is `null`. No contract version, immutable base, workcell, or lease exists.
- C01 and C08 are interpreted from the creative-commons plan (section 3). The social plan does not define them.
- Angular call sites are traced at module and function level, not per component. The synastry panels, `admin.ts`, and the internals of `worker-security.ts` were not traced in depth.
- Consent wording, clinical or spiritual claims, and efficacy were not evaluated. No practitioner or community review exists.
- Each finding is a candidate. Some behavior may be intended. The priorities in section 10 are suggestions for B11.S02, not decisions.
- No participant, device, live-account, community, or practitioner observations exist for this step. All such rows are pending.

---

## 14. Next handoff: ArchetypeAI-ludh (B11.S02, specify authoritative state, grants, and effects)

**Consume:** sections 4 (state), 5 (effects), 8 (scenario matrix), 9 (state coverage), and 10 (candidate findings) of this file.

**Decisions B11.S02 must make** (the current baseline does not decide them):

1. **Session unit and capacity.** Reuse the two-party appointment model, or define a finite-group session record. The current busy-slot lock admits one reservation per therapist and start (`booking.ts:378-399`).
2. **Authority for host and participant roles.** A server-verified role record replaces the self-asserted therapist profile and local attestation (F9).
3. **Grant start and extent.** Confirmation or request. Whole history or selected fields (F4).
4. **Expiry and timeouts** for pending requests, sessions, invite links, and share codes. None exists today (F2, F6, F11).
5. **Cancellation and reschedule** for host and participant. Host cancel of approved sessions. Idempotent cancel (F5, F8).
6. **Quiet and asynchronous participation** states and any notification. None exists today (O-3, O-4, O-5).
7. **Account change and deletion propagation** (section 8.3 and 8.4; F10, F12).
8. **Effect class and dedupe key** for each operation in section 5. Ratify the E5-like classification for disclosure.
9. **Declarations for the six dimensions** in section 8.7.

**Prerequisites before dispatch (not satisfied):**

- Live status of the 12 reuse IDs for C01 and C08, and of B03 and B04, resolved by the coordinator with `bd`.
- An immutable base generation and at least one published contract version for `social.presence`. None exists.
- A narrowed write set for B11.S02. Rules changes are broker-owned.
- Workcell binding and a live lease.

**Verification to request (for an independent verifier; not run here):**

- Emulator: `publicProfiles` list by another user (F1); anonymous-token access to share codes, invite links, and public profiles (F18); read revocation after cancel (G4); invite negative cases (G5); therapist approve after cancel (X-5); booking merge into an invite row (F3).
- Unit: cancel idempotency (F8); booking partial-failure messaging (F7); share-code cap (F6); `therapistShareSummary` activation values (F19).
- Participant, device, practitioner, and live-account evidence: **pending**. None has been collected.

**Bead update text for the coordinator** (this step cannot write the Bead):

> B11.S01 (ArchetypeAI-92wk) candidate, awaiting independent review. Artifact: `architecture/extension/development/b11/s01/b11-s01-inventory.md` at commit <SHA from reply>. Base: HEAD 09194df5f483, `base_generation` null. Evidence: static source trace only; no tests executed in this worktree. Checks: read set 5 of 5; AAA snapshot hash matches; citation anchors 237 of 237 (section 12); write set limited to this file; whitespace clean. Not run: npm test, test:rules, browser, builds, any bd command. Limitations: section 13. Reuse: C01 and C08 are design-stage; B03 and B04 absent as models. Findings F1 to F20 are candidates needing verification. Acceptance: not claimed. Participant, device, live-account, community, and practitioner evidence: pending. Rollback or undo: documentation only; delete the file to revert. Next handoff: ArchetypeAI-ludh, consuming sections 4, 5, 8, 9, 10 and the decisions in section 14.
