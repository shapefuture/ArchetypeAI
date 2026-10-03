/**
 * UI smoke test: runs the shipped app in jsdom and checks the sewn characters
 * actually appear in the DOM — on the map, in the part panel and on the family shelf.
 *
 * jsdom has no WebGL and no workers, so this exercises both fallbacks on purpose:
 * the engine runs on the main thread (time-sliced) and the hero doll falls back to
 * its flat sticker. If a future change breaks either path, this fails.
 *
 *   node ./tests/smoke-ui.mjs        (requires dist/: npm run build)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build as esbuild } from "esbuild";

const root = process.cwd();
const dist = path.join(root, "dist");
if (!fs.existsSync(path.join(dist, "assets/main.js"))) { console.log("SKIP ui smoke: run npm run build first"); process.exit(0); }

let JSDOM;
try { ({ JSDOM } = await import("jsdom")); } catch { console.log("SKIP ui smoke: jsdom is not installed (npm i)"); process.exit(0); }

// jsdom cannot execute ES modules, so the same entry is bundled once more as a classic script.
const bundle = path.join(os.tmpdir(), `zero-r-ui-${process.pid}.js`);
await esbuild({
  entryPoints: { app: path.join(root, "src/main.ts") },
  outfile: bundle, bundle: true, format: "iife", platform: "browser", target: "es2020",
  nodePaths: [path.join(root, "node_modules")],
  alias: { "felt-atelier": path.resolve(root, "../felt-atelier/src") },
  logLevel: "silent",
});
const code = fs.readFileSync(bundle, "utf8");
fs.rmSync(bundle, { force: true });

const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8").replace(/<script[^>]*type="module"[^>]*><\/script>/, "");
// jsdom has no canvas backend; that one gap is the test harness, not the app.
const IGNORE = /Not implemented: HTMLCanvasElement's getContext\(\)/;
const problems = [];
const note = (message) => { if (!IGNORE.test(message)) problems.push(message); };
const { VirtualConsole } = await import("jsdom");
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => note(String(e && e.message ? e.message : e)));
virtualConsole.on("error", (...args) => note(args.map(String).join(" ")));

const dom = new JSDOM(shell, { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/", virtualConsole });
const { window } = dom;
const doc = window.document;

const until = (label, fn, timeout = 60000) => new Promise((resolve, reject) => {
  const started = Date.now();
  const tick = () => {
    let ok = false;
    try { ok = fn(); } catch (error) { reject(error); return; }
    if (ok) { resolve(); return; }
    if (Date.now() - started > timeout) { reject(new Error(`timed out waiting for ${label}`)); return; }
    setTimeout(tick, 60);
  };
  tick();
});

const script = doc.createElement("script");
script.textContent = code;
doc.body.appendChild(script);

// ---- the map: every part is a button, and every button is sewn ----
assert.equal(doc.querySelectorAll(".part-node").length, 7, "the map did not render the parts");
assert.equal(doc.querySelector(".self-node").querySelectorAll(".self-glow").length, 1);
await until("7 sewn parts on the map", () => doc.querySelectorAll(".part-node-felt svg").length === 7);
await until("Self sewn", () => doc.querySelectorAll(".self-node-felt svg").length === 1);
const planner = doc.querySelector('[data-part="planner"]');
assert.ok(planner.style.left && planner.style.top, "the planner was not positioned on its orbit");
assert.match(planner.style.getPropertyValue("--part-color"), /^#/, "the planner lost its category colour");
assert.ok(planner.querySelector("svg").outerHTML.length > 4000, "the planner sticker is not a sewing record");
assert.equal(doc.querySelector(".part-node--felt .part-node-felt svg").tagName.toLowerCase(), "svg");

// ---- opening a part mounts its hero figure ----
planner.click();
await until("the part scene", () => doc.querySelector('[data-scene="part"]').getAttribute("data-active") === "true");
assert.equal(doc.querySelector('[data-bind="part-name"]').textContent, "The Planner");
await until("the hero figure", () => doc.querySelector('[data-bind="part-figure"]').childElementCount === 1);
const hero = doc.querySelector('[data-bind="part-figure"]').firstElementChild;
assert.ok(hero.querySelector("svg") || hero.classList.contains("part-figure-canvas"), "the hero is neither sticker nor doll");
if (hero.querySelector("svg")) assert.ok(hero.querySelector("svg").outerHTML.length > 20000, "the hero sticker lost detail");

// ---- the system scene shelves the whole family ----
doc.querySelector('.nav-button[data-route="system"]').click();
await until("the system scene", () => doc.querySelector('[data-scene="system"]').getAttribute("data-active") === "true");
assert.equal(doc.querySelectorAll(".felt-family-cell").length, 7, "the shelf is missing parts");
await until("the family sewn", () => doc.querySelectorAll(".felt-family-figure .part-node-felt svg").length === 7);
assert.equal(doc.querySelectorAll("[data-bind='system-list'] li").length, 3, "the system list did not render");
assert.deepEqual(problems, [], "the app logged errors");
assert.equal(doc.querySelectorAll(".self-node-felt svg").length, 1, "Self was re-sewn instead of reused");

dom.window.close();
console.log("PASS ui smoke: map, part panel and family shelf render sewn characters in jsdom");
