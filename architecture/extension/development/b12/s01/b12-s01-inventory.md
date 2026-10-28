# B12.S01 inventory: current ownership and actual reuse for community.inquiry
<!-- cite-ref: 45c24ed -->

> **Independent review (2026-10-16).** Round 1 at `f8746dc`: FAIL (minor), the deletion-survey omission. Round 2 at `f8746dc`: FAIL (minor). Round 3 at `8751dad`: FAIL (minor). R-9 implied the consent.provenance module had been added at HEAD. The module added in f3decec is a memory module with no consent logic. Base note: several citations, including `src/parts-cartographer/core/personal-memory.ts@3683b0f`, are HEAD paths. The checker results depend on scripts outside the repository and were not re-verified. Status is still **candidate, not accepted**; re-review is required.

**Status: candidate awaiting independent review.** This is a document-only inventory. It is not an acceptance claim and does not show that any B12 feature exists or works. No participant, device, live-account, community, tradition or practitioner evidence was collected or implied.

| Item | Value |
|---|---|
| Date | 2026-10-15 |
| Bead | ArchetypeAI-7sj4, [B12.S01] Inventory current ownership and actual reuse: Participant-led inquiries and contextual knowledge |
| Parent / successor | ArchetypeAI-nje6 (B12) / ArchetypeAI-wq9i (B12.S02) |
| Planning root | ArchetypeAI-cyqe |
| Slot | community.inquiry (proposed platform package B12; no owned slot; no published contract) |
| Reuse package in metadata | C08. Ambiguous across plan files; see H1. |
| Role / mutation / risk | slot-owner / M0 / R2 |
| Immutable base | Not bound by a broker (Bead metadata `base_generation: null`). Citations pin to git HEAD `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365` on branch `worktree-agent-a0865831b40acd04f`, which was clean when this step started. |
| Predecessors | None in the planning graph for S01. Published predecessor contracts: none. |

Purpose from the Bead: voluntary observations, comparisons, contrary results, contributor control and noncausal labels.

## 1. Method and labels

Method: read the Bead text and the read-set files; traced code paths from UI handlers to Firestore, Worker and storage calls; searched concept names across `src`, `worker*.ts`, `firestore.rules` and tests; counted runtime call sites of exported functions; read the planning JSON and the passive tracker export. Section 10 lists the checks.

Line citations use `path:line` or `path L<n>`. Paths are relative to the worktree root.

| Label | Meaning |
|---|---|
| [CODE] | Observed in source at the cited line. |
| [RULE] | Stated in `firestore.rules` text at the cited line. |
| [RULE-INF] | Follows from rule text; not exercised in an emulator. |
| [TEST] | An existing spec covers the point. It was not run in this step. |
| [PLAN] | Stated in a planning document. A proposal, not evidence. |
| [INF] | Inferred from code; not reproduced. Verify before any claim. |
| [GAP] | Absent from the repository at this commit. |

## 2. Headline reconciliation

**H1. C08 names different packages in different plan files (resolve before S02).**
- `docs/plans/elevation-aaa-v7-beads-plan.json` defines C08 as "Slot migration: Consent, source lineage and corrections" (consent.provenance; stream ArchetypeAI-v2tj; step C08.01 is ArchetypeAI-4bs4, "Audit implementations and state/effect ownership: consent.provenance"). Its slot path metadata is `src/parts-cartographer/core/personal-memory.ts@3683b0f`. [PLAN]
- `docs/plans/creative-commons-beads-plan.json` (prepared 2026-10-10, after the social plan) defines C08 as "Cross-circle expeditions", reusing F07, F23, F24, F42, F43 and F46. [PLAN]
- The social plan (prepared 2026-10-06) uses the elevation namespace elsewhere. Across B01 to B12 the reuse codes are C01, C02, C03, C04, C08 and C09, which are the elevation slot migrations for auth, storage, scoring, projection, consent and artifacts. Its feature reuse codes E05, E12, E13, E19 and X02 match elevation streams "Useful action under uncertainty", "Beautiful quiet and accessible presentation", "Universal interaction grammar", "Extensions that earn complexity" and "Permissioned shared conversation". [PLAN]
- The social JSON also records an edge from B12 to ArchetypeAI-v2tj (consent.provenance). [PLAN]
- Conclusion: the most consistent reading of B12's reuse package is the elevation consent.provenance slot. This is an inference from namespace consistency. The coordinator must confirm it. This inventory covers both readings where they touch.
- At the base commit d17aaa6 the consent.provenance module path (`src/parts-cartographer/core/personal-memory.ts@3683b0f`) did not exist. HEAD adds it (commit f3decec) with `addMemory`, `contextMemories`, `correctMemory` and `deleteWithDerived`. Its lineage and consent fields are not assessed here. [GAP at base; superseded at HEAD]

**H2. community.inquiry has no implementation.** [GAP] No port, collection, Worker route, screen or test names it. Searches for the feature concepts (expedition, interest constellation, parallel play, creative jam, mini-game, community.inquiry) found no code hit. The word "inquiry" appears in product copy at HEAD: a route title and purpose (`src/parts-cartographer/i18n/strings.ts:31-35`), a component name (`src/parts-cartographer/screens/check-in.jsx:21`) and a practice stop-rule (`src/shared/i18n/strings.ts@3683b0f` L2172, base path `src/i18n/strings.ts`). None is a community inquiry feature. No published slot output exists to consume. This step therefore reconciles mechanisms that could be reused, not a feature.

**H3. Reusable patterns (not community features).** The bearer share-code lifecycle (CMP-03), the allowlisted projection (CMP-04), the summary fixed at therapist-invite creation (CMP-16), the booking-created grant with a server-side appointment check (CMP-17), the predicted-versus-confirmed check-in record (CMP-08), the noncausal caveat wording (CMP-25) and the offline coach fallback (CMP-20).

**H4. Local state is not account-scoped.** `signOut` removes only the auth cache (`src/parts-cartographer/core/auth.service.ts` L141-148; removal at L146). Check-ins, synastry runs, journal entries, practice state and share-code records remain in the browser after sign-out and after an account switch. The only uid filter is on the issued-code list (`src/parts-cartographer/overlays.jsx` L192-195). [CODE]

**H5. Failed saves can present as success.** Local writes swallow quota errors (`src/parts-cartographer/core/local-store.ts` L22-24). Check-in saves do not check the result, and the screen moves to "done" regardless (`src/parts-cartographer/screens/check-in.jsx` L106-109 and L160). The journal shows success after a write that swallows its error (`src/parts-cartographer/overlays.jsx` L1273-1283). The 80/20 plan asks to "expose save failures rather than false success" (`docs/80-20-plan.md` L87). [CODE]

**H6. Deleting a source does not cascade.** Revoking a map share code deletes only `shareCodes/{code}` (`src/parts-cartographer/core/cloud-storage.ts` L282-287). Saved synastry results and connections (ST-03, ST-04) keep the derived result and the code string. No client path deletes them (see the deletion survey in section 4). [CODE]

**H7. Share codes are bearer grants with no expiry and no recipient scope.** The rules let any Firebase-authenticated principal read a share-code document by its code (`firestore.rules` L15-17 for `isSignedIn`, which is `request.auth != null`; L226-228). That includes anonymous Firebase users. [RULE-INF] The UI requires a linked account (`src/parts-cartographer/overlays.jsx` L371), but only on the client. The emulator suite tests unauthenticated and signed-in users, not anonymous-authenticated users. [TEST]

**H8. Backup export may contain other people's share codes.** `INNERVERSE_SYNASTRY_RUNS_V1` stores the typed partner code, truncated to 80 characters (`src/parts-cartographer/overlays.jsx` L217-223). That key is in the portable backup list (`src/parts-cartographer/core/backup.ts` L15), and `exportBackup` reads every portable key (L148-156). [INF] Verify before any change; no code value is reproduced here.

**H9. A timed-out share-code create can leave an orphan code.** [INF] `createPrivateShareCode` runs `runTransaction` inside `withResilience` (`src/parts-cartographer/core/cloud-storage.ts` L230). `withResilience` retries after a 10-second timeout and does not cancel the first attempt (`src/shared/core/adapters/resilience.ts@3683b0f` L6-10, L13-38). If the first commit succeeded, the retry finds the document, returns `false`, and the outer loop writes a second code. The first code is never returned to the UI and cannot be revoked through it. The unit spec covers collision only (`src/parts-cartographer/core/cloud-storage.spec.ts` L15-27). [TEST]

**H10. Adaptive and pause logic is dormant.** `adjustTriggerWeights` (`src/shared/core/data/state-v2.ts@3683b0f` L65-83) is described in its doc comment as "the ONLY adaptive element in the app", but it has no runtime caller. Check-in calls `predictFlare` without weights (`src/parts-cartographer/screens/check-in.jsx` L120). `pauseNonRegulation` (L383-385) and `shutdownStreak` (L368-381) have no runtime caller either. `attributionWorsening` has none. [CODE] Do not cite these as shipped behavior.

**H11. Two storage contracts share a name and differ.** The React `STORAGE_PORT` (`src/parts-cartographer/core/ports.ts` L15-21) is local-only. The Angular `StoragePort` (`src/app/core/ports/storage.port.ts` L26-39) includes cloud share and synastry operations. The Angular share generator uses `Math.random` with 8 characters (`src/app/core/adapters/firebase-storage.adapter.ts` L8-14). The React generator uses `crypto.getRandomValues` with 12 characters (`src/parts-cartographer/core/cloud-storage.ts` L197-203). Both fit the rule pattern of 8 to 16 characters.

**H12. The public identity directory is not a discovery surface.** `publicProfiles/{uid}` is readable by any signed-in principal (`firestore.rules` L310-311) and stores `email` and `emailLower` (`src/parts-cartographer/core/user-directory.ts` L6-10; rule L313-318). Do not reuse it for community discovery.

**H13. Planning edge direction needs confirmation.** The social JSON records `{from: B12.S02, type: blocks, to: B12.S01}`. The live Bead displays S01 as blocking S02 (`BLOCKS ← ArchetypeAI-wq9i`). This inventory treats S02 as the next consumer, as the Bead text says. The coordinator should confirm the JSON convention.

**Minor findings**

- F1. Redeem failures, post-result save failures and load failures show one message, "Could not load saved comparisons" (`src/parts-cartographer/overlays.jsx` L409 and L414, `src/parts-cartographer/i18n/strings.ts` L214). The revoked-or-missing case is also generic (L373), which is privacy-positive but needs a stated policy.
- F2. Journal delete is immediate, with no confirmation or undo (`src/parts-cartographer/overlays.jsx` L1285).
- F3. The Angular therapist metrics are computed from the viewing browser's local event log (`src/app/features/therapist-panel/therapist-panel.component.ts` L19 and L229). This is not a consented read of client data.
- F4. Owner write rules allow deleting `users/{uid}/history` and `assessment` (`firestore.rules` L165-172), but no client code deletes them. [INF]
- F5. The therapist invite code check is a read followed by a write, not a transaction (`src/parts-cartographer/core/therapist-link.ts` L86-103). Collision risk is low given the entropy. [CODE]
- F6. Re-rating a sealed verdict overwrites the earlier rating with no history (`src/parts-cartographer/screens/check-in.jsx` L111-116; `src/shared/core/data/state-v2.ts@3683b0f` L154-160). [CODE]
- F7. The synastry narrative saves locally (`src/parts-cartographer/overlays.jsx` L306) and then to the cloud (L309) in one `try`. A cloud failure leaves the two stores different and shows the error after the local save. [CODE]
- F8. `ResilientAiAdapter.degradation` is shared module state (`src/parts-cartographer/core/ai.adapter.ts` L129 and L199-205). Concurrent surfaces can read each other's status. [CODE]

## 3. Component inventory

| ID | Component and path | What it does now | Status | Disposition for community.inquiry |
|---|---|---|---|---|
| CMP-01 | React port contracts: `src/parts-cartographer/core/ports.ts` L4-13 (AUTH_PORT), L15-21 (STORAGE_PORT, local), L23-31 (AI_PORT, six methods), L35-40 (BILLING_PORT) | Interfaces only. No community, sharing, grant or remote storage operation. The header describes V1 as frozen. | Implemented; no B12 surface | Do not extend in S01. S03 proposes a separate versioned contract. |
| CMP-02 | Local store: `src/parts-cartographer/core/local-store.ts` L15-54 (store), L22-34 (save; quota error swallowed at L23), L56-72 (KEYS) | Per-browser JSON with a 30-entry history. The header describes local authority. | Implemented | Use only for per-browser conveniences. Community state must not depend on it without surfaced write failures. |
| CMP-03 | Map share codes: `src/parts-cartographer/core/cloud-storage.ts` L197-203 (12-character crypto code), L206-222 (create helpers), L224-246 (`createPrivateShareCode`: transaction, collision loop, `withResilience` at L230), L249-279 (redeem; regex L251), L282-287 (revoke by `deleteDoc`) | Owner creates a bearer code for a map snapshot or a legacy 64-answer payload. A recipient reads it. The owner revokes it. | Implemented | Closest bearer-grant analogue. Reuse the lifecycle shape only. Add expiry, recipient scope, cascade and a no-retry rule for create before reuse. |
| CMP-04 | Allowlisted projection: `src/parts-cartographer/core/cloud-storage.ts` L39-79 (`snapshot`) | Allowlists fields for storage and sharing. Excludes raw answers, journal, future self, auth and body-map data. | Implemented | Reuse the pattern of an explicit field list per purpose. The list itself is map-specific. |
| CMP-05 | Owner cloud save and history: `src/parts-cartographer/core/cloud-storage.ts` L82-96 (`saveCloudMap` batch to `users/{uid}/assessment/current` and history), L121-140 (history load, limit 20 at L128) | Owner-only snapshots. | Implemented | Not reused. A retry re-sets the same document IDs, so it is set-idempotent. |
| CMP-06 | Cloud synastry persistence: `src/parts-cartographer/core/cloud-storage.ts` L150-172 (save to `users/{uid}/connections/{partnerUid}` and `users/{uid}/synastry/{partnerUid}`), L174-195 (load, limit 50 at L180) | Stores the derived comparison from a redeemed code. | Implemented; no delete path | Relevant to H6. Retry is set-idempotent because IDs are fixed. |
| CMP-07 | Share and synastry overlay: `src/parts-cartographer/overlays.jsx` L187 (`SynastryOv`; handlers below it). Issued list L191-195 (filtered by uid at L192-195). Create L323-345 (linked user required at L325; explicit confirmation at L326; reset at L337). Revoke L347-362. Redeem L364-421 (linked required at L371; "unavailable or revoked" at L373; `setResult` L397; self-redeem check L399; cloud save L401; error copy L409, L414). AI narrative L290-318 (local save L306; cloud save L309; abort check L302). | UI state machine: busy flags, confirmation gate, abort controller, revocation. | Implemented | Reference for confirm, busy and revoke states. Failure copy is conflated (F1). |
| CMP-08 | Check-in observations: `src/parts-cartographer/screens/check-in.jsx` L22-25 (keys), L106-109 (`saveHistory`; local write, result not checked), L117-127 (`chooseEvent`), L128-161 (`recordCheckIn`; only guard is `arousal === null` at L129; `storeEvent('lapse')` L143; JITAI write L154; stage "done" L160), L163-171 (sealed verdict; write L168), L173-186 (charter; two writes at L176 and L178), L188-191 (if-then) | Records arousal, predicted part, confirmed part and an optional event. Sealed verdicts resurface after 48 hours. | Implemented | Closest "observation versus prediction" analogue. Reuse the prediction and confirmation record shape for contrary results. It is not a community record. |
| CMP-09 | Practice state: `src/parts-cartographer/screens/practice.jsx` L9 (key), L14-22 (load and normalize), L25-29 (check-in load), L66-70 (`synastryRun` from local lists), L79-97 (server assignments; L96 says the local flag is advisory), L121-124 (`saveState`), L126-130 (`markDone`), L150-165 (rehearsal timer writes the latest state) | Local progress and ladder. Therapist-only access is read from the server. | Implemented | Reuse the split rule: local flags are advisory; access comes from the server. |
| CMP-10 | State engine: `src/shared/core/data/state-v2.ts@3683b0f` L46-57 (`predictFlare`; runtime uses neutral weights), L65-83 (`adjustTriggerWeights`; no runtime caller), L143-152 (`verdictLockActive`), L154-171 (sealed verdicts, 48 hours, re-rating), L302-308 (`storeEvent`; key at L302), L312-315 (`loadEvents`), L368-385 (`shutdownStreak`, `pauseNonRegulation`; no runtime caller) | Engine used by the React check-in and the Angular panels. | Implemented; some exports dormant | Do not cite dormant parts as shipped. Reuse the 48-hour re-rating only as a precedent for contextual validity. |
| CMP-11 | Journal: `src/parts-cartographer/overlays.jsx` L1260-1290 (`Journal`), L1273-1276 (`persist`; write error swallowed), L1277-1284 (`save`; success toast at L1283), L1285 (`del`; no confirmation) | Private free-text entries (what, where, part, note) in `ifs.journal`. | Implemented | Not reused. It shows the false-success pattern (H5) and the no-undo delete (F2). |
| CMP-12 | Telemetry: `src/parts-cartographer/core/telemetry.ts` L1-24 | Local anonymized item distributions. Not synced. Not in the backup list. | Implemented | Not a community signal. Not reused. |
| CMP-13 | Sensory presets: `src/parts-cartographer/core/sensory-preferences.ts` L1-25 (presets still, gentle, lively; independent sound, texture and density); wired in `src/parts-cartographer/app.jsx` L9 and L169 | Quiet and reduced presentation controls. Key `ifs.sensory.v1` (L11), not in the backup list. | Implemented | Reuse for quiet or reduced presentation of any community surface. |
| CMP-14 | Auth lifecycle: `src/parts-cartographer/core/auth.service.ts` L41-49 (`persistUser`; directory sync for linked users), L51-57 (`offlineGuest`; `local_` uid when Firebase is unavailable), L81-91 (`anonymousBootstrap`), L93-109 (`signInGoogle`; link keeps uid at L99; "credential already in use" switches accounts at L104), L111-125 (`signInEmail`; link when mode is "up"), L127-139 (`linkAnonymous`), L141-148 (`signOut`: disables push at L144, signs out, removes `KEYS.auth` at L146) | Linking keeps the uid. Signing into an existing account changes it. Sign-out clears only the auth cache. | Implemented | Account-change rules must be specified in S02 (SC-03). Do not assume local state follows the account. |
| CMP-15 | Public identity directory: `src/parts-cartographer/core/user-directory.ts` L6-10 (`PublicUserProfile`), L34-47 (`syncPublicProfile`), L48 (`lookupByUid`), L71 (`lookupByEmail`); rules `firestore.rules` L310-324 | `publicProfiles/{uid}` holds email, `emailLower` and display name. Any signed-in principal can read it. The owner can delete it (L321). | Implemented | Do not reuse as discovery (H12). Lookup by email is a directory feature, not consent-scoped discovery. |
| CMP-16 | Therapist invite and summary: `src/parts-cartographer/core/therapist-link.ts` L1-12 (consent contract header), L43-64 (`toTherapistSummary`), L66-80 (`generateLinkCode`; 10 characters; crypto), L86-103 (`createTherapistLink`; see F5), L105 (claim), L143 (linked clients), L162 (archive), L174 (assign), L194 (`myAssignments`); rules `firestore.rules` L241-256 (`therapistLinks`) and L537-557 (`assignments`) | Bearer invite code whose document carries only the summary the client consented to. Therapist claim. Server-side assignments. | Implemented | Strongest existing consent-bound projection. Reuse the rule that the projection is fixed at creation. |
| CMP-17 | Booking grant: `src/parts-cartographer/core/booking.ts` L1-18 (header: `clientShares` as booking grant), L358-365 (comment), L366-422 (`createBooking`; `clientShares` write L400-410 with `source: 'booking'` at L408; `therapistClients` merge to L422); rules `firestore.rules` L441-470 (create needs an active appointment; client may delete at L466) | Event-bound grant to one therapist. Removed by the client. | Implemented | Pattern for an event-bound grant with a server check. The recipient is fixed to therapists. |
| CMP-18 | Backup export: `src/parts-cartographer/core/backup.ts` L10-18 (`BASE_KEYS`, `PORTABLE_KEYS`), L148-156 (`exportBackup` reads all portable keys) | Includes the synastry runs list (L15), journal (L12), check-ins (L14), charter (L10 and L15), events and practice (L15). Excludes `ifs.share.codes`, `ifs.auth`, `ifs.billing`, `ifs.sensory.v1` and `ifs.telemetry`. | Implemented | Export contents for any community data must be decided in S02 (H8). |
| CMP-19 | Resilience wrapper: `src/shared/core/adapters/resilience.ts@3683b0f` L6-10 (defaults: 10-second timeout, 3 retries), L13-38 (`withResilience`; retries any rejection, including writes; the timeout does not cancel the work), L69 (`isRetryableFailure`, not called by `withResilience`) | Wraps cloud reads and writes in the React app (cloud-storage, booking, therapist-link). | Implemented | Not safe as-is for non-idempotent community creates (H9). S02 must set an idempotency or retry rule per effect. |
| CMP-20 | Coach transport: `src/parts-cartographer/core/ai.adapter.ts` L89-100 (`callCloud`; offline check L95; 45-second timeout L100), L187-210 (`chatWithContext`; sends the last user message up to 4000 characters, up to 20 prior turns up to 4000 characters each, and selected part fields up to 400 characters each; degradation L199-205; heuristic fallback L207) | Authenticated cloud coaching with a local fallback. | Implemented | Reuse the offline and fallback shape. The request is an external disclosure (EF-07). Community content must not travel with it. |
| CMP-21 | Worker: `worker.ts` L172-174 (routes `/api/ai`, `/api/stripe-checkout`, `/api/stripe-verify`), L178 (`/api/gemini` returns 410), L185 (`handleAI`); `worker-security.ts` L30 (`verifyFirebaseIdToken`), L65 (`authenticateFirebaseRequest`), L162 (`checkRateLimit`) | No community or inquiry route. | Implemented | Community writes would need rules-only paths or new authenticated routes. Worker dispatch is broker-owned. |
| CMP-22 | Firestore rules: `firestore.rules` L15-17 (`isSignedIn`), L162-185 (`users/{uid}`; owner-only subtree), L198-216 (`pushTokens`), L226-239 (`shareCodes`), L241-256 (`therapistLinks`), L310-324 (`publicProfiles`), L441-470 (`clientShares`), L537-557 (`assignments`) | Authorization for every collection. | Implemented; broker-owned | Not edited by S01. Any community rule is a broker change. |
| CMP-23 | Angular storage port and adapter: `src/app/core/ports/storage.port.ts` L26-39 (`StoragePort`), L41 (`InjectionToken`); `src/app/core/adapters/firebase-storage.adapter.ts` L8-14 (`Math.random` generator), L95-107 (`createShareCode`; `setDoc` with no collision check; stores the full assessment), L109-125 (`loadSharedWithUid`; legacy fallback reads the owner-only assessment, which rules reject for cross-user reads) | A parallel Angular contract for share and synastry. | Implemented; divergent | Not the React contract. S03 must reconcile or bridge it (H11). |
| CMP-24 | Angular therapist metrics: `src/app/features/therapist-panel/therapist-panel.component.ts` L19 (import), L229 (`resistantMetrics(loadEvents())`) | Metrics from the viewing browser's event log. | Implemented | Not a consented client read. Do not cite as client observation evidence (F3). |
| CMP-25 | Consent text and noncausal labels: `src/parts-cartographer/i18n/strings.ts` L193 (`shareCodeConsent`, which says "signs in" and "You can revoke it here"), L206-208 and L213-214 (status messages), L360 (`cloudMapConsent`), L371-372 (therapist consent and agreement); `src/parts-cartographer/screens/scored-profile-synastry-report.jsx` L11 and `src/parts-cartographer/screens/legacy-synastry-report.jsx` L13 (caveats: "hypotheses"; "not a compatibility score, diagnosis, or prediction") | Consent wording and noncausal caveats in the UI. | Implemented | Reuse the wording pattern. The labels are UI text only; no data field carries them. |
| CMP-26 | Tests and CI: `src/parts-cartographer/core/cloud-storage.spec.ts` L15-27 (collision retry, legacy payload, validation); `src/app/core/data/state-v2.spec.ts` L51-61 (`adjustTriggerWeights`); `firestore.rules.emulator.spec.ts` L260-300 (share codes: owner, recipient, unauthenticated, listing denied, revoke, legacy); `firestore.rules.spec.ts` L63-67 (text assertions on the `shareCodes` rule); `.github/workflows/ci.yml` L36 (lint), L39 (unit tests), L48 (rules emulator), L54 (build), L57 (browser parity), L60 (Angular build) | The verification surface that exists. | Present; not run for this step | Baseline for S04 compatibility suites. No community suite exists. |
| CMP-27 | Planning and normative sources: see section 8 | Planning proposals and the AAA source snapshot. | [PLAN] | Proposals, not evidence. |

## 4. State inventory

| ID | State (key or document) | Location and owner | Written by | Read by | Cross-account behavior | Backup or export | Deletion and revocation |
|---|---|---|---|---|---|---|---|
| ST-01 | `ifs.share.codes` (`KEYS.share`) | Browser, owner's device | Create L333-336; revoke L353-354 (`src/parts-cartographer/overlays.jsx`) | `SynastryOv` L192-195 | Entries carry uid; the list is filtered by uid; not cleared at sign-out | Not in backup keys (`src/parts-cartographer/core/backup.ts` L10-18) | Entry removed after a successful cloud delete; capped at 20 (L335) |
| ST-02 | `shareCodes/{code}` | Server; owner uid | `createPrivateShareCode` (`src/parts-cartographer/core/cloud-storage.ts` L231-236) | `redeemCloudMapShareCode` (L254); any signed-in principal per rules (`firestore.rules` L227) | Bearer; no recipient scope | Not exported by the client | Owner delete (L236); no expiry field; payload keys are fixed (`firestore.rules` L80-113) |
| ST-03 | `users/{uid}/synastry/{partnerUid}` | Server; owner only (`firestore.rules` L179-181) | `saveCloudSynastry` (`src/parts-cartographer/core/cloud-storage.ts` L164-170) | `loadCloudSynastry` (L177-181) | Owner only | Not in client backup | No client delete path |
| ST-04 | `users/{uid}/connections/{partnerUid}` | Server; owner only (`firestore.rules` L175-177) | `saveCloudSynastry` (L159-163) | `loadCloudSynastry` | Owner only | Not in client backup | No client delete path |
| ST-05 | `INNERVERSE_SYNASTRY_RUNS_V1` | Browser | `rememberSynastryRun` (`src/parts-cartographer/overlays.jsx` L217-223; partner code up to 80 characters; capped at 50) | `src/parts-cartographer/screens/practice.jsx` L66-70 (chapter unlock) | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L15); see H8 | No deletion path; survives sign-out |
| ST-06 | `ifs.syn.connections` (`KEYS.syn`) | Browser | `src/parts-cartographer/overlays.jsx` L306 (result with AI narrative) | `SynastryOv` | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L10) | Overwritten; no delete |
| ST-07 | `INNERVERSE_CHECKINS_V1` | Browser | `saveHistory` (`src/parts-cartographer/screens/check-in.jsx` L106-109) | `src/parts-cartographer/screens/check-in.jsx` L30-31; `src/parts-cartographer/screens/practice.jsx` L25-29 | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L14) | No deletion in the app |
| ST-08 | `INNERVERSE_SEALED_VERDICTS_V1` | Browser | `sealCurrentVerdict` (`src/parts-cartographer/screens/check-in.jsx` L163-171); `rateResurfaced` (L111-116) | `src/parts-cartographer/screens/check-in.jsx` | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L14) | Re-rating overwrites the prior rating (F6) |
| ST-09 | `INNERVERSE_JITAI_V1` | Browser | `src/parts-cartographer/screens/check-in.jsx` L154 | `src/parts-cartographer/screens/check-in.jsx` L144 | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L14) | Timestamp only |
| ST-10 | `INNERVERSE_CHARTER_V1` and `ifs.charter` | Browser | `recordCharter` (`src/parts-cartographer/screens/check-in.jsx` L176 and L178; two writes) | `src/parts-cartographer/screens/check-in.jsx` | Not uid-scoped | Both portable (`src/parts-cartographer/core/backup.ts` L10 and L15) | No deletion; the two writes are not atomic |
| ST-11 | `INNERVERSE_EVENTS_V1` | Browser | `storeEvent` (`src/app/core/data/state-v2.ts` L304-308) | `loadEvents` (L312-315); Angular therapist metrics (CMP-24) | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L15) | No deletion in the app |
| ST-12 | `INNERVERSE_PRACTICE_V1` | Browser | `saveState` (`src/parts-cartographer/screens/practice.jsx` L121-124); rehearsal timer (L150-165) | `loadPracticeState` (L14-22) | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L15) | Local flags are advisory (L96); therapist link is read from the server (L97) |
| ST-13 | `ifs.journal` | Browser | `persist` (`src/parts-cartographer/overlays.jsx` L1273-1276) | `Journal` (L1263) | Not uid-scoped | Portable (`src/parts-cartographer/core/backup.ts` L12) | Immediate delete with no undo (F2) |
| ST-14 | `ifs.telemetry` (`KEYS.telemetry`) | Browser | `telemetry.record` | `telemetry.dump` | Not uid-scoped | Not portable | `telemetry.clear()` |
| ST-15 | `ifs.sensory.v1` | Browser | Sensory preference save (`src/parts-cartographer/app.jsx` L169 path) | `loadSensoryPreferences` | Not uid-scoped | Not portable | None |
| ST-16 | `ifs.auth` (`KEYS.auth`) | Browser | `persistUser` (`src/parts-cartographer/core/auth.service.ts` L42) | `currentUser` (L78) | Replaced at sign-in | Not portable | Removed at sign-out (L146) |
| ST-17 | `publicProfiles/{uid}` | Server; owner writes (`firestore.rules` L313-318) | `syncPublicProfile` (`src/parts-cartographer/core/user-directory.ts` L34-47) on linked sign-in | Any signed-in principal (`firestore.rules` L311) | Readable across accounts | Not exported | Owner delete (L321) |
| ST-18 | `therapistLinks/{code}` | Server | `createTherapistLink` (`src/parts-cartographer/core/therapist-link.ts` L86-103) | Claim (L105); rules L241-248 | Bearer | Not exported | Owner delete (`firestore.rules` L251) |
| ST-19 | `clientShares/{tUid}_{cUid}` | Server | `createBooking` (`src/parts-cartographer/core/booking.ts` L400-410) | Rules L441-446 (client or therapist) | Therapist-scoped | Not exported | Client delete (`firestore.rules` L466) |
| ST-20 | `assignments/{id}` | Server | `assignExercise` (`src/parts-cartographer/core/therapist-link.ts` L174) | `myAssignments` (L194); rules L537-546 | Client and therapist can read | Not exported | No update or delete (`firestore.rules` L555) |
| ST-21 | `users/{uid}/assessment/current` and `users/{uid}/history/*` | Server; owner (`firestore.rules` L162-172; therapist and admin read grants at L165-172) | `saveCloudMap` (`src/parts-cartographer/core/cloud-storage.ts` L90-93) | `loadCloudMapHistory` (L121-140) | Owner; therapist and admin read grants | Not exported by the client | Owner write allows delete, but no client path deletes (F4) |

**Deletion survey.** Every client `deleteDoc` or transaction delete in `src` (excluding specs): `src/parts-cartographer/core/cloud-storage.ts` L286 (`shareCodes`); `src/parts-cartographer/core/push.ts` L65 and L96 (`pushTokens`); `src/parts-cartographer/core/booking.ts` L354 (busy slot); `src/parts-cartographer/core/admin.ts` L76 and L126 (admin collections); `src/services/admin-access.service.ts` L53 (admin allowlist); `src/services/specialist-client.service.ts` L160 (`adminClients`). None targets `synastry`, `connections`, `history`, `assessment` or `therapistLinks` documents. No account-deletion call exists.

## 5. Effect inventory

Effect classes follow the AAA V7 source, section 9 (`docs/plans/references/AAA-V7-SPEC.source.md` L330-337): E0 pure, E1 read, E2 monotone write, E3 reversible write, E4 idempotent external, E5 irreversible external. The repository records no effect classes today; the classes below are this inventory's classification for S02 to confirm.

| ID | Operation (location) | Class | Identity and idempotency | Retry behavior | Compensation or inverse | Notes |
|---|---|---|---|---|---|---|
| EF-01 | Create map share code (`src/parts-cartographer/core/cloud-storage.ts` L224-246; `src/parts-cartographer/overlays.jsx` L323-345) | E2 | Random 12-character document ID; no client operation ID | `withResilience` wraps the transaction (L230); a retry after a committed attempt can create a second code (H9) [INF] | Owner delete, only if the code is known | Local record written after success (`src/parts-cartographer/overlays.jsx` L333) |
| EF-02 | Revoke map share code (`src/parts-cartographer/core/cloud-storage.ts` L282-287; `src/parts-cartographer/overlays.jsx` L347-362) | E2 at the server; copies already read by a recipient are beyond revocation (E5-like exposure) | Document ID is the code | `withResilience` (L286) | None; re-sharing creates a new code | Local entry removed only after success (`src/parts-cartographer/overlays.jsx` L353-354) |
| EF-03 | Redeem map share code (`src/parts-cartographer/core/cloud-storage.ts` L249-279; `src/parts-cartographer/overlays.jsx` L364-398) | E1 read of another owner's document | Single get | `withResilience` (L253) | None | Result is shown and the comparison is recorded locally (L397-398) before the cloud save (L401) |
| EF-04 | Save synastry result (`src/parts-cartographer/core/cloud-storage.ts` L150-172; `src/parts-cartographer/overlays.jsx` L399-412) | E2 set on fixed IDs | Fixed by `partnerUid`; set-idempotent | `withResilience` (L171) | None | Not atomic with the local write (`src/parts-cartographer/overlays.jsx` L306 versus L401); failure shows the load message (F1) |
| EF-05 | Save map snapshot and history (`src/parts-cartographer/core/cloud-storage.ts` L82-96) | E2 | History ID is generated once per call (L90), so a retry re-sets the same document | `withResilience` (L94) | None; history is append-only in practice | Allowlisted snapshot (L39-79) |
| EF-06 | AI synastry narrative (`src/parts-cartographer/overlays.jsx` L290-318; `src/parts-cartographer/core/ai.adapter.ts` `generateSynastryNarrative`) | External disclosure to a model provider. Candidate E5; S02 to confirm. | Abort controller (`src/parts-cartographer/overlays.jsx` L292, L302) | No retry in the component | None; text cannot be recalled from the provider | Summarized synastry metrics and computed summaries are sent (`summarizeSynastryForAi`, `src/parts-cartographer/overlays.jsx` L247 [CODE]) |
| EF-07 | Coach message (`src/parts-cartographer/core/ai.adapter.ts` L187-210; `callCloud` L89-100) | External disclosure to a model provider. Candidate E5. | Abort signal; 45-second timeout | None in `chatWithContext`; local fallback on error (L207) | None | Up to 20 prior turns and selected part fields are sent |
| EF-08 | Booking grant (`src/parts-cartographer/core/booking.ts` L366-422) | E2 transactional, with rule check (`firestore.rules` L441-470) | Busy-slot and appointment IDs | Transaction | Client delete of `clientShares` (L466) | Grant is bound to an appointment |
| EF-09 | Check-in record (`src/parts-cartographer/screens/check-in.jsx` L128-161) | E2 local append; `storeEvent` (E2); JITAI timestamp (E2) | No operation ID; guard is `arousal === null` only (L129) | None | None in the UI | Duplicate append possible on double activation [INF]; failure is silent (H5) |
| EF-10 | Charter record (`src/parts-cartographer/screens/check-in.jsx` L173-186) | E2 local; two non-atomic writes (L176, L178) | None | None | None | Partial write possible if the second write fails (quota error swallowed) |
| EF-11 | Sealed verdict and re-rating (`src/parts-cartographer/screens/check-in.jsx` L111-116, L163-171) | E2 local | None | None | Re-rating overwrites the prior rating (F6) | 48-hour resurfacing time set at creation (`src/app/core/data/state-v2.ts` L162-167) |
| EF-12 | Journal save and delete (`src/parts-cartographer/overlays.jsx` L1273-1290) | E2 local; delete has no inverse | None | None | None; delete is immediate (F2) | Failure reported as success (H5) |
| EF-13 | Push reminder enable or disable (`src/parts-cartographer/screens/check-in.jsx` push handlers; `src/parts-cartographer/core/push.ts` L32-99; rules L198-216) | Candidate E4; the token is the identity | Token document ID; delete by token (`src/parts-cartographer/core/push.ts` L96) | Not inspected in detail | Disable deletes the token | External delivery is not verified by this inventory |
| EF-14 | Directory sync on linked sign-in (`src/parts-cartographer/core/auth.service.ts` L41-49 to `src/parts-cartographer/core/user-directory.ts` L34-47) | E2 write to `publicProfiles` (email) | One document per uid | Best-effort; errors log a warning only (`src/parts-cartographer/core/auth.service.ts` L45-47) | Owner delete (`firestore.rules` L321) | Discloses email to any signed-in principal (H12) |
| EF-15 | Sign-in, link and sign-out (`src/parts-cartographer/core/auth.service.ts` L93-148) | Identity change; sign-in again reverses it (E3) | Firebase identity | Firebase SDK | Sign in again | Local state stays on the device (H4) |
| EF-16 | Therapist invite creation (`src/parts-cartographer/core/therapist-link.ts` L86-103) | E2 create of a bearer code | Random 10-character ID; read then write (F5) | None | Owner delete (`firestore.rules` L251) | Summary fixed at creation |
| EF-17 | Backup export (`src/parts-cartographer/core/backup.ts` L148-156) | E1 read plus a local file that leaves the browser | Not applicable | Not applicable | Not applicable | Contains H8 partner codes [INF] |

## 6. Mapping from the B12 scope to existing mechanisms

| Required behavior (from the B12 scope) | Nearest existing mechanism | Reuse status | Gap S02 must close |
|---|---|---|---|
| R-1 Voluntary observation record | CMP-08 check-in rows; CMP-11 journal | Pattern | No community record type; no contributor identity; no per-observation consent |
| R-2 Comparison with an expected outcome | CMP-08 predicted versus confirmed; CMP-10 `predictFlare` | Pattern | Predictions are model inferences and need provenance labels |
| R-3 Contrary result kept, not overwritten | CMP-08 "no" answers stored as `confirmedPart: null`; F6 re-rating | Partial | Re-rating overwrites; no history; contrary community results need retention rules |
| R-4 Contributor control: opt-in, edit, withdraw, delete | CMP-03 revoke; CMP-16 summary fixed at creation; CMP-17 client delete | Pattern | No per-contribution consent; derived copies survive (H6) |
| R-5 Noncausal labels | CMP-25 caveat wording | Pattern (UI text) | No data field carries the label; anecdote-to-cause risk not modeled |
| R-6 Public discovery by chosen fields | CMP-04 allowlist; CMP-16 summary | Pattern | The public identity directory (CMP-15) must not be used |
| R-7 Server-side recipient authority | Rules for `shareCodes`, `therapistLinks`, `clientShares` | Pattern | Bearer codes; anonymous principals (H7); no expiry; no revocation cascade |
| R-8 Quiet and declined paths without social debt | CMP-13 quiet presets; CMP-20 offline fallback; CMP-09 advisory flags | Partial | No social path exists; pause logic is dormant (H10) |
| R-9 Source and provenance | CMP-03 legacy `source` field (`src/parts-cartographer/core/cloud-storage.ts` L26); CMP-06 `shareCodeUsed`; CMP-16 | Partial | No lineage model for contributions; the consent.provenance module was absent at base d17aaa6 (H1). HEAD adds a memory module (`personal-memory.ts@3683b0f`, f3decec) that has no consent logic |

## 7. Scenario matrix

### 7.1 Required scenarios

| Scenario | Current behavior and evidence | Gap for community.inquiry | What S02 must specify |
|---|---|---|---|
| SC-01 Normal and denied grant | **Normal:** the owner confirms (`src/parts-cartographer/overlays.jsx` L326); a code is created (EF-01); the recipient redeems it (CMP-03), sees the snapshot and saves the synastry result (EF-04). **Denied:** listing is denied (`firestore.rules` L228); a malformed code is denied by rule (L227) and by the client regex (`src/parts-cartographer/core/cloud-storage.ts` L251); unauthenticated get is denied [TEST: `firestore.rules.emulator.spec.ts` L260-268]; self-redeem is skipped (`src/parts-cartographer/overlays.jsx` L399). | Bearer grants with no recipient scope, expiry or use limit (H7). Anonymous principals pass the rule [RULE-INF]. Revoked and missing codes return the same result (`src/parts-cartographer/core/cloud-storage.ts` L255; `src/parts-cartographer/overlays.jsx` L373). | Recipient identity, purpose, expiry, use limit, denial reasons, and the rule text for each. |
| SC-02 Stale contract | **Versioned tags exist:** map snapshot `parts-cartographer.v1` (`src/parts-cartographer/core/cloud-storage.ts` L21, L73); synastry `parts-cartographer.synastry.v1` (L165, L184-185). Legacy 64-answer payloads normalize through `fromDocument` (L98-108); invalid payloads return `null` (L109). Rules pin exact keys (`firestore.rules` L80-113), so a new field needs a rules change in the same release [INF]. The Angular payload has a different shape (`src/app/core/adapters/firebase-storage.adapter.ts` L95-107). | No versioned community payload and no unknown-version rule. Two generators and two share shapes coexist (H11). No compatibility fixtures for community payloads. | Version tag; unknown-version behavior (reject, not partial read); migration owner; rule pinning. |
| SC-03 Account change | Linking keeps the uid (`src/parts-cartographer/core/auth.service.ts` L93-107 for Google; L111-125 for email). Signing into an existing Google account switches uid (L104). Sign-out clears only `ifs.auth` (L141-148). Check-ins, synastry runs, journal, practice and share records are not uid-scoped; the issued-code list is the exception (`src/parts-cartographer/overlays.jsx` L192-195). The offline guest uses a `local_` uid (`src/parts-cartographer/core/auth.service.ts` L51-57), which is not a Firebase uid. | No account namespace for local community state. No migration of anonymous local state. No tombstones on account switch (H4). | Which state is account-scoped; what happens to local records on switch; what the server does with a guest uid. |
| SC-04 Deleted source | The owner's delete removes `shareCodes/{code}` (`src/parts-cartographer/core/cloud-storage.ts` L286). The recipient gets `null` (L255) [TEST: emulator L288-291 checks the post-delete read]. The UI shows the generic message (`src/parts-cartographer/overlays.jsx` L373, L409). Derived synastry and connections remain (ST-03, ST-04). No client path deletes them (H6). The owner's history cannot be deleted from the client (ST-21, F4). | No cascade or tombstone. Derived copies and exported backups survive revocation (H6, H8). | Cascade rule: which derived records are invalidated; how a recipient sees it; what is deleted versus retained for audit. |
| SC-05 Duplicate or cancelled operation | **Duplicate create:** busy flag and confirmation reset (`src/parts-cartographer/overlays.jsx` L323-337). **Duplicate synastry save:** fixed IDs (`src/parts-cartographer/core/cloud-storage.ts` L159-170). **Cancelled narrative:** the abort controller stops late results before they are saved (`src/parts-cartographer/overlays.jsx` L302). **Practice completion:** idempotent (`src/parts-cartographer/screens/practice.jsx` L126-130). **Check-in double activation:** only `arousal === null` is guarded (`src/parts-cartographer/screens/check-in.jsx` L129) [INF]. **Timed-out create then retry:** possible orphan code (H9) [INF]. **Cancelled cloud save:** Firestore calls are not aborted, so a save that reached the server stays [INF]. | No operation IDs on community writes. No create idempotency. The retry policy applies to writes (CMP-19). | Operation identity per effect (EF-01, EF-04, EF-09); retry class per effect; what a cancel means once a write has reached the server. |
| SC-06 Offline and quiet alternative | Coach falls back to a local heuristic when offline or on error (`src/parts-cartographer/core/ai.adapter.ts` L95, L207). Share, redeem and synastry have no offline path; a timeout surfaces after up to four attempts of 10 seconds (`src/app/core/adapters/resilience.ts` L6-10, L13-38). Local check-in and journal work offline, but failures are silent (H5). Quiet presentation exists (CMP-13). Pause logic is dormant (H10). Sharing a therapist summary requires explicit agreement (`src/parts-cartographer/i18n/strings.ts` L372), which is a consent gate, not a quiet alternative. The check-in can be completed without an event choice (`src/parts-cartographer/screens/check-in.jsx` L259). | No offline queue or deferred write for community; no quiet or no-social-debt path; no declined-invitation state. | Offline behavior per operation; what the user sees while waiting; the non-social completion path. |
| SC-07a Compatibility: interface | No port for community (CMP-01). React `STORAGE_PORT` differs from Angular `StoragePort` (CMP-23, H11). Cloud functions are free functions without a declared interface (`src/parts-cartographer/core/cloud-storage.ts`). | No published contract; no adapter boundary. | Interface, error union and versioning. |
| SC-07b Compatibility: state | Ownership is split: local (ST-01 to ST-15); server owner-only (ST-03, ST-04, ST-21); server bearer (ST-02, ST-18); server booking grant (ST-19). No tombstones. Derived state has no delete path. | Community state ownership is not declared. No migration path. | Owner per state key; migration and rollback rules; deletion propagation. |
| SC-07c Compatibility: effects | The repository records no effect classes (section 5 is the first classification). Several effects are external (EF-06, EF-07, EF-13, EF-14, EF-17). | No effect ledger; no effect identity for external writes. | Effect class and identity per operation. AAA section 9 requires an identity for E4 and E5 effects where the external system permits one. |
| SC-07d Compatibility: operations | CI runs lint, unit tests, the rules emulator, build, browser parity and the Angular build (`.github/workflows/ci.yml` L36-60). Errors are logged with `console.error` (`src/parts-cartographer/overlays.jsx` L340). Telemetry is local-only (CMP-12). | No observability or deployability record for community operations. | Logging with no personal content; a rules-test gate; a rollback path. |
| SC-07e Compatibility: performance | Timeouts: 10 seconds per attempt, 3 retries (`src/app/core/adapters/resilience.ts` L6-10); coach 45 seconds (`src/parts-cartographer/core/ai.adapter.ts` L100). Query limits: 20 history documents (`src/parts-cartographer/core/cloud-storage.ts` L128); 50 synastry documents (L180). Local arrays are parsed whole on each load (`src/parts-cartographer/core/local-store.ts` L16-19). No measured budget exists. | No declared SLO or page-size rule for community lists. | SLO per operation; page size; measurement on defined devices (not done here). |
| SC-07f Compatibility: failure semantics | Save failures can be silent (`src/parts-cartographer/core/local-store.ts` L22-24; journal L1273-1276; check-in L106-109). A save failure after a successful result is labeled as a load failure (`src/parts-cartographer/overlays.jsx` L409; F1). Revoked and unavailable codes look the same to the recipient (`src/parts-cartographer/overlays.jsx` L373). Retry can create duplicates (H9). | No failure taxonomy shared by UI and server. | Failure classes (denied, unavailable, stale, conflict, interrupted, offline); the user message for each; retry rules. |

### 7.2 State matrix for community.inquiry operations

The operations are: contribute an observation or comparison; read others' contributions; mark a contrary result; withdraw a contribution. Each cell names the nearest existing analogue. No community analogue exists for any cell.

| State | Nearest existing analogue | Gap S02 must close |
|---|---|---|
| Normal | Confirm, then create (`src/parts-cartographer/overlays.jsx` L323-345); result shown with saved state (L397-412) | No observation or comparison write path exists. |
| Unknown (unknown recipient, source, or eligibility) | Unknown code returns `null` (`src/parts-cartographer/core/cloud-storage.ts` L255); missing directory entry returns `null` (`src/parts-cartographer/core/user-directory.ts` L48-70) | An unknown source must not be displayed as absent or revoked. No unknown-source state exists. |
| Declined | Therapist sharing needs explicit agreement (`src/parts-cartographer/i18n/strings.ts` L372). The check-in can be skipped (`src/parts-cartographer/screens/check-in.jsx` L259). | No decline state for a community invitation or contribution. |
| Denied | Rule-level denials for share codes (`firestore.rules` L227-236). The UI requires a linked account (`src/parts-cartographer/overlays.jsx` L371). Self-redeem skipped (L399). | Denial is server-side only for share codes, and anonymous principals pass (H7). |
| Interrupted | `withResilience` timeout and retry (`src/app/core/adapters/resilience.ts` L13-38). AI abort (`src/parts-cartographer/overlays.jsx` L302). | No resumable operation. No state tells the user whether a write committed (H9). |
| Quiet | Sensory presets (CMP-13). Coach heuristic fallback (CMP-20). Pause logic is dormant (H10). | No quiet path for community; no no-debt rule. |

## 8. Source and data provenance

### 8.1 Read-set files (Bead metadata)

| File | SHA-256 | Lines | How read |
|---|---|---|---|
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` | 936 | Headings; sections 1, 3, 4, 5, 6, 16.2, 16.4 and 16.5 |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` | 121 | Full |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` | 190 | Full |
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` | 272,734 | Queried: B12 platform (line 269904), B12 nodes (B12.S01 at line 9095), feature and method entries, edges, counts |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` | 62 | Full |

### 8.2 Additional sources

| File | SHA-256 | How read |
|---|---|---|
| `docs/plans/social-creative-practice-beads-plan.md` | `9c079c78f0a778d89b92a2b50149678744be37279c50fee4791ff22f0e35d2d9` | Full |
| `docs/plans/creative-commons-beads-plan.json` | `e5751250e3729e5d45e9f56e0ad886346a3573943bab5e804625ebcc5b1823a1` | Queried (C08 at line 1689) |
| `docs/plans/creative-commons-beads-plan.md` | `f49ea73427a25e4313a4b3a728608a9238604ed93d3f33e603940284d48983db` | Read in part (C08 row) |
| `docs/plans/elevation-aaa-v7-beads-plan.json` | `88f5ffef002676450518f1cec4e526c9abf0452ecc5023d85613d3d00b39d82e` | Queried (C01 to C10, E05, E12, E13, E19, X02, slot streams, beads IDs) |
| `docs/plans/references/AAA-V7-SPEC.source.md` | `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc` (matches the pin in the AAA plan) | Sections 9 and 11C.2 |
| `.beads/issues.jsonl` (passive export) | `e6d2b38ac2c44bd1824c03847cdd9afc98e00284849effa21060d632780eb5a5` | 128 records; last commit `778f07df` dated 2026-10-04 |

The tracker export does not contain ArchetypeAI-7sj4, nje6, wq9i, cyqe, 4bs4, v2tj, the C08 reuse Beads (pxk9, 6nzhj, nsrho, ktaon, xwzgu, ot4ky), or the E05 and E19 streams (muh, or8b) that the social plan reuses. Their status is unknown in this step.

### 8.3 Source code and data

- Source citations are at git HEAD `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`. The worktree was clean when the step started.
- No user, participant, therapist or community data was read, created or copied.
- No share code, credential, email address or private record appears in this document. Identifiers in tests and fixtures are not reproduced.

## 9. Role, write and contract manifest

- **Role:** slot-owner (Bead metadata). This step does not act as producer, broker, verifier or publisher.
- **Write set:** `architecture/extension/development/b12/s01/b12-s01-inventory.md` (new). No other path is written.
- **Not touched:** `src/**`, `package.json`, lockfiles, `.github/workflows`, `firestore.rules`, shared locales, integration fixtures and worker files.
- **Contract versions consumed:** none. **Published:** none. **Proposed here:** none. S03 owns proposals.
- **Owned slots:** none claimed. The relationship to consent.provenance (H1) is noted, not claimed.
- **Capabilities used:** repository read; file write inside the write set; one git commit on the worktree branch. Not used: network, `bd`, push, deploy, emulator.
- **Leases:** none. Proposed paths are not leases. Base generation is null in the Bead and was not bound by a broker.
- **Predecessor graph:** none for S01 in the social JSON. S02 is the successor.

## 10. Checks

### 10.1 Run in this step

1. **Provenance.** `sha256sum` of every file in section 8. Values are recorded in those tables.
2. **Planning JSON against the Bead.** The social JSON parses. The B12 platform entry has name "Participant-led inquiries and contextual knowledge", scope `community.inquiry`, reuse `[C08]`, related `[B03, B08]`. For node B12.S01, the acceptance-criteria text is identical to the Bead after whitespace normalization (767 characters each). The read set and write set match the Bead, mutation is M0, risk is R2, reuse is `[C08]`, and base generation and contract versions are null and empty.
3. **Citation check.** A script asserted that each `path:line` citation in this document contains the cited token at that line. First pass: 256 checked, 11 failed. The draft was then corrected at nine citations (line offsets, one quote line in `docs/80-20-plan.md`, and one emulator line). Two checker entries that the draft does not cite were removed, and three checker tokens were aligned to the exact phrase on the cited line. Final pass: 254 of 254 match.
4. **Negative searches.** Concept names (inquiry, expedition, interest constellation, parallel play, creative jam, mini-game, community.inquiry, lineage) returned no implementation hits in `src`, `worker*.ts` or `firestore.rules`. `personal-memory` is the exception: it matches a module added at HEAD (commit f3decec), after the base.
5. **Runtime call sites.** Outside `src/app/core/data/state-v2.ts` and its spec, `adjustTriggerWeights`, `attributionWorsening` and `pauseNonRegulation` have zero call sites. `shutdownStreak` is called only by `pauseNonRegulation`. `resistantMetrics` is used only by the Angular therapist panel.
6. **Deletion survey.** Client delete calls are listed in section 4. None targets synastry, connection, history, assessment or therapist-link documents.
7. **Whitespace and characters.** `git diff --check` on the new file. The document contains no emoji.

### 10.2 Not run

- `npm run lint` (`tsc --noEmit`), `npm test`, `npm run test:rules`, `npm run build`, `npm run test:browser` and `npm run build:angular`. No code or configuration changed. `node_modules` is not installed in this worktree, and the rules emulator needs Firebase tools and a running emulator. No pass is claimed for any of them.

## 11. Limitations

- Static reading of the source at `d17aaa6` only. Every [INF] and [RULE-INF] item needs reproduction on a running build or in the emulator before any claim.
- Line numbers drift with any edit. S02 must re-verify them against its own base.
- Rule conclusions rest on the rule text, not on an emulator run.
- Live Bead status was not checked. `bd` is prohibited to this step. The tracker export predates the 2026-10-06 expansion, so the status of B12, C08 and the consent slot Beads is unknown here.
- The C08 target (H1) is an inference from namespace consistency and needs coordinator confirmation.
- `docs/80-20-plan.md` was read in selected sections, not in full. The AAA source was read only in sections 9 and 11C.2.
- The planning documents describe proposals. Their counts and statuses are not evidence.
- No independent review has occurred. This document is a candidate awaiting independent review.

## 12. Evidence status

| Evidence | Applicable at this step | Status |
|---|---|---|
| Source inventory and citations (this document) | Yes | Actual; pending independent review |
| Automated tests on changed boundaries | No code changed | Not run |
| Existing suites relevant to the inventory (rules emulator, cloud-storage, state-v2) | Context only | Present; not run |
| Participant observation | Not applicable to an inventory | Pending for later steps |
| Device or assistive-technology observation | Not applicable | Pending for later steps |
| Real service or live account check (Firebase, Worker, model provider) | Not applicable here; needed later for H6, H7, H9 | Pending |
| Community, tradition or practitioner review | Not applicable here; needed before any noncausal or source claim in later steps | Pending |
| Independent review of this inventory | Yes | Pending |

## 13. Rollback and undo

Document-only addition on the worktree branch. Roll back by reverting the commit or deleting `architecture/extension/development/b12/s01/`. No runtime behavior, data, rules or user-visible state changes.

## 14. Next handoff to B12.S02 (ArchetypeAI-wq9i)

S02 consumes sections 3 to 7 as its baseline, re-verified against its own base. S02 specifies authoritative state, grants and effects. It must record a decision on each of the following:

1. Owner of each community state (local, owner server, recipient server) and the rule for derived copies (H6).
2. Grant model: recipient, purpose, expiry, use limit, revocation cascade and tombstones (H7; SC-01; SC-04).
3. Whether anonymous Firebase principals may hold or redeem community grants (H7).
4. Account scoping of local observation and share state, and handling of guest uids (H4; SC-03).
5. Save-failure surfacing and a failure taxonomy (H5; SC-07f).
6. Operation identity and retry class for create, revoke, save and export (H9; EF-01 to EF-05; EF-17).
7. Effect class for the external disclosures EF-06, EF-07 and EF-17 (AAA section 9).
8. Quiet and declined paths with no social debt (SC-06; R-8).
9. Whether noncausal labels are data fields or copy (R-5).
10. Export contents for partner codes (H8).

**Open questions for the coordinator:**
- Confirm the C08 target (H1).
- Confirm the JSON edge convention (H13).
- Confirm whether the email exposure in the identity directory is intended (H12).
- Decide whether adaptive trigger weights (H10) should be wired or removed from claims.
- Check the live status of ArchetypeAI-4bs4 (consent audit), ArchetypeAI-v2tj, the C08 reuse Beads, and the E05 and E19 streams (muh, or8b) before S02 starts.

**Preconditions for S02:** a broker-bound immutable base; a resolved C08 target; a fresh lease; live Bead status.

## 15. Bead record draft

For the coordinator to record in ArchetypeAI-7sj4. This step did not change the tracker.

- **Artifact:** `architecture/extension/development/b12/s01/b12-s01-inventory.md` on branch `worktree-agent-a0865831b40acd04f`. Commit SHA: recorded in the step report.
- **Status:** candidate awaiting independent review. No acceptance claim.
- **Checks:** provenance hashes; planning JSON consistency; citation check; negative searches; call-site counts; deletion survey. Not run: lint, unit, rules emulator, build, browser parity, Angular build.
- **Base and contracts:** observed HEAD `d17aaa6`; base generation null; no contract published or consumed.
- **Limitations:** section 11.
- **Rollback:** revert the commit or delete the directory.
- **Next handoff:** ArchetypeAI-wq9i (B12.S02), per section 14.
- **Evidence:** all participant, device, live-service, community, tradition, practitioner and independent-review evidence is pending.
