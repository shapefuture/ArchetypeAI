# E20.01 — Exact-generation rubric evidence inventory

**Candidate status:** private source-only inventory for review. No rubric score, acceptance result, or task completion is asserted.

## Scope and provenance

The assignment identifies `ArchetypeAI-wvtm` as open and asks for an inventory of exact-generation rubric evidence, with explicit rejection of score transfer, candidate-authored acceptance, missing manual accessibility/live evidence, and averaging that hides hard failures. This pass did not query or mutate Beads, claim the task, inspect predecessor output, or resolve old-Bead bindings.

The workcell is a fresh detached clone at base `09194df5f48326bff14e42a1e4eb8d66c457186d`, created from the earlier isolated clone’s Git history and checked out clean at that commit. The only permitted source paths read were:

- `tests/browser/parity.spec.mjs` — present; SHA-256 `3ac4bd4fe0e73e959aa245044d220f2b1d5e3a3e4540361bc15357e09c9fd83c`
- `docs/content-evidence-register.md` — absent at this base; no file contents or hash available
- `docs/80-20-plan.md` — present; SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`
- `architecture/contracts/**` — absent; `architecture/contracts/` does not exist at this base

External proposed manifest: `/tmp/e20-01-proposed-manifest.json`, SHA-256 `071e2e2ce79ea4abe8cd525ed6b936e99fb24f1b0011a34860e6af45faa4074`. It names only these permitted reads and this output path; `lease_status` is `proposed-only; no validated lease`, and `quality_commands` is empty. No validated lease or reservation was available or claimed. The browser spec was read but not executed.

## Observed source and test specification

`tests/browser/parity.spec.mjs` defines five Playwright test cases. Its `beforeEach` aborts requests matching `googleapis.com`, `firebaseio.com`, or `/api/` and seeds local onboarding/language keys (`:4–12`). The test code covers offline local restore/reload, quick-scan completion, a 147-answer local assessment/report/universe path, historical local restore, and sensory-setting persistence (`:14–149`). These are test definitions only. No run result, generated screenshot, report, trace, browser version, or execution environment was inspected or produced in this pass.

The 147-answer and sensory tests instantiate Axe and assert no critical or serious violations after explicitly disabling the `color-contrast` rule (`:77–78, :96–97, :139–140`). The spec also exercises selected keyboard actions such as Escape and arrow-key interaction. This source does not document a manual screen-reader or other assistive-technology session; an Axe assertion and keyboard steps are not proof of manual AT completion. Nor does this source provide a result from a live configured provider/account/service flow. Its setup expressly intercepts several service routes, and the visible scenarios use local browser state.

The spec source records expected assertions such as local draft resume, report contents, no selected POST bodies containing certain local strings, accessible-rule thresholds, and visual screenshots. Those expectations must not be reported as passed observations without an execution artifact tied to an exact code generation. The `docs/content-evidence-register.md` path that might enumerate evidence is absent, so no register claims, generation mapping, or provenance model could be verified.

## Plan intent

The plan says automated and manual software testing are both acceptance gates (`docs/80-20-plan.md:15`). Its first-release gates call for a current production-preview baseline, configured-service inspection, and explicit live/manual gaps; later acceptance includes usability, bilingual, accessibility, offline/recovery, and real-device checks (`:95–109`). The quality rubric asks for written reasons and evidence for each rating, specifies manual assistive-technology evidence for accessibility, and states: “Do not average away a broken appointment flow or an accessibility blocker” (`:692–708`). It also distinguishes app events, user reports, and witnessed outcomes and says manual acceptance covers what automation cannot certify (`:107–109`).

The plan requires instrument results to retain exact instrument/scoring/norm versions and limitations; preserve legacy outputs; keep hypotheses and corrections distinct; and avoid treating correlated outputs as independent confirmation (`:850, :862–881`). It says a crosswalk requires suitable paired data and out-of-sample/subgroup evaluation, that correlation does not justify interchangeable scores, and that a future instrument needs its own identity/version/norms (`:892–896`). Those are psychometric score and evidence rules. They do not directly define how product-quality rubric scores transfer between successive candidate artifacts.

The plan further says a task closes only when its specific acceptance passes and a design specification cannot close an unrun live-service acceptance task (`:689`). This inventory does not determine who is authorized to accept E20.01 or any predecessor.

## Hypothesis and bounded proposal

The following are proposed controls for the requested rubric evidence, not observed implementation or a quoted existing policy:

1. Bind every rubric review to the exact candidate artifact SHA-256, base commit, rubric version, and review timestamp. A score without that provenance is unbound evidence. Keep the final candidate hash in the review record outside the candidate itself to avoid a self-referential hash.
2. Do not transfer a quality score from one artifact generation to another. Re-review the changed generation, or record an explicit independent decision identifying unchanged criteria and revalidated evidence. The plan’s psychometric no-crosswalk rules support caution by analogy, but they do not themselves establish this meta-rubric rule.
3. Do not let the candidate author mark their own work accepted. The author may submit claims and evidence references; an independent authorized reviewer should record the acceptance decision against the exact candidate hash. The permitted sources do not specify reviewer identity or approval mechanics, so those remain to be defined.
4. Record each rubric dimension separately with claim, evidence artifact, source hash, exact generation, method (automated, manual, live, user report, or witnessed), execution date, and result. Label planned tests as planned, source assertions as test definitions, missing evidence as unknown, and executed evidence only when its output is available. For the content-evidence register and contracts, the path is absent and no evidence may be inferred.
5. Keep hard gates visible. Any broken core appointment flow or accessibility blocker remains a blocker regardless of other dimension scores; do not hide it with a mean, weighted total, or attractive presentation score. Leave the overall rating unissued until required hard gates have evidence.
6. Treat manual AT and live configured-service evidence as absent here, not as failures or passes. Obtain those results through their separately authorized validation work and attach them to the exact candidate generation before making a claim that depends on them.

This proposal is bounded to evidence provenance and review presentation. It does not prescribe a scoring formula, claim that any rubric dimension passed, or authorize tracker acceptance.

## Evidence gaps and blockers

- `docs/content-evidence-register.md` is absent at the pinned base, so any requested source of content-level provenance cannot be reviewed.
- `architecture/contracts/**` is absent; no canonical rubric, evidence, assessor, or acceptance contract was available.
- The browser test file is test source, not a run report. No browser tests were executed, as instructed; no result artifacts were inspected.
- No manual screen-reader or other assistive-technology evidence was read or performed. The spec’s Axe checks disable color contrast and do not establish manual AT acceptance.
- No production-preview, configured live service, provider/account, or witnessed user journey evidence was available in the permitted reads.
- No independent evaluator, assessor authority, rubric version, score record, candidate generation identifier, or historical score-transfer record was available in the permitted source set.
- Old-Bead/predecessor reconciliation remains unresolved. No claim, comment, status change, integration, or acceptance action was made.

## Review boundary

This document is a private candidate for independent review. The only proposed repository write is this file. No application code changed, the browser spec was not run, and no evidence or rubric score was published to Beads. Task status, dependencies, and acceptance remain untouched.
