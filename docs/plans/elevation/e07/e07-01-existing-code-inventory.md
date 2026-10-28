# E07.01 — Existing-code inventory (source-only partial evidence)

**Disposition:** proposal and plan evidence only; acceptance remains **HOLD**.
**Pinned inspection base:** `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
**Selected output:** `docs/plans/elevation/e07/e07-01-existing-code-inventory.md`.
**Inspection boundary:** only `src/parts-cartographer/screens/memory-library.jsx`, `docs/80-20-plan.md`, and `architecture/contracts/**` were considered. The exact screen path is absent at the pinned base; the plan exists; the contracts directory is absent. No predecessor artifacts, prior Beads records/comments, runtime behavior, fixtures, or other sources were inspected.

## Evidence register

| Evidence | Result | SHA-256 / locator | Evidence class |
|---|---|---|---|
| `src/parts-cartographer/screens/memory-library.jsx` | Exact-path check at the pinned base found no file. There is no component source here to inventory. | Absent at `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365` | Repository observation (absence only) |
| `docs/80-20-plan.md` | Describes Stage 4 memory, a future user-controlled evidence library, source/retention requirements, selective retrieval, and a design-state checklist. It explicitly labels the evidence library a future capability. | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`; relevant lines 516–551, 684 | Repository observation of a plan; not implementation evidence |
| `architecture/contracts/**` | Exact-path check found no contracts directory in the inspected base, so no published technical schema, API, or versioned contract was available. Ownership, retention, and retrieval requirements do appear in the plan, but remain plan intent rather than a technical contract. | Absent at `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365` | Repository observation (absence only) |

## What the bound plan says

The plan describes continuity as chosen, inspectable memory rather than privileged psychological insight. It calls for source IDs, timestamps, wording origin, correction status, retention rules, and deletion propagation; editable source records before narrative generation; sparse-data honesty; user control over resurfacing; and a Quiet mode that suppresses optional activity while keeping data and support available (`docs/80-20-plan.md`, lines 518–533).

The evidence-library subsection is explicitly future work. It proposes deliberate import, visible processing/provider/retention choices, source metadata, traceable excerpts, and review of candidate evidence before it becomes memory. It also requires preserving the original result and its instrument/version/limitations, offering reuse only when the user chooses it, searching only selected sources for the current purpose, returning minimal excerpts, previewing/removing exact evidence before each use, and inspect/edit/export/exclude/delete controls over originals and derived copies (`docs/80-20-plan.md`, lines 536–551).

These statements establish planning intent only. They do not show a working screen, storage model, permission check, search index, deletion pipeline, account boundary, provider configuration, or measured user behavior.

## Evidence categories that must stay separate

| Category | Meaning for this inventory | Example / boundary |
|---|---|---|
| **Observed** | Directly present in the bounded repository at the pinned base. | The plan marks the library as future capability; the named screen and contracts directory are absent. |
| **Plan-only** | A proposed requirement or design behavior in `docs/80-20-plan.md`. | Selective retrieval and deletion propagation are planned, not verified. |
| **Hypothesis** | A design interpretation to validate against the owner-approved contract and later acceptance evidence. | A declined resurfacing should remain suppressed from unsolicited redisplay within a clearly defined scope. The plan calls for user control and testing unwanted resurfacing but this implementation and persistence rule are unknown. |
| **User-authored** | Text or metadata explicitly written or corrected by the user, kept distinguishable from imported/extracted wording. | The plan requires identifying authorship as user, clinician, other, or unknown, and distinguishing user-authored wording from third-party, OCR/transcribed, or AI-suggested text. No records were inspected. |
| **Canonical measurement** | An instrument result whose source, instrument/scoring version, date, scale, and limitations are retained. | The plan says preserve the original result/version and never average unrelated scores or claim cross-test equivalence. Imported observations, model summaries, user annotations, and hypotheses must not be represented as canonical scores. No measurement output was inspected. |

A candidate interpretation remains a hypothesis until a person accepts/corrects it; a person's report remains an observation with its source; and an action remains the person's choice. A summary or repeated AI wording is not independent confirmation. The plan makes these distinctions explicit in lines 541–548 and 862–868, 926–936.

For an imported result that the user says no longer fits this context, preserve the source excerpt and its context (line 541), retain the original result and instrument/version/limitations (line 543), then record the correction separately or let the user say it no longer fits (line 544). Do not rewrite the canonical historical result or present the rejected interpretation as a newly discovered fact. This is a plan-derived criterion, not implementation evidence.

**Proposed paired-source review probe:** have the user mark Source A as contextual and a distinct Source B as no-longer-fitting. Keep each source's original excerpt and provenance intact; show a retrieval preview that identifies why each source is included or excluded for the current question; honor a decline without resurfacing the excluded interpretation as new. This paired interaction is a proposed future fixture, not behavior observed in the inspected files.

## Required behavior to specify and later verify

The following are proposed review probes derived from the bound plan, **not observed behavior**. Exact policy, data model, authorization, and test fixtures remain unresolved because no bound contract or implementation exists.

| State / scenario | Required behavior to specify | Current evidence |
|---|---|---|
| **Normal** | Show the selected source and its title/type/date/context/author where known; preserve original wording and a precise excerpt/location beside any extracted candidate; expose correction status and the user's ability to accept, reject, or edit it. For retrieval, use only the user's selected source set for the stated question and return the smallest useful excerpts. | Plan-only; no screen/runtime evidence. |
| **Empty / sparse** | Say plainly that there are no saved sources or only a small amount of evidence. Do not infer a life pattern or silently scan/import other records. Keep manual entry and support choices understandable. | Plan-only; sparse-data requirement at lines 521–525. |
| **Denied** | If the user denies import, processing, provider use, or a particular source, do not read or retrieve that material for the declined purpose. Explain the available local/manual path without implying that a denied action succeeded. Keep access checks distinct for private library and any therapist/third-party recipient. | Plan-only design criterion; authorization behavior is unknown. |
| **Failed** | On parsing, retrieval, save, export, or deletion failure, identify the failed operation and its actual status. Do not claim an extraction was accepted, an item was deleted from derived copies, or a request completed unless the relevant operation is confirmed; provide a safe retry or recovery path. | The plan requires deletion propagation and honest failure/recovery generally, but no failure behavior was inspected. |
| **Interrupted** | Preserve the user's place and explicit source/evidence selection if safely supported; resume without duplicate imports or treating an interrupted preview as consent to process/share. Reconfirm any permission whose validity cannot be established after interruption. | Plan calls for interruption/recovery checks in its implementation method (line 684); actual semantics unknown. |
| **Quiet / no resurfacing** | Quiet mode suppresses optional reminders/world activity without blocking data or support. Before resurfacing a past message, honor the user's choice. A decline must not be converted into agreement or reintroduced as a fresh unsolicited insight; define the scope and persistence of suppression explicitly. | Quiet and resurfacing controls are plan-only (lines 526–533); persistence and actual effect are unknown. |
| **Paired contextual/no-longer-fitting sources** | Mark one source contextual and a different source no-longer-fitting; preserve both original excerpts and provenance; make the retrieval preview explain why each source was included or excluded for this question; honor declined resurfacing. | **Proposed review probe, not implementation evidence.** No source-management or preview screen exists at the inspected path. |

### Retrieval exclusion rules to carry into the contract

For a question-specific retrieval operation, the eligible corpus should be the source set the user deliberately selected for that question. User-excluded, redacted, unselected, or access-denied source material must not enter the candidate result through an ambient archive search or downstream summaries/indexes. A rejected extracted claim must not be presented as active; whether rejecting one claim also excludes other excerpts from its source is a separate contract question. Preview the exact evidence before any sharing and allow removal; the preview should explain why each relevant source was included or excluded for this question. Distinguish third-party text and therapist annotations under their own permissions. Exclusion from one use versus a durable library-level exclusion, and deletion from embeddings/caches/provider copies, need explicit versioned semantics. This paragraph is a contract question distilled from the plan's lines 541–551 and the proposed review probe, not evidence that any such filter exists.

## Missing evidence and acceptance blockers

- **Base/source mismatch:** the named `memory-library.jsx` screen does not exist at this pinned base. No existing behavior can be attributed to it.
- **Contracts:** `architecture/contracts/**` is absent in this bounded inspection. No published source/library/retrieval schema or contract version is present in the permitted source tree; the plan's ownership, retention, and retrieval statements remain requirements, not versioned technical semantics.
- **Reconciliation:** predecessor artifacts and original Beads are outside this inventory's read boundary and were not inspected. Reconcile them under an authorized read set before claiming original-issue coverage.
- **Runtime and retrieval:** no implementation, persisted data, filtering/indexing behavior, deletion propagation, permission boundary, or account-switch behavior was inspected.
- **Fixtures and execution:** no fixtures, automated results, manual walkthrough, participant evidence, device/assistive-technology evidence, or provider behavior were observed. No tests/builds were run.
- **Acceptance:** this partial source inventory does not complete original-Bead reconciliation or prove the requested state scenarios. Keep the task and its dependencies open; do not mark done based on this artifact.

## Next handoff

Resolve the authorized predecessor/Beads reconciliation scope and publish/pin the applicable source/library/retrieval contracts first. Then bind a clean base and exact write/read set for implementation or a concrete existing-code audit. Add fixtures for source authorship/provenance, accepted/corrected/rejected evidence, paired contextual/no-longer-fitting sources with an explained retrieval preview, current-question source selection, declined resurfacing, and delete propagation across originals and derived copies. Review normal, empty/sparse, denied, failed, interrupted, and quiet states independently. Keep measurement claims, account/third-party permissions, and provider-retention claims at **HOLD** until their specific evidence exists.
