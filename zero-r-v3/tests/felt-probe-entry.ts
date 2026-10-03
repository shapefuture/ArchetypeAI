/**
 * Test-only entry point.
 *
 * `run-tests.mjs` bundles this with esbuild and imports it in Node so the integrity
 * test can run the real character layer — the app's DNA mapping plus the engine's own
 * lint, build and serialise hooks — outside a browser. It ships nowhere: it is not
 * part of src/, so tsc never emits it.
 */
export { dnaForPart, dnaForSelf, PALETTE, SELF_FELT, feltDistance } from "../src/adapters/render/felt-dna.js";
export { PARTS, PARTS_BY_CATEGORY } from "../src/domain/content.js";
export { lint } from "felt-atelier/dna";
export { buildData } from "felt-atelier/builder";
export { toSVG } from "felt-atelier/flat";
