// core/synastry-v2.ts — deterministic two-chart comparison (draft: core/data/synastry-v2.ts)
import { BOND_TYPES, SYNASTRY_DIM_LABELS } from '../i18n/strings';
import { hashStr, rngFrom, clamp01 } from './ports';
import type { ScoredProfile } from './scoring-v2';
import type { SynastryReport } from '../../app/core/data/synastry';
import type { SynastryResult as ScoredProfileSynastryResult } from '../../app/core/data/synastry-v2';

export interface SynastryResult {
  codeA: string;
  codeB: string;
  /** Missing on older saved reports created before engine-version tracking. */
  engineVersion?: 'code-seed-v1' | 'scored-profile-v2' | 'legacy64-v1';
  /** Full Angular 64-item report, omitted for profile-only/code-only comparisons. */
  legacy64?: SynastryReport;
  /** Full Angular 147-item scored-profile output, omitted for other engines. */
  scoredProfileV2?: ScoredProfileSynastryResult;
  bond: { id: string; en: string; ru: string };
  dims: { key: string; labelEn: string; labelRu: string; value: number }[];
  narrativeEn: string;
  narrativeRu: string;
}

export function synastry(codeA: string, codeB: string): SynastryResult {
  const seed = hashStr(codeA + '::' + codeB);
  const r = rngFrom(seed);
  const keys = Object.keys(SYNASTRY_DIM_LABELS);
  const dims = keys.map((k) => ({
    key: k,
    labelEn: SYNASTRY_DIM_LABELS[k].en,
    labelRu: SYNASTRY_DIM_LABELS[k].ru,
    value: Math.round(30 + r() * 68),
  }));
  const bond = BOND_TYPES[Math.floor(r() * BOND_TYPES.length)];
  const avg = Math.round(dims.reduce((a, b) => a + b.value, 0) / dims.length);
  return {
    codeA, codeB, engineVersion: 'code-seed-v1', bond, dims,
    narrativeEn: `${bond.en}-bond at ${avg}%. ${
      dims[1].value > 60 ? 'You carry overlapping burdens — powerful resonance, higher echo risk.' : 'Your burdens differ; you can borrow each other\'s calm.'
    } ${dims[2].value > 65 ? 'Watch polarization: your parts may tag-team.' : 'Polarization risk is low this cycle.'}`,
    narrativeRu: `Связь «${bond.ru}» — ${avg}%. ${
      dims[1].value > 60 ? 'Бремена пересекаются — сильный резонанс и риск эха.' : 'Бремена разные — можно занимать чужой покой.'
    } ${dims[2].value > 65 ? 'Следи за поляризацией: твои части могут работать в паре.' : 'Риск поляризации в этом цикле низкий.'}`,
  };
}

export function synFromProfiles(a: ScoredProfile | null, bCode: string): SynastryResult {
  const codeA = a ? String(hashStr(JSON.stringify(a.parts))) : 'ANON0000';
  return synastry(codeA.slice(0, 8).padEnd(8, 'X'), bCode.toUpperCase().slice(0, 8).padEnd(8, 'X'));
}
