# A01.01 AAA v7.1 source pin, adoption claims and optional-profile exclusions

**Bead:** ArchetypeAI-9ulr (A01.S01, planning key of the A01.01 step)
**Status:** CANDIDATE, awaiting independent review. Not accepted. No AAA conformance is claimed.
**Output contract:** `aaa-source-pin` v1 (new; no predecessor contract consumed)
**Immutable base:** worktree HEAD `09194df5f48326bff14e42a1e4eb8d66c457186d`, observed. This is not a reconciled generation; `base_generation` stays unresolved.

"Snapshot L<n>" below means a line of `docs/plans/references/AAA-V7-SPEC.source.md`, the pinned file.

## 1. Pin

| Field | Value |
| --- | --- |
| Declared title and version | Antifragile Adaptive Architecture v7.1, `Version: 7.1.0`, `Status: Draft normative specification` (snapshot L1-5) |
| Upstream provenance | https://github.com/shapefuture/AAA-Architecture/blob/main/AAA-V7-SPEC.md (from the Bead). This candidate did not fetch it. |
| Local snapshot | `docs/plans/references/AAA-V7-SPEC.source.md` |
| SHA-256 | `e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc` |
| Size | 46531 bytes, 1445 lines |
| Git blob at base | `2eb18f3f77257b492df1fe1484f8237a930c508e` |
| Introducing commit | `17a0f34`. The file's bytes at that commit hash to the same SHA-256. |

The pin binds bytes, not names. The upstream file is named `AAA-V7-SPEC.md` and the local copy carries `.source.md`. The pin does not make the draft final. Test T1 recomputes the digest.

## 2. Traceability for source sections 1-3, 7 and 44

Strength codes: **MUST** and **SHOULD** follow the source keywords defined at snapshot L10. **Declarative** means a keyword-less statement; it is adopted at MUST strength (interpretation I-2). Status: **Specified** = stated and checkable here; **Partial** = some repo evidence; **Not met** = no repo evidence; **Pending** = waits on a named step (gate IDs are in section 5).

### 2.1 Section 1, design goal (snapshot L14-31)

Source text: "A system conforming to AAA v7.1 SHALL be able to answer, mechanically where feasible" (L16). "The system SHALL prefer preservation of valid work over global reset and SHALL prefer the least powerful mechanism that solves the problem." (L31)

| Q | Question (L18-29) | Current answer at base | Status |
| --- | --- | --- | --- |
| 1 | What must never become false? | No invariant registry. This candidate states one invariant: the pin is not edited in place (C-M3). | Partial, G-5 |
| 2 | Authoritative state and recovery | Git history holds artifacts; Beads holds task status. No app-state inventory yet. | Pending, A01.04 |
| 3 | Effects, authority, reversal | This candidate has no external effects. No repo-level effect inventory exists. | Pending, G-9 |
| 4 | Exact generation running | No GenerationManifest. The pin identifies the specification input only. | Not met, G-6 |
| 5 | Evidence justifying activation | No activation evidence bundle (source section 24). | Not met, G-6 |
| 6 | Change relative to parent | Git diff only; no manifest. | Partial |
| 7 | Smallest invalidated dependency cone | Not computed. | Pending, A01.05 |
| 8 | Autonomous versus approved adaptation | The runtime autonomy level is not declared; the AAA plan (line 44) rejects calling the model-enabled product AG0. Dev changes are governed by Beads and review. Live model calls exist (section 4, O-1). | Partial |
| 9 | Return to legitimate state | This candidate: `git revert`. No app runtime recovery is declared. | Partial |
| 10 | Which optional mechanisms are enabled | Runtime-agentic flag not declared. Live model calls exist. | Open conflict, O-1 |
| 11 | Workcells, write sets, parallel safety | Write set declared; the diff was checked against it. Shared-checkout reservations only (C-M7). | Partial |
| 12 | Swappable components | React and Angular AI ports differ. `AiPortV1` is frozen with additive versioning. | Partial, G-8 |

The candidate adds two files and no runtime mechanism or service, so it applies the "least powerful mechanism" rule to itself.

### 2.2 Section 2, first principles (snapshot L33-87)

| Principle | Source text (line) | Strength | Repo evidence and status |
| --- | --- | --- | --- |
| P1 Minimal privileged kernel | "Everything else SHOULD be replaceable." (L39) | SHOULD | No kernel defined. Pending A01.02. |
| P2 Separation of authority | "Execution authority, evaluation authority, deployment authority, and evidence authority MUST be separable." (L43) | MUST | Not met. No separate evaluator or deployer. G-6, G-11. |
| P3 Immutable generations | "A running generation MUST NOT silently rewrite its own identity." (L47) | MUST | Partial: applied to the pin (C-M3), where T1 detects a byte change; app generations not met, G-6. |
| P4 Minimal disturbance | "...SHOULD invalidate only the smallest causally dependent subgraph..." (L51) | SHOULD | Not evidenced. Pending A01.05. |
| P5 Reconstructibility | High-consequence adaptive decisions "MUST be attributable" (L55) | MUST, when such decisions exist | None declared at runtime. Not applicable to the pin. |
| P6 Typed effects | "The architecture SHALL distinguish..." six effect classes (L59) | MUST | Applied to this candidate (section 7). Repo-wide inventory pending, G-9. |
| P7 Bounded adaptation | Adaptation loops "operates inside explicit authority, budget, risk, and time bounds" (L63) | Declarative | No adaptation loop exists. |
| P8 Verification before persistence | Generated changes "MUST NOT become persistent trusted behavior merely because..." (L67) | MUST | Applied. Candidate output is a claim until independent review (G-1). |
| P9 Self-stabilization target | "...MUST be explicit" for systems declaring adaptive or recovery behavior (L71) | MUST, conditional | No adaptive behavior declared. Reopen on any runtime recovery loop. |
| P10 Monotonicity before coordination | Non-monotone decisions and irreversible global effects "MUST cross an explicit coordination or fencing boundary" (L75) | MUST | Task status crosses Beads authority. No runtime global effects in scope. Partial. |
| P11 Complexity pays rent | "...SHOULD be removable unless evidence shows useful marginal value." (L79) | SHOULD | Applied: no service, no dependency, stdlib test only. |
| P12 Agent-native isolation | "Workcells MUST NOT coordinate through a shared mutable workspace." (L83) | MUST | Partial, C-M7. |
| P13 Contract-bound swappability | "Consumers MUST depend on logical component slots and versioned contracts..." (L87) | MUST | Partial for AI ports, G-8: frozen, versioned ports exist, but the repo imports concrete adapters (`src/parts-cartographer/overlays.jsx:13`, `app.jsx:7`). |

### 2.3 Section 3, universal architecture (snapshot L89-125)

- "Logical separation is REQUIRED. Physical separation is profile-dependent." (L125). **MUST.** Partial. Domain and adapter files are separated in places (section 2.5, item 4). No logical-separation check exists yet (G-11).
- "The development fabric exists for every conforming program, even when the runtime-agentic profile is AG0." (L125). Declarative (no keyword), adopted at MUST strength (I-2). Partial, see section 2.6, C-M10.
- Optional runtime profiles listed at L118-122 (resilience, distributed, incremental, adaptive, plugin-runtime, safety-critical, runtime-agentic). They are handled in section 4.

### 2.4 Section 7, immutable generation model (snapshot L254-284)

| Source clause | Strength | Repo evidence and status |
| --- | --- | --- |
| "Every meaningful deployable state SHALL have a `GenerationManifest`." (L256) | SHALL | Not met, G-6. Deployables at base: `wrangler.toml` (worker `archetypeai-worker`, main `worker.ts`), the React/Vite build, the retained Angular build, and `firestore.rules`. This candidate is not a deployable state. |
| Manifest fields (L259-273): `source_hash`, `build_hash`, `dependency_lock_hash`, `configuration_hash`, `schema_hashes`, `policy_hash`, `component_graph_hash`, `feature_configuration_hash`, `evidence_root`, `parent_ids`, `signer` and others | SHALL, via the manifest clause | The pin supplies `source_hash` for the specification input only. Build identity is partly content-addressed: `scripts/stamp-sw.mjs` uses the short git HEAD plus a content hash, with `Date.now()` only as a fallback; `scripts/stamp-parts-cartographer-sw.mjs` embeds a wall-clock value (`Date.now()`, line 23). Neither is a GenerationManifest (per the AAA plan). Not met, G-6. |
| "`generation_id` SHOULD be content-addressed." (L276) | SHOULD | Partial. The pin is a SHA-256 content address. No app generation IDs exist. |
| "Activation MUST be atomic from the control plane perspective" (L278) | MUST | Not met. No activation mechanism exists, G-6. |
| "The previous generation SHALL remain addressable for rollback..." (L284) | SHALL | Partial. Git retains the pinned blob (case F7). No app rollback target is declared, G-6. |

### 2.5 Section 44, minimal adoption profile (snapshot L1355-1372)

L1357 says "A small ordinary application can conform without becoming infrastructure-heavy." L1359 introduces "Minimum:" with no keyword. This candidate adopts all ten items as the floor for the minimal profile (interpretation I-1). L1372: "Everything else is activated by need."

| # | §44 item | Adopted as | Repo evidence at base | Status, gate |
| --- | --- | --- | --- | --- |
| 1 | Constitution with a few hard invariants | MUST | None in `src/`, `scripts/`, `.github/`, `.agents/`. Planned package `a09p` (`znk3` to `ayt6`). | Not met, G-5 |
| 2 | Mandatory Agentic Development Fabric, isolated workcells, no shared mutable workspace | MUST | `.agents/skills/full-plan-delivery` (reservations, `templates/workcell.json`) and the roadmap continuity guard in CI. The skill's README says reservations "coordinate cooperating agents in one checkout." | Partial, G-7 |
| 3 | Component slots plus versioned contracts | MUST | `src/app/core/ports/ai.port.ts` (`AiPortV1` frozen, additive versioning, AAA-05); `src/parts-cartographer/core/ports.ts` ("frozen V1"). React and Angular ports diverge (AAA plan). No slot registry. | Partial, G-8 |
| 4 | Domain/adapter boundary | MUST | Adapters at `src/app/core/adapters/*` and `src/parts-cartographer/core/*adapter*.ts`. React wiring imports concrete adapters (AAA plan). | Partial, G-8 |
| 5 | Typed effects for external and state mutations | MUST | No effect registry found. `src/parts-cartographer/elevation/e17-operation-status.ts:17` defines a three-class `EffectClass` (`read`, `idempotent-write`, `non-idempotent-write`) for retry only, not the six classes of §9. | Partial, G-9 |
| 6 | Immutable build and version identity | MUST | Build identity is partly wall-clock: see 2.4 for the two stamp scripts. | Not met, G-6 |
| 7 | Rollback path | MUST | No app rollback procedure found. `src/parts-cartographer/core/backup.ts:134` rolls back partial local writes on quota or storage failure; that is not a release rollback. | Not met, G-6 |
| 8 | Architecture, contract and swap-compatibility tests | MUST | This candidate adds the first architecture test (T1 to T3). `src/app/core/adapters/ai-port.contract.spec.ts` exists. CI runs `tests/architecture/a01` in the verify job (`.github/workflows/ci.yml`, step added in `52002da`). | Partial, G-2 |
| 9 | Control journal for deployments and incidents | MUST | None at base. The AAA plan plans an append-only or tamper-evident journal. | Not met, G-6 |
| 10 | Explicit risk classification | MUST | Bead metadata classifies this candidate R1 and M0. Source risk classes at L846 (section 21). No repo-level classification. | Partial, G-12 |

### 2.6 Section 11A, mandatory development fabric (snapshot L404-416, L470-484)

Referenced by §44 item 2 and by L125. Not traced beyond these clauses in this candidate.

- "The development fabric MUST provide five logical services" (L408): Task Graph Compiler, Workcell Manager, Contract Registry, Integration Broker, Independent Verifier. **MUST.** Status by service:
  - Task Graph Compiler: partial (roadmap continuity guard, `full-plan-delivery` planner).
  - Workcell Manager: partial (`workcell.json` template, `leases.py`). The module's docstring says it is "not a distributed lock or sandbox."
  - Contract Registry: not met. Only a version comment in `ai.port.ts` exists.
  - Integration Broker: not met as a service. Broker-owned writes are declared in the Bead.
  - Independent Verifier: not met as an independent owner. CI runs the gates on the same push and pull request.
- §11A.3 (L472): "Two concurrently executing workcells MUST NOT mutate the same working directory, checkout, ... or unversioned integration environment." (C-M7). Two gaps: the reservation helper serves one shared checkout, and the git stash stack is shared across worktrees in this environment. L484 says a Git branch alone is not sufficient isolation for shared mutable worktrees or environments. It does not name stashes, so the stash point is this candidate's inference: worktree isolation does not by itself isolate stash state. This candidate uses no stash.

## 3. Adoption claims

### 3.1 MUST (source strength, not weakened)

- **C-M1** Section 1 questions must be answerable "mechanically where feasible." Section 2.1 gives each answer's status. The source qualifier is kept.
- **C-M2** Preserve valid work over global reset; prefer the least powerful mechanism (L31).
- **C-M3** Immutable generations (P3, §7). Once committed, a pinned version is not edited in place. A changed source gets a new version.
- **C-M4** Typed effect classes (P6, L59). Applied to this candidate in section 7.
- **C-M5** Verification before persistence (P8). Candidate output is a claim until independent review.
- **C-M6** Explicit coordination or fencing for non-monotone and irreversible effects (P10).
- **C-M7** No shared mutable workspace (P12, §11A.3). Partial, see 2.6.
- **C-M8** Logical separation REQUIRED; consumers depend on slots and versioned contracts (P13, L125). Partial.
- **C-M9** Generation manifest per deployable state; atomic activation; prior generation addressable (§7). Not met.
- **C-M10** The five logical development services (§11A, L408). Partial, see 2.6.
- **C-M11** Section 44 items 1 to 10 as the minimal profile floor (2.5).
- **C-M12** Keyword semantics from L10. Keyword-less statements are adopted at MUST strength (I-2).

### 3.2 SHOULD (adopted; any deviation needs a recorded reason)

- **C-S1** Everything else replaceable (P1, L39).
- **C-S2** Minimal disturbance (P4, L51).
- **C-S3** Complexity pays rent (P11, L79). Applied: this candidate is removable with one revert.
- **C-S4** Content-addressed `generation_id` (§7, L276). The pin is a content address for the specification input, not a generation id. C-S4 is not met for the application.
- **C-S5** "Everything else is activated by need" (L1372). Applied in section 4.

### 3.3 Local policy (repo decisions, not source claims)

- **LP-1** App-scale realization: repo scripts, CI and Beads. No deployed development services. The AAA plan states that five logical development services "do not imply five deployed servers."
- **LP-2** The pin test uses Python standard library `unittest`, in the style of `scripts/roadmap/test_continuity.py`, run with `python3 -I`. It needs no network and no npm.
- **LP-3** Beads is the task-status authority. This file records no status.
- **LP-4** The pin identifies the local snapshot bytes. The upstream URL is provenance only. Nothing at runtime depends on it.
- **LP-5** Artifact and test paths: `architecture/a01/a01-01-aaa-source-pin.md` and `tests/architecture/a01/test_source_pin.py`.
- **LP-6** Candidate classification M0 and R1 (Bead). This candidate does not change the active generation, authority, evaluator or promotion policy, so no M4 or R4 governance transaction is triggered.

### 3.4 Interpretations for independent review

- **I-1** Section 44 uses no normative keyword. It is read as the floor for the minimal profile because it says a small application "can conform" with it. Lowering any item would weaken the adopted requirement.
- **I-2** Keyword-less statements (P5, P7, P9 and similar) are adopted at MUST strength so that no requirement is silently weakened.

## 4. Optional-profile exclusions and conditions

| Profile (snapshot line) | Decision | Basis | Reopen trigger | Evidence needed to adopt |
| --- | --- | --- | --- | --- |
| Cellular/distributed (§27, L959) | Excluded | No cell membership. No blast-radius requirement declared. | A measured failure-domain requirement | Control-plane cell membership and failure drills |
| Plugin-runtime (§28, L967) | Excluded | No plugin host: a search of `src/` and `worker*.ts` for "plugin" finds nothing. | Third-party or user-installed extensions | Typed services, capabilities, compatibility checks (§28) |
| Runtime-agentic (§29, L982) | **Default-off; open conflict O-1** | `profiles.agentic.enabled: false` (L987-989). But live model calls exist: `src/services/gemini.service.ts`, imported by the synastry panel, universe controls, results panel and `app.component.ts`; the coach panel does not import it. Live calls also run through `worker.ts:388-389` (Ollama, OpenRouter). The AAA plan requires a narrowly declared AG1 scope for these calls when enabled. | A01.02 decides whether the shipped model calls count as enabled. This candidate does not change the flag. | AG1 additions: tool capability broker, model/tool execution journal, context provenance, effect-appropriate sandbox (L1004-1009) |
| AG2 persistent learning (L1011) | Excluded | Model output enters personal memory as `source: 'model-inference'` with `saved` defaulting to false (`src/parts-cartographer/core/personal-memory.ts:5`; `src/parts-cartographer/elevation/e06-corrections.ts:45`; `src/parts-cartographer/screens/memory-panel.jsx:16`, `:77-79`, `:157`). Saving needs the user's choice. No skill promotion found. | Any feature that stores model-derived experience as trusted memory or skills | Evidence-promotion firewall, quarantine, poisoning checks, rollbackable versions (L1015-1021) |
| AG3 harness self-improvement (L1023) | Excluded | The AAA plan keeps AG3 and AG4 disabled under this adoption. | A separate governed adoption decision | L1027-1035 |
| AG4 bounded recursive self-improvement (L1037) | Excluded; at least R4 (L1052) | As for AG3. | As for AG3, under R4 governance | L1041-1050 |
| Resilience, distributed, incremental, adaptive (L118-122; §§12-18; §27 is in the row above) | Not adopted; activated by need (L1372) | Not in the §44 floor. No demonstrated need in this candidate. | Demonstrated failure or performance need | Profile-specific evidence |
| Microservices, Kubernetes, event sourcing, CRDTs, cloud dependency | Excluded | Firebase is a runtime dependency of the shipped app (`package.json`; `src/app/core/adapters/firebase-auth.adapter.ts`). The core modules this artifact traces do not import it. The exclusion is this candidate's scope choice, not a plan-level fact. | Demonstrated need | Profile adoption review |

Section 11A (development fabric) is mandatory and is not excluded.

## 5. Gates and open items

Gate status for this candidate is PENDING unless marked otherwise. Planned step IDs come from the AAA plan snapshot. Beads is the live authority and was not queried.

| Gate | Requirement | Status | Owner or planned step |
| --- | --- | --- | --- |
| G-1 | Independent review of the pin, traceability, classes, I-1 and I-2 | PENDING | Independent reviewer, not the producing workcell |
| G-2 | Run `python3 -I -m unittest discover -s tests/architecture/a01 -p 'test_*.py'` in CI | DONE in `52002da`, pending broker review | One step added to the verify job of `.github/workflows/ci.yml`, outside this candidate's write set; the broker must accept it before acceptance |
| G-3 | Re-run T1 to T3 in a fresh clone | PENDING | Independent verifier |
| G-4 | Drift check of the snapshot against the upstream URL | PENDING (no network used) | Verifier with network access |
| G-5 | Constitution and invariant registry (§5, §44.1) | NOT MET | Planned `a09p` (`ArchetypeAI-znk3` to `ArchetypeAI-ayt6`) |
| G-6 | GenerationManifest, atomic activation, retention, control journal, rollback (§7, §10.1, §44.6, 44.7, 44.9) | NOT MET | Planned `gx64` (`nz8e` to `n9ad`) |
| G-7 | Workcell isolation and lease fencing (§11A.3) | PARTIAL | Planned `1sc0` (`69s2` to `4eqp`) |
| G-8 | Contract registry, slot binding, port divergence (§11C, §44.3, 44.4) | PARTIAL | Planned `b9hv` (`g010` to `wcfj`) |
| G-9 | Typed effect inventory (§9, §44.5) | NOT MET | Planned `m45b`; A01.04 inventory |
| G-10 | Runtime-agentic determination, O-1 (§29) | OPEN CONFLICT | A01.02 |
| G-11 | Architecture fitness and logical-separation checks (§19, §44.8) | NOT MET | Planned `n4li` (`px1i` to `q349`) |
| G-12 | Repo-level risk classification (§21, §44.10) | PARTIAL | Planned under `a09p` |

## 6. Failure and recovery cases

T1, T2 and T3 name the three test methods in `tests/architecture/a01/test_source_pin.py`, in order: snapshot digest, artifact present and recording the pin, and the deliberately wrong digest.

| # | Case | Expected behavior | How exercised | Result |
| --- | --- | --- | --- | --- |
| F1 | Positive: snapshot unchanged | Digest equals the pin | T1 | Run recorded in the candidate report |
| F2 | Denied: digest differs from pin (negative case) | `PinMismatch` raised; the pin is not updated | T3 | Run recorded in the candidate report |
| F3 | Denied: snapshot edited by one byte | Same comparison path as F2 | Not separately exercised. A real edit needs a temporary copy. Deferred to G-3. | Not exercised |
| F4 | Conflict: upstream differs from the snapshot | Local pin stays authoritative. An upstream change needs a new artifact version. | Not exercised (no network) | PENDING G-4 |
| F5 | Stale: artifact cites a different digest | T2 fails | T2 assertion present; drift not injected | Not exercised |
| F6 | Missing snapshot or artifact | Explicit assertion failure, not a skip | T1 and T2 assertions present | Not exercised |
| F7 | Recovery: working-copy snapshot corrupted | Restore from `17a0f34`, verify the digest equals the pin. Never edit the pin to match. | Hash of the file at `17a0f34` checked as a restore source | Not exercised by a recorded test; this review reproduced the hash and it matches |
| F8 | Recovery: upstream legitimately revised | New artifact version with new digest, clause-level diff against section 2, independent review. Version 1 and its digest stay addressable in git. | Not exercised | PENDING |
| F9 | Undeclared write by the producing workcell | Reject. Diff must contain only the write set. | `git diff --name-only` checked against the write set before commit | Checked before commit; see candidate report |
| F10 | Stale base: uncommitted application changes exist outside HEAD (AAA plan) | This inventory does not describe them. A01.03 reconciles before any app-scoped claim. | Not exercised | PENDING A01.03 |
| F11 | Rollback of this candidate | `git revert` of `1384694` removes the artifact and the test; the CI step added in `52002da` must be reverted with it, or CI points at a missing directory. No runtime state, migration or external effect is involved. Beads status is separate and is reverted by the coordinator in the tracker. | Not exercised | Limitation: after a push, revert adds a commit. Git does not undo tracker state. |

## 7. Record: contracts, state, effects, risk, evidence

- **Read set:** `docs/plans/references/AAA-V7-SPEC.source.md`; `docs/80-20-plan.md` (scanned: no AAA or A01 references); `.github/workflows/ci.yml`; `src/**` (paths checked for the surfaces named above, not read in full); `docs/plans/aaa-v7-architecture-and-agent-sweeps.md` and `docs/plans/elevation-aaa-v7-beads-plan.json` (plan snapshots, not authority); `docs/eleven-out-of-ten-plan.md` (points to the AAA plan).
- **Write set:** `architecture/a01/**`, `tests/architecture/a01/**`. Nothing else is written.
- **Changed contracts:** none existing. New: `aaa-source-pin` v1, consisting of the section 1 values and the constants in the test. Consumer: A01.02, read-only.
- **State ownership:** no runtime state. Git holds the artifacts; Beads holds task status.
- **Effect class:** reads of the source file, pure hash computation, reversible file creation inside the write set. No network, service, or migration.
- **Mutation and risk:** M0 and R1 as declared by the Bead.
- **Evidence status:** participant N/A; device N/A; live service N/A (no runtime change, no network); independent review PENDING; app-level acceptance NOT claimed.
- **Output digest:** the SHA-256 of this file cannot be stored inside it. It is reported with the candidate.

## 8. Next handoff: A01.S02 (ArchetypeAI-21cq)

A01.S02 consumes this file as an immutable input:

1. The pin in section 1 (digest, path, blob).
2. The trace IDs and classes in sections 2 and 3. A01.S02 inherits these and does not re-decide them.
3. The exclusions in section 4. A01.S02 must resolve O-1 (G-10).
4. The gates in section 5. A01.S02 must not mark G-5 to G-12 satisfied without fresh evidence of its own.

A01.S02 must not edit this file. A change needs a new version through the same write set, or a broker-owned request. The CI wiring (G-2) was made in `52002da`, outside this candidate's write set; the broker must accept it.

This file does not establish AAA v7.1 conformance.
