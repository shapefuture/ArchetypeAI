/// <reference lib="webworker" />

import { buildData } from '../../felt-atelier/src/builder.js';
import { toSVG } from '../../felt-atelier/src/flat.js';
import type {
  FeltAttributeArray,
  FeltCharacterBuildRequest,
  FeltCharacterBuildResponse,
} from './felt-character.types';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<FeltCharacterBuildRequest>) => {
  const { requestId, characterId, dna, lod } = event.data;

  try {
    const built = buildData(dna, { lod });
    const transfer: Transferable[] = [];
    const parts = built.parts.map(({ key, geo }: any) => {
      const attrs: Record<string, FeltAttributeArray> = {};
      for (const name of ['position', 'normal', 'uv', 'color']) {
        const attribute = geo.getAttribute(name);
        if (!attribute) continue;
        attrs[name] = attribute.array as FeltAttributeArray;
        transfer.push(attribute.array.buffer as ArrayBuffer);
      }
      return { key, attrs };
    });
    const safeId = `felt-${hashString(characterId).toString(36)}`;
    const response: FeltCharacterBuildResponse = {
      requestId,
      ok: true,
      parts,
      size: built.size,
      svg: toSVG(built.flat, { id: safeId }),
    };
    workerScope.postMessage(response, [...new Set(transfer)]);
  } catch (error) {
    workerScope.postMessage({
      requestId,
      ok: false,
      parts: [],
      size: 1,
      svg: '',
      error: error instanceof Error ? error.message : String(error),
    } satisfies FeltCharacterBuildResponse);
  }
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
