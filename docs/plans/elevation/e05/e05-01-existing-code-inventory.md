# E05.01 Existing-code inventory — source-only partial

**Disposition: documentation quality PASS after independent review; task acceptance HOLD.** This is a source-scoped inventory, not a behavior validation, original-Bead reconciliation, or acceptance claim.

## Scope and evidence boundary

- Pinned base: `09194df5f48326bff14e42a1e4eb8d66c457186d`.
- Read only the workcell-bound paths: `src/parts-cartographer/screens/quick-scan.jsx`, `src/parts-cartographer/screens/practice.jsx`, `docs/80-20-plan.md`, and the exact `architecture/contracts/**` scope.
- `architecture/contracts/**` is absent at this base.
- Source SHA-256: `quick-scan.jsx` `d12ce6003cdd7310b5d71f98206bac6e7f4e78ddee96490b7c925b1fb472f9e2`; `practice.jsx` `c3506563cf272fdfdcc0f2e1421a247713bf8aacaf6e1e3e260c1aa61f51958f`; `80-20-plan.md` `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`.
- No predecessor artifacts, original Beads, comments, imported scoring/exercise implementation, or runtime behavior were inspected. The task's requested predecessor/original-Bead reconciliation is outside this workcell's metadata read set and remains unresolved.

The labels below keep evidence types separate:

- **Code observation** means behavior visible in the two bounded source files.
- **Hypothesis** means a possible explanation to consider; neither screen establishes one.
- **User authorship** means content explicitly entered or chosen by a person. Existing source shows answer choices and an editable if-then string, but does not tag them with provenance metadata.
- **Canonical measurement** means a versioned scored assessment record. The plan explicitly says the brief scan is limited reflection, not a completed full profile; this inventory does not inspect or claim the underlying scoring contract.

## Existing behavior visible in source

### Quick scan

`QuickScan` initializes `answers` as an empty React state array and presents one item and a 1–14 progress display at a time. Selecting a Likert button appends its numeric choice. Completion is keyed to `answers.length === SHADOW_PARTS.length`; the UI counter and progress maximum are hard-coded to 14, and this read set does not establish that those values always match. On completion it calls imported `quickScan`, then displays either a family-derived subtype with face/need copy or a self-result note. A CTA closes the overlay and routes to `full-assessment` (`quick-scan.jsx:10–33`).

The source comment calls this a local-only teaser that never replaces or persists an assessment (`quick-scan.jsx:10`); this component contains no persistence call, answer-edit/back control, hypothesis correction, or explicit error/denied/quiet branch. The exact meaning and calibration of the imported function are outside this read set. The plan says this brief route is a limited reflection and must remain distinct from canonical 64- and 147-item assessment routes (`80-20-plan.md:30–38`).

### Practice

`Practice` loads practice state from `INNERVERSE_PRACTICE_V1` and check-ins from `INNERVERSE_CHECKINS_V1`; invalid check-in rows are filtered by date and integer arousal in the range −2…2 (`practice.jsx:9–30`). Exercise suggestion is absent unless the active profile has `testModel === 'angular-v2'` and a `clinical` value; when present, the component calls the imported `suggestExercise` with that profile, check-ins, current time, and the last-suggestion time (`practice.jsx:64–70,111–120`). Chapter and per-exercise availability depend on the profile, check-in-day count, completion flags, synastry state, therapist assignments, and safety gates (`practice.jsx:96–109`). The imported gate and suggestion implementations were not inspected.

Explicit exercise completion and ladder edits pass through `saveState`, which updates React state and calls `store.save(PRACTICE_KEY, next)`; the adapter's backing store, durability, and ownership semantics are outside this read set. At ladder rung 1 the screen exposes a text field and submits a trimmed if-then string through `patchLadder`/`saveState` only when its length exceeds five characters. At rung 2 it runs a 90-second rehearsal timer; on completion it updates React state and calls `store.save` directly with `rehearsed: true`, while component cleanup clears a running timer (`practice.jsx:121–167,238–267`). The “done” action records exercise completion through `saveState` and shows a toast (`practice.jsx:126–133`). These are app-recorded completion/rehearsal flags, not evidence that an action was tried in life or helped.

The screen reads check-ins but does not present a check-in authoring or revisit-outcome flow in this file. It has no explicit distinction among attempted, helpful, adapted, not tried, or declined. The plan proposes a richer experiment card, user-editable wording, flexible later outcomes, explicit retention, and no causal claim from one report (`80-20-plan.md:470–489,923–932`); those are requirements, not existing behavior evidenced here.

## Two plausible readings and one modest shared action

**Illustrative situation (hypothesis only):** someone wants to pause before agreeing to a request.

1. A pause may provide needed processing time so the person can identify a preference and return to the decision.
2. A pause may reduce immediate social pressure while leaving the preference unclear or the conversation difficult to re-enter.

Both readings support the same small, voluntary action: if the person chooses, ask for ten minutes before agreeing, then revisit the decision. This example is consistent with the plan's authored practice example (`80-20-plan.md:487`); it is not implemented by either inspected screen.

**One discriminating observation for a future, user-authored probe:** ask afterward, “What, if anything, changed during the pause: did your preference become clearer, did the immediate pressure ease while the decision stayed unclear, did something else change, or was there no noticeable difference?” The person may skip or decline to record. This question and response path are proposed, not observed in current UI.

An inconclusive or contradictory response is not causal proof. The same report can fit both readings or neither; context, relationship, time, sensory load, and interruption can also matter. One episode has no counterfactual and cannot establish a stable trait, part relationship, mechanism, or treatment effect. It may update a tentative working hypothesis and motivate a better question, while leaving canonical scores untouched. This boundary follows the plan's requirements for competing readings and modest reversible probes (`80-20-plan.md:925,932`).

## State inventory from these files

| State | Quick scan | Practice |
|---|---|---|
| Normal | Sequential item entry and a teaser result are implemented in source. | Profile-dependent suggestion, chapter/exercise gates, completion flags, ladder, and optional assigned practices are visible in source; runtime rendering and adapter behavior were not exercised. |
| Empty | Initial empty answer list shows item 1/14; no separate empty-result path is visible. | Missing qualifying clinical profile yields no suggestion and the `noneToday` copy; default check-ins are empty. A dedicated empty-check-in explanation is not evidenced here. |
| Denied | No denial/auth branch is visible. | Unlinked/no-UID path clears assignments/error and returns; this is not evidence of a server denial response. A denial-specific state is unknown. |
| Failed | No local scoring or item failure branch is visible; runtime failure behavior is unknown. | Assignment lookup rejection is caught, logged, and shown as an alert (`practice.jsx:78–85,295`). Other storage/network failure handling is not established by these files. |
| Interrupted | Answers are held in component state and no pause/resume or persistence path is present in this component; behavior across close/reopen or process interruption was not runtime-verified. | A running rehearsal interval is cleared on unmount; partial elapsed time is not saved by this timer path. Draft/recovery behavior under reload or other interruption is unknown. |
| Quiet | No quiet-mode setting or alternate presentation is visible in this file. | No quiet-mode setting or quiet exercise variant is visible in this file. The plan's quiet-state requirements are future work, not implementation evidence. |

## Provenance and unresolved work

- **Observed UI choices:** Quick-scan answers are selected by the user, but this component does not attach authored-provenance metadata or preserve an editable answer history. Practice's if-then text is user-entered and passed through `patchLadder`/`saveState` to `store.save`; this source does not add prediction, obstacle, resource, context, or later-outcome fields or define adapter storage semantics.
- **App-derived flags:** a teaser result, suggestion, exercise completion flag, and completed timer rehearsal are code-derived outputs/records. They are not user-authored interpretations, verified real-world outcomes, or canonical assessment measurements.
- **Plan versus implementation:** the plan calls for tentative hypotheses, a neutral discriminating question, corrections, state/pattern separation, modest experiments, and flexible revisit outcomes. The two inspected screens do not implement that complete inquiry/revisit loop.
- **Unresolved acceptance evidence:** predecessor and original-Bead reconciliation; authorized source reads needed for that reconciliation; published/versioned contract linkage (the bounded contracts directory is absent); runtime behavior; and device/assistive-technology evidence. No fixtures or live-user/device evidence were produced by this source-only pass.
- **Task status:** HOLD. Independent reviews identified and this revision corrected the completion predicate and storage-semantics wording; final document-quality review passed. The safe next step is to bind the missing authorized reconciliation sources and exact contract/base versions in a fresh workcell, then obtain scoped fixture/runtime evidence and independent task-acceptance review. No task closure or dependency change is supported by this inventory.
