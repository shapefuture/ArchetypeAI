# Innerverse — Visualisation Plan: C1 Eclipse · C2 Phase · C4 Nebula · C6 Planet/Star

Status: plan only, nothing built. Companion to `innerverse-character-redesign-plan.md` (v2, cosmic ontology).
Scope: **one character at a time** (test part: The Critic) in a single lab page. The full cosmos comes later.

---

## 0. Shared foundation (built once, used by all four concepts)

### 0.1 Part schema (about 25 numbers; serialisable and shareable)
```json
{
  "id": "critic", "name": "The Critic", "role": "manager",
  "axes": { "agency": -0.7, "temperature": 0.5, "focus": -0.6, "attachment": 0.4 },
  "glyph": { "convex": 0.7, "lean": 0.6, "points": 3, "cup": 0.1, "asym": 0.4, "aspect": 1.1, "seed": 17 },
  "hue": 18, "burden": 0.82, "mood": "stern", "blend": 0.0,
  "form": "planet", "satellites": 2,
  "concept": "phase"
}
```

### 0.2 The glyph (single source of truth for 2D and 3D)
- **2D SDF** built from a superformula outline (points, convexity) with smooth-union bumps (asymmetry), bent by `lean` and dented by `cup` (concavity, for receptive parts).
- **2D export:** marching squares over the SDF produces an SVG path. That path is the app icon, the chip, the share card and the sticker. The 2D asset comes from the same function as the 3D body.
- **3D "inflation":** the extrusion height follows the 2D distance, `h(x,y) = k·sqrt(max(-d2(x,y),0))`, which gives a pillow-like body that is the glyph seen from the front (Monster-Mash-style). It's raymarched as an SDF, so concepts can add surface detail on top.
- **Eye ports:** two anchor points on the glyph (position, size, lid). Every concept renders eyes *through physics* at these anchors: beads, crater lakes, embedded stars or sunspots.

### 0.3 Light and image pipeline
- **One light: the Self.** It's a draggable point or area light. Every other light in the scene must be justified by physics (emission from a star or nebula).
- **Background:** near-black `#05060A`, a very sparse dust layer and no wallpaper starfield. Empty space is part of the look.
- **HDR:** RGBA16F, AgX tonemap, a physically-shaped bloom (multi-scale, energy-conserving), and a star PSF with 4- or 6-point diffraction spikes (consistent across concepts).
- **AA:** TAA with blue-noise jitter, plus Halton accumulation in photo mode.

### 0.4 Lab page layout (one HTML file, WebGL2)
```
┌───────────────────────────── hero viewport (raymarched) ─────────────────────────────┐
│                         The Critic, turntable / free orbit                           │
│                         drag Self-light · drag part to blend                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
[ Eclipse | Phase | Nebula | Planet/Star ]   [ 2D icon 128 · 64 · 32 · 16 ]   [ contrast: Self · Unseen exile ]
[ axis sliders ×4 ]  [ glyph sliders ×7 ]  [ mood ▾ ]  [ burden ▬ ]  [ Unburden ]  [ Blend ▬ ]  [ PNG / SVG ]
```
- **Contrast strip:** the same concept rendered for the Self and The Unseen One (receptive, cool, avoidant exile), so you can judge range and not just one portrait.
- **2D strip:** the SVG icon at four sizes, side by side with the 3D, for the parity check.

### 0.5 Shared state machine (every concept implements these states)
`idle` (breathing at a rate set by temperature) · `noticed` (eyes find the user, slight approach) · `blending` (overlaps the Self) · `unblending` · `unburdening` (a one-time cinematic, 3–5 s) · `unburdened` (permanent new appearance).

### 0.6 Performance budget
- **Hero:** raymarched at 0.6–0.75× resolution plus TAA. The target is 60 fps on a 2022 mid-range phone and 120 fps on desktop.
- **Non-hero parts** (contrast strip and later the cosmos): **impostors baked from the same renderer** (a 16-view billboard atlas per part, re-baked when the part changes).
- **Volumetrics** (C4) are hero-only at ½ resolution with a 64³ precomputed noise texture.

---

## C1 — Eclipse

**Ontology:** the Self is a sun. A part is a dark body with a corona. Blending = eclipsing the Self.

### Layers (back to front)
1. **Sun (Self):** a disc with limb darkening, slow granulation (Voronoi plus fbm), a thin chromosphere ring and a warm gold-white spectrum.
2. **Occluder (the part):** the inflated glyph, nearly black, with a faint "earthshine" bounce so its 3D form stays readable when you orbit it.
3. **Corona:** computed in **screen space from the projected glyph SDF**, so it's cheap. Density is `exp(-dist/scale)` times angular streamer noise aligned radially, plus field-line curl.
   - **Manager:** regular, symmetric helmet streamers (an orderly, solar-minimum corona).
   - **Firefighter:** prominence loops (torus-segment SDFs) and sudden flares, with the flare rate set by temperature.
   - **Exile:** a faint, thin, broken rim.
4. **Baily's-bead eyes:** two small notches at the glyph's eye ports. Sunlight leaks through them as two hot beads with diffraction spikes. **Eyelid = notch aperture**, animated: a narrow aperture is a glare and a closed one is a blink.
5. **Burden:** an absorbing dark clump trapped in the corona on one side, choking the streamers there.

### Behaviour
- **Blend:** dragging the part over the sun increases `blend` (overlap fraction). The global exposure dims, ambient desaturates, the corona intensifies and the UI reads "Critic is 70% blended". Releasing it springs back.
- **Unburden:** the dark clump compresses, then a **coronal mass ejection** fires: an expanding turbulent shell of particles leaves the frame, and the corona re-forms symmetric and brighter.

### The Critic in C1
A leaning crescent-shield silhouette, with streamers spiking forward (active and hot) and a sparse, choked back. The bead eyes are narrow slits low on the glyph, looking down at itself. Its burden clump sits behind it.

### 2D icon
A black glyph, a soft rim gradient in the part's hue, and two bright dots. It reads at 16px.

### Done when
Your eye goes straight to the beads as "eyes". The blend gesture is understood without a tooltip. The icon passes at 16px.

---

## C2 — Phase

**Ontology:** a part is a small world lit only by the Self. Mood = phase.

### Body
- The inflated glyph with role-based terrain:
  - **Manager:** terraced plates and cut facets (order).
  - **Firefighter:** volcanic fissures with emissive cracks whose intensity is set by temperature.
  - **Exile:** smooth frosted ice.
  - **Self:** n/a; the Self is the light.
- Craters come from Worley noise, kept sparse so the silhouette stays clean.
- A thin atmosphere rim (a Rayleigh-like falloff) in the user's hue softens the terminator by a few pixels.

### Face
- The **eyes are two crater lakes** at the eye ports, with a specular water BRDF. They glint when lit and go dark on the night side.
- The **terminator is the eyelid.** Each mood sets the part's *orientation relative to the Self* (turning toward or away) and adds a small lid offset:
  - **Full:** open and present.
  - **Gibbous:** curious.
  - **Half:** guarded.
  - **Crescent:** withdrawn or ashamed.
  - **New:** exiled, with eyes visible only as a faint rim glint.
- Moving the Self-light changes every part's expression at once, which is the system reacting to Self-presence.

### Satellites (hands without hands)
- Zero to three moons. The orbit radius and speed come from attachment (anxious = tight and fast, avoidant = wide and slow) and the eccentricity from temperature.
- Moons cast **transit shadows** on the body (analytic sphere occlusion), and the part "holds", "flings" or "hides behind" them as gestures.

### Protection shadow
A manager or firefighter casts a shadow cone *away from the Self*. Anything in that cone (the contrast exile) is darkened. Protection becomes visible as shade.

### Burden and unburden
- The burden is a dark crater lake that never reflects (its albedo is about 0).
- Unburdening: ripples spread, the lake fills with reflected sunlight and becomes a mirror, and a single glint travels to the Self.

### The Critic in C2
A faceted basalt world with a hard terminator cutting both eye-lakes into a squint. Two small moons whip around it in tight, fast orbits. Its shadow cone falls backward over the exile.

### 2D icon
The glyph split into lit and unlit at the mood's phase angle, with two lake dots. This makes an **8-phase icon set** that doubles as a mood picker.

### Done when
Phase reads as emotion without a legend (blind test: crescent = "sad or shy"). The icon set is consistent.

---

## C4 — Nebula Nursery

**Ontology:** a part is a gas cloud with a protostar heart.

### Volume
- **Density:** glyph-shaped (inflated SDF converted to density with a soft falloff), eroded by domain-warped fbm (from a 64³ 3D texture).
- **Ionisation front:** emission is boosted where the density gradient faces the Self-light (photo-evaporation). That gives a **crisp bright rim** on a soft volume, Pillars-of-Creation style, and that rim *is* the silhouette.
- **Two-line palette:** an H-α-like and an O-III-like pair derived from the user's hue (hue and hue+150° in OKLCH), plus dust absorption in a warm brown.
- **Raymarch:** 48–64 steps at ½ resolution, with blue-noise jitter, TAA, and a single-scatter light march of 6 steps toward the Self.

### Heart, jets, eyes
- **The eyes are two embedded young stars** at the eye ports, glowing through the gas. Gas density in front of them works as the eyelid.
- **Active agency:** a bipolar jet (cone emission with Herbig-Haro knots travelling outward). Receptive parts have no jet, just an open diffuse cloud.
- **Focus:** the jet's direction. Other-focused parts fire outward and self-focused parts curl back.

### Burden and unburden
- The burden is a **Bok globule**, a dense, opaque dark sphere sitting over the heart.
- Unburdening: the globule's rim brightens as it photo-evaporates, it shrinks, the heart ignites, and a light-echo ring expands. This is the most cinematic "birth" moment of the four concepts, made for sharing.

### The Critic in C4
A dense, leaning pillar with a razor-sharp lit rim on its Self-facing side, its jet curling back into itself. A large globule eclipses its heart, and its eye-stars are dim behind gas.

### 2D icon
The rim line only (extracted from the glyph), two dots and a soft glow. It's weaker than C1 and C2 at 16px, which is acceptable for a hero or celebration concept.

### Done when
The rim keeps the silhouette readable while orbiting. Unburdening gets a visible "wow" from testers. It holds 45+ fps on the hero device.

---

## C6 — Planet / Star (every part has both forms)

**Ontology:** **planets reflect, stars emit.** A burdened part is a *planet* that only shines by borrowed Self-light. As it unburdens and becomes Self-led, it **ignites** into a star. Progress in therapy becomes stellar evolution.

### Planet form (reuses the C2 renderer)
The user picks a world type, and each role has a sensible default:

| Type | Default for | Visual |
|---|---|---|
| Rocky / faceted | Managers | Terraces, hard terminator |
| Ringed giant | Managers that hold rules (the Controller, the Critic) | Banded atmosphere plus a ring system, where the rings are the rules |
| Volcanic | Firefighters | Emissive fissures, ash plume |
| Ocean | Caretakers, the Pleaser | Specular sea and soft clouds |
| Ice / rogue | Exiles | Frozen, far from the Self, faint rim light only |

### Star form
- **The body:** a glowing glyph-shaped star with granulation, limb darkening, a small corona (from the C1 code) and a diffraction-spike PSF.
- **The eyes are a pair of sunspots** (umbra and penumbra) at the eye ports. They're dark eyes on a bright body, so it's the inverse of the planet form. A blink means the spots fade and return.
- **Star classes** (user-selectable):

  | Class | Visual | Notes |
  |---|---|---|
  | Dwarf | Small and steady | |
  | Giant | Large, soft limb, slow pulse | |
  | Flare star | Random flares at a rate set by temperature | Default for firefighters |
  | Pulsar | Rotating beams at a speed set by agency | Alarm-type parts (the Sentry) |
  | Binary | Two bodies orbiting a shared centre | Assigned automatically to **polarised pairs** (the Critic ↔ the Rebel) |

- **Self:** the system's central star, the largest and only gold-white. Ignited parts are always visibly smaller and dimmer than the Self.

### Ignition (the key transition)
- **Stages:** planet → brown dwarf (dull red inner glow, at burden about 0.5) → ignition flash → star (burden below 0.2 and the user marks the part as unburdened).
- **Rendering:** the planet's day-side shading cross-fades into emission, the terminator dissolves, crater-lake eyes become sunspots, the moons are kept as planets that now orbit it, and the PSF spikes appear on ignition.
- **The meaning holds up:** a star still "needs" nothing from the Self, since its light is its own. That's the IFS goal of Self-energy distributed through the system.

### Relationships (preview for the cosmos stage)
- **Protects:** the protected part sits in the protector's shadow (planet) or warmth (star).
- **Polarised:** a binary pair with tidal distortion between them.
- **Ally:** an orbital resonance (orbits that visibly sync).

### The Critic in C6
- **As a planet:** a faceted ringed world, with tight, hard-edged rings (strict rules), a squint terminator and two fast moons.
- **As a star:** a sharp-edged orange flare star with spiky flares and narrow sunspot eyes. It forms a binary with the Rebel while they're polarised.

### 2D icons
- **Planet:** the phase-split glyph plus a ring line.
- **Star:** a filled glowing glyph, two spot dots and four spikes.
- Both pass at 16px, so the pair also works as a progress badge ("ignited parts: 4/18").

### Done when
Testers understand "planet → star = healing" unprompted. A ringed planet and a flare star both read clearly at 32px.

---

## 7. Build order (milestones)

| # | Milestone | Output | Why this order |
|---|---|---|---|
| M0 | Foundation | Schema, glyph SDF, SVG export, inflation, Self-light, HDR/AgX/bloom/PSF, lab layout, state machine | Everything depends on it |
| M1 | **C2 Phase** | Planet renderer, terminator-eyelid, moons, protection shadow | Cheapest; proves glyph plus lighting |
| M2 | **C6 Planet/Star** | Star shader, sunspot eyes, classes, ignition transition | Reuses M1; likely the strongest product mechanic |
| M3 | **C1 Eclipse** | Screen-space corona, bead eyes, blend gesture, CME | Reuses the corona from M2 |
| M4 | **C4 Nebula** | Volumetric cloud, ionisation rim, jets, Bok globule unburden | Heaviest; hero-only |
| M5 | Evaluation | The tests below, with screenshots and a recording | Pick the winner before building the cosmos |

## 8. Evaluation (applied to every concept)
1. **16 / 32px silhouette test:** black fill and coloured icon, for the Critic, the Self and the Unseen One.
2. **"Aww in 5 seconds":** a cold-viewer reaction test with 5 people.
3. **Blind reads:** role, mood and "is it blended?", aiming for at least 80%.
4. **2D↔3D parity:** the icon and the turntable judged as the same object.
5. **Randomised stress:** 30 random glyphs and hues, with zero ugly results.
6. **Performance:** hero frame time on a phone, plus impostor cost for 30 parts.
7. **Transition emotion:** unburden in C1, C2 and C4, and ignition in C6, rated 1–5 by testers.

---

## 9. Image-generator prompts (full 3D map, for mood boards)
See the session reply: four prompts (C1 Eclipse, C2 Phase, C4 Nebula, C6 Planet/Star), each describing the whole constellation rather than a single part. Prompts are kept in `docs/innerverse-image-prompts.md`.
