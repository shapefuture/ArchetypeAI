/**
 * INNERVERSE — 147-item bank adapter (REVAMP_PLAN.md §1.2).
 *
 * All bilingual copy now lives in src/i18n/strings.ts (ITEM_TEXTS, LIKERT_TEXTS).
 * This module imports from strings and preserves the original export shapes.
 *
 * Structure per shadow part (8 items): q1-q2 trigger · q3-q5 behavior ·
 * q6-q7 internal narration · q8 somatic marker. q7 and q8 are REVERSE-KEYED
 * (agreement = low activation) matching scoring-v2's REVERSE_KEYED_INDEXES.
 * Resources (6) and Self (8) are positively keyed. Behavioral, present-tense,
 * jargon-free. Same key order in both languages.
 */
import { SHADOW_PARTS, RESOURCES, type ShadowPartId, type ResourceId } from '../app/core/data/parts';
import { ITEM_TEXTS, LIKERT_TEXTS } from './strings';

export const LIKERT = LIKERT_TEXTS;

export type ShadowItems = Record<ShadowPartId, [string, string, string, string, string, string, string, string]>;
export type ResourceItems = Record<ResourceId, [string, string, string, string, string, string]>;

export interface ItemBankTexts {
  items: ShadowItems;
  resources: ResourceItems;
  /** 8 items in SELF_QUALITIES order: calm, clarity, compassion, curiosity, confidence, courage, creativity, connectedness. */
  self: [string, string, string, string, string, string, string, string];
  validity: { attention: string; infrequency1: string; infrequency2: string };
}

export const ITEM_BANK: Record<'en' | 'ru', ItemBankTexts> = ITEM_TEXTS as Record<'en' | 'ru', ItemBankTexts>;

// --- Deterministic delivery schedule: 3 Descents x 49 items ---

export type ItemRef =
  | { kind: 'shadow'; part: ShadowPartId; index: number } // index 0..7 → q1..q8
  | { kind: 'resource'; part: ResourceId; index: number } // 0..5
  | { kind: 'self'; index: number } // 0..7
  | { kind: 'validity'; which: 'attention' | 'infrequency1' | 'infrequency2' };

/** §1.2 fixed validity positions, 1-based within the 147-item sequence. */
export const VALIDITY_POSITIONS = [40, 84, 120] as const;

/**
 * Round-robin across all 19 item groups (14 shadow + 4 resources + Self),
 * 8 rounds, then splice validity items into positions 40/84/120 (1-based).
 * Same schedule every run — no shuffling, ever.
 */
export function buildItemSequence(): ItemRef[] {
  const groups: { refs: ItemRef[] }[] = [
    ...SHADOW_PARTS.map(part =>
      ({ refs: Array.from({ length: 8 }, (_, i) => ({ kind: 'shadow', part, index: i }) as ItemRef) })),
    ...RESOURCES.map(part =>
      ({ refs: Array.from({ length: 6 }, (_, i) => ({ kind: 'resource', part, index: i }) as ItemRef) })),
    { refs: Array.from({ length: 8 }, (_, i) => ({ kind: 'self', index: i }) as ItemRef) },
  ];
  const scored: ItemRef[] = [];
  for (let round = 0; round < 8; round++) {
    for (const g of groups) if (round < g.refs.length) scored.push(g.refs[round]);
  }
  const validityRefs: ItemRef[] = [
    { kind: 'validity', which: 'attention' },
    { kind: 'validity', which: 'infrequency1' },
    { kind: 'validity', which: 'infrequency2' },
  ];
  const out: ItemRef[] = [];
  let s = 0;
  for (let pos = 1; pos <= 147; pos++) {
    const vIdx = VALIDITY_POSITIONS.indexOf(pos as 40 | 84 | 120);
    if (vIdx >= 0) out.push(validityRefs[vIdx]);
    else out.push(scored[s++]);
  }
  return out;
}

/** 3 sittings of exactly 49. */
export function buildDescents(): ItemRef[][] {
  const seq = buildItemSequence();
  return [seq.slice(0, 49), seq.slice(49, 98), seq.slice(98, 147)];
}

export function itemText(ref: ItemRef, lang: 'en' | 'ru'): string {
  const bank = ITEM_BANK[lang];
  if (ref.kind === 'shadow') return bank.items[ref.part][ref.index];
  if (ref.kind === 'resource') return bank.resources[ref.part][ref.index];
  if (ref.kind === 'self') return bank.self[ref.index];
  return bank.validity[ref.which];
}

export function isReverseKeyed(ref: ItemRef): boolean {
  return ref.kind === 'shadow' && ref.index >= 6;
}
