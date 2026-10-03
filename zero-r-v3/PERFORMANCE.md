# Performance Contract

The core budget is not “make every operation <8ms.” It is “remove expensive operations from the interaction critical path.”

## Critical path
input → local transition → scene activation → compositor → frame

## Background plane
future prediction → future materialization → persistence → sync → analytics

The current runtime uses a bounded future window and an expected-value scheduler. Future work is intentionally limited to the highest-value candidates.

## Adaptive visual quality
ultra → high → standard

Quality reduction sequence: speculative workload → ambient effects → blur/secondary decoration. Interaction responsiveness is protected.

## Character sewing budget

Building a doll is 35-170ms of straight computation, which is 2-10 dropped frames if it
runs where frames are made. The budget is therefore:

- **Worker first.** `felt-worker.js` does the building; the main thread receives an SVG
  string (flat) or transferred `Float32Array`s (hero). It is one self-contained file so
  the service worker can precache it and the PWA can still sew offline.
- **Time-sliced fallback.** No workers? Same engine, 8ms slices, 24ms between them, so
  no slice is ever long enough to be seen.
- **Lazy 3D.** three.js is a separate chunk. `assets/main.js` is ~25kB and never parses
  the WebGL stack; opening a part is what fetches it.
- **Cached per (lod, DNA).** The map, the family shelf and the hero view of a part share
  one sewn result, so a character is built at most twice (map + hero).

Measured: `assets/main.js` 25.6kB (9.7kB gzip), sewing worker 320kB (82kB gzip, fetched
at startup), WebGL chunk 532kB (134kB gzip, on first part open).
