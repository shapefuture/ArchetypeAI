# B03.S01 candidate inventory: membership, moderation and recipient authority

**Status: candidate awaiting independent review. This document is not an acceptance claim.**

- Bead: ArchetypeAI-quc8 (planning key B03.S01, planning task ArchetypeAI-cyqe). Parent epic: ArchetypeAI-tica (B03). Next consumer: ArchetypeAI-i4aa (B03.S02).
- Evidence status: uncollected. Participant, device, live-service, community and practitioner observations: PENDING. None were obtained and none are claimed here.
- Independent review: PENDING.
- Method: static reading of the repository at the commit in section 1, plus the plan documents named in the task. No test, emulator, build or device run was executed (see section 11).

## 1. Manifest

| Item | Value |
| --- | --- |
| Role | slot-owner (task metadata) |
| Mutation / risk | M0 / R2 (task metadata) |
| Slot | community.membership (named on platform B03 in the social plan; this task's owned_slots is []) |
| Reuse packages | C01 -> ArchetypeAI-xs263; C08 -> ArchetypeAI-frd2b (creative-commons plan; see section 3) |
| Source identity | branch worktree-agent-af15ce94acd86e9e9, HEAD 09194df, worktree clean at inspection |
| Immutable base generation | null (unresolved; task metadata base_generation). Not an immutable base. |
| Published contract versions | none (task metadata contract_versions []) |
| Leases | none held. Proposed write paths are not leases. |
| Write set used | architecture/extension/development/b03/s01/** (this file only) |
| Read set | the five task read_set files; all present (section 10) |
| Not touched | app source, package and lockfiles, CI, Firestore rules, shared locales, any other path. No bd command, no push, no task status change. |

## 2. Summary

Nothing in the repository implements membership, block, report, appeal or moderator capability as a server-enforced authority. There is no community port, no community Worker route, and no Firestore collection for membership, blocks, reports or appeals. The existing server-enforced relationships are booking-based (appointments, clientShares, therapistClients, therapistBusySlots), invite-based (therapistLinks), admin-based (adminAllowlist, adminClients) and bearer share codes (shareCodes). Firestore rules gate all of them, and the emulator suite covers part of that gating.

The current behaviour conflicts with the plan's consent, revocation and recipient-authority requirements in several places. The most material conflicts are F1 (admin links need no client consent), F2 (email directory readable by every signed-in session), F3 (identity claims not verified before lookup), F4 (client cannot revoke roster copies, although the consent text promises unlinking), and F6 (booking is not atomic and has no repair path). Each is listed in section 7 with its evidence and the decision S02 must take.

## 3. Reuse reconciliation: C01 and C08

| Package | Bead | Definition in the creative-commons plan | Reuse Beads it names | Artifacts in this repository | Decision for B03.S01 |
| --- | --- | --- | --- | --- | --- |
| C01 Connected public threads | ArchetypeAI-xs263 | "Nine format schemas -> audience-safe versioned transitions -> intent/type browse and composer -> outcome/history/revocation verification" (creative-commons-beads-plan.md:23) | F01 jten, F04 2lnj, F15 tmuuj, B03 tica, B04 vlfx, B12 nje6 | None. The write_set docs/plans/creative-commons/c01/** has no directory. | Reuse as a delta over B03. C01 does not own community.membership and adds no grant or revoke mechanism. |
| C08 Cross-circle expeditions | ArchetypeAI-frd2b | "Bounded bridging format -> flexible roles/check-in/return -> short async creative turns -> respectful exchange and credit review" (creative-commons-beads-plan.md:30) | F07 pxk9, F23 6nzhj, F24 nsrho, F42 ktaon, F43 xwzgu, F46 ot4ky | None. docs/plans/creative-commons/c08/** does not exist. | Same treatment. Cross-circle access needs S02 grant semantics; C08 cannot define them alone. |

Checks on this reconciliation:

- The reuse Bead mapping was verified by reverse lookup of the social plan beads_ids. Each of the twelve reuse Beads maps to a social planning key: F01, F04, F15, B03, B04, B12, F07, F23, F24, F42, F43, F46.
- Mutual reference at planning level: C01's reuse_beads include ArchetypeAI-tica (B03), and B03.S01 names C01 as a reuse package. Treat B03 as the base contract owner and C01/C08 as consumers.
- Adjacent packages that name B03 but are not in B03.S01's reuse list: C02 and C17 (both list tica in reuse_beads); C16 "Care, moderation and optional repair" (creative-commons-beads-plan.md:38) covers accountable moderator scope, containment, report and appeal, and reuses tica; C05 and C15 (md:27, 37) require unlink, block and export checks but reuse F-series and B01/B07 packages. Without S02 reconciling them, moderation and unlink semantics would be split across at least three owners.
- creative-commons reuse_policy: "Existing task evidence may satisfy overlap; reconcile before writing. Do not close existing packages from this plan." Applied here: nothing is closed, certified or reused as evidence.

Reuse verdicts for the capabilities this slot needs:

| Need | Existing mechanism (evidence) | Verdict |
| --- | --- | --- |
| Verified caller identity on Worker routes | worker-security.ts:65-78 authenticateFirebaseRequest (RS256, audience, issuer, time claims) | Reuse. No community route exists yet. |
| Status-gated server grant | firestore.rules:37-70 hasActiveAppointment, hasValidBookingShare; rules 133-137 hasTherapistReadGrant | Reuse the pattern. The data is booking-specific. |
| One-holder-per-resource lock | therapistBusySlots, rules 340-364; booking.ts:378-399 | Reuse. Emulator-tested (firestore.rules.emulator.spec.ts:353-413, not run). |
| Owner revocation of a bearer grant | shareCodes delete, rules 236; cloud-storage.ts:282-287 | Reuse only for bearer codes. Codes are not recipient-bound. |
| Operator role | isAdmin, rules 29-35; UI hint admin.ts:42-48 | Partial. One all-or-nothing role; no capabilities, no audit trail. |
| Entitlement | billing.service.ts; worker.ts:241-392 | Not a membership authority. Receipt is client-held (F10). |
| Directory lookup | src/parts-cartographer/core/user-directory.ts | Reuse only after the consent and verification gates in F2 and F3. |
| Block, report, appeal, moderator capability | none in code, rules or Worker | Build in S02 and later. No reusable implementation. |

## 4. State inventory

Authority column: who decides. "Server" means enforced by Firestore rules or the Worker. "Client" means client-only. "External" means a third party.

| # | Store (path or key) | Written by (evidence) | Read by | Authority | Lifecycle and deletion | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Firebase Auth user (uid, email, emailVerified, provider) | Firebase SDK via auth.service.ts:93-139 | All clients | External | Sign-out clears only the local mirror (auth.service.ts:141-147) | auth.service.ts:34-39 |
| S2 | Local identity mirror ifs.auth | persistUser auth.service.ts:41-49; offlineGuest :51-56 | UI | Client | Removed on sign-out only (:146) | local-store.ts:61 |
| S3 | publicProfiles/{uid} {email, emailLower, displayName, updatedAt} | Linked sign-in auth.service.ts:43-47 and user-directory.ts:34-46; therapist availability save overlays.jsx:979; Angular src/services/user-directory.service.ts:102 | Any signed-in session, anonymous included (rules 311) | Server (content must equal token email, rules 316-318) | No client delete path anywhere. Owner delete allowed by rule (rules 321). | rules 310-322 |
| S4 | therapists/{uid} {email, availability} | Owner only (rules 328-333) | Any signed-in session (rules 327) | Self-asserted role. Owner may create without any verification; email is not compared to the token. | Cannot be deleted (rules 334). Deactivation by empty availability (booking.ts:208-210). | rules 326-335 |
| S5 | therapistBusySlots/{therapistUid}_{start} {therapistUid, appointmentId, start, end} | Participants at booking (booking.ts:378-399) and backfill (booking.ts:311-337) | Any signed-in session (rules 341) | Server lock | Deleted in the same transaction as decline or cancel (booking.ts:350-354; rules 366-379) | rules 340-380 |
| S6 | appointments/{id} {clientUid, clientEmail, therapistUid, therapistEmail, start, end, status, createdAt, accessGranted} | Client create (booking.ts:375-390); status transactions (booking.ts:339-356) | Participants only (rules 386-387) | Server, status machine | No delete (rules 435). Status is the only revocation handle. | rules 385-436 |
| S7 | clientShares/{therapistUid}_{clientUid} {clientUid, clientEmail, therapistUid, grantedAt, source, appointmentId} | Client at booking (booking.ts:401-412) | Participants (rules 442-443) | Server. Grant is live only while the appointment is pending or approved (rules 62-70, 453, 465). | Client delete (rules 466) | rules 441-467 |
| S8 | therapistClients/{therapistUid}_{clientUid} | Booking (booking.ts:413-424); invite claim (therapist-link.ts:114-124) | Therapist and client (rules 473-474) | Server. Booking rows need a live booking share (rules 485); invite rows need a live invite link (rules 495). | Delete by therapist only (rules 532). No client path. | rules 472-533 |
| S9 | therapistLinks/{code} {clientUid, createdAt, summary} | Client (therapist-link.ts:86-102; overlays.jsx:1511) | Any signed-in session holding the code (rules 242) | Bearer code. Summary immutable (rules 250). | Client delete (rules 251). No expiry field permitted (rules 246-247). | rules 241-252 |
| S10 | assignments/{id} | Therapist, gated by a trusted roster link (rules 540-554) | Client and therapist (rules 538-539) | Server | No update or delete (rules 555). Client-side RED gate only (therapist-link.ts:179-184). | therapist-link.ts:173-191 |
| S11 | adminAllowlist/{email} | isAdmin (rules 257-271) | Self get; admins list (rules 258-260) | Server. Bootstrap admin address hard-coded (rules 32; admin.ts:18). | Delete by admin (admin.ts:73-77) | rules 257-271 |
| S12 | adminClients/{adminUid}_{clientUid} {clientEmail, notes, addedAt, addedByUid} | Admin create with no client consent (rules 280-291; admin.ts:100-116; admin.jsx:161) | The admin only (rules 278-279) | Admin-asserted | Admin delete (rules 303-305; admin.ts:124-127). Rows survive allowlist removal (admin.ts:73-77 does not touch them). | rules 275-306 |
| S13 | users/{uid}/assessment/current and users/{uid}/history/* | Owner (rules 165-172; cloud-storage.ts:82-95) | Owner; admin with adminClients row (rules 139-144, 166, 171); therapist with live booking share (rules 133-137) | Owner | Owner write and delete allowed by rule (rules 167, 172). No UI delete path found. Local history is capped at 30 (local-store.ts:5). | rules 162-173 |
| S14 | users/{uid}/connections, users/{uid}/synastry | Owner (rules 175-181; cloud-storage.ts:150-171) | Owner | Owner | No delete path found | rules 175-181 |
| S15 | shareCodes/{code} {uid, createdAt, schema, mapSnapshot or assessment} | Owner create (cloud-storage.ts:224-247) | Any signed-in holder of the code (rules 226-227); list denied (rules 228) | Bearer code. No expiry field permitted (rules 80-82). | Owner delete (rules 236; cloud-storage.ts:282-287) | cloud-storage.ts:197-287 |
| S16 | Local issued-code list ifs.share.codes | overlays.jsx:332-336 and :353 | overlays.jsx:191-194 (filtered by uid at mount) | Client | Capped at the last 20 entries across all accounts (overlays.jsx:332-336) | local-store.ts:67 |
| S17 | Local billing receipt ifs.billing.verified.v2 {uid, sessionId, verifiedAt} | billing.service.ts:23-27, :78 | isPremium billing.service.ts:58 | Client cache of a server check, valid 24 h | Cleared on a non-premium result (billing.service.ts:25) | billing.service.ts:10-13; local-store.ts:62 |
| S18 | Legacy flag ifs.billing = premium | None found | isPremiumCached (ports.ts:42-44), which has no caller in src | Client, obsolete | Not applicable | ports.ts:42-44 |
| S19 | Local assessment, profile, history, synastry keys (ifs.state, ifs.profile, ifs.history, ifs.parts, ifs.syn.connections) | Local store | Local UI | Client | Not account-scoped. Survive sign-out (auth.service.ts:146 removes only ifs.auth). | local-store.ts:56-72 |
| S20 | pushTokens/{token} | Owner (rules 198-216; push.ts:65, :96) | Not readable (rules 199) | Owner | Owner delete (rules 215) | rules 197-216 |
| S21 | Stripe checkout session | Worker with client_reference_id = uid (worker.ts:284, 296-304) | Worker verify (worker.ts:318-392) | External (Stripe) | No server-side entitlement record and no webhook in repo | worker.ts:241-392 |
| S22 | telemetryResponses/{id} | Any signed-in create (rules 186-195) | Not readable (rules 187) | Server | No retention rule or job found | rules 186-195 |

## 5. Effect inventory

Classes follow the AAA source snapshot effect table (docs/plans/references/AAA-V7-SPEC.source.md:330-335: E0 pure, E1 read, E2 monotone write, E3 reversible write, E4 idempotent external, E5 irreversible external). The classes below are proposed for S02 to confirm.

| Operation | Caller (evidence) | Proposed class | Writes | Idempotency or dedupe identity | Failure and compensation |
| --- | --- | --- | --- | --- | --- |
| Create booking | overlays.jsx:735-752 (React); booking-panel component (Angular re-export, booking.ts:3) | E2, multi-document | Appointment and busy slot in one batch (booking.ts:379-400); then clientShares (:401-412) and therapistClients (:413-424) as separate writes | Appointment ID is random per call (booking.ts:375-376). Busy-slot document is the only uniqueness guard. | Not atomic. A failure after the batch leaves an appointment without grant (F6). The UI shows bookingFailed (overlays.jsx:752) although the appointment may exist. No repair path. |
| Set appointment status (approve, decline, cancel) | Therapist and client (innerverse.jsx:529; cabinet.jsx:74; cabinet.component.ts:164) | E2 with transition guard | Appointment status; busy-slot delete (booking.ts:339-356) | None. Repeat of a success is rejected by rules (F7). | One-way. No compensation. |
| Backfill busy slots | Therapist panel load (innerverse.jsx:472; overlays.jsx:927) | E2 | therapistBusySlots create | Deterministic ID (booking.ts:306-308) | Error shown as therapistSaveFailed (innerverse.jsx:473-475) |
| Create invite link | Client (overlays.jsx:1506-1520; therapist-link.ts:86-102) | E2 | therapistLinks | Random code with collision check (therapist-link.ts:90-95) | None. Bearer code never expires (F8). |
| Claim invite link | Therapist (therapist-link.ts:105-126; innerverse.jsx:492; therapist-panel.component.ts:202) | E2 with overwrite | therapistClients via setDoc without merge (therapist-link.ts:114-124) | None. Re-claim overwrites archived and appointmentId fields. | None |
| Archive or restore client | Therapist (therapist-link.ts:162-171; innerverse.jsx:513; therapist-panel.component.ts:147) | E2 | archived flag | Merge write | None |
| Assign exercise | Therapist (therapist-link.ts:173-191) | E2 | assignments | Identifier includes Date.now (therapist-link.ts:186) | RED gate client-side only (therapist-link.ts:179-184); roster gate in rules (rules 543) |
| Link client as admin | Admin (admin.jsx:136-161; admin.ts:100-116) | E2 | adminClients | Deterministic ID (admin.ts:108) | None. No consent step (F1). |
| Unlink client as admin | Admin (admin.ts:124-127) | E2 | delete | Idempotent intent | None |
| Add or remove admin email | Admin (admin.ts:62-77; admin-access.service.ts:53 Angular) | E2 | adminAllowlist | Deterministic ID | Removal leaves adminClients rows, which restore reads on re-add (F12) |
| Create share code | Owner (cloud-storage.ts:206-247; overlays.jsx:323-345) | E2 | shareCodes/{code} | Random 12-character code (cloud-storage.ts:197-204). Collision loop. | Retry re-runs the same transaction and can orphan a live code (F9) |
| Redeem share code | Recipient (cloud-storage.ts:249-280) | E1 | None | None | Legacy 64-answer payload branch (cloud-storage.ts:262-277) |
| Revoke share code | Owner (cloud-storage.ts:282-287; overlays.jsx:347-358) | E2 delete | shareCodes delete | Repeat delete expected to be rejected by rules (F8, to verify) | Local list updated only on success (overlays.jsx:353-355) |
| Public profile sync | Every linked sign-in (auth.service.ts:43-47); availability save (overlays.jsx:976-979); Angular (services/user-directory.service.ts:102) | E2 merge | publicProfiles | Merge (user-directory.ts:38-43) | Best-effort, failure logged (auth.service.ts:44-46) |
| Directory lookups | Booking, admin, cabinet (user-directory.ts:48-96; overlays.jsx:701; booking-panel.component.ts:116; admin.jsx:145-150) | E1 | None | Cache of 5 minutes (user-directory.ts:12-27) | Stale for up to 5 minutes |
| Stripe checkout | Signed-in user (worker.ts:241-315) | E4 candidate. External payment API. | Stripe session | client_reference_id only (worker.ts:284). No Idempotency-Key header (none in worker.ts). | Returns 502 (worker.ts:306-311) |
| Stripe verify | Signed-in user (worker.ts:318-392) | E1 | None | None | Client caches the receipt for 24 h (billing.service.ts:12-13, :58, :74, :85) |
| Push token write or delete | User (push.ts:65, :96) | E2 | pushTokens | Per token | None |
| Local store write | UI (local-store.ts:15-54) | E2 or E3, local | localStorage | None | Quota errors swallowed (local-store.ts:23) |
| Email or notification send | None found in the repository. sendEmailVerification is never called. | Not applicable | Not applicable | Not applicable | B05 owns delivery. Not in this slot. |

## 6. Component inventory

| Component | Role | Entry points (evidence) | Status |
| --- | --- | --- | --- |
| Worker router | Routes /api/ai, /api/stripe-checkout, /api/stripe-verify; /api/gemini returns 410 | worker.ts:172-182 | No community, membership, block, report or appeal route |
| Worker auth, CORS, rate limit | Identity, origin allowlist, fail-closed rate limit | worker-security.ts:65-78, 80-93, 119-122, 124-144, 147-159, 162-173; worker.ts:116-155 authorizeWorkerRequest | Reusable for future routes |
| Firestore rules | All server authority for collections in section 4 | firestore.rules:14-557 | No collection for membership, blocks, reports, appeals, moderation or capabilities |
| Core ports | AUTH, STORAGE, AI, BILLING ports; hash and RNG helpers | ports.ts:6-40 | No community or membership port. ports.ts:26 aiReport is an AI method, not a report. |
| Core auth | Firebase-backed AUTH_PORT | auth.service.ts:76-148 | Linking keeps uid (:127-139). Credential-in-use fallback changes uid (:97-108). |
| Core directory | publicProfiles read and write | user-directory.ts:34-100 | No consent gate; no verification gate (F2, F3) |
| Core booking | Slots, appointments, shares, roster | booking.ts:229-426 | Not atomic (F6). No cancel-retry idempotency (F7). |
| Core therapist link | Invite codes, roster, assignments, consent text | therapist-link.ts:86-204 | No client unlink (F4). Invite claim overwrites existing roster fields (section 5, claim row). |
| Core admin | Allowlist and admin-client links | admin.ts:18-149 | No consent step (F1). Coarse role (F14). |
| Core share codes | Bearer codes, redeem, revoke | cloud-storage.ts:197-287 | No expiry (F8). Retry orphan (F9). |
| Core billing | Client receipt and Stripe flow | billing.service.ts:10-92 | Client-held entitlement (F10) |
| Core local store | Local-first storage, 30-entry archive, unscoped keys | local-store.ts:1-72 | Not account-scoped (F11) |
| React booking UI | Request flow and error handling | overlays.jsx:695-770 | Failure message while partial state may persist (F6) |
| React share UI | Create, list, revoke codes | overlays.jsx:191-194, 323-358, 507-520 | 20-entry cap (F8) |
| React therapist link UI | Create invite | overlays.jsx:1498-1520 | Consent gated by shareConfirmed (overlays.jsx:1506-1508) |
| React admin UI | Resolve and link clients | screens/admin.jsx:136-171 | No consent step (F1) |
| React therapist panel | Roster, appointments, archive, decisions | screens/innerverse.jsx:455-530 | Roster not filtered by active appointment (F4) |
| React cabinet | Own appointments; cancel | screens/cabinet.jsx:59-75 | Repeat cancel rejected (F7) |
| Angular booking | Re-exports core booking | src/app/features/booking-panel/booking.ts:3; booking-panel.component.ts:110-124 | Shared core (reuse) |
| Angular therapist link | Re-exports core therapist link | src/app/core/data/therapist-link.ts:3; therapist-panel.component.ts:105-147, :202 | Shared core (reuse) |
| Angular directory | Second implementation of publicProfiles | src/services/user-directory.service.ts:1-30, :102 | Duplicate (F17) |
| Angular admin | Second implementation of adminClients and allowlist | src/services/specialist-client.service.ts:113, :160; src/services/admin-access.service.ts:53 | Duplicate (F17) |

Absent from the repository: community or membership port; community Worker routes; membership, block, report, appeal, moderation or capability collections; any unlink UI; account deletion; retention jobs or TTL; scheduled tasks (no functions directory; no cron in firebase.json or wrangler.toml).

## 7. Findings

Each finding is a code-reading observation unless marked otherwise. "Test asserts" means an existing test checks this behaviour; the test was not run.

**F1. Admin client links need no client consent (high).** An allowlisted admin can resolve any client by email or uid and create an adminClients row (admin.jsx:136-161; admin.ts:100-116). The rule allows create for any clientUid other than the admin's own, with no consent field (rules 280-291). That row grants read of users/{uid}/assessment and history (rules 139-144, 166, 171). No consent wording exists in this flow (i18n/strings.ts:159-164). The emulator suite asserts this success (firestore.rules.emulator.spec.ts:186-211, test asserts). Conflicts with: the task requirement that private notes and therapist context are never silently exposed; 80-20-plan.md:575-577 (explicit consent for each new class of disclosure). Decision for S02: keep, gate or retire admin links, and specify the consent record if kept.

**F2. The directory exposes email to every signed-in session without a discovery consent (high).** Rules allow get and list to any signed-in session (rules 311). Rules do not distinguish anonymous from linked sessions (rules 15-17), and the app creates anonymous sessions at boot (auth.service.ts:81-91). Linked sign-in writes email and display name automatically (auth.service.ts:43-47; user-directory.ts:34-46). Availability save also writes it (overlays.jsx:976-979). The emulator suite asserts that a signed-in attacker can read a victim profile (firestore.rules.emulator.spec.ts:309-323, test asserts). Conflicts with: the task requirement that public discovery uses chosen fields and per-purpose consent; social-creative-practice-beads-plan.md:210. Decision for S02: define the discoverable field set, the consent record, and whether anonymous sessions may query.

**F3. Identity claims are not verified before directory or therapist resolution (high, pending verification of Firebase settings).** The app never calls sendEmailVerification. Rules check publicProfiles email against the token email but not email_verified (rules 310-318). Therapist profiles self-assert email (rules 326-333). Booking resolves a therapist by directory email and then checks for a therapists profile (overlays.jsx:701-710; booking-panel.component.ts:110-124). The appointment rule binds therapistEmail to that profile (rules 395-396). Only the admin and cabinet screens gate on emailVerified (admin.ts:44; cabinet.jsx:39; admin.jsx:65). Whether an unverified claim can capture a booking depends on Firebase Auth project settings that are not in this repository, so this is an unverified risk. Conflicts with: social-creative-practice-beads-plan.md:210 (recipient authority enforced server-side); 80-20-plan.md:428 and :430 (state the supported discovery path; verify provider data). Decision for S02: require verified email, or treat an unverified claim as not discoverable.

**F4. Client-side revocation is partial, and the consent promise is not backed by code (high).** The consent text says "You can unlink at any moment" (therapist-link.ts:202; i18n/strings.ts:5981 in the React copy). No unlink function is exported by therapist-link.ts (exports at :20-204). Only the therapist can delete a roster row (rules 532). The client can delete the therapistLinks code (rules 251), but the roster row and its summary copy remain (rules 472-498). The therapist's roster is loaded without filtering by active appointment (therapist-link.ts:143-159; innerverse.jsx:462-466). After cancellation, reads are revoked (rules 62-70, 166, 171) but the client still appears in the roster. Conflicts with: 80-20-plan.md:582 (leave and revoke controls); social-creative-practice-beads-plan.md:210 (revocation enforced server-side). Decision for S02: client-initiated unlink, roster cascade or tombstone, and roster filtering.

**F5. Booking grants more than the plan allows (medium-high).** The booking consent says the therapist may read "any assessment profile and history I have explicitly saved" (i18n/strings.ts:351). The grant covers the full assessment and history (rules 166, 171, 441-467). The plan says "Permission to book is not permission to inspect a complete psychological record" (80-20-plan.md:385). Decision for S02: narrow to selected records, or add an explicit per-class consent.

**F6. Booking creation is not atomic and has no repair path (high).** The appointment and busy slot are written in one batch (booking.ts:379-400). The clientShares and therapistClients writes follow as separate calls (booking.ts:401-424). If they fail, the React UI shows bookingFailed (overlays.jsx:750-752). A retry from the same client creates a new appointment ID, and its busy-slot write is an update on the existing lock, which rules deny (rules 365), and the appointment create also needs a matching busy slot (rules 406-411). So the retry cannot repair the missing grant. Therapist approval does not create one (rules 412-425). Result: an approved appointment with no grant is possible. Conflicts with: 80-20-plan.md:437 (define recoverable partial failures between appointment persistence and access creation). Status: inferred from code and rules, not executed.

**F7. Repeated status transitions are rejected, not acknowledged (low-medium).** The only already-closed guard blocks reopening (booking.ts:346-348). A second cancel or decline does not match the client or therapist update rules, which require the current status to be pending or approved (rules 412-434). The expected result is a permission error that the UI reports as a failure. Status: inferred, not executed.

**F8. Share codes and invite links never expire, are not recipient-bound, and revocation depends on a capped local list (medium-high).** Share and invite documents allow no expiry field (rules 80-82; 246-247). Anyone holding the code can read it (rules 226-227; cloud-storage.ts:249-262; strings.ts:193 says so to the user). The React issued-code list is capped at 20 entries and shared by all accounts (overlays.jsx:332-336). It is filtered by uid only at mount (overlays.jsx:191-194). A code that drops out of the list stays live but has no UI path to revoke it. Conflicts with: social-creative-practice-beads-plan.md:210 ("Guest links are bounded and expire"); 80-20-plan.md:575 and :582 (revocation limits; expired links).

**F9. A share-code create retry can orphan a live code (medium, inferred).** createPrivateShareCode runs a transaction inside withResilience (cloud-storage.ts:224-247). withResilience retries any error up to three times and races each attempt against a 10 s timeout that does not cancel the first attempt (resilience.ts:7-38). If the first commit succeeds but the client times out, the retry sees the document as existing, returns false, and the loop creates a second code. The first code stays live and absent from the local list. Needs a timeout test to confirm.

**F10. Entitlement is held on the client (medium).** The receipt is cached for 24 h and read synchronously (billing.service.ts:12-13, :58). Offline or failed verification falls back to that cache (billing.service.ts:74, :85). The Worker returns status only and writes nothing (worker.ts:318-392). It has a legacy email-match branch (worker.ts:365-369). There is no webhook in the repository. ports.ts:42-44 keeps an unused legacy flag. Relevant because membership may depend on entitlement; the aaa adoption plan assigns entitlement to a separate slot (aaa-v7-architecture-and-agent-sweeps.md:82).

**F11. Account change is not modelled (medium).** Linking keeps the uid (auth.service.ts:127-139), but a Google sign-in can fall through to a different account when the credential is in use (auth.service.ts:97-108). Email sign-in can switch accounts (auth.service.ts:121-124). Sign-out removes only ifs.auth (auth.service.ts:141-147). Local assessment and share keys are not account-scoped (local-store.ts:56-72). Public profiles and therapist profiles persist after sign-out, and no code deletes them. The billing receipt is the only local grant checked against uid (billing.service.ts:58, :65, :76). Appointments and grants are keyed by the old uid and are not migrated.

**F12. Withdrawn or deleted sources leave copies (medium).** Email is copied into appointments, clientShares, therapistClients and adminClients (booking.ts:380-383, :401-412, :413-424; admin.ts:108-115). Deleting the publicProfile has no cascade and no caller (rules 321). Removing an admin email leaves adminClients rows; re-adding the email restores reads because the rule checks only isAdmin and the row (admin.ts:73-77; rules 139-144). Deleting a therapistLinks code leaves the roster summary copy (rules 251 versus 475-498).

**F13. Retention is absent (medium-high).** No TTL, cron or scheduled job exists (firebase.json and wrangler tomls contain none; no functions directory). No account deletion call exists. No client path deletes users/{uid} assessment or history, although rules permit owner deletes (rules 167, 172). Pending appointments and share codes never expire (rules 229-236, 386-411). The only bounded retention is the local 30-entry archive (local-store.ts:5, :24-31). Conflicts with: 80-20-plan.md:417 (define retention for transient exchange, saved excerpt and user artifact); 80-20-plan.md:582 (account deletion, expired links).

**F14. Moderation, reporting, appeal and blocks are absent (high as a scope gap).** No collection, route, port or rule exists (firestore.rules:162-556; worker.ts:172-182; ports.ts:6-40). The only operator role is isAdmin (rules 29-35), with a hard-coded bootstrap address (rules 32; admin.ts:18) and no capability scoping and no audit trail. This is a gap, not a regression. The word "report" appears only as aiReport (ports.ts:26) and "block" only as CSS or UI class names.

**F15. Consent records carry no version (medium).** clientShares, shareCodes and therapistLinks accept only fixed fields (rules 80-82; 239-249; 445-446; 459-460). Nothing records which consent text was accepted. Consent text lives in several copies: i18n/strings.ts:193 and :351; therapist-link.ts:202; src/i18n/strings.ts:109 and :5981. Relevant to stale contract (section 8, scenario C).

**F16. Strict summary shape couples client and rules releases (medium).** validTherapistSummary requires an exact key set (rules 146-159), used for invite and roster writes (rules 249, 494, 516). A client that adds or removes a summary field is rejected until rules and client are deployed together. No version field exists. TherapistClientSummary is defined at therapist-link.ts:33-41.

**F17. Two implementations of the directory and the admin relationships (medium, drift risk).** The React directory (core/user-directory.ts) and the Angular directory (src/services/user-directory.service.ts) both write publicProfiles. The Angular header states it writes on every non-anonymous auth change (user-directory.service.ts:25-26). The admin roster and allowlist also exist twice (core/admin.ts; src/services/specialist-client.service.ts and admin-access.service.ts). Booking and therapist link are shared: Angular re-exports the React core (booking.ts:3; therapist-link.ts:3).

**F18. Planning metadata needs reconciliation (low-medium).** The B03 epic lists reuse_packages as [] (social JSON node B03), while platforms.B03 and B03.S01 list [C01, C08]. The epic's write_set is docs/plans/extension/b03/**, but B03.S01's is architecture/extension/development/b03/s01/**. C01 lists tica as a reuse Bead (section 3). The aaa adoption plan's ten slots (aaa-v7-architecture-and-agent-sweeps.md:67-82) do not include community.membership, which exists only in the social plan (social-creative-practice-beads-plan.md:132). Dependencies: B02 needs B01 and B03; B04 and B05 need B03; B11 needs B03 and B04; B12 needs B03 and B08 (platforms table, social JSON).

## 8. Scenario matrix

Status column: "Tested" means an emulator or static rule test exists for the behaviour. It was not run. "Not tested" means no test found. Neither label is an acceptance claim.

| Scenario | Current behaviour (evidence) | Gap or conflict | Test | S02 must specify |
| --- | --- | --- | --- | --- |
| A. Normal grant | Client books (booking.ts:366-425); therapist approves (rules 412-425); therapist reads assessment and history while appointment is live (rules 133-137, 166, 171) | Grant written after batch (F6); scope broad (F5) | Tested: emulator 353-388 and 414-426 (positive read after booking) | Single authoritative grant record with version, purpose, scope and expiry |
| B. Denied grant | (i) No appointment, no read (rules 62-70, 133-137). (ii) Non-admin cannot create adminClients (rules 280-281; emulator 149-159). (iii) Forged legacy adminClients does not unlock reads (emulator 161-175). (iv) Client cannot write therapistClients (rules 472-498; emulator 335, 343). (v) Fake booking shares fail (emulator 325-352). (vi) Declined or cancelled appointment revokes reads (rules 62-70; emulator 414-426). | Directory readable by any signed-in session (F2). Share codes readable by any holder (F8). | Tested: (i) to (vi), not run | Denial reasons as a stable error taxonomy, shown truthfully |
| C. Stale contract | (i) Invite summary is an immutable copy (rules 250, 496). (ii) Strict summary shape (rules 146-159; F16). (iii) No consent version (F15). (iv) Legacy 64-answer share payload still accepted (cloud-storage.ts:262-277; rules 99-111). (v) Appointment times are naive local strings with no zone field (booking.ts:55-57; rules 397-404). (vi) Busy-slot and appointment status can disagree after legacy data (rules 412-434). | No version field on any grant or consent document. No migration path named. | Tested: emulator 294-308 (legacy share read), 427-453 (field injection). Version drift not tested. | Contract version on each grant; migration or refusal for old shapes; consent text version |
| D. Account change | (i) Anonymous to Google keeps uid (auth.service.ts:127-133). (ii) Credential-in-use fallback changes uid (auth.service.ts:97-108). (iii) Email sign-in switches account (auth.service.ts:121-124). (iv) Sign-out keeps local keys (auth.service.ts:141-147; local-store.ts:56-72). (v) Public profiles persist (F12). (vi) Receipt is uid-checked (billing.service.ts:58, :65, :76). (vii) Share list filtered by uid at mount, but its cap is shared (overlays.jsx:191-194, :332-336). (viii) Admin reads follow the admin uid (rules 139-144). | No re-binding for appointments and grants after uid change. No account deletion. | Not tested | Account-change transition rules: what moves, what stays, what is revoked |
| E. Deleted source | (i) Appointment cancelled: reads revoked, roster remains (F4). (ii) Client deletes therapistLinks: assignments blocked (rules 115-131, 543), roster copy remains (F12). (iii) Owner deletes share code: redeem returns null (cloud-storage.ts:249-262), copies remain (plan: copies cannot be recalled, 80-20-plan.md:575). (iv) publicProfile deleted: no caller; copies remain in appointments and shares. (v) Admin email removed: reads revoked (rules 139-144); adminClients rows survive (F12). (vi) therapists profile cannot be deleted (rules 334). | Client-side source deletion does not revoke derived copies. | Tested: emulator 414-426 (appointment), 290-291 (share code deletion). Others not tested. | Tombstone or cascade rules per copy; statement of what cannot be recalled |
| F. Duplicate or cancelled operation | (i) Duplicate booking of the same start is blocked by the busy-slot create-only rule (rules 340-364; booking.ts:378-399). (ii) Retry after partial booking is blocked, leaving a grantless appointment (F6). (iii) Repeat cancel or decline is rejected (F7). (iv) Approve after cancel is rejected (rules 412-416). (v) Share-create retry can orphan a code (F9). (vi) Repeat share revoke expected to be rejected (F8). (vii) Invite re-claim overwrites archived and appointmentId (therapist-link.ts:114-124). (viii) Directory cache stale for 5 minutes (user-directory.ts:12-27). | Idempotency keys absent for booking, share create and claim. | Tested: (i) emulator 353-413; (iv) emulator 427-453 (invalid transitions). Others not tested. | Effect identity per operation; retry rules per class; "already done" acknowledgement |
| G. Offline or quiet alternative | (i) Local-first solo use continues (local-store.ts:1-2; 80-20-plan.md:590). (ii) Share, booking and roster are optional. (iii) createBooking has no timeout or retry wrapper; its promise waits on the SDK (booking.ts imports, no withResilience). (iv) Share operations use withResilience: up to four attempts with 10 s races and backoff (cloud-storage.ts:36, :59, :92; resilience.ts:7-38). (v) Entitlement honored offline from cache for up to 24 h (billing.service.ts:74, :85). (vi) Directory answers cached for 5 minutes (user-directory.ts:12-27). (vii) Decline and cancel exist in UI (cabinet.jsx:74; overlays.jsx:955). No appointment-status notification found. | No declared offline state for grants or booking. No quiet alternative for block or mute. | Not tested | Offline and quiet states for each grant operation; what the user sees; what is queued and what is never queued |

### 8.1 Required states (normal, unknown, declined, denied, interrupted, quiet)

| State | Where it exists today | Handling today | Missing |
| --- | --- | --- | --- |
| Normal | Pending, approved appointment; live share code; roster row | Shown in cabinet and therapist panel | Consistent view after partial failure (F6) |
| Unknown | Therapist not found (overlays.jsx:703-706; booking-panel.component.ts:116-118); email unverified (no state modelled, F3); no eligibility or consent version (F15) | Generic not-found message | Distinct unknown-eligibility state; verification state |
| Declined | Therapist decline (rules 417-424; booking.ts:339-356; overlays.jsx:955) | Status shown on reload | Notification path (B05); declined-grant effect on roster (F4) |
| Denied | Rule denials across collections (section 8, B) | Generic error text | Truthful reason; differentiate not-found from denied |
| Interrupted | Partial booking (F6); share create timeout (F9); offline batch wait (G) | Generic failure text | Recovery procedure and truthful state for each |
| Quiet | Solo use; no share; no booking | Available | No block, mute or leave for membership; no quiet mode for admin-linked clients |

### 8.2 Compatibility dimensions for community.membership

The social plan asks for six compatibility dimensions for each slot. The AAA adoption plan names them as interface, state, effects, operations, performance and failure semantics (aaa-v7-architecture-and-agent-sweeps.md:84). This table records the closest existing surface for each. No community.membership slot exists yet.

| Dimension | Closest existing surface (evidence) | Gap for community.membership | Required in S02 |
| --- | --- | --- | --- |
| Interface | booking.ts exports (createBooking, setAppointmentStatus, therapistBusyIntervals and others); therapist-link.ts exports; admin.ts exports; cloud-storage.ts share functions. ports.ts has AUTH, STORAGE, AI and BILLING ports only (ports.ts:6-40). | No typed grant, revoke, block, report, appeal or retention contract | Versioned port with these operations, typed errors and no framework imports |
| State | Documents in section 4. Grant and roster are separate records (S7 and S8). Local keys are unscoped (S19). | No single authoritative membership record. Identity copied into several documents. | One authoritative grant record; derived copies marked as derived; tombstones |
| Effects | E2 writes; batch then separate writes (F6); no effect identity; E4 Stripe call without idempotency key | No effect identity for grant, revoke or report. No compensation for partial writes. | effect_id per grant, revoke and report; atomic grant with roster, or declared recovery |
| Operations | Client book, cancel; therapist approve, decline, claim, archive, assign; admin link, unlink; share create, redeem, revoke | No block, report, appeal, moderator action or leave operation | Operation list with actor, rule check and audit record |
| Performance | Equality queries (booking.ts:269-304; user-directory.ts:78-81; therapist-link.ts:145); no pagination on the issued-code list (overlays.jsx:191-194); 10 s timeout times four attempts (resilience.ts:7-38); firestore.indexes.json is empty | No budget. Directory list unbounded (F2). Rules perform multiple document reads per check (rules 37-70), subject to platform limits to verify. | Budgets for grant checks, pagination, declared indexes |
| Failure semantics | Client shows generic text (overlays.jsx:341, :358, :752). withResilience retries every error (resilience.ts:13-38). Cached receipt honored offline (billing.service.ts:74). | No distinction among not-applied, applied-partially, applied-unacknowledged, denied, expired and revoked | Failure table per operation and a truthful user-facing state for each |

## 9. Source provenance

Git blob identities are from `git ls-files -s` at HEAD 09194df. They identify the exact content read.

| Source | Blob | Use in this inventory |
| --- | --- | --- |
| docs/80-20-plan.md | 0fbd09fe918beef19e7b276a47cced4e812ed398 | Product requirements: sections 3, 9.3a, 9.4, 9.5, 13 |
| docs/plans/first-principles-elevation-beads.md | e724cd055bb82798d439eb2bba20cd4a9f63d479 | Twelve-step pattern; state coverage (step 02); unresolved workcell metadata |
| docs/plans/aaa-v7-architecture-and-agent-sweeps.md | ae04de5adf54fc52bfa090e5c2883afed83dc573 | Slot list; six compatibility dimensions; workcell and lease rules |
| docs/plans/references/AAA-V7-SPEC.source.md | 2eb18f3f77257b492df1fe1484f8237a930c508e | Effect classes E0 to E5 (lines 330-335). Computed SHA-256 e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc matches the pin in the adoption plan (line 5). |
| docs/plans/social-creative-practice-beads-plan.json | d7acf515c30d95c11028085baf360feaa35b46fe | B03 platform, B03 epic, B03.S01 and B03.S02 nodes, edges, beads_ids (B03 = tica, B03.S01 = quc8, B03.S02 = i4aa). Its authority field: "planning snapshot, not live status". |
| docs/plans/social-creative-practice-beads-plan.md | 3b5d001c64b8984c61bc2c37c7b0d00080f7d284 | Slot table (line 132), contract rule (line 143), consent and safety rules (lines 208-228) |
| docs/plans/creative-commons-beads-plan.json | cbe2605ef4f32b4f4c66c24787b47d02a1be8d8c | C01 (xs263) and C08 (frd2b) nodes, reuse_beads, reuse_policy |
| docs/plans/creative-commons-beads-plan.md | 6e64b476009052c2a1e9460e4ec2015ad3782e48 | Package definitions (lines 11, 23, 27, 30, 37, 38); edge orientation (line 59) |
| src/parts-cartographer/core/ports.ts | 68e6214a0ec9ba5679a35dd8ae6289ddc95fee36 | Port contracts (read in full) |
| firestore.rules | 36ffb114d5610c9177950d52a9861706f4a611dd | All collection rules (read in full) |
| firestore.rules.emulator.spec.ts | 7f597a15b4f06f1c7543031dc0ae41991664f353 | Test assertions cited as "test asserts"; not run |
| firestore.rules.spec.ts | 62fac0d9a07925bce611f09e40e9405daace9c60 | Static regex checks on rules; not run |
| worker.ts | fec6be8dc79d5f9858cd2892d93bf7679ed6a120 | Routes and Stripe flows |
| worker-security.ts | 86e0cd1bff29ee17191c79bcdac5caee1fb95922 | Identity, CORS, origin and rate-limit helpers |
| src/parts-cartographer/core/auth.service.ts | 5591b67cc092baa5e17e12125fb4fe9f96fabdf4 | Auth port |
| src/parts-cartographer/core/user-directory.ts | 6748f62c927be16d377dcb9ce842108c0dc75c5d | Directory |
| src/parts-cartographer/core/booking.ts | 0e2a99f09ed43f9c28c38b278a5cb70cc6258e0c | Booking and slots |
| src/parts-cartographer/core/therapist-link.ts | dd67642b240f60808e124c03a6cbadda07e570ab | Invite, roster, assignments |
| src/parts-cartographer/core/admin.ts | 6222c83e84f84e3461cbcc9361eff6d629a54387 | Admin allowlist and links |
| src/parts-cartographer/core/cloud-storage.ts | 4d9bfe11f0047412fdd0f2e967dfad6604b7b82d | Share codes and saves |
| src/parts-cartographer/core/billing.service.ts | 9144863698b01d71a8e3fead7084aa547f116d49 | Entitlement cache |
| src/parts-cartographer/core/local-store.ts | e28e50d5ddd4567efdf502bc7bf383de9970ee65 | Local keys and archive |
| src/parts-cartographer/overlays.jsx | 19a5784c393dfa1cc5ffce39efa11635b5f83ffa | Booking, share, therapist link, directory UI |
| src/parts-cartographer/screens/admin.jsx | 0d69e93ec5db85fac92898b03e44e73b0137d5b3 | Admin UI |
| src/parts-cartographer/screens/innerverse.jsx | 3a7e8bcc746e5cd2ce63b2e79a7940a8eb0fdeea | Therapist panel |
| src/parts-cartographer/screens/cabinet.jsx | c7c91dbdc57433c802c4c2770c4c77b21d1c3cd0 | Cabinet appointments |
| src/parts-cartographer/i18n/strings.ts | 8b83c660b91c327f6f0eda764c8698019cfa908c | Consent and admin copy |
| src/services/user-directory.service.ts | 3bdd1116a764aebf8fb5bc1c0ced1044f359f484 | Angular directory duplicate |
| src/app/core/adapters/resilience.ts | bb7f4b4e5ffb7e422e18bf4bf7ebac1fa9390a54 | withResilience |

Other sources cited (not all read in full): src/services/specialist-client.service.ts, src/services/admin-access.service.ts, src/app/features/booking-panel/booking.ts, src/app/core/data/therapist-link.ts, src/app/features/cabinet/cabinet.component.ts, src/app/features/therapist-panel/therapist-panel.component.ts, src/app/features/booking-panel/booking-panel.component.ts, src/parts-cartographer/core/push.ts, src/i18n/strings.ts, firebase.json, wrangler.toml, firestore.indexes.json.

Live Bead status was not read. The bd tool is out of scope for this subagent. The passive export .beads/issues.jsonl (128 records) contains none of quc8, tica, i4aa, cyqe, xs263 or frd2b, so it provides no status evidence either way.

Data provenance: no participant, user or production data was accessed. No credentials were read or copied. The bootstrap admin address is deliberately not reproduced.

## 10. Read-set status

| Read-set file | Present | Read |
| --- | --- | --- |
| docs/80-20-plan.md | yes | Sections cited |
| docs/plans/first-principles-elevation-beads.md | yes | Read in full |
| docs/plans/aaa-v7-architecture-and-agent-sweeps.md | yes | Read in full |
| docs/plans/social-creative-practice-beads-plan.json | yes (15 MB) | Targeted queries: nodes, platforms, conflicts, coverage, beads_ids, validation |
| src/parts-cartographer/core/ports.ts | yes | Read in full |

## 11. Checks

| Check | Method | Result |
| --- | --- | --- |
| Read-set files present | ls and Read | 5 of 5 present |
| Citation anchors | Script in the scratchpad checks each cited path, line and anchor text | 182 anchors checked; 173 exact; 9 matched one or two lines from the cited line inside the same block (for example firestore.rules:32, booking.ts:401, booking.ts:413), reviewed and accepted; none pointed to a different block |
| Absence checks | grep over src, worker, rules and config for community, membership, block, report, appeal, moderation, unlink, deleteUser, TTL, cron, sendEmailVerification and Idempotency-Key | Absent in the current tree (no matches for the terms in section 6) |
| Write-set check | git status before commit | Only the one new file |
| ASCII-only deliverable | Script | Recorded with the citation check |
| Rules emulator suite | Not run. No node_modules in the worktree; the Firestore emulator was not started. | NOT RUN |
| Worker unit tests | Not run. Same reason. | NOT RUN |
| Browser, device, participant, community, practitioner, live-service | Not applicable to a static inventory | PENDING |
| Independent review | Not requested in this subagent run | PENDING |

## 12. Limitations

- Static reading only. Statements about Firestore rule evaluation, such as denial on evaluation error, delete of a missing document being denied, and anonymous sessions satisfying isSignedIn, are inferences from rule semantics. They must be confirmed with the emulator before acceptance.
- Firebase project settings are not in the repository: email uniqueness across providers, email verification requirements, Auth account linking, Firestore TTL policies, indexes, App Check and the deployed rule version. F3, F11 and F12 depend on them.
- Live Bead status and Bead dependency state were not read.
- The base is an observed commit, not an immutable generation. No contract version is published.
- The Angular surface was traced only where it calls shared core code or duplicates a service. Parity was not assessed.
- Worker test files (worker.routes.spec.ts, worker-security.spec.ts) were not read in depth.
- The C01 and C08 reuse is design-level only. No C01 or C08 artifact exists.
- Feature-level reuse keys (for example X02, E14, E19) resolve to packages in the elevation plan. They were not traced.
- The social plan JSON is 15 MB. Analysis used targeted queries. It is not a full validation of its 4,240 edges.
- No claim is made about user comprehension, safety, usefulness, clinical or spiritual fit, or community behaviour.

## 13. Decisions and blockers for the coordinator

1. Resolve the immutable base and contract versions (base_generation null, contract_versions []). Required before any code work in B03.S02 or later. Not required to accept this inventory.
2. Product decision on admin client links without consent (F1). Current behaviour is asserted by a test. Not a fix for this slice.
3. Directory consent and verification model (F2, F3). Affects the discovery design.
4. Booking grant scope (F5).
5. Write-set path inconsistency between the B03 epic and B03.S01 (F18).
6. Ownership of moderation, unlink and block semantics across B03, C05, C15 and C16 (section 3).
7. Confirm whether community.membership is added to the AAA slot list or handled as a social-plan slot (F18).

## 14. Next handoff: B03.S02 (ArchetypeAI-i4aa)

Inputs S02 must read: this file at its commit; scenario IDs A to G and the state table in 8.1; findings F1 to F18; the compatibility table in 8.2; the decisions in section 13.

S02 must specify, not implement: the grant lifecycle states (requested, pending, approved, declined, cancelled, expired, revoked, source-deleted, account-changed, unknown-eligibility); effect classes and effect identity for each operation in section 5; recovery for partial booking (F6); tombstone and cascade rules for copies (F12); a consent record with version, purpose and scope (F15); retention classes (transient exchange, saved excerpt, user artifact) per 80-20-plan.md:417; a moderator capability model and report or appeal states, or an explicit deferral; offline and quiet states per operation; and the six compatibility contracts.

S02 must not assume: that any community.membership port or collection exists; that Firebase project settings match the assumptions in section 12; that roster revocation exists; that rules deny unknown errors safely without verification; or that C01 or C08 provides any grant semantics.

Rollback and undo: this candidate adds one Markdown file and changes no runtime behaviour. Revert the commit to undo it.
