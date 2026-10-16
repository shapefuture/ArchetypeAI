import {
  DESCRIPTION_TEMPLATES, WOUND_TEMPLATES, SHADOW_TEMPLATES,
  INVITATION_TEMPLATES, CORE_BELIEF_TEMPLATES, ATTRACTS_TEMPLATES,
  SCORING_NAME_POOLS,
} from '../../i18n/strings';

/**
 * Deterministic Archetype Scoring Engine
 *
 * Generates personal archetypes purely from assessment pole scores.
 * No AI involved — same answers always produce identical results.
 */

// --- Types ---

export interface PoleScores {
  agencyActive: number;
  agencyReceptive: number;
  tempHot: number;
  tempCool: number;
  focusOther: number;
  focusSelf: number;
  attAnxious: number;
  attAvoidant: number;
  healthScore: number;
  disorganizedAttachment: boolean;
  center: [number, number, number, number]; // [AGENCY, TEMPERATURE, FOCUS, ATTACHMENT]
}

export type PartType = 'manager' | 'firefighter' | 'exile' | 'self';
export type DevelopmentalOrigin = 'pre_verbal' | 'early_attachment' | 'oedipal' | 'latency' | 'adolescent';

export interface ScoredArchetype {
  name: string;
  symbol: string;
  coordinates: [number, number, number, number];
  cluster: string;
  prominence: number;
  size: number;
  description: string;
  wound: string;
  shadow: string;
  invitation: string;
  coreBelief: string;
  attracts: string;
  partType: PartType;
  developmentalOrigin: DevelopmentalOrigin;
  disorganizedModifier: boolean;
  gestalt?: string; // named cross-dimensional pattern, if detected
}

// --- Pole Score Computation ---

/**
 * Dimension weights for center calculation.
 * Attachment has 16 questions (8 per pole) vs 12 for other dimensions (6 per pole).
 * Without weighting, Attachment's center estimate has lower variance (more reliable),
 * giving it disproportionate influence on cluster assignment and coordinate placement.
 * The weight factor equalizes statistical influence across dimensions.
 * Set to 0.75 = sqrt(12/16) ≈ 0.87 adjusted down for calibration.
 */
const ATTACHMENT_WEIGHT = 0.75;

/**
 * Computes the average of responses in [start, end), normalized to [-1, 1].
 * Positive-pole sections (receptive, hot, other-focused, anxious) are active when > 0.
 * Negative-pole sections (active, cool, self-focused, avoidant) are keyed with invert=true
 * and are active when < 0. Use positivePoleStrength/negativePoleStrength for trait intensity.
 */
function takeAvg(responses: number[], start: number, end: number, invert = false): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i++) {
    if (responses[i]) {
      const val = (responses[i] - 3) / 2;
      sum += invert ? -val : val;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Computes raw sum of responses in [start, end).
 * Used for the spec-correct difference scoring formula.
 */
function rawSum(responses: number[], start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) {
    if (responses[i]) {
      sum += responses[i];
    }
  }
  return sum;
}

export function computePoleScores(responses: number[]): PoleScores {
  // Individual pole strengths (normalized [-1, 1])
  const agencyActive = takeAvg(responses, 0, 6, true);
  const agencyReceptive = takeAvg(responses, 6, 12, false);
  const tempHot = takeAvg(responses, 12, 18, false);
  const tempCool = takeAvg(responses, 18, 24, true);
  const focusOther = takeAvg(responses, 24, 30, false);
  const focusSelf = takeAvg(responses, 30, 36, true);
  const attAnxious = takeAvg(responses, 36, 44, false);
  const attAvoidant = takeAvg(responses, 44, 52, true);

  // Health score: 0.0–1.0 scale across the answered 1..5 range.
  // A response of 1 should contribute 0 health, 5 should contribute full health.
  const healthSum = rawSum(responses, 52, 64);
  const healthAnswered = responses.slice(52, 64).filter(r => r > 0).length;
  const healthScore = clamp01(healthAnswered > 0
    ? (healthSum - healthAnswered) / (healthAnswered * 4)
    : 0);

  const disorganizedAttachment = positivePoleStrength(attAnxious) > 0.25
    && negativePoleStrength(attAvoidant) > 0.25;

  // Dimension centers use the spec-correct DIFFERENCE formula:
  //   center = (sum(poleA) - sum(poleB)) / normalizer
  // This directly captures which pole dominates, avoiding the bug where
  // averaging two opposite-signed poles cancels to zero.
  const agencyCenter = clamp((rawSum(responses, 6, 12) - rawSum(responses, 0, 6)) / 24);
  const tempCenter = clamp((rawSum(responses, 12, 18) - rawSum(responses, 18, 24)) / 24);
  const focusCenter = clamp((rawSum(responses, 24, 30) - rawSum(responses, 30, 36)) / 24);
  const attCenter = clamp((rawSum(responses, 36, 44) - rawSum(responses, 44, 52)) / 32 * ATTACHMENT_WEIGHT);

  const center: [number, number, number, number] = [
    agencyCenter,
    tempCenter,
    focusCenter,
    attCenter,
  ];

  return {
    agencyActive, agencyReceptive,
    tempHot, tempCool,
    focusOther, focusSelf,
    attAnxious, attAvoidant,
    healthScore,
    disorganizedAttachment,
    center,
  };
}

function clamp(v: number, lo = -1, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function positivePoleStrength(v: number): number {
  return clamp01(v);
}

export function negativePoleStrength(v: number): number {
  return clamp01(-v);
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

function deriveDevelopmentalOrigin(responses: number[], poles: PoleScores): DevelopmentalOrigin {
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const avoidantStrength = negativePoleStrength(poles.attAvoidant);
  const selfFocusStrength = negativePoleStrength(poles.focusSelf);
  const activeStrength = negativePoleStrength(poles.agencyActive);

  if (emotionalVariance < 0.3 && avoidantStrength > 0.4) return 'pre_verbal';
  if (emotionalVariance < 0.5 && avoidantStrength > 0.3) return 'early_attachment';
  if (selfFocusStrength > 0.4 && activeStrength > 0.3) return 'oedipal';
  if (selfFocusStrength > 0.3) return 'latency';
  return 'adolescent';
}

/**
 * Per-archetype developmental origin.
 * Uses the archetype's own coordinates to determine its developmental era,
 * rather than the global person-level analysis.
 */
function deriveArchetypeOrigin(
  coords: [number, number, number, number],
  globalOrigin: DevelopmentalOrigin
): DevelopmentalOrigin {
  const [agency, temperature, focus, attachment] = coords;

  // Pre-verbal: extreme avoidant detachment + emotional flatness
  if (attachment < -0.5 && temperature < -0.2) return 'pre_verbal';

  // Early attachment: anxious attachment patterns (positive attachment coord)
  if (attachment > 0.3) return 'early_attachment';

  // Also early attachment: avoidant with emotional intensity
  if (attachment < -0.3 && temperature > 0.2) return 'early_attachment';

  // Oedipal: self-focused + active agency
  if (focus < -0.3 && agency < -0.2) return 'oedipal';

  // Latency: self-focused but less active
  if (focus < -0.3) return 'latency';

  // Gift/self archetypes near center: inherit global origin
  if (Math.abs(agency) < 0.2 && Math.abs(temperature) < 0.2 && Math.abs(attachment) < 0.2) {
    return globalOrigin;
  }

  // Default: adolescent
  return 'adolescent';
}

// --- Name & Symbol Pools per Cluster ---

const NAME_POOLS = SCORING_NAME_POOLS;

const SYMBOL_POOLS: Record<string, string[]> = {
  control_shadows:     ['⚔️', '🛡️', '⚙️', '🏰', '🔱', '🗝️', '🔩', '🏛️', '📊', '🎯'],
  emotional_storm_shadows: ['🌋', '🔥', '⚡', '🌪️', '💥', '🌩️', '🌊', '☄️', '💫', '🔥'],
  avoidant_intellectual_shadows: ['❄️', '🔬', '🧊', '🔭', '💎', '🪞', '🏔️', '❄️', '🌀', '♟️'],
  anxious_connection_shadows: ['🌸', '🕸️', '💔', '🫂', '🧵', '🪢', '💝', '🌿', '🪷', '🕊️'],
  seductive_avoidance_shadows: ['🔮', '🎭', '🌹', '🃏', '🧜‍♀️', '🪩', '🕷️', '🎴', '🦚', '🌙'],
  gift_archetypes:     ['✨', '🌟', '🌳', '💎', '🌊', '🌅', '🦋', '🌈', '💫', '♾️'],
  disorganized_attachment_shadows: ['💫', '🔮', '🌙', '🎭', '⚡', '🌀', '🗝️', '🪞', '🖤', '♾️'],
};

// --- Description Templates (1-2 sentences per archetype) ---


// --- Deterministic Hash ---

function hashCoordinates(coords: number[]): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (const c of coords) {
    // Quantize to 2 decimal places for stability
    const quantized = Math.round(c * 100);
    h = h ^ quantized;
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0); // unsigned
}

function pickFromPool<T>(pool: T[], hash: number): T {
  return pool[Math.abs(hash) % pool.length];
}

// --- Cluster Assignment ---

function assignCluster(coords: [number, number, number, number], poles: PoleScores): string {
  const [agency, temperature, focus, attachment] = coords;

  // Gift check: healthy relational patterns near center
  if (poles.healthScore > 0.35 && Math.abs(agency) < 0.4 && Math.abs(temperature) < 0.4) {
    return 'gift_archetypes';
  }

  // Balanced/undifferentiated: all poles near zero = no strong shadow tendency
  const maxAbs = Math.max(Math.abs(agency), Math.abs(temperature), Math.abs(focus), Math.abs(attachment));
  if (maxAbs < 0.15) {
    return 'gift_archetypes';
  }

  // Seductive avoidance: hot, self-focused, avoidant
  if (temperature > 0.2 && focus < -0.1 && attachment < -0.3) {
    return 'seductive_avoidance_shadows';
  }

  // Control: active + cool
  if (agency < -0.2 && temperature < -0.1) {
    return 'control_shadows';
  }

  // Emotional storm: active + hot
  if (agency < -0.2 && temperature > 0.2) {
    return 'emotional_storm_shadows';
  }

  // Avoidant intellectual: receptive + cool
  if (agency > 0.2 && temperature < -0.1) {
    return 'avoidant_intellectual_shadows';
  }

  // Anxious connection: receptive + hot
  if (agency > 0.2 && temperature > 0.2) {
    return 'anxious_connection_shadows';
  }

  // Default fallback: use attachment as tiebreaker
  if (attachment < -0.1) {
    return agency < 0 ? 'control_shadows' : 'avoidant_intellectual_shadows';
  }
  return agency < 0 ? 'emotional_storm_shadows' : 'anxious_connection_shadows';
}

// --- Wound/Shadow Templates per Cluster ---






// --- Main Generation ---

export function generateArchetypes(responses: number[], lang: 'en' | 'ru' = 'en'): {
  archetypes: ScoredArchetype[];
  dynamics: PartsDynamic[];
} {
  const poles = computePoleScores(responses);
  const profiles = buildProfiles(poles);
  const origin = deriveDevelopmentalOrigin(responses, poles);

  if (profiles.length === 0) {
    // Edge case: all quiet dimensions — create one archetype at center
    profiles.push({ poles: [], center: [...poles.center] as [number, number, number, number], rawScore: 0.1, primaryStrength: 0.1 });
  }

  // Compute raw prominence from profile scores
  const totalRaw = profiles.reduce((sum, p) => sum + p.rawScore, 0);

  const getPool = (pools: Record<string, Record<string, string[]>>, cluster: string): string[] => {
    return pools[cluster]?.[lang] || pools[cluster]?.['en'] || pools['gift_archetypes']?.[lang] || pools['gift_archetypes']?.['en'] || [];
  };

  const archetypes: ScoredArchetype[] = profiles.map(profile => {
    const coords = profile.center.map(c => clamp(c)) as [number, number, number, number];
    const cluster = assignCluster(coords, poles);
    const h = hashCoordinates(coords);

    const namePool = getPool(NAME_POOLS, cluster);
    const symbolPool = SYMBOL_POOLS[cluster] || SYMBOL_POOLS['gift_archetypes'];
    const descPool = getPool(DESCRIPTION_TEMPLATES, cluster);
    const woundPool = getPool(WOUND_TEMPLATES, cluster);
    const shadowPool = getPool(SHADOW_TEMPLATES, cluster);
    const invitationPool = getPool(INVITATION_TEMPLATES, cluster);
    const beliefPool = getPool(CORE_BELIEF_TEMPLATES, cluster);
    const attractsPool = getPool(ATTRACTS_TEMPLATES, cluster);

    const prominence = totalRaw > 0 ? Math.round((profile.rawScore / totalRaw) * 100) : Math.round(100 / profiles.length);
    const size = clamp(0.4 + profile.primaryStrength * 0.6, 0.4, 1.0);

    // Determine if this archetype carries the disorganized modifier.
    // Set on archetypes originating from the attachment dimension when the person
    // has disorganized attachment (both anxious and avoidant poles active).
    const hasDisorganizedModifier = poles.disorganizedAttachment
      && profile.poles.some(p => p.dimension === 3);

    const partType: PartType = cluster === 'control_shadows' || cluster === 'avoidant_intellectual_shadows'
      ? 'manager'
      : cluster === 'emotional_storm_shadows' || cluster === 'seductive_avoidance_shadows'
        ? 'firefighter'
        : cluster === 'anxious_connection_shadows' || cluster === 'disorganized_attachment_shadows'
          ? 'exile'
          : 'self';

    return {
      name: pickFromPool(namePool, h),
      symbol: pickFromPool(symbolPool, h + 1),
      coordinates: coords,
      cluster,
      prominence,
      size: Math.round(size * 100) / 100,
      description: pickFromPool(descPool, h + 7),
      wound: pickFromPool(woundPool, h + 2),
      shadow: pickFromPool(shadowPool, h + 3),
      invitation: pickFromPool(invitationPool, h + 4),
      coreBelief: pickFromPool(beliefPool, h + 5),
      attracts: pickFromPool(attractsPool, h + 6),
      partType,
      developmentalOrigin: deriveArchetypeOrigin(coords, origin),
      disorganizedModifier: hasDisorganizedModifier,
      gestalt: profile.gestalt,
    };
  });

  // Normalize prominence to sum exactly to 100
  normalizeProminence(archetypes);

  // Resolve name collisions: if two archetypes share a name, disambiguate
  // by re-hashing with the archetype's index as a secondary seed
  deduplicateNames(archetypes);

  return { archetypes, dynamics: generatePartsDynamics(archetypes, lang) };
}

// --- Profile Builder ---

interface ArchetypeProfile {
  poles: { dimension: number; pole: 'positive' | 'negative'; value: number }[];
  center: [number, number, number, number];
  rawScore: number;
  primaryStrength: number; // pre-merge strength for size calculation
  gestalt?: string; // named cross-dimensional pattern
}

function buildProfiles(poles: PoleScores): ArchetypeProfile[] {
  const dims: { pos: number; neg: number; idx: number }[] = [
    { pos: poles.agencyReceptive, neg: poles.agencyActive, idx: 0 },
    { pos: poles.tempHot,          neg: poles.tempCool,      idx: 1 },
    { pos: poles.focusOther,       neg: poles.focusSelf,     idx: 2 },
    { pos: poles.attAnxious,       neg: poles.attAvoidant,   idx: 3 },
  ];

  const profiles: ArchetypeProfile[] = [];

  // --- Gestalt detection: cross-dimensional coherent patterns ---
  // These take precedence over individual dimension profiles when 2+ dimensions align.
  const gestalts: { name: string; coords: [number, number, number, number]; dimensions: number[]; strength: number }[] = [];

  const [aC, tC, fC, attC] = poles.center;

  // "Stoic Fortress" — active + cool (agency active + temperature cool)
  if (aC < -0.3 && tC < -0.2) {
    gestalts.push({
      name: 'Stoic Fortress',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(-aC, -tC),
    });
  }

  // "Volcanic Yearning" — active + hot
  if (aC < -0.3 && tC > 0.2) {
    gestalts.push({
      name: 'Volcanic Yearning',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(-aC, tC),
    });
  }

  // "Distant Observer" — receptive + cool
  if (aC > 0.3 && tC < -0.2) {
    gestalts.push({
      name: 'Distant Observer',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(aC, -tC),
    });
  }

  // "Tender Flame" — receptive + hot
  if (aC > 0.3 && tC > 0.2) {
    gestalts.push({
      name: 'Tender Flame',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(aC, tC),
    });
  }

  // "Walled Garden" — self-focused + avoidant
  if (fC < -0.3 && attC < -0.2) {
    gestalts.push({
      name: 'Walled Garden',
      coords: [aC * 0.5, tC * 0.5, fC, attC],
      dimensions: [2, 3],
      strength: Math.min(-fC, -attC),
    });
  }

  // "Open Wound" — other-focused + anxious
  if (fC > 0.3 && attC > 0.2) {
    gestalts.push({
      name: 'Open Wound',
      coords: [aC * 0.5, tC * 0.5, fC, attC],
      dimensions: [2, 3],
      strength: Math.min(fC, attC),
    });
  }

  // Track which dimensions are consumed by gestalts
  const gestaltDims = new Set(gestalts.flatMap(g => g.dimensions));

  // Add gestalt profiles
  for (const g of gestalts) {
    profiles.push({
      poles: g.dimensions.map(d => ({ dimension: d, pole: poles.center[d] >= 0 ? 'positive' as const : 'negative' as const, value: poles.center[d] })),
      center: g.coords.map(c => clamp(c)) as [number, number, number, number],
      rawScore: g.strength,
      primaryStrength: g.strength,
      gestalt: g.name,
    });
  }

  // For each dimension, create an archetype at the dominant pole position.
  // If there's tension (both poles active), create TWO archetypes for that dimension.
  for (const dim of dims) {
    // Skip dimensions already captured by a gestalt pattern
    if (gestaltDims.has(dim.idx)) continue;

    const posStr = positivePoleStrength(dim.pos);
    const negStr = negativePoleStrength(dim.neg);
    const posProfile = { pole: 'positive' as const, value: posStr, strength: posStr };
    const negProfile = { pole: 'negative' as const, value: -negStr, strength: negStr };

    // Primary pole: whichever is stronger
    const primary = posStr >= negStr ? posProfile : negProfile;

    if (primary.strength > 0.05) {
      // Build coordinates: use the primary pole for this dimension, user center for others
      // but nudge other dimensions slightly to create spread
      const coords: number[] = [...poles.center];
      coords[dim.idx] = primary.value;

      // Add slight offsets to adjacent dimensions so archetypes don't cluster too tightly
      for (let i = 0; i < 4; i++) {
        if (i !== dim.idx) {
          coords[i] = clamp(coords[i] * 0.85 + primary.value * 0.15);
        }
      }

      profiles.push({
        poles: [{ dimension: dim.idx, pole: primary.pole, value: primary.value }],
        center: coords.map(c => clamp(c)) as [number, number, number, number],
        rawScore: primary.strength,
        primaryStrength: primary.strength,
      });
    }

    // Secondary archetype for tension: if the weaker pole is also significant
    const secondary = posStr >= negStr ? negProfile : posProfile;

    if (secondary.strength > 0.15 && Math.abs(secondary.value - primary.value) > 0.15) {
      const coords: number[] = [...poles.center];
      coords[dim.idx] = secondary.value;

      for (let i = 0; i < 4; i++) {
        if (i !== dim.idx) {
          coords[i] = clamp(coords[i] * 0.9 + secondary.value * 0.1);
        }
      }

      profiles.push({
        poles: [{ dimension: dim.idx, pole: secondary.pole, value: secondary.value }],
        center: coords.map(c => clamp(c)) as [number, number, number, number],
        rawScore: secondary.strength * 0.7, // Secondary archetype gets less prominence
        primaryStrength: secondary.strength * 0.7,
      });
    }
  }

  // Add a gift archetype if the user has healthy relational patterns
  // OR if all dimensions are near zero (balanced = healthy center)
  const allNearZero = dims.every(d => positivePoleStrength(d.pos) < 0.15 && negativePoleStrength(d.neg) < 0.15);
  if (poles.healthScore > 0.2 || allNearZero) {
    const giftCoords: number[] = poles.center.map(v => clamp(v * 0.4));
    const existingGift = profiles.some(p =>
      euclidean(p.center, giftCoords) < 0.5
    );
    if (!existingGift) {
      profiles.push({
        poles: [],
        center: giftCoords as [number, number, number, number],
        rawScore: Math.max(poles.healthScore * 1.5, allNearZero ? 0.3 : 0),
        primaryStrength: Math.max(poles.healthScore * 1.5, allNearZero ? 0.3 : 0),
      });
    }
  }

  // Edge case: no profiles generated (all answers near center)
  // Create a single balanced archetype at the actual center — this is real data
  if (profiles.length === 0) {
    profiles.push({
      poles: [],
      center: [...poles.center] as [number, number, number, number],
      rawScore: 0.1,
      primaryStrength: 0.1,
    });
  }

  return deduplicateProfiles(profiles);
}

function deduplicateProfiles(profiles: ArchetypeProfile[]): ArchetypeProfile[] {
  const MERGE_THRESHOLD = 0.4;

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const dist = euclidean(profiles[i].center, profiles[j].center);
      if (dist < MERGE_THRESHOLD) {
        // Merge j into i (weighted by rawScore)
        const total = profiles[i].rawScore + profiles[j].rawScore;
        const wI = profiles[i].rawScore / total;
        const wJ = profiles[j].rawScore / total;
        profiles[i].center = profiles[i].center.map((c, k) =>
          clamp(c * wI + profiles[j].center[k] * wJ)
        ) as [number, number, number, number];
        profiles[i].rawScore = total;
        profiles.splice(j, 1);
        j--; // recheck index
      }
    }
  }

  // Cap at 8 archetypes, keep highest rawScore
  if (profiles.length > 8) {
    profiles.sort((a, b) => b.rawScore - a.rawScore);
    profiles.length = 8;
  }

  return profiles;
}

export function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

// --- Parts Dynamics (IFS) ---

export interface PartsDynamic {
  protector: string;
  protects: string;
  mechanism: 'manages' | 'firefights' | 'carries_wound';
  description: string;
}

export function generatePartsDynamics(archetypes: ScoredArchetype[], lang: 'en' | 'ru' = 'en'): PartsDynamic[] {
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');
  const selfParts = archetypes.filter(a => a.partType === 'self');

  const dynamics: PartsDynamic[] = [];

  for (const mgr of managers) {
    if (exiles.length === 0) break;
    const nearest = exiles.reduce((best, ex) =>
      euclidean(mgr.coordinates, ex.coordinates) < euclidean(mgr.coordinates, best.coordinates) ? ex : best
    , exiles[0]);
    dynamics.push({
      protector: mgr.name,
      protects: nearest.name,
      mechanism: 'manages',
      description: lang === 'ru'
        ? `${mgr.name} управляет, чтобы защитить рану ${nearest.name}`
        : `${mgr.name} manages to protect ${nearest.name}'s wound`,
    });
  }

  for (const ff of firefighters) {
    if (managers.length === 0) break;
    const nearest = managers.reduce((best, mgr) =>
      euclidean(ff.coordinates, mgr.coordinates) < euclidean(ff.coordinates, best.coordinates) ? mgr : best
    , managers[0]);
    dynamics.push({
      protector: ff.name,
      protects: nearest.name,
      mechanism: 'firefights',
      description: lang === 'ru'
        ? `${ff.name} реактивно включается, когда ${nearest.name} не справляется`
        : `${ff.name} reactively takes over when ${nearest.name} fails`,
    });
  }

  // When no managers/firefighters exist, create dynamics from exile-to-exile
  // or exile-to-self interactions (wound carrying patterns)
  if (dynamics.length === 0 && exiles.length >= 2) {
    for (let i = 0; i < exiles.length - 1; i++) {
      dynamics.push({
        protector: exiles[i].name,
        protects: exiles[i + 1].name,
        mechanism: 'carries_wound',
        description: lang === 'ru'
          ? `${exiles[i].name} несёт рану, перекликающуюся с ${exiles[i + 1].name}`
          : `${exiles[i].name} carries a wound that resonates with ${exiles[i + 1].name}`,
      });
    }
  }

  // Self-to-exile dynamics: when self parts exist alongside exiles
  if (dynamics.length === 0 && selfParts.length > 0 && exiles.length > 0) {
    for (const self of selfParts) {
      const nearest = exiles.reduce((best, ex) =>
        euclidean(self.coordinates, ex.coordinates) < euclidean(self.coordinates, best.coordinates) ? ex : best
      , exiles[0]);
      dynamics.push({
        protector: self.name,
        protects: nearest.name,
        mechanism: 'carries_wound',
        description: lang === 'ru'
          ? `${self.name} стремится исцелить рану ${nearest.name}`
          : `${self.name} holds space for ${nearest.name}'s wound`,
      });
    }
  }

  // Fallback: single exile carries its own wound
  if (dynamics.length === 0 && exiles.length === 1) {
    dynamics.push({
      protector: exiles[0].name,
      protects: exiles[0].name,
      mechanism: 'carries_wound',
      description: lang === 'ru'
        ? `${exiles[0].name} несёт рану: «${exiles[0].wound}»`
        : `${exiles[0].name} carries the wound: "${exiles[0].wound}"`,
    });
  }

  return dynamics;
}

/**
 * Resolves name collisions across archetypes.
 * If two archetypes share the same name, the second one is re-picked
 * from its name pool using the archetype index as a disambiguation seed.
 */
function deduplicateNames(archetypes: ScoredArchetype[]): void {
  const seen = new Set<string>();
  for (let i = 0; i < archetypes.length; i++) {
    const a = archetypes[i];
    if (seen.has(a.name)) {
      // Re-hash from coordinates with archetype index as secondary seed
      const pool = NAME_POOLS[a.cluster]?.['en'] || NAME_POOLS['gift_archetypes']?.['en'] || [];
      if (pool.length > 0) {
        const newHash = hashCoordinates(a.coordinates) + i * 31;
        a.name = pool[Math.abs(newHash) % pool.length];
      }
    }
    seen.add(a.name);
  }
}

function normalizeProminence(archetypes: ScoredArchetype[]): void {
  if (archetypes.length === 0) return;

  const sum = archetypes.reduce((s, a) => s + a.prominence, 0);
  if (sum === 0) {
    const equal = Math.round(100 / archetypes.length);
    archetypes.forEach(a => a.prominence = equal);
  }

  // Distribute rounding error to the largest archetype
  const currentSum = archetypes.reduce((s, a) => s + a.prominence, 0);
  const diff = 100 - currentSum;
  if (diff !== 0) {
    const largest = archetypes.reduce((max, a) => a.prominence > max.prominence ? a : max, archetypes[0]);
    largest.prominence += diff;
  }
}

// =============================================================================
// Phase 2: Clinical-Grade Computed Analyses
// =============================================================================

// --- 2.1 Complex Detection (Jungian) ---

export interface Complex {
  name: string;
  nameRu: string;
  coreWound: string;
  coreWoundRu: string;
  contributingArchetypes: string[];
  defensePattern: string;
  defensePatternRu: string;
  developmentalEra: DevelopmentalOrigin;
  severity: number; // 0-1
}

export function detectComplexes(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): Complex[] {
  const complexes: Complex[] = [];
  const clusterSet = new Set(archetypes.map(a => a.cluster));
  const origins = archetypes.map(a => a.developmentalOrigin);

  // Abandonment Complex: anxious_connection + emotional_storm
  if (clusterSet.has('anxious_connection_shadows') && clusterSet.has('emotional_storm_shadows')) {
    const anxProm = archetypes.filter(a => a.cluster === 'anxious_connection_shadows').reduce((s, a) => s + a.prominence, 0);
    const stormProm = archetypes.filter(a => a.cluster === 'emotional_storm_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Abandonment Complex',
      nameRu: 'Комплекс покинутости',
      coreWound: 'Deep terror of abandonment drives desperate clinging and volcanic protest when connection feels threatened',
      coreWoundRu: 'Глубокий ужас покинутости ведёт к отчаянному цеплянию и вулканическому протесту, когда связь кажется под угрозой',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'anxious_connection_shadows' || a.cluster === 'emotional_storm_shadows'
      ).map(a => a.name),
      defensePattern: 'Protest behavior escalating to emotional storms when attachment feels insecure',
      defensePatternRu: 'Протестное поведение, перерастающее в эмоциональные бури, когда привязанность кажется небезопасной',
      developmentalEra: origins.includes('pre_verbal') ? 'pre_verbal' : 'early_attachment',
      severity: clamp((anxProm + stormProm) / 200, 0, 1),
    });
  }

  // Fortress Complex: control + avoidant_intellectual
  if (clusterSet.has('control_shadows') && clusterSet.has('avoidant_intellectual_shadows')) {
    const ctrlProm = archetypes.filter(a => a.cluster === 'control_shadows').reduce((s, a) => s + a.prominence, 0);
    const avdProm = archetypes.filter(a => a.cluster === 'avoidant_intellectual_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Fortress Complex',
      nameRu: 'Комплекс крепости',
      coreWound: 'Vulnerability equals annihilation — the self must be fortified through control and emotional withdrawal',
      coreWoundRu: 'Уязвимость равна уничтожению — самость должна быть укреплена через контроль и эмоциональное отстранение',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'control_shadows' || a.cluster === 'avoidant_intellectual_shadows'
      ).map(a => a.name),
      defensePattern: 'Intellectualization and rigid control form an impenetrable defense against emotional need',
      defensePatternRu: 'Интеллектуализация и жёсткий контроль формируют непроницаемую защиту от эмоциональных потребностей',
      developmentalEra: origins.includes('oedipal') ? 'oedipal' : 'latency',
      severity: clamp((ctrlProm + avdProm) / 200, 0, 1),
    });
  }

  // Disorganized Intensity Complex: disorganized + storm
  if (clusterSet.has('disorganized_attachment_shadows') && clusterSet.has('emotional_storm_shadows')) {
    const disorgProm = archetypes.filter(a => a.cluster === 'disorganized_attachment_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Disorganized Intensity Complex',
      nameRu: 'Комплекс дезорганизованной интенсивности',
      coreWound: 'Simultaneous terror of abandonment and engulfment creates an impossible bind — every connection becomes a threat',
      coreWoundRu: 'Одновременный ужас покинутости и поглощения создаёт невозможный узел — каждая связь становится угрозой',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'disorganized_attachment_shadows' || a.cluster === 'emotional_storm_shadows'
      ).map(a => a.name),
      defensePattern: 'Rapid oscillation between desperate approach and sudden withdrawal, with emotional flooding in between',
      defensePatternRu: 'Быстрые колебания между отчаянным сближением и резким отстранением, с эмоциональным затоплением между ними',
      developmentalEra: 'pre_verbal',
      severity: clamp(disorgProm / 100 + 0.3, 0, 1),
    });
  }

  // Seductive Walls Complex: seductive_avoidance + control
  if (clusterSet.has('seductive_avoidance_shadows') && clusterSet.has('control_shadows')) {
    complexes.push({
      name: 'Seductive Walls Complex',
      nameRu: 'Комплекс соблазнительных стен',
      coreWound: 'Charm and magnetism deployed to control intimacy at a distance — close enough to entice, far enough to be safe',
      coreWoundRu: 'Обаяние и магнетизм используются для контроля близости на расстоянии — достаточно близко, чтобы соблазнять, достаточно далеко, чтобы быть в безопасности',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'seductive_avoidance_shadows' || a.cluster === 'control_shadows'
      ).map(a => a.name),
      defensePattern: 'Strategic intimacy — offer brilliance and charm, withhold authentic vulnerability',
      defensePatternRu: 'Стратегическая близость — предлагать блеск и обаяние, утаивать подлинную уязвимость',
      developmentalEra: 'oedipal',
      severity: clamp(0.4 + negativePoleStrength(poles.attAvoidant) * 0.3, 0, 1),
    });
  }

  // Early Trauma Complex: multiple pre-verbal origins + high severity
  if (origins.filter(o => o === 'pre_verbal').length >= 2) {
    complexes.push({
      name: 'Early Trauma Complex',
      nameRu: 'Комплекс ранней травмы',
      coreWound: 'Pre-verbal wounds that cannot be named, only felt as undifferentiated threat in the body',
      coreWoundRu: 'Довербальные раны, которые невозможно назвать, можно только почувствовать как недифференцированную угрозу в теле',
      contributingArchetypes: archetypes.filter(a => a.developmentalOrigin === 'pre_verbal').map(a => a.name),
      defensePattern: 'Somatic regulation difficulties, emotional numbness alternating with flooding, dissociative tendencies',
      defensePatternRu: 'Соматические трудности регуляции, эмоциональное онемение, чередующееся с затоплением, диссоциативные тенденции',
      developmentalEra: 'pre_verbal',
      severity: clamp(0.6 + poles.healthScore * -0.4, 0.3, 1),
    });
  }

  return complexes;
}

// --- 2.2 Defense Hierarchy (IFS Escalation Map) ---

export interface DefenseLayer {
  level: number;
  label: string;
  labelRu: string;
  parts: string[];
  description: string;
  descriptionRu: string;
}

export interface DefenseEscalation {
  from: string;
  to: string;
  trigger: string;
  triggerRu: string;
}

export interface DefenseHierarchy {
  layers: DefenseLayer[];
  escalationPaths: DefenseEscalation[];
}

export function computeDefenseHierarchy(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): DefenseHierarchy {
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');

  const layers: DefenseLayer[] = [];

  // Layer 1: Managers (proactive protection)
  if (managers.length > 0) {
    layers.push({
      level: 1,
      label: 'Proactive Defenses',
      labelRu: 'Проактивные защиты',
      parts: managers.map(m => m.name),
      description: `Manager parts (${managers.map(m => m.name).join(', ')}) maintain control and prevent vulnerability triggers before they activate`,
      descriptionRu: `Части-менеджеры (${managers.map(m => m.name).join(', ')}) поддерживают контроль и предотвращают активацию уязвимости до её проявления`,
    });
  }

  // Layer 2: Firefighters (reactive protection)
  if (firefighters.length > 0) {
    layers.push({
      level: 2,
      label: 'Reactive Defenses',
      labelRu: 'Реактивные защиты',
      parts: firefighters.map(f => f.name),
      description: `Firefighter parts (${firefighters.map(f => f.name).join(', ')}) activate when managers are overwhelmed, using intense reactivity to douse emotional fires`,
      descriptionRu: `Части-пожарные (${firefighters.map(f => f.name).join(', ')}) активируются, когда менеджеры не справляются, используя интенсивную реактивность для тушения эмоциональных пожаров`,
    });
  }

  // Layer 3: Exiles (the protected wounds)
  if (exiles.length > 0) {
    layers.push({
      level: 3,
      label: 'Protected Wounds',
      labelRu: 'Защищённые раны',
      parts: exiles.map(e => e.name),
      description: `Exile parts (${exiles.map(e => e.name).join(', ')}) carry the core wounds and vulnerable feelings that the entire defensive system is built to protect`,
      descriptionRu: `Части-изгнанники (${exiles.map(e => e.name).join(', ')}) несут основные раны и уязвимые чувства, которые вся защитная система призвана оберегать`,
    });
  }

  // Escalation paths
  const escalationPaths: DefenseEscalation[] = [];

  if (managers.length > 0 && exiles.length > 0) {
    const triggerThreshold = lang === 'ru'
      ? `Когда внешняя ситуация активирует рану ${exiles[0].name}, менеджеры усиливают контроль`
      : `When external situations activate ${exiles[0].name}\'s wound, managers escalate their protective control`;
    escalationPaths.push({
      from: managers[0].name,
      to: exiles[0].name,
      trigger: triggerThreshold,
      triggerRu: triggerThreshold,
    });
  }

  if (managers.length > 0 && firefighters.length > 0) {
    const triggerFF = lang === 'ru'
      ? `Когда ${managers[0].name} не может сдержать боль, ${firefighters[0].name} реактивно включается`
      : `When ${managers[0].name} cannot contain the pain, ${firefighters[0].name} reactively takes over`;
    escalationPaths.push({
      from: managers[0].name,
      to: firefighters[0].name,
      trigger: triggerFF,
      triggerRu: triggerFF,
    });
  }

  if (firefighters.length > 0 && exiles.length > 0 && poles.tempHot > 0.4) {
    const triggerDis = lang === 'ru'
      ? `При экстремальной эмоциональной перегрузке возможна диссоциация — полная остановка всех частей`
      : `Under extreme emotional overload, dissociation is possible — complete shutdown of all parts`;
    escalationPaths.push({
      from: firefighters[0].name,
      to: 'dissociation',
      trigger: triggerDis,
      triggerRu: triggerDis,
    });
  }

  return { layers, escalationPaths };
}

// --- 2.5 Trigger Map ---

export interface TriggerEntry {
  partName: string;
  partType: PartType;
  triggerSituations: string[];
  triggerSituationsRu: string[];
  reactionPattern: string;
  reactionPatternRu: string;
  underlyingWound: string;
  underlyingWoundRu: string;
}

export function computeTriggerMap(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): TriggerEntry[] {
  const triggers: TriggerEntry[] = [];

  // Template-based trigger generation from cluster + pole combinations
  const TRIGGER_TEMPLATES: Record<string, {
    situations: { en: string[]; ru: string[] };
    reaction: [string, string];
    wound: [string, string];
  }> = {
    control_shadows: {
      situations: {
        en: ['Loss of predictability or control over outcomes', 'Someone challenges their authority or competence'],
        ru: ['Потеря предсказуемости или контроля над исходом', 'Кто-то ставит под сомнение их авторитет или компетентность'],
      },
      reaction: [
        'Increases rigidity, micromanages, or withdraws into cold silence',
        'Усиливает жёсткость, микроменеджит или уходит в холодное молчание',
      ],
      wound: [
        'Deep fear that chaos will destroy everything they care about',
        'Глубокий страх, что хаос разрушит всё, что им дорого',
      ],
    },
    emotional_storm_shadows: {
      situations: {
        en: ['Feeling unheard, dismissed, or emotionally invalidated', 'Perceived betrayal or sudden disconnection'],
        ru: ['Ощущение, что их не слышат, обесценивают или эмоционально отвергают', 'Воспринимаемое предательство или внезапное разъединение'],
      },
      reaction: [
        'Emotional eruption — anger, tears, or volcanic protest',
        'Эмоциональное извержение — гнев, слёзы или вулканический протест',
      ],
      wound: [
        'Terror that their emotional intensity makes them unlovable',
        'Ужас, что их эмоциональная интенсивность делает их недостойными любви',
      ],
    },
    avoidant_intellectual_shadows: {
      situations: {
        en: ['Requests for emotional presence or vulnerability', 'Intimate conversations that cannot be solved with logic'],
        ru: ['Просьбы об эмоциональном присутствии или уязвимости', 'Близкие разговоры, которые невозможно решить логикой'],
      },
      reaction: [
        'Intellectualizes, changes subject, or physically withdraws',
        'Интеллектуализирует, меняет тему или физически отстраняется',
      ],
      wound: [
        'Core belief that being truly seen leads to annihilation',
        'Глубинная вера, что быть по-настоящему увиденным означает разрушение',
      ],
    },
    anxious_connection_shadows: {
      situations: {
        en: ['Partner doesn\'t respond promptly or seems distant', 'Any perceived shift in relationship quality or availability'],
        ru: ['Партнёр не отвечает быстро или кажется отстранённым', 'Любое воспринимаемое изменение качества связи или доступности партнёра'],
      },
      reaction: [
        'Over-accommodates, seeks reassurance, or merges with the other',
        'Чрезмерно уступает, ищет подтверждения или сливается с другим',
      ],
      wound: [
        'Fear that their authentic self is unworthy of love',
        'Страх, что их подлинное «я» недостойно любви',
      ],
    },
    seductive_avoidance_shadows: {
      situations: {
        en: ['Someone gets too close to their authentic vulnerability', 'Expectations of consistency or emotional depth'],
        ru: ['Кто-то подходит слишком близко к их подлинной уязвимости', 'Ожидания последовательности или эмоциональной глубины'],
      },
      reaction: [
        'Turns on charm, creates a distraction, or disappears',
        'Включает обаяние, создаёт отвлечение или исчезает',
      ],
      wound: [
        'Belief that who they truly are is not enough',
        'Вера, что их настоящего «я» недостаточно',
      ],
    },
    disorganized_attachment_shadows: {
      situations: {
        en: ['Moments of genuine intimacy that feel simultaneously desired and terrifying', 'Partner is both available and making demands'],
        ru: ['Моменты настоящей близости, которые одновременно желанны и пугающи', 'Партнёр одновременно доступен и предъявляет требования'],
      },
      reaction: [
        'Oscillates wildly between clinging and pushing away, often within minutes',
        'Дико колеблется между цеплянием и отталкиванием, часто в течение минут',
      ],
      wound: [
        'Both abandonment and engulfment feel equally deadly',
        'И покинутость, и поглощение ощущаются одинаково опасными',
      ],
    },
    gift_archetypes: {
      situations: {
        en: ['Witnessing others in pain when they cannot help', 'Being asked to compartmentalize their awareness'],
        ru: ['Видеть чужую боль, когда невозможно помочь', 'Просьба отделить осознавание от чувств и контекста'],
      },
      reaction: [
        'Attempts to hold space with grounded presence, may over-extend',
        'Пытается держать пространство с заземлённым присутствием, может перегрузиться',
      ],
      wound: [
        'The wound that became wisdom — still tender underneath',
        'Рана, ставшая мудростью, но всё ещё чувствительная внутри',
      ],
    },
  };

  for (const archetype of archetypes.slice(0, 6)) {
    const template = TRIGGER_TEMPLATES[archetype.cluster];
    if (!template) continue;

    // Scale trigger intensity by pole magnitude
    const intensity = archetype.prominence / 100;
    if (intensity < 0.05) continue;

    triggers.push({
      partName: archetype.name,
      partType: archetype.partType,
      triggerSituations: template.situations.en,
      triggerSituationsRu: template.situations.ru,
      reactionPattern: template.reaction[0],
      reactionPatternRu: template.reaction[1],
      underlyingWound: template.wound[0],
      underlyingWoundRu: template.wound[1],
    });
  }

  return triggers;
}

// --- 2.6 Integration Pathway ---

export interface PathwayStep {
  stage: number;
  stageName: string;
  stageNameRu: string;
  action: string;
  actionRu: string;
  targetParts: string[];
  order: number;
}

export function computeIntegrationPathway(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): PathwayStep[] {
  const steps: PathwayStep[] = [];
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');

  // Sort by developmental origin (earliest first)
  const originOrder: Record<DevelopmentalOrigin, number> = {
    pre_verbal: 0,
    early_attachment: 1,
    oedipal: 2,
    latency: 3,
    adolescent: 4,
  };

  const sortedExiles = [...exiles].sort((a, b) =>
    (originOrder[a.developmentalOrigin] ?? 4) - (originOrder[b.developmentalOrigin] ?? 4)
  );

  // Stage 1: Stabilization — thank the managers
  if (managers.length > 0) {
    steps.push({
      stage: 1,
      stageName: 'Stabilization',
      stageNameRu: 'Стабилизация',
      action: `Acknowledge and thank ${managers.map(m => m.name).join(' and ')} for their protective work. Let them know you see their effort and that it is safe to relax their grip gradually.`,
      actionRu: `Признайте и поблагодарите ${managers.map(m => m.name).join(' и ')} за их защитную работу. Дайте им знать, что вы видите их усилия и что безопасно постепенно ослабить хватку.`,
      targetParts: managers.map(m => m.name),
      order: 0,
    });
  }

  // Stage 2: Access — witness the exiles
  if (sortedExiles.length > 0) {
    const primaryExile = sortedExiles[0];
    steps.push({
      stage: 2,
      stageName: 'Access',
      stageNameRu: 'Доступ',
      action: `Gently approach ${primaryExile.name} from a place of compassionate curiosity. Witness their wound ("${primaryExile.wound}") without trying to fix it. Let them know they are no longer alone.`,
      actionRu: `Нежно подойдите к ${primaryExile.name} из места сострадательного любопытства. Засвидетельствуйте их рану («${primaryExile.wound}»), не пытаясь её починить. Дайте им знать, что они больше не одни.`,
      targetParts: [primaryExile.name],
      order: 1,
    });
  }

  // Stage 3: Processing — name the wounds
  if (exiles.length > 0) {
    steps.push({
      stage: 3,
      stageName: 'Processing',
      stageNameRu: 'Переработка',
      action: `Name the core wounds being carried: ${exiles.map(e => `"${e.wound}"`).join(', ')}. Bring compassionate witnessing to each one, allowing the frozen emotions to thaw at their own pace.`,
      actionRu: `Назовите раны, которые несут изгнанники: ${exiles.map(e => `«${e.wound}»`).join(', ')}. Отнеситесь к каждой с сострадательным вниманием, позволяя замороженным эмоциям оттаять в собственном темпе.`,
      targetParts: exiles.map(e => e.name),
      order: 2,
    });
  }

  // Stage 4: Integration — firefighters stand down
  if (firefighters.length > 0) {
    steps.push({
      stage: 4,
      stageName: 'Integration',
      stageNameRu: 'Интеграция',
      action: `As exiles feel witnessed, ${firefighters.map(f => f.name).join(' and ')} can begin to stand down. Negotiate new roles: their energy can be redirected toward creative expression rather than reactive protection.`,
      actionRu: `По мере того как изгнанники чувствуют себя увиденными, ${firefighters.map(f => f.name).join(' и ')} могут начать отступать. Согласуйте новые роли: их энергия может быть перенаправлена на творческое самовыражение вместо реактивной защиты.`,
      targetParts: firefighters.map(f => f.name),
      order: 3,
    });
  }

  if (steps.length === 0 && archetypes.length > 0) {
    const primary = archetypes[0];
    steps.push({
      stage: 1,
      stageName: 'Embodiment',
      stageNameRu: 'Воплощение',
      action: `Anchor the gifts of ${primary.name} in one concrete relational practice this week. Notice where this integrated capacity already appears, then repeat it deliberately in a low-risk relationship.`,
      actionRu: `Закрепите дары части ${primary.name} в одной конкретной реляционной практике на этой неделе. Заметьте, где эта интегрированная способность уже проявляется, затем сознательно повторите её в безопасных отношениях.`,
      targetParts: [primary.name],
      order: 0,
    });
  }

  return steps;
}

// =============================================================================
// Phase 3: Derived Diagnostic Indicators
// =============================================================================

// --- 3.1 Dissociation Tendency Indicator ---

export interface DissociationIndicator {
  score: number; // 0-1, higher = more dissociation tendency
  level: 'minimal' | 'mild' | 'moderate' | 'significant';
  levelRu: string;
  description: string;
  descriptionRu: string;
}

export function computeDissociation(
  responses: number[],
  poles: PoleScores
): DissociationIndicator {
  // Low emotional variance (flat responses in temp section) + high avoidance
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const flatness = 1 - clamp01(emotionalVariance); // inverted: low variance = high flatness
  const avoidance = negativePoleStrength(poles.attAvoidant);
  const intellectualization = negativePoleStrength(poles.tempCool);

  // Composite score
  const score = clamp01(flatness * 0.4 + avoidance * 0.35 + intellectualization * 0.25);

  const levels: { level: DissociationIndicator['level']; levelRu: string; threshold: number }[] = [
    { level: 'significant', levelRu: 'Значительная', threshold: 0.7 },
    { level: 'moderate', levelRu: 'Умеренная', threshold: 0.5 },
    { level: 'mild', levelRu: 'Лёгкая', threshold: 0.3 },
    { level: 'minimal', levelRu: 'Минимальная', threshold: 0 },
  ];
  const matched = levels.find(l => score >= l.threshold) || levels[levels.length - 1];

  return {
    score,
    level: matched.level,
    levelRu: matched.levelRu,
    description: score > 0.5
      ? 'Response pattern suggests emotional numbing or detachment. Emotional responses appear flattened with strong avoidant tendencies, which may indicate dissociative coping.'
      : score > 0.3
        ? 'Some tendency toward emotional withdrawal or intellectualization. Not necessarily dissociation, but worth monitoring under stress.'
        : 'Emotional engagement appears healthy. Responses show natural variation in emotional reactivity.',
    descriptionRu: score > 0.5
      ? 'Паттерн ответов указывает на эмоциональное онемение или отстранённость. Эмоциональные реакции выглядят сглаженными при сильных избегающих тенденциях, что может указывать на диссоциативное совладание.'
      : score > 0.3
        ? 'Некоторая склонность к эмоциональному отстранению или интеллектуализации. Не обязательно диссоциация, но стоит отслеживать в стрессовых ситуациях.'
        : 'Эмоциональная вовлечённость выглядит здоровой. Ответы демонстрируют естественную вариативность эмоциональной реактивности.',
  };
}

// --- 3.2 Emotional Regulation Capacity ---

export interface RegulationCapacity {
  windowOfTolerance: number; // 0-1, width
  dysregulationPattern: 'flooding' | 'shutdown' | 'oscillation' | 'stable';
  dysregulationPatternRu: string;
  description: string;
  descriptionRu: string;
}

export function computeRegulationCapacity(
  responses: number[],
  poles: PoleScores
): RegulationCapacity {
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const healthContribution = poles.healthScore * 0.5;
  const hotStrength = positivePoleStrength(poles.tempHot);
  const coolStrength = negativePoleStrength(poles.tempCool);
  const anxiousStrength = positivePoleStrength(poles.attAnxious);
  const avoidantStrength = negativePoleStrength(poles.attAvoidant);
  const tempBalance = 1 - Math.abs(hotStrength - coolStrength);
  const windowWidth = clamp01(healthContribution + tempBalance * 0.3 + (1 - emotionalVariance) * 0.2);

  // Determine dysregulation pattern
  let pattern: RegulationCapacity['dysregulationPattern'] = 'stable';
  let patternRu = 'Стабильная';

  if (hotStrength > 0.4 && anxiousStrength > 0.3) {
    pattern = 'flooding';
    patternRu = 'Затопление';
  } else if (coolStrength > 0.4 && avoidantStrength > 0.3) {
    pattern = 'shutdown';
    patternRu = 'Отключение';
  } else if (poles.disorganizedAttachment) {
    pattern = 'oscillation';
    patternRu = 'Осцилляция';
  }

  const descriptions: Record<string, { en: string; ru: string }> = {
    flooding: {
      en: `Emotional flooding pattern detected. Intense emotions (hot: ${(hotStrength * 100).toFixed(0)}%) combined with anxious attachment creates a narrow window of tolerance. Regulation strategy: grounding and self-soothing before processing.`,
      ru: `Обнаружен паттерн эмоционального затопления. Интенсивные эмоции (накал: ${(hotStrength * 100).toFixed(0)}%) в сочетании с тревожной привязанностью сужают окно толерантности. Стратегия регуляции: заземление и самоуспокоение до проработки.`,
    },
    shutdown: {
      en: `Emotional shutdown pattern detected. Emotional detachment (cool: ${(coolStrength * 100).toFixed(0)}%) with avoidant tendencies leads to withdrawal under stress. Regulation strategy: gentle somatic reconnection before cognitive processing.`,
      ru: `Обнаружен паттерн эмоционального отключения. Эмоциональная отстранённость (хлад: ${(coolStrength * 100).toFixed(0)}%) с избегающими тенденциями ведёт к отстранению при стрессе. Стратегия регуляции: мягкая соматическая реконеекция до когнитивной проработки.`,
    },
    oscillation: {
      en: `Oscillation pattern detected. Disorganized attachment creates rapid shifts between flooding and shutdown. Window of tolerance is narrow and unstable. Regulation strategy: establish safety anchors before exploring emotional content.`,
      ru: `Обнаружен паттерн осцилляции. Дезорганизованная привязанность создаёт быстрые переходы между затоплением и отключением. Окно толерантности узкое и нестабильное. Стратегия регуляции: установить якоря безопасности до исследования эмоционального содержания.`,
    },
    stable: {
      en: `Emotional regulation appears relatively stable. Window of tolerance is ${Math.round(windowWidth * 100)}% wide, suggesting capacity to stay present with emotional experience.`,
      ru: `Эмоциональная регуляция выглядит относительно стабильной. Окно толерантности ${Math.round(windowWidth * 100)}% шириной, что свидетельствует о способности оставаться присутствующим с эмоциональным опытом.`,
    },
  };

  const desc = descriptions[pattern];

  return {
    windowOfTolerance: windowWidth,
    dysregulationPattern: pattern,
    dysregulationPatternRu: patternRu,
    description: desc.en,
    descriptionRu: desc.ru,
  };
}

// --- 3.3 Boundary Style Assessment ---

export interface BoundaryAssessment {
  style: 'rigid' | 'porous' | 'flexible' | 'oscillating';
  styleRu: string;
  score: number; // 0 = rigid, 0.5 = flexible, 1 = porous
  description: string;
  descriptionRu: string;
}

export function computeBoundaryStyle(poles: PoleScores): BoundaryAssessment {
  const selfFocus = negativePoleStrength(poles.focusSelf);
  const otherFocus = positivePoleStrength(poles.focusOther);
  const agency = negativePoleStrength(poles.agencyActive);
  const receptive = positivePoleStrength(poles.agencyReceptive);

  // Score: 0 = rigid (self-focused + active), 1 = porous (other-focused + receptive)
  const boundaryScore = clamp01(otherFocus * 0.4 + receptive * 0.3 + (1 - selfFocus) * 0.15 + (1 - agency) * 0.15);

  let style: BoundaryAssessment['style'] = 'flexible';
  let styleRu = 'Гибкий';

  if (poles.disorganizedAttachment && Math.abs(boundaryScore - 0.5) > 0.15) {
    style = 'oscillating';
    styleRu = 'Осциллирующий';
  } else if (boundaryScore < 0.3) {
    style = 'rigid';
    styleRu = 'Жёсткий';
  } else if (boundaryScore > 0.7) {
    style = 'porous';
    styleRu = 'Проницаемый';
  }

  const descriptions: Record<string, { en: string; ru: string }> = {
    rigid: {
      en: 'Rigid boundaries: strong self-focus with active agency creates well-defended but potentially isolating relational walls. Others may experience you as distant or unapproachable.',
      ru: 'Жёсткие границы: сильный фокус на себе с активной агентностью создаёт хорошо защищённые, но потенциально изолирующие реляционные стены. Другие могут воспринимать вас как отстранённого или недоступного.',
    },
    porous: {
      en: 'Porous boundaries: high other-focus with receptive stance allows deep connection but risks enmeshment and self-abandonment. Difficulty distinguishing self from other.',
      ru: 'Проницаемые границы: высокий фокус на другом с восприимчивой позицией позволяет глубокую связь, но рискует слиянием и отказом от себя. Трудности в различении себя и другого.',
    },
    flexible: {
      en: 'Flexible boundaries: balanced self-other focus with adaptive agency allows both closeness and autonomy. Can adjust boundaries contextually.',
      ru: 'Гибкие границы: сбалансированный фокус «я-другой» с адаптивной агентностью позволяет и близость, и автономию. Способны контекстуально корректировать границы.',
    },
    oscillating: {
      en: 'Oscillating boundaries: rapid shifts between rigid walls and porous merging, often triggered by attachment activation. Boundaries feel unpredictable to both self and others.',
      ru: 'Осциллирующие границы: быстрые переходы между жёсткими стенами и проницаемым слиянием, часто провоцируемые активацией привязанности. Границы ощущаются непредсказуемыми и для себя, и для других.',
    },
  };

  const desc = descriptions[style];

  return {
    style,
    styleRu,
    score: boundaryScore,
    description: desc.en,
    descriptionRu: desc.ru,
  };
}

// --- 3.4 Narrative Coherence Indicator ---

export interface CoherenceIndicator {
  score: number; // 0-1, higher = more coherent
  level: 'high' | 'moderate' | 'low' | 'fragmented';
  levelRu: string;
  description: string;
  descriptionRu: string;
}

export function computeNarrativeCoherence(
  responses: number[],
  poles: PoleScores
): CoherenceIndicator {
  // Within-section variance: high variance within a section = inconsistent responses
  const sections = [
    responses.slice(0, 12),   // Agency
    responses.slice(12, 24),  // Temperature
    responses.slice(24, 36),  // Focus
    responses.slice(36, 52),  // Attachment
  ];

  const sectionVariances = sections.map(s => variance(s.map(r => (r - 3) / 2)));
  const avgVariance = sectionVariances.reduce((s, v) => s + v, 0) / sectionVariances.length;

  // Cross-section consistency: do the pole scores tell a coherent story?
  // High disorganized = low coherence by definition
  const disorgPenalty = poles.disorganizedAttachment ? 0.25 : 0;

  // Very low variance across ALL sections = overly rigid/defensive responding (not coherent)
  // Very high variance = chaotic responding (not coherent)
  // Sweet spot = moderate variance
  const varianceCoherence = 1 - Math.abs(avgVariance - 0.4) * 2;

  // Health score contributes positively
  const healthBonus = poles.healthScore * 0.3;

  const score = clamp01(varianceCoherence * 0.5 + healthBonus - disorgPenalty);

  const levels: { level: CoherenceIndicator['level']; levelRu: string; threshold: number }[] = [
    { level: 'high', levelRu: 'Высокая', threshold: 0.7 },
    { level: 'moderate', levelRu: 'Умеренная', threshold: 0.5 },
    { level: 'low', levelRu: 'Низкая', threshold: 0.3 },
    { level: 'fragmented', levelRu: 'Фрагментированная', threshold: 0 },
  ];
  const matched = levels.find(l => score >= l.threshold) || levels[levels.length - 1];

  return {
    score,
    level: matched.level,
    levelRu: matched.levelRu,
    description: score > 0.7
      ? 'Response pattern shows good internal consistency. Answers within each section align coherently, suggesting an integrated self-narrative.'
      : score > 0.5
        ? 'Response pattern shows moderate coherence. Some inconsistencies between or within sections, which may reflect genuine complexity or unresolved conflict.'
        : score > 0.3
          ? 'Response pattern shows notable inconsistency. This may indicate internal conflict, rapid state shifts, or difficulty accessing consistent self-awareness.'
          : 'Response pattern appears fragmented or highly inconsistent. This can indicate significant internal conflict, dissociative tendencies, or a self-narrative still in formation.',
    descriptionRu: score > 0.7
      ? 'Паттерн ответов демонстрирует хорошую внутреннюю согласованность. Ответы внутри каждой секции выстроены логично, что говорит об интегрированном самоповествовании.'
      : score > 0.5
        ? 'Паттерн ответов показывает умеренную согласованность. Некоторые несоответствия между или внутри секций могут отражать подлинную сложность или неразрешённый конфликт.'
        : score > 0.3
          ? 'Паттерн ответов показывает заметную непоследовательность. Это может указывать на внутренний конфликт, быстрые смены состояний или затруднённый доступ к устойчивой самоосознанности.'
          : 'Паттерн ответов выглядит фрагментированным или крайне непоследовательным. Это может указывать на значительный внутренний конфликт, диссоциативные тенденции или самоповествование, ещё находящееся в процессе формирования.',
  };
}
