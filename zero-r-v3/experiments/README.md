# ZERO-R V3 experimental adapters

The production runtime is framework-independent. Future experiments can implement `ScenePort` without touching domain/application code:

- Qwik: resumable shell benchmark
- Astro: static/island shell benchmark
- Solid: fine-grained island benchmark
- WebGPU: renderer benchmark
- OPFS/SQLite: storage benchmark
- WebTransport/Cloudflare DO: sync benchmark

Promotion rule: benchmark the adapter against the current production adapter under the same contract suite; do not merge experimental dependencies into the core until they win on a stated metric.
