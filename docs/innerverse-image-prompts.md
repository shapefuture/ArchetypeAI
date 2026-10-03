# Innerverse — Image-generator prompts (full 3D map of parts)

Use these with Midjourney, Flux, Imagen, DALL·E and similar tools. Each prompt shows the **whole constellation**, not one part.
- **Suggested settings:** 16:9 (or 3:2) aspect ratio, highest quality, stylize medium. Add `--no` or a negative prompt with the negative line at the end of each prompt.
- **Consistency rule shared by all four prompts:** the beings have **no arms, no legs, no hands and no mouths, only two eyes**. They differ by silhouette, not by costume. The Self is the only primary light source.

---

## C1 — Eclipse

```
A vast, near-black cosmic void seen in a wide cinematic 3D shot. At the centre burns a single warm gold-white sun — the Self — the only light source in the scene, with soft limb darkening and fine granulation. Around it, about eighteen small dark silhouette beings float at different depths across three-dimensional space, like a hidden constellation. Each being is a smooth, pillow-inflated abstract shape — crescent, shield, teardrop, cupped bowl, leaning wedge, rounded star — pitch black, no arms, no legs, no mouth, no face drawing. Each one is outlined by its own glowing corona of plasma streamers backlit by the sun: some have calm, orderly symmetric streamers, some have wild flaring prominences and loops, and some faint distant ones have only a thin broken rim of light. Every being has exactly two "eyes" made of tiny brilliant points of sunlight leaking through notches in its silhouette, like Baily's beads of a solar eclipse, with delicate diffraction spikes — some narrowed, some wide, some looking toward the sun, some looking down. One sharp leaning crescent-shaped being has drifted partly in front of the sun, eclipsing it, so the whole scene is slightly dimmed and its corona flares intensely. Distant beings sit far out on cold eccentric orbits; close ones hug the sun on tight fast orbits, with faint thin orbital arcs. Restrained, mostly empty space, no starfield wallpaper, no purple nebula. Photoreal astrophysical rendering, HDR, filmic tonemapping, physically based bloom, subtle volumetric light, shallow depth of field, SIGGRAPH-quality CG, award-winning minimal art direction, emotional and tender, quiet and awe-inspiring.
```
Negative: `arms, legs, hands, mouth, cartoon faces, stickers, kawaii, text, labels, UI, busy starfield, purple space wallpaper, planets with rings, humanoid, clutter, lens dirt`

---

## C2 — Phase

```
A wide cinematic 3D view of a small private solar system floating in deep near-black space. At the centre glows one warm golden-white sun — the only light source — lighting everything around it from one direction. Around it orbit about eighteen small abstract worlds at different distances and heights, each one a unique soft inflated silhouette (wedge, crescent, cupped bowl, teardrop, rounded triangle, lobed cloud shape) rather than a perfect sphere — no arms, no legs, no mouth. Each world is half-lit by the sun with a crisp day/night terminator line, and the terminator works like an eyelid: every world has two small round crater lakes as eyes that glint with reflected sunlight on the day side — fully lit worlds look open and present, crescent-lit worlds look shy and withdrawn, nearly dark distant worlds show only a faint rim glint in their eyes. Surfaces vary by type: faceted terraced basalt, glowing volcanic fissures, smooth frosted ice, glossy ocean. Thin atmospheric rims in different soft colours (coral, teal, lilac, amber, mint). Tiny moons whip around some worlds on tight fast orbits while others drift alone far out on wide cold orbits. A sharp faceted basalt world in the foreground casts a long shadow cone backward, sheltering a small dim icy world inside its shade. Faint hairline orbit arcs. Mostly empty space, no starfield wallpaper. Photoreal planetary rendering, physically based lighting, HDR, filmic tonemapping, gentle bloom, shallow depth of field, tilt-shift miniature feel, SIGGRAPH-quality CG, elegant, tender, minimal, award-winning art direction.
```
Negative: `arms, legs, hands, mouths, cartoon faces, stickers, kawaii, text, labels, UI, Saturn clone, busy starfield, purple nebula wallpaper, humanoid, clutter`

---

## C4 — Nebula Nursery

```
A wide cinematic 3D view inside a dark cosmic nursery. At the centre shines one warm golden-white star — the Self — the only true light source. Scattered around it at different depths float about eighteen small nebula beings: each one is a soft volumetric cloud of glowing gas shaped into a distinct abstract silhouette (leaning pillar, cupped bowl, teardrop, lobed cloud, wedge), no arms, no legs, no mouth. The side of each cloud facing the central star has a razor-sharp bright ionisation rim, like the Pillars of Creation, so every silhouette reads crisply against the black. Each being has exactly two small bright young stars embedded inside it as eyes, glowing through the gas, with fine diffraction spikes — some veiled by gas, some clear and wide. Colours come in paired emission tones per being: coral red with teal, magenta with mint, amber with blue, lilac with gold. Some active beings shoot thin bipolar jets with glowing knots; some calm receptive beings are diffuse and open. Several beings carry a dense dark dust globe over their heart, dimming their inner light; one nearby being is mid-transformation — its dark globe evaporating with a bright rim, its heart star igniting, a soft expanding light-echo ring. Mostly empty dark space between them, no wallpaper starfield. Photoreal volumetric astrophotography meets CG feature film, HDR, filmic tonemapping, physically based bloom, light scattering, depth of field, SIGGRAPH-quality rendering, awe, tenderness, rebirth, award-winning minimal art direction.
```
Negative: `arms, legs, hands, mouths, cartoon faces, stickers, kawaii, text, labels, UI, generic purple nebula wallpaper, galaxy background, humanoid, clutter, smoke monsters, scary`

---

## C6 — Planet / Star

```
A wide cinematic 3D view of one person's inner solar system floating in deep near-black space. At the centre blazes the largest body: a warm gold-white star — the Self — with soft corona and delicate diffraction spikes. Around it, at different distances, heights and depths, orbit about eighteen small celestial beings, each a unique soft inflated abstract silhouette (wedge, crescent, cupped bowl, teardrop, rounded triangle, lobed shape), no arms, no legs, no mouth, each with exactly two eyes. About two thirds are planets lit only by the central star: a faceted ringed world with tight hard-edged rings, a volcanic world with glowing fissures, a glossy ocean world with soft clouds, a frozen dim rogue world far out on a cold orbit — their eyes are two small crater lakes glinting where sunlight hits, a crisp day/night terminator acting as an eyelid. About one third have ignited into small stars of their own: glowing bodies with granulated surfaces and soft coronas, smaller and dimmer than the central sun, their eyes two dark sunspots; one is a flaring orange star with spiky flares, one is a pulsar with slowly sweeping light beams, and two beings form a binary pair orbiting each other with a faint tidal bridge of glowing gas between them. One world in the middle is mid-ignition, its night side starting to glow from within. Tiny moons orbit some bodies; faint hairline orbit arcs; mostly empty space, no starfield wallpaper. Photoreal astrophysical CG, physically based lighting, HDR, filmic tonemapping, bloom, shallow depth of field, slight tilt-shift miniature feel, SIGGRAPH-quality rendering, tender, hopeful, elegant, award-winning minimal art direction.
```
Negative: `arms, legs, hands, mouths, cartoon faces, stickers, kawaii, text, labels, UI, realistic Earth, Saturn clone, busy starfield, purple nebula wallpaper, humanoid, clutter`

---

## Tips
- **The eyes are the hardest part.** If the generator draws cartoon faces, add "eyes are made of light, not drawn" and strengthen the negative prompt.
- **For a top-down "map" view,** replace "wide cinematic 3D view" with "isometric three-quarter top-down view of the whole system, like a luminous orrery".
- **For a single-part close-up later,** keep the same wording and replace "about eighteen small beings" with one being described in detail.
