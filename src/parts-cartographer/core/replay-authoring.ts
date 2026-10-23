// One bounded everyday Replay, authored with personal names (ArchetypeAI-28h.4.1). Pure.
// A Replay is opt-in and never claims to reconstruct or predict a real memory.

export interface ReplayScene {
  id: string;
  title: string;
  optIn: boolean;
  /** Names the person supplied. Never inferred. */
  castNames: ReadonlyArray<string>;
  beats: ReadonlyArray<string>;
}

export const MAX_BEATS = 6;
const CLAIM = /\b(will (happen|definitely)|predict\w*|recovered memor\w*|reconstruct\w*|actually happened|exact(ly)? what happened)\b/i;

export type ValidationError = 'not-opted-in' | 'no-cast' | 'too-many-beats' | 'no-beats' | 'claims-reconstruction';

export function validateReplay(scene: ReplayScene): { ok: true } | { ok: false; reason: ValidationError } {
  if (!scene.optIn) return { ok: false, reason: 'not-opted-in' };
  if (scene.castNames.length === 0 || scene.castNames.some((n) => !n.trim())) return { ok: false, reason: 'no-cast' };
  if (scene.beats.length === 0) return { ok: false, reason: 'no-beats' };
  if (scene.beats.length > MAX_BEATS) return { ok: false, reason: 'too-many-beats' };
  if ([scene.title, ...scene.beats].some((text) => CLAIM.test(text))) return { ok: false, reason: 'claims-reconstruction' };
  return { ok: true };
}
