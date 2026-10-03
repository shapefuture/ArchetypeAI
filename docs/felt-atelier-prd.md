# PRD — Felt Atelier: Character Customizer & Randomizer

Owner: Innerverse · Status: Draft v2 · Style lock: handmade appliqué felt plush (refs: generated "felt lineup" images 9 and 10, used for **creature design only**; their table, layout and lighting are ignored)

**Scope:** the character customizer and randomizer, nothing else.
- **Out of scope:** the cosmos map, its layout and its lighting. The map consumes our output and places each character in 3D on the axes (AGENCY · TEMPERATURE · FOCUS).
- **Our job:** characters that are true 3D felt objects, good from every angle and under the map's lighting.

---

## 1. End in mind
Every user builds their own inner family of felt characters. Each one looks like a real handmade appliqué plush that could be held and turned in your hand. It's generated in about one second, customised in under a minute, and handed to the 3D map as a self-contained, lit-in-engine 3D asset (plus a 2D icon for UI chips).

**The 10/10 bar:** in a blind test, people can't tell our turntable render from a turntable video of the same character sewn in real felt (§9).

## 2. First-principles decisions
| # | Decision | Why |
|---|---|---|
| D1 | **Model the craft, not the picture.** A character is built the way a maker sews it: cut two body pieces, stuff, blanket-stitch the seam, add felt eyes or embroidery, stitch one patch. Each customizer slot is one craft step. | The craft is already modular, so interchangeability comes for free. |
| D2 | **Real material atoms, procedural assembly.** Scan real felt swatches, real thread stitches and real French knots. Code only places and jitters them. | Procedural noise never looks like wool. |
| D3 | **Ground truth = real sewn felt, not AI images.** Commission 12 physical characters from our specs and film them on a turntable. | AI references contain artifacts. Real felt is the only honest 10/10. |
| D4 | **A finite felt swatch library, with no colour wheel.** | Real felt comes in fixed colours, so unreal or ugly colour combinations become impossible. |
| D5 | **One DNA → every output.** About 30 fields of JSON produce the 3D asset and the 2D icon. Same DNA and seed, same result. | Consistency, tiny storage, easy sync. |
| D6 | **True 3D, lit live — never baked.** We output *material maps* (albedo, normal, height, roughness, sheen) and a mesh, not a lit picture. The map's lights light the character. | Characters must sit in a 3D space under that space's light. |
| D7 | **The body is a two-sided inflated pillow.** Front and back domes come from the outline, joined by a stitched seam ring around the edge, exactly like real appliqué plush. | Physically correct, it reads well from any angle, and needs no cloth simulation. |

## 3. Fidelity spec (creature only)

**Construction:**
- **Body:** two felt pieces, stuffed, joined at the rim by a blanket stitch that wraps over the seam.
- **Front:** the face, the patch, optional extra stitching.
- **Back:** plain felt. Optionally carries a small stitched name tag of the part's initial, as a later option.

**Proportions** (fractions of body width W):

| Element | Spec |
|---|---|
| Body thickness | 28–38% W in total (both domes), lumpy stuffing (low-frequency 3% height noise), rounded seam edge with a slight pinch at each stitch |
| Blanket stitch | Spacing 4.5–5.5% W (±12% jitter), tick length 3–4% W (±10%), angle jitter ±5°, thread 0.9–1.2% W, loop riding over the seam |
| Button eyes | White felt disc 15–20% W with a pupil 50–65% of the disc, each a raised felt layer about 1.5% W thick |
| French-knot eyes | 5–7% W raised knots |
| Eye layout | Gap 28–45% W, eye line 35–50% from the top |
| Mouth | 6–12% W back-stitch, present on about 40% of characters |
| Patch | 18–28% W, a raised felt piece about 2% W thick with its own stitch, never touching eyes or mouth |
| Size | Varies 0.75–1.25× |

**Realness cues** (mandatory, seeded per character):
1. Irregular stitch spacing and angle.
2. A seam pinch at every stitch.
3. A fibre halo 0.5–1% W around every silhouette edge, at every view angle.
4. Heathered colour and pilling specks.
5. Hand-cut asymmetry (outline wobble ±1.5% W).
6. Uneven stuffing, slightly different front and back.
7. Plied thread with a soft sheen.
8. Felt-on-felt cut edges with self-shadowing.
9. Raised French knots.
10. Directional satin-stitch sheen.

**Two felt collections:**
- **Wool** (default): heathered, muted, tone-on-tone thread at +0.12 OKLCH lightness.
- **Bright:** vivid felt with cream thread.

**Do not copy from the AI images:** unintended mismatched eyes, a patch on the sun's face, random two-tone bodies, mixed thread logic, smiles on every character.

## 4. Character DNA (v2)
```jsonc
{
  "v": 2, "render": 1, "seed": 2954118231,
  "collection": "wool",
  "body":  { "t": "bean", "w": 1.0, "h": 1.05, "depth": 0.32, "lean": -0.2, "wobble": 0.6 },
  "felt":  "wool.sage",
  "thread":"tone",
  "eyes":  { "style": "button", "size": 1.0, "gap": 0.5, "y": 0.45, "gaze": [0.3, 0.0], "lid": 0.0, "brow": "none" },
  "mouth": { "style": "none" },
  "patch": { "t": "moon", "felt": "wool.gold", "zone": 2, "rot": -12, "scale": 1.0 },
  "extra": { "seam": false, "knots": 0 },
  "size":  0.95,
  "earned": []
}
```
- **Bodies (12):** cloud, frog-lump, rounded triangle, heart, bean, teardrop, crescent, rounded square, five-lobed flower, mochi, pentagon, pill. `sun` is reserved for the Self (layered 3D felt rays).
- **Eyes:** button, knot, oval-side, arc, lash-arc, line, half-lid, wink.
- **Mouths:** none, smile, frown, o, line, wobble, smirk.
- **Patches:** ringed planet (the ring is a real 3D felt hoop standing off the body), crescent moon, star, comet, orbit loop, constellation, none.
- **Templates are designer-authored vectors,** with parameter ranges and anchor zones (eye zone, mouth anchor, 3–4 patch zones).
- **Determinism:** `hash(DNA)` gives the cache key and the PRNG seed, and the `render` field pins the renderer version.

## 5. Asset pipeline (what the customizer outputs)
**Chosen approach:** a scanned material kit plus procedural sewing, then a 3D inflated mesh, all lit live.

**Rejected approaches:**
| Approach | Why rejected |
|---|---|
| Pure procedural | Fibres and thread look fake |
| Cloth simulation | Cost with no visible gain |
| AI image per character | Not 3D, not consistent, can't be edited live |

**Pipeline steps:**
1. **Outline:** template, plus parameters, plus seeded wobble, giving a 2D signed distance field (jump-flood on the GPU at 512²).
2. **Mesh:** a two-sided inflation, `z = ±D·sqrt(1-(1-min(d/R,1))²)`, plus lump noise and stitch pinches at the seam. It's a remeshed grid of about 4k triangles (hero view) or about 800 (map view, LOD).
3. **Material maps for the front and back,** composited in a Worker:
   - albedo from the scanned swatch (Wang-tiled)
   - normal map from the felt fibre scan plus stitch and felt-piece relief
   - roughness
   - sheen mask
   - thread mask
4. **Stitches:** the blanket stitch runs along the seam path by arc length, using scanned thread sprites (8 variants per type) for normals and colour. Satin stitch follows a direction field. Back stitch and French knots go on as relief in the maps; knots get real micro-geometry in the hero LOD.
5. **Raised pieces:** eye discs, the patch and the sun's rays are separate thin inflated meshes (2–4 mm scale), so they self-shadow under any light. The planet ring is a torus-like felt strip.
6. **Shading in the engine:**
   - Three.js `MeshPhysicalMaterial` with sheen (Charlie BRDF) for velvet-like felt.
   - Wrap diffuse for soft fill.
   - Fibre halo via fins (shell edge strips) with strand alpha, so the fuzz silhouette survives any angle.
7. **Outputs:**
   - **(a)** A glTF-style asset (mesh LODs plus a material atlas) for the map.
   - **(b)** A 2D icon rendered from the front view under a neutral rig. At 48px and below it switches to icon mode: a solid rim in the thread colour, eyes scaled up 1.3×, and the patch dropped below 32px.
   - Both are cached in IndexedDB by DNA hash.
8. **Live editing** rebuilds only what changed. A felt swap updates the material only; a shape change rebuilds the distance field and mesh in under 30 ms.

**Material kit capture:**
- **Rig:** a photometric-stereo rig with a colour checker.
- **Captures:** 24 felt swatches per collection (albedo and height), thread in 8 colours × 5 stitch types × 8 variants, and French knots.
- **Delivery:** about 3 MB of AVIF/KTX2, lazy-loaded.

## 6. Randomizer
- **Pure function** `generate(profile, existingParts, seed) → DNA`. It's a weighted grammar plus a rule linter that resamples until every rule passes.
- **Taste rules:**
  - Patch felt contrasts with the body (ΔL ≥ 0.15 or Δhue ≥ 60°).
  - Thread follows the collection's logic.
  - The patch stays out of the eye and mouth zones.
  - Only whitelisted eye-and-mouth pairs (arc + smile = content, arc + frown = sad, line + none = stern, button + o = startled). Contradictions such as wink + frown are blocked.
  - Small bodies get knot eyes.
  - The sun is used only for the Self.
- **Uniqueness rules within one user's set:**
  - No template repeats until all 12 are used, with a maximum of 2 per template.
  - Pairwise felt colour difference ΔE ≥ 12.
  - No more than 3 characters share an eye style.
  - Size follows role.
- **Psychology-aware defaults.** These are soft priors and the user can override everything. Axes are 0–100 in the codebase and mapped to −1…+1 here.

  | Signal | Default |
  |---|---|
  | Role | Manager → square, pentagon, triangle, pill · Firefighter → flower, frog, bean, comet patch · Exile → drop, crescent, cloud, mochi, smaller · Resource → heart, frog, bean · Self → sun |
  | Agency | Active → angular body with a forward lean · Receptive → rounded or cupped body |
  | Temperature | Hot → terracotta, mustard, orange, rose · Cool → teal, blue, sage, lilac |
  | Focus | Other → open eyes with a sideways gaze · Self → downcast or closed arcs |
  | Attachment | Anxious → big button eyes, worried brow · Avoidant → half-lid or knot eyes, gaze away |
  | Unburdened | Earns a stitched gold star (an addition, never a punishment) |

  Burden is not drawn on the body in v1.

- **Modes:**
  - **Surprise:** re-roll every unlocked slot.
  - **Nudge:** small parameter variation only.
  - **Per-slot locks.**

## 7. Customizer UX (mobile-first)
- **Preview:** the character floats alone in an empty, neutral void with the same light model as the map. There's no set dressing, because the scene isn't designed here.
  - One-finger drag rotates it 360° (turntable). Pinch zooms, and double-tap resets to the front view.
  - Idle: a slow breathing squash, a blink every 4–7 s, and eyes that track your finger.
- **Bottom sheet:** six tabs, one per craft step (**Shape · Felt · Thread · Face · Patch · Size & Name**). Each tab is a carousel of real rendered 3D thumbnails.
- **Controls:**
  - Dice to shuffle, with a lock on each tab.
  - Undo and redo.
  - Drag the patch on the body to snap it into one of its allowed zones.
  - Drag the eyes to set gaze, and a lid slider.
- **Delight:**
  - **Sewing reveal:** the outline pieces cut out, the body puffs up as it's stuffed, a needle runs the blanket stitch around the seam in 1.2 s, the patch gets stitched on, then the eyes pop in and blink. There's a haptic tick per stitch.
  - Tapping makes it squish (scale 0.94 with a spring).
- **Exit:** "Save" returns the DNA and the asset to the caller (the map handles placement on the axes). The randomizer also runs headless when parts are created from assessment results.

## 8. Integration (minimal, customizer only)
- **Data model:** replace `PartLook` and `CustomPart.look` (`src/app/features/landing/stickers.ts:150-163`) with `FeltDNA`. Migrate `INNERVERSE_PART_LOOKS_V1` and `INNERVERSE_CUSTOM_PARTS_V1` to V2, and give the 18 parts in `IV_PARTS` (`stickers.ts:39`) hand-tuned default DNA.
- **New module `src/app/core/felt/`:** `dna.ts`, `generator.ts`, `lint.ts`, `builder/` (Worker: distance field, mesh, maps), `cache.ts`, `kit/`.
- **Public API:**
  - `generate()`
  - `buildAsset(dna, lod) → {meshes, materials}`
  - `renderIcon(dna, px) → ImageBitmap`
  - `<felt-customizer>` component, which emits the DNA on save.
- **Persistence:** the DNA (under 1 KB) is stored on the part in Firestore, with rules and their spec updated.

## 9. Acceptance criteria
| Area | Target |
|---|---|
| **Fidelity (the 10/10 test)** | Blind A/B of our turntable render vs a turntable video of the real sewn twin under matched light, with n ≥ 30 viewers: correct identification ≤ 60% |
| Any angle | Back, side and three-quarter views each pass a designer review with no broken silhouette, no missing fuzz, and the seam stitch continuous all the way round |
| Generator quality | 0 lint violations in 10k samples; ≥ 95% of 200 random samples rated "on-model and charming" by 3 designers |
| Readability | The 12 bodies are identified correctly ≥ 90% at 16px (icon) and at 48px on screen in 3D from a random angle |
| Performance (2022 mid-range phone) | Full build ≤ 120 ms in the Worker · live edits at 60 fps · map LOD of 18 characters ≤ 2 ms GPU · kit ≤ 3 MB |
| Speed | Median time to a finished first custom part < 60 s |

## 10. Milestones
| # | Milestone | Exit criterion |
|---|---|---|
| M0 | Material kit capture and 3 physical reference characters | Calibrated kit |
| M1 | Body: distance field, inflated mesh, felt material, seam stitch | Body-only A/B ≤ 65% |
| M2 | Eyes, mouths, patches, sun, all 12 templates, LODs, icon mode | Full A/B ≤ 60% |
| M3 | DNA, randomizer and linter, with unit tests | 10k-sample lint is clean |
| M4 | Customizer UI, sewing reveal, persistence and migration | 5-user test, all < 60 s |
| M5 | Final blind test and polish | All §9 targets met |

## 11. Risks and open questions
| Risk | Mitigation |
|---|---|
| Capture quality drives everything | Hire a product photographer and a felt maker for M0 |
| Over-perfect symmetry looks fake | Mandatory seeded jitter, enforced by the linter |
| Fuzz cost at many instances | Use fins only in the hero LOD; the map LOD uses a rim-sheen approximation |

**Open questions:**
- Default collection: Wool or Bright? (Recommend Wool.)
- Should the back be plain, or carry a stitched initial?
- Should burden ever be visible?
