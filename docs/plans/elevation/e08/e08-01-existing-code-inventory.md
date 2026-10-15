# E08.01 — Existing-code inventory (source-only candidate)

**Disposition:** partial evidence candidate; not task acceptance. This pass records only source observations from the pinned workcell and plan intent. It does not reconcile historical Beads or establish app behavior at runtime.

## Scope and source identity

- Workcell: `/tmp/innerverse-e08-workcell`, detached at `09194df5f48326bff14e42a1e4eb8d66c457186d`.
- Workcell cell manifest: `.delivery/runtime/cells.json`, SHA-256 `a4a3ce51ed40981a924c8ed0f09a760bc20908739b5b952f0cd996f4d10f46ec`.
- Local reservation: `bba5b651c73b47389f5e4afe1622e5a1`, owner `codex-e08-author`. This is local coordination only; it does not bind task metadata or establish a broker lease.
- The allowed app/plan read set was `practice.jsx`, `replay.jsx`, `docs/80-20-plan.md`, and `architecture/contracts/**`. The exact `replay.jsx` path is absent at this baseline. The `architecture/contracts/` path is also absent. No alternate source paths were searched.
- Historical predecessor output and original Bead records were not read. Imported exercise definitions, gate helpers, storage adapter implementation, and other app routes were outside this candidate’s source read set.

| Permitted source | Result at pinned baseline | SHA-256 |
|---|---|---|
| `src/parts-cartographer/screens/practice.jsx` | Present and inspected | `c3506563cf272fdfdcc0f2e1421a247713bf8aacaf6e1e3e260c1aa61f51958f` |
| `src/parts-cartographer/screens/replay.jsx` | Exact path absent; behavior not assessed | — |
| `docs/80-20-plan.md` | Present and inspected | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `architecture/contracts/**` | Directory absent; no contract version could be resolved here | — |

## Code observations

All statements in this section are source-level observations, not a runtime trace.

- `Practice` derives its `clinical` input only when the profile has `testModel === 'angular-v2'` and a truthy `profile.clinical` value (lines 52–65). `allowedFor` returns `false` whenever its score argument is absent (42–48). The catalog and assigned-practice entry buttons use `exerciseAllowed`, which calls that helper (194, 208–223, 298–309). When `clinical` is absent, those entry buttons have `canOpen === false`. However, `selectedExercise` is resolved from `selectedId` and rendered separately without a `clinical` guard (195, 293), so this source does not establish that an already-selected exercise closes if profile state changes. The chapter calculation and imported gate rules are not independently understood from this read set; the exact necessity of the entry dependency remains unresolved.
- The suggested-practice card is omitted without `clinical`; otherwise the component calls `suggestExercise` with the clinical profile, check-ins, current time, and last-suggestion time (111–119, 280–286). This candidate did not inspect the suggestion algorithm or exercise content.
- The component loads practice and check-in state through `store.load`, then saves practice state through `store.save` (14–30, 121–147, 158–163). It normalizes `completed` to string IDs and `ladder` to an object. Adapter backing, retention, save-failure handling, and offline behavior are unknown from this source.
- “Done” adds the exercise ID to `completed`; the visible state model has no attempt/outcome field. The ladder stores a free-text `ifThen` value and can store `rehearsed: true` after a 90-second in-app timer (126–168, 227–267). The timer is evidence of an in-app rehearsal interval only; it does not establish action in another setting or an observed outcome.
- The if-then input is a single text value, saved when its trimmed length exceeds five characters (250–260). This component has no typed fields for an external constraint, environmental adjustment, alternate setting, boundary probe, transfer probe, revisit outcome, or “cannot recall” state.
- There is no recall-first prompt, cue, immediate reveal, or explicit cannot-recall path in the inspected component. The Replay screen cannot be compared because its exact permitted path is absent.
- Assignment loading is attempted only for a linked user with a UID; failures set an error message (72–86) that renders with `role="alert"` (295). This is not evidence of a working support route. This screen contains no explicit human-support action; app-wide support access is outside the inspected source scope.
- The file imports gate, exercise, assignment, and storage helpers whose implementations were not read. Their thresholds, exercise contraindications, and failure semantics are therefore unknown. No canonical score write appears in this component, but this does not establish system-wide data separation or retention.

## Plan intent and evidence distinction

The plan’s Stage 2 return loop calls for contextual check-in, practice/ladder, user-authored if-then cards, Repair, outcome revisit, recall-first review, boundary and transfer probes, and environmental adjustment. Its exit criterion is that users can choose an action and revisit what happened, with basic practice not blocked by unrelated assessment or synastry dependencies (`docs/80-20-plan.md:115`). The plan separately requires provenance to distinguish in-app completion, self-reported action, and user-observed outcome (`201`). Its detailed sequence asks for flexible revisit outcomes and user-owned artifacts (`477–478`), an optional recall invitation with cue/reveal and no penalty, a “when unhelpful?” boundary probe, a “where else?” transfer probe, and environmental options (`479–482`).

The plan frames transfer as an ambition to evaluate, not an established result (`195–205`). It specifically says learning-transfer evidence should come from optional user reports or experiment artifacts and remain distinct from verified outcomes (`704–706`). Canonical instrument wording, response anchors, scoring versions, and output contracts remain separate from reflective routes and user-authored evidence (`923–929`). These are requirements and evidence rules; they do not demonstrate implementation or user benefit.

## Scenario and gap map

| Requested scenario | Source evidence | Current disposition |
|---|---|---|
| Try recall, then choose a cue, immediate reveal, or cannot-recall | None in `practice.jsx`; `replay.jsx` absent | Not observed or tested. Add only after exact source and interaction owner are resolved. |
| Vary one practical constraint | Only a free-text if-then value is visible; no structured constraint field | Not demonstrated. The free-text field is not evidence that a constraint can be varied or compared. |
| Adapt a move in another setting | The component records in-app completion and a timer-derived rehearsal flag | No cross-setting action or outcome is captured here. Do not label `rehearsed` as transfer. |
| Revise, not try, or ask for help | The inspected state contains completion and ladder fields but no flexible revisit outcomes or Repair path | Not demonstrated in this screen. App-wide alternatives are unknown. |
| Keep basic practice available without unrelated prerequisites | The catalog and assigned-practice entry buttons use `allowedFor`, which returns false without `clinical`; a previously selected exercise is rendered through a separate path | Entry-point concern against the Stage 2 criterion, not evidence that all practice becomes inaccessible. Whether a specific gate is necessary cannot be decided without the excluded helper/content contracts and review. |
| Preserve authorship and canonical measurement | The component maintains a separate practice-state key and reads `profile.clinical` | No score mutation is visible here; ownership, retention, export, and whole-app separation remain unverified. |

## Smallest useful slice — proposal only

After the task owner resolves the missing source/contract reads and selects an existing reviewed move, prototype one optional return loop: invite recall without penalty; provide a user-controlled cue and immediate reveal; allow “cannot recall”; let the person vary one chosen constraint or environment; ask when the move would not help and where else it might fit; then offer flexible revisit outcomes, including adaptation, not trying, uncertainty, and no recording. Keep user-authored action/outcome provenance separate from canonical assessment data, and verify an existing direct support path before changing practice gates. This is a design proposal only: no move has been selected from the uninspected exercise data, and no UI, persistence, or support route was implemented or exercised.

## Evidence limits and blockers

- **Historical reconciliation:** not performed. The permitted source-only pass did not read predecessor outputs or original Bead records, so the mapping from the legacy task to current code is unresolved.
- **Task bindings:** live metadata had `base_generation: null`, `contract_versions: []`, and `workcell_status: proposal_requires_resolved_base_and_lease`; the contract-readiness field says to resolve a published version before code work. The local workcell pin/reservation does not repair those tracker bindings.
- **Missing permitted sources:** the exact Replay source and contract directory are absent at the pinned baseline. Their absence is path-specific; it does not prove there is no Replay implementation elsewhere.
- **Unobserved behavior:** no app runtime, recall/cue/reveal flow, constraint variation, transfer attempt, support navigation, storage failure, accessibility/assistive technology, device, or user session was observed. No research contact or data collection occurred.
- **Verification:** no tests or builds were run, and no code changed. The artifact is a candidate source inventory only. Independent review is pending; task acceptance remains on hold.

**Next handoff:** independently review this exact artifact and its citations. Then resolve the immutable task base, published contract versions, exact Replay location, and authorized historical-Bead reads. Reassess the clinical prerequisite against the intended safety gates before proposing implementation. Do not close the Bead; after review, return it to `open` while task bindings remain unresolved. Neither this artifact nor a local reservation is acceptance evidence for the end-user scenarios.
