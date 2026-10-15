# E01.01 — Existing-code inventory and evidence/gap map

**Source inventory:** This read-only audit was first prepared as a private proposal; it is not Bead acceptance and does not reconcile predecessor evidence. The final deliverable is now written at the authorized output path recorded below.
**Version lineage:** v2 derived from v1 SHA-256 `f937674b4dd27f65c5ea586c0ae1d9f9f134de6ab0681e58c0152d41883f402a`; the Cabinet role-edit wording is clarified to distinguish a `setParts` state update from durable persistence.
**Target Bead:** `ArchetypeAI-epv` — `[E01.01] Audit existing behavior and reconcile original Beads`
**Observed revision at proposal drafting:** `-6511896860445505556`
**Observed status at proposal drafting:** `open`, unassigned, and in the blocker-aware ready list. A later native claim and pre-dispatch recheck are recorded below.
**Pinned repository HEAD:** `09194df5f48326bff14e42a1e4eb8d66c457186d`
**Task metadata at proposal drafting:** `base_generation=null`; `contract_versions=[]`; the task required a resolved base and lease. The later documentation workcell and local reservation are recorded below.
**Declared output requested:** existing-code inventory, old-Bead reconciliation, gap/evidence map, and smallest useful slice. The private proposal under `/tmp` was outside the write set; this final output is at the authorized `docs/plans/elevation/e01/**` path.

## Scope and provenance

The target's declared read set is:

1. `src/parts-cartographer/screens/practice.jsx`
2. `src/parts-cartographer/screens/cabinet.jsx`
3. `docs/80-20-plan.md`
4. `architecture/contracts/**`

The three declared files exist, are tracked at the pinned HEAD, and had empty scoped `git status --short` output. The declared glob `architecture/contracts/**` has **no matches**: the `architecture/contracts` directory is absent at the pinned HEAD. No other architecture or contract path was substituted.

| Available declared input | SHA-256 at pinned HEAD |
| --- | --- |
| `src/parts-cartographer/screens/practice.jsx` | `c3506563cf272fdfdcc0f2e1421a247713bf8aacaf6e1e3e260c1aa61f51958f` |
| `src/parts-cartographer/screens/cabinet.jsx` | `38ec41be52062ecea90e3469eae501feefc2473d25ae21d6b2c55cb2dd941c03` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `architecture/contracts/**` | No files; path existence checked, no substitute read |

Only the target Bead's own description, acceptance criteria, and filtered metadata were read. Its task text references `docs/eleven-out-of-ten-plan.md` and live tasks `ArchetypeAI-28h.5.3`, `.5.4`, and `.3.5`; they are outside the metadata read set. Their contents, predecessor outputs, linked task descriptions/comments, and any in-progress bodies were not opened. **Old-Bead reconciliation and predecessor evidence remain pending because of this read-scope mismatch.**

No app behavior was executed. No helpers imported by the two screens were read, so calls into persistence, exercise, cloud, account, booking, backup, or state modules below establish only what these screen files render or invoke—not helper implementation, storage guarantees, server behavior, or deployed behavior. No tests, builds, account access, contact, or data collection occurred. The preceding statements describe the private proposal-drafting phase; the later repository output and Beads claim are recorded in the executed workcell section.

## Existing screen-visible behavior

### Practice screen (`practice.jsx`)

The component loads a `PRACTICE_KEY` state and a `CHECKIN_KEY` list through the imported `store`; it normalizes the shape of the local values before using them (lines 9–31, 52–56). The screen reads check-ins for suggestion/chapter state, but has no visible check-in or real-world-outcome entry form in this file. The imported `store` implementation and the source of those check-ins were not inspected.

The main UI can show a “today” suggestion with a continue button, or an empty “none today” message; the selected exercise detail displays authored title/reason/steps, an optional stop rule, and a Done button (lines 227–268, 277–293). A chapter list shows locked/unlocked labels and hints. Exercise buttons are disabled when the screen's composed chapter/safety check returns false; the UI then shows a safety-gate message (lines 183–225, 199–209, 317–322). Exact unlock, safety, and suggestion semantics belong to imported helpers and were not verified.

Visible progress controls include:

- “Done” adds the exercise ID to a local `completed` list and shows a toast (lines 121–133, 242).
- A ladder action can mark a principle as named; a user can enter and save an if-then string longer than five characters; a 90-second rehearsal can be started; when its timer finishes, the screen records `rehearsed: true`; later rung labels can show the saved string and “integrated” state (lines 143–162, 245–268).
- The current rung and completion checkmarks depend on local state and imported `ladderRung`; they do not establish an attempt in ordinary life or an outcome (lines 126–162, 227–268).
- A “close” control hides exercise details; the screen close control closes the overlay. There is no explicit pause/resume or graduation/independence control. On unmount, the running rehearsal interval is cleared, but partial timer state is not visibly saved/resumed in this screen (lines 86–90, 227–230).

When linked user context is available, the screen invokes `myAssignments`; it displays an alert when that request rejects and lists returned assignments when present (lines 73–88, 295–314). This only documents screen-side rendering. Assignment authorization and persistence are unverified.

This screen does **not** expose a chosen concrete personal goal/intention, a revise-goal control, a later real-world outcome report, a “did not try / changed plan / prefer not to record” choice, a graduation path, or an export control. An if-then text is a user-authored practice-plan string; it is not a complete goal/observation/outcome record.

### Cabinet screen (`cabinet.jsx`)

The Cabinet renders a filterable grid of personal part cards, a visible empty-filter message, an add-part button, and part detail/edit sheets (lines 14–20, 150–210, 281–382). Part detail shows the current name, family, energy, star, burden, need, voice, and role. Blurring the role input invokes a handler that calls `setParts` with the updated role and displays a saved toast; this screen source does not establish that the change is durably persisted. The editor allows changing a part's name, family, and traits, with Save and Cancel controls. These are UI edit actions; this source does not show provenance history, a goal, or a real-world outcome record.

Cabinet also renders appointments and cloud-map controls. The appointment area shows loading, empty, or error text, lists returned appointment details, and offers cancellation for pending/approved entries (lines 53–91, 207–232). This is a support/booking surface, not completion of a personal practice outcome.

For cloud maps, an unlinked user sees a login prompt; a linked user can explicitly invoke “save” or “load” controls. Screen code passes `user.uid`, `profile`, and `parts` to `saveCloudMap`, passes `user.uid` to `loadCloudMapHistory`, displays returned history, and offers Restore. The restore handler branches by snapshot schema: `angular-assessment64` snapshots go through `prepareBackup`/`applyBackup` and navigate to `legacy-assessment`, with a visible error toast on failure; other snapshots set profile/parts and navigate to assessment results (lines 94–147, 235–264). This describes the screen handler only; the helper implementations, consent text content, transmitted fields, retention, access control, and cloud failure semantics were not read or verified. This UI's map save/load is not an explicit export or graduation flow.

The file defines a `CharterSheet` that renders date/text rows read from `localStorage` key `ifs.charter`, with an empty state (lines 468–486). This component has no entry or export control in its definition; its call site is outside this scope, so reachability from the reviewed path is unknown. The file's `Chemistry` sheet selects two parts and displays a computed percentage and generated prose (lines 388–465). That output is an app-generated interpretation and must not be treated as a user's observed result or verified personal change.

No user-facing goal/revise/pause/graduation/export path is visible in the reviewed Cabinet/Practice sources. No conclusion is made about other screens or helpers outside the declared read set.

## Evidence categories and limits

| Category | What the allowed evidence supports | What it does not establish |
| --- | --- | --- |
| User-authored content | Part name/family/traits/role edits; the if-then string entered in Practice. | That a chosen intention is captured, linked to a specific context, or retained/exported correctly. |
| In-app activity | Exercise completion mark; principle-named flag; saved if-then string; completion of a local 90-second timer/rehearsal flag. | That an exercise was attempted outside the app, a goal was achieved, or a real-world outcome occurred. |
| User report / observed outcome | No visible later outcome-entry control is present in these two screen sources. | Any claim that a user tried a move, that it helped, or that a psychological quality changed. Missing evidence remains **unknown**, not success or failure. |
| Hypothesis / app interpretation | Suggestions and authored exercise rationale are rendered; `Chemistry` derives a percentage and narrative from part values/families. | Imported algorithm behavior, validity of a hypothesis, causal meaning, or user endorsement. |
| Canonical measurement | Practice can read a `clinical` profile value for suggestion/chapter state; Cabinet displays part fields and a computed chemistry value. | A goal/outcome record or permission to rewrite canonical assessment answers/scores. The plan requires observations, hypotheses, user-authored examples, actions, and instrument-derived signals to remain distinct. |

The screen code exposes local keys and invokes storage/cloud/assignment helpers, but this read set cannot establish storage durability, user/account isolation, export completeness, deletion, consent implementation, server authorization, or service state. No real account, private profile, therapy note, or participant content was inspected.

## Concrete goal and graduation scenario matrix

| Requested scenario | Screen evidence at this scope | Gap / evidence status |
| --- | --- | --- |
| Choose a concrete goal | No goal/intention entry control in Practice or Cabinet. The plan proposes a voluntary replaceable intention (e.g. “ask for a pause before agreeing”) and linking a reviewed practice. | **Missing in reviewed screens.** Goal capture and contract unavailable. |
| Revise goal without losing tools | Cabinet edits parts; Practice saves an if-then text, but there is no goal revise/replace path or evidence that associated tools remain linked. | **Missing/unverified.** Need a user-editable intention linked to selected artifacts with preservation semantics. |
| Pause | Exercise details can close and the overlay can close. A rehearsal timer clears on unmount; no explicit pause/resume state or recovery UI is visible. | **Partial exit only.** A deliberate pause/rest state and safe resume are absent/unverified. Closing the overlay must not be credited as tested pause/recovery. |
| Practice / try the chosen move | Practice can show an exercise and mark in-app Done; the rung includes a local timed rehearsal. | **In-app activity only.** No screen records an outside attempt. |
| Missing real-world outcome | No later outcome entry is visible. | Must stay **unknown**. Do not infer from Done, timer completion, suggestion acceptance, or a `Chemistry` result. |
| Revisit / report what happened | The plan describes later outcomes and choices such as “did not try,” “changed the plan,” and “prefer not to record.” These controls are not in the reviewed screens. | **Missing in reviewed screens.** Needs consent-aware, user-authored, provenance-separated revisit. |
| Graduate / independence handover | Plan proposes export of useful artifacts, reduced reminders, and taking practice into ordinary life. No graduation control appears in these files. | **Missing in reviewed screens.** No completion or mastery claim is supported. |
| Export | Cabinet offers cloud-map save/load/restore, not a visible export action for goals, practice plans, outcomes, or graduation artifacts. | **Missing/unverified.** Cloud helper behavior is outside scope and not equivalent to a user-controlled export. |

## Applicable UI states

| State | What the reviewed screens show | Boundary |
| --- | --- | --- |
| Normal | A suggestion or chapter/exercise list; selected exercise details; Done and ladder actions; Cabinet part cards/editors. | Source-level UI inventory only; no runtime exercised. |
| Empty | Practice shows its no-suggestion message; Cabinet shows an empty-filter message; Cabinet can show no appointments and cloud history can show empty status after load. | Empty catalog/profile/goal behavior outside those rendered branches was not tested. |
| Denied / unavailable | Locked chapter hint and disabled safety-gated exercise; unlinked Cabinet user gets a login prompt for cloud maps; Practice may show an assignment unavailable label for an unknown exercise ID. | Decision rules are imported, unavailable, and unverified. No server authorization was checked. |
| Failed | Practice shows assignment-load error; Cabinet shows appointment, cloud-save, and cloud-load errors. | Failures were not induced; imported request/storage semantics and retry/recovery were not verified. Practice's local `store.save` has no user-visible failure branch in this file. |
| Interrupted | Practice clears the rehearsal interval on unmount, without visible saved partial progress; if-then text is committed only through its save action. Cabinet guards async appointment/cloud UI updates against a changed account in component state. | No reload/offline/race/account-change test was run; helper behavior and durability remain unknown. No explicit user-facing pause/resume. |
| Quiet | User can close exercise details/overlay; no dedicated quiet mode, reduced-reminder, or no-progression-pressure control is visible in these two files. | Quiet-mode behavior elsewhere was not read or evaluated. |

## Roadmap alignment (plan, not implementation evidence)

`docs/80-20-plan.md` defines a useful return loop as contextual check-in, selected practice, if-then cards, honest outcome/revisit, and transfer/boundary probes (§5, lines 111–118). Its progression proposal uses “notice → choose → try → observe → adapt,” a replaceable voluntary intention, and provenance labels separating in-app completion, self-report, and user-observed outcome; absence of a later report is not a negative outcome (§7.4, lines 195–208). It proposes a graduation path with artifact export and reduced reminders (§7.4, line 206). These are roadmap requirements, not present screen behavior or acceptance evidence.

The plan's bounded inquiry guidance preserves user correction, uncertainty, stopping, and optional action; a single outcome is an observation, not proof of cause or change in trait (Stage 1 assessment steps, lines 340–360). This candidate makes no empirical, clinical, efficacy, or user-acceptance claim.

## Smallest useful next slice (proposal)

After the missing contract and workcell inputs are resolved, add one end-to-end, private, user-controlled intention artifact around one existing reviewed exercise: (1) choose and freely revise the intention without losing its linked tool; (2) pause without penalty and resume or leave; (3) optionally revisit with explicit `not tried`, `changed plan`, `prefer not to record`, or a user-authored report; (4) retain an absent report as unknown; and (5) offer a user-initiated export/independence handover for that artifact. Keep in-app completion, user report, user-observed outcome, app hypothesis, and canonical measurement as separate typed/provenance states. No streak, mastery, healing, or clinical-change inference. This is a proposed slice only; no implementation or contract is authorized by this audit.

Before dispatch, provide the missing published contract paths, exact role/write/capability manifest, immutable `base_generation`, workcell and lease. Agree on minimization, retention/deletion, export field selection, account ownership, pause/resume semantics, and failure behavior. Do not send the goal or outcome outside the user's private scope without separate explicit selection and consent.

## Exact live acceptance map

| Live criterion | Evidence in this artifact | Disposition |
| --- | --- | --- |
| “Deliverable exists: Existing-code inventory, old-Bead reconciliation, gap/evidence map and smallest useful slice.” | This final artifact inventories the permitted screens, maps evidence/gaps, and proposes a bounded slice at the authorized output path. | **Partially addressed; pending acceptance.** Old-Bead reconciliation is blocked by source-scope mismatch. |
| “It addresses audit existing behavior and reconcile original beads for personal outcomes and graduation and explicitly distinguishes observation, hypothesis, user authorship and canonical measurement where relevant.” | Screen-visible behavior is separated from uninspected helper behavior; outcome/provenance categories and plan/code distinctions are mapped. | **Behavior inventory supported at source level.** Predecessor/original-Bead reconciliation pending; no runtime verification or outcome evidence. |
| “Applicable normal, empty, denied, failed, interrupted and quiet states are specified or exercised at this step's depth. Tests cover meaningful changed boundaries; no unnecessary full-suite repetition.” | All six states are mapped to visible source branches and marked unexercised. | **Specified as source audit only.** No tests were run per instruction; state semantics depending on imported helpers remain unresolved. |
| “Concrete fixtures to resolve and verify as applicable: Choose a concrete goal, revise it without losing tools, pause, graduate and export; missing real-world outcome remains unknown.” | Every named scenario is mapped; the absent goal/outcome/graduation/export behavior is explicit; missing outcome remains unknown. | **Gap map only.** No fixture is executed and no goal/outcome UI is present in the reviewed files. |
| “Actual workcell manifest, artifacts, unresolved gaps and next handoff are recorded in Beads. No private context or credentials appear in evidence.” | The executed workcell record below identifies the pinned manifest, artifact, claim, review, remaining gaps, and next handoff; no private context or credentials are included. Tracker recording is maintained on the Bead separately. | **Partially addressed; pending acceptance.** The local reservation is not a broker lease or filesystem sandbox; old-Bead and scenario evidence remain unresolved, and task `base_generation` is still null with no published contracts. |
| “Independent review requirements for later steps remain explicit.” | The v2 wording received independent source review (report SHA in the workcell record); independent review of required fixtures and empirical evidence remains necessary for later acceptance. | **Partial.** Required behavior and participant/service review remain pending. |

**Disposition:** source-level documentation deliverable; not Bead acceptance. The task remains unaccepted. Old-Bead reconciliation, architecture contracts, helper behavior, runtime behavior, data export, persistence/privacy guarantees, real-world outcome, and independent review of required fixtures or empirical evidence remain unresolved.


## Executed workcell record

- Workcell manifest: `.delivery/runtime/cells.json`, SHA-256 `712ebab074d93d6f97f5711451e9e06c0a7b84b8752d40fcfccc6be8fcdde8a0`.
- Local coordinator lease: `ddc2640b4b00453c870521ece23895df`. This reservation is local coordination metadata; it is not a broker lease or filesystem sandbox.
- Immutable base: `git:09194df5f48326bff14e42a1e4eb8d66c457186d`. Exact output: `docs/plans/elevation/e01/e01-01-existing-code-inventory.md`.
- Manifest task revision at reservation: `-6511896860445505556`. Native Beads claim and pre-dispatch recheck: task is `in_progress`; live revision `-4108336959995190846`.
- Contract reads/writes: none. The declared `architecture/contracts/**` input had no tracked or worktree matches at the pinned base.
- Quality check: `git diff --check` passed in the clean workcell. No tests, build, runtime, account, network service, or participant evidence was collected.
- Independent source review: PASS for the corrected candidate wording; report SHA-256 `312cf47bd043e47edb95a9e3d56e1240041fbca2cf072fb57a664fdc0ce4f538`. Acceptance remains HOLD.
- Remaining blockers: predecessor/original-Bead reconciliation is not evidenced because referenced task bodies and outputs are outside the declared read set; no goal, pause, export, graduation, or real-world outcome fixture was run. Missing outcomes remain unknown.
- Next handoff: E01.S02 after the predecessor/source scope is authorized and the outstanding acceptance evidence is supplied.
