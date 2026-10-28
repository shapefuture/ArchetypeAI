# E13.01 — Existing-code inventory and evidence map

**Candidate status:** private source-only proposal; no task acceptance is claimed.
**Task reference supplied for this work:** `ArchetypeAI-n215`. No live tracker query was made.
**Pinned source generation:** `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
**Candidate output:** `docs/plans/elevation/e13/e13-01-existing-code-inventory.md`.

## Workcell and source identity

The candidate was prepared in a clean isolated clone at the pinned Git base. Its proposed workcell manifest is `/tmp/innerverse-e13-workcell-manifest.json`, SHA-256 `b398949719155e9ad8e3ee1410cf69db4431070ae252603e9dfbc2347031145f`. Workcell state is recorded at `/tmp/innerverse-e13-workcell-state.json`, SHA-256 `78daa2c3da25954c14366fdcec6f928f6e294b44061bc1dfea29ccd68349496c`.

These are local proposal records only. No live task readiness, task revision, contract binding, native claim, or reservation was checked or validated. They do not constitute a lease or acceptance decision. The task's original-Bead and predecessor reconciliation remains unresolved and was not attempted.

The declared read set was limited to:

| Declared source | Result at pinned base | SHA-256 |
|---|---|---|
| `src/parts-cartographer/ui/ui.jsx` | Present; contains shared presentation primitives including `Sheet`, `Seg`, `Steps`, `Ico`, `Confetti`, and `Tap`. | `d0fd2d17ffe16cdcdc6fe61265fabf1e15926663076011e907d6233beb021731` |
| `src/parts-cartographer/ui/modal-layer.jsx` | Present; contains a keyboard/focus lifecycle wrapper for a modal dialog. | `809871b785f6a52801b6bfbd2af5ff168390ea01ab39eea491b6c144f8eaf08d` |
| `docs/80-20-plan.md` | Present; describes the intended four core paths, draft/persistence requirements, navigation, focus, recovery, and acceptance evidence. | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `architecture/contracts/**` | No directory or contract files in this pinned generation. | No file hashes; directory absent. |

The code and plan hashes identify only these source files at this base; they do not identify a running application or establish deployed behavior.

## Direct source observations

### Shared UI primitives

In `ui.jsx` (`Sheet`, lines 91–108), a closed sheet returns `null`; an open sheet renders a scrim whose click calls `onClose`, a `.sheet` container, and—when a title is present—a close button that also calls `onClose`. This component itself does not declare dialog semantics, label, focus handling, Escape/Back handling, save/undo/pause actions, or persistence. The declared read set does not show whether callers wrap `Sheet` in `ModalLayer` or add other behavior.

### Modal keyboard and focus lifecycle

`ModalLayer` (`modal-layer.jsx`, lines 3–30) declares `role="dialog"`, `aria-modal="true"`, `aria-label`, and `tabIndex={-1}`. On mount it stores the previously focused element; if focus is outside the dialog, it focuses the first visible enabled focusable child (or the dialog root). It observes child-list mutations to move focus back inside if it escapes. Its key handler closes on Escape, wraps Tab and Shift+Tab within the collected visible focusables, and its cleanup disconnects the observer/removes the handler and restores focus to the previous element if that element is still connected.

The handler listens for keyboard events on the modal node. This file contains no explicit browser-history, operating-system Back, page-hide, persisted-state, save, undo, pause, or route-return handler. If another mechanism unmounts the layer, its cleanup attempts focus restoration; this source alone does not establish what happens during a particular Back or interruption path. The files do not show whether the sheet primitive is actually composed with this layer in any core route.

No persistence imports or route-specific saved-state operations appear in these two declared UI files. That is a bounded observation about these files, not a claim that the product has no persistence or save behavior elsewhere.

## Plan-only intent

`docs/80-20-plan.md` sets assessment, Felt mapping, session scheduling, and AI coaching as the four first-release paths (§§1–4). It describes these intended boundaries:

- **Assessment:** back/edit, pause and reliable resume; visible confirmation that progress saved; preserve answers through reload, language change, navigation, offline operation, and result-generation failure. The plan calls for an explicit versioned draft shape and visible storage failures (§2A; §9.2, especially steps 5–10 and acceptance).
- **Map:** stable identity and customization across re-entry, report, backup, and restore; source-aware inspection; stable, undoable customization and unchanged canonical coordinates (§2B; §9.3, especially steps 5–15).
- **Coach:** preserve a draft when a request fails; distinguish transient exchange, explicitly saved excerpt, and user-owned artifact; support inspect/delete/export; avoid silent persistence of all conversations (§2D; §9.4, especially steps 5–6 and 13–16).
- **Booking:** show pending/confirmed/declined/cancelled/conflicted/failed states matching server data; recover from partial failures; reopen appointments from cabinet after reload/sign-in; keep time and consent inspectable (§2C; §9.5, especially steps 6–14).
- **Shared navigation and interruption:** protect drafts, show save failures, preserve focus restoration and predictable browser history, and make the four connected journeys recoverable after reload, back, connection loss, denied access, tab suspension, storage failure, cancellation, and account/language change (§3; §9.1, step 10; §9.6).

The plan also calls for a persistent location cue, recoverable interruption point, resumable drafts, and a clear leave-and-return action (§7.1). It explicitly says map customization should be undoable (§9.3, step 11). It does not define one universal undo model for all four core paths; the exact meaning and retention consequences of undo remain open. These statements are product intent, not evidence that current code implements the behavior.

## Scenario and evidence map

The task scenarios supplied for this proposal are: save, undo, pause, inspect, and return across the four core paths; interrupt a modal or use Back and verify focus; and check that displayed state matches persisted state. None was exercised in this source-only pass.

| Area | Observed in declared code | Relevant plan intent | Missing evidence |
|---|---|---|---|
| Assessment | No route, draft store, save/undo action, or saved-state display in the two shared UI files. | Explicit draft identity/version, save acknowledgement/failure, back/edit, pause/resume, and preservation through reload/offline/context changes. | Actual route and storage owner; success/failure fixtures; before/after persisted values; pause/reload and return trace; no canonical-result changes on incomplete input. |
| Map | No selected-part, customization, undo, backup, restore, or relationship-inspection state in the two shared UI files. | Same identity across surfaces; inspectable source and relationship; customization stable and undoable; restore/export and canonical-coordinate invariance. | Actual map state owner; undo boundary; saved-vs-pending feedback; export/restore trace; proof that presentation edits do not change canonical coordinates. |
| Coach | No message, draft, cancellation, retention, or save/delete operation in the two shared UI files. | Preserve draft on request error; distinguish transient/saved/user-owned content; inspect/delete/export with bounded context and clear local/offline behavior. | Actual request and persistence owners; retry/cancel behavior; account/language switch; retention/delete semantics; visible state compared with durable records. |
| Booking | No provider, appointment, consent, cancellation, or cabinet-reopen state in the two shared UI files. | Real status matched to server state, recoverable partial failures, consent preview, and reopen after reload/sign-in. | Actual appointment and access-link owners; pending/confirmed/failure fixtures; reload and duplicate-request behavior; account/role boundaries and persisted status. |
| Sheet/modal interruption | Scrim and close button call `onClose`; `ModalLayer` handles Escape and Tab cycling and tries to restore prior focus on unmount if the element remains connected. Composition is unknown. | Predictable browser history/focus; interruptions should not strand users; modal and dialog dismissal should return to a useful location. | Whether all core sheets use `ModalLayer`; real browser/OS Back behavior; interruption/unmount ordering; focus return when the trigger is removed or replaced; keyboard/screen-reader behavior. |
| Persisted-state accuracy | Neither declared UI file reads or writes persistent application state; `ui.jsx` does maintain ephemeral component state. No contracts are available. | Visible saved status must reflect actual storage; do not signal success before persistence; retain correct state through recovery. | State owner for each path; durable record/version and read path; storage failure/offline behavior; comparison of displayed state with persisted state. |

No pass/fail result is assigned. Source inspection cannot establish success across the actual four routes, nor verify real storage, browser/OS Back, device behavior, assistive technology, user understanding, or service-backed appointment state.

## Hypotheses and questions to resolve

These are investigation hypotheses, not code facts:

1. The route-specific screens and service/storage modules likely own most save, undo, pause, and return semantics, while the two declared UI files provide shared presentation and focus behavior. The plan's §16.5 lists separate route/service entry points, but this proposal did not inspect them.
2. A single “undo” rule could be wrong across domains: reversing an unsaved map edit, restoring an assessment answer, deleting a coach message, and cancelling an appointment have different ownership and external effects. Define each action with its owning record and persistence boundary before designating it a shared control.
3. `ModalLayer` may be intended to wrap `Sheet`, but that composition is unverified. A future integration trace should distinguish keyboard Escape, browser history Back, operating-system Back, route changes, and component unmount rather than treating them as one event.
4. Focus restoration may fail when the original trigger is disconnected or replaced. The code explicitly restores only when `previous?.isConnected`; the user-visible fallback is not specified in this source set.

## Smallest useful next proposal

When the task's read set and contract bindings are authorized and published, trace one concrete source path per core journey plus its actual state owner. Record, for each save/undo/pause/inspect/return action: record identity and owner, pending versus durable state, acknowledgement/failure behavior, discard/undo semantics, and the return destination. Then inspect the actual modal composition and exercise Escape, Back, interruption, unmount, and focus restoration with keyboard-accessible fixtures.

A useful evidence table should compare the displayed state with the persisted record after save success, save failure, undo, pause/resume, route switch, reload, and account/language change, with separate cases for assessment, map, coach, and booking. Booking must include the real server status/partial-failure boundary; coach must include retention and deletion; map must preserve canonical coordinates; assessment must preserve stable item/result identity. This is a proposed probe set, not a test run or acceptance claim.

To proceed, bind the exact route and persistence files and their published contracts into the task read set; separately authorize any original Beads/predecessor inputs needed for reconciliation. Keep the task open until implementation evidence, empirical/accessibility requirements, and independent review are actually recorded. This candidate changes no app code, executes no tests or runtime checks, makes no tracker update, and leaves original-Bead/predecessor reconciliation unresolved.
