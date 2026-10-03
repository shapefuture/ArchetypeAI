/**
 * felt-worker.ts — the sewing room.
 *
 * Building one doll costs 35-170ms of solid computation (triangulating the pieces,
 * merging geometry, laying the stitch paths). On the main thread that is 2-10 dropped
 * frames per character, so the engine runs in here instead. The main thread only ever
 * receives finished work: an SVG string for the flat sticker, or the raw vertex
 * buffers for the 3D doll — transferred, never copied.
 *
 * If this worker cannot start (old browser, blocked module workers, file:// origin),
 * the character renderer sews on the main thread instead, time-sliced.
 */
import { buildData } from "felt-atelier/builder";
import { toSVG } from "felt-atelier/flat";
import type { FeltDna } from "felt-atelier/dna";
import type { BuiltPart } from "felt-atelier/builder";

interface SewRequest { id: number; dna: FeltDna; lod: "hero" | "map"; }
export interface SewResponse {
  id: number; ok: boolean; error?: string;
  svg?: string; size?: number; tris?: number; keys?: string[]; parts?: BuiltPart[];
}

/** Both DOM and WebWorker libs are in scope, so the worker globals are named explicitly. */
interface WorkerScope {
  postMessage(message: SewResponse, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: { data: SewRequest }) => void): void;
}
const ctx = self as unknown as WorkerScope;

/** Pull the typed arrays out of a geometry so they can be transferred zero-copy. */
function attributeArrays(part: BuiltPart): Record<string, Float32Array> {
  const attrs: Record<string, Float32Array> = {};
  if (part.geo) {
    for (const [name, attribute] of Object.entries(part.geo.attributes)) {
      if (attribute?.array) attrs[name] = attribute.array;
    }
  } else if (part.attrs) {
    for (const [name, array] of Object.entries(part.attrs)) attrs[name] = array as Float32Array;
  }
  return attrs;
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (!request || typeof request.id !== "number") return;
  try {
    const data = buildData(request.dna, { lod: request.lod });
    const parts: BuiltPart[] = data.parts.map((part) => ({ key: part.key, attrs: attributeArrays(part) }));
    const svg = toSVG(data.flat, { id: `f${request.dna.seed.toString(36)}` });
    const tris = Math.round(parts.reduce((n, p) => n + ((p.attrs?.position?.length ?? 0) / 3), 0));
    // Transfer the vertex buffers, do not copy them. Deduped: two attributes can, in
    // principle, be views on the same buffer, and a buffer may only be listed once.
    const transfer = [...new Set(parts.flatMap((p) => Object.values(p.attrs ?? {}).map((a) => a.buffer)))];
    ctx.postMessage({ id: request.id, ok: true, svg, size: data.size, tris, keys: parts.map((p) => p.key), parts }, transfer);
  } catch (error) {
    ctx.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
