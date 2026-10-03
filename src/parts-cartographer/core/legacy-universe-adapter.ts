import { hashStr } from './ports';
import {
  EYES,
  FACES,
  HEADS,
  MOUTHS,
  SHAPES,
  type ArchetypeMapData,
  type Family,
  type Part,
  type Traits,
} from '../pal/traits';
import type { ScoredArchetype } from '../../app/core/data/scoring';
import type { LegacyAssessmentReport } from '../screens/legacy-report-data';
import type { LegacyAiArchetype } from './legacy-ai-analysis';

const FAMILY_COLOR: Record<Family, string> = {
  manager: '#3B9BFF',
  firefighter: '#FF8A1F',
  exile: '#FF2D8A',
  resource: '#3EE0B0',
};

function familyFor(partType: string): Family {
  if (partType === 'manager' || partType === 'firefighter' || partType === 'exile') return partType;
  return 'resource';
}

function coordinateTuple(value: unknown): [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4) return [0, 0, 0, 0];
  return value.map((entry) => {
    const number = Number(entry);
    return Number.isFinite(number) ? Math.max(-1, Math.min(1, number)) : 0;
  }) as [number, number, number, number];
}

function deterministicTraits(id: string, family: Family): Traits {
  const seed = hashStr(id);
  const take = <T,>(items: readonly T[], offset: number) => items[Math.abs(seed + offset) % items.length];
  return {
    shape: take(SHAPES, 1),
    color: FAMILY_COLOR[family],
    eyes: take(EYES, 7),
    mouth: take(MOUTHS, 13),
    head: take(HEADS, 19),
    face: take(FACES, 23),
    bow: Math.abs(seed % 2) === 0,
    cheeks: Math.abs(seed % 3) === 0,
  };
}

function aiArchetype(item: LegacyAiArchetype | undefined, base: ScoredArchetype): ScoredArchetype | LegacyAiArchetype {
  return item ?? base;
}

/**
 * Create stable, coordinate-bearing map Parts from a completed 64-item report.
 * The deterministic pantheon owns IDs, cluster, placement, and prominence so
 * changing language or switching narrative mode cannot move the constellation.
 * AI-authored text may replace matching entries; missing entries stay local.
 */
export function buildLegacyUniverseParts(report: LegacyAssessmentReport, aiMode = false): Part[] {
  const aiPantheon = aiMode && report.aiAnalysis ? report.aiAnalysis.pantheon : [];
  return report.archetypes.map((base, index) => {
    const content = aiArchetype(aiPantheon[index], base);
    const coordinates = coordinateTuple(base.coordinates);
    const cluster = String(base.cluster || 'gift_archetypes').replace(/[^a-z0-9_]/gi, '_');
    const coordinateId = coordinates.map((value) => Math.round(value * 100)).join('_');
    const id = `legacy64_${cluster}_${coordinateId}_${index}`;
    const family = familyFor(base.partType);
    const prominence = Math.max(0, Math.min(100, Number(base.prominence) || 0));
    const size = Math.max(0.4, Math.min(1.1, Number(base.size) || 0.8));
    const archetype: ArchetypeMapData = {
      schema: 'archetype-map.v1',
      sourceAssessment: 'legacy64',
      coordinates,
      cluster: base.cluster,
      prominence,
      size,
      partType: base.partType,
      developmentalOrigin: base.developmentalOrigin,
      description: content.description,
      wound: content.wound,
      shadow: content.shadow,
      invitation: content.invitation,
      coreBelief: content.coreBelief,
      attracts: content.attracts,
    };
    const name = String(content.name || base.name).trim().slice(0, 100) || base.name;
    const description = String(content.description || base.description).trim().slice(0, 700);
    const wound = String(content.wound || base.wound).trim().slice(0, 500);
    const invitation = String(content.invitation || base.invitation).trim().slice(0, 500);
    return {
      id,
      name,
      family,
      traits: { ...deterministicTraits(id, family), characterSeed: hashStr(id) },
      role: description,
      blurb: String(content.shadow || base.shadow || description).trim().slice(0, 700),
      energy: prominence,
      burden: wound,
      need: invitation,
      voice: String(content.coreBelief || content.attracts || base.coreBelief || base.attracts).trim().slice(0, 500),
      star: false,
      since: report.language === 'ru' ? 'по результатам оценки' : 'from relational assessment',
      archetype,
    } satisfies Part;
  });
}
