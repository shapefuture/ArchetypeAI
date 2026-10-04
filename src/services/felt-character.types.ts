export type FeltAttributeArray =
  | Float32Array
  | Float64Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array;

export type FeltLOD = 'map' | 'hero';

export interface FeltCharacterPart {
  key: string;
  /** Present for the main-thread fallback; worker results use `attrs`. */
  geo?: unknown;
  attrs?: Record<string, FeltAttributeArray>;
}

export interface FeltCharacterPayload {
  parts: FeltCharacterPart[];
  size: number;
  svg: string;
}

export interface FeltCharacterBuildRequest {
  requestId: number;
  characterId: string;
  dna: Record<string, unknown>;
  lod: FeltLOD;
}

export interface FeltCharacterBuildResponse extends FeltCharacterPayload {
  requestId: number;
  ok: boolean;
  error?: string;
}
