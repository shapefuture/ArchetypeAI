# ZERO-R Parts Map V3.1

Production-first, framework-independent temporal PWA runtime.

## Architecture

- Domain: deterministic state + transitions + futures
- Ports: UI, prediction, scheduling, storage, compute, render, sync, telemetry, capabilities
- Adapters: DOM, Canvas, IndexedDB, static prediction, Rust/WASM, offline sync
- Runtime: ExperienceCoordinator + economic Future Scheduler
- PWA: service worker + install manifest + offline core
- Visual: persistent scene deck + CSS compositor + ambient canvas
- Characters: parts are sewn felt dolls, generated on device by the Felt Atelier engine

Frameworks such as Astro, Qwik, Solid and React are intentionally not required by the production runtime. They can be added later as UI adapters without modifying domain/application code.

## Characters

Every part is a hand-sewn felt doll, not an icon and not a bitmap. One DNA per part
(hash of the id + category + activation) goes through the Felt Atelier engine in
`../felt-atelier/src`, which returns **one geometry record**, and that record is the
only source for both renderings:

| where | what is drawn | cost |
| --- | --- | --- |
| orbital map, family shelf | the record projected to flat paths, inlined as SVG | no GL context, no texture |
| part panel | the same record assembled into meshes on the atelier's own lit stage | one WebGL context, hero LOD |

So the sticker you tap and the doll that turns are provably the same object. Nothing is
downloaded: the characters are generated on device, which is what keeps the app
local-first and inside its own CSP.

Sewing costs 35-170ms per character, so it runs in a Web Worker
(`dist/assets/felt-worker.js`, precached by the service worker). Where workers are
unavailable the same engine runs time-sliced on the main thread instead. The WebGL
stack is a lazy chunk: the initial payload is ~35kB gzipped and does not include it —
it is fetched on first touch and only parsed if a part is actually opened.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`, then `npm run build`.
3. Serve `dist/` with an HTTP server.
4. Open it in Chrome/Safari mobile and install.

`npm test` runs the architecture suite plus a jsdom smoke test that boots the shipped
bundle and asserts the characters appear on the map, in the part panel and on the
family shelf. `npm run typecheck` type-checks the app and the engine contract.
`npm run sheet` writes a PNG contact sheet of the current cast so it can be checked
without opening a browser.
