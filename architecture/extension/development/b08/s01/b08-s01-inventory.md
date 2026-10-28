# B08.S01 — Inventory: reviewed source and practice catalogue
<!-- cite-ref: 45c24ed -->

> **Independent review (2026-10-16).** Round 1 at `f8746dc`: FAIL (minor), "no review workflow" was false for AI suggestions. Round 2 at `f8746dc`: FAIL. Round 3 at `8751dad`: FAIL. The §1 finding said no practice library exists, which is wrong: `src/app/core/data/exercises.ts` and the `EXERCISE_COPY` step copy are practices. The catalogue commit is 7841799 (2013071 marked it draft). §§1-5 are corrected. Base note: `src/parts-cartographer/screens/suggestion-review.jsx@3683b0f` and `src/shared/core/data/constellations.ts@3683b0f` are HEAD paths under a 45c24ed header. Status is still **candidate, not accepted**; re-review is required.

- Bead: `ArchetypeAI-z5qy` (B08.S01).
- Base checked: `git:45c24ed` on `claude/full-plan-handoff-gmgpkq`.
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `architecture/extension/development/b08/s01/**` (this file only).
- Contracts: none published. `base_generation: null`. No lease.

## 1. Finding

At base 45c24ed the codebase had a practice library but no practice catalogue with source references or review status. The library is `src/shared/core/data/exercises.ts@3683b0f` (base path `src/app/core/data/exercises.ts`), with step copy in `src/shared/i18n/strings.ts@3683b0f` (`EXERCISE_COPY`, 56 entries). Neither holds source references or a review record. HEAD adds `src/parts-cartographer/core/practice-catalog.ts@3683b0f`, created in commit 7841799 and marked draft in 2013071. It has one status constant, `CATALOG_REVIEW.status`, set to `'draft'`, and `availablePractices` in `src/parts-cartographer/core/contextual-checkin.ts:12@3683b0f` offers only entries whose status is `reviewed`. No code checks a review record.

## 2. Existing code and reuse

| Area | Evidence (file:line) | Status |
|---|---|---|
| Archetype and constellation content | `src/shared/core/data/constellations.ts@3683b0f` | Authored archetype content. Not practices. Reusable as the pattern for an authored catalogue. |
| Localised string catalogue | `src/parts-cartographer/i18n/strings.ts` | Copy catalogue. Includes exercise step copy (`EXERCISE_COPY`, `src/shared/i18n/strings.ts@3683b0f`), but no source references. |
| Practice library | `src/shared/core/data/exercises.ts@3683b0f` (base `src/app/core/data/exercises.ts`) | Present at base: exercises with steps. No source references and no review record. |
| Source references with review status | none | Absent. |

**Reuse packages named by the task.** The planning documents define these codes inconsistently across streams (the B01 inventory recorded the same ambiguity). Each code is an unresolved reuse claim until the coordinator confirms its mapping.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Practice entry (title, steps, evidence label) | Partly at HEAD (draft entries in `practice-catalog.ts@3683b0f`) | Evidence label must distinguish research, tradition and practitioner claims. |
| State | Source reference (citation, licence, review status) | No | Needs licence and attribution recording. |
| State | Review record for catalogue practices or contributions (reviewer, decision, date) | No | No catalogue or contribution review workflow exists. AI coach suggestions have a review screen (`src/parts-cartographer/screens/suggestion-review.jsx@3683b0f`). |
| Effect | Publish a reviewed practice to users | No | Publication is governed; not authorised by this slice. |
| Component | Catalogue browser, practice card, review queue | No | No screens exist. |

## 4. Scenario matrix (planned, not exercised)

Each row is planned behaviour for the reviewed practice catalogue. The HEAD gate is the draft constant in `src/parts-cartographer/core/practice-catalog.ts@3683b0f`, read by the status filter in `availablePractices` (`src/parts-cartographer/core/contextual-checkin.ts:12@3683b0f`).

| Scenario | Expected behaviour (planned) | Exercised today |
|---|---|---|
| Normal grant | A practice is offered only when `availablePractices` finds its status `reviewed`. Every entry in `practice-catalog.ts@3683b0f` is `draft` today, so none is offered. | No |
| Denied grant | A draft entry is filtered out by `availablePractices`. The person sees the empty state already in `src/parts-cartographer/screens/checkin-toolkit.jsx@3683b0f` ("No reviewed practices are available yet"), with no hint that one is pending. | No |
| Stale contract | An entry from an older schema without a `status` field fails the filter and is hidden. It is never treated as reviewed. This follows from the filter's code and has no test. | No |
| Account change | The status is a constant in source, not per account, so an account change cannot alter it. A planned review decision would store the reviewer's uid. | No |
| Deleted source | The catalogue has no source-reference field (`practice-catalog.ts@3683b0f`, entries are `{ id, title, status, requires, steps }`), so nothing depends on a source today. A planned source withdrawal would return dependent entries to draft. | No |
| Duplicate or cancelled operation | Setting the same status twice has no further effect. The planned review record would keep one decision per reviewer and version. A cancelled review leaves `CATALOG_REVIEW.status` unchanged. | No |
| Offline or quiet alternative | The catalogue is a bundled constant in `practice-catalog.ts@3683b0f`, so it works offline. A missing review never blocks core navigation: the check-in toolkit shows its empty state. | No |

## 5. Six compatibility dimensions for `reviewed source and practice catalogue`

The plan's fixture task names six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases.

| Dimension | Planned case for `reviewed source and practice catalogue` | Exercised today |
|---|---|---|
| Interface | The practice list shows only reviewed entries (`availablePractices`). With none, it shows the empty state in `checkin-toolkit.jsx@3683b0f`. | No |
| State | Each entry would also carry source references and its review record (planned). Today the entry shape is `{ id, title, status, requires, steps }` (`practice-catalog.ts:49@3683b0f`). | No |
| Effects | Publishing a reviewed practice would be one write keyed by entry id and review version (planned). None exists. | No |
| Operations | Returning a practice to draft would be one recorded step (planned). Today the status is one constant, so changing it changes every entry at once. | No |
| Performance | `practice-catalog.ts@3683b0f` builds its entries in one function and makes no network reads. The list is bounded by the size of the bundled text. | No |
| Failure | A malformed entry is not validated today. The planned rule is to drop it with a logged reason while the rest of the list renders. | No |


## 6. Source provenance

| File | SHA-256 |
|---|---|
| `docs/plans/social-creative-practice-beads-plan.json` | `cca4609c380a0fb5028a8ed46ac453d63d7f7d1fa65eeb8dc12b7167b68eba5c` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `docs/plans/first-principles-elevation-beads.md` | `7060ee257031db7dc5f89df5f0f1c35c69c233f627ae670a898da9b0ea6692f7` |
| `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` | `a42cf6cdf8fe404392a0320f6be2167058276cef6b4b096dc8d6aba780f5de88` |
| `src/parts-cartographer/core/ports.ts` | `4f5bb1f701ac6534e391641f374840a9774627a94d3b3f6be6f92274a8dc6f26` |

## 7. Pending evidence (not claimed)

- Practitioner or tradition review of every practice: **pending**.
- Source licence verification: **pending**.
- Independent review of this inventory: **pending**. No participant, practitioner, device or live-service evidence is claimed.

## 8. Limitations and next handoff

- The Beads live status of the reuse packages and sibling tasks was not read. The passive export is stale.
- The six dimensions come from the plan's fixture task, because the plan gives no stream-specific list.
- Next handoff: **B08.S02 (authoritative state, grants and effects)**. The coordinator must confirm the reuse mapping and record the Beads note (this commit does not touch Beads).
