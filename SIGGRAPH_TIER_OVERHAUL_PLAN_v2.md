# SIGGRAPH-Tier Overhaul — Revised Plan (v2, source-grounded)

> **Status:** Revised design strategy for `ArchetypeAI`, authored through the **sovereign-design** CED
> framework (Pattern / Function / Tension) and **grounded by direct audit of the current source.**
> Supersedes v1's "1/10 → 10/10" framing.

---

## 0. The pivot (read this first)

v1 and the first draft of v2 assumed a **greenfield** visual overhaul. Source audit proves that assumption
**wrong**. The overhaul's *scaffolding* has largely shipped (~85% of surfaces transformed to the paper/ink
storybook language). What did **not** ship is the *soul*, and what *over*-shipped is decoration.

**v2 thesis:** *Ship the soul (typography + the 3D subject), edit the decoration, pick one aesthetic,
and wire-or-delete the dead code.* This is a repair/reconcile pass, not a build pass.

| Layer | v1 assumed | Source reality |
|---|---|---|
| Visual scaffolding | unbuilt | **~85% shipped** (landing, cabinet, assessment, results, synastry, coach) |
| Typography (the identity) | Fraunces + Nunito | **Never loaded** — silently falls back to platform system fonts |
| The 3D subject (archetype blobs) | to be built | **Written but dead** — 4 shader systems never instantiated; nodes are plain spheres |
| Aesthetic coherence | one system | **Two competing** (storybook + neo-brutal), both globally loaded, + an orphaned third (kawaii-sticker React prototype) |
| Decoration density | to be added | **Over-shipped** — 8–11 animated subsystems/frame incl. full-screen Sobel post-FX |
| Scope | 5 screens | **7+ states** incl. synastry, cabinet, landing, auth — none in v1 |

---

## 1. CED re-audit (informed by source)

| Force | Score | Source-grounded verdict |
|-------|-------|-------------------------|
| **PATTERN** | 6 — authored but incoherent | Storybook language is real and mostly shipped, but two systems coexist + an orphaned third; "sketchy" borders are a lie (all identical `2px solid`). |
| **FUNCTION** | 3 — Hypo | 3D scatter is partly legible (position/opacity work) but Attachment has no axis and Size is decorative; a11y thin; perf GPU-bound on mobile; contrast fails on text. |
| **TENSION** | 5 — thesis right, unachieved | "Tender Cartography" is confirmed as the authoritative reference (`style.txt` is literally a "4D Storybook"), but unachieved because typography + the 3D subject never shipped. |

**Root failure mode:** **the soul didn't ship while the decoration over-shipped.** Function Hypo + Pattern near-Hyper + incoherence.

**Equilibrium Prescription:** ship the soul (Function +3), edit decoration and consolidate to one aesthetic (Pattern −1, coherence +2), make the data legible and a11y foundational (Function +1).

---

## 2. Verified findings (confirmed / corrected — honesty ledger)

| # | Finding | Status | Evidence (file:line) |
|---|---------|--------|----------------------|
| A | Aesthetic–domain collision (storybook vs shadow psychology) | **Confirmed** | Domain surfaces shadow material (control/storm clusters, attachment trauma); no register modulation exists |
| B | Decoration over-shipped | **Confirmed, worse** | 8–11 subsystems/frame; full-screen Sobel post-FX `webxr.service.ts:446-505` rendered every frame `:1903`; per-frame DOM writes to ~30 CSS2D labels `:2037-2048,2481-2486` |
| C | Data legibility sacrificed | **Confirmed, nuanced** | Position = Agency/Temp/Focus `:1829-1830`; Opacity = prominence `:2052-2082`; but **Attachment has no spatial axis** (color-tint only `:1754-1764`); **Size is decorative** in default view (only encodes prominence in personal-constellation mode `:2197`) |
| D | A11y structurally thin | **Confirmed, corrected** | ARIA/keyboard inconsistent (cabinet is the lone strong example); `prefers-reduced-motion` is **present (13 rules, not "absent")** — coverage breadth needs audit; emoji-as-affordance; no non-3D fallback |
| E | Performance over budget | **Confirmed, located** | Full-screen Sobel + ink-wobble + grain every frame at ≤1.5× DPR `:446-505`; adaptive disable gated on 60-frame window w/ JS-time proxy metric `:1913-1919` (≈1s lag, misses GPU stalls); dust color-buffer rewritten every frame `:2133-2137` |
| F | Token integrity broken | **Corrected** | Not `--panel-border` (it's `--border-panel`, defined `design-system.css:39`). Real defects: **`--accent-teal-light` undefined** (used as border `assessment-panel.component.css:27`); **`--font-mono` undefined** (`assessment-panel.component.css:135`); **`--border-sketchy`/`--border-soft`/`--border-panel` are identical** (fake variety); `--font-serif` defined 3× with different values (global Iowan vs component DM Serif) |
| G | No empty/error/degraded states | **Confirmed** | Happy-path only; no-WebGL / AI-error / offline / empty unspecified |
| H | Mascot dilution | **Corrected (milder)** | Mascot is concentrated in 2 screens, 3 of 6 uses focal; real issue is **`app-wisdom-owl` — a 2nd fully-built mascot never mounted** (taxonomic, not spatial dilution) |
| **NEW** | **Typography never shipped** | **Confirmed (highest impact)** | No font `<link>`/`@font-face`/`@import` anywhere; tokens resolve to system stacks (`design-system.css:90-91`); only 3 declarations name Fraunces/Space Grotesk — all dead. Platform-dependent identity. |
| **NEW** | **The 3D subject is dead code** | **Confirmed** | `ILLUSTRATED_BLOB_SHADER:510`, `ANXIOUS_SHELL:422`, `AVOIDANT_SHELL:433`, `createBlobTexture:802` — each defined once, never instantiated; live node `MeshStandardMaterial:1772`; every `instanceof ShaderMaterial` branch silently no-ops |
| **NEW** | **Two competing aesthetics** | **Confirmed** | `angular.json` wires both `design-system.css` + `neo-brutal.css`; storybook (`--paper`/`--ink`) vs neo-brutal (`--color-*`, Space Grotesk); collide at Tailwind layer; two different "ink" colors side-by-side |
| **NEW** | **Orphaned kawaii-sticker divergence** | **Confirmed** | `design/kawaii-sticker-character-design/` — 4 unsynchronized copies of a React/Vite prototype pursuing glossy die-cut stickers that **contradict** the authoritative `style.txt`; uncited, no integration path, no decision on record |
| **NEW** | **Dead/duplicated code** | **Confirmed** | `features/coach-panel/` fully built, never mounted (live coach inlined `app.component.html:418-513`); `app-wisdom-owl` never mounted; 4 dead shaders |
| **NEW** | **Scope blind spots** | **Confirmed** | `synastry-panel` (couples compatibility), `cabinet` (specialist/admin back-office), `landing` (full marketing site), auth/backup flows — entire surfaces absent from v1 |
| **NEW** | **No Angular Router** | **Confirmed** | Navigation = signal state-machine (`appState` signal, `@switch` in `app.component.html:6`): loading→intro→cabinet/assessment→gate→results→universe |

---

## 3. Revised plan — six REPAIR layers

### Layer 0 — Ship the soul (foundations)
1. **Decide and load the typographic identity.** Either self-host Fraunces + Nunito (the authored storybook pair) OR formally commit to the system stack (Iowan/Palatino + Avenir) and stop naming Fraunces/Space Grotesk/DM Serif elsewhere. Today it's neither — an uncontrolled platform-dependent fallback. *(Highest-impact single fix.)*
2. **Pick ONE aesthetic — recommend storybook (`style.txt`).** It's the authoritative reference and the Angular app already mostly follows it. Demote `neo-brutal.css` (landing/cabinet/auth) to a deliberate secondary register or remove; **make the gating decision on the kawaii-sticker prototype** — adopt, archive, or delete (currently 4 drifting copies with no mandate).

### Layer 1 — Wire-or-delete the dead code
3. **The 3D subject (the blobs): wire it.** Connect `ILLUSTRATED_BLOB_SHADER` + `ANXIOUS_SHELL`/`AVOIDANT_SHELL` to the archetype nodes (replacing `MeshStandardMaterial:1772`) — this ships the entire storybook-blob vision *and* fixes Attachment legibility (the shells were designed for exactly that). If wiring is too risky, **delete** all four to reduce the 2677-line service's entropy — but don't leave 4 dormant shaders.
4. **Reconcile the coach:** mount `features/coach-panel` or delete it; stop hand-inlining the coach in `app.component.html:418-513`.
5. **`app-wisdom-owl`:** delete, or deploy at exactly one focal beat.

### Layer 2 — Make the data the hero (Function)
6. **Give Attachment a real channel** — the shells from #3, or an explicit secondary encoding; the color-tint-only status quo is unreadable.
7. **Make Size = prominence in the default view**, not only in personal-constellation mode.
8. Keep what works: position (3-axis scatter) + opacity (proximity-weighted prominence).

### Layer 3 — Edit the decoration (Pattern)
9. **One ambient particle system app-wide**, not per-surface; reserve full flourish for 3–4 beats (loading → reveal → detail-open → creation).
10. **Performance fixes:** move the per-frame CSS2D DOM writes (`:2037-2048,2481-2486`) to a dirty-flag/throttle model; rewrite the dust twinkle as a shader uniform, not a per-frame buffer rewrite (`:2133-2137`); gate the full-screen Sobel on a **real GPU-time metric** (not the JS-time proxy) and cap DPR harder on mobile.
11. **Establish ONE Memory Anchor motion** (the page-turn / reveal) — currently there is no signature motion, just uniform bounce.

### Layer 4 — Accessibility foundation
12. **Audit + extend the 13 `prefers-reduced-motion` rules** to cover every heavy animation.
13. **Custom SVG icon set** (replace emoji-as-affordance); **non-3D list/table fallback** of the universe; full keyboard route; ARIA state mirroring for every visual/expression state.
14. **Contrast:** never use `--accent-yellow` as text/border on paper (≈1.4:1); darken `--cluster-gift` text usage; collapse the fake border-token variety (`--border-sketchy`/`-soft`/`-panel`) into honest names.

### Layer 5 — Emotional Register System (Tension)
15. Modulate the (now-coherent) storybook language by content weight — `Wonder` / `Reveal` / `Calm` / `Shadow` / `Insight` — each tuning motion intensity, saturation, particle density, copy register. Resolves Finding A: the design *bends toward gravity* when the content warrants it (shadow archetypes, attachment results), instead of being uniformly whimsical.

### Layer 6 — Scope reconciliation
16. **Fold the orphaned surfaces into the journey:** synastry (couples), cabinet (specialist/admin), landing (marketing), auth/backup. They exist; the plan must own them — including a **specialist register** (cabinet is practitioner-facing; it should not wear the same consumer-whimsy skin).

---

## 4. Creative Constitution (confirmed by `style.txt`)

- **Core Function:** turn a confronting relational self-assessment into a moment of *clarifying self-recognition* the user trusts.
- **Emotional Resonance:** **Reverent Self-Recognition** — "oh, *that's* the pattern," held gently.
- **Visual Contradiction:** **"Tender Cartography"** — tenderness (storybook paper) fused with cartography/forensics (dimensional coordinates, attachment science). *Confirmed:* `style.txt` is titled **"Archetypal Universe | 4D Storybook"** and describes exactly this — the Angular app follows it; the kawaii prototype and neo-brutal.css do not.
- **CED Targets:** Pattern **6**, Function **6**, Tension **6**.
- **Memory Anchor:** the **page-turn / reveal transition** (one signature motion, currently unestablished).
- **Assumption challenged:** "a psychology tool must look clinical *or* cute."

---

## 5. Priority order (cheapest high-impact first)

| # | Repair | Effort | Impact |
|---|--------|--------|--------|
| 1 | Load fonts (or commit to system stack) | XS | Identity-defining |
| 2 | Define `--accent-teal-light` + `--font-mono` (or remove) | XS | Fixes invisible UI |
| 3 | Collapse fake border-token variety + fix yellow/green-as-text contrast | S | Coherence + a11y |
| 4 | Decide aesthetic: demote neo-brutal / resolve kawaii prototype | M | Coherence |
| 5 | Wire-or-delete dead shaders + dead components | M–L | Ships the 3D subject / removes rot |
| 6 | Perf: throttle CSS2D writes, uniform-ize dust, real Sobel gate | M | Mobile viability |
| 7 | A11y: keyboard route, SVG icons, non-3D fallback, reduced-motion coverage | L | Functional baseline |
| 8 | Emotional Register System + scope reconciliation | L | Tension + completeness |

---

## 6. Evidence appendix (file:line)

**Type / fonts:** `src/index.html` (favicon-only), `src/styles/design-system.css:90-91` (system stacks), 3 dead Fraunces/Space Grotesk refs.
**3D scene:** `src/services/webxr.service.ts` — dead shaders `:422,433,510,802`; live node `MeshStandardMaterial:1772`; position `:1829-1830`; opacity `:2052-2082`; Sobel post-FX `:446-505,1903`; CSS2D DOM writes `:2037-2048,2481-2486`; dust buffer rewrite `:2133-2137`; adaptive gate `:1913-1919`.
**Dead components:** `features/coach-panel/` (never mounted; inline coach `app.component.html:418-513`); `shared/components/wisdom-owl` (never mounted).
**Tokens:** `design-system.css:39-42` (identical borders), `:24,30,35` (Wong palette drift); `assessment-panel.component.css:27,135` (undefined tokens); `results-panel.component.css:86-102` (green-as-text contrast).
**Dual aesthetic:** `angular.json` styles array; `neo-brutal.css`; `tailwind.config.cjs:8-28`.
**Divergence:** `design/kawaii-sticker-character-design/` (×4 copies); `style.txt` (authoritative "4D Storybook").
**Architecture:** `app.component.ts` `appState` signal (no Angular Router); `app.component.html:6` `@switch`.
**Reduced-motion:** 13 rules present (coverage breadth to audit).

---

*Grounded 2026-06-16 via four parallel read-only source audits + spot-verification of load-bearing claims. `prefers-reduced-motion` count corrected from an agent's "0" to the verified 13.*
