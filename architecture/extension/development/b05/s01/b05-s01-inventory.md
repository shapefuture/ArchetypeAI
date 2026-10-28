# B05.S01 inventory: notification policy, scheduling and delivery
<!-- cite-ref: d17aaa6 -->
<!-- cite-external: dist/sw.js -->

> **Independent review (2026-10-16).** Round 1 at `42116d6`: FAIL, because the quiet-hours absence was false for the in-app note. Round 2 at `b36bde2`: FAIL. Round 3 at `930edc1`: FAIL. The §13 set of five files gave 47 under the candidate's run and 48 at HEAD, and my earlier "37" set was a guess, now removed. The reminder settings screen also has a configurable quiet-hours control (`src/parts-cartographer/screens/reminder-settings.jsx:16@3683b0f`, `:35`), which the body does not mention. All five spec paths exist at base d17aaa6. Status is still **candidate, not accepted**; re-review is required.

**Status: candidate awaiting independent review.** This file records what the code, documents and local unit checks show. It is not an acceptance claim. No participant, device, real-service, live-account, practitioner or independent-review evidence was collected. No `bd` command was run and no Beads status was changed; the coordinator owns the tracker.

Evidence tags used below:

- **[T]** exercised by an existing unit test (run for this inventory, see section 13).
- **[S]** static reading of the code or rules; not executed.
- **[D]** stated in a repository document; not re-verified here.
- **[X]** lives outside this repository (for example the notification sender); cannot be inspected.
- **[P]** pending real-device, real-service or independent evidence.

| Field | Value |
|---|---|
| Bead | `ArchetypeAI-k2bk` (B05.S01); parent epic `ArchetypeAI-lzmk` (B05); planning Bead `ArchetypeAI-cyqe` |
| Next Bead | `ArchetypeAI-uffz` (B05.S02, authoritative state, grants and effects) |
| Slot | `notification.delivery`. Proposed in `docs/plans/social-creative-practice-beads-plan.json`. No implementation, port or contract for it exists in this checkout. |
| Role / risk / mutation | slot-owner (inventory) / R2 / M0 |
| Immutable base | Not bound by a broker (`base_generation: null`). Observed worktree HEAD `09194df5f48326bff14e42a1e4eb8d66c457186d`, branch `worktree-agent-aaa4d8ae9b4a1157d`, clean before this file was added. |
| Inventory date | 2026-10-15 |
| Source reference | AAA v7.1.0 draft normative specification; pinned SHA-256 `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc` (as recorded in the social plan JSON `baseline`); in-repo snapshot `docs/plans/references/AAA-V7-SPEC.source.md`, git blob `2eb18f3f7725`. |

## 1. Summary

- The repository has no `notification.delivery` slot, port, versioned contract, sender, scheduler, per-stream preference, or delivery ledger, and no quiet-hours rule applied to delivery. Quiet hours do exist for the in-app due-task note: `reminderDecision` in `src/parts-cartographer/core/reminder-policy.ts@3683b0f` (quiet check at line 74; HEAD 3683b0f only) is called from `src/parts-cartographer/app.jsx:355` (HEAD 3683b0f only). What exists is one opt-in Firebase Cloud Messaging (FCM) "daily check-in" reminder: a client token registry in Firestore, a service worker that displays background messages, and timing rules that run only while the app is open.
- "Enabled" is decided on the device: a localStorage token plus browser permission (`src/parts-cartographer/core/push.ts:24-29`). It is never reconciled with the Firestore registry or with the FCM token's validity.
- Withdrawal (`disablePushReminder`) runs from the check-in Disable button (`src/parts-cartographer/screens/check-in.jsx:196`) and from the React `src/parts-cartographer/core/auth.service.ts` `signOut` (`src/parts-cartographer/core/auth.service.ts:144`). No production caller of that `signOut` was found. Angular logout and direct account switches leave the token owned by the previous Firebase uid. (N-03)
- Every failure and every refused or dismissed prompt is reported as `denied`, and the React button is disabled for the rest of the session (`src/parts-cartographer/screens/check-in.jsx:329-331`). (N-04)
- The local nudge fallback exists in both React and Angular code but has no runtime caller. Its unit tests pass, but the product cannot reach it. (N-06)
- Real background delivery, the sender, and the VAPID key rotation are unverified. A key-exposure incident is recorded in `docs/push-key-rotation.md`. (N-16, N-20)
- Checks: §13 records 47 passing tests across five spec files (`src/parts-cartographer/core/push.spec.ts` 5, `src/services/push.service.spec.ts` 2, `src/parts-cartographer/core/backup.spec.ts` 8, `firestore.rules.spec.ts` 8, `src/app/core/data/state-v2.spec.ts` 24), reported with vitest 3.2.7 at base d17aaa6. The 5 files and 47 are the candidate's own record; this review re-ran the same five files at commit `930edc1` with vitest 4.1.12 and got **48 passing**. Both results are recorded and neither is a regression.

## 2. Reuse reconciliation: packages C01 and C08

The B05 metadata names reuse packages `C01` and `C08`. The social plan builder (`scripts/planning/build-social-creative-practice-plan.py:156`) takes them from the elevation graph `docs/plans/elevation-aaa-v7-beads-plan.json`, where they are the slot-migration epics for `auth.identity` and `consent.provenance`. The label `C01` also names an unrelated package in `scripts/planning/build-creative-commons-plan.py:15` ("Connected public threads"), and `C08` names another one at line 50 ("Cross-circle expeditions"). Neither is used here.

| Package | Resolved meaning (elevation graph) | Seam named by the plan | Stream and publication Beads (planning map) | Present in this checkout | What B05.S01 can reuse now |
|---|---|---|---|---|---|
| C01 | `[C01] Slot migration: Auth identity and account lifecycle`, slot `auth.identity` | `src/parts-cartographer/core/auth.service.ts` | stream `ArchetypeAI-zzmm`; contract step `ArchetypeAI-bgdg` (C01.S02); publication `ArchetypeAI-7253` (`docs/plans/aaa-v7-architecture-and-agent-sweeps.md:73`) | Seam file present (148 lines). No published contract: `architecture/` does not exist in the tree and the B05 metadata lists `contract_versions: []`. | Conceptual only. The notification-relevant hook (withdraw before sign-out) is a React-only function outside `AUTH_PORT` (`src/parts-cartographer/core/ports.ts:6-13`). There is no published version to depend on. |
| C08 | `[C08] Slot migration: Consent, source lineage and corrections`, slot `consent.provenance` | `src/parts-cartographer/core/personal-memory.ts@3683b0f` | stream `ArchetypeAI-v2tj`; contract step `ArchetypeAI-abz4` (C08.S02); publication `ArchetypeAI-9q4d` (`docs/plans/aaa-v7-architecture-and-agent-sweeps.md:80`) | **Seam file absent** (not tracked by git). Consent-like code exists elsewhere, for example share-code revocation in `src/parts-cartographer/core/cloud-storage.ts:281-287`, but not as a slot. | Conceptual only. The push opt-in is a device boolean (token presence), not a consent record with provenance. |

Read-set files named in the B05.S01 metadata:

| Read-set file | Status | Used for |
|---|---|---|
| `docs/80-20-plan.md` | exists (936 lines) | Timezone contract (L66), reminder rules (L484), Quiet mode (L530), data/sharing row (L729) |
| `docs/plans/first-principles-elevation-beads.md` | exists (121 lines) | Step pattern and dispatch rules |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | exists (190 lines) | Slot streams and publications (L73, L80); "Observed starting point" (React is the active surface, Angular is retained) |
| `docs/plans/social-creative-practice-beads-plan.json` | exists | B05 platform entry; B05.S01 to S10 nodes; B05 consumers F10, F11, F17 to F21, F25, F32; Beads ID mapping |
| `src/parts-cartographer/core/ports.ts` | exists (62 lines) | Port inventory: AUTH (L6), STORAGE (L15), AI (L24), BILLING (L35). No notification port. |

## 3. Component inventory

Surfaces: **React** is `src/parts-cartographer/**` (active). **Angular** is `src/app/**` (retained, per the parity plan).

| ID | Component | Location | Surface | Runtime status |
|---|---|---|---|---|
| C-1 | React push module: `currentPushState`, `enablePushReminder`, `disablePushReminder`, `maybeShowLocalCheckInNudge` | `src/parts-cartographer/core/push.ts` (115 lines) | React | Wired to the check-in screen and to `auth.signOut`. The nudge function is unwired (N-06). |
| C-2 | Reminder control on the check-in screen | `src/parts-cartographer/screens/check-in.jsx:72-84` (state), `:194-205` (request/withdraw), `:329-339` (button and notice) | React | Mounted through `src/parts-cartographer/app.jsx:342` (`case 'checkin'`). |
| C-3 | Foreground message bridge | `src/parts-cartographer/app.jsx:82-86` (`ifs:push-message` listener shows a toast) | React | Wired. |
| C-4 | Angular push service: `currentState`, `enable`, `maybeLocalNudge` | `src/services/push.service.ts` (75 lines) | Angular | `currentState()` is called from the panel constructor (`src/app/features/checkin-panel/checkin-panel.component.ts:238-240`). `enable()` has no template binding. |
| C-5 | Angular toggle state and method | `src/app/features/checkin-panel/checkin-panel.component.ts:235-245` | Angular | Present in the class. `src/app/features/checkin-panel/checkin-panel.component.html` (105 lines) has no reminder control. (N-19) |
| C-6 | FCM service worker (background messages) | `src/firebase-messaging-sw.js` (27 lines), registered at scope `/fcm/` by `src/parts-cartographer/core/push.ts:44-47` and `src/services/push.service.ts:52` | Both | Wired on enable. |
| C-7 | App-shell worker, Angular source | `src/sw.js` (88 lines); copied to `dist/sw.js` via `angular.json` assets; stamped by `scripts/stamp-sw.mjs`; registered at `/sw.js` by `src/index.html:133-150` | Angular build | Wired. No `push` or `notificationclick` handler. <!-- cite-ids: none --> |
| C-8 | App-shell worker, React source | `public/sw.js` (60 lines); stamped by `scripts/stamp-parts-cartographer-sw.mjs`; registered at `/sw.js` by `src/parts-cartographer/main.jsx:23-27` (production only) | React build | Wired. No `push` or `notificationclick` handler. <!-- cite-ids: none --> |
| C-9 | Firestore rules for the token registry | `firestore.rules:198-216` | Server | Deployed with the project. Owner-bound writes; client reads denied. |
| C-10 | Rules tests | `firestore.rules.spec.ts:47-54` (static text assertions); `firestore.rules.emulator.spec.ts:245-258` (emulator) | Test | Static spec run in section 13. Emulator spec not run. |
| C-11 | Logout hook for withdrawal | React `src/parts-cartographer/core/auth.service.ts:141-147`; Angular `src/app/core/adapters/firebase-auth.adapter.ts:90-92` (no hook); Angular logout `src/app.component.ts:1331-1336` | Both | React hook has no production caller (N-03). Angular has none. |
| C-12 | Backup allowlist | `src/parts-cartographer/core/backup.ts:10-18` (`BASE_KEYS`, `PORTABLE_KEYS`); push keys not listed | React | Excludes the token (positive, see N-14). |
| C-13 | In-app timing rules | `src/shared/core/data/state-v2.ts:84-91@3683b0f` (HEAD) (day helpers), `:136@3683b0f` (`sameLocalDay`), `:143-152@3683b0f` (verdict lock), `:162-171@3683b0f` (48-hour seal and resurfacing), `:239-241@3683b0f` (24-hour card cap) | Shared | Used by `src/app/features/checkin-panel/checkin-panel.component.ts:76-103, 138-146` and imported by `src/parts-cartographer/screens/check-in.jsx:17`. |
| C-14 | Port layer | `src/parts-cartographer/core/ports.ts` (AUTH, STORAGE, AI, BILLING); `src/app/core/ports/auth.port.ts, src/app/core/ports/ai.port.ts, src/app/core/ports/storage.port.ts` | Both | No notification port on either surface. (N-17) |
| C-15 | Worker (Cloudflare) | `worker.ts:168-180`: routes `/api/ai`, `/api/stripe-checkout`, `/api/stripe-verify`, `/api/gemini`. No `scheduled` export. | Server | No notification route, scheduled handler or sender. <!-- cite-ids: none --> |
| C-16 | Sender and scheduler | Not in repository: no `functions/` directory, no cron in `wrangler.toml` or `wrangler.api.toml`. `src/services/push.service.ts:3-6` says the sending side (a scheduled function) "is the only deploy-time step left". | External | [X] Owner and deployment status unknown. |
| C-17 | Configuration | `src/environments/environment.ts:9` and `src/environments/environment.prod.ts:10` (public VAPID key); Firebase client config duplicated in `src/firebase-messaging-sw.js:5-12`. Values are not reproduced here. | Both | Duplicated config is a drift risk (N-09). |
| C-18 | Hosting | `firebase.json` `hosting` array: two targets (`archetype-ai-3e43b`, `innerverseai`), both serving `dist`. | Deploy | Both targets receive whichever `dist/sw.js` was built last (N-09). |

## 4. State inventory

Authority classes: **local** (this browser profile), **server** (Firestore or other backend), **external** (browser, FCM or Firebase Auth), **derived** (recomputed from other state).

| ID | State | Location | Authority | Written by | Read by | Cleared on sign-out? | In portable backup? | Notes |
|---|---|---|---|---|---|---|---|---|
| S-1 | Browser notification permission | `Notification.permission` | external | browser prompt (`src/parts-cartographer/core/push.ts:37-40`, `src/services/push.service.ts:38-39`) | `push.ts:26, 34, 103`; `push.service.ts:28, 67` | not applicable | not applicable | The app cannot reset a refusal. |
| S-2 | FCM registration token | Firebase Messaging store (not readable by app code) | external (device) | `getToken` (`src/parts-cartographer/core/push.ts:57`, `src/services/push.service.ts:44`) | `getToken` | not cleared by the app | not applicable | Removed only by `deleteToken` (`src/parts-cartographer/core/push.ts:97`). |
| S-3 | Local enabled marker | localStorage `INNERVERSE_PUSH_TOKEN_V1` (`src/parts-cartographer/core/push.ts:3`, `src/services/push.service.ts:16`) | local (derived cache) | React after the registry write (`src/parts-cartographer/core/push.ts:71`); Angular before it (`src/services/push.service.ts:55`) | `push.ts:27, 88`; `src/services/push.service.ts:29` | React: removed by withdrawal (`src/parts-cartographer/core/push.ts:98`). Angular: never removed. | excluded | Not per-account. Presence alone means "enabled" (N-02). |
| S-4 | Server token registry | Firestore `pushTokens/{token}` = `{token, uid, createdAt}` (`src/parts-cartographer/core/push.ts:66-70`, `src/services/push.service.ts:56-58`) | server | owner only (`firestore.rules:200-215`) | sender, not in repo [X] | deleted by withdrawal (`src/parts-cartographer/core/push.ts:96`) and by rotation (`src/parts-cartographer/core/push.ts:65`); no account-deletion cleanup (N-15) | not applicable | The only server-side opt-in record. Schema fixed by rules (no version field). |
| S-5 | Last-nudge timestamp | localStorage `INNERVERSE_PUSH_LAST_NUDGE_V1` (`src/parts-cartographer/core/push.ts:4`) | local (dedupe) | `src/parts-cartographer/core/push.ts:110` | `src/parts-cartographer/core/push.ts:107` | not removed | excluded | Written and read only by unwired code (N-06). |
| S-6 | Check-in history | localStorage `INNERVERSE_CHECKINS_V1` | local (canonical for check-ins) | check-in panel | check-in panel; staleness input for the unwired nudge | not removed | included (`src/parts-cartographer/core/backup.ts:14`) | |
| S-7 | Sealed verdicts | localStorage `INNERVERSE_SEALED_VERDICTS_V1` | local | `sealVerdict` (`src/app/core/data/state-v2.ts:162-167`) | `src/app/features/checkin-panel/checkin-panel.component.ts:138-146` | not removed | included | `resurfacesAt` is an absolute instant, exactly +48 hours (`src/app/core/data/state-v2.ts:158`). |
| S-8 | Last card time | localStorage `INNERVERSE_JITAI_V1` | local | `src/app/features/checkin-panel/checkin-panel.component.ts:100-101` | `selectJitaiCard` cap (`src/app/core/data/state-v2.ts:240`) | not removed | included | 24-hour cap, absolute. |
| S-9 | Notification preferences: streams, quiet hours, digest, budget, pause, delivery timezone | none | absent | none | none | not applicable | not applicable | Gap for F19, F20 and F21 and for 80-20 plan L530. (N-11) |
| S-10 | Delivery receipts, send log, effect ledger | none | absent | none | none | not applicable | not applicable | No `effect_id`, `EffectIntent` or `EffectCommitted` (AAA section 9.1). |
| S-11 | Account identity | Firebase Auth `currentUser.uid`; local mirror `KEYS.auth` (`src/parts-cartographer/core/auth.service.ts:40-48`) | external / local mirror | `persistUser` | `src/parts-cartographer/core/push.ts:53`; `src/services/push.service.ts:42` | Angular sign-out path removes the Firebase session but not S-3 (N-03) | not applicable | Token binding is by uid. |

## 5. Effect inventory

Classes follow AAA v7.1 section 9 (E0 pure to E5 irreversible external). These are proposed classifications for B05.S02 to confirm, not accepted ones.

| ID | Effect | Target | Proposed class | Idempotency or dedupe identity | Cancellation or undo | Failure handling today |
|---|---|---|---|---|---|---|
| E-1 | Browser permission prompt | browser | user-mediated (browser stores the decision) | none; re-asking is blocked after refusal | user changes browser settings only | non-`granted` result becomes `denied` (`src/parts-cartographer/core/push.ts:40`, `src/services/push.service.ts:39`) (N-04) |
| E-2 | Register service worker, scope `/fcm/` | browser registry | E3 (reversible in principle) | scope string | no app-level unregister | throw becomes `denied` (`src/parts-cartographer/core/push.ts:80-83`) |
| E-3 | `getToken` (FCM) | FCM backend | E4 (VAPID-bound, returns a token) | token value | `deleteToken` only | throw becomes `denied` |
| E-4 | `setDoc pushTokens/{token}` | Firestore | E4 (keyed write; document id is the token) | document id | overwritten by a later enable; no timeout | throw becomes `denied`; Angular has already stored S-3 (N-05) |
| E-5 | `deleteDoc` of the previous token during rotation | Firestore | E4 (keyed delete) | previous token | not transactional with E-4 | throw becomes `denied` after the new token is minted but before it is stored (N-05) |
| E-6 | `deleteDoc` on withdrawal | Firestore | E4 | token | not transactional with E-7 or S-3 removal | throw propagates to a toast (`src/parts-cartographer/screens/check-in.jsx:197`) <!-- cite-ids: none --> |
| E-7 | `deleteToken` on withdrawal | FCM | E4 | token | a deleted token must be re-minted | throw propagates; S-3 remains (N-05) |
| E-8 | localStorage writes (S-3, S-5) | local | E3 | key | removal (S-3 in React only) | writes inside `try` in `src/parts-cartographer/core/push.ts`; unguarded in `src/services/push.service.ts:55` |
| E-9 | Foreground toast | UI | E0 | none | dismissed by the toast | none |
| E-10 | Background display (`showNotification`) | OS or browser, user-visible | E5 (cannot be recalled by the app) | `tag: 'innerverse-daily'` replaces a same-tag notification; this is not occurrence identity (N-07) | none: no `notificationclick` handler (N-08) | none |
| E-11 | Foreground `new Notification` (nudge) | page, user-visible | E5 (unwired) | same constant tag; 20-hour cap in S-5 | none | returns `false` on error (`src/parts-cartographer/core/push.ts:112-114`) |
| E-12 | Server send (sender) | FCM, from outside the repo | E5 | **none in repo**: no send id, ledger or effect id | none in repo | [X] unknown |

## 6. Local decisions and timing rules

| Decision | Current rule | Location | Clock and timezone basis | Dedupe or cap | Quiet or suppression | Tests |
|---|---|---|---|---|---|---|
| Opt-in state | permission `granted` and S-3 present means `enabled`; otherwise `ready`, `denied` or `unsupported` | `src/parts-cartographer/core/push.ts:24-29`; `src/services/push.service.ts:23-31` | none | none | none | [T] `push.spec.ts:96-108, 110-114` |
| Stale check-in nudge | last check-in at least 20 hours old | `src/parts-cartographer/core/push.ts:104`; `src/services/push.service.ts:68` | `Date` arithmetic; no zone | 20-hour gap in S-5 | none | [T] for the function only (`src/parts-cartographer/core/push.spec.ts:125-132`); not wired (N-06) |
| Verdict resurfacing | sealed verdict becomes due 48 hours after sealing; evaluated on panel load | `state-v2.ts:158, 162-171`; `src/app/features/checkin-panel/checkin-panel.component.ts:138-146` | absolute interval; no zone | per verdict | none | [T] `src/app/core/data/state-v2.spec.ts:116-122` |
| Verdict lock | a hyper or shutdown check-in today, or 00:00 to 05:00 after such a day | `src/app/core/data/state-v2.ts:143-152` | device local day (`src/app/core/data/state-v2.ts:86-88`, `:136`) | none | this gates writing a verdict, not delivery | [T] `src/app/core/data/state-v2.spec.ts:106-115` |
| Card cap | at most one card per 24 hours | `src/app/core/data/state-v2.ts:239-241` | absolute | 24-hour gap in S-8 | none | [T] `src/app/core/data/state-v2.spec.ts:153-156` |
| Quiet hours for delivery | none | not present | not applicable | not applicable | none | not applicable (N-11) |
| Delivery timezone | none; the device clock is used implicitly | not present | device clock | not applicable | not applicable | not applicable |
| Daylight-saving behaviour | day differences are anchored on local midnights (`src/app/core/data/state-v2.ts:90-91`) | `src/app/core/data/state-v2.ts:90-91` | local midnight parse | not applicable | not applicable | no DST-boundary assertions in `src/app/core/data/state-v2.spec.ts` (N-12) |

The booking flow identifies the device clock and keeps naive wall-clock appointment times (`docs/react-vite-angular-parity.md:34`). `docs/80-20-plan.md:66` requires a versioned instant plus IANA zone contract before cross-timezone scheduling. That contract does not exist, so any reminder tied to an appointment cannot yet rely on it.

## 7. Ownership matrix (the B05 scope questions)

| Question | Current owner | Where | Gap for B05 |
|---|---|---|---|
| Local decision versus external delivery | not separated. The React and Angular modules mix permission, token issuance, registry writes and display. | `src/parts-cartographer/core/push.ts`, `src/services/push.service.ts` | Need a pure decision layer and a delivery adapter (S02, S05). |
| Device authority | the browser profile, through S-2 and S-3; the server registry (S-4) is not reconciled with it | S-2 to S-4 | Need a stated authority and reconciliation rule (N-02). |
| Quiet hours for delivery | none | not present | New work (N-11). The in-app due-task note has a quiet check (`reminder-policy.ts:74@3683b0f`, HEAD 3683b0f only). |
| Timezone | device clock, implicitly | `src/app/core/data/state-v2.ts` | Need a stored policy and DST semantics (N-12). |
| Dedupe | constant display tag; per-device 20-hour cap that is unwired; token-keyed document | E-10, S-5, S-4 | Need occurrence-level identity and a send ledger (N-07, S-10). |
| Cancellation | token withdrawal only; cancellation of queued sends has no mechanism because no sends are scheduled in repo | `src/parts-cartographer/core/push.ts:87-99` | Need an external sender contract and a send-cancellation path (B05.S03, S05). |
| Recipient authority | uid binding in rules; client cannot read the registry | `firestore.rules:198-216` | Positive. Need server-side enforcement in the sender [X]. |

## 8. Scenario matrix

Each finding ID (N-xx) is defined in section 10. Status values: **specified** (static only), **exercised** (an existing unit test covers the path, with mocks), **gap** (no evidence and no code), **pending** (needs a device, real service or independent check).

### 8.1 Normal and denied grant

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| Normal grant | prompt (if `default`), SW registration at `/fcm/`, `getToken`, registry write, marker, foreground listener, `enabled` (`src/parts-cartographer/core/push.ts:32-84`) | [T] `src/parts-cartographer/core/push.spec.ts:96-108` (mocked SDK) | exercised with mocks; device delivery pending [P] |
| Rotation of the token | previous document is deleted when the local marker differs from the new token (`src/parts-cartographer/core/push.ts:64-65`) | [T] `src/parts-cartographer/core/push.spec.ts:84-95` | exercised; non-atomic (N-05) |
| Browser already refused | `denied`; button disabled and notice shown (`src/parts-cartographer/core/push.ts:26`; `src/parts-cartographer/screens/check-in.jsx:329-339`) | [T] `src/parts-cartographer/core/push.spec.ts:110-114` | exercised |
| Refused or dismissed at the prompt | `requestPermission` result is not `granted`, so `denied` is returned (`src/parts-cartographer/core/push.ts:40`, `src/services/push.service.ts:39`). The button stays disabled until reload. A dismissal leaves the browser at `default`, so after reload the state is `ready`. | the spec's `requestPermission` mock always resolves `granted` (`src/parts-cartographer/core/push.spec.ts:52`) | specified (static); gap (N-04) |
| Granted, but no Firebase user | `requestPermission` runs first, then `if (!user) return 'denied'` (`push.ts:37-40, 53-54`); the browser holds a grant, the app records none | none | specified (static); gap (N-04) |
| Granted, then refused in browser settings later | `denied`; S-3 and S-4 remain, and nothing removes them | none | gap (N-02) |

### 8.2 Stale contract

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| VAPID key rotation | client keys are in `src/environments/environment.ts` and `src/environments/environment.prod.ts`. The rotation doc requires migrating opted-in subscriptions, tracking a key version beside the token, and preserving opt-out (`docs/push-key-rotation.md:40-48`). None of that is in code. | none | pending [P]; incident open (N-16) |
| Registry schema | `hasOnly(['token','uid','createdAt'])` (`firestore.rules:200-214`). A new field requires a rules change plus both clients plus the sender. | [T] static `firestore.rules.spec.ts:47-54` | gap (N-13) |
| Two app-shell workers at `/sw.js` | `public/sw.js` uses cache prefix `parts-cartographer-` (L2-3); `src/sw.js` uses `innerverse-` (L16-17). Each build writes `dist/sw.js`, so the deployed worker depends on the last build. | none | gap (N-09) |
| Duplicated Firebase client config | `src/firebase-messaging-sw.js:5-12` repeats the environment values and is not generated | none | gap (N-09) |
| Client divergence | Angular enable does not delete a rotated token (`src/services/push.service.ts:55-58`) and has no withdrawal | none | gap (N-19) |
| Sender contract | absent from this repo; any payload or field expectation is external | none | [X] unknown |

### 8.3 Account change

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| React sign-out via `auth.signOut` | withdraws first (`src/parts-cartographer/core/auth.service.ts:143-144`). No production caller found. | [T] withdrawal itself (`src/parts-cartographer/core/push.spec.ts:116-123`); the sign-out ordering is untested | specified; no caller (N-03) |
| Angular logout | `logoutToIntro` calls `signOut` (`src/app/core/adapters/firebase-auth.adapter.ts:90-92`) with no withdrawal. S-3 survives; S-4 keeps the old uid. | none | gap (N-03) |
| Direct sign-in as another account | `signInGoogle` and `signInEmail` call Firebase sign-in without withdrawal (`auth.service.ts:93-109, 111-126`). The new account reads `enabled` (`src/parts-cartographer/core/push.ts:27`). "Disable" then runs `deleteDoc` on a document owned by the old uid, which rules deny (`firestore.rules:215`). The button shows its error toast (`src/parts-cartographer/screens/check-in.jsx:195-198`). | none; rules logic only [S] | gap, hypothesis to verify (N-03) |
| Anonymous to existing account (fallback) | after `credential-already-in-use`, `signInWithPopup` switches uid with no withdrawal (`src/parts-cartographer/core/auth.service.ts:101-107`) | none | same as above |
| Anonymous to linked | `linkWithPopup` and `linkWithCredential` keep the uid (`auth.service.ts:97-100, 116-118`), so ownership is unchanged | none | specified |
| Account deletion | no code path found (grep for `deleteUser` and `deleteAccount` returned nothing) | none | gap (N-15) |
| Restoring a backup | the token is not in the allowlist (`src/parts-cartographer/core/backup.ts:10-18`) | [T] `src/parts-cartographer/core/backup.spec.ts:38-54` | exercised |

### 8.4 Deleted source

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| Payload content | copy is generic: "Which part drove today?" (`src/firebase-messaging-sw.js:16`; `src/parts-cartographer/core/push.ts:109`). Foreground forwards only `notification.title` and `body`; `data` is ignored (`src/parts-cartographer/core/push.ts:74-77`). | [T] `src/parts-cartographer/core/push.spec.ts:84-95` asserts `data` is not shown | exercised for foreground |
| Deleted local verdict or check-in | nothing is scheduled to cancel. A verdict missing from local storage simply does not resurface (`src/app/features/checkin-panel/checkin-panel.component.ts:138-146`). | none | specified |
| Deleted source referenced by a queued send | no send is queued in repo; a sender cannot be checked [X] | none | gap (N-01) |
| Token documents for a deleted account | no cleanup (N-15) | none | gap |
| Privacy rule for payloads | `docs/oldplan.md:480` says notifications must not expose the theme of an experiment; `docs/80-20-plan.md:484` requires discreet reminders | documents only | specified in docs; not enforced in code |

### 8.5 Duplicate and cancelled operation

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| Repeated enable | same token, same document id, overwrite (`src/parts-cartographer/core/push.ts:66-70`). Idempotent in effect; `createdAt` is refreshed. | [T] `src/parts-cartographer/core/push.spec.ts:96-108` once | exercised once; concurrency untested |
| Rotation with failure | previous document deleted before the new write (`src/parts-cartographer/core/push.ts:64-66`). A failed write can leave neither document. | none | gap (N-05) |
| Repeated disable | returns early when S-3 is absent (`src/parts-cartographer/core/push.ts:91`). If S-3 survives a failed `deleteToken` (`src/parts-cartographer/core/push.ts:97-98`), a retry calls `deleteDoc` on a missing document, which rules deny because `resource` is null [S, to verify]. | none | gap (N-05) |
| Cancel an in-flight enable | no `AbortSignal`. A late completion can write the document and the marker after the user has withdrawn (`src/parts-cartographer/core/push.ts:66-71`). | none | gap <!-- cite-ids: none --> |
| Duplicate display | constant tag `innerverse-daily` (`public/firebase-messaging-sw.js:18, 25`; `src/parts-cartographer/core/push.ts:109`). Same-tag notifications replace one another, so two different reminders also collapse. | none | gap (N-07) |
| Two `push` handlers in the FCM worker | `onBackgroundMessage` (L14-20) and a raw `push` listener (L21-26) both call `showNotification`. Duplicate handling is possible. | none | pending [P] (N-18) |
| Cancelled send | none (no scheduler, no sender in repo) | none | gap (N-01) |

### 8.6 Offline and quiet alternative

| Path | Current behaviour | Evidence | Status |
|---|---|---|---|
| Offline enable | `getToken` needs the network. Failure becomes `denied` (`src/parts-cartographer/core/push.ts:80-83`). Firestore `setDoc` resolves only after server acknowledgement [S, SDK behaviour to verify]. No timeout exists. | none | gap (N-21) |
| In-app fallback while offline | verdict resurfacing and card caps are local and run on app open (`src/app/features/checkin-panel/checkin-panel.component.ts:138-146`). The nudge that would use the browser notification is unwired. | [T] for rules; the nudge is untested in the product path | partly exercised; no notification fallback (N-06) |
| Quiet alternative | none. Quiet mode (`docs/80-20-plan.md:530@3683b0f`) and quiet hours (`docs/oldplan.md:279-295@3683b0f`) are not implemented for delivery; the in-app due-task note has a quiet check (`reminder-policy.ts:74@3683b0f`, HEAD 3683b0f only). The only delivery quiet alternative is disabling reminders, which has the ordering issues in section 8.5. | [T] withdrawal test only | gap (N-11) |
| Service-worker offline shell | `src/sw.js:61-75` and `public/sw.js:29-38` serve the cached shell. Neither covers FCM. | none | specified |

### 8.7 Six compatibility dimensions for `notification.delivery`

Dimensions are those of AAA v7.1 section 11C.2: interface, state, effects, operations, performance, failure semantics.

| Dimension | Current surface | Evidence | Gap |
|---|---|---|---|
| Interface | Two client APIs with the same result strings and no shared type: React `src/parts-cartographer/core/push.ts` exports and Angular `PushService`. FCM payload expectation: `notification.title` and `body` only (`src/parts-cartographer/core/push.ts:74-77`; `src/firebase-messaging-sw.js:15-25`). Registry schema from rules (`firestore.rules:200-214`). | [T] `push.spec.ts:84-95, 96-108` | No versioned contract, no port (N-17), two implementations (N-19) |
| State | S-1 to S-11 in section 4. Three authorities (device marker, registry, browser permission) with no reconciliation. | [T] withdrawal test (`src/parts-cartographer/core/push.spec.ts:116-123`) | Authority declaration (N-02). No mismatch test. |
| Effects | E-1 to E-12 in section 5. Registry writes are keyed by token. No send identity. | none for sends | Ledger and send identity for E5 (N-01, S-10) |
| Operations | No sender or scheduler in repo (C-16). Key rotation not done (N-16). Two app-shell worker sources and two hosting targets (N-09). Console errors are `console.warn` only (`src/parts-cartographer/core/push.ts:81`). | [D] `docs/push-key-rotation.md` | Observability, rollout and rollback plan (N-01, N-16) |
| Performance | No latency or enable-time budget. The enable path dynamically imports Firebase messaging, auth and Firestore (`src/parts-cartographer/core/push.ts:49-51`). `isSupported()` runs on each check-in mount (`src/parts-cartographer/screens/check-in.jsx:80`). The nudge check is constant time. | none | Budgets to be declared and measured on devices [P] |
| Failure semantics | Every error becomes `denied` (`src/parts-cartographer/core/push.ts:80-83`, `src/services/push.service.ts:60-61`). No timeout, retry or typed failure. Withdrawal is not transactional (`src/parts-cartographer/core/push.ts:96-98`). The nudge fallback is unwired. | none | Typed failures and compensation (N-04, N-05, N-21) |

### 8.8 States

| State | Trigger | UI today | Code | Tested |
|---|---|---|---|---|
| unknown | before `currentPushState` resolves | opt-in label shown (`src/parts-cartographer/screens/check-in.jsx:72-75`), which can mislead an already-enabled user | `src/parts-cartographer/screens/check-in.jsx:72-84` | not tested (N-23) |
| unsupported | no `Notification`, no SW, or `isSupported()` false | button hidden; notice shown | `src/parts-cartographer/core/push.ts:13-21`; `check-in.jsx:329, 334-339` | [T] `src/services/push.service.spec.ts:5-9` (jsdom) |
| ready | permission `default`, or `granted` without marker | opt-in button | `src/parts-cartographer/core/push.ts:24-29` | [T] `src/parts-cartographer/core/push.spec.ts:96-98` |
| enabled | permission `granted` and marker | "Disable reminders" | `src/parts-cartographer/core/push.ts:27`; `src/parts-cartographer/screens/check-in.jsx:331` | [T] `src/parts-cartographer/core/push.spec.ts:96-108` |
| denied | refused at prompt, browser refused, no user, no token, or any error | button disabled; notice shown | `push.ts:26, 34, 40, 54, 61, 82`; `push.service.ts:28, 39, 43, 54, 61` | [T] only for browser-already-refused (N-04) |
| interrupted | error during enable or withdrawal | `denied` on enable (N-04); toast on withdrawal (`src/parts-cartographer/screens/check-in.jsx:197`) | `src/parts-cartographer/core/push.ts:80-83`, `:96-98` | not tested |
| quiet | no delivery quiet mode exists; disabling is the only delivery quiet state | as for enabled | not implemented | not applicable (N-11) |

## 9. Reuse verdicts

**Reuse, after versioning in B05.S02 to S04:**

- The token-keyed, uid-bound registry document and its rules (`firestore.rules:198-216`) as the seed of a delivery-registration record. The rules-test pattern (`firestore.rules.emulator.spec.ts:245-258`) is worth extending.
- The backup exclusion of the device token (`src/parts-cartographer/core/backup.ts:10-18`; `src/parts-cartographer/core/backup.spec.ts:38-54`). Device authority must stay non-portable.
- Absolute-instant scheduling, as used for verdict resurfacing (`state-v2.ts:158, 162-171`), and in-app resurfacing on open as the offline and quiet fallback.
- The idempotent-cancellation pattern in `src/parts-cartographer/core/booking.ts:339-356`, where "a retried cancellation must never delete a newer booking's reservation". It is an analogue, not notification code.

**Do not reuse as is:**

- React `src/parts-cartographer/core/push.ts` as a contract. It mixes permission, identity, registry writes and display, and collapses results into `denied`.
- Angular `src/services/push.service.ts`. It lacks rotation cleanup and withdrawal, and writes the local marker before the registry (`src/services/push.service.ts:55-56`).
- The unwired local nudge functions (`src/parts-cartographer/core/push.ts:101-115`; `src/services/push.service.ts:65-74`).
- The constant display tag `innerverse-daily`.
- Two app-shell worker sources that write the same `dist/sw.js`.
- English-only worker defaults (`public/firebase-messaging-sw.js:16, 25`). The worker cannot read the app's language preference, so Russian users see English unless the sender supplies text.

## 10. Findings

Severity is a planning judgement for B05.S02 prioritisation, not a release gate.

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| N-01 | No `notification.delivery` slot, port, contract, sender, scheduler or ledger exists in the repo. Delivery depends on an external sender whose status is unknown. | C-14, C-15, C-16; `src/services/push.service.ts:3-6` | High |
| N-02 | "Enabled" is decided by the device marker and browser permission. It is not reconciled with the registry (S-4) or with FCM token validity. A browser refusal or a deleted registry record leaves the marker in place. | `src/parts-cartographer/core/push.ts:24-29`; S-3, S-4 | High |
| N-03 | Withdrawal is absent from Angular logout and from direct sign-in. The React hook has no production caller. A token can remain owned by the previous uid, and the next account can see "enabled" with no way to disable it. | `src/parts-cartographer/core/auth.service.ts:93-147`; `src/app/core/adapters/firebase-auth.adapter.ts:90-92`; `src/app.component.ts:1331-1336`; `firestore.rules:215` | High (direct-switch denial is a hypothesis to verify) |
| N-04 | All errors and all refused or dismissed prompts become `denied`, and the React button is disabled for the session. The dismissal path is untested because the mock always grants. | `push.ts:40, 54, 61, 80-83`; `push.service.ts:39, 43, 54, 60-61`; `src/parts-cartographer/screens/check-in.jsx:330`; `src/parts-cartographer/core/push.spec.ts:52` | Medium-High |
| N-05 | Writes are not atomic. Rotation deletes before writing. Angular stores the marker before the registry write. Withdrawal removes the registry document before `deleteToken` and before the marker. | `push.ts:64-66, 96-98`; `src/services/push.service.ts:55-56` | Medium |
| N-06 | The local nudge fallback has no runtime caller. Its tests pass, and the parity evidence describes the "local cap" as covered, but the product cannot reach it. | `src/parts-cartographer/core/push.ts:101-115`; `src/services/push.service.ts:65-74`; `docs/react-vite-angular-parity-evidence.md:36` | Medium |
| N-07 | One constant display tag is used for every notification, so there is no occurrence identity. Different reminders replace one another. | `public/firebase-messaging-sw.js:18, 25`; `src/parts-cartographer/core/push.ts:109` | Medium |
| N-08 | No `notificationclick` handler exists in any worker, so tapping a reminder has no app-defined destination or action. | grep over `src/sw.js`, `public/sw.js`, `src/firebase-messaging-sw.js` | Medium |
| N-09 | Two app-shell workers share the URL `/sw.js` and the output path `dist/sw.js`. The Firebase config is copied into the FCM worker by hand. Two hosting targets serve `dist`. | `public/sw.js:2-5`; `src/sw.js:16-18` (build stamp and cache names, not the output path); `angular.json` assets; `firebase.json`; `src/firebase-messaging-sw.js:5-12` | Medium |
| N-10 | Worker defaults are English-only; the worker has no language signal. | `public/firebase-messaging-sw.js:16, 25` | Low-Medium |
| N-11 | No delivery quiet hours, digest, budget, pause, per-stream control or delivery timezone exists. An in-app quiet check exists for the due-task note (`src/parts-cartographer/core/reminder-policy.ts:74@3683b0f`, HEAD 3683b0f only). Quiet mode and quiet hours are required by the plans for delivery. | section 6; `docs/80-20-plan.md:484, 530`; `docs/oldplan.md:279-295@3683b0f` | High for B05 scope (new work) |
| N-12 | In-app timing is correct on its own terms (absolute 48-hour and 24-hour intervals, local-day helpers). It has no DST-boundary or timezone-change tests. | `state-v2.ts:86-91, 158, 162-171, 239-241`; `src/app/core/data/state-v2.spec.ts` | Low |
| N-13 | The registry schema is fixed in rules with `hasOnly`, and has no version field. Any schema change needs coordinated rules, clients and sender changes. | `firestore.rules:200-214` | Medium |
| N-14 | Positive: the device token is excluded from backups; registry writes are owner-bound and client reads are denied. | `src/parts-cartographer/core/backup.ts:10-18`; `firestore.rules:198-215`; `src/parts-cartographer/core/backup.spec.ts:38-54` | Positive |
| N-15 | No account-deletion or stale-token cleanup exists. A site-data clear removes S-3 but not S-4, and a later enable does not delete the old document because the previous token is no longer known (`src/parts-cartographer/core/push.ts:64-65`). | `grep deleteUser|deleteAccount` returned nothing; `src/parts-cartographer/core/push.ts:64-65` | Medium |
| N-16 | Key rotation and subscription migration are not implemented. The incident is recorded in the repo. The doc says the old key must be treated as compromised until replacement and migration are verified. | `docs/push-key-rotation.md:3-17, 40-58`; `docs/beads-roadmap.md:163-166` | High for real delivery |
| N-17 | `src/parts-cartographer/core/auth.service.ts` imports the push module directly (dynamic import, L143). No notification port exists in either port layer. | `src/parts-cartographer/core/auth.service.ts:143`; `src/parts-cartographer/core/ports.ts:6-40` | Medium |
| N-18 | The FCM worker has both `onBackgroundMessage` and a raw `push` listener, and both call `showNotification`. Duplicate handling is possible. | `src/firebase-messaging-sw.js:14-26` | Low-Medium; device verification pending |
| N-19 | The Angular opt-in exists in its class but has no template control. Its enable path lacks rotation cleanup and withdrawal. The surface is retained (parity plan), so the divergence is live. | `src/app/features/checkin-panel/checkin-panel.component.ts:235-245`; `src/app/features/checkin-panel/checkin-panel.component.html`; `src/services/push.service.ts` | Low-Medium |
| N-20 | Real FCM background and foreground delivery, on real browsers and devices, is unverified. | `docs/react-vite-angular-parity.md:24`; `docs/react-vite-angular-parity-plan.md:22`; `docs/react-vite-angular-parity-evidence.md:43` | Pending [P] |
| N-21 | Enable and withdraw await Firebase calls with no timeout. Offline behaviour is untested. | `push.ts:57, 66, 96-97`; `push.service.ts:44, 56` | Medium |
| N-22 | Reminder copy is generic and contains no entity references. Payload privacy is a documented rule with no enforcement in code. | `src/firebase-messaging-sw.js:16`; `docs/oldplan.md:480` | Low (policy) |
| N-23 | Until the first state read resolves, the React button shows the opt-in label. | `check-in.jsx:72-84, 329-333` | Low |

## 11. Contract and effect manifest for B05.S02

These are the inputs S02 must resolve. This worker did not decide them.

1. Authority of "enabled": registry (S-4), device marker (S-3), or a reconciled pair. Define the states: fresh, stale-token, revoked, orphan.
2. Typed failure states, separated from `denied`: unsupported, unknown, prompt-declined, browser-denied, unauthenticated, interrupted, enabled, withdrawing.
3. Ordering and idempotency of enable, rotation and withdrawal across E-2 to E-7 and S-3, with compensation for partial failure.
4. Owner transition on sign-out, direct sign-in and anonymous-to-account. This needs the published C01 contract (`ArchetypeAI-bgdg`, `ArchetypeAI-7253`), which does not exist yet.
5. Stream model for F19: per-stream settings, quiet hours, digest, budget and pause. Decide whether each is per device or per account, and represent the timezone as instant plus IANA zone with DST semantics.
6. Dedupe identity per occurrence (effect id), tag strategy, and a delivery ledger for E5 sends (AAA section 9.1).
7. Cancellation of queued sends after revocation, expiry or source deletion. This depends on the external sender contract, which B05.S03 must define.
8. Stale-contract policy: a versioned registry schema (with coordinated rules), a VAPID key version, and one app-shell worker source.
9. Payload privacy: no private content in any payload, and a deletion propagation rule for registry records (N-15).
10. Language for worker-displayed text (N-10).
11. Interface: one port for `notification.delivery` used by both surfaces, and which surface is retained (N-17, N-19).
12. Consent provenance: the C08 seam file is absent. Decide whether opt-in records use the `consent.provenance` contract once it exists (`ArchetypeAI-abz4`, `ArchetypeAI-9q4d`).

## 12. Source and data provenance

**Repository state.** Base `09194df5f48326bff14e42a1e4eb8d66c457186d` on branch `worktree-agent-aaa4d8ae9b4a1157d`. Git blob IDs (abbreviated, `git ls-files -s`) for the cited files:

| Blob | File |
|---|---|
| `2a812b523553` | `src/parts-cartographer/core/push.ts` |
| `cc49a8334460` | `src/parts-cartographer/core/push.spec.ts` |
| `c3e0895a4435` | `src/services/push.service.ts` |
| `c6c51617bf26` | `src/services/push.service.spec.ts` |
| `70c4be9dc846` | `src/firebase-messaging-sw.js` |
| `8b81902364b0` | `src/sw.js` |
| `39a58e99b00f` | `public/sw.js` |
| `36ffb114d561` | `firestore.rules` |
| `7f597a15b4f0` | `firestore.rules.emulator.spec.ts` |
| `de2d94ac81c0` | `src/parts-cartographer/screens/check-in.jsx` |
| `e601dd95d1e7` | `src/app/features/checkin-panel/checkin-panel.component.ts` |
| `05482a4baebc` | `src/app/features/checkin-panel/checkin-panel.component.html` |
| `5591b67cc092` | `src/parts-cartographer/core/auth.service.ts` |
| `e680e162d058` | `src/app/core/adapters/firebase-auth.adapter.ts` |
| `3cfa3b30e42a` | `src/app/core/data/state-v2.ts` |
| `7917f0a360c6` | `src/parts-cartographer/core/backup.ts` |
| `47910dc9f1cb` | `src/parts-cartographer/core/backup.spec.ts` |
| `68e6214a0ec9` | `src/parts-cartographer/core/ports.ts` |
| `71c3c77a778c` | `src/parts-cartographer/app.jsx` |
| `317cdaf4dddd` | `src/parts-cartographer/main.jsx` |
| `0e2a99f09ed4` | `src/parts-cartographer/core/booking.ts` |
| `4d9bfe11f004` | `src/parts-cartographer/core/cloud-storage.ts` |
| `fec6be8dc79d` | `worker.ts` |
| `34ce1064a0a3` | `docs/push-key-rotation.md` |
| `d7acf515c30d` | `docs/plans/social-creative-practice-beads-plan.json` |
| `c8a2e0caa41e` | `docs/plans/elevation-aaa-v7-beads-plan.json` |
| `2eb18f3f7725` | `docs/plans/references/AAA-V7-SPEC.source.md` |
| `d362933d706e` | `scripts/planning/build-social-creative-practice-plan.py` |

Other documents cited (line numbers as read): `docs/beads-roadmap.md:163-166`; `docs/react-vite-angular-parity.md:24, 34`; `docs/react-vite-angular-parity-evidence.md:36, 43`; `docs/react-vite-angular-parity-plan.md:5, 22`; `docs/80-20-plan.md:66, 484, 530, 729`; `docs/oldplan.md:279-295, 333, 480`; `docs/plans/social-creative-practice-beads-plan.md:134, 169, 220-222`; `docs/plans/aaa-v7-architecture-and-agent-sweeps.md:73, 80`. AAA specification sections cited: section 9 (effects, L324), 9.1 (ledger, L339), 10.1 (control journal, L378), 11A.3 (no shared workspace, L470), 11B (parallel safety, L486), 11C.2 (swap dimensions, L589).

**Beads references.** IDs come from the planning JSON `beads_ids` mapping and from the task text. They were not checked against live Beads, because no `bd` command was run. Live status must be taken from the tracker.

**Data.** No participant data, no Firestore reads or writes, no network calls, and no Firebase project access were used. Credentials and configuration values (the VAPID key, the Firebase client configuration) were not copied into this file.

## 13. Checks run

All runs used the parent checkout's installed `vitest` 3.2.7 (`/home/user/ArchetypeAI/node_modules/.bin/vitest`) from this worktree, with `--cache=false` so that no cache was written. No dependencies were installed in the worktree.

| Check | Command (from this worktree) | Result | Limits |
|---|---|---|---|
| Push reminder, React | `vitest run src/parts-cartographer/core/push.spec.ts --cache=false` | 5 passed | Firebase SDK mocked; `requestPermission` always resolves `granted` |
| Push reminder, Angular | `vitest run src/services/push.service.spec.ts --cache=false` | 2 passed | jsdom: asserts only the `unsupported` state and the nudge gate |
| Backup allowlist | `vitest run src/parts-cartographer/core/backup.spec.ts --cache=false` | 8 passed | Round-trip; asserts the token is absent from export |
| Registry rules, static | `vitest run firestore.rules.spec.ts --cache=false` | 8 passed | Regex over the rules text, not rule evaluation |
| In-app timing | `vitest run src/app/core/data/state-v2.spec.ts --cache=false` | 24 passed | No DST or timezone-change cases |

Total: 47 passed across five spec files, as the candidate reported at base d17aaa6. At HEAD on 2026-10-16 the same files gave 48 passed with vitest 4.1.12. No code was changed for the candidate's run.

Not run: `firestore.rules.emulator.spec.ts` (requires the Firestore emulator, pending); `tests/browser` (Playwright); production builds; `tsc`; any FCM, service-worker or device runtime; the sender.

## 14. Limitations and pending evidence

- The inventory is static apart from the unit checks above. FCM, service-worker, Firestore-emulator and account-switch behaviour were not executed. Items marked [S] are hypotheses to verify.
- The sender and any scheduled function live outside the repository. Whether they exist, and what they send, is unknown [X].
- VAPID rotation status is unverified (`docs/push-key-rotation.md:11-17`).
- The checkout is a planning-era base. Other branches and uncommitted work in the main checkout were not inspected.
- C01 and C08 have no published contracts. The C08 seam file is absent.
- Pending [P]: real background and foreground delivery on each supported browser and OS; permission refusal and dismissal on real browsers; account switching with real Firebase accounts; participant evidence for J05 (quiet short visit and trustworthy reminder, `docs/plans/social-creative-practice-beads-plan.md` pilots); accessibility review of the reminder control; an independent review of this file. No practitioner or tradition evidence applies to this inventory.

## 15. Role, write and contract manifest

- **Role:** slot-owner (inventory). Mutation M0, risk R2.
- **Read set:** the five files in section 2, plus the files cited in sections 3 to 12.
- **Write set:** `architecture/extension/development/b05/s01/b05-s01-inventory.md@3683b0f` only.
- **Owned slots:** none.
- **Contracts consumed:** none published (`contract_versions: []`). **Contracts produced:** none.
- **Capabilities used:** repository read; local unit test execution with no cache writes.
- **Not touched:** application source, package or lockfiles, CI, Firestore rules, shared locales, other directories, Beads, remote branches.
- **Rollback or undo:** revert the commit that adds this file, or delete the directory. No runtime, data or external effect was produced.

## 16. Acceptance status and Beads note

| Acceptance criterion | Status |
|---|---|
| Named deliverable exists and addresses state, effect and component inventory | Met as a candidate (sections 3 to 6) |
| Scenario matrix covers the seven named scenario families | Met as a candidate (section 8); exercised only where marked |
| Relevant normal, unknown, declined, denied, interrupted and quiet states are specified or exercised | Partly met. All are specified. Tests exercise normal, pre-refused and withdrawal only. Declined-at-prompt, interrupted and quiet remain to exercise (B05.S04). |
| Artifact and checks attributable; provenance explicit; role, write and contract manifest recorded; limitations and next handoff in Beads | Artifact, checks, provenance, manifest and limitations are recorded here. The Beads write is pending: the coordinator must post the note below. |
| Applicable independent, participant, real-service, device, tradition or practitioner evidence recorded as actual or pending | Met: all such evidence is listed as pending (section 14). No acceptance claim is made. |

Draft Beads note for the coordinator (not posted by this worker):

> B05.S01 candidate awaiting independent review. Artifact: `architecture/extension/development/b05/s01/b05-s01-inventory.md@3683b0f` on branch `worktree-agent-aaa4d8ae9b4a1157d`, commit recorded in the worker report. Base `09194df5f48326bff14e42a1e4eb8d66c457186d`. Checks (candidate's report): 47 existing unit tests passed in five specs (mocked; static rules). Not run: rules emulator, browser, build, device, sender. Pending: real FCM delivery, participant J05, independent review. Findings N-01 to N-23 recorded. Rollback: revert the commit. Next handoff: B05.S02 (`ArchetypeAI-uffz`), inputs listed in section 11, prerequisites C01 contract (`ArchetypeAI-bgdg`) and C08 seam (absent).

## 17. Next handoff: B05.S02 (`ArchetypeAI-uffz`)

B05.S02 reads this exact file and specifies the ownership and permission/effect matrix. It should start from section 4 (state), section 5 (effects), section 8 (scenarios) and section 11 (decisions). Its prerequisites are: a published C01 contract (`ArchetypeAI-bgdg`, then `ArchetypeAI-7253`); a decision on whether the C08 seam is created or the consent contract is deferred; the sender's location and status (C-16); a confirmed VAPID rotation state (`ArchetypeAI-h8c` per `docs/beads-roadmap.md:166`); and a bound immutable base. Live status for these must come from the tracker.
