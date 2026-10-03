/**
 * Portable build: one HTML file that runs from anywhere — a file host, a USB stick,
 * file:// — with no /assets/* to resolve.
 *
 *   app + character engine + WebGL stack  -> inlined <script>
 *   sewing worker                         -> inlined as text, turned into a blob URL
 *   stylesheet                            -> inlined <style>
 *
 * The PWA shell in dist/ stays the deployment target; this is for sharing and for
 * checking the thing on a phone without standing up a server.
 *
 *   node ./scripts/build-single-file.mjs [out.html]
 */
import { build as esbuild } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] ?? path.join(root, "dist/parts-map.html");
const resolve = { nodePaths: [path.join(root, "node_modules")], alias: { "felt-atelier": path.resolve(root, "../felt-atelier/src") } };
const shared = { bundle: true, format: "iife", platform: "browser", target: "es2020", minify: true, legalComments: "none", logLevel: "warning", ...resolve, write: false };

const [app, worker] = await Promise.all([
  esbuild({ ...shared, entryPoints: [path.join(root, "src/main.ts")] }),
  esbuild({ ...shared, entryPoints: [path.join(root, "src/adapters/compute/felt-worker.ts")] }),
]);
const appJs = app.outputFiles[0].text;
const workerJs = worker.outputFiles[0].text;
const css = fs.readFileSync(path.join(root, "public/assets/styles.css"), "utf8");

// the worker rides along as text; escape the one sequence that would end the tag early
const embed = (s) => s.replace(/<\/script/gi, "<\\/script");
const shell = fs.readFileSync(path.join(root, "index.html"), "utf8");

// Every replacement goes through a function: minified code contains `$&`-style
// sequences that String.replace would otherwise treat as substitution patterns.
const html = shell
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, () => "<!-- CSP: this build is one file, there is no second origin to fence off -->")
  .replace(/<link rel="manifest"[^>]*>/, () => "")
  .replace(/<link rel="icon"[^>]*>/, () => "")
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module" src="\/assets\/main\.js"><\/script>/, () => [
    `<script type="text/plain" id="felt-worker-source">${embed(workerJs)}</script>`,
    "<script>try{window.__FELT_WORKER_URL__=URL.createObjectURL(new Blob([document.getElementById('felt-worker-source').textContent],{type:'text/javascript'}));}catch(e){/* no blob workers: the app sews on the main thread instead */}</script>",
    `<script>${embed(appJs)}</script>`,
  ].join(""));

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const external = html.match(/(?:src|href)="(?!#)[^"]*"/g)?.filter((a) => !/^\w+:/.test(a)) ?? [];
if (external.length) throw new Error(`single file still references: ${external.join(", ")}`);
console.log(`${out}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} kB, self-contained`);
