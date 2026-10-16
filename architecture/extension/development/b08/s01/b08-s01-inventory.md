# B08.S01 — Inventory: reviewed source and practice catalogue

> **Independent review (2026-10-16).** Round 1 at `42116d6`: FAIL (minor), "no review workflow" was false for AI suggestions. Round 2 at `b36bde2`: FAIL. The catalogue premise was overstated: the only HEAD gate is a constant, and no code checks a review record. The duplicate row was generic and is rewritten. Base note: `src/parts-cartographer/screens/suggestion-review.jsx` and `src/shared/core/data/constellations.ts` are HEAD paths under a 10d9608 header. Status is still **candidate, not accepted**; re-review is required.

- Bead: `ArchetypeAI-z5qy` (B08.S01).
- Base checked: `git:10d9608` on `claude/full-plan-handoff-gmgpkq`.
- Disposition: **candidate inventory; awaiting independent review.** No acceptance is claimed. No application code changed.
- Write set: `architecture/extension/development/b08/s01/**` (this file only).
- Contracts: none published. `base_generation: null`. No lease.

## 1. Finding

No practice catalogue existed at the base 10d9608. The codebase has a catalogue of archetype and constellation content, and the i18n `STRINGS` catalogue, but neither holds practices or source references, and neither has a review workflow. HEAD adds `src/parts-cartographer/core/practice-catalog.ts` (commit 71261d0), whose one status constant `CATALOG_REVIEW.status` is set to `'draft'`. `availablePractices` in `src/parts-cartographer/core/contextual-checkin.ts:12` offers only entries whose status is `reviewed`. No code checks a review record; the gate depends on that constant.

## 2. Existing code and reuse

| Area | Evidence (file:line) | Status |
|---|---|---|
| Archetype and constellation content | `src/shared/core/data/constellations.ts` | Authored archetype content. Not practices. Reusable as the pattern for an authored catalogue. |
| Localised string catalogue | `src/parts-cartographer/i18n/strings.ts` | Copy catalogue. Not a practice or source catalogue. |
| Practice catalogue | none | Absent. |
| Source references with review status | none | Absent. |

**Reuse packages named by the task.** The planning documents define these codes inconsistently across streams (the B01 inventory recorded the same ambiguity). Each code is an unresolved reuse claim until the coordinator confirms its mapping.

## 3. State, effect and component inventory (planned, not implemented)

| Kind | Item | Existing? | Notes |
|---|---|---|---|
| State | Practice entry (title, steps, evidence label) | Partly at HEAD (draft entries in `practice-catalog.ts`) | Evidence label must distinguish research, tradition and practitioner claims. |
| State | Source reference (citation, licence, review status) | No | Needs licence and attribution recording. |
| State | Review record for catalogue practices or contributions (reviewer, decision, date) | No | No catalogue or contribution review workflow exists. AI coach suggestions have a review screen (`src/parts-cartographer/screens/suggestion-review.jsx`). |
| Effect | Publish a reviewed practice to users | No | Publication is governed; not authorised by this slice. |
| Component | Catalogue browser, practice card, review queue | No | No screens exist. |

## 4. Scenario matrix (planned, not exercised)

Each row is planned behaviour for the reviewed practice catalogue. The only HEAD gate is the draft constant in `src/parts-cartographer/core/practice-catalog.ts`, read by the status filter in `availablePractices` (`src/parts-cartographer/core/contextual-checkin.ts:12`). No code checks a review record.

| Scenario | Expected behaviour (planned) | Exercised today |
|---|---|---|
| Normal grant | A practice is offered only when its review status is `reviewed` and the person has opted into practices. Drafts are never offered. | No |
| Denied grant | A practice whose status is not `reviewed` is filtered out by `availablePractices`. The person sees no practice and no hint that one is pending. | No |
| Stale contract | A catalogue entry from an older schema that lacks source references is shown as unreviewed, never as reviewed. | No |
| Account change | A review decision is attributed to the reviewer's account. Changing the reviewer does not alter an earlier decision. | No |
| Deleted source | When a cited source is withdrawn, dependent practices return to draft and are hidden. | No |
| Duplicate or cancelled operation | Setting the same status twice has no further effect. The planned review record would keep one decision per reviewer and version. A cancelled review leaves `CATALOG_REVIEW.status` unchanged. | No |
| Offline or quiet alternative | The catalogue is bundled with the app, so reviewed practices work offline. A missing review never blocks core navigation. | No |

## 5. Six compatibility dimensions for `reviewed source and practice catalogue`

The plan's fixture task names six dimensions: **interface, state, effects, operations, performance and failure**, each with positive and denied cases.

| Dimension | Planned case for `reviewed source and practice catalogue` | Exercised today |
|---|---|---|
| Interface | The practice list shows only reviewed entries. With none, it shows the honest empty state already used in the check-in toolkit. | No |
| State | Each entry carries a schema version, its source references and its review record. Unknown fields are kept. | No |
| Effects | Publishing a reviewed practice is one write keyed by entry id and review version. Republishing the same version is a no-op. | No |
| Operations | A published practice can be returned to draft in one step, and the change is recorded. | No |
| Performance | The catalogue loads once per session, and lookups are by id. | No |
| Failure | A malformed entry is dropped with a logged reason, and the rest of the list still renders. | No |

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
