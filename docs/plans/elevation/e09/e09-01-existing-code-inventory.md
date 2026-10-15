# E09.01 Existing-code inventory: practice, cabinet, and the return loop

**Disposition:** source inventory only. This records visible behavior and gaps from the permitted source set; it does not establish E09.01 acceptance or any user outcome.

## Evidence boundary

- Pinned source base: `09194df5f48326bff14e42a1e4eb8d66c457186d`.
- The only application sources reviewed were `src/parts-cartographer/screens/practice.jsx` and `src/parts-cartographer/screens/cabinet.jsx`; the only planning source reviewed was `docs/80-20-plan.md`.
- Source hashes at that base: `practice.jsx` `c3506563cf272fdfdcc0f2e1421a247713bf8aacaf6e1e3e260c1aa61f51958f`; `cabinet.jsx` `38ec41be52062ecea90e346e9ae501feefc2473d25ae21d6b2c55cb2dd941c03`; `80-20-plan.md` `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`.
- `architecture/contracts/` is absent at this source base. No contract file was available to validate an artifact, event, storage, or replay schema.
- Scope is deliberately limited to the task's declared read set. The required predecessor outputs, original Beads `ArchetypeAI-28h.2.10`, `.3.2`, `.3.4`, `.5.4`, and `docs/eleven-out-of-ten-plan.md` were not read. Reconciliation with those records is pending because the task metadata read set does not authorize them.
- The isolated workcell is pinned to the source base. Its local reservation is coordination metadata only; it is not a broker lease or a sandbox. This write does not establish a broker claim, clean execution boundary, or permission to expand scope.
- No app code was changed. No tests or builds were run. No participant sessions, device observations, or live-service checks were performed.

This document uses four evidence labels:

- **Direct source observation:** behavior visible in the reviewed files.
- **Plan requirement:** normative content in `docs/80-20-plan.md`; it is not evidence of implementation.
- **Hypothesis / question:** a risk or interpretation to verify against the missing boundaries or with an authorized fixture.
- **Canonical measurement:** a scored or versioned assessment result. A UI value or user-authored report is not made canonical merely by being displayed or persisted.

## Existing behavior

### Practice screen (`src/parts-cartographer/screens/practice.jsx`)

**Direct source observations**

- The screen loads practice state through `store.load('INNERVERSE_PRACTICE_V1', ...)` and check-ins through `store.load('INNERVERSE_CHECKINS_V1', ...)`. It normalizes `completed` to string IDs, `ladder` to an object, and accepts check-in rows only when the date parses and `arousal` is an integer from -2 through 2 (lines 8–39).
- It derives its optional clinical input only when the supplied profile has `testModel === 'angular-v2'` and a `clinical` value. It derives check-in-day count from the loaded rows and reads local synastry/report flags for chapter readiness (lines 64–107). The calculation and provenance of those inputs are outside this read set.
- The suggested exercise is computed from that clinical value, the loaded check-ins, the current time, and `lastSuggestedAt`. A “Continue” action selects the suggestion and records a timestamp if the previous one is absent or at least a day old (lines 111–141, 280–286). No visible control records “rest” or “not now.”
- Exercise availability is gated by chapter state, exercise gate type, the clinical value, assignment IDs, and local safe-place flags. Therapist assignments are requested only for a linked user with a UID. A rejected request is logged and exposed as an alert; an unlinked user sees no assignments (lines 41–53, 75–85, 98–109, 192–196, 295–315). The assignment service's authorization and persistence behavior were not inspected.
- The detail view has a “done” action that adds the exercise ID to `completed` using `store.save`, then shows a toast. This is an in-app completion marker, not evidence that a practice was attempted or helpful (lines 122–134, 236–243).
- At ladder rung 1, an editable text draft can be saved as an `ifThen` value when its trimmed length exceeds five characters. The patch is written through the same practice-state save path, then `storeEvent('ifthen_written')` is called (lines 91–94, 142–148, 250–261). The event helper's destination, retention, and failure behavior were not inspected.
- At rung 2, a 90-second rehearsal timer is offered. The code marks `rehearsed: true` and saves only when the interval reaches its final tick. An unmount cleanup clears the interval (lines 87–90, 150–164, 263–266); no partial progress is recorded in this screen.
- The component does not visibly write to a canonical score. It consumes a `clinical` profile for gating/suggestion and writes separate practice fields. The contract and origin of `clinical` are not established by this read set.

**Hypothesis / questions to verify**

- `store.load`/`store.save` makes state persistence explicit at the call site, but the adapter's storage medium, account partitioning, encryption, export, deletion, retention, and error semantics are unknown. The component initializes practice state once and shows no account-change reset; verify ownership and account-switch behavior at the storage boundary.
- The saved `ifThen` is user-entered text, but the schema does not identify author, version, retention choice, or link it to a selected intention/practice version in this component. Do not treat it as an outcome or canonical assessment data.
- Because the edit UI is rendered only while `rung === 1`, this file does not demonstrate a path to reopen and revise an already-saved plan at a later rung. Whether `ladderRung` or another route provides one is unknown; the revise-plan scenario remains unverified.
- The presence of `storeEvent('ifthen_written')` does not establish an event log or replay facility. Its persistence, sensitivity, event identity, deduplication, and failure boundaries remain unknown.

### Cabinet (`src/parts-cartographer/screens/cabinet.jsx`)

**Direct source observations**

- The cabinet filters and displays the supplied `parts` array, lets a user add a part with default fields, toggle a star, and open a part sheet. In the sheet, a role field is edited and saved via `setParts`; burden, need, voice, and energy are displayed from the supplied part (lines 28–36, 142–157, 184–207, 290–345).
- Part values are passed into this screen; this component does not label each field's author or source. A role edit is visibly user-entered, but the provenance of the other supplied part fields is not established here.
- Linked users can explicitly invoke cloud-map save and history load. The screen displays consent copy and reports operation success/failure. Cloud-save and history-load responses check the current account before updating the screen. Restore applies either a legacy backup or selected snapshot; neither branch has a visible current-account recheck before applying state (the legacy branch awaits `prepareBackup`, while the nonlegacy branch sets profile/parts and navigates directly) (lines 17–18, 20–22, 31–36, 90–140, 236–260). The copy and UI do not independently prove server retention, deletion, access control, or consent implementation.
- Appointment listing and cancellation use imported service functions, with loading/error states and an account-change guard (lines 41–87, 209–229). Service-side authorization and lifecycle behavior were outside this task's read set.

**Canonical-measurement boundary**

The cabinet's visible part fields and user-edited role are not evidence of a canonical assessment measure. The practice screen's clinical input is used for gates and suggestions, but this source-only inventory cannot verify its instrument, scoring version, norms, provenance, or historical stability. Keep user-authored artifacts, practice markers, service state, and canonical assessment outputs separately identified until their contracts say otherwise.

## Scenario and requirement trace

| Scenario / requirement | Evidence in the permitted sources | Status |
|---|---|---|
| Revise a plan | A text input and save action exist at rung 1; a prior value is loaded into the draft. The UI shown in this file only exposes the edit/save control at rung 1. | **Unverified.** A complete revision path for an existing saved plan is not demonstrated. |
| Decline recording | The plan calls for a “do not record” revisit outcome. The Practice screen has no explicit decline-recording choice or recorded refusal state. Closing the overlay is not evidence of that choice. | **Unverified.** |
| Choose rest | The plan treats stopping/skipping as comfortable and includes rest/independence as an explicit product choice. The reviewed Practice screen offers a suggestion, close controls, and exercises, but no explicit rest choice or rest artifact. | **Unverified.** |
| Replay the same event | The Practice screen invokes one named event helper when saving an if-then entry. No stable event ID, event history, replay control, or deterministic replay behavior is visible. | **Unverified.** |
| Distinguish practice, attempt, adaptation, and helpful outcome | The screen has an in-app “done” marker and a `rehearsed` flag. It does not capture the plan's full set of self-reported revisit outcomes. | **Not evidenced here.** |

These are traceability findings against the checked sources, not claims that another implementation or predecessor artifact does not exist. Those sources are outside this read set.

## Plan requirements (not implementation evidence)

`docs/80-20-plan.md` marks itself as detailed planning, not completed implementation. Its Stage 2 return loop calls for a versioned practice unit and experiment card, a Repair route, user-owned artifacts kept separate from canonical assessment data, explicit retention choice, flexible revisits including “did not try” and “do not record,” and a multi-use intention → practice → attempt/adaptation → revisit journey (section 10, lines 466–489). It says stopping or skipping should be comfortable and outcomes must not be fabricated. The later Replay plan requires pause, replay, immediate skip, and transcript for a staged scene (section 11, lines 491–515), but that feature is a separate future scope and does not establish event replay for the return loop.

The plan's execution guidance requires schema version, producer/consumer, validation, ownership, offline behavior, migration/rollback, and error states before contract integration (section 16.5, lines 718–735). Since `architecture/contracts/` is absent here, these boundaries remain a prerequisite rather than an assumed capability.

## Smallest useful next slice

After resolving the read-set mismatch for predecessor requirements and authorizing/publishing the missing boundary contract, specify one narrow, user-owned experiment artifact and its revisit choice. The contract should distinguish a saved plan revision from an attempt and a self-reported outcome; make “adapted,” “did not try,” and “do not record” distinct choices; define explicit retention and deletion behavior; preserve separation from canonical scores; and define stable event identity/replay semantics only if replay is in scope. Include empty, interrupted, save-failure, account-change, and no-retention fixtures. Then implement only the smallest end-to-end local slice that can pass those fixtures. Do not infer participant benefit or clinical change from saved events.

## Acceptance boundary

This inventory is source-scoped evidence for planning. It does not satisfy live/user/device acceptance, resolve old-Bead reconciliation, validate contract or storage behavior, or authorize implementation beyond this task's scope. This source inventory is author evidence; any later E09 acceptance or implementation evidence requires independent review against the then-authorized sources. Keep E09.01 open until its own acceptance mapping and required predecessor reconciliation can be reviewed within an authorized read set.

## Visible state trace for the Practice flow

This is a source trace, not a runtime or acceptance fixture. It covers the required state categories without asserting unobserved service behavior.

| State | What the permitted source shows | Evidence status / boundary |
|---|---|---|
| Normal | A suggestion card appears when `suggestExercise` returns an exercise; otherwise the “none today” card appears. Selecting an available exercise opens its detail. | Direct UI branches in `practice.jsx`; actual suggestion quality and live usability were not observed. |
| Empty | With no suggestion, the empty-state copy is rendered. With no assignments, the therapist-assignment section is omitted; the chapter list still renders. | Direct conditional rendering; no runtime empty-data fixture was run. |
| Denied | There is no reason-coded denied state. A rejected assignment request is caught and shown as a generic load-failed alert; that rejection does not establish an authorization denial. A safety-gated exercise is disabled with generic safety-gate copy, which is a separate UI branch. | Denial semantics and service response classes are unknown. |
| Failed | Assignment-load failure has a visible alert. The `store.save` and `storeEvent` calls have no local failure branch in this component, so their failure behavior is unknown. The cabinet separately shows cloud and appointment error copy for caught service errors. | Direct UI/error handling only; service, storage, and persistence guarantees are unverified. |
| Interrupted | The rehearsal interval is cleared on unmount, and its `rehearsed` marker is saved only on timer completion. Unsaved if-then text is held in component state until the save action. | The component does not persist partial rehearsal or an interruption choice. Resume/recovery behavior is not established. |
| Quiet / rest | No quiet-mode alternative or explicit choose-rest action is visible in the Practice flow. Closing the overlay exists, but does not record a rest choice. | Not represented in this source; the plan's rest/skip requirement remains unmet by evidence here. |

Contract-dependent implementation fixtures for ownership, retention/deletion, save failure, account change, event identity/replay, and outcome provenance remain pending. This trace does not implement or run those fixtures.
