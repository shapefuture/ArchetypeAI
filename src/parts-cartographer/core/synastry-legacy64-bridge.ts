/** Adapter for the Angular ResultsPanel's 64-response synastry computation. */
import { computeSynastry, type SynastryReport } from '../../shared/core/data/synastry';
import type { SynastryResult } from './synastry-v2';

const AXES: Record<string, { en: string; ru: string }> = {
  AGENCY: { en: 'Agency resonance', ru: 'Резонанс агентности' },
  TEMPERATURE: { en: 'Emotional-temperature resonance', ru: 'Резонанс эмоциональной температуры' },
  FOCUS: { en: 'Relational-focus resonance', ru: 'Резонанс фокуса отношений' },
  ATTACHMENT: { en: 'Attachment-pattern resonance', ru: 'Резонанс паттернов привязанности' },
};

export { validateLegacy64Responses, readLocalLegacy64Responses } from './legacy64-responses';
import { validateLegacy64Responses } from './legacy64-responses';

function summary(report: SynastryReport, language: 'en' | 'ru'): string {
  const archetype = report.relationalArchetype;
  const dance = report.attachmentDance;
  const resonance = report.dimensionalResonance
    .map((dimension) => language === 'ru' ? dimension.descriptionRu : dimension.descriptionEn)
    .join(' ');
  const cycle = language === 'ru' ? dance.cycleRu : dance.cycleEn;
  const deactivation = language === 'ru' ? dance.deactivationRu : dance.deactivationEn;
  const archetypeDescription = language === 'ru' ? archetype.descriptionRu : archetype.descriptionEn;
  const invitation = language === 'ru' ? archetype.invitationRu : archetype.invitationEn;
  const shared = report.sharedComplexes.length
    ? (language === 'ru' ? `Возможные общие комплексы: ${report.sharedComplexes.join(', ')}.` : `Possible shared complexes: ${report.sharedComplexes.join(', ')}.`)
    : (language === 'ru' ? 'Общих комплексов из заданного перечня не обнаружено.' : 'No shared complexes from the model’s predefined list were detected.');

  if (language === 'ru') {
    return [
      'Это структурированная карта возможной динамики по ответам двух людей, а не оценка совместимости, диагноз или прогноз.',
      `Реляционный архетип «${archetype.nameRu}»: ${archetypeDescription} ${invitation}`,
      `Танец привязанности: ${dance.descriptionRu} ${cycle} ${deactivation}`,
      resonance,
      shared,
      `Оценочный индекс безопасности — ${Math.round(report.safetyIndex * 100)}/100; он является приблизительным сигналом модели, а не мерой безопасности отношений. Потенциал развития — ${Math.round(report.growthPotential * 100)}/100; сложность — ${Math.round(report.challengeLevel * 100)}/100.`,
    ].join('\n\n');
  }
  return [
    'This is a structured map of possible dynamics from two people’s responses, not a compatibility score, diagnosis, or prediction.',
    `Relational archetype “${archetype.nameEn}”: ${archetypeDescription} ${invitation}`,
    `Attachment dance: ${dance.descriptionEn} ${cycle} ${deactivation}`,
    resonance,
    shared,
    `Estimated safety index: ${Math.round(report.safetyIndex * 100)}/100. This is a model signal, not a measure of relationship safety. Growth potential: ${Math.round(report.growthPotential * 100)}/100; challenge level: ${Math.round(report.challengeLevel * 100)}/100.`,
  ].join('\n\n');
}

/** Run the actual Angular 64-item engine only when both complete vectors are present. */
export function synastryFromLegacy64Responses(
  localResponses: unknown,
  partnerResponses: unknown,
  codeA: string,
  codeB: string,
  language: 'en' | 'ru',
): (SynastryResult & { legacy64: SynastryReport }) | null {
  if (!validateLegacy64Responses(localResponses) || !validateLegacy64Responses(partnerResponses)) return null;

  const report = computeSynastry(localResponses, partnerResponses, language);
  const dims = report.dimensionalResonance.map((dimension) => {
    const labels = AXES[dimension.dimension] ?? { en: dimension.dimension, ru: dimension.dimension };
    const closeness = Math.max(0, Math.min(100, (1 - Math.abs(dimension.delta) / 2) * 100));
    return {
      key: dimension.dimension.toLowerCase(),
      labelEn: labels.en,
      labelRu: labels.ru,
      value: Math.round(closeness),
    };
  });
  dims.push(
    { key: 'growth', labelEn: 'Growth potential', labelRu: 'Потенциал развития', value: Math.round(report.growthPotential * 100) },
    { key: 'safety', labelEn: 'Safety signals', labelRu: 'Сигналы безопасности', value: Math.round(report.safetyIndex * 100) },
  );

  return {
    codeA,
    codeB,
    engineVersion: 'legacy64-v1',
    bond: {
      id: report.relationalArchetype.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      en: report.relationalArchetype.nameEn,
      ru: report.relationalArchetype.nameRu,
    },
    dims,
    narrativeEn: summary(report, 'en'),
    narrativeRu: summary(report, 'ru'),
    legacy64: report,
  };
}
