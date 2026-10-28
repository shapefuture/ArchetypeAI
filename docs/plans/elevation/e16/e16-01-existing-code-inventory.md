# E16.01 Existing Code Inventory

**State:** private source-only candidate for independent review; unintegrated and incomplete for task acceptance.

This inventory compares the declared E16 source paths with the applicable `docs/80-20-plan.md` intent. It distinguishes source observations from plan statements and proposals. It does not reconcile original or predecessor Beads, establish app-wide behavior, or provide user, therapist, runtime, or accessibility acceptance.

## Workcell identity and scope

- Base checkout: `git:d17aaa68a15b40c4e13eb7e9d7b93b4b08860365` in a fresh isolated clone at `/tmp/innerverse-e16-workcell`.
- Candidate output: `docs/plans/elevation/e16/e16-01-existing-code-inventory.md` in that workcell only.
- Proposed manifest: `.delivery/runtime/e16-proposed-manifest.json`, SHA-256 `96b3dbc243ba690bc6c9ad0a8b2d3c13b8b23568f2ec664568d9c2135be62025`. This is a local proposal, not a validated lease, readiness check, tracker claim, or permission grant.
- The candidate was not copied to the root checkout. No Beads reads/writes or task claims were made for this E16 slice. No app-code changes, tests, builds, service/device access, participant contact, or data collection occurred.
- Old-Bead and predecessor reconciliation remains unresolved. The permitted source set does not include those records or their outputs.

## Source inventory

| Declared source | Identity / availability | What was inspected |
|---|---|---|
| `src/parts-cartographer/screens/innerverse.jsx` | SHA-256 `3018d18492dc8f819a85aa2a383afa99f2f9ac644b4f9595bd5c91d37293b75e`; 785 lines | Complete file. Relevant code includes the user-facing `Innerverse` component and the separate client/link/appointment `SpecialistView`; it does not contain the requested therapist map scene. |
| `src/parts-cartographer/services/therapist-map-scene.ts` | Absent at the declared path in this base | No scene projection, therapist table, axis status, or historical-note adapter can be inspected here. No search outside that exact path was performed. |
| `docs/80-20-plan.md` | SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`; 936 lines | Relevant plan sections at lines 247–273, 858–879, and 923–934. These are plan statements, not independently reverified implementation facts. |
| `architecture/contracts/**` | Directory absent at this base | No published coordinate, note-ownership, or scene contract/version could be resolved from the declared contract path. |

## Source observations

### Innerverse data and coordinate controls

- `Innerverse` receives one `parts` collection and one `profile` object from `useApp` (`innerverse.jsx:43–48`). It derives a filtered/ranked list from that collection and can exclude studio-created parts in `reportOnly` mode (`:66–75`). The filter does not expose separate 64-item and 147-item records, versions, contexts, or times in this component.
- The story headline and essay are read from fields on that one profile (`:76–81`). Their instrument source, record identity, context, timeframe, and provenance are not established in this file.
- The screen defines a four-value preference lens named Agency, Temperature, Focus, and Attachment (`:23–30`). Missing/invalid local preference values return numeric zero (`:32–40`), and updates are stored under one local-storage key (`:83–85`). The component's copy describes these values as an affinity/highlight lens and says answers and scores do not change (`:271–277`). This preference vector is not evidence about an instrument's measured coordinates or about how unknown client axes are represented.
- Three selectors store keys from imported `DIMENSION_KEYS`; the component forwards these axes to `uniRef.current.setView` (`:57`, `:91–95`, `:294`). The imported defaults/keys and downstream renderer are outside the declared reads. This JSX does not display an explicit per-part fourth-axis value or a full-vector table alongside that projection. Whether the scene displays those values cannot be inspected because the declared scene file is absent.
- The three selectors each offer `DIMENSION_KEYS` and update one slot without a uniqueness check in this handler (`:294`). This is a source-level condition to resolve against the published scene contract; it does not establish what the renderer ultimately accepts or displays.
- The model-created Studio path marks its object `sourceAssessment: 'studio'`, and substitutes `[0, 0, 0, 0]` when generated coordinates are missing or rejected by the local sanitizer (`:335–372`). That is a separate creative path; it is not evidence of canonical 64/147 coordinates. It does show why a later contract should distinguish an unknown vector from an intentional zero vector instead of reusing this fallback for measured/reference data.

### Therapist-facing code in the inspected screen

- `SpecialistView` in this file manages therapist attestation, linked clients, appointments, availability, and summary metrics (`innerverse.jsx:420–480`, `:625–780`). It can read client summaries and appointment records, but the inspected component contains no historical therapist-note model, note ownership/retention fields, 64/147 comparison table, or full-cast coordinate scene.
- This is a finding about the declared component only. The scene service path and contracts that might define those behaviors are absent, so this inventory cannot establish whether another system stores or protects historical notes.

## Plan intent (not observed implementation)

- The plan distinguishes the approachable user cosmos from therapist analysis, and defines “3+1” as three chosen spatial dimensions plus the fourth dimension explicitly identified through a value, filter, slice, or tested encoding (`docs/80-20-plan.md:247–257`). It sets an initial Agency/Temperature/Focus projection with Attachment as +1 and requires three distinct axes with the remaining dimension identified (`:253–255`).
- The plan's comparison table says 64 and 147 are distinct contracts: the 64 route produces dimensional centers and response-derived archetypes; the 147 route uses a fixed cast and reference-table coordinates, with scores affecting activation/prominence rather than creating a new per-person coordinate vector (`:261–271`). The plan also says a therapist may see both only when authorized, with source/version separated, and should not fabricate missing answers (`:273`). These statements have not been verified against current scorer/adapter or scene code in this bounded review.
- The plan separates observations, instrument results, formulation, presentation, and action; it assigns observations to the person's source record and calls for explicit note ownership, retention, and permitted recipients for therapist annotations (`:858–868`). It calls for separate 64 and 147 source records, explicit agreement/disagreement, preserving attachment facets, and labeling fixed reference versus individual coordinates (`:872–879`).
- The plan says present-moment state and patterns across episodes use separate clocks and that sparse narrative must not become precise geometry (`:923–934`). This is design intent, not proof of a current two-context/time workflow.

## Scenario evidence and gaps

| Scenario | Evidence in the declared source | Remaining gap |
|---|---|---|
| Compare 64 vs 147 | Plan documents different response structures and coordinate origins (`80-20-plan.md:261–273`). `Innerverse` reads a generic `parts` array (`innerverse.jsx:43–48`, `:66–75`). | No two-result comparison, instrument/version labels, agreement/disagreement view, or authorized-source check is visible in this component. The underlying scorer and adapter paths are outside this read set. |
| Two contexts or times | Plan calls for chosen context/time windows and separate state/pattern clocks (`80-20-plan.md:862`, `:868`, `:927`). | The inspected component reads a single profile and shows no context/time selector or paired record in these paths. This does not establish app-wide absence. |
| Unknown axes remain unknown | Plan requires measured/reference/estimated/unknown coordinate status (`:273`, `:933`). `Innerverse` converts missing preference values to zero, and Studio may default missing generated coordinates to zero (`innerverse.jsx:32–40`, `:367–372`). | These are not canonical therapist coordinates. No source in the declared set shows unknown-axis data status or renderer behavior. Contract and scene path are absent. |
| Full-vector/table matches 3+1 projection | Plan specifies four dimensions, three distinct chosen axes, and a visible remaining dimension (`80-20-plan.md:253–257`). `Innerverse` forwards a three-axis selection to an uninspected renderer (`innerverse.jsx:294`, with forwarding at `:91–95`). | No full-vector table, per-row coordinate source, +1 label/value, or full-vector-to-projection fixture is visible in the declared source. No match check was run. |
| Historical therapist notes and ownership | Plan requires therapist-annotation ownership, retention, permitted recipients, and no sending notes to AI without consent (`80-20-plan.md:868`, `:879`). | The inspected `SpecialistView` has no historical note flow. The target scene service and contracts are absent. Storage, access control, consent, retention, export/deletion, and AI-flow ownership were not inspected or exercised. |

## Hypotheses to test, not findings of behavior

1. The user-map `axes` selectors may allow duplicate dimensions because this component's change handler updates a selected slot without checking other slots. A focused contract/fixture should determine the actual accepted set and whether an invalid selection reaches the renderer.
2. The local preference and Studio coordinate fallbacks may make “unknown” look like a meaningful zero if a future map path reuses them for canonical data. Keep those values typed and labeled as preferences/creative defaults; do not infer that they describe client measurements.
3. A visually plausible three-axis scene could diverge from the displayed full vector or +1 value. No evidence here shows the scene's rendering, sorting, or value-table logic, so this is a verification target rather than a defect claim.

## Smallest useful next slice (proposal only)

After the coordinator resolves a versioned scene/data contract and the missing scene-service source, create a narrow comparison fixture with distinct 64 and 147 records for two named context/time windows. Keep each instrument/version and source record separate; include at least one unknown coordinate so the fixture can reject zero imputation. For each of the 24 ordered choices of three distinct axes, compare the table's four-vector to the displayed X/Y/Z values and explicitly labeled +1 value, including the coordinate source/status. Add separate historical-note fixtures for client-authored versus therapist-authored content, recording owner, recipient, consent, retention, and deletion behavior before wiring notes into any shared presentation or AI path. This is a proposed fixture and contract slice only; it was not implemented or run here.

## Handoff

Private candidate for independent review. Old-Bead/predecessor reconciliation remains unresolved. The target therapist scene service and contract directory are absent, and no task claim, validated lease, or task acceptance was obtained. Resolve the exact data/scene contract and historical-note ownership before implementation; keep 64/147 results distinct and do not coerce unknown canonical axes into numeric zero. Runtime, therapist, account/consent, privacy, and empirical acceptance remain open.
