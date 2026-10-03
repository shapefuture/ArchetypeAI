/**
 * felt.ts — the RenderPort that sews the parts.
 *
 * The characters are not drawn by hand and they are not bitmaps. Each one is built by
 * the Felt Atelier engine, which produces ONE geometry record per part, and that record
 * is the truth for both renderings:
 *
 *   2D — the record is projected to flat filled paths and serialised to inline SVG
 *        (engine: flat.js `toSVG`), so a map node costs no GL context and no texture.
 *   3D — the same record is assembled into real meshes (engine: assemble.js `makeGroup`)
 *        lit by the atelier's own stage (stage.js), so the sticker on the map and the
 *        doll in the part panel provably describe the same object.
 *
 * Sewing runs in a worker (see ../../compute/felt-worker.ts) because it is 35-170ms of
 * straight computation per character; the fallback path below does the same work
 * time-sliced on the main thread. Everything is generated on device from the part's own
 * DNA: no CDN, no model download, no atlas. That is what keeps this a local-first PWA.
 */
import type { RenderPort } from "../../ports/index.js";
import type { Part } from "../../domain/content.js";
import { CATEGORY_LABEL } from "../../domain/content.js";
import type { BuiltPart } from "felt-atelier/builder";
import { dnaForPart, dnaForSelf, type Dna } from "./felt-dna.js";

type Lod = "hero" | "map";
interface Sewn { svg: string; size: number; tris: number; parts: BuiltPart[]; keys: string[]; }
interface Job { id: number; key: string; dna: Dna; lod: Lod; done: (s: Sewn) => void; }
/** Worker replies are structurally cloned, so the shape is re-declared here. */
interface SewReply { id: number; ok: boolean; svg?: string; size?: number; tris?: number; keys?: string[]; parts?: BuiltPart[]; }

const cache = new Map<string, Sewn>();
/** Dark stage, so the doll sits inside the app's own panel rather than on a white card. */
const STAGE_BG = "#191622";
/** Single-file builds (see scripts/build-single-file.mjs) inject a blob URL here. */
const WORKER_URL = (globalThis as unknown as { __FELT_WORKER_URL__?: string }).__FELT_WORKER_URL__ ?? "/assets/felt-worker.js";

export class FeltCharacters implements RenderPort {
  private quality: "ultra" | "high" | "standard" = "high";
  private worker: Worker | null = null;
  private workerTried = false;
  private inflight = new Map<number, Job>();
  private queue: Job[] = [];
  private nextId = 1;
  private idleHandle: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private warmKeys = new Set<string>();
  private warmed = false;
  private webgl: boolean | null = null;
  private stage: { mount: HTMLElement; raf: number; dispose: () => void } | null = null;
  /** Set by the app so the family shelf can open a part without knowing about routing. */
  onSelectPart: ((id: string) => void) | null = null;

  setQuality(tier: "ultra" | "high" | "standard") {
    this.quality = tier;
    if (tier === "standard") this.unmountDetail();
  }

  // ---------------------------------------------------------------- sewing

  /**
   * Finished characters are cached by (lod, dna), so the map, the shelf and the hero
   * view of one part are all the same doll, sewn once.
   */
  private sew(dna: Dna, lod: Lod, done: (s: Sewn) => void) {
    const key = `${lod}:${dna.seed}:${dna.size}`;
    const hit = cache.get(key);
    if (hit) { done(hit); return; }
    const job: Job = { id: this.nextId++, key, dna, lod, done };
    const worker = this.workerFor();
    if (worker) {
      this.inflight.set(job.id, job);
      worker.postMessage({ id: job.id, dna, lod });
      if (!this.watchdog) this.watchdog = setTimeout(this.rescue, 5000);
      return;
    }
    this.queue.push(job);
    if (!this.idleHandle) this.idleHandle = setTimeout(this.drain, 24);
  }

  private workerFor(): Worker | null {
    if (this.worker) return this.worker;
    if (this.workerTried || typeof Worker === "undefined") return null;
    this.workerTried = true;
    try {
      const worker = new Worker(WORKER_URL, { type: "module" });
      worker.addEventListener("message", (event) => this.onSewn(event.data as SewReply));
      worker.addEventListener("error", () => this.abandonWorker());
      this.worker = worker;
      return worker;
    } catch {
      return null; // no module workers: the main thread will sew instead
    }
  }

  private onSewn(reply: SewReply) {
    if (!reply || typeof reply.id !== "number") return;
    const job = this.inflight.get(reply.id);
    if (!job) return;
    this.inflight.delete(reply.id);
    if (!this.inflight.size && this.watchdog) { clearTimeout(this.watchdog); this.watchdog = null; }
    if (!reply.ok || !reply.svg || !reply.parts) { this.requeue(job); return; }
    const sewn: Sewn = { svg: reply.svg, size: reply.size ?? 1, tris: reply.tris ?? 0, parts: reply.parts, keys: reply.keys ?? [] };
    cache.set(job.key, sewn);
    for (const key of sewn.keys) this.warmKeys.add(key);
    job.done(sewn);
    this.maybeWarm();
  }

  /** Worker gone (error, or a browser that will not run it): finish the work ourselves. */
  private abandonWorker() {
    this.worker?.terminate();
    this.worker = null;
    for (const job of this.inflight.values()) this.requeue(job);
    this.inflight.clear();
    if (this.watchdog) { clearTimeout(this.watchdog); this.watchdog = null; }
  }

  /** Nothing came back in time — the map must not wait forever for its characters. */
  private rescue = () => {
    this.watchdog = null;
    if (!this.inflight.size) return;
    this.abandonWorker();
  };

  private requeue(job: Job) {
    this.queue.push(job);
    if (!this.idleHandle) this.idleHandle = setTimeout(this.drain, 24);
  }

  /**
   * Fallback sewing: the same engine, run here in slivers so a dropped frame is never
   * longer than the slice. The 3D stack is imported on demand — that is 600kB of
   * JavaScript the main thread never parses until a part is actually opened.
   */
  private drain = () => {
    void (async () => {
      this.idleHandle = null;
      const engine = await this.engine();
      const start = performance.now();
      while (this.queue.length && performance.now() - start < 8) {
        const job = this.queue.shift()!;
        const data = engine.buildData(job.dna, { lod: job.lod });
        const parts = data.parts.map((p) => ({ key: p.key, geo: p.geo ?? { attributes: Object.fromEntries(Object.entries(p.attrs ?? {}).map(([n, a]) => [n, { count: (a as Float32Array).length, array: a as Float32Array }])) } }));
        const sewn: Sewn = {
          svg: engine.toSVG(data.flat, { id: `f${job.dna.seed.toString(36)}` }),
          size: data.size, parts,
          tris: Math.round(parts.reduce((n, p) => n + ((p.geo?.attributes.position?.count ?? 0) / 3), 0)),
          keys: parts.map((p) => p.key),
        };
        cache.set(job.key, sewn);
        for (const key of sewn.keys) this.warmKeys.add(key);
        job.done(sewn);
      }
      if (this.queue.length) this.idleHandle = setTimeout(this.drain, 24);
      else this.maybeWarm();
    })();
  };

  private enginePromise: Promise<{
    buildData: (dna: Dna, opts: { lod: Lod }) => { parts: BuiltPart[]; flat: unknown[]; size: number };
    toSVG: (rec: unknown[], opts: { id: string }) => string;
  }> | null = null;

  private engine() {
    this.enginePromise ??= Promise.all([import("felt-atelier/builder"), import("felt-atelier/flat")]).then(([builder, flat]) => ({
      buildData: builder.buildData as (dna: Dna, opts: { lod: Lod }) => { parts: BuiltPart[]; flat: unknown[]; size: number },
      toSVG: flat.toSVG as (rec: unknown[], opts: { id: string }) => string,
    }));
    return this.enginePromise;
  }

  /**
   * Felt textures cost real time to build once. They are warmed on the first touch
   * rather than on load: pointerdown fires before click, so the 3D stack starts
   * downloading while the part's hero doll is still being sewn in the worker.
   */
  private maybeWarm() {
    if (this.warmed || this.queue.length || this.inflight.size) return;
    if (this.quality === "standard" || !this.warmKeys.size || !this.hasWebGL()) return;
    this.warmed = true;
    const keys = [...this.warmKeys];
    const kick = () => {
      void import("felt-atelier/assemble").then(({ warm }) => {
        try { warm(keys); } catch { /* pre-warming is a nicety */ }
      }).catch(() => { /* no 3D stack available; nothing to warm */ });
    };
    document.addEventListener("pointerdown", kick, { once: true, passive: true });
    document.addEventListener("keydown", kick, { once: true });
  }

  private lodFor(slot: "map" | "detail"): Lod {
    return slot === "detail" && this.quality !== "standard" ? "hero" : "map";
  }

  // ---------------------------------------------------------------- mounting

  private slot(el: HTMLElement, cls: string): HTMLElement {
    let slot = el.querySelector<HTMLElement>(`.${cls}`);
    if (!slot) {
      slot = document.createElement("span");
      slot.className = cls;
      slot.setAttribute("aria-hidden", "true");
      el.prepend(slot);
    }
    return slot;
  }

  /** Map node: the sewn doll replaces the coloured dot; the category glow stays behind it. */
  attachNode(el: HTMLElement, part: Part) {
    el.classList.add("part-node--felt");
    const slot = this.slot(el, "part-node-felt");
    this.sew(dnaForPart(part), this.lodFor("map"), (s) => { if (slot.isConnected) slot.innerHTML = s.svg; });
  }

  /** Self is not a part; it gets its own DNA and no costume. */
  attachSelf(el: HTMLElement) {
    el.classList.add("self-node--felt");
    const slot = this.slot(el, "self-node-felt");
    this.sew(dnaForSelf(), this.lodFor("map"), (s) => { if (slot.isConnected) slot.innerHTML = s.svg; });
  }

  /** Part panel: the hero doll on a turntable when the tier allows it, flat sticker otherwise. */
  mountDetail(mount: HTMLElement, part: Part) {
    this.unmountDetail();
    this.sew(dnaForPart(part), this.lodFor("detail"), (s) => { void this.mountHero(mount, s); });
  }

  private async mountHero(mount: HTMLElement, sewn: Sewn) {
    if (!this.onScreen(mount)) return;
    if (this.quality === "standard" || !this.hasWebGL()) { this.paintFlat(mount, sewn); return; }
    try {
      const [{ makeGroup }, { setupStage }] = await Promise.all([import("felt-atelier/assemble"), import("felt-atelier/stage")]);
      // the user may have left the part while the 3D stack was downloading
      if (!this.onScreen(mount)) return;
      this.paint3D(mount, sewn, makeGroup, setupStage);
    } catch {
      this.paintFlat(mount, sewn); // no WebGL, no worker geometry, no matter: the sticker is the same doll
    }
  }

  /** A figure only earns a GL context while its scene is the one on screen. */
  private onScreen(mount: HTMLElement): boolean {
    if (!mount.isConnected) return false;
    const scene = mount.closest("[data-scene]");
    return !scene || scene.getAttribute("data-active") === "true";
  }

  unmountDetail() {
    if (!this.stage) return;
    cancelAnimationFrame(this.stage.raf);
    this.stage.dispose();
    this.stage = null;
  }

  /** System scene: the whole internal family on one shelf, each one tappable. */
  mountFamily(mount: HTMLElement, parts: Part[]) {
    mount.replaceChildren();
    for (const part of parts) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "felt-family-cell";
      const figure = document.createElement("span");
      figure.className = "felt-family-figure";
      const name = document.createElement("span");
      name.className = "felt-family-name";
      name.textContent = part.name;
      const meta = document.createElement("span");
      meta.className = "felt-family-meta";
      meta.textContent = CATEGORY_LABEL[part.category];
      cell.append(figure, name, meta);
      cell.addEventListener("click", () => this.onSelectPart?.(part.id));
      mount.append(cell);
      this.attachNode(figure, part);
    }
  }

  private paintFlat(mount: HTMLElement, sewn: Sewn) {
    mount.replaceChildren();
    const hold = document.createElement("div");
    hold.className = "part-figure--flat";
    hold.setAttribute("role", "img");
    hold.setAttribute("aria-label", "the part, sewn");
    hold.innerHTML = sewn.svg;
    mount.append(hold);
  }

  private paint3D(
    mount: HTMLElement,
    sewn: Sewn,
    makeGroup: (parts: BuiltPart[], size: number) => { position: { set(x: number, y: number, z: number): void }; rotation: { y: number } },
    setupStage: (el: HTMLElement, w: number, h: number, opts: { bg: string; dpr: number }) => {
      renderer: { domElement: HTMLCanvasElement; dispose(): void; render(scene: unknown, camera: unknown): void };
      scene: { add(o: unknown): void; remove(o: unknown): void; traverse(fn: (o: { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }> }) => void): void };
      camera: { position: { set(x: number, y: number, z: number): void }; lookAt(x: number, y: number, z: number): void; aspect: number; updateProjectionMatrix(): void };
    },
  ) {
    const w = Math.max(220, mount.clientWidth || 280);
    const h = mount.clientHeight || 236;
    const stage = setupStage(mount, w, h, { bg: STAGE_BG, dpr: Math.min(2, (globalThis.devicePixelRatio || 1) * 1.5) });
    const group = makeGroup(sewn.parts, sewn.size);
    const box = extent(sewn.parts);
    group.position.set(-box.cx * sewn.size, -box.cy * sewn.size, 0);
    stage.scene.add(group);
    stage.camera.aspect = w / h;
    stage.camera.updateProjectionMatrix();
    stage.camera.position.set(0, 0, Math.max(2.6, box.h * sewn.size * 2.4, (box.w * sewn.size * 2) / (w / h)));
    stage.camera.lookAt(0, 0, 0);
    stage.renderer.domElement.classList.add("part-figure-canvas");
    mount.replaceChildren(stage.renderer.domElement);
    mount.classList.add("part-figure--hero");

    // "Reduce motion" means no turntable: the doll is drawn once and holds still.
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const frame = () => {
      if (!reduced) group.rotation.y += 0.0055; // slow enough to read as breathing, not spinning
      stage.renderer.render(stage.scene, stage.camera);
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    frame();
    this.stage = {
      mount, raf,
      dispose: () => {
        stage.scene.remove(group);
        stage.scene.traverse((o) => {
          o.geometry?.dispose?.();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material?.dispose?.();
        });
        stage.renderer.dispose();
        stage.renderer.domElement.remove();
        mount.classList.remove("part-figure--hero");
      },
    };
  }

  private hasWebGL(): boolean {
    if (this.webgl === null) {
      try {
        const c = document.createElement("canvas");
        this.webgl = typeof WebGLRenderingContext !== "undefined" && !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch { this.webgl = false; }
    }
    return this.webgl;
  }

  dispose() {
    this.unmountDetail();
    if (this.idleHandle) clearTimeout(this.idleHandle);
    if (this.watchdog) clearTimeout(this.watchdog);
    this.idleHandle = null;
    this.watchdog = null;
    this.worker?.terminate();
    this.worker = null;
    this.queue.length = 0;
    this.inflight.clear();
  }
}

/** Centre of a doll's own vertex cloud, so the turntable spins it about itself. */
function extent(parts: BuiltPart[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const part of parts) {
    const position = part.attrs?.position ?? part.geo?.attributes?.position?.array;
    if (!position) continue;
    for (let i = 0; i < position.length; i += 3) {
      const x = position[i]!, y = position[i + 1]!, z = position[i + 2]!;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  if (!isFinite(minX)) { minX = minY = -0.5; maxX = maxY = 0.5; }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, cz: (minZ + maxZ) / 2, w: maxX - minX, h: maxY - minY };
}
