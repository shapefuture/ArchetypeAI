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
