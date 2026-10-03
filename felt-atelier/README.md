# Felt Atelier

3D appliqué-felt character customizer, randomizer and constellation preview. No server needed.

- `customizer.html`: the whole app in one file (open it in a browser). Rebuild with `node build.mjs`.
- `lineup.html`: dev harness that renders a 13-character lineup (`?seed=3&pitch=-0.42`, `&solo=5` for one close-up).
- `bench.mjs`, `bench2.mjs`: Node benchmarks of the sewing pipeline (`node bench.mjs`).

Build needs `three`, `delaunator` and `esbuild` in `node_modules` (`npm i three@0.183.2 delaunator esbuild`).

## How it is organised

| File | Job |
|---|---|
| `src/dna.js` | Character DNA, felt library, seeded RNG, randomizer with taste linter |
| `src/shapes.js` | Body outlines (SDF), marching squares, fast signed-distance grids |
| `src/builder.js` | Pure geometry: inflated two-sided felt bodies, blanket stitch, felt eyes/patches, head pieces. Also records a 2D draw list. Two LODs: `hero`, `map` |
| `src/core.js`, `worker.js`, `pool.js` | Sewing runs in a Web Worker pool (falls back to the main thread) |
| `src/assemble.js`, `materials.js` | Keyed materials with shared, tinted felt maps; shader pre-compilation |
| `src/flat.js` | 2D SVG sticker generated from the same draw list as the 3D character |
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
