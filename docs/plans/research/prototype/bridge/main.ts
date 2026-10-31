// The prototype's bridge to the real app: the 3+1D universe, the 147-item bank and its scoring,
// and the adapter that turns a scored profile into universe parts. Built as a separate module
// (bridge.vite.config.mjs) and loaded by the prototype only when someone opens the deep map or the
// therapist view, so the prototype shows the app's own code rather than a look-alike.
import { initUniverse } from '../../../../../src/parts-cartographer/services/universe-scene';
import { scoreProfile } from '../../../../../src/shared/core/data/scoring-v2';
import { toAssessmentInput } from '../../../../../src/shared/core/data/assessment-adapter';
import { buildItemSequence, itemText, LIKERT, type ItemRef } from '../../../../../src/shared/i18n/items';
import { adaptClinicalProfile, clinicalPartName, clinicalNeedName, clinicalPolarizationName } from '../../../../../src/parts-cartographer/core/clinical-profile-adapter';
import { NORM_MEAN, NORM_SD, GUARDS, tierOf, SHADOW_PARTS, PROTECTORS, EXILES, RESOURCES } from '../../../../../src/shared/core/data/parts';
import { feltDna } from '../../../../../src/parts-cartographer/pal/felt-dna';
import { feltThumbnail } from '../../../../../src/parts-cartographer/services/felt-engine';
import type { Traits } from '../../../../../src/parts-cartographer/pal/traits';
import { buildData } from '../../../../../felt-atelier/src/builder.js';
import { toDoodleSymbol } from '../doodle-core';
import { ASSESSMENT_QUESTIONS } from '../../../../../src/shared/core/data/assessment-questions';
import { TRANSLATIONS } from '../../../../../src/shared/i18n/strings';
import { generateArchetypes, computePoleScores } from '../../../../../src/shared/core/data/scoring';

/** The 64-item relational map: the app's own items (Russian) and scoring. */
const legacy64 = {
  items: () => ASSESSMENT_QUESTIONS.map((q) => {
    const section = q.section.split('.').pop() as string;
    const copy = (TRANSLATIONS.ru.assessment.questions as Record<string, Record<string, string>>)[section];
    return { section, title: copy.title, ru: copy[q.text] };
  }),
  score: (responses: number[]) => ({ poles: computePoleScores(responses), ...generateArchetypes(responses, 'ru') }),
};

/** «Мастерская»: the doodle of any traits a person picks, drawn from the same sewing record as its plush. */
function doodle(traits: Traits): string {
  const symbol = toDoodleSymbol('live', buildData(feltDna(traits), { lod: 'map' }).flat);
  return symbol.replace('<symbol id="d-live" viewBox=', '<svg xmlns="http://www.w3.org/2000/svg" viewBox=').replace(/<\/symbol>$/, '</svg>');
}

/** Answers in delivery order from a per-family agreement level (1..5). Reverse-keyed items get the mirrored answer. */
function sampleAnswers(level: Record<string, number>): number[] {
  return buildItemSequence().map((ref: ItemRef) => {
    if (ref.kind === 'shadow') { const l = level[ref.part] ?? 2; return ref.index >= 6 ? 6 - l : l; }
    if (ref.kind === 'resource') return level[ref.part] ?? 3;
    if (ref.kind === 'self') return level.self ?? 3;
    return ref.which === 'attention' ? 3 : 1;
  });
}

/** An invented client at three sessions: loud critic, controller and pleaser that soften, Self that grows. */
const CLIENT_SESSIONS: Record<string, number>[] = [
  { inner_critic: 5, controller: 4, pleaser: 4, numb: 4, taskmaster: 3, hermit: 3, analyst: 3, bypasser: 2, rebel: 2, charmer: 2, abandoned: 3, ashamed: 4, frightened: 3, unseen: 3, sage: 3, warrior: 2, caregiver: 4, explorer: 3, self: 2 },
  { inner_critic: 4, controller: 4, pleaser: 4, numb: 3, taskmaster: 3, hermit: 3, analyst: 3, bypasser: 2, rebel: 2, charmer: 2, abandoned: 3, ashamed: 3, frightened: 3, unseen: 3, sage: 3, warrior: 3, caregiver: 4, explorer: 3, self: 3 },
  { inner_critic: 4, controller: 3, pleaser: 3, numb: 3, taskmaster: 3, hermit: 2, analyst: 3, bypasser: 2, rebel: 2, charmer: 2, abandoned: 2, ashamed: 3, frightened: 2, unseen: 2, sage: 4, warrior: 3, caregiver: 4, explorer: 4, self: 4 },
];

function score(answers: number[]) {
  const raw = scoreProfile(toAssessmentInput(answers));
  return { raw, ...adaptClinicalProfile(raw, 'ru') };
}

export const Bridge = {
  initUniverse,
  legacy64,
  doodle,
  plush: (traits: Traits) => feltThumbnail(traits),
  items: () => buildItemSequence().map((ref) => ({ ref, ru: itemText(ref, 'ru') })),
  likert: LIKERT.ru,
  score,
  sampleAnswers,
  clientSessions: () => CLIENT_SESSIONS.map((level) => score(sampleAnswers(level))),
  partName: (id: string) => clinicalPartName(id, 'ru'),
  needName: (key: string) => clinicalNeedName(key, 'ru'),
  polarizationName: (name: string) => clinicalPolarizationName(name, 'ru'),
  norms: { mean: NORM_MEAN, sd: NORM_SD },
  guards: GUARDS,
  tierOf,
  ids: { SHADOW_PARTS, PROTECTORS, EXILES, RESOURCES },
};

(window as unknown as { InnerverseBridge: typeof Bridge }).InnerverseBridge = Bridge;
