/**
 * Bundles what the browser loads.
 *
 * Two entries, two different reasons:
 *
 *   main.js        the app. Split, so the WebGL stack (three) is fetched and parsed
 *                  only when someone actually opens a part — the map itself never
 *                  parses it.
 *   felt-worker.js the sewing room. Deliberately NOT split: it must be one
 *                  self-contained file so the service worker can precache it and the
 *                  PWA can still sew its characters with no network at all.
 *
 * felt-atelier/* is the character engine next door (../../felt-atelier/src). It lives
 * outside src/, so tsc cannot emit it; the bundler resolves it instead. Its own imports
 * (three, delaunator, three/addons/*) are resolved from this package's node_modules.
 */
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resolve = { nodePaths: [path.join(root, "node_modules")], alias: { "felt-atelier": path.resolve(root, "../felt-atelier/src") } };
const shared = { bundle: true, format: "esm", target: "es2022", minify: true, legalComments: "none", logLevel: "warning" };

await build({
  ...shared,
  ...resolve,
  entryPoints: { main: path.join(root, "src/main.ts") },
  outdir: path.join(root, "dist/assets"),
  entryNames: "[name]",
  chunkNames: "chunks/[name]-[hash]",
  splitting: true,
});

await build({
  ...shared,
  ...resolve,
  entryPoints: { "felt-worker": path.join(root, "src/adapters/compute/felt-worker.ts") },
  outfile: path.join(root, "dist/assets/felt-worker.js"),
});
