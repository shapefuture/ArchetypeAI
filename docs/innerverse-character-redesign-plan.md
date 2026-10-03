# Innerverse — Character Redesign Plan (one character, several looks)

Status: plan only. No 3D built yet. The old look is dropped entirely.
Test character: **The Critic**. Every look below renders this same part so they can be compared directly.

---

## 0. Diagnosis of the current draft (`ifs.html`, "Clay Atelier")

I rendered it in headless Chromium (orrery + sheet layouts). Problems, starting at the root:

1. **The shapes carry no meaning.** 18 stock primitives (star, heart, moon, mushroom, hexagon) are given to parts at random. A Critic is a pentagon only because someone picked one. The constellation is decoration, not data, so there's nothing to "read".
2. **The faces do all the emotional work.** Kawaii eyes and mouths sit on generic solids, so it reads as a sticker pack and every part feels like the same character in a new costume.
3. **It breaks your own rule.** There are arm and leg stubs (`arm`, `armMode`, `leg`).
4. **No value hierarchy.** Mid-value pastels on a mid-value beige-purple haze. Nothing pops, the Self doesn't glow, and exiles don't recede; they just look muddy.
5. **The material doesn't hold up at app size.** Felt fuzz and dents vanish below about 120px, so the 2D icon and the 3D creature become two different objects.
6. **Every part is the same weight.** 29 bodies at nearly the same scale and saturation give the eye no entry point.
7. **The system is broken.** Labels overlap, the Sheet layout collides, it runs at about 20 fps, and the fonts load from a CDN and fall back to Times.
8. **It ignores the real data model.** It uses ring/angle/height around the Self instead of the four axes.

Score agreed: about 1/10 as a visual identity. The rendering tech is fine; the design idea is what's missing.

---

## 1. First principles

What a part actually is: **a strategy, with a direction of energy, a temperature, a target and a boundary, sometimes carrying a burden.** It is not a person, so no limbs. It is closer to an organism or an object with intent.

Design invariants that apply to every look:

| # | Rule | Why |
|---|------|-----|
| I1 | **Silhouette first.** Each part is defined as a 2D outline (a "glyph"). The 3D body is that outline *inflated* (Monster Mash / Teddy-style inflation, SIGGRAPH). | 2D and 3D read the same by construction, not by luck. |
| I2 | **Axes become form, not labels.** Each of the four axes drives one *separate* visual channel. | The constellation becomes readable at a glance. |
| I3 | **Eyes are the only face.** Two flat discs (with lids, highlight and gaze), applied as decals. No mouth by default; mouth is an optional accessory. | Matches the refs (beret, bowtie, glasses blobs), stays 2D-readable, and avoids "costume on a solid". |
| I4 | **One prop at most** (beret, bow, glasses, sprout, star…). | The props in the refs are memorable because there's only one. |
| I5 | **The burden is visible inside the body** (an inclusion, a knot, a stone). | Unburdening becomes a literal, beautiful moment: the inclusion is released. That's the IFS ritual turned into an animation. |
| I6 | **The user owns hue; the system owns lightness and chroma.** Pick hue freely; lightness and chroma come from role (OKLCH). | Every user's constellation looks unique, but never ugly or muddy. |
| I7 | **Expression comes from whole-body deformation** (lean, squash, bristle, shrink, pulse) plus eyelids. | This replaces arms and hands. |

### Axis → channel mapping (the core grammar)

| Axis | −1 pole | +1 pole | Channel | 2D read | 3D read |
|---|---|---|---|---|---|
| **AGENCY** | Active | Receptive | **Silhouette curvature** | Convex, pointed, leaning "prow" ↔ concave, cupped, bowl-like opening | Same, plus forward lean ↔ settled base |
| **TEMPERATURE** | Cool | Hot | **Surface and rhythm** | Smooth edge, cool hue band ↔ bristled or crinkled edge, warm band | Matte and slow breathing ↔ glowing or translucent with fast pulse |
| **FOCUS** | Self | Other | **Gaze and reach** | Eyes low or closed, facing inward ↔ eyes high and wide, plus a feeler or tendril pointing outward | Gaze turns toward Self or toward neighbouring parts (live) |
| **ATTACHMENT** | Avoidant | Anxious | **Boundary** | Thick hard rim or shell ↔ soft frayed edge with clinging satellites | Shell thickness and gap ↔ halo of tiny orbiting bits that cling to neighbours |

Role (Self / Manager / Firefighter / Exile) is a secondary layer: Managers get a flat "plate" base (they hold things up), Firefighters get a flare (they ignite), Exiles sit *inside* a cocoon or shell (they are kept away), and the Self is the only part that emits light.
**Burden** = size and opacity of the internal inclusion.

### The Critic's parameters (test case)
AGENCY −0.7 (active) · TEMPERATURE +0.5 (hot) · FOCUS −0.6 (aimed at self) · ATTACHMENT +0.4 (anxious about rejection) · role Manager · burden 0.82.
Expected read: a leaning, pointed form with a crinkled, warm edge and narrowed eyes looking down at itself, a soft clinging fringe, a plate base, and a dense dark knot inside.

---

## 2. TRIZ contradictions, resolved

| Contradiction | TRIZ principle | Resolution |
|---|---|---|
| Rich 3D vs crisp 2D icon | #10 Prior action | Author in 2D, derive 3D by inflation. The icon *is* the cross-section. |
| Unique per user vs coherent system | #6 Universality | Fixed grammar with free parameters. Hue is free; lightness and chroma are locked per role. |
| Expressive vs no limbs | #17 Another dimension | Expression moves into body deformation, the boundary and gaze. |
| Many parts on screen vs 60 fps on phones | #2 Taking out | Raymarch only the focused hero. All other parts use pre-baked impostor sprites from the same renderer. |
| Painful content vs a friendly app | #13 The other way round | Pain is not drawn on the face. It's held *inside* a beautiful body, so unburdening reads as a gift. |
| Static icon vs living creature | #15 Dynamics | Every look has an idle "breath" whose frequency equals TEMPERATURE. |

---

## 3. The looks (all applied to The Critic)

Each look is a complete material, motion and lighting language over the *same* glyph and axis grammar. Swapping looks never changes what a part means.

### Look A — "Wagashi" (flocked confection)
- **Idea:** Japanese nerikiri sweets, plus the velvet flock from your refs 2–4. Dense, soft, edible-looking.
- **Material:** flocked velvet (Charlie/Estevez sheen BRDF plus a short-fibre shell rim), a dusting of sugar grain, saturated mid-high lightness.
- **The Critic:** a leaning teardrop prow with a pinched, crinkled pastry-like edge (hot), sharp lower lids, and a kuromitsu-dark knot visible as a darker bruise under the velvet.
- **Motion:** jelly-free; slow "settling" squash on landing.
- **Scene:** pale gradient studio and soft contact shadows (closest to the Duolingo / Netmarble references).
- **Strength:** safest. Instantly lovable and the most marketable.
- **Risk:** the closest to existing work. Distinction has to come from the axis grammar.

### Look B — "Akari" (paper lantern, lit from within)
- **Idea:** Noguchi Akari lamps and washi paper. The part is a translucent skin, and **its light is its Self-energy.**
- **Material:** thin-shell translucency with visible paper fibre and ribs (the ribs follow the glyph contours). A warm internal point light. The burden is a *shadow object* cast on the skin from inside.
- **The Critic:** a sharp, leaning lantern with crumpled hot paper at the edge and a dark object inside that throws a heavy shadow on its own wall. Unburdening = the shadow lifts and the lantern brightens.
- **Scene:** a dark night cosmos where every part is a light source and the constellation literally glows. The Self is the brightest lantern.
- **2D:** a backlit silhouette with rib lines, gorgeous as an icon.
- **Strength:** the most original and the most *meaningful* (light = Self energy). Best fit for a "cosmos". **Top pick for distinctiveness.**

### Look C — "Hepworth" (pierced stone and glazed ceramic)
- **Idea:** Barbara Hepworth and Noguchi stones, sea-pebbles, reactive glaze.
- **Material:** matte stone body with a pooling glaze that drips toward the ground (gravity sells 3D). Agency is shown through a **pierced hole**: receptive parts have a deep opening, active parts are solid and keeled.
- **The Critic:** a keeled, honed blade-pebble with a crackle glaze where it's hot. The burden is a dark mineral vein inside, seen through a polished window.
- **Scene:** a museum plinth or tabletop and a raking key light.
- **Strength:** adult and calm, therapist-credible, the furthest from "kawaii app".
- **Risk:** less playful, so the eyes have to carry the warmth.

### Look D — "Radiolaria" (glass paperweight organism)
- **Idea:** radiolarians and diatoms (Haeckel), plus millefiori glass paperweights.
- **Material:** clear glass shell (refraction and caustics) around a coloured core creature. Attachment **= shell thickness** (avoidant = thick, isolating glass; anxious = thin, almost-burst membrane with spicules reaching out).
- **The Critic:** a spiky, hot-orange core pressing against a thin, faceted glass shell with spicules aimed inward (self-focused). The burden is a cloudy smoke swirl in the glass.
- **Scene:** deep blue-black, caustic light pooling on a ground plane.
- **Strength:** the highest "SIGGRAPH wow" (refraction, dispersion, caustics).
- **Risk:** the heaviest render. Needs impostors and only works for a hero view on phones.

### Look E — "Gummi" (translucent jelly, physical wobble)
- **Idea:** gummy candy and Haribo meets soft-body sim. The most Duolingo-viral.
- **Material:** subsurface-scattered jelly with sugar crystals on the surface and a visible inner suspended "burden" bead. Real wobble (spring-mass on the SDF) when touched.
- **The Critic:** a stiff, angular gummy that wobbles *less* (managers resist), with a hot red-orange interior glow and squinting decal eyes.
- **Scene:** bright saturated studio and coloured shadows.
- **Strength:** the most tactile. Poking parts becomes the core delight loop.
- **Risk:** the most toy-like and the least serious.

### Look F — "Riso Pop-up" (2D-first, layered paper)
- **Idea:** risograph print overprint plus a pop-up book. Designed as true 2D and extruded into 3D as stacked paper layers.
- **Material:** 2–3 spot colours with misregistration, halftone grain, paper edges with thickness, cast shadows between layers.
- **The Critic:** a stacked layer silhouette, with the hot edge as a fluorescent-pink overprint and the burden as a dark inner layer you can peel out.
- **Scene:** cream paper cosmos with a layered parallax depth.
- **Strength:** the cheapest to render (60 fps everywhere), perfect 2D/3D parity, a strong graphic identity, and great for shareable cards.
- **Risk:** less "3D wow". Depth comes from layering, not sculpture.

### Look G (wildcard) — "Yarn" (knitted organism)
- **Idea:** a knitted or felted-wool body. **Relationships between parts are literal yarn strands** connecting them across the cosmos, and the burden is a tangled knot inside.
- **The Critic:** tight, small stitches (control), a frayed and unravelling edge (anxious), and a tight dark knot inside.
- **Strength:** the strongest metaphor for a *system* (tangles = polarisations, untangling = therapy progress).
- **Risk:** knit detail is expensive and hard to read at 48px, so it needs a simplified 2D icon.

---

## 4. Customization model (the same in every look)

`Part = Glyph × Edge × Eyes × Prop × Hue × Look`

- **Glyph**: a superformula / 2D-SDF outline with about 6 sliders (convexity, lean, point count, cup depth, aspect, asymmetry). Axis values set the defaults, and the user can push them, but the axis channel stays visible.
- **Edge**: smooth / crinkle / bristle / fringe / rim, driven by TEMPERATURE and ATTACHMENT.
- **Eyes**: one family of decal eyes with lid shapes (calm, narrow, wide, closed, sideways, teary) and live gaze.
- **Prop**: a library of single props, one per part.
- **Hue**: free, using OKLCH with lightness and chroma locked per role.
- **Look**: a global theme (A–G), or per-constellation.
All parts serialize to a small JSON (about 20 numbers), so you can share them, trade them, and render the same part on the server as a PNG.

---

## 5. How to judge the looks (before any full scene)

For each look, render The Critic plus two contrast parts (a receptive, cool, avoidant Exile, and the Self):

1. **Silhouette test:** solid black fill at 32px. Can you tell the three apart?
2. **Axis blind test:** show 5 people the Critic and ask "active or receptive? hot or cool?" Aim for at least 80% correct.
3. **2D↔3D parity:** the icon and the 3D turntable side by side should feel like the same object.
4. **Squint test:** the Self must be the brightest thing, and Exiles must recede.
5. **Customization stress test:** randomize 30 parts. Are any combinations ugly? The goal is zero.
6. **Performance:** hero at 60 fps on a mid-range phone, and impostors for 30 parts.
7. **Emotion:** does unburdening the Critic feel like something happened?

---

## 6. Suggested next step

1. Pick 3 looks to prototype. My recommendation: **B Akari** (most distinctive and meaningful), **A Wagashi** (safest and most lovable), and **F Riso Pop-up** (most practical and the best 2D). D Radiolaria is an optional "hero mode" layer on top of whichever wins.
2. Build one single-character lab page: The Critic on a turntable, with a look switcher, the 4 axis sliders live-morphing the glyph, its 2D icon beside it, and the unburden animation.
3. Run the section 5 tests, pick the winner, and only then design the cosmos.
