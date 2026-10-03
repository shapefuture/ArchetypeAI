# Felt Atelier

3D appliqué-felt character customizer, randomizer and constellation preview. No server needed.

- `customizer.html`: the whole app in one file (open it in a browser). Rebuild with `node build.mjs`.
- `preview.html`: the self-contained 2D/3D preview — one character on a turntable with the flat sewing record fused
  over it, plus a twelve-character inner family where every character is shown both as a 3D render and as its 2D sticker.
  No network at all: three.js, the engine and the sewing worker are all inlined in the file.
- `lineup.html`: dev harness that renders a 13-character lineup (`?seed=3&pitch=-0.42`, `&solo=5` for one close-up).
- `bench.mjs`, `bench2.mjs`: Node benchmarks of the sewing pipeline (`node bench.mjs`).
- `smoke.mjs`: runs `preview.html` in jsdom with only the WebGL renderer stubbed, then drives the controls and
  asserts the results (`node smoke.mjs`; needs `jsdom` as well).

Build needs `three`, `delaunator` and `esbuild` in `node_modules` (`npm i three@0.183.2 delaunator esbuild`).

## The preview: 2D and 3D are the same object

One sewing pass emits real geometry — two cut pieces inflated into stuffed domes, a blanket stitch wrapping the rim,
felt eyes and patches laid on the surface — and a flat draw record of everything it sewed. `src/fuse.js` lifts that
record back into 3D: each record gets its height from the same inflation formula that stuffs the body, then it is
projected through the live camera. So the preview can draw the 2D paths *on* the plush (Trace), and register the flat
sticker to the silhouette behind a split slider (Fuse). Front-on they coincide; turn the character and you can watch
the flat record separate from the volume it describes.

## How it is organised

| File | Job |
|---|---|
| `src/dna.js` | Character DNA, felt library, seeded RNG, randomizer with taste linter |
| `src/shapes.js` | Body outlines (SDF), marching squares, fast signed-distance grids |
| `src/builder.js` | Pure geometry: inflated two-sided felt bodies, blanket stitch, felt eyes/patches, head pieces. Also records a 2D draw list. Two LODs: `hero`, `map` |
| `src/core.js`, `worker.js`, `pool.js` | Sewing runs in a Web Worker pool (falls back to the main thread) |
| `src/assemble.js`, `materials.js` | Keyed materials with shared, tinted felt maps; shader pre-compilation |
| `src/flat.js` | 2D SVG sticker generated from the same draw list as the 3D character |
| `src/fuse.js` | Binds the two together: height-from-the-dome for each flat record, projection through the live camera, silhouette registration |
| `src/preview.js`, `src/preview.html` | The 2D/3D preview: turntable, fused sticker + split slider, projected sewing trace, construction stats, twelve-character family |
| `src/stage.js` | Lights, tone-safe background, fixed-size MSAA render target with sub-rectangle scaling |
| `src/app.js` | UI, prefetching, constellation view, FPS governor |

## Performance design (contradiction → resolution)

| Contradiction | Resolution |
|---|---|
| Rich geometry vs instant Randomize | Sewing is moved to workers, and the *next* random character is pre-sewn in the background (speculative execution). Randomize swaps in an already finished character: about 7 ms. |
| Exact distance queries vs speed | Each felt piece rasterises its signed distance field once (scanline fill + linear-time distance transform, exact only in a thin band at the edge). Every later query is an O(1) lookup. Hero build 636 → 107 ms, crowd LOD 461 → 38 ms. |
| Any felt colour vs first-use stalls | One shared fibre-luminance map per collection, tinted per material. A new colour costs microseconds instead of repainting 34k fibres. |
| Hero detail vs 24 characters | Two LODs. Crowd LOD is about 17k triangles and 3 draw calls per character (felt and thread colours baked into vertex colours so one material serves every piece). 24 characters ≈ 96 draws, ≈ 400k triangles, no shadow pass. |
| Changing resolution vs no hitch | The canvas never resizes. The scene is drawn into a pre-allocated MSAA half-float target using a sub-rectangle, then tone-mapped to the canvas. A feedback governor lowers or raises the render scale to hold 60 fps. |

## Measured here (headless Chromium, software GPU)

- Main thread long tasks (>50 ms) during 8 randomizes: 0. Click → new character on screen: 7 ms.
- Per-frame CPU cost: 1.2 ms (one character), 2.3 ms (24 characters, 97 draws).
- Frame rate cannot be measured honestly in this environment (software rasteriser, ~12 fps). The in-page HUD shows live fps, CPU ms, draws, triangles and render scale on a real GPU.
