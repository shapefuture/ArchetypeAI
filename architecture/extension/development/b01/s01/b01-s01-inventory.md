# B01.S01 candidate inventory: social.profile ownership and actual reuse
<!-- cite-ref: 09194df -->

> **Independent review (2026-10-16).** A separate read-only reviewer checked this document at `42116d6`. Verdict: **FAIL**, on the consent-seam absence claim, which is false at HEAD. Corrections are in place. Status is still **candidate, not accepted**, and re-review is required.
>
> - Base note: several citations use `src/shared/...`, `src/parts-cartographer/...` or `src/i18n/...` paths that did not exist at this document's base commit. Those are HEAD paths (git rename map `09194df..HEAD`).
> - Not corrected in this pass: the §12 checker results depend on scripts outside the repository and were not reproduced.

**Status: CANDIDATE, awaiting independent review. Not accepted.**

| Field | Value |
|---|---|
| Bead | ArchetypeAI-8qmt, [B01.S01] Inventory current ownership and actual reuse: Public presentation and private preferences |
| Parent / planning | ArchetypeAI-q6ie (B01 epic) / ArchetypeAI-cyqe (planning Bead) |
| Successor | ArchetypeAI-rqkd, [B01.S02] Specify authoritative state, grants and effects |
| Slot | social.profile (planned logical slot; no published contract, no implementation of the slot exists) |
| Repository state | branch `worktree-agent-a129fab48560e7d83`, base commit `09194df` (clean before writing) |
| Immutable base | `base_generation: null` (unresolved). No predecessor contract versions exist. No workcell lease is held. |
| Write set | this file only: `architecture/extension/development/b01/s01/b01-s01-inventory.md@675118c` |
| Evidence type | Static inspection of the repository at `09194df`. No test run, device session, live Firebase call, participant session, practitioner review or independent review was performed. |

Labels used below: **[fact]** = read directly from the cited file. **[inference]** = derived from code or rule text and not exercised. **[gap]** = required by a planning document and absent from the code. **[pending]** = evidence that has not been collected.

---

## 1. Summary

1. **Public presentation exists only as an identity projection.** On every linked sign-in, the client writes the user's email and display name to `publicProfiles/{uid}` without a purpose-specific consent step, a field choice, a block or a withdrawal control. Firestore rules let any signed-in session, including an anonymous Firebase session, read every such document. (Findings B01-S01-F01, F02.)
2. **Private preferences are device-local.** Sensory preferences live in `localStorage` under `ifs.sensory.v1` and are not account-owned, synced or included in backup export. Other private content (assessment, parts map, journal) is device-local and included in plain-JSON backup export.
3. **The deliberate cross-user disclosures are bearer share codes, therapist invite summaries, and booking grants (`src/parts-cartographer/overlays.jsx:842-852`, checkbox `bookingShareConsent`).** Each has an explicit consent checkbox. Share codes can be revoked by deletion. Therapist-invite copies cannot be revoked by the client. Booking grants end when the appointment is declined.
4. **Reuse is partial.** C01 (auth identity) is reusable as an identity source. C02 (local storage) is reusable as a key/value seam, but sensory preferences bypass it and it swallows save errors. C08 (consent and provenance) had no seam at the base commit 09194df: the path named in the elevation metadata did not exist there. HEAD adds `src/parts-cartographer/core/personal-memory.ts@675118c` (commit 3670a3a, after the base). Whether that module satisfies C08 is not assessed here.
5. **Package-ID collision.** The creative-commons plan reuses the IDs C01, C02 and C08 for unrelated packages. The B01.S01 reuse IDs resolve to the elevation-plan slot streams (live Beads `ArchetypeAI-zzmm`, `ArchetypeAI-j60z`, `ArchetypeAI-v2tj`) because the social plan's B01 `relates_to` edges point to those IDs. The coordinator should confirm this mapping before the reuse decision is recorded in Beads.
6. **Items needing B01.S02 decisions** are listed in the findings register (section 9) and the handoff (section 14). The highest-priority items are automatic email publication, unrestricted directory reads, the absence of client-side withdrawal for public and therapist-invite data, and placeholder values in the therapist summary that the consent copy describes as an adherence summary.

---

## 2. Scope, sources and method

**Task requirements.** The task file `/tmp/claude-0/-home-user-ArchetypeAI/67c2d98b-1019-565c-8614-bcf790c372dd/scratchpad/tasks/8qmt.txt` requires a state, effect and component inventory; a scenario matrix covering normal and denied grant, stale contract, account change, deleted source, duplicate or cancelled operation, offline or quiet alternative, and the six compatibility dimensions for `social.profile`; reconciliation of packages C01, C02 and C08; and recording of provenance, role, write manifest, limitations and next handoff.

**Read set (from the Bead metadata). All five files exist.**

| Path | Status |
|---|---|
| `docs/80-20-plan.md` | read (relevant sections: 3, 9.1, 13; lines cited) |
| `docs/plans/first-principles-elevation-beads.md` | read |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | read |
| `docs/plans/social-creative-practice-beads-plan.json` | read (B01 platform, B01.S01 node, B01 edges, feature reuse fields) |
| `src/parts-cartographer/core/ports.ts` | read |

**Additional sources needed to reconcile reuse.** `docs/plans/social-creative-practice-beads-plan.md` (B01 definition, lines 126-143); `docs/plans/elevation-aaa-v7-beads-plan.json` (C01, C02, C08 slot streams and `beads_ids`); `docs/plans/creative-commons-beads-plan.md` and `.json` (C01, C02, C08 as they are used there); `docs/plans/references/AAA-V7-SPEC.source.md` (sections 9, 10, 11C; SHA-256 `e85d85f9...be75dc`, matching the pinned hash in the plans); and the app, rules and test files cited throughout.

**Method.** Each state, effect and component was traced from its writer to its readers, rule or deletion path. Greps were used to confirm absence (for example, no caller of `auth.signOut`, no `deleteDoc` on `publicProfiles`). Negative findings are stated as "no caller found in `src/`" and are not claims that no code exists anywhere.

**Not in the source record.** The "User-approved 2026-10-06 discussion" named in the task's source references is not in the repository. Requirements here come from the social plan JSON scope, the roadmap and the AAA plan.

---

## 3. Reuse reconciliation: packages C01, C02, C08

### 3.1 Resolution

| Metadata ID | Resolved slot (elevation plan) | Live Bead | Existing seam in repository | Reuse decision for B01 |
|---|---|---|---|---|
| C01 | `auth.identity`, "Auth identity and account lifecycle". Path `src/parts-cartographer/core/auth.service.ts` | ArchetypeAI-zzmm | `AUTH_PORT` declared in `src/parts-cartographer/core/ports.ts:6-13`. Implemented by `src/parts-cartographer/core/auth.service.ts`. Angular equivalent `src/app/core/ports/auth.port.ts` with `src/app/core/adapters/firebase-auth.adapter.ts`. | **Reuse as identity source only** (uid, linked status, provider). Publication of email into a directory is a B01 behaviour, but it sits inside `persistUser` (`src/parts-cartographer/core/auth.service.ts:41-47`). No published contract and no six-dimension suite exist. |
| C02 | `storage.local`, "Local authoritative storage and backup". Path `src/parts-cartographer/core/local-store.ts` | ArchetypeAI-j60z | `STORAGE_PORT` at `src/parts-cartographer/core/ports.ts:15-21`. Implemented by `src/parts-cartographer/core/local-store.ts` (`store`, `KEYS` at lines 56-72). Angular: `src/app/core/data/local-store.ts` (write-behind) and `src/app/core/ports/storage.port.ts`. | **Reuse for device-local private preferences as a key/value seam, with gaps.** Sensory preferences bypass it (`src/parts-cartographer/core/sensory-preferences.ts:59-61` calls `localStorage.setItem` directly). `store.save` swallows quota errors (`src/parts-cartographer/core/local-store.ts:22-24`). The port has no owner (uid) parameter and no schema version. |
| C08 | `consent.provenance`, "Consent, source lineage and corrections". Declared path `src/parts-cartographer/core/personal-memory.ts@675118c` | ArchetypeAI-v2tj | **The declared path did not exist at the base commit 09194df.** At the base it was not tracked by git and `git log --all -- '*personal-memory*'` was empty. HEAD adds the file in commit 3670a3a. Consent logic is distributed across `src/parts-cartographer/core/cloud-storage.ts` (allowlisted snapshot, lines 40-62), `src/parts-cartographer/overlays.jsx` (checkboxes), `src/parts-cartographer/core/therapist-link.ts` (invite summary) and `firestore.rules@675118c`. | **No reusable seam at the base.** Treat C08 as absent at the base. HEAD has a memory module, which this inventory does not assess. B01 must define its own field allowlist and consent state, or do so jointly with the C08 owner. The stale path in the elevation metadata must not be treated as satisfied. |

### 3.2 Namespace collision (finding B01-S01-F20)

`docs/plans/creative-commons-beads-plan.md:23-30` defines **C01** "Connected public threads", **C02** "Living places and temporary camps" and **C08** "Cross-circle expeditions". Its JSON `beads_ids` maps them to `ArchetypeAI-xs263`, `ArchetypeAI-x1rjy` and `ArchetypeAI-frd2b`. None of these is a reuse candidate for `social.profile`.

The social plan JSON gives B01 `relates_to` edges to `ArchetypeAI-zzmm`, `ArchetypeAI-j60z` and `ArchetypeAI-v2tj`, which are the elevation-plan IDs for C01, C02 and C08. This is the basis for the mapping in section 3.1. The Bead body does not name the plan, so the coordinator should confirm the mapping.

### 3.3 Other existing packages checked

- **Assessment and scoring (C03 in the elevation plan) and sensory/meaning packages.** Not reconciled here. `validProfile` (`src/parts-cartographer/core/profile-contract.ts:29-33`) and the share snapshot (`src/parts-cartographer/core/cloud-storage.ts:40-62`) carry clinical fields. Any public projection must use a new allowlist.
- **Backup and portability.** `src/parts-cartographer/core/backup.ts:10-18` defines `BASE_KEYS` and `PORTABLE_KEYS` (line 18). These are reused for export (`src/parts-cartographer/core/backup.ts:148-156`) and restore (`src/parts-cartographer/core/backup.ts:132-146`). `ifs.sensory.v1` is not in this list.
- **Booking and therapist roster.** `src/parts-cartographer/core/booking.ts` (`getTherapistProfile` 229-243, `saveTherapistAvailability` 245-252) and `src/parts-cartographer/core/therapist-link.ts` (create 86-103, claim 105-130). Both are reused by therapist flows and are candidates for `social.profile` only where a therapist identity is involved.

---

## 4. State inventory

### 4.1 Device-local state (browser `localStorage`, React app unless marked)

"Portable" means the key is in `PORTABLE_KEYS` (`src/parts-cartographer/core/backup.ts:10-18`) and is therefore included in `exportBackup` (`src/parts-cartographer/core/backup.ts:148-156`) as plain JSON. The backup has no encryption step in the code read.

| Key (writer) | Content | Account-scoped | Portable | Cross-user visible | Clear path | Classification |
|---|---|---|---|---|---|---|
| `ifs.auth` (`src/parts-cartographer/core/auth.service.ts:42`; `KEYS.auth` in `src/parts-cartographer/core/local-store.ts:61`) | Cached `AuthUser`: uid, email, displayName, provider, linked | No | No | No | `signOut` only (`src/parts-cartographer/core/auth.service.ts:146`); no UI caller (see F12) | Identity (user fact) |
| `ifs.profile`, `ifs.parts`, `ifs.history` (`src/parts-cartographer/app.jsx:113-166`; `src/parts-cartographer/core/local-store.ts:58-60`) | Scored profile including clinical block, part map, archive | No | Yes (`src/parts-cartographer/core/backup.ts:10`) | No until an explicit share | `setProfile(null)` removes profile only (`src/parts-cartographer/app.jsx:166`) | User facts, model-derived scores, authored parts |
| `ifs.sensory.v1` (`src/parts-cartographer/core/sensory-preferences.ts:11`; written `app.jsx:171,176`; controls `src/parts-cartographer/screens/landing.jsx:332-363`) | Preset, motion, sound, texture, density | No (device) | **No** (absent from `src/parts-cartographer/core/backup.ts:10-18`) | No | Overwritten on change; no clear control | Device presentation preference |
| `ifs.share.codes` (`overlays.jsx:192-195, 333-336, 353`; `KEYS.share` at `src/parts-cartographer/core/local-store.ts:67`) | Local index of issued share codes: code, uid, time, source, kind, part count; capped at 20 | No | No | No | Entry removed after successful revoke (`src/parts-cartographer/overlays.jsx:353`) | Device index of a cloud grant |
| `ifs.syn.connections`, `ARCHETYPE_SYNASTRY_*` (`src/parts-cartographer/overlays.jsx:306`; `src/parts-cartographer/core/backup.ts:17`) | Synastry reports and partner identifiers | No | Yes (`src/parts-cartographer/core/backup.ts:17`) | No | None found | Other person's data (partner-derived) |
| `ARCHETYPE_SYNASTRY_PARTNER` (Angular: `src/app.component.ts:1633-1637` and `:1746`) | Partner UID, share code, and **partner's raw 64-response vector** (`partnerResponses`) | No | Yes (`src/parts-cartographer/core/backup.ts:17`) | No | None found | Other person's raw answers (sensitive) |
| `ifs.avail` (`overlays.jsx:873, 984`) | Therapist availability copy | No | No | No | None found | Practitioner operations |
| `ifs.attested` (`overlays.jsx:886, 1005`; `innerverse.jsx:424, 636`) | Boolean role-attestation flag set by a button | No | No | No | None found | Self-declared role claim, not verified in code (see F09) |
| `INNERVERSE_PUSH_TOKEN_V1`, `INNERVERSE_PUSH_LAST_NUDGE_V1` (`push.ts:3-4, 71, 98, 110`) | Device push token; last nudge time | No | No | No | `disablePushReminder` (`src/parts-cartographer/core/push.ts:87-98`) | Device notification state (B05 scope) |
| `ifs.telemetry` (`src/parts-cartographer/core/telemetry.ts:9-13`) | Local anonymised item distributions | No | No | No (no sync; `src/parts-cartographer/core/telemetry.ts` comment) | `telemetry.clear` | Anonymous local usage counts |
| Other portable content keys (`src/parts-cartographer/core/backup.ts:10-17`): `ifs.journal`, `INNERVERSE_CHECKINS_V1`, `INNERVERSE_FUTURE_SELF_V1`, `ARCHETYPE_ASSESSMENT_RESPONSES`, etc. | Private user content | No | Yes | No | Restore in `replace` mode clears portable keys (`src/parts-cartographer/core/backup.ts:132-146`) | Private user content |
| `ifs.lang`, `ifs.theme`, `ifs.onboarded`, `ifs.help.seen`, `ifs.install.*`, `ifs.mapgate.done` | UI preferences and flags | No | Only `lang`, `theme`, `onboarded` | No | None | Device UI preference |

Angular-only local state: `src/app/core/adapters/local-storage.adapter.ts:66-69` throws "Share codes require cloud storage". `src/app/core/data/local-store.ts` coalesces writes and flushes on `pagehide` and on hidden visibility (`src/app/core/data/local-store.ts:88-89` listeners; header lines 1-17).

### 4.2 Cloud state (Firestore; rules in `firestore.rules`)

| Document (writer) | Fields enforced by rules | Read | Write and delete | Cross-user readable | Withdrawal path | Note |
|---|---|---|---|---|---|---|
| `users/{uid}` and `assessment/current`, `history`, `connections`, `synastry` (`src/parts-cartographer/core/cloud-storage.ts:82-94`, `150-171`) | Owner-written; no schema on parent | Owner. `assessment` and `history` also readable through admin grant and therapist booking grant (`firestore.rules:165-173`) | Owner | Through grants only | Grant ends with appointment status change (`firestore.rules:62-70, 133-137`) | No client delete path for cloud assessment, history or saved synastry found (see F-items in 9) |
| `publicProfiles/{uid}` (`src/parts-cartographer/core/user-directory.ts:34-46` React; `src/services/user-directory.service.ts:94-103` Angular) | Exactly `emailLower`, `email`, `displayName`, `updatedAt` (`firestore.rules:312-320`); `email` must equal token email | **Any signed-in session, including anonymous** (`firestore.rules:311`; `isSignedIn` at `:15-17`) | Owner create/update; owner delete (`:321`) | Yes | **No client path** (no `deleteDoc` on this collection in `src/`) | Written on every linked sign-in (`src/parts-cartographer/core/auth.service.ts:41-47`). Angular writes on each non-anonymous `user$` emission (`src/services/user-directory.service.ts:78-88`). |
| `therapists/{uid}` (`src/parts-cartographer/core/booking.ts:245-252` via `src/parts-cartographer/overlays.jsx:983`) | Exactly `email`, `availability` (`firestore.rules:326-333`) | Any signed-in session (`:327`) | Owner create/update; **delete false** (`:334`) | Yes, including `email` | None; availability can be overwritten but the document cannot be deleted | Therapist email also written by `syncPublicProfile` (`src/parts-cartographer/overlays.jsx:979`) |
| `shareCodes/{code}` (React `src/parts-cartographer/core/cloud-storage.ts:224-245` with mapSnapshot or legacy assessment; Angular `src/app/core/adapters/firebase-storage.adapter.ts:95-107` with full `AssessmentData`) | `uid`, `createdAt`, and optional `schema` plus `mapSnapshot` or `assessment` (`firestore.rules:80-100`). **No expiry field.** | `get` by any signed-in session with an 8-16 character regex (`:226-231`); `list` false (`:228`) | Owner create/update/delete (`:232-239`) | Bearer: any signed-in holder of the code | Owner delete (`src/parts-cartographer/core/cloud-storage.ts:282-287`; `src/parts-cartographer/overlays.jsx:347-361`) | Copies held by redeemers survive revocation (see F06) |
| `therapistLinks/{code}` (`src/parts-cartographer/core/therapist-link.ts:86-103` via `src/parts-cartographer/overlays.jsx:1511`) | `clientUid`, `createdAt`, `summary` (`firestore.rules:241-256`) | `get` by signed-in session with a 6-10 character regex; `list` false | Owner create; update false; **owner delete** (`:251`) | Bearer code | Owner delete allowed by rule; **no client code path** found | Summary persists in the document |
| `therapistClients/{therapistUid_clientUid}` (`src/parts-cartographer/core/therapist-link.ts:105-130`) | Invite rows carry `summary` validated against the link (`firestore.rules:472-535`) | Therapist or client (`:473`) | Create by therapist (invite) or client (booking); therapist update; **delete by therapist only** (`:532`) | Yes, to the pair | **Client cannot delete** the therapist's copy | Confirmed by rule text; no emulator test of deletion |
| `clientShares/{therapistUid_clientUid}` (booking grant) | Requires `source == 'booking'` and active appointment (`firestore.rules:441-470`, `hasActiveAppointment` at `:37-47`) | Client or therapist (`:442`) | Client create/update while appointment is pending or approved; **client delete** (`:466`) | No | Appointment decline revokes read grants (`firestore.rules:69-73`; emulator test at `firestore.rules.emulator.spec.ts:414-425`) | No client UI path for delete found |
| `pushTokens/{token}` (`src/parts-cartographer/core/push.ts:65-66`) | Owner-scoped; read false (`firestore.rules:198-217`) | None | Owner create, update, delete | No | `disablePushReminder` (`src/parts-cartographer/core/push.ts:96`) | Reached from sign-out via `src/parts-cartographer/core/auth.service.ts:144` and `src/parts-cartographer/core/push.ts:96` (see F12) |
| `telemetryResponses/{docId}` | Create-only (`firestore.rules:186-196`) | None | Create by signed-in session | No | None | No React writer in `src/parts-cartographer/core/telemetry.ts`; the Angular writer is `src/app/core/data/telemetry.ts:81` (`addDoc`) |

### 4.3 Ownership summary

| Datum | Authoritative owner in code | Owner-of-record gap |
|---|---|---|
| Identity (uid, linked status) | Firebase Auth via `src/parts-cartographer/core/auth.service.ts` | Cached in `ifs.auth`; no server-side `social.profile` owner |
| Public directory row | Projection written by the user's own session, rule-checked to token email | No consent state or field choice is stored anywhere |
| Therapist availability and email | Therapist's own document | Email duplicated in `publicProfiles` and `therapists` |
| Share code | Creator uid in the code document | Local index is per-browser; no server list (`list` denied) |
| Share copies (synastry, therapist roster) | Redeemer or therapist, as copies | No revocation propagation to copies |
| Private preferences (sensory) | Device | No account owner; not portable |
| Private content (profile, parts, journal) | Device; cloud only on explicit save or share | Cloud `users/{uid}` copies have no withdrawal path |

---

## 5. Effect inventory

Effect classes follow AAA-V7 §9 (`docs/plans/references/AAA-V7-SPEC.source.md:324-337`). **The classes are proposals by this inventory.** The code declares no effect classes, and AAA §9 says classification SHOULD be done. B01.S02 must confirm them.

| Effect | Trigger (file:line) | Proposed class | Consent gate in code | Visibility and reversibility | Evidence |
|---|---|---|---|---|---|
| Publish email and display name to `publicProfiles` | Linked sign-in (`src/parts-cartographer/core/auth.service.ts:41-47`; `src/parts-cartographer/core/user-directory.ts:34-46`; `src/services/user-directory.service.ts:78-88`) | E2 (idempotent merge) with a cross-user visibility effect | **None** | Visible to every signed-in session; withdrawal rule exists but no client path | Rule test asserts cross-user `getDoc` succeeds (`firestore.rules.emulator.spec.ts:309-314`) |
| Look up a person by email or UID | `lookupByEmail` (`src/parts-cartographer/core/user-directory.ts:71-96`); therapist finder (`src/parts-cartographer/overlays.jsx:701`); cabinet (`cabinet.component.ts:402, 482, 496`); booking (`src/app/features/booking-panel/booking-panel.component.ts:116`) | E1 (read) | None | Enumeration risk (F02) | Not exercised |
| Create bearer map share code | `gen` (`src/parts-cartographer/overlays.jsx:323-345`) → `createCloudMapShareCode` (`src/parts-cartographer/core/cloud-storage.ts:206-212`) | E2 (new document, random code) | Checkbox `shareConfirmed` (`src/parts-cartographer/overlays.jsx:503`) and `busy` guard (`:326`) | Grant copyable by holder; no expiry | Emulator tests `firestore.rules.emulator.spec.ts:260-292` |
| Revoke share code | `revokeShareCode` (`src/parts-cartographer/overlays.jsx:347-361`) → `deleteDoc` (`src/parts-cartographer/core/cloud-storage.ts:286`) | E2 delete; no inverse for the same code | Owner only | Recipients' copies unaffected (F06) | Emulator test `firestore.rules.emulator.spec.ts:288-291` (owner delete allowed, recipient denied) |
| Redeem share code and save synastry | `run` (`src/parts-cartographer/overlays.jsx:364-420`) → `redeemCloudMapShareCode` (`src/parts-cartographer/core/cloud-storage.ts:249-279`) → `saveCloudSynastry` (`:150-171`) | E1 read, then E2 writes under the redeemer | Linked-account check in the client only (`src/parts-cartographer/overlays.jsx:371`); server accepts any session (F10) | Creates a durable copy of partner-derived data | Not exercised in emulator |
| Create therapist invite | `createShareCode` (`src/parts-cartographer/overlays.jsx:1506-1516`) → `createTherapistLink` (`src/parts-cartographer/core/therapist-link.ts:86-103`) | E2 | Checkbox `therapistShareAgree` (`src/parts-cartographer/overlays.jsx:1544-1545`) | Anyone holding the code can claim (copy at `strings.ts:371`) | Emulator test `firestore.rules.emulator.spec.ts:454-` (claim of client invite) |
| Claim therapist invite | `claimTherapistLink` (`src/parts-cartographer/core/therapist-link.ts:105-130`) | E2 (therapist-side roster row with summary copy) | Code possession | Client cannot delete the copy (F05) | Emulator test `:454-` (no deletion case) |
| Save therapist availability with email | `saveAvail` (`src/parts-cartographer/overlays.jsx:966-990`) → `saveTherapistAvailability` (`src/parts-cartographer/core/booking.ts:245-252`) | E2 | Role check via `user.linked` (`src/parts-cartographer/overlays.jsx:967-968`) | Email visible to all signed-in sessions (F03) | Not exercised |
| Native share, PNG download and clipboard copy | `shareNow` (`src/parts-cartographer/overlays.jsx:1485-1505`) | **E5** (irreversible external, user-initiated) | User tap in overlay; no separate consent text in this path | Leaves the app; cannot be recalled | Not exercised |
| AI report or coach request with profile payload | `AI_PORT.aiReport(profile)` (`src/parts-cartographer/core/ports.ts:24-32`) | E5 (external model call) | Governed by AI features (not traced in depth) | Leaves the app | Out of scope for B01; B01 must not add social fields to such payloads |
| Register or remove push token | `enablePushReminder` (`src/parts-cartographer/core/push.ts:32-71`); `disablePushReminder` (`src/parts-cartographer/core/push.ts:87-98`) | E2 / E5 (external delivery) | Permission flow | Delivery is B05 scope | Out of scope |
| Local writes (preferences, index, cache) | `store.save` (`src/parts-cartographer/core/local-store.ts:22-34`); `saveSensoryPreferences` (`src/parts-cartographer/core/sensory-preferences.ts:59-61`) | E2 local | None needed | Reversible by overwrite or clear; quota errors swallowed (F17) | `src/parts-cartographer/core/sensory-preferences.spec.ts:29-40`; `src/parts-cartographer/core/backup.spec.ts:75-87` |

---

## 6. Component and surface inventory

| Surface or module | File and lines | Role for social.profile | Reuse decision |
|---|---|---|---|
| Ports (React) | `src/parts-cartographer/core/ports.ts:6-40` | `AUTH_PORT`, `STORAGE_PORT`, `AI_PORT`, `BILLING_PORT`; frozen V1 drafts | Reuse C01 and C02 interfaces. Do not add public-profile methods without a versioned contract. |
| Auth implementation | `src/parts-cartographer/core/auth.service.ts:41-148` | Identity; triggers directory publication in `persistUser` | Reuse identity. Move publication behind B01 policy. |
| Local store | `src/parts-cartographer/core/local-store.ts:15-72` | Key/value persistence, bounded history, `KEYS` | Reuse for device-local preferences after fixing F17. |
| Directory (React) | `src/parts-cartographer/core/user-directory.ts:1-100` | `publicProfiles` sync, lookups, 5-minute cache (`:12`) | Replace or narrow. Duplicate of Angular service (F14). |
| Directory (Angular) | `src/services/user-directory.service.ts:14-18, 40-43, 64-103, 144-170` | Same collection; documents the directory as readable by any signed-in user (`:40-43`) | Same as React. The Angular privacy comment is the only in-code acknowledgement of F02. |
| Cloud storage and shares | `src/parts-cartographer/core/cloud-storage.ts:40-287` | Allowlisted snapshot (`:40-62`), share codes (`:197-287`), synastry (`:150-196`) | Reuse the allowlist pattern. Do not reuse the snapshot as a public projection (F15). |
| Therapist link | `src/parts-cartographer/core/therapist-link.ts:86-130` | Invite and claim; roster | Reuse for therapist-side only. No revocation path (F05). |
| Booking and therapist profile | `src/parts-cartographer/core/booking.ts:229-252` | Therapist email and availability | Out of B01 scope except F03. |
| Preferences (sensory) | `src/parts-cartographer/core/sensory-preferences.ts:1-61` | Pure normalisation and `localStorage` I/O | Candidate for the device-local preference contract. Add a schema field (F16). |
| Backup | `src/parts-cartographer/core/backup.ts:10-156` | Portable key allowlist, export, restore | Reuse for portability. Decide whether preferences join the allowlist (F16). |
| Push | `src/parts-cartographer/core/push.ts:1-115` | Device token and nudge state | B05 scope; referenced only for the device-state inventory. |
| Telemetry | `src/parts-cartographer/core/telemetry.ts:1-24` | Local-only distributions | No change needed for B01. |
| App state | `src/parts-cartographer/app.jsx:59-68, 113-179, 194-195` | Profile, parts, sensory state; setters; anonymous bootstrap | Owner of sensory state in React. |
| Landing controls | `src/parts-cartographer/screens/landing.jsx:139, 275, 325-365` | Sensory presets and toggles (`aria-pressed`); sign-out label opens login overlay (`:139`) | Sensory UI consumer. Sign-out is not wired (F12). |
| Login overlay | `src/parts-cartographer/overlays.jsx:1098-1160` | Google and email sign-in; no publication disclosure in the overlay body | Needs B01 disclosure (F01). |
| Synastry overlay | `src/parts-cartographer/overlays.jsx:187-420, 503, 521` | Map share create, revoke, redeem; consent checkbox | Reuse UI pattern for consent. Map snapshot content must be disclosed accurately (F15). |
| Share overlay (image and therapist invite) | `src/parts-cartographer/overlays.jsx:1437-1460` (summary), `1462-1552` (overlay) | PNG share and therapist invite | Therapist summary has placeholder values (F08). |
| Therapist finder and availability | `src/parts-cartographer/overlays.jsx:690-720, 966-990` | Find therapist by email; save availability | Shows F03 and the publication dependency. |
| Attestation card | `src/parts-cartographer/overlays.jsx:1000-1007`; `src/parts-cartographer/screens/innerverse.jsx:630-637` | Device flag for practitioner status | Copy promises verification (F09). |
| Angular share and synastry | `src/app.component.ts:272, 1584-1650`; `src/app/core/adapters/firebase-storage.adapter.ts:8-130` | Share create with `shareCodeConsent` signal; partner code or UID resolution | Two payload families (F14); UID path (F10). |
| Angular lookups | `src/app/features/cabinet/cabinet.component.ts:402, 482, 496`; `src/app/features/booking-panel/booking-panel.component.ts:116` | Directory lookups | Consumers of the directory. |
| Rules | `firestore.rules:15-535` | Server authority for all collections above | Authority for B01 must be server-side. |
| Worker | `worker.ts:172-178` | Routes are `/api/ai`, Stripe and Gemini only. No social or profile route. | No server-side social.profile enforcement exists outside rules. |

---

## 7. Six compatibility dimensions for social.profile

The six dimensions are the AAA-V7 §11C.2 swap dimensions (`docs/plans/references/AAA-V7-SPEC.source.md:589-600`): interface, state, effects, operations, performance and failure semantics. The plan states the same six (`docs/plans/aaa-v7-architecture-and-agent-sweeps.md:84`). The repository has no per-slot compatibility suite for any slot. Each row below records the current position of the seam that `social.profile` would reuse or replace. None is a pass.

| Dimension | Current position | Gap for social.profile | Evidence status |
|---|---|---|---|
| **interface** (API, schema, behaviour) | No `social.profile` port. Consumers call Firestore directly through `src/parts-cartographer/core/user-directory.ts` (`src/parts-cartographer/overlays.jsx:16`, dynamic import in `src/parts-cartographer/core/auth.service.ts:44`). `PublicUserProfile` is declared twice (`src/parts-cartographer/core/user-directory.ts:6-10`; `src/services/user-directory.service.ts:14-18`). `STORAGE_PORT` is key-based with no owner parameter (`src/parts-cartographer/core/ports.ts:15-21`). | Needs a versioned contract with explicit public fields, purpose, audience and consent state. Consumers must not import the concrete directory module. | [pending] B01.S03. No contract published. |
| **state** (ownership, migration) | `publicProfiles` is a projection of Auth identity with no version field. Rule pins exact keys (`firestore.rules:312-320`). Sensory preferences carry a version in the key name only (`src/parts-cartographer/core/sensory-preferences.ts:11`), with no schema field, and normalise unknown values to defaults (`:34-46`). Angular legacy share path reads `users/{uid}/assessment/current` for a non-owner (`src/app/core/adapters/firebase-storage.adapter.ts:116-124`); the comment says current rules may reject it. | No owner-of-record for public presentation. No migration record. No consent state is stored. | [pending] B01.S02. |
| **effects** (same or narrower ceiling) | Publication on sign-in has no declared ceiling and is broader than any stated purpose (F01, F02). Share copies cannot be recalled (F06). Native share leaves the app (E5). | Narrow ceiling required: publication must be purpose-scoped, with a withdrawal that also stops future reads. | [pending] B01.S02. Effect classes in section 5 are proposals. |
| **operations** (deployability, observability) | Rules deploy with `firestore.rules`. No worker route for social.profile (`worker.ts:172-180`). Observability is `console.warn` or `console.error` only (`src/parts-cartographer/core/auth.service.ts:45-46`; `src/parts-cartographer/overlays.jsx` error handlers). AAA §10.1 control journal is not present. | No journal of publication or withdrawal. No kill switch for publication. No emulator test covering social.profile lifecycle. | [pending] B01.S04 (fixtures) and later operations evidence. |
| **performance** (declared SLO envelope) | No SLO declared. Directory cache TTL 5 minutes (`src/parts-cartographer/core/user-directory.ts:12`). Retry and timeout: 10 s timeout, up to three retries (`src/app/core/adapters/resilience.ts:7-9`, `:17-33`). Angular publication debounce 500 ms (`src/services/user-directory.service.ts:70`). Local write coalescing with 1500 ms idle deadline (`src/app/core/data/local-store.ts:43`). | No declared propagation time for withdrawal. A cached directory row can outlive a change by up to the TTL. | [pending] B01.S02 sets the envelope. Not measured. |
| **failure semantics** (timeout, retry, fallback) | Directory sync is best-effort and logged; sign-in continues (`src/parts-cartographer/core/auth.service.ts:44-46`; `src/services/user-directory.service.ts:72-74`). Share creation failure shows `shareCodeFailed` (`src/parts-cartographer/overlays.jsx:341`). Revoke failure keeps the local entry (`src/parts-cartographer/overlays.jsx:352-357`). Quota errors are swallowed (`src/parts-cartographer/core/local-store.ts:22-24`). Retries can orphan a committed share code (F07). | No pending or unknown state for publication, revocation or share creation. No user-visible failure for local save. | [pending] B01.S04 fixtures; [inference] for F07. |

---

## 8. Scenario matrix

State legend: **N** normal, **U** unknown or sparse, **D** declined, **X** denied, **I** interrupted or failed, **Q** quiet or offline alternative. "Specified" means this matrix states the expected or current behaviour at static depth. **Exercised: none** for every row, because no test or runtime check was run in this cell.

### 8.1 Normal and denied grant

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| A1 | Map share code, normal | N | Checkbox `shareConfirmed` (`src/parts-cartographer/overlays.jsx:503`) → `gen` (`:323-345`) → create (`cloud-storage.ts:206-212, 224-245`) → recipient redeems (`src/parts-cartographer/overlays.jsx:364-420`; `src/parts-cartographer/core/cloud-storage.ts:249-279`) → saved synastry (`:150-171`). | Per-field purpose selection absent. Default snapshot includes clinical and narrative fields (`src/parts-cartographer/core/cloud-storage.ts:40-62`; F15). | Specified. Rules create, get, list and delete covered (`firestore.rules.emulator.spec.ts:260-292`). UI flow not exercised. |
| A2 | Map share code, denied | X | Listing denied (`firestore.rules:228`; emulator `:266`). Non-owner delete denied (emulator `:288`). Unknown or revoked code returns null (`src/parts-cartographer/core/cloud-storage.ts:249-256`). React redeem refuses unlinked users (`src/parts-cartographer/overlays.jsx:371`). | Server does not enforce linked status: any Firebase session passes `isSignedIn` (`firestore.rules:15-17, 226-231`) (F10). The emulator helper `asAnon()` is an unauthenticated context (`firestore.rules.emulator.spec.ts:68-70`), so anonymous Firebase sessions are not covered by any test. | Specified. Gap [inference]. |
| A3 | Therapist invite, normal | N | Checkbox `therapistShareAgree` (`src/parts-cartographer/overlays.jsx:1544-1545`) → `createTherapistLink` (`src/parts-cartographer/core/therapist-link.ts:86-103`) → claim (`:105-130`) → roster row (`firestore.rules:472-535`, invite branch `:510-519`). | Summary has placeholder values (F08). | Specified. Emulator claim test `firestore.rules.emulator.spec.ts:454-`. |
| A4 | Therapist invite, denied | X | Claim only for a client-created code (emulator `:454-`). Link `get` requires a signed-in session and code regex (`firestore.rules:241-245`). | Any signed-in session can read a link with a valid code; code is a bearer secret (F05). | Specified. |
| A5 | Booking grant, normal and denied | N, X | Grant requires active appointment (`firestore.rules:37-47, 441-470`). Decline revokes read (emulator `:414-425`). | Booking path has server-side revocation. Model it as the reference for other grants. | Specified. Emulator test exists. |
| A6 | Public directory, normal | N | Row written on linked sign-in (`src/parts-cartographer/core/auth.service.ts:41-47`). Anonymous session writes nothing (`src/parts-cartographer/core/user-directory.ts:35`; `src/services/user-directory.service.ts:78`). | No purpose, field choice, or consent record (F01). | Specified. |
| A7 | Public directory, denied | X | Non-owner write denied (emulator `:309-321`). **Read is not denied to any signed-in session** (`firestore.rules:311`; emulator `:314` asserts success). | Read grant is unconditional; no block predicate (F02). | Specified. Gap [inference] for enumeration by `list`. |
| A8 | Declined grant | D | Share: checkbox unchecked means no call (`src/parts-cartographer/overlays.jsx:326`; `:1507`). Directory: no decline state exists; publication happens on sign-in. | No declined state for publication (F01). | Specified. Gap. |
| A9 | Unknown: no directory row | U | `lookupByUid` and `lookupByEmail` return null (`user-directory.ts:55-59, 82-85`). Therapist lookup shows not-found (`src/parts-cartographer/overlays.jsx:702-705`). | Fine as a state. Not distinguishable from "hidden". | Specified. |
| A10 | Unknown: therapist without profile | U | `getTherapistProfile` returns null; UI shows "not a therapist" (`src/parts-cartographer/overlays.jsx:710-714`). | Fine. | Specified. |

### 8.2 Stale contract

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| B1 | Legacy 64-response share payload read by current client | N, I | `fromDocument` migrates it through `buildLegacyReportData` (`src/parts-cartographer/core/cloud-storage.ts:98-119`). Invalid payloads return null (fail closed, `:101-115`). | Migration exists for share reads. No notice to the user that the payload is legacy. | Specified. Emulator legacy test at `firestore.rules.emulator.spec.ts:294-304`. |
| B2 | Angular share payload (full `AssessmentData`) in same collection | N | Accepted by the assessment branch of `validShareCodePayload` (`firestore.rules:80-100`). Emulator test at `firestore.rules.emulator.spec.ts:294-304`. | Two payload families coexist (F14). | Specified. |
| B3 | Saved synastry with unknown schema | U, I | Entries with other schema are dropped silently (`src/parts-cartographer/core/cloud-storage.ts:184-186`). | Hidden rather than migrated or flagged. | Specified. |
| B4 | `publicProfiles` gains a field | I | Exact-key rule (`firestore.rules:312-320`). Client writes both shapes (`src/parts-cartographer/core/user-directory.ts:38-43`; `src/services/user-directory.service.ts:94-100`). | No version; new fields require rule and both clients changed together. Stale clients fail closed. | Specified. |
| B5 | Sensory preferences with unknown value | U, Q | `normalizeSensoryPreferences` resets unknown values to defaults (`src/parts-cartographer/core/sensory-preferences.ts:34-46`). `src/parts-cartographer/core/sensory-preferences.spec.ts:29-40` covers malformed values. | Roadmap asks for a "versioned local contract" (`docs/80-20-plan.md:319`). Key carries version; value does not (F16). | Specified. Spec exists, not executed. |
| B6 | Two directory implementations drift | I | Same collection and fields today (`src/parts-cartographer/core/user-directory.ts:38-43` vs `src/services/user-directory.service.ts:94-100`). | No shared contract test found. | Specified. |

### 8.3 Account change

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| C1 | Anonymous to Google link | N | UID kept (`src/parts-cartographer/core/ports.ts:11` comment; `src/parts-cartographer/core/auth.service.ts:97-100`). | Publication then starts at this point. Public disclosure must precede it (F01). | Specified. |
| C2 | Google credential already in use | I | Signs into existing account (`src/parts-cartographer/core/auth.service.ts:97-108`). No merge of prior anonymous local data located in `src/parts-cartographer/core/auth.service.ts`, `src/parts-cartographer/core/local-store.ts` or `src/parts-cartographer/app.jsx` [inference]. | Local map may belong to a different account. Decide ownership on switch (F12). | Specified. Gap [inference]. |
| C3 | Sign out | N | Deletes the push token first (`src/parts-cartographer/core/auth.service.ts:144`), then removes `ifs.auth` (`src/parts-cartographer/core/auth.service.ts:146`). `ifs.profile`, `ifs.parts` and `ifs.share.codes` remain (`src/parts-cartographer/app.jsx:65-68` loads regardless of auth). Sign-out not reachable from React UI (`src/parts-cartographer/screens/landing.jsx:139` opens login overlay). | No sign-out action; no account-scoped clearing (F12). | Specified. |
| C4 | Email change | N | Directory refreshed only on next linked sign-in (`src/parts-cartographer/core/auth.service.ts:41-47`; `src/parts-cartographer/core/user-directory.ts:34-46`). Readers cache for 5 minutes (`src/parts-cartographer/core/user-directory.ts:12`). | Old email may remain visible until next sign-in (F13). | Specified. |
| C5 | Two accounts on one device | N | Share index filtered by uid in UI (`src/parts-cartographer/overlays.jsx:192-195`). Codes from the other uid remain valid server-side. Once the local index is cleared, they cannot be listed (`firestore.rules:228`). | Orphaned grants are not recoverable through the UI (F07 class). | Specified. |
| C6 | Saved synastry across accounts | N | Written under the viewer's uid (`src/parts-cartographer/core/cloud-storage.ts:150-171`). | Correct. Copies of partner data remain under the old uid after the viewer changes account. | Specified. |
| C7 | Sensory preferences across accounts | N | Device-level (`src/parts-cartographer/core/sensory-preferences.ts:11`; `src/parts-cartographer/app.jsx:59`). Matches the roadmap split of device presentation from account data (`docs/80-20-plan.md:319`). | Intended. Document as device-scoped. | Specified. |

### 8.4 Deleted source

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| D1 | Share code revoked | I | Document deleted (`src/parts-cartographer/core/cloud-storage.ts:282-287`; `src/parts-cartographer/overlays.jsx:347-361`). Redeem returns null (`src/parts-cartographer/core/cloud-storage.ts:249-256`). Recipient's saved synastry and connection remain (`:150-171`). No client `deleteDoc` on synastry found. | Copies cannot be recalled (roadmap `docs/80-20-plan.md:575`). Disclosure text must say so (F06). | Specified. Emulator covers rule-level delete only. |
| D2 | Source map cleared locally | N | `setProfile(null)` removes local profile (`src/parts-cartographer/app.jsx:166`). Cloud copies (`users/{uid}/assessment`, `history`, any `shareCodes` snapshot) are untouched; no delete path found. | Cloud copies have no withdrawal path (F04, F06). | Specified. |
| D3 | Therapist invite withdrawn by client | I | Owner delete allowed on `therapistLinks` (`firestore.rules:251`) but no UI path. Therapist copy in `therapistClients` cannot be deleted by the client (`firestore.rules:532`). | Withdrawal does not reach the therapist copy (F05). | Specified. No emulator test of deletion. |
| D4 | Booking grant withdrawn | X | Appointment decline removes read (emulator `:414-425`). Client-side `clientShares` delete allowed (`firestore.rules:466`), no UI path. | Booking path is revocable server-side. | Specified. |
| D5 | Public profile withdrawn | I | Owner delete rule exists (`firestore.rules:321`). No client caller in `src/`. Sign-out does not delete it (`src/parts-cartographer/core/auth.service.ts:141-148`). | Withdrawal path missing (F04). | Specified. Gap. |
| D6 | Therapist availability removed | I | Document cannot be deleted (`firestore.rules:334`). Availability can be overwritten. | Visibility of a practitioner record cannot be fully withdrawn (F03). | Specified. |
| D7 | Shared snapshot outlives source | N | Share snapshot is a copy in `shareCodes`, independent of `users/{uid}` (`src/parts-cartographer/core/cloud-storage.ts:206-214`). | "Deleted source" and "revoked grant" are separate states; B01 must separate them in the contract. | Specified. |

### 8.5 Duplicate or cancelled operation

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| E1 | Double activation of share create | I | `busy` and `shareConfirmed` guards (`src/parts-cartographer/overlays.jsx:325-326`). State updates are asynchronous; a second call in the same tick is not separately guarded [inference]. | Add an idempotency key or a single in-flight promise (F07). | Specified. Gap [inference]. |
| E2 | Timeout after commit during share create | I | `createPrivateShareCode` retries with a new code on collision (`src/parts-cartographer/core/cloud-storage.ts:224-245`). `withResilience` times out after 10 s and retries (`resilience.ts:7-9, 17-33`). On retry the transaction sees the committed document and returns false, which triggers a new code. The first code is never returned to the UI and is not stored in the local index (`src/parts-cartographer/overlays.jsx:333-336`). | Orphaned bearer code that the user cannot see or revoke [inference]. Fixture needed for B01.S04. | Specified. Not exercised. |
| E3 | Redeem twice | N | `saveCloudSynastry` uses `set` without merge for `synastry/{partnerUid}` (`src/parts-cartographer/core/cloud-storage.ts:166-171`); connection uses merge. | Idempotent overwrite. Acceptable, but the old copy is replaced silently. | Specified. |
| E4 | Revoke twice or revoke failure | I | `deleteDoc` idempotent (`src/parts-cartographer/core/cloud-storage.ts:286`). Local index removed only after success (`src/parts-cartographer/overlays.jsx:352-353`). Failure shows `shareCodeFailed` (`:358`). | Good. Add a pending-revocation state for offline use. | Specified. |
| E5 | Repeated directory sync | N | `setDoc` with merge (`src/parts-cartographer/core/user-directory.ts:38-43`). Angular debounce 500 ms (`src/services/user-directory.service.ts:70`). | Idempotent. | Specified. |
| E6 | Cancel during synastry narrative | Q | Abort controller `synNarrativeAbort` (`src/parts-cartographer/overlays.jsx:208`) stops visible update only. | Share create, revoke and publication have no cancel. No retraction of publication exists (F04). | Specified. |
| E7 | Concurrent booking for same slot | I | Deterministic busy-slot id (`firestore.rules:340-`); emulator "permits exactly one concurrent client reservation" (`firestore.rules.emulator.spec.ts:389`). | Precedent for dedupe in B01 contracts. | Specified. Emulator test exists. |
| E8 | Therapist invite double submit | I | `linkBusy` guard (`src/parts-cartographer/overlays.jsx:1507`). | Adequate for a single tab. | Specified. |

### 8.6 Offline or quiet alternative

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| O1 | Offline start | Q | Anonymous bootstrap failure falls back to an offline guest with a `local_` uid (`auth.service.ts:51-56, 81-91`). Local navigation continues (`src/parts-cartographer/app.jsx:194-195`). | Offline guest cannot publish (no linked email). Good. | Specified. |
| O2 | Offline share create, redeem or revoke | I, Q | Requires Firestore; error shown (`overlays.jsx:341, 358`). No queued retry. Alternatives: backup export (`src/parts-cartographer/core/backup.ts:148-156`) or native share (`src/parts-cartographer/overlays.jsx:1485-1505`, which is an external effect). | No offline share state. Native share is not a substitute for a revocable grant. | Specified. |
| O3 | Offline directory lookup | I | Lookup fails; the in-memory cache is the only cache (`src/parts-cartographer/core/user-directory.ts:12-27`). Firestore offline persistence is not configured in code read [inference]. | Specify unavailable state for lookups. | Specified. Gap [inference]. |
| O4 | Quiet presentation | Q | "Still" preset (`src/parts-cartographer/core/sensory-preferences.ts:17`); sound off by default (`:12-14`); reduced-motion detection in `src/parts-cartographer/services/universe-scene.ts:81`. | Interaction between sensory preference and OS preference is not verified here. | Specified. Not exercised. |
| O5 | Local save failure | I | `store.save` swallows quota errors (`src/parts-cartographer/core/local-store.ts:22-24`). | Roadmap requires exposing save failures (`docs/80-20-plan.md:87`). Gap (F17). | Specified. |
| O6 | Declined publication (solo use) | D, Q | No state exists. Solo use works without a directory row, but a directory row is created on every linked sign-in (`src/parts-cartographer/core/auth.service.ts:41-47`). | Decline must be a stored state, not an absence (F01). | Specified. Gap. |

### 8.7 social.profile-specific rows

| # | Scenario | States | Current behaviour (evidence) | B01 requirement or gap | Status |
|---|---|---|---|---|---|
| G1 | Public field choice | N, D | Fields fixed by rule (`firestore.rules:312-320`). No UI to choose fields. | Per-field, per-purpose selection required (social plan `docs/plans/social-creative-practice-beads-plan.json`, B01 description). | Gap. |
| G2 | Private content excluded from public surfaces | N | `publicProfiles` holds four keys only (`firestore.rules:314`; `src/parts-cartographer/core/user-directory.ts:38-43`). Busy slots exclude client email (`firestore.rules:337-338`); roster booking rows carry `clientEmail` (`firestore.rules:481`). | Passes for clinical and assessment data. Email is still public (F02). | Static pass. |
| G3 | Authored names, pronouns, plural profiles | U | No code found for pronouns or plural profiles (grep over `src/` returned no matches). | Must not be inferred. Absent state must be stated. | Absent. |
| G4 | Practitioner status claim | U, X | Device flag (`src/parts-cartographer/overlays.jsx:1005-1006`; `src/parts-cartographer/screens/innerverse.jsx:636`). Copy: "License is verified on the first incoming claim request" (`strings.ts:613`). No verification code found in `core/`, `screens/`, `worker.ts` or rules. | Copy and behaviour disagree (F09). | Gap. |
| G5 | Therapist summary truthfulness | N | Literal `activation: 1` and `tier: 'active'` for each complex (`src/parts-cartographer/overlays.jsx:1451`). Literal `adherence: { done: 0, skipped: 0 }` (`src/parts-cartographer/overlays.jsx:1458`). Consent copy says it shares "adherence summary" (`strings.ts:371`). | Projection values are placeholders presented as measured (F08). | Gap. |
| G6 | Partner resolution by UID | X | Angular accepts a non-8-character input as a UID and loads that user's assessment (`src/app.component.ts:1609-1617`; `src/app/core/adapters/firebase-storage.adapter.ts:35-40`). Access depends on rules and grants only. | Client-side path with no explicit consent check (F10). | Gap [inference]. |
| G7 | Bearer-code entropy | N | Angular 8-character code from `Math.random` (`src/app/core/adapters/firebase-storage.adapter.ts:8-15`). React 12-character code from `crypto.getRandomValues` (`src/parts-cartographer/core/cloud-storage.ts:197-204`). | Harmonise on the stronger generator (F18). | Gap. |

---

## 9. Findings register

Risk ratings are triage ratings for B01.S02. They are not acceptance decisions.

| ID | Risk | Finding | Evidence | Status |
|---|---|---|---|---|
| B01-S01-F01 | High | Email and display name are published to `publicProfiles` on every linked sign-in, with no purpose-specific consent, field choice, or stored decline. This conflicts with the planning requirement that public discovery use chosen fields and per-purpose consent. | `src/parts-cartographer/core/auth.service.ts:41-47`; `src/parts-cartographer/core/user-directory.ts:34-46`; `src/services/user-directory.service.ts:78-88`; social plan B01 description | Open |
| B01-S01-F02 | High | Every signed-in session can read every `publicProfiles` document. The rule has no block, purpose or field predicate. The Angular service documents this as a known limitation. Reading by `list` is possible from rule text [inference]. | `firestore.rules:311`; `firestore.rules.emulator.spec.ts:314`; `src/services/user-directory.service.ts:40-43` | Open |
| B01-S01-F03 | Medium | Therapist email is written to `therapists/{uid}` and readable by any signed-in session. The document cannot be deleted. | `src/parts-cartographer/core/booking.ts:245-252`; `src/parts-cartographer/overlays.jsx:983`; `firestore.rules:326-334` | Open |
| B01-S01-F04 | Medium | No client path withdraws a public profile. The rule allows owner delete, but no caller exists in `src/`. | `firestore.rules:321`; absence of `deleteDoc` on `publicProfiles` in `src/` | Open |
| B01-S01-F05 | Medium | Therapist-invite copies cannot be withdrawn by the client. Only the therapist may delete the roster row. The client's delete of the invite does not reach the copy. No emulator test covers deletion. | `firestore.rules:251, 532`; `src/parts-cartographer/core/therapist-link.ts:86-130` | Open |
| B01-S01-F06 | Medium | Share codes have no expiry. Revocation does not reach copies held by redeemers. The UI copy says the code can be revoked, which is true only for the code. | `firestore.rules:80-100`; `cloud-storage.ts:150-171, 282-287`; `strings.ts:193` | Open |
| B01-S01-F07 | Medium | Timeout-after-commit during share creation can orphan a valid bearer code that the UI never records or lists. | `src/parts-cartographer/core/cloud-storage.ts:224-245`; `resilience.ts:7-9, 17-33`; `src/parts-cartographer/overlays.jsx:333-336`; `firestore.rules:228` | Open. Inference, not exercised. |
| B01-S01-F08 | Medium | Therapist summary sends literal placeholder values for complex activation and adherence. The consent copy describes an adherence summary. | `overlays.jsx:1451, 1458`; `strings.ts:371` | Open |
| B01-S01-F09 | Medium | Practitioner attestation is a device flag set by a button. The copy says license is verified at first claim. No verification code was found. | `src/parts-cartographer/overlays.jsx:1000-1007`; `src/parts-cartographer/screens/innerverse.jsx:630-637`; `strings.ts:613` | Open |
| B01-S01-F10 | Medium | Linked-account gating is client-only. Rules accept any Firebase session, including anonymous. The Angular partner path accepts a UID. | `src/parts-cartographer/overlays.jsx:371`; `firestore.rules:15-17, 226-231`; `src/app.component.ts:1609-1617` | Open |
| B01-S01-F11 | Medium | The Angular synastry flow stores the partner's raw 64-response vector in `localStorage`. The key is in the portable allowlist. Whether it reaches a React export depends on shared origin, which is not verified. | `src/app.component.ts:1633-1637`; `src/parts-cartographer/core/backup.ts:17` | Open |
| B01-S01-F12 | Medium | Sign-out deletes the push token, then clears the cached auth record (`src/parts-cartographer/core/auth.service.ts:144-146`). Local profile, parts and share index remain. Sign-out is not reachable from the React UI. A link to an existing Google account does not merge prior local data. | `auth.service.ts:97-108, 141-148`; `src/parts-cartographer/screens/landing.jsx:139`; `src/parts-cartographer/app.jsx:65-68` | Open |
| B01-S01-F13 | Low | Email changes reach the directory only at the next linked sign-in. Readers cache for five minutes. | `src/parts-cartographer/core/auth.service.ts:41-47`; `src/parts-cartographer/core/user-directory.ts:12` | Open |
| B01-S01-F14 | Medium | Two directory implementations and two share-payload families exist. Both are accepted by rules. No shared contract test was found. | `src/parts-cartographer/core/user-directory.ts`; `src/services/user-directory.service.ts`; `src/parts-cartographer/core/cloud-storage.ts`; `src/app/core/adapters/firebase-storage.adapter.ts`; `firestore.rules:80-100` | Open |
| B01-S01-F15 | Medium | The share snapshot allowlist includes clinical scores, attachment, complexes and part narrative fields. It cannot be reused as a public-discovery projection without a new allowlist. | `src/parts-cartographer/core/cloud-storage.ts:40-62`; `strings.ts:193` | Open |
| B01-S01-F16 | Low | Sensory preferences are device-local and absent from backup. This is consistent with the roadmap split, but the value has no schema field. | `sensory-preferences.ts:11, 34-46`; `src/parts-cartographer/core/backup.ts:10-18`; `docs/80-20-plan.md:319` | Open |
| B01-S01-F17 | Medium | Local save failures are swallowed without user feedback. The roadmap requires exposing save failures. | `src/parts-cartographer/core/local-store.ts:22-24`; `docs/80-20-plan.md:87` | Open |
| B01-S01-F18 | Low | Angular bearer-code generator uses `Math.random`. The React generator uses a CSPRNG. | `src/app/core/adapters/firebase-storage.adapter.ts:8-15`; `src/parts-cartographer/core/cloud-storage.ts:197-204` | Open |
| B01-S01-F19 | Low | Planning-path drift. The B01 epic write set is `docs/plans/extension/b01/**`. B01.S01 uses `architecture/extension/development/b01/s01/**`. The `architecture/` directory did not exist before this cell. | Social plan JSON B01 and B01.S01 metadata; task file | Open. Coordinator decision. |
| B01-S01-F20 | Medium | Package-ID collision for C01, C02 and C08 across the creative-commons and elevation plans. | `docs/plans/creative-commons-beads-plan.md:23-30`; `docs/plans/elevation-aaa-v7-beads-plan.json` `slot_streams` and `beads_ids`; social plan B01 `relates_to` edges | Open. Coordinator to confirm mapping. |

---

## 10. Source and data provenance

**Repository.** Branch `worktree-agent-a129fab48560e7d83`; base commit `09194df`; working tree clean before this file was written. No source file was modified.

**SHA-256 of the principal sources read (computed at this base).**

| File | SHA-256 |
|---|---|
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` |
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` |
| `docs/plans/social-creative-practice-beads-plan.md` | `9c079c78f0a778d89b92a2b50149678744be37279c50fee4791ff22f0e35d2d9` |
| `docs/plans/creative-commons-beads-plan.md` | `f49ea73427a25e4313a4b3a728608a9238604ed93d3f33e603940284d48983db` |
| `docs/plans/creative-commons-beads-plan.json` | `e5751250e3729e5d45e9f56e0ad886346a3573943bab5e804625ebcc5b1823a1` |
| `docs/plans/elevation-aaa-v7-beads-plan.json` | `88f5ffef002676450518f1cec4e526c9abf0452ecc5023d85613d3d00b39d82e` |
| `docs/plans/references/AAA-V7-SPEC.source.md` | `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc` (matches the pinned SHA-256 in the plans) |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` |
| `firestore.rules` | `726b3e108fe6fee73d3340a20130952e70aa56ad7c029b6d65ff07c699f8335a` |

Hashes are full SHA-256 values computed with `sha256sum` at base `09194df` (section 12).

**Data handling.** No credential, token, email address of a real person, participant response or private record was copied into this file. Example addresses in the emulator tests were not reproduced. Where the repository contains raw-answer or clinical fields, this file names the field and does not reproduce values.

**Source classification.** Plans and roadmap documents are design inputs. Code, rules and tests are implementation evidence for the present state. Test titles are cited as existing, not as passing. AAA source text is normative input at the pinned hash, although the AAA document itself is marked draft normative.

---

## 11. Actual role, write and contract manifest

```yaml
bead: ArchetypeAI-8qmt
planning_key: B01.S01
role_dispatched: slot-owner            # from Bead metadata
role_exercised: candidate-producer (static inventory; no slot publication)
base_generation: null                  # unresolved; not an active generation
predecessor_contract_versions: []      # none exist for social.profile
owned_slots: []                        # none claimed; no lease held
read_set_actual:
  - docs/80-20-plan.md
  - docs/plans/first-principles-elevation-beads.md
  - docs/plans/aaa-v7-architecture-and-agent-sweeps.md
  - docs/plans/social-creative-practice-beads-plan.json
  - src/parts-cartographer/core/ports.ts
  - docs/plans/social-creative-practice-beads-plan.md
  - docs/plans/creative-commons-beads-plan.md
  - docs/plans/creative-commons-beads-plan.json
  - docs/plans/elevation-aaa-v7-beads-plan.json
  - docs/plans/references/AAA-V7-SPEC.source.md
  - src/parts-cartographer/core/{auth.service,local-store,user-directory,cloud-storage,therapist-link,booking,sensory-preferences,backup,push,telemetry,profile-contract}.ts
  - src/parts-cartographer/{app.jsx,overlays.jsx,innerverse.jsx,screens/landing.jsx,i18n/strings.ts}
  - src/services/user-directory.service.ts
  - src/app/core/{ports,adapters,data}/*.ts (directory and storage ports, adapters)
  - src/app.component.ts (share and synastry sections)
  - src/app/features/{cabinet,booking-panel}/*.ts (lookup call sites)
  - firestore.rules; firestore.rules.spec.ts; firestore.rules.emulator.spec.ts
  - worker.ts (route list)
  - core and spec files listed in section 12
write_set_actual:
  - architecture/extension/development/b01/s01/b01-s01-inventory.md
write_set_declared: architecture/extension/development/b01/s01/**
central_writes: none
app_source_writes: none
package_or_lock_writes: none
ci_or_rules_writes: none
shared_locale_writes: none
contracts_published: none
bd_commands_run: none
push: none
status_changes: none (coordinator updates ArchetypeAI-8qmt)
workcell:
  checkout: worktree-agent-a129fab48560e7d83 (isolated git worktree)
  dependencies: not installed in worktree (node_modules absent); not installed to avoid writes outside write set
  fixture_database: none
  ports: none
  lease: none (workcell_status proposal_requires_resolved_base_contracts_capabilities_and_lease)
```

---

## 12. Checks run

Checks are static and were run in this worktree.

| Check | Command or method | Result |
|---|---|---|
| Read-set existence | `ls` on the five read-set paths | 5 of 5 exist |
| Reuse ID resolution | Python read of `docs/plans/elevation-aaa-v7-beads-plan.json` `beads_ids` and `slot_streams`; `docs/plans/creative-commons-beads-plan.json` `beads_ids` | C01, C02, C08 resolve to two different sets of live IDs (section 3) |
| Declared C08 path | `git ls-files` and `git log --all -- '*personal-memory*'` at base 09194df | Not tracked at base; added at HEAD in 3670a3a |
| Namespace of B01 relations | Python read of social plan JSON `graph.edges` for `from_key == "B01"` | `relates_to` to `ArchetypeAI-zzmm`, `ArchetypeAI-j60z`, `ArchetypeAI-v2tj` |
| Absence checks | Grep over `src/` for `deleteDoc` on `publicProfiles`, `therapistLinks`, `therapistClients`, `clientShares`, synastry; for `auth.signOut` callers; for `pronoun`, `plural`, `deleteUser` | Absence confirmed as stated in section 4 and 8 |
| Citation check | Python checker `b01s01_check.py` in the coordinator scratchpad, not in the repository. Resolves each `path:line` citation to a tracked file, checks the range, and checks 187 key quoted tokens on their cited lines. Output saved as `b01s01_check.out` beside it. | The checker reported 301 of 301 citations and 187 of 187 token assertions at its run ref. That run predates these corrections. The review found base rows citing `src/shared/...` paths that do not exist at `09194df`, so this count is not current. |
| Hashes | `sha256sum` over the ten principal sources and `firestore.rules` | Full values in section 10. Match the checker's hash output. |
| Whitespace and file state | `grep` for trailing whitespace in the inventory; `git status --short` | Zero trailing-whitespace lines. Only the inventory file is new under `architecture/`. |

**Not run.** Unit tests (`src/**/*.spec.ts`), Firestore rules emulator tests (`firestore.rules.emulator.spec.ts`), Angular and React builds, browser parity suites, live Firebase calls, device checks, participant or practitioner sessions, and independent review. The worktree has no `node_modules`. Installing or linking dependencies would write outside the declared write set. Existing test titles are cited as present; none are claimed to pass.

---

## 13. Limitations

1. **Static evidence only.** Behaviour is inferred from code and rule text. Items marked [inference] (F02 listing, F07, E1, E2, O3, G6, C2) require fixtures or runtime checks.
2. **Partial UI trace.** Overlays, landing, app state and Angular share and cabinet call sites were traced. The full Cabinet and Booking screens and the Angular booking flow were not traced in depth.
3. **Rules not executed.** Rule statements are read from `firestore.rules`. The emulator suite that would assert them was not run.
4. **Six dimensions are a framework, not a suite.** The dimensions come from AAA §11C.2. No compatibility suite exists for any slot. Section 7 records current positions, not passes.
5. **C08 seam absent at the base.** The C08 declared path did not exist at 09194df (added at HEAD in 3670a3a). Any statement that consent or provenance is "reused" at the base would be incorrect.
6. **Creative-commons and elevation IDs.** The mapping in section 3 rests on the social plan's `relates_to` edges and slot semantics. It is not confirmed by the task body.
7. **Dates and policies.** The "User-approved 2026-10-06 discussion" is not in the repository. Requirements are taken from the planning documents and roadmap that are present.
8. **No user or practitioner input.** Nothing here reflects what users, therapists or community members understand, expect or consent to.
9. **Pending evidence.** Every row marked "Specified" in section 8 remains unexercised. Participant, device, live-service, practitioner, tradition and independent review evidence are all pending.

---

## 14. Next handoff

**Consumer:** ArchetypeAI-rqkd, [B01.S02] Specify authoritative state, grants and effects. It should read this file with the source references in section 2.

**Decisions B01.S02 must make, in order of priority:**

1. **Publication default and purpose.** Whether a directory row exists at all, which fields are published, for which purposes, and whether a decline is a stored state (F01, F02, A6, A8, O6).
2. **Directory read scope.** Replace the unconditional signed-in read with a purpose-scoped, block-aware read, or document why it is unchanged. Decide the status of email enumeration (F02, A7).
3. **Therapist email.** Whether `therapists/{uid}` may carry email, and whether the document may be deleted (F03, D6).
4. **Withdrawal semantics.** For each of publicProfiles, share codes, therapist invites and booking grants: what is revoked, what copies remain, and what the disclosure copy must say (F04, F05, F06, D1, D3, D5).
5. **Account change.** Sign-out wiring, clearing rules, the policy for prior local data on account link, and uid partitioning of share indexes (F12, C2, C3, C5).
6. **Device-local preferences contract.** Whether sensory preferences join backup, and what schema field they carry (F16, B5, C7).
7. **Projection allowlists.** A new allowlist for public and therapist projections, separate from the synastry snapshot. Correct placeholder values or label them (F15, F08, G5).
8. **Attestation.** Whether practitioner status is verified, and what the copy may say until it is (F09, G4).
9. **Failure states.** Pending-revocation, pending-publication, unknown-directory and offline states, and exposure of local save failures (F05, F07, F17, E4, O3).

**Fixtures to hand to B01.S04:** orphan share code after timeout (E2); anonymous Firebase session reading directory and share codes (A2, A7); therapist invite withdrawal (D3); booking grant withdrawal (D4); email change (C4); sign-out and re-sign-in on one device (C3, C5); Angular UID path (G6); summary placeholder values (G5).

**Evidence still pending (none collected):** emulator runs of the rules suite; unit test runs; browser or device checks of the consent flows; live Firebase verification; participant review of the disclosure text; practitioner review of the therapist summary; independent review of this inventory.

**Blockers and coordinator actions:**

- Confirm the C01, C02, C08 mapping to `ArchetypeAI-zzmm`, `ArchetypeAI-j60z`, `ArchetypeAI-v2tj` (section 3.2, F20).
- Resolve `base_generation` and publish or name predecessor contracts before B01.S02 contract work begins.
- Decide the planning-path drift in F19.
- Record this section in ArchetypeAI-8qmt. This cell did not run `bd`.
