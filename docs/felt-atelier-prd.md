# PRD — Felt Atelier: Character Generator & Customizer

Owner: Innerverse · Status: Draft v1 · Style lock: handmade appliqué felt (refs: generated "felt lineup" images 9 and 10)

---

## 1. End in mind
Every user sews their own inner family: **18 felt characters that look like a real handmade felt set photographed on a white table**, and nobody else has the same set. Each character is generated in about one second, customised in under a minute, and used everywhere: 16px chips, cards, the editor, share stickers and the 3D cosmos.

**The 10/10 bar:** in a blind test, people cannot tell our render from a photo of real sewn felt (§10).

## 2. First-principles decisions
| # | Decision | Why |
|---|---|---|
| D1 | **Model the craft, not the picture.** A character is assembled the way a maker sews it: cut body, stuff it, blanket-stitch the edge, add felt eyes or embroidery, stitch on one patch. Every customizer slot is one craft step. | The craft is already modular, so we get fidelity and interchangeability for free. |
| D2 | **Real material atoms, procedural assembly.** Photograph real felt swatches, real thread stitches and real French knots. Use code only to *place, light and jitter* them. | Procedural noise never looks like wool. Photos of wool do. |
| D3 | **Ground truth = real sewn felt, not AI images.** Commission 12 physical characters, sewn from our own specs, and photograph them in our capture rig. | AI references contain artifacts and drift. Real felt is the only honest 10/10. |
| D4 | **A finite felt swatch library, with no colour wheel.** | Real felt comes in fixed colours. Curated swatches make ugly or unreal results impossible. |
| D5 | **One DNA → every output.** The same ~30-field JSON renders the 2D icon, the hero image, the share sticker and the 3D pillow. | Consistency and determinism. Tiny to store and sync. |
| D6 | **Appliqué is 2.5D by nature.** The 3D body is the 2D height field turned into a pillow mesh. No cloth simulation. | It's physically correct for flat plush, and cheap. |

## 3. Fidelity spec (from forensic read of the target images)

**Layers, back to front:**
1. Background fabric
2. Soft contact shadow
3. Body pillow
4. Blanket-stitch rim
5. Patch felt piece and its stitches
6. Eye felt pieces (white disc, then pupil) or embroidery
7. Mouth embroidery

**Proportions** (fractions of body width W):

| Element | Spec |
|---|---|
| Pillow | Visual thickness 12–18% W, domed and slightly lumpy (low-frequency 3% height noise), soft rounded edge |
| Blanket stitch | Spacing 4.5–5.5% W (±12% jitter), tick length 3–4% W (±10%) set perpendicular inward (±5°), thread width 0.9–1.2% W, loop line riding over the rim, a small dimple where each stitch enters the felt |
| Button eyes | White felt disc 15–20% W, black pupil 50–65% of the disc, pupil offset gives gaze |
| French-knot eyes | 5–7% W, raised bumps with a highlight |
| Eye layout | Gap 28–45% W, eye line 35–50% from the top |
| Mouth | 6–12% W back-stitch, present on about 40% of characters |
| Patch | 18–28% W, its own mini-pillow (30% of body height) and its own stitch, placed in the side or lower quadrant, never touching eyes or mouth |
| Shadow | Offset down-right 2–3% W, blur 6–8% W, opacity 25–35% |
| Set | Sizes vary 0.75–1.25×; each character is rotated ±4° on the table |

**Realness cues** (all mandatory, seeded per character):
1. Irregular stitch spacing and angle.
2. An edge pinch at every stitch.
3. A fibre halo extending 0.5–1% W beyond the silhouette.
4. Heathered colour variation and pilling specks.
5. Hand-cut asymmetry (low-frequency outline wobble of ±1.5% W).
6. Uneven stuffing.
7. Plied thread texture with a soft sheen.
8. Felt-on-felt cut edges with micro-shadows.
9. Raised French knots.
10. Directional satin-stitch sheen.
11. Visible weave in the table fabric.
12. One consistent soft daylight key light from the top-left.

**Two collections:**
- **Wool** (default, from image 10): heathered, muted palette (mustard, sage, terracotta, dusty rose, lilac, teal, forest), with tone-on-tone thread (+0.12 OKLCH lightness).
- **Bright** (from image 9): flat acrylic felt in vivid colours with cream contrast thread.

**Do not copy from the AI images:**
- unintended mismatched eyes
- a patch placed on the sun's face
- random two-tone bodies
- mixed thread logic within one set
- smiles on every character

## 4. Character DNA (v1)
```jsonc
{
  "v": 1, "render": 1, "seed": 2954118231,
  "collection": "wool",                         // wool | bright
  "body":  { "t": "bean", "w": 1.0, "h": 1.05, "lean": -0.2, "lobes": null, "wobble": 0.6 },
  "felt":  "wool.sage",                         // swatch id (library of ~24 per collection)
  "thread":"tone",                              // tone | cream | swatch id
  "eyes":  { "style": "button", "size": 1.0, "gap": 0.5, "y": 0.45,
             "gaze": [0.3, 0.0], "lid": 0.0, "brow": "none" },
  "mouth": { "style": "none" },                 // none|smile|frown|o|line|wobble|smirk
  "patch": { "t": "moon", "felt": "wool.gold", "zone": 2, "rot": -12, "scale": 1.0 },
  "extra": { "seam": false, "knots": 0 },       // optional details: centre seam, freckle knots
  "size":  0.95,
  "earned": []                                  // e.g. ["star"] after unburdening
}
```
- **Bodies (12):** cloud, frog-lump, rounded triangle, heart, bean, teardrop, crescent, rounded square, five-lobed flower, mochi, pentagon, pill.
- **`sun`** is a 13th body reserved for the Self (layered rays, one per constellation).
- **Eyes:** button (white disc plus pupil), knot, oval-side (sideways glance), arc (closed), lash-arc, line (stern), half-lid (button with a felt lid), wink.
- **Patches:** ringed planet, crescent moon, star, comet, orbit loop, constellation (straight stitches plus knots), none.
- **Templates are authored, not formula-generated.** A designer draws each body as a vector, with parameter ranges and anchor zones (eye zone, mouth anchor, 3–4 patch zones).
- **Determinism:** `hash(DNA)` gives both the cache key and the PRNG seed. The `render` field pins the renderer version so old characters never change.

## 5. Rendering pipeline
**Chosen approach:** a material kit plus procedural sewing, as a WebGL2 2D layered compositor running in a Worker with OffscreenCanvas.

**Rejected approaches:**
| Approach | Why rejected |
|---|---|
| Pure procedural | Fails realness cues 3, 4 and 7 |
| Full 3D cloth simulation | Cost and weight with no visible gain |
| AI image per character | Inconsistent, slow and costly, and can't be edited live. Allowed later only as an optional "glamour" pass for share cards (img2img on top of our render). |

**Pipeline steps:**
1. **Outline:** template path, plus parameters, plus seeded low-frequency wobble.
2. **Distance field:** jump-flood on the GPU at 512².
3. **Height:** `h = H·sqrt(1-(1-min(d/R,1))²)` plus lump noise plus stitch dimples.
4. **Normals** from the height field.
5. **Lighting:** a soft key light from the top-left (35° elevation) with wrap diffuse, cavity AO from height, and a contact shadow made from blurred, offset alpha.
6. **Felt:** albedo is the photographed swatch (tiled with Wang tiles to avoid repetition), with a fibre normal map and a stray-fibre halo of sprite strands along the silhouette.
7. **Stitches:**
   - Blanket stitch: arc-length sampling along the rim, perpendicular tick sprites and loop segments drawn from photographed thread variants (8 per type), tinted per thread swatch.
   - Satin stitch: parallel strands following a direction field.
   - Back stitch: segments of about 2.5% W.
   - French knots: instanced bump sprites.
8. **Felt pieces** (eyes, patch, sun rays): each is a mini-pillow that repeats steps 2–6.
9. **Outputs:**
   - Hero render at 1024² and UI renders at 512², cached in IndexedDB by DNA hash.
   - **Icon mode** at 48px and below: stitches collapse to a solid rim line in the thread colour, eyes scale up 1.3×, and the patch is dropped below 32px.
   - **3D:** a front height-mapped grid plus a softer plain-felt back, joined by a stitched seam ring. Thickness is 15% W. It uses the baked albedo and normal textures in an atlas and is instanced into the Three.js cosmos.
10. **Live editing** re-composites only the layers that changed.

**Material kit capture:**
- **Rig:** a 4-light photometric-stereo rig plus one daylight key light, with a colour checker.
- **Captures:** 24 felt swatches per collection (albedo and height), thread in 8 colours × 5 stitch types × 8 variants, a background fabric, and French knots.
- **Delivery:** about 3 MB of AVIF/KTX2, lazy-loaded and cached by the service worker.

## 6. Random generator
- **Pure function** `generate(profile, constellation, seed) → DNA`. It's a weighted grammar plus a rule linter. It rejects and resamples until every rule passes, then returns the DNA.
- **Taste rules:**
  - Patch felt contrasts with the body (ΔL ≥ 0.15 or Δhue ≥ 60°).
  - Thread follows the collection's logic.
  - The patch never overlaps the eye or mouth zones (polygon test).
  - Only whitelisted eye-and-mouth pairs (e.g. arc + smile = content, arc + frown = sad, line + none = stern, button + o = startled). Conflicting pairs are blocked (e.g. wink + frown).
  - Small bodies get knot eyes, not buttons.
  - The sun is used only for the Self.
- **Constellation rules:**
  - No body template repeats until all 12 are used, with a maximum of 2 per template.
  - Pairwise felt colour difference ΔE ≥ 12.
  - No more than 3 characters share an eye style.
  - The size distribution follows role.
  - Result: two users' sets are effectively never alike.
- **Psychology-aware defaults.** These are soft priors and the user can always override them. The codebase stores axes as 0–100; they're mapped to −1…+1 here.

  | Signal | Default |
  |---|---|
  | Role | Manager → square, pentagon, triangle, pill · Firefighter → flower, frog, bean, comet patch · Exile → drop, crescent, cloud, mochi, smaller · Resource → heart, frog, bean · Self → sun |
  | Agency | Active → angular bodies with a forward lean · Receptive → rounded or cupped bodies |
  | Temperature | Hot → terracotta, mustard, orange, rose · Cool → teal, blue, sage, lilac |
  | Focus | Other → open eyes with a sideways gaze · Self → downcast or closed arcs |
  | Attachment | Anxious → big button eyes, worried brow · Avoidant → half-lid or small knot eyes, gaze away |
  | Unburdened | Earns a gold stitched star (an addition, never a punishment) |

  Burden is not drawn on the body in v1, to avoid stigma.

- **Shuffle modes:**
  - **Surprise:** every unlocked slot is re-rolled.
  - **Nudge:** small parameter variation only.
  - **Per-slot locks**, like Mii or Spore.

## 7. Customizer UX (mobile-first)
- **Layout:** a live preview on a felt table in the top 55% of the screen. A bottom sheet below has six tabs, one per craft step: **Shape · Felt · Thread · Face · Patch · Size & Name**. Each tab is a carousel of real rendered thumbnails.
- **Controls:**
  - A dice button for shuffle, and a lock on each tab.
  - Undo and redo.
  - Drag the patch to snap it into one of its allowed zones.
  - Gaze and lid can be set by dragging the eyes.
- **Delight:**
  - **Sewing reveal:** a needle traces the blanket stitch (1.2 s), the patch gets stitched on, then the eyes pop in and blink. There's a light haptic tick per stitch.
  - Tapping the character makes it squish (scaleY 0.94 with a spring).
  - It blinks every 4–7 s at idle, and its gaze follows your finger.
- **Entry points:**
  - After the assessment, parts arrive already sewn by the generator, with a "Re-sew" option.
  - "+ New part".
  - The edit button on any part card.
- **Sharing:**
  - A transparent PNG sticker with the felt shadow.
  - A **family flat-lay**: the whole constellation arranged like the reference photo, as the viral share card.

## 8. Integration (current codebase)
- **Data model:** replace `PartLook {shape,color,eye,mouth}` and `CustomPart.look` (`src/app/features/landing/stickers.ts:150-163`) with `FeltDNA`. Migrate the localStorage keys `INNERVERSE_PART_LOOKS_V1` and `INNERVERSE_CUSTOM_PARTS_V1` to V2, mapping old shape/eye/mouth values to the nearest template.
- **Default roster:** each of the 18 parts in `IV_PARTS` (`stickers.ts:39`) gets a hand-tuned default DNA.
- **New module `src/app/core/felt/`:**
  - `dna.ts`: schema, validation, hash
  - `generator.ts`: pure and seeded
  - `lint.ts`: the taste rules
  - `renderer/`: the Worker compositor
  - `cache.ts`: IndexedDB
  - `kit/`: the asset manifest
- **3D:** `src/services/webxr.service.ts` (Three r183) swaps the current part spheres and stickers for instanced pillow meshes using the baked atlas.
- **Persistence:**
  - Firestore stores the DNA on the part document (under 1 KB). Update `firestore.rules` and `firestore.rules.spec.ts` with field and size validation.
  - The service worker (`src/sw.js`) and `_headers` cache the kit assets.

## 9. Non-functional requirements
- **Performance** (2022 mid-range phone):

  | Target | Budget |
  |---|---|
  | 512² render in the Worker | ≤ 25 ms |
  | Customizer interaction | 60 fps |
  | Cosmos with 18 pillows | ≤ 2 ms GPU |
  | Kit download | ≤ 3 MB, lazy |
  | Time to first character | ≤ 1.5 s on a cold cache |

- **Accessibility:**
  - Swatches have spoken names ("sage wool").
  - Alt text is generated from the DNA ("a sage bean with sleepy eyes and a moon patch").
  - Reduced motion skips the sewing animation.
  - Role is never shown by colour alone.
- **Offline:** generation and editing work fully offline once the kit is cached.
- **Safety:** no free text on the body in v1. Names stay private to the user.

## 10. Acceptance criteria and metrics
| Area | Target |
|---|---|
| **Fidelity (the 10/10 test)** | Blind A/B of our render vs a photo of the real sewn twin, with n ≥ 30 viewers: "which is the photo?" is answered correctly ≤ 60% of the time (chance is 50%) |
| Generator quality | 0 rule violations across 10k samples; ≥ 95% of 200 random samples rated "on-model and charming" by 3 designers |
| Readability | At 16px, the 12 silhouettes are identified correctly ≥ 90% of the time |
| Speed | Median time to a finished first custom part < 60 s |
| Product | ≥ 60% of users customise at least one part, share-card rate, and D7 retention uplift vs the current stickers |

## 11. Milestones
| # | Milestone | Exit criterion |
|---|---|---|
| M0 | Capture rig, material kit, 3 physical reference characters | Calibrated kit in the repo |
| M1 | Renderer core: body, pillow, felt, blanket stitch | Body-only A/B ≤ 65% |
| M2 | Face, patches, sun, all 12 templates, icon mode | Full A/B ≤ 60% |
| M3 | DNA, generator and linter, with unit tests | 10k-sample lint is clean |
| M4 | Customizer UI, delight, persistence and migration | Usability test of 5 users, all < 60 s |
| M5 | 3D pillows in the cosmos and share cards | Performance budget met |
| M6 | Final blind test and polish | All §10 targets met |

## 12. Risks and open questions
| Risk | Mitigation |
|---|---|
| Capture quality drives everything | Hire a product photographer and a felt maker for M0 |
| Over-perfect symmetry looks fake | Mandatory seeded jitter; the linter flags a jitter of zero |
| Kit weight | AVIF, lazy loading, and icon mode needs only about 300 KB |
| Too many slots dilute appeal | Keep v1 to 6 tabs and add new slots only if testing shows they're needed |

**Open questions:**
- Default collection: Wool or Bright? (Recommend Wool.)
- Should burden ever be visible on the body?
- Should a paid tier unlock extra swatches and patches?
