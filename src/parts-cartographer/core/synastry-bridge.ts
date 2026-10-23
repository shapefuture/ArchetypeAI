/** Translate the canonical 147-item Angular synastry engine into React's existing report DTO. */
import { COMPLEXES, NEED, RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { PART_NAME_RU } from '../../shared/core/data/constellation-copy';
import { synastry as compareScoredProfiles, toSynastryProfile } from '../../shared/core/data/synastry-v2';
import type { ScoredProfile } from '../../shared/core/data/scoring-v2';
import type { SynastryResult } from './synastry-v2';

const DANCE_COPY = {
  HEALING_CONTAINER: { en: 'Healing container', ru: 'Поддерживающая связь' },
  PARALLEL_SOVEREIGNTY: { en: 'Parallel sovereignty', ru: 'Параллельная самостоятельность' },
  PURSUE_WITHDRAW_1: { en: 'Pursue–withdraw · partner withdraws', ru: 'Сближение и дистанция · партнёр отстраняется' },
  PURSUE_WITHDRAW_2: { en: 'Pursue–withdraw · you withdraw', ru: 'Сближение и дистанция · вы отстраняетесь' },
  MUTUAL_ESCALATION: { en: 'Mutual escalation', ru: 'Взаимное усиление напряжения' },
  DEEP_FREEZE: { en: 'Deep freeze', ru: 'Взаимное отдаление' },
  VOLATILE_BOND: { en: 'Unsteady bond', ru: 'Нестабильная связь' },
} as const;

const PART_COPY_EN: Record<string, string> = {
  taskmaster: 'Taskmaster', inner_critic: 'Inner Critic', pleaser: 'Pleaser', controller: 'Controller',
  analyst: 'Analyst', hermit: 'Hermit', bypasser: 'Bypasser', numb: 'Numb', rebel: 'Rebel',
  charmer: 'Charmer', abandoned: 'Abandoned', ashamed: 'Ashamed', frightened: 'Frightened', unseen: 'Unseen',
};

const METRICS = [
  { key: 'friction', en: 'Cross-trigger friction', ru: 'Риск взаимных триггеров' },
  { key: 'resonance', en: 'Shared vulnerability patterns', ru: 'Сходство уязвимых паттернов' },
  { key: 'balance', en: 'Polarization balance', ru: 'Баланс поляризаций' },
  { key: 'safety', en: 'Relational safety signals', ru: 'Сигналы безопасности в отношениях' },
  { key: 'growth', en: 'Growth potential', ru: 'Потенциал развития' },
  { key: 'nourish', en: 'Mutual nourishment', ru: 'Взаимная поддержка' },
] as const;

type Dictionary = Record<string, unknown>;
const isRecord = (value: unknown): value is Dictionary => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const inRange = (value: unknown, minimum: number, maximum: number): value is number =>
  finite(value) && value >= minimum && value <= maximum;

/** Read only the aggregate scoring fields used by synastry; raw answers are never needed. */
export function readSynastryClinicalProfile(profile: unknown): ScoredProfile | null {
  if (!isRecord(profile) || !isRecord(profile.clinical)) return null;
  const clinical = profile.clinical;
  if (!isRecord(clinical.parts) || !isRecord(clinical.resources) || !isRecord(clinical.complexes)
    || !isRecord(clinical.needHunger) || !isRecord(clinical.attachment)) return null;

  for (const id of SHADOW_PARTS) {
    const item = clinical.parts[id];
    if (!isRecord(item) || !inRange(item.T, 20, 80)) return null;
  }
  for (const id of RESOURCES) {
    const item = clinical.resources[id];
    if (!isRecord(item) || !inRange(item.T, 20, 80)) return null;
  }
  for (const id of Object.keys(COMPLEXES)) {
    const item = clinical.complexes[id];
    if (!isRecord(item) || !inRange(item.activation, 0, 100)) return null;
  }
  for (const need of new Set(Object.values(NEED))) {
    if (!inRange(clinical.needHunger[need], -100, 100)) return null;
  }
  if (!inRange(clinical.selfEnergy, 0, 100)
    || !inRange(clinical.attachment.anxious, 0, 100)
    || !inRange(clinical.attachment.avoidant, 0, 100)
    || !inRange(clinical.attachment.secure, 0, 100)
    || typeof clinical.attachment.disorganized !== 'boolean') return null;

  return clinical as unknown as ScoredProfile;
}

function displayPart(id: string, language: 'en' | 'ru'): string {
  if (language === 'ru') return PART_NAME_RU[id] ?? id;
  return PART_COPY_EN[id] ?? id.replaceAll('_', ' ');
}

function narrative(result: ReturnType<typeof compareScoredProfiles>, language: 'en' | 'ru'): string {
  const dance = DANCE_COPY[result.dance][language];
  const loop = result.loop;
  if (language === 'ru') {
    const locked = result.noLockedStoryline
      ? 'В этой модели не выявлено заранее заданного взаимного комплекса.'
      : 'Модель обнаружила возможную точку сцепления комплексов; это повод для любопытства, а не предсказание.';
    return [
      'Это карта возможной динамики, а не оценка совместимости или клиническое заключение.',
      `Стиль взаимодействия: ${dance}.`,
      `Возможный цикл: ваша часть «${displayPart(loop.aProtector, language)}» может задеть уязвимую часть партнёра «${displayPart(loop.bExile, language)}»; его защитная реакция может коснуться вашей части «${displayPart(loop.aExile, language)}». Это гипотеза, не прогноз.`,
      `Сигналы трения (${Math.round(result.FRICTION)}/100) описывают потенциальные взаимные триггеры, а не вину. Сходство уязвимых паттернов (${Math.round(result.RESONANCE)}/100) также не означает близость или совместимость.`,
      locked,
      'Показатели — ориентиры для бережного разговора; они не заменяют собственное суждение или профессиональную поддержку.',
    ].join('\n\n');
  }
  const locked = result.noLockedStoryline
    ? 'This model did not find one of its predefined mutual complex patterns.'
    : 'The model found a possible complex interlock; treat it as a prompt for curiosity, not a prediction.';
  return [
    'This is a map of possible dynamics, not a compatibility score or clinical assessment.',
    `Relational dance: ${dance}.`,
    `A possible loop: your ${displayPart(loop.aProtector, language)} may touch your partner’s vulnerable ${displayPart(loop.bExile, language)}; their protective response may in turn touch your ${displayPart(loop.aExile, language)}. This is a hypothesis, not a forecast.`,
    `Friction signals (${Math.round(result.FRICTION)}/100) describe potential cross-triggering, not blame. Similarity in vulnerable patterns (${Math.round(result.RESONANCE)}/100) does not mean closeness or compatibility.`,
    locked,
    'Use these estimates as prompts for a considerate conversation, not as a substitute for your own judgment or professional support.',
  ].join('\n\n');
}

/** Return null unless both profiles contain complete canonical 147-item aggregate scores. */
export function synastryFromSnapshotProfiles(
  localProfile: unknown,
  partnerProfile: unknown,
  codeA: string,
  codeB: string,
  language: 'en' | 'ru',
): SynastryResult | null {
  const local = readSynastryClinicalProfile(localProfile);
  const partner = readSynastryClinicalProfile(partnerProfile);
  if (!local || !partner) return null;

  const scored = compareScoredProfiles(toSynastryProfile(local), toSynastryProfile(partner));
  const values = [scored.FRICTION, scored.RESONANCE, scored.BALANCE, scored.SAFETY, scored.GROWTH, scored.NOURISH];
  return {
    codeA,
    codeB,
    engineVersion: 'scored-profile-v2',
    scoredProfileV2: scored,
    bond: {
      id: scored.dance.toLowerCase(),
      ...DANCE_COPY[scored.dance],
    },
    dims: METRICS.map((metric, index) => ({
      key: metric.key,
      labelEn: metric.en,
      labelRu: metric.ru,
      value: Math.round(values[index]),
    })),
    narrativeEn: narrative(scored, 'en'),
    narrativeRu: narrative(scored, 'ru'),
  };
}
