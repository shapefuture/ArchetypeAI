import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslationService } from './translation.service';
import { IV_PARTS, loadLooks, type EyeKind, type IvPart, type MouthKind } from '../app/features/landing/stickers';
import { UNIVERSE_PART_COPY, UNIVERSE_FAMILY_META } from '../i18n/strings';
export type { PartUniverseCopy } from '../i18n/strings';

/**
 * Universe state + part data — the eager, dependency-light half of the old
 * webxr.service. zero-r-v3 boundary: state and data live on the critical
 * path (landing, results, panels), the three.js renderer does not — it is
 * dynamically imported on first universe entry and lives in its own chunk.
 */

// --- DATA STRUCTURES ---
export interface Archetype {
  id: string;
  name: string;
  coordinates: [number, number, number, number];
  color: string;
  size: number;
  symbol: string;
  description?: string;
  wound?: string;
  cluster?: string;
  quality?: string;
  shadow?: string;
  invitation: string;
  coreBelief: string;
  attracts: string;
  integratedForm?: string;
  /** Sticker character (satellite labels): body shape id from the part system. */
  shape?: string;
  /** Sticker character (satellite labels): eye + mouth glyph kinds. */
  glyph?: { e: EyeKind; m: MouthKind };
}

export interface Dimension {
  key: string;
  labels: { hypo: string, hyper: string };
  min: number;
  max: number;
}

export interface DimensionalExpressions {
  [key: string]: number; // from -1 to 1, with 0 being balanced
}

// --- DATA & CONSTANTS ---
export const DIMENSIONS_DATA: { [key: string]: { min: number, max: number, labels: { hypo: string, hyper: string } } } = {
  AGENCY: { min: -1.0, max: 1.0, labels: { hypo: 'Active', hyper: 'Receptive' } },
  TEMPERATURE: { min: -1.0, max: 1.0, labels: { hypo: 'Cool', hyper: 'Hot' } },
  FOCUS: { min: -1.0, max: 1.0, labels: { hypo: 'Self', hyper: 'Other' } },
  ATTACHMENT: { min: -1.0, max: 1.0, labels: { hypo: 'Avoidant', hyper: 'Anxious' } }
};
export const DIMENSION_KEYS = Object.keys(DIMENSIONS_DATA);
export const POSITION_SCALE = 10;

/** The part the genesis animation anchors on (the calm center of the map). */
export const GENESIS_ANCHOR_ID = 'sage';

export type ClusterId = 'managers' | 'firefighters' | 'exiles' | 'resources';

/** Family palette + inline RU/EN names (translations.ts is legacy-only). */
export const FAMILY_META: Record<ClusterId, { ru: string; en: string; color: string }> = {
  managers: { ...UNIVERSE_FAMILY_META.managers, color: '#E1734B' },
  firefighters: { ...UNIVERSE_FAMILY_META.firefighters, color: '#E58FA0' },
  exiles: { ...UNIVERSE_FAMILY_META.exiles, color: '#8F63C0' },
  resources: { ...UNIVERSE_FAMILY_META.resources, color: '#46A29D' },
};

const CLUSTER_BY_FAM: Record<string, ClusterId> = {
  manager: 'managers',
  firefighter: 'firefighters',
  exile: 'exiles',
  resource: 'resources',
};

/** Satellite visual mass per family. */
const SIZE_BY_FAM: Record<string, number> = {
  manager: 0.75,
  firefighter: 0.7,
  exile: 0.6,
  resource: 0.8,
};

export const PART_SYMBOL: Record<string, string> = {
  taskmaster: '📋', inner_critic: '🧐', pleaser: '🤝', controller: '🎛', analyst: '🔍',
  hermit: '🕯', bypasser: '🌫', numb: '🧊', rebel: '⚡', charmer: '💫',
  abandoned: '🕊', ashamed: '🥀', frightened: '👻', unseen: '🫥',
  sage: '🦉', warrior: '⚔️', caregiver: '🤲', explorer: '🧭',
};

/** Re-export for backward compatibility — data lives in strings.ts. */
export const PART_COPY = UNIVERSE_PART_COPY;

/** One universe archetype per IFS part: 0..100 axes → -1..1 coordinates. */
function partToArchetype(p: IvPart): Archetype {
  return {
    id: p.id,
    name: p.name[1], // RU-first; language switching falls back to this name
    coordinates: [
      (p.ax.ag - 50) / 50,
      (p.ax.te - 50) / 50,
      (p.ax.fo - 50) / 50,
      (p.ax.at - 50) / 50,
    ],
    color: p.color,
    size: SIZE_BY_FAM[p.fam] ?? 0.7,
    symbol: PART_SYMBOL[p.id] ?? '✦',
    cluster: CLUSTER_BY_FAM[p.fam],
    shape: p.shape,
    glyph: p.glyph,
    ...(PART_COPY[p.id] ?? {
      description: p.name[1],
      coreBelief: p.name[1],
      invitation: p.name[1],
      shadow: p.name[1],
      attracts: p.name[1],
    }),
  };
}

export const ALL_ARCHETYPES: Archetype[] = IV_PARTS.map(partToArchetype);

// --- INTELLIGENT RELATIONAL MAP ---
// Guard pairs (manager ↔ exile) plus same-family resonances, keyed by part id.
const RELATIONAL_MAP: { [key: string]: string[] } = {
  // managers
  taskmaster: ['rebel', 'caregiver', 'inner_critic'],
  inner_critic: ['ashamed', 'sage', 'taskmaster'],
  pleaser: ['abandoned', 'warrior', 'charmer'],
  controller: ['frightened', 'explorer', 'rebel'],
  analyst: ['unseen', 'frightened', 'sage'],
  hermit: ['abandoned', 'explorer', 'numb'],
  bypasser: ['ashamed', 'numb', 'charmer'],
  // firefighters
  numb: ['frightened', 'abandoned', 'caregiver'],
  rebel: ['controller', 'taskmaster', 'warrior'],
  charmer: ['unseen', 'pleaser', 'bypasser'],
  // exiles
  abandoned: ['pleaser', 'hermit', 'numb'],
  ashamed: ['inner_critic', 'bypasser', 'caregiver'],
  frightened: ['controller', 'analyst', 'sage'],
  unseen: ['analyst', 'charmer', 'caregiver'],
  // resources
  sage: ['inner_critic', 'frightened', 'analyst'],
  warrior: ['pleaser', 'rebel', 'controller'],
  caregiver: ['taskmaster', 'numb', 'ashamed'],
  explorer: ['controller', 'hermit', 'bypasser'],
};

function coordDistance(a: Archetype, b: Archetype): number {
  return Math.sqrt(a.coordinates.reduce((sum, coord, i) => sum + Math.pow(coord - b.coordinates[i], 2), 0));
}

/** Where a drawn relation comes from: an authored guard/resonance pair, or a coordinate-distance ranking. */
export type RelationSource = 'curated-template' | 'computed-proximity';
/** Every generated relation is an association to inspect, never a verdict about inner conflict. */
export type RelationStatus = 'association';

export interface PartRelation {
  targetId: string;
  source: RelationSource;
  status: RelationStatus;
}

export function buildPartRelations(source: Archetype, archetypes: Archetype[], limit = 4): PartRelation[] {
  const curated = RELATIONAL_MAP[source.id] || [];
  const curatedIds = new Set(curated);
  const scored = archetypes
    .filter(a => a.id !== source.id)
    .map(a => ({
      id: a.id,
      score: coordDistance(source, a)
        - (a.cluster && source.cluster && a.cluster === source.cluster ? 0.75 : 0)
        - (a.cluster === 'resources' ? 0.2 : 0),
    }))
    .sort((a, b) => a.score - b.score)
    .map(a => a.id);

  return Array.from(new Set([...curated, ...scored])).slice(0, limit).map((targetId) => ({
    targetId,
    source: curatedIds.has(targetId) ? 'curated-template' : 'computed-proximity',
    status: 'association',
  }));
}

export function buildDynamicRelationalIds(source: Archetype, archetypes: Archetype[], limit = 4): string[] {
  return buildPartRelations(source, archetypes, limit).map(relation => relation.targetId);
}

/** Effective sticker look for a part: persisted user override ?? part defaults.
 *  Pure data — the single source of truth shared by the 3D satellite labels
 *  and every DOM surface (detail card hero, related chips). */
export function effectiveLook(archetype: Archetype): { shape: string; color: string; eye: EyeKind; mouth: MouthKind } {
  const override = loadLooks()[archetype.id];
  if (override) {
    return {
      shape: override.shape,
      color: override.color,
      eye: override.eye as EyeKind,
      mouth: override.mouth as MouthKind,
    };
  }
  return {
    shape: archetype.shape ?? 'taskmaster',
    color: archetype.color,
    eye: archetype.glyph?.e ?? 'dot',
    mouth: archetype.glyph?.m ?? 'smile',
  };
}

/**
 * Eager universe state: part data + selection/comparison/filter signals.
 * Panels that exist BEFORE the universe loads bind to this service; the
 * three.js renderer (VisualizationService, lazy chunk) reads and writes the
 * same signals, so there is exactly one source of truth.
 */
@Injectable({ providedIn: 'root' })
export class UniverseStateService {
  private readonly translationService = inject(TranslationService);

  readonly allArchetypes = signal<Archetype[]>(ALL_ARCHETYPES);

  readonly dimensions = computed<Dimension[]>(() => {
    const lang = this.translationService.getLanguage(); // trigger reactivity
    return Object.entries(DIMENSIONS_DATA).map(([key, value]) => ({
      key,
      ...value,
      labels: {
        hypo: this.translationService.t(`${key.toLowerCase()}Hypo`, 'universe.dimensions'),
        hyper: this.translationService.t(`${key.toLowerCase()}Hyper`, 'universe.dimensions')
      }
    }));
  });

  readonly allClusters = computed(() => {
    const lang = this.translationService.getLanguage(); // trigger reactivity
    const clusters = new Set(this.allArchetypes().map(a => a.cluster).filter(Boolean) as string[]);
    return Array.from(clusters).map(id => ({
      id,
      // The four IFS families have inline RU/EN names; anything else
      // (e.g. AI-generated clusters) falls back to the legacy translations.
      name: FAMILY_META[id as ClusterId]?.[lang === 'en' ? 'en' : 'ru']
        ?? this.translationService.t(id, 'universe.clusterNames')
    }));
  });

  readonly focusedArchetype = signal<Archetype | null>(null);
  readonly selectedArchetype = signal<Archetype | null>(null);
  readonly isolatedDimension = signal<string | null>(null);
  readonly personalConstellation = signal<{ archetypeId: string, percentage: number }[] | null>(null);

  // Comparison state
  readonly isComparing = signal(false);
  readonly firstComparisonArchetype = signal<Archetype | null>(null);

  readonly dimensionalExpressions = signal<DimensionalExpressions>({ AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 });
  readonly activeClusterFilters = signal<Set<string>>(new Set<string>());

  setComparisonState(isComparing: boolean, firstArchetype: Archetype | null): void {
    this.isComparing.set(isComparing);
    this.firstComparisonArchetype.set(firstArchetype);
  }

  updateDimensionalExpressions(expressions: DimensionalExpressions): void {
    this.dimensionalExpressions.set(expressions);
  }

  setClusterFilters(filters: Set<string>): void {
    this.activeClusterFilters.set(filters);
  }
}
