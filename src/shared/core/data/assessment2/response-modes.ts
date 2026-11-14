/**
 * Response modes and the integration profile for Assessment 2.0 results.
 *
 * Each protector family is read as the protective form of one of four response modes: Receive, Accept, Take, Give.
 * The mapping is an educated guess, like the rest of the taxonomy, not a validated norm.
 *
 * The integration profile keeps five capacities separate and never adds them up: there is no total, rank or score.
 * A capacity the instrument does not measure is null, and the person reflects on it instead.
 * Pure, framework-free. Copy lives in ./content.ts.
 */
import { BLENDING_VALUE, FAMILIES, type BlendingOption, type FamilyId } from './taxonomy';
import type { Assessment2Result } from './scoring';

export const RESPONSE_MODES = ['receive', 'accept', 'take', 'give'] as const;
export type ResponseMode = (typeof RESPONSE_MODES)[number];

/** The response mode each family leans on when it protects. Every mode has at least one family. */
export const FAMILY_MODE: Record<FamilyId, ResponseMode> = {
  overPerform: 'give',
  appease: 'give',
  overControl: 'take',
  attack: 'take',
  pursue: 'take',
  withdraw: 'accept',
  reframe: 'accept',
  numbSoothe: 'receive',
};

export const modeOfFamily = (family: FamilyId): ResponseMode => FAMILY_MODE[family];

/** Modes the person's protectors use, and modes none of them use, both in the fixed RESPONSE_MODES order. */
export function modesInUse(families: ReadonlyArray<FamilyId>): { used: ResponseMode[]; unused: ResponseMode[] } {
  const seen = new Set(families.filter((family) => FAMILIES.includes(family)).map(modeOfFamily));
  return { used: RESPONSE_MODES.filter((mode) => seen.has(mode)), unused: RESPONSE_MODES.filter((mode) => !seen.has(mode)) };
}

export interface RegulationCounts { withIt: number; mixed: number; runsMe: number; unanswered: number }

export interface IntegrationProfile {
  /** The Centre awareness answer, 1–5, or null when not answered. */
  awareness: number | null;
  /** How many parts the person can be with, and how many run them, from the Toward answers. Counts, not a score. */
  regulation: RegulationCounts;
  /** Response modes the protectors use, and the ones they do not. */
  flexibility: { used: ResponseMode[]; unused: ResponseMode[] };
  /** Not measured by this instrument. Reflection questions stand in for it. */
  realityContact: null;
  /** Not measured by this instrument. Reflection questions stand in for it. */
  accountability: null;
}

const regulationBand = (option: BlendingOption | null): keyof RegulationCounts => {
  if (!option) return 'unanswered';
  const value = BLENDING_VALUE[option];
  if (value < 0) return 'withIt';
  return value >= 0.4 ? 'runsMe' : 'mixed';
};

/** Five capacities, kept apart. Nothing here is summed, ranked or compared with other people. */
export function integrationProfile(result: Pick<Assessment2Result, 'parts' | 'centre'>): IntegrationProfile {
  const regulation: RegulationCounts = { withIt: 0, mixed: 0, runsMe: 0, unanswered: 0 };
  const families: FamilyId[] = [];
  for (const part of result.parts) {
    if (part.kind !== 'protector' && part.kind !== 'exile') continue;
    regulation[regulationBand(part.blending)] += 1;
    if (part.kind === 'protector' && part.family) families.push(part.family);
  }
  const awareness = result.centre?.awareness;
  return {
    awareness: typeof awareness === 'number' && Number.isInteger(awareness) && awareness >= 1 && awareness <= 5 ? awareness : null,
    regulation,
    flexibility: modesInUse(families),
    realityContact: null,
    accountability: null,
  };
}
