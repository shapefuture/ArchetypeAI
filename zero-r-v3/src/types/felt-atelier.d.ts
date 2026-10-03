/**
 * Type contract for the Felt Atelier engine.
 *
 * The engine is real JavaScript that lives outside this app's src tree
 * (../../../../felt-atelier/src), so TypeScript is not allowed to resolve it —
 * `rootDir` is `src`, and pulling those files into the program would break the
 * build layout. Instead the engine's surface is declared here, and the bundler
 * wires the real modules in at bundle time (`--alias:felt-atelier=...`).
 *
 * This is the same arrangement as a `@types/*` package: types here, implementation
 * there. If the engine's API changes, these declarations are what goes stale first.
 */

declare module "felt-atelier/dna" {
  export type Mood = "happy" | "content" | "sleepy" | "grumpy" | "side" | "surprised" | "wink" | "smirk";
  export interface Body { t: string; w: number; h: number; depth: number; lean: number; wobble: number; }
  export interface Eyes { style: string; wide: boolean; size: number; gap: number; y: number; gaze: [number, number]; lid: number; brow: string; }
  export interface Patch { t: string; felt: string; felt2: string; zone: number; rot: number; scale: number; }
  export interface Topper { t: string; felt: string; felt2: string; side: number; tilt: number; }
  export interface FeltDna {
    v: number; render: number; seed: number; collection: string;
    body: Body; felt: string; thread: string; eyes: Eyes; mouth: { style: string };
    patch: Patch; topper: Topper; extra: { seam: boolean; knots: number };
    size: number; earned: unknown[];
  }
  export interface Axes { agency?: number; temperature?: number; focus?: number; attachment?: number; }
  export const BODIES: string[];
  export const EYES: string[];
  export const TOPPERS: string[];
  export const MOODS: Mood[];
  export const MOUTHS: string[];
  export const PATCHES: string[];
  export const BROWS: string[];
  export const FELT: { wool: Record<string, string>; bright: Record<string, string> };
  export const PATCH_FELT: { wool: string[]; bright: string[] };
  export const TEMPLATE: Record<string, { eyeY: number; eyeGap: number; small?: boolean; zones: number[][]; bumpEyes?: boolean; eyeX?: number }>;
  /** Deterministic string -> uint32. */
  export function hashStr(s: string): number;
  /** Hex -> OKLab triple [L, a, b]. */
  export function oklab(hex: string): [number, number, number];
  /** Perceptual distance between two hex colours. */
  export function deltaE(a: string, b: string): number;
  export function feltHex(collection: string, id: string): string;
  /**
   * Draw one on-model character. Throws rather than emit an off-model doll, so
   * callers relax their locks (see felt-dna.ts) until it succeeds.
   */
  /** Taste + uniqueness rules. Empty array = on-model. */
  export function lint(dna: FeltDna, existing?: FeltDna[]): string[];
  export function generate(opts?: {
    seed?: number; collection?: string;
    profile?: { role?: string; mood?: Mood; axes?: Axes };
    existing?: FeltDna[]; locks?: Record<string, unknown>; self?: boolean;
  }): FeltDna;
}

declare module "felt-atelier/builder" {
  import type { FeltDna } from "felt-atelier/dna";
  export interface BuiltPart {
    key: string;
    /** In-process build: a real BufferGeometry (main thread). */
    geo?: { attributes: Record<string, { count: number; array: Float32Array } | undefined> };
    /** Across a worker: the same geometry as plain typed arrays. */
    attrs?: Record<string, Float32Array>;
  }
  /** One sewing record. `flat` is the 2D projection of exactly the same geometry as `parts`. */
  export function buildData(dna: FeltDna, opts?: { lod?: "hero" | "map" }): { parts: BuiltPart[]; flat: unknown[]; size: number };
}

declare module "felt-atelier/flat" {
  /** Serialise a sewing record to inline SVG — the 2D twin of the 3D meshes. */
  export function toSVG(rec: unknown[], opts?: { id?: string; title?: string }): string;
}

declare module "felt-atelier/assemble" {
  import type { BuiltPart } from "felt-atelier/builder";
  export interface FeltGroup { position: { set(x: number, y: number, z: number): void }; rotation: { y: number }; }
  export function makeGroup(parts: BuiltPart[], size: number): FeltGroup;
  /** Build felt materials for these keys during idle time so the first 3D view does not hitch. */
  export function warm(keys: string[]): void;
}

declare module "felt-atelier/stage" {
  export interface FeltObject { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }>; }
  export interface FeltStage {
    renderer: { domElement: HTMLCanvasElement; dispose(): void; render(scene: unknown, camera: unknown): void };
    scene: { add(o: unknown): void; remove(o: unknown): void; traverse(fn: (o: FeltObject) => void): void };
    camera: {
      position: { set(x: number, y: number, z: number): void };
      lookAt(x: number, y: number, z: number): void;
      aspect: number; updateProjectionMatrix(): void;
    };
  }
  /** The engine's own three-point lighting rig, so a doll here looks like a doll in the atelier. */
  export function setupStage(el: HTMLElement, W: number, H: number, opts?: { bg?: string; dpr?: number }): FeltStage;
}
