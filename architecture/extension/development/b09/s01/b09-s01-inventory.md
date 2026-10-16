# B09.S01 — Current ownership and actual reuse: accessible bounded practice runner

**Status: candidate awaiting independent review. Not an acceptance claim.**

- Evidence basis: static reading of the repository at base commit `09194df5f48326bff14e42a1e4eb8d66c457186d`, plus parsing of the planning JSON files. No runner behavior was executed.
- Participant, unprompted-user, device or manual assistive-technology, live Firestore/account, practitioner, tradition/source, and independent-verifier evidence: **pending. None was collected.**
- Scope: inventory and reuse reconciliation only. No app source, rules, locales, package files, CI, or Beads state was changed.

## 0. Identity and workcell facts

| Item | Value |
| --- | --- |
| Bead | `ArchetypeAI-cs6n` — [B09.S01] Inventory current ownership and actual reuse |
| Epic / parent | `ArchetypeAI-7y2b` — [B09] Accessible bounded practice runner P1 |
| Planning key / planning Bead | `B09.S01` / `ArchetypeAI-cyqe` |
| Owned slot (epic) | `practice.runner` |
| Role / mutation / risk (S01 metadata) | slot-owner / M0 / R2 (epic B09 metadata says R1) |
| Reuse packages named in metadata | `C02`, `C08` (reconciled in §2) |
| Base | git commit `09194df5f48326bff14e42a1e4eb8d66c457186d`, branch `worktree-agent-a01db783e51b2a4d9`, clean at inspection |
| `base_generation` / `contract_versions` | `null` / `[]`. No immutable generation and no published predecessor contract exist. |
| Leases | None. Metadata `workcell_status`: proposal requiring resolved base, contracts, capabilities and a lease. This artifact does not claim a lease. |
| Successor | `ArchetypeAI-ivlh` — [B09.S02] Specify authoritative state, grants and effects (blocked by this step) |

## 1. Result in brief

1. **No `practice.runner` seam exists in code.** The AAA ten-slot list (`docs/plans/aaa-v7-architecture-and-agent-sweeps.md:71-82`) does not include `practice.runner`. The social plan adds it as an eleventh slot (`B09`, owned slot `practice.runner`, in `docs/plans/social-creative-practice-beads-plan.json`). No port, contract, or registry entry for it exists in `src/`.
2. **Runner behavior exists on two surfaces that disagree.** The active Vite/React screen `src/parts-cartographer/screens/practice.jsx` (entry `index.html` → `src/parts-cartographer/main.jsx`) and a retained Angular panel `src/app/features/practice-panel/` (mounted at `src/app.component.html:387-391`) share the engine and copy in `src/shared/core/data/exercises.ts` and `src/shared/i18n/strings.ts`. They differ on grant source, RED gating, stored flags and check-in input (§3, §8).
3. **Reusable today:** the exercise engine and copy (56 exercises, 22 types), the therapist assignment path (`parts-cartographer/core/therapist-link.ts` plus the `assignments` Firestore rules), the local store, and the portable backup. B09.S01 should not add new runner infrastructure; B09.S02 should specify against these existing owners.
4. **`C02` and `C08` are creative-commons workstreams, not practice-runner reuse packages.** `C08` reaches B09 only indirectly, through `F43` and `F46`. `C02` has no declared path to B09. Recorded as a metadata discrepancy for the coordinator (§2).
5. **Entry is coupled to the 147-item clinical assessment.** No exercise, suggestion, or assignment is visible unless `profile.testModel === 'angular-v2'` and a clinical profile exists (`practice.jsx:43`, `:64`, `:194`; `exercises.ts:153`). This conflicts with the requirement to preserve assessment-free support. It is a product decision (Q1), not a defect fixed here.
6. **Grant and effect defects are visible in the code** (§9): a therapist-assignment ID mismatch with the runner catalog, a RED gate that the assignment call site does not apply, assignments that cannot be retracted, a therapist summary that always reports adherence 0/0, and device-global progress with no account scoping.
7. **No scenario was exercised.** The existing specs are listed as references (§8, §13), not as acceptance evidence.

## 2. Reuse-package reconciliation (`C02`, `C08`)

| Package | Definition (source) | Declared reuse | Reference to B09 / practice runner | Verdict |
| --- | --- | --- | --- | --- |
| `C02` | Living places and temporary camps (`docs/plans/creative-commons-beads-plan.md:24`; node `C02` in `docs/plans/creative-commons-beads-plan.json`) | `F02, F24, F26, F45, B03, B11` (node description) | None. The `C02` node names only `B03` and `B11`. The B09 platform row lists `C02` as a consumer (`social-creative-practice-beads-plan.md:138`; JSON `platforms.B09[3]`). | **Unsupported as reuse for practice.runner.** Treat as an unverified consumer claim; coordinator to confirm or remove. |
| `C08` | Cross-circle expeditions (`creative-commons-beads-plan.md:30`; node `C08`) | `F07, F23, F24, F42, F43, F46` | Indirect only. `F43` lists platforms `B06,B09,B11`; `F46` lists `B06,B08,B09` (social JSON `features`). The `C08` node names no B-package. | **Supported indirectly** through `F43` and `F46`. `C08` is a real downstream consumer of the runner seam. |

Other reuse relevant to the runner, taken from the social plan:

- **`B08` (reviewed source and practice catalog, slot `practice.catalog`)** is the runner's only declared platform dependency (`platforms.B09[4] = ["B08"]`). Edge `B09.S07 blocks B08.S09` (registry publication) is in the JSON. Today the runner catalog has no B08 provenance fields (§3, F-13).
- **`F49` (purpose-organized source-informed practice library; platforms `B08,B09`)**, **`F51`** (`B10,B09`), **`F52`** (`B09,B10,B08`) and **`F54`** (`B11,B08,B09`) are the feature packages that name B09 as a platform.
- **Methods whose consumers include those features** include `M03, M04, M06, M10, M31, M36` (for F49/F52) and `M01, M19, M20, M22` (for F51/F52). Source references are in the JSON `methods`. These are research inputs, not existing code.
- **`E*` and `X*` reuse codes** (for example `E02`, `E10`, `E14`, `X04`, `X05` on `F49`, `F43`, `F46`) are **not defined in any repository file read**. They appear only as references in `docs/plans/social-creative-practice-beads-plan.json`, `docs/plans/social-creative-practice-coverage.json` and `scripts/planning/build-social-creative-practice-plan.py`. Resolving them requires live Beads, which this step did not query. **Unresolved.**

Metadata discrepancies to route to the coordinator (none was edited here; those files are outside the write set):

- Epic `B09` write set is `docs/plans/extension/b09/**`; `B09.S01` write set is `architecture/extension/development/b09/s01/**`. This artifact follows the S01 write set.
- Every `B09.S*` task carries `reuse_packages: [C02, C08]` while epic `B09` carries `[]`. `B02`, `B06` and `B08` show the same pattern, so the field is a consumer list by convention, not a reuse declaration.
- Epic risk is R1 and S01 risk is R2 in the same JSON.

## 3. Ownership map: components and modules (component inventory)

Line anchors are repository-relative and refer to the base commit. "Status" is what the code shows: *active* (mounted in the Vite build), *retained* (Angular build, mounted in `src/app.component.html`), *unused export* (no product caller found by grep), or *test-only*. The repository has no `CODEOWNERS` file, so ownership is **unassigned in repo**; the "role" column describes what the code does.

| # | Component | Path (anchors) | Role today | Status |
| --- | --- | --- | --- | --- |
| C-1 | React runner screen | `src/parts-cartographer/screens/practice.jsx` (322 lines; mount `app.jsx:18`, `:341`) | Suggestion, chapter library, detail with stop rule, ladder, 90 s rehearsal, therapist-assigned list | active |
| C-2 | Runner engine | `src/shared/core/data/exercises.ts` (241 lines): types and gates `:34-57`, catalog build `:69-78`, selector `:83-134`, chapters `:151-159`, depth cap `:181-192`, container and RED `:204-214`, ladder `:230-237` | Pure rules shared by both surfaces | active (React and Angular), with unused exports below |
| C-3 | Runner copy | `src/shared/i18n/strings.ts`: practice UI copy `:542-580`; type map and `ExerciseText` `:1516-1575`; 56 entries `:1577-2309` | Bilingual copy for runner and catalog | active |
| C-4 | Retained Angular runner | `src/app/features/practice-panel/practice-panel.component.{ts,html}` (149 / 111 lines); mounted `src/app.component.html:387-391`; opened `src/app.component.ts:814-819` | Parallel runner with local flags, no RED gate (§8, SC-02) | retained |
| C-5 | Therapist assignment UI | `src/parts-cartographer/screens/innerverse.jsx`: exercise list `:437`, submit handler `:540-552`, selector `:601-616` | Therapist chooses an exercise ID and frequency | active |
| C-6 | Legacy exercise ID table | `src/parts-cartographer/i18n/strings.ts`: `EXERCISE_TYPE_MAP` `:775-787`, `EXERCISE_COPY` `:788-809` (keys `e1`–`e20`) | Source of the therapist dropdown only (`innerverse.jsx:6`, `:437`, `:603`) | active for the therapist dropdown; not in the runner catalog |
| C-7 | Assignment data access | `src/parts-cartographer/core/therapist-link.ts`: `TherapistAssignment` `:22`; `createTherapistLink` `:86`; `claimTherapistLink` `:105`; `assignExercise` `:174-191` (RED gate `:177-183`, ID `:186`); `myAssignments` `:194-199`; `CONSENT_TEXT` `:201-203` | Only client path for assignments and roster | active |
| C-8 | Server authority | `firestore.rules`: `hasTrustedTherapistClientLink` `:115-131`; `therapistClients` `:472-533` (therapist delete `:532`); `assignments` `:537-556` (read `:538-539`, create `:540-554`, update and delete denied `:555`) | Who may create, read and change grants | active (not run in emulator) |
| C-9 | Practice state persistence | `src/parts-cartographer/core/local-store.ts`: `store` `:15-54` (quota errors swallowed at `:23`); `KEYS` `:56-72` (no practice key); practice keys set in `practice.jsx:9-10` | Device-local progress | active |
| C-10 | Backup and restore | `src/parts-cartographer/core/backup.ts`: practice and check-in keys in `BASE_KEYS` `:10-16`; `PORTABLE_KEYS` `:18`; `validEntry` `:47-64` (object-shape check only, `:63`); `applyBackup` `:132-146`; `exportBackup` `:148-156` | Export and import of progress | active |
| C-11 | Check-in producer | `src/parts-cartographer/screens/check-in.jsx`: `CHECKIN_KEY` `:22`; `saveHistory` `:106-109`; `storeEvent('ifthen_fired')` `:189`; Angular `checkin-panel.component.ts` `:133` | Supplies `daysOfCheckIns` (chapter 2) and fired events | active (and retained) |
| C-12 | Local event log | `src/shared/core/data/state-v2.ts`: `LoggedEventKind` `:298-299`; `EVENT_KEY` `:302`; `storeEvent` `:304-310`; `loadEvents` `:312-315`; `resistantMetrics` `:328-345`; read by `src/app/features/therapist-panel/therapist-panel.component.ts:229` | Runner writes `ifthen_written`; `resistantMetrics` derives `ifThenFireRate` from runner and check-in events | active (Angular reader) |
| C-13 | Selfserve gate | `src/shared/core/data/state-v2.ts:360-365` (`selfServeGate`) | YELLOW gate: `selfEnergy >= 40` and no gripping complex | active |
| C-14 | AI port method | `src/parts-cartographer/core/ports.ts:28` (`AI_PORT.suggestExercise`); `src/parts-cartographer/core/ai.adapter.ts:57-65` and `:167` | Defined but **no caller** in `src/` (grep); its fallback ignores the 24-hour limit | unused export |
| C-15 | Therapist share summary | `src/parts-cartographer/overlays.jsx:1437-1459` (`adherence: { done: 0, skipped: 0 }` at `:1458`); `createTherapistLink` call `:1511` | Snapshot of the profile sent when a therapist link is created | active |
| C-16 | Profile source and gate input | `src/parts-cartographer/core/clinical-profile-adapter.ts:78`, `:243` (`testModel: 'angular-v2'`); `src/parts-cartographer/core/profile-contract.ts:31-33`; `app.jsx:163-166` (`setProfile`); history restore `cabinet.jsx:136` | Clinical profile that gates the runner | active |
| C-17 | Firestore client | `src/environments/firebase-init.ts:29-37` (`initializeFirestore` without a persistent local cache) | Assignment reads need the network | active |
| C-18 | Identity lifecycle | `src/parts-cartographer/core/auth.service.ts`: sign-in to an existing account after `credential-already-in-use` `:104`; `signOut` removes only `KEYS.auth` `:141-147`. `app.jsx:149-151` (billing restore on `uid`); `app.jsx:390` (overlay remount keyed by `uid`) | Account switch and sign-out behavior | active |
| C-19 | Entry points | `src/parts-cartographer/screens/innerverse.jsx:218` (tray button); `landing.jsx:123` (action, no premium check); `assessment.jsx:399` (`premium ? setOverlay('practice') : openPaywall()`) | Three entries with different entitlement behavior | active |
| C-20 | Existing specs (references, **not executed**) | `src/parts-cartographer/screens/practice-check-in.spec.ts` (tests at `:84`, `:113`, `:122`, `:138`, `:151`); `src/app/core/data/exercises.spec.ts` (describe blocks `:25`, `:54`, `:101`, `:120`, `:146`); `src/app/features/practice-panel/practice-panel.component.spec.ts` (`:27`, `:77`) | Behavioral and rule tests of the engine and UI | test-only (not run here) |

**Unused or half-wired exports and fields (static grep, non-spec sources):**

- `depthCap` and `allowedDepth` (`exercises.ts:181-192`), `unlockedTypes` (`:162-167`), `hasBehavioralHook` (`:170-172`): no product caller. They are covered only by `exercises.spec.ts`. The §3E depth cap is therefore not enforced at runtime.
- `LadderState.liveRep` and `verifiedUnderLoad` (`exercises.ts:226-227`): **no writer** in `src/`. Rungs 4 and 5 cannot be set by any code path, although `practice.jsx:247` shows them as therapist-locked.
- `integrated()` (`exercises.ts:239-241`): no caller. Rung 5 display uses `ladderRung` only.

**Not present in the repository:** a `practice.runner` contract or port; a catalog provenance model (B08); a versioned runner state; a grant-revocation model for practice; a practice consent record (the only consent text is for therapist sharing, `parts-cartographer/core/therapist-link.ts:201-203`); a server route for practice (`worker.ts` and `worker-*.ts` contain no exercise or assignment handling); runner reminders (B05 has no runner hook).

## 4. State inventory

| ID | State | Location and key | Writers | Readers | Scope | Versioned | Backed up / synced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Practice progress: `lastSuggestedAt`, `completed[]`, `daysOfCheckIns`*, `synastryRun`*, `therapistLinked`*, `ladder{}` | localStorage `INNERVERSE_PRACTICE_V1` (`practice.jsx:9`) | `practice.jsx:121-124` (save), `:135-140`, `:143-148`, `:153-167` (rehearsal end); Angular `practice-panel.component.ts:63-65`, `:100-106`, `:118-130`, `:141-144` | `practice.jsx:14-23`; Angular `:56-61` | Device, **not** keyed by account | No version field; key name only | Backup: yes (`backup.ts:14-15`). Cloud sync: none found. |
| S2 | Check-in history | localStorage `INNERVERSE_CHECKINS_V1` (`check-in.jsx:22`) | `check-in.jsx:106-109` | `practice.jsx:25-30` (day count), `check-in.jsx:58` | Device | Row filter only | Backup: yes |
| S3 | Therapist assignments | Firestore `assignments/{id}`, `id = ${clientUid}_${exerciseId}_${Date.now()}` (`parts-cartographer/core/therapist-link.ts:186`) | Therapist via `assignExercise` (`:174-191`; call `innerverse.jsx:545`) | Client `myAssignments` (`:194-199`); therapist read allowed (`firestore.rules:538-539`) | Server | Immutable after create (`:555`) | Server only |
| S4 | Therapist link and roster | Firestore `therapistLinks/{code}` (created with a summary snapshot, `parts-cartographer/core/therapist-link.ts:86-103`); `therapistClients/{therapist_client}` (`claimTherapistLink` `:105`; `firestore.rules:472-533`) | Client creates link (`overlays.jsx:1511`); therapist claims | Therapist dashboard; `parts-cartographer/core/therapist-link.ts:143-160` | Server | Summary is a link-time snapshot; no refresh path found | Server only |
| S5 | Clinical profile (147 descent, `testModel: 'angular-v2'`) | localStorage `ifs.profile` (`parts-cartographer/core/local-store.ts:59`) | `app.jsx:163-166`; `full-assessment.jsx:150`; `assessment.jsx:124`; `cabinet.jsx:136`; `clinical-report.jsx:41` | `practice.jsx:64`; `check-in.jsx:57`; `ai.adapter.ts:59-61` | Device | Schema via `profile-contract.ts` | Backup: yes |
| S6 | Synastry run markers | `INNERVERSE_SYNASTRY_RUNS_V1`, `ARCHETYPE_SYNASTRY_REPORTS` (`practice.jsx:66-70`) | Outside the runner | `practice.jsx:66-70` (chapter 4) | Device | — | Backup: yes |
| S7 | Local event log | `INNERVERSE_EVENTS_V1` (`state-v2.ts:302-310`) | `practice.jsx:259` (`ifthen_written`); `check-in.jsx:189` (`ifthen_fired`); Angular `practice-panel.component.ts:115` | `state-v2.ts:312-315`; `therapist-panel.component.ts:229` | Device | None | Backup: yes |
| S8 | Identity | `KEYS.auth` (`parts-cartographer/core/local-store.ts:61`); Firebase session; `user.uid`, `user.linked` | `auth.service.ts` | `practice.jsx:73-86` (assignments effect) | Account | — | Server session |
| S9 | Ephemeral UI | `selectedId`, `ifThenDraft`, `rehearsalLeft`, `rehearsalTimer`, `assignments`, `assignmentsError` (`practice.jsx:55-62`); Angular signals (`practice-panel.component.ts:49-54`, `:94-95`) | Runner | Runner | Session | No | Lost on unmount or reload |
| S10 | Derived | Suggestion (`practice.jsx:111-119`); `chapterState` (`:98-104`); `assignedIds` (`:105`); `container` (`:106-109`); `allowedFor` (`:42-48`) | Recomputed each render | Runner | — | — | — |

\* Stored but **not** written by the React runner (it recomputes these values, `practice.jsx:98-104`). The Angular panel reads the stored values as truth (`practice-panel.component.ts:78-86`). No code path in `src/` sets `therapistLinked: true`, so the value is either stale or edited by hand. Flagged for B09.S02.

## 5. Effect inventory (AAA §9 classes)

Classes come from `docs/plans/references/AAA-V7-SPEC.source.md:330-335` (E0 PURE, E1 READ, E2 MONOTONE_WRITE, E3 REVERSIBLE_WRITE, E4 IDEMPOTENT_EXTERNAL, E5 IRREVERSIBLE_EXTERNAL). The classifications below are proposed for this inventory, not established by a verifier.

| ID | Effect | Path (anchors) | Proposed class | Idempotency or dedupe today | Failure surface today |
| --- | --- | --- | --- | --- | --- |
| EF-1 | Read assignments | `practice.jsx:72-86` → `parts-cartographer/core/therapist-link.ts:194-199` | E1 | None. Stale-response guard via `active` flag (`:79`, `:85`). | Alert `practice.jsx:81-83`, `:295`. No cache because Firestore has no persistent cache (`firebase-init.ts:31-33`). |
| EF-2 | Mark practiced | `practice.jsx:126-133` | E2 (set add) | Deduped by `includes` (`:127`) | Quota failure swallowed (`parts-cartographer/core/local-store.ts:23`); success toast shown unconditionally (`practice.jsx:132`) |
| EF-3 | Open suggestion and 24 h stamp | `practice.jsx:135-141`; `exercises.ts:122` | E3 (overwrite) | Stamp written at most once per 24 h (`:138`) | Same silent save |
| EF-4 | Ladder patches (name, if-then, rehearsed) | `practice.jsx:143-148`, `:153-167` | E3 | Overwrite of the whole ladder entry. Closure-based merge at `:146`; rehearsal end re-reads storage at `:158`. | No version, lock, or cross-tab listener (none in `practice.jsx`). Last write wins. |
| EF-5 | Append event | `practice.jsx:259` (`storeEvent`) | E2 | None. Unbounded append. | Silent (`state-v2.ts:309`) |
| EF-6 | Therapist assigns exercise | `innerverse.jsx:540-552` → `parts-cartographer/core/therapist-link.ts:174-191` | E2 (create only) | **Not idempotent**: ID includes `Date.now()` (`:186`). UI busy flag only (`innerverse.jsx:542`). | Alert `therapistSaveFailed` (`innerverse.jsx:555`). RED gate skipped because the call passes no `opts.red` (`innerverse.jsx:545`; gate at `parts-cartographer/core/therapist-link.ts:177-183`). |
| EF-7 | Backup export | `backup.ts:148-156` | E1 | Not applicable | Malformed records skipped (`backup.ts:153`) |
| EF-8 | Backup import (replace or merge) | `backup.ts:132-146` | E3 | Rollback of every touched key on failure (`:132-146`) | Rolls back; replace mode removes absent portable keys (`:133`) |

**No E4 or E5 effect exists in the runner today.** The runner sends no notification, invitation, or external message. Any future reminder (B05) would be E5 and would need an effect identity.

## 6. Relevant states (normal, unknown, declined, denied, interrupted, quiet)

| Class | State | Condition and source | What the user sees (copy key) | Status |
| --- | --- | --- | --- | --- |
| Normal | Clinical profile, suggestion available | `practice.jsx:111-119`; `exercises.ts:120-134` | "Today's practice" card with Continue (`copy.today`, `continue`) | Coded; unit-tested with mocks |
| Normal | Clinical profile, assignment present | `practice.jsx:296-315` | Assigned button, enabled if the gate passes | Coded; unit-tested with mocks |
| Unknown | No clinical profile, or other `testModel` | `practice.jsx:64`; `profile-contract.ts:31-33` | Library and assigned items locked; hint "Complete the 147-item descent first" (`:187`) | Coded. Assessment-coupled (Q1). |
| Unknown | Assigned ID not in the catalog | `practice.jsx:300-301` | "Not in this practice library" (`assignedPracticeNotAvailable`) | Coded. Triggered by the ID mismatch (F-02). |
| Unknown | Auth not yet bootstrapped or anonymous | `practice.jsx:73-77` | No assignments; library still works if clinical | Coded |
| Declined | Suggestion or assignment declined | No control exists | None. The only exit is `×` (`practice.jsx:236`), which does not record anything. | **Missing** |
| Denied | RED with no assignment or no container | `practice.jsx:47`, `:219`, `:310`; `exercises.ts:210-214` | Disabled, with `exerciseSafetyGate` | Coded in React; **absent** in Angular (SC-02) |
| Denied | Yellow with `selfEnergy < 40` or a gripping complex | `state-v2.ts:360-365` | Disabled with safety-gate copy | Coded |
| Denied | Assignment read refused or offline | `practice.jsx:81-83` | `assignedPracticesLoadFailed` in an alert (`:295`) | Coded |
| Interrupted | Rehearsal, detail closed | `practice.jsx:236` clears only `selectedId`; timer keeps running (`:153-167`) | Countdown continues; `rehearsed` is written at zero | Coded. Cancel does not cancel (F-08). |
| Interrupted | Rehearsal, overlay left | `practice.jsx:88-90` clears the timer | No completion recorded, silently | Coded |
| Interrupted | Page reload during rehearsal | No persistence of `rehearsalLeft` | Rehearsal lost | Coded |
| Interrupted | `uid` changes during an assignment fetch | `practice.jsx:79`, `:85` | Stale response ignored | Coded |
| Quiet | No suggestion today | `practice.jsx:280-292`; `src/shared/i18n/strings.ts:546-547` ("a quiet day is a real practice too") | Quiet copy, library still open | Coded. No snooze, no "not today". |
| Quiet | Reduced motion or sensory preference | `practice.jsx` imports (`:1-7`) include no sensory module; `sensory-preferences.ts` is separate | None | **Missing** |

## 7. Runner reach and entry points

- Tray button `innerverse.jsx:218` and landing action `landing.jsx:123` open the runner without a premium check.
- Assessment-results button `assessment.jsx:399` opens it only when `premium` is true; otherwise it opens the paywall.
- The entry matrix is therefore inconsistent (F-09). Which behavior is intended is a product decision (Q6).

## 8. Scenario matrix

Each row is one scenario from the acceptance criteria. "Status" uses the labels *observed in code (static)*, *gap*, *not evidenced*. Test names are listed only to show coverage; they were not run here.

| ID | Scenario | Current behavior (static, anchored) | Existing test references (not run) | Status | Gap → handoff |
| --- | --- | --- | --- | --- | --- |
| SC-01 | **Normal grant** | Assignment is listed (`practice.jsx:296-315`). RED is enabled only when the assigned ID matches and `containerReady` holds (`practice.jsx:47`, `:105-109`; `exercises.ts:204-214`). `therapistLinked` becomes true for *any* assignment (`:97`). | `practice-check-in.spec.ts:84-111` (mocked `myAssignments`, mocked app context): RED stays disabled until the safe-place is marked, then enables. | Observed in code (static); unit-level with mocks | Container is self-attested in local storage (SC-02). Real Firestore path not evidenced. → B09.S02, B09.S04 |
| SC-02 | **Denied grant** | (a) No assignment: RED disabled with `exerciseSafetyGate` (`practice.jsx:219`, `:310`). (b) Assigned but no container: disabled. (c) The therapist-side RED check returns `false` only when `opts.red` is passed (`parts-cartographer/core/therapist-link.ts:177-183`), and the only call site omits it (`innerverse.jsx:545`), so a RED assignment can be created without the container. (d) Rules do not check RED or the container (`firestore.rules:540-554`). (e) Angular lists every chapter exercise, RED included, with no grant check (`practice-panel.component.html:51-70`); chapter 5 unlocks from a stored flag (`practice-panel.component.ts:78-86`; `exercises.ts:157`). | `exercises.spec.ts:132` tests the pure gate only. No test covers the call site, rules, or Angular path. | **Gap.** The denial is enforced only in the React view. | Authority location (Q4); tampered-flag and RED-without-container fixtures → B09.S02, B09.S04 |
| SC-03 | **Stale contract** | (a) Assigned `exerciseId` absent from the runner catalog → "Not in this practice library" (`practice.jsx:300-301`). The therapist dropdown offers `e1`–`e20` from the legacy table (`innerverse.jsx:437`, `:603`; `parts-cartographer/i18n/strings.ts:788-809`). The runner catalog uses 56 slug keys (`src/shared/i18n/strings.ts:1577-2309`). Static comparison: **0 overlapping IDs.** Rules accept any string up to 120 characters (`firestore.rules:546-547`). (b) Stored progress has no version; the loader merges defaults and filters only `completed` and `ladder` (`practice.jsx:14-23`). (c) Backup validation is shape-only for practice state (`backup.ts:63`). (d) Replacing the profile from history (`cabinet.jsx:136`) changes gating; progress is kept. (e) Non-`angular-v2` profiles are treated as no clinical profile (`practice.jsx:64`). (f) `AI_PORT.suggestExercise` (`ports.ts:28`) has no caller and a different input (`checkIns: []`, `ai.adapter.ts:61`). | None for the ID mismatch or versioning. | **Gap (confirmed by static comparison).** | Catalog identity and versioned schema → B09.S03; B08 provenance → coordinator |
| SC-04 | **Account change** | Practice keys are not account-scoped (`practice.jsx:15`; `parts-cartographer/core/local-store.ts:15-23`). The overlay remounts on `uid` change (`app.jsx:390`), so the runner re-reads device state, but device state is not per account. Assignments are re-fetched for the new `uid` (`practice.jsx:72-86`). Signing in to an existing Google account after an anonymous session switches `uid` (`auth.service.ts:104`). `signOut` removes only `KEYS.auth` (`auth.service.ts:141-147`), so progress, profile and check-ins remain on the device. The Angular panel has no notion of account. | None. | Observed in code (static); not exercised. **Gap**: no account isolation for progress. | Scope decision (Q3) → B09.S02 |
| SC-05 | **Deleted source** | (a) Catalog entry removed: assignments show the missing label; `completed` and `ladder` entries are orphaned and never pruned (`practice.jsx:101`, `:211`, `:228`). (b) Profile removed or replaced: chapters lock; progress kept (`practice.jsx:98-104`). `setProfile(null)` (`app.jsx:166`) has no UI caller found. (c) Check-ins cleared: chapter 2 relocks (`practice.jsx:65`, `:100`). (d) Assignment withdrawal: impossible from the client and from the therapist (`firestore.rules:555`). (e) Roster removal: therapist may delete `therapistClients` (`firestore.rules:532`) but nothing on the client reads the roster for assignments (`:537-539`), and `therapistLinked` derives from any assignment (`practice.jsx:97`), so chapters 4 and 5 and RED remain. (f) Backup replace removes absent portable keys (`backup.ts:132-146`). | None. | **Gap.** No retraction, no revocation, no orphan handling. | Retraction and revocation semantics (Q2); orphan rule → B09.S02, B09.S05 |
| SC-06 | **Duplicate or cancelled operation** | (a) Double "Mark practiced": deduped (`practice.jsx:127`). (b) Repeated open of the suggestion: 24 h stamp (`:138-140`; `exercises.ts:122`). (c) Double assignment: UI busy flag (`innerverse.jsx:542`, `:615`), but `assignExercise` is not idempotent (`parts-cartographer/core/therapist-link.ts:186`), so retries and refreshes can create duplicates. (d) Rehearsal: closing the detail does not cancel the timer (`practice.jsx:236`, `:153-167`); leaving the overlay clears it silently (`:88-90`); reload loses it. (e) Starting a second rehearsal clears the first (`:150-151`), but the countdown is global (`:263-265`), so it appears on any rung-2 card. (f) `uid` change cancels assignment fetch (`:79`, `:85`). (g) Two tabs: no `storage` listener; last write wins (`:121-124`). | None. | Observed in code (static). **Gap** for (c), (d), (g). | Operation identity, cancel semantics → B09.S02, B09.S05 |
| SC-07 | **Offline / quiet alternative** | (a) Library, suggestion and ladder work offline because the catalog is bundled and progress is local (`practice.jsx:14-23`, `:111-119`; `exercises.ts:69-78`), but only after the clinical gate. (b) Assignments fail offline with an alert (`practice.jsx:81-83`, `:295`); no cached list (`firebase-init.ts:31-33`). (c) Quiet alternative: quiet-day copy (`src/shared/i18n/strings.ts:546-547`) and the 24 h limit; no "skip today", snooze or decline; no reduced-motion binding (no sensory import, `practice.jsx:1-7`); the 90 s countdown has no pause and no live region. (d) Angular: storage errors swallowed (`practice-panel.component.ts:56-65`). | None. | **Gap** for skip and decline; accessibility of countdown not evidenced. | Declined state, quiet mode, live-region behavior → B09.S02, later device checks |
| SC-08 | **Six compatibility dimensions for `practice.runner`** | See the table below. Dimensions are the AAA §11C.2 list: interface, state, effects, operations, performance, failure semantics (`docs/plans/references/AAA-V7-SPEC.source.md:589-600`; summary `aaa-v7…md:84`). | None. | **Gap** on all six. | B09.S02 and B09.S03 |

**SC-08 detail: six compatibility dimensions**

| Dimension | Current evidence | Gap | Needed by |
| --- | --- | --- | --- |
| Interface | No published contract. React `Practice()` takes no props and reads app context (`practice.jsx:52-53`). Angular `PracticePanelComponent` takes a `profile` model and a `closed` output (`practice-panel.component.ts:44-45`). `AI_PORT.suggestExercise` (`ports.ts:28`) is unused. `TherapistAssignment` is a TypeScript interface only (`parts-cartographer/core/therapist-link.ts:22`). | Two unversioned interfaces; no schema for catalog entries or assignments | B09.S03 |
| State | Device progress unversioned (`practice.jsx:9`); server assignments immutable (`firestore.rules:555`); stored chapter fields have divergent meaning (React recomputes, Angular trusts) | No migration, no account scope, no provenance per entry | B09.S02, B09.S03 |
| Effects | Local E1–E3 effects (§5); one non-idempotent E2 create (`parts-cartographer/core/therapist-link.ts:186`); no E4 or E5 | Effect identity for assignment create; retraction effect undefined | B09.S02 |
| Operations | Logging is `console.error` only (`practice.jsx:82`). No runner metric, flag, or dashboard. Rollback is revert of the commit. Retained Angular deployment not verified. | No observability for denied, failed, or orphaned states | B09.S07, B09.S08 |
| Performance | No declared SLO. The overlay re-renders every second during rehearsal (`practice.jsx:153-167`). Assignment fetch runs on each `uid` change. Local history keeps up to 30 full copies per key (`parts-cartographer/core/local-store.ts:5`, `:25-33`). Nothing measured. | Declared envelope absent | B09.S02 |
| Failure semantics | Quota failures swallowed (`parts-cartographer/core/local-store.ts:22-23`), yet "done" is toasted (`practice.jsx:132`). Assignment fetch failure shows an alert (`:81-83`). No timeout, retry, or fallback for `getDocs`. Rehearsal lost on reload. | Failure matrix; truthful success signal | B09.S02 |

## 9. Findings for the coordinator and B09.S02

Severity is a planning label for this inventory, not a product or safety judgment. Nothing here was fixed.

| ID | Severity | Finding | Anchors |
| --- | --- | --- | --- |
| F-01 | High | Entry requires the 147-item clinical profile; no assessment-free path to any exercise, suggestion or assignment. | `practice.jsx:43`, `:64`, `:194`; `exercises.ts:153` |
| F-02 | High | Assignment ID mismatch: therapist dropdown uses `e1`–`e20`, runner catalog uses 56 slug keys; rules accept any string. | `innerverse.jsx:437`, `:603`; `parts-cartographer/i18n/strings.ts:788-809`; `src/shared/i18n/strings.ts:1577-2309`; `firestore.rules:546-547` |
| F-03 | High | RED gate not applied when a RED assignment is created. The call site passes no `opts.red`; rules do not check RED or the container. The client `exerciseSafetyGate` branch at `innerverse.jsx:546-547` is therefore unreachable. | `innerverse.jsx:545`; `parts-cartographer/core/therapist-link.ts:177-183`; `firestore.rules:540-554` |
| F-04 | High | No retraction or revocation path: assignments are immutable (`firestore.rules:555`); roster removal has no client effect; `therapistLinked` derives from any assignment. | `firestore.rules:532`, `:555`; `practice.jsx:97` |
| F-05 | High | Therapist summary sends `adherence: { done: 0, skipped: 0 }` while the consent text promises exercise adherence. The summary is a link-time snapshot. | `overlays.jsx:1458`; `parts-cartographer/core/therapist-link.ts:201-203`; `overlays.jsx:1511` |
| F-06 | Medium | Progress is device-global, not account-scoped; sign-out leaves it in place. | `practice.jsx:15`; `parts-cartographer/core/local-store.ts:15-23`; `auth.service.ts:141-147` |
| F-07 | Medium | Save failures are swallowed while success is toasted. | `parts-cartographer/core/local-store.ts:23`; `practice.jsx:132` |
| F-08 | Medium | Rehearsal close does not cancel; leaving the overlay cancels silently; reload loses it. | `practice.jsx:88-90`, `:153-167`, `:236` |
| F-09 | Medium | Entitlement is inconsistent across three entries. | `assessment.jsx:399`; `innerverse.jsx:218`; `landing.jsx:123` |
| F-10 | High (on the retained surface) | Angular panel has no RED gate and trusts stored flags. It is mounted in the app shell. Deployment of that build is not verified. | `practice-panel.component.html:51-70`; `practice-panel.component.ts:78-86`; `src/app.component.html:387-391` |
| F-11 | Medium | Depth cap and related helpers have no product caller; the §3E depth rule is tested but not enforced at runtime. | `exercises.ts:162-172`, `:181-192`; `exercises.spec.ts:125-127` |
| F-12 | Medium | Ladder rungs 4 and 5 have no writer. | `exercises.ts:226-227`; `practice.jsx:247` |
| F-13 | Medium | Runner catalog carries no B08 provenance (source, version, license, tradition, evidence, scope, review, withdrawal). The type has only title, desc, steps and stopRule. | `src/shared/i18n/strings.ts:1575`; B08 contract in `social-creative-practice-beads-plan.json` |
| F-14 | Low | `AI_PORT.suggestExercise` is unused and its fallback ignores the 24 h limit. | `ports.ts:28`; `ai.adapter.ts:57-65` |
| F-15 | Low | No "skip", "not today" or decline control; `adherence.skipped` cannot be produced. | `practice.jsx:280-292`; `overlays.jsx:1458` |
| F-16 | Low | Assignment reads need the network; no persistent offline cache. | `firebase-init.ts:31-33` |
| F-17 | Low | Practice state has no version; backup validation is shape-only. | `practice.jsx:9`; `backup.ts:63` |
| F-18 | Low | Duplicate assignments possible; ID includes `Date.now()`. | `parts-cartographer/core/therapist-link.ts:186` |
| F-19 | Low | Countdown has no pause and no live region; reduced-motion or sensory preference not consumed. | `practice.jsx:263-265`; `practice.jsx:1-7` |
| F-20 | Low | Restoring an older profile from history changes gating while progress persists. | `cabinet.jsx:136` |
| F-21 | Low | Two exercise-ID tables with different schemes. | `parts-cartographer/i18n/strings.ts:788`; `src/shared/i18n/strings.ts:1577` |
| F-22 | Low | `ifthen_written` and `ifthen_fired` events from the runner and check-in feed `resistantMetrics` (`ifThenFireRate`) read by the Angular therapist panel. Provenance of those events is not separated from measurement. | `state-v2.ts:328-345`; `therapist-panel.component.ts:229`; `check-in.jsx:189`; `practice.jsx:259` |

## 10. Decisions required before B09.S02 can specify

- **Q1 — Assessment-free entry.** Should practice have a path that does not require the 147-item profile? The 80/20 plan asks to remove unnecessary assessment and synastry prerequisites (`docs/80-20-plan.md:470`), and the B09 epic requires preserving assessment-free support.
- **Q2 — Grant semantics.** Is a therapist assignment a current grant (lapses on unlink, can be withdrawn) or a historical record? Current rules make it immutable with no revoke path (`firestore.rules:555`).
- **Q3 — Progress scope.** Device-global, account-scoped, or explicitly transferred? What happens on account switch and sign-out?
- **Q4 — Authority for RED and container.** Client-only, call-site, or server or rules? The container is currently self-attested in local storage.
- **Q5 — Catalog identity.** One catalog (`src/shared/i18n/strings.ts`) or the legacy `e1`–`e20` table? Are B08 provenance fields required before assignment?
- **Q6 — Entitlement.** Which entry is intended: premium only (`assessment.jsx:399`) or open (`innerverse.jsx:218`, `landing.jsx:123`)?
- **Q7 — Adherence.** Should therapist summaries carry real done and skipped counts (`parts-cartographer/core/therapist-link.ts:40`; `overlays.jsx:1458`), and how should `CONSENT_TEXT` (`parts-cartographer/core/therapist-link.ts:201-203`) describe them?
- **Q8 — Metadata.** Keep, correct or remove `C02` and `C08` on the B09 S-tasks (coordinator; outside this write set). Resolve the `E*`/`X*` codes through live Beads.
- **Q9 — Rehearsal semantics.** Does closing the detail cancel or complete the rehearsal? What is recorded in each case?

## 11. Source provenance

| Source | Identifier | Notes |
| --- | --- | --- |
| Base commit | `09194df5f48326bff14e42a1e4eb8d66c457186d` | Branch `worktree-agent-a01db783e51b2a4d9`; `git status --short` empty at inspection |
| Bead text | Task file `cs6n.txt` in the session scratchpad (`tasks/cs6n.txt`) | Read in full; acceptance criteria and execution requirements used as stated |
| Social planning JSON | `docs/plans/social-creative-practice-beads-plan.json`, blob `d7acf515c30d95c11028085baf360feaa35b46fe` | Parsed: 1807 nodes, 4240 edges; `prepared_date` 2026-10-06; `planning_bead` `ArchetypeAI-cyqe`; 15,058,952 bytes |
| Creative-commons plan | `docs/plans/creative-commons-beads-plan.md` (blob `6e64b476009052c2a1e9460e4ec2015ad3782e48`), `.json` (blob `cbe2605ef4f32b4f4c66c24787b47d02a1be8d8c`) | Prepared 2026-10-10 |
| 80/20 plan | `docs/80-20-plan.md` (blob `0fbd09fe918beef19e7b276a47cced4e812ed398`) | Updated 2026-10-04 |
| First-principles plan | `docs/plans/first-principles-elevation-beads.md` (blob `e724cd055bb82798d439eb2bba20cd4a9f63d479`) | Prepared 2026-10-06 |
| AAA plan | `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` (blob `ae04de5adf54fc52bfa090e5c2883afed83dc573`) | Prepared 2026-10-06 |
| AAA snapshot | `docs/plans/references/AAA-V7-SPEC.source.md` (blob `2eb18f3f77257b492df1fe1484f8237a930c508e`) | `sha256sum` = `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc`, equal to the pinned value in the social JSON `baseline` and the AAA plan line 5 |
| `ports.ts` (read set) | `src/parts-cartographer/core/ports.ts` (blob `68e6214a0ec9ba5679a35dd8ae6289ddc95fee36`) | Read in full |
| Code under inspection | Blob IDs from `git ls-tree HEAD` for `practice.jsx` (`20894313…`), `exercises.ts` (`aaa2740e…`), `parts-cartographer/core/therapist-link.ts` (`dd67642b…`), `innerverse.jsx` (`3a7e8bcc…`), `overlays.jsx` (`19a5784c…`), `firestore.rules` (`36ffb114…`), `parts-cartographer/core/local-store.ts` (`e28e50d5…`), `backup.ts` (`7917f0a3…`), `ai.adapter.ts` (`8dc103fb…`), `practice-panel.component.ts` (`5d9d5772…`), `src/shared/i18n/strings.ts` (`c24957fe…`), `parts-cartographer/i18n/strings.ts` (`8b83c660…`) | Full list in `git ls-tree` output at base |
| Live Beads | Not queried | No `bd` command was run (rule for this step). Statuses, `E*`/`X*` codes, and external IDs are unresolved. |

Derived values (B09 node counts, ID comparisons, usage greps) came from short Python and grep runs in the session scratchpad. Those scripts are not committed.

## 12. Role, write, and contract manifest

- **Role:** slot-owner (S01 metadata). Mutation M0, risk R2 (S01 metadata).
- **Read set (metadata):** `docs/80-20-plan.md`, `docs/plans/first-principles-elevation-beads.md`, `docs/plans/aaa-v7-architecture-and-agent-sweeps.md`, `docs/plans/social-creative-practice-beads-plan.json`, `src/parts-cartographer/core/ports.ts`. All five exist at base and were read. Beyond the read set, the trace also read the code, rules and creative-commons plan files listed in §11.
- **Write set used:** `architecture/extension/development/b09/s01/b09-s01-inventory.md` (new). Nothing else.
- **Central writes:** none. Broker-owned composition, worker routes, Firestore rules, shared locales and integration fixtures were not touched.
- **Contracts consumed:** none published. **Contracts produced:** none. Proposed contracts for B09.S03 are named in §10 but not published.
- **Capabilities used:** repository read, git read, local Python JSON parsing into the scratchpad. No network, no test execution, no dependency installation.
- **Leases:** none. Isolation: separate worktree; scratch files outside the repository.

## 13. Checks run (attributable)

| # | Check | Method | Result |
| --- | --- | --- | --- |
| 1 | Read-set presence | `ls -la` on the five metadata files | 5 of 5 present |
| 2 | Social plan structure | `python3 -I` JSON parse | 1807 nodes; 4240 edges; 11 `B09` nodes; `B09.S01` reuse `[C02, C08]`; B09 platform tuple `[..., [C02,C08], [B08]]`; edges `B09.S02→B09.S01`, `B09.S07→B08.S09` |
| 3 | Creative-commons plan | `python3 -I` JSON parse and B-code scan | `C02` names `B03, B11`; `C08` names no B-package; neither names B09 |
| 4 | AAA snapshot integrity | `sha256sum` | Matches the pinned SHA256 |
| 5 | Exercise ID comparison | Regex over both string tables | 56 type-map keys = 56 copy keys (identical sets); legacy `e1`–`e20` overlap with catalog = 0 |
| 6 | Export and usage greps | `rg` over `src/` (non-spec) | `depthCap`, `allowedDepth`, `unlockedTypes`, `hasBehavioralHook`: no product caller. `liveRep`, `verifiedUnderLoad`: no writer. `AI_PORT.suggestExercise`: no caller. `ifthen_fired`: written by `check-in.jsx:189` and `checkin-panel.component.ts:133`. |
| 7 | Git state | `git status --short`; `git ls-tree HEAD` | Clean at inspection; blob IDs recorded in §11 |
| 8 | Citation anchors | Script resolves each cited `path:line` against `git ls-files` and checks the line is in range; printed the cited line for review | 145 citations, 0 unresolved or out-of-range. Review of the printed lines found two wrong anchors (`innerverse.jsx:549` → `:555`; `backup.ts:154` → `:153`) and two ambiguous bare names (`therapist-link.ts`, `local-store.ts`), which were qualified with their `parts-cartographer/core/` path. Re-run after the fixes: 0 problems. |
| 9 | Whitespace | `git diff --cached --check` on the staged deliverable | Passed (no output, exit 0) |

**Not run:** Vitest (`practice-check-in.spec.ts`, `exercises.spec.ts`, `practice-panel.component.spec.ts`), `tsc`, lint, build, Firestore emulator (`firestore.rules.emulator.spec.ts`), browser parity, device or assistive-technology checks. This worktree has no installed dependencies, and installing them or running tests would write `node_modules` and caches outside the write set. The spec names in §8 are therefore references only.

## 14. Evidence status

| Evidence | Status |
| --- | --- |
| Existing runner specs | Listed; **not executed** |
| Independent verifier review of this inventory | **Pending** |
| Participant or unprompted user task | **Pending**; none collected. The user's phone report ("tested and fine") is not a measurement of this inventory. |
| Device or manual assistive-technology checks | **Pending** |
| Live Firestore assignment flow with real accounts | **Pending**; rules not run in the emulator |
| Practitioner or tradition review of the catalog | **Pending**; catalog has no provenance fields (F-13) |
| Quiet or offline behavior on a device | **Pending** |
| Clinical or spiritual service acceptance | Not applicable at this step; requires its own operator, scope and evidence |

## 15. Limitations

- Static reading only. Nothing was executed. Anchors refer to base `09194df` and will drift with later commits.
- Two runner surfaces exist. Deployment status of the Angular build was not verified.
- Live Beads were not queried. Status, `E*`/`X*` codes and external IDs are unresolved.
- Firestore rules were read, not run in the emulator.
- The primary checkout's uncommitted state was not inspected (the AAA plan notes uncommitted application changes there). This artifact describes the base commit only.
- Exercise content was not reviewed clinically. This inventory makes no safety judgment about the 56 exercises.
- Scope is the runner. Check-in, booking, and therapist dashboards are traced only where they touch runner state.

## 16. Rollback and undo

Documentation-only commit on the worktree branch. Undo with `git revert <sha>` or by dropping the branch. No product code, rules, data, locale, package file or Beads record was changed.

## 17. Next handoff: B09.S02 (`ArchetypeAI-ivlh`)

- **Consume** this file at the commit the coordinator records. Use §4 (state), §5 (effects), §8 (scenarios), §9 (findings) and §10 (decisions Q1–Q9).
- **Do not** start code, and do not treat F-items as fixed.
- **Before B09.S02 is dispatched, the coordinator should:**
  1. Resolve or correct `C02` and `C08` on the B09 S-tasks (§2).
  2. Resolve the `E*`/`X*` reuse codes through live Beads.
  3. Confirm the base or generation for dispatch. Current base is `null`.
  4. Obtain an active lease for B09.S02's write set.
  5. Confirm the status of `B08.S09` (catalog registry publication). It gates B09.S07, not S02.
- **Bead update (paste-ready for the coordinator):** status "candidate awaiting independent review"; evidence "static trace only; participant, device, live-service, practitioner and verifier evidence pending"; artifact path above; checks §13 (1–9; test execution not run); limitations §15; next handoff §17; do not close.
