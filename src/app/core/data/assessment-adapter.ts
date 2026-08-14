/**
 * Adapter: sequence-order Likert answers → AssessmentInput for scoring-v2.
 * The delivery schedule (buildItemSequence) is deterministic, so the mapping
 * is a fixed permutation — tested exhaustively against the schedule.
 */
import type { AssessmentInput } from './scoring-v2';
import {
  buildItemSequence, VALIDITY_POSITIONS, type ItemRef,
} from '../../../i18n/items';
import { SHADOW_PARTS, RESOURCES, type ShadowPartId, type ResourceId } from './parts';

export const SOMATIC_ZONES = [
  'head', 'jaw-face', 'throat', 'chest', 'gut', 'shoulders-arms', 'pelvis', 'legs',
] as const;
export type SomaticZone = typeof SOMATIC_ZONES[number];

/** §1.12: body-map follow-up fires for 4–5 answers when item index mod 5 == 0. */
export function somaticFollowUpFires(ref: ItemRef, answer: number): boolean {
  return ref.kind === 'shadow' && answer >= 4 && ref.index % 5 === 0;
}

export function toAssessmentInput(answers: number[]): AssessmentInput {
  const seq = buildItemSequence();
  if (answers.length !== seq.length) {
    throw new Error(`Expected ${seq.length} answers, got ${answers.length}`);
  }
  const shadow = {} as Record<ShadowPartId, number[]>;
  for (const p of SHADOW_PARTS) shadow[p] = [];
  const resources = {} as Record<ResourceId, number[]>;
  for (const r of RESOURCES) resources[r] = [];
  const self: number[] = [];
  let attention = 3;
  const infrequency: [number, number] = [1, 1];

  seq.forEach((ref, i) => {
    const v = answers[i];
    if (v < 1 || v > 5) throw new Error(`Answer ${i} out of range: ${v}`);
    if (ref.kind === 'shadow') shadow[ref.part][ref.index] = v;
    else if (ref.kind === 'resource') resources[ref.part][ref.index] = v;
    else if (ref.kind === 'self') self[ref.index] = v;
    else if (ref.kind === 'validity') {
      if (ref.which === 'attention') attention = v;
      else if (ref.which === 'infrequency1') infrequency[0] = v;
      else infrequency[1] = v;
    }
  });
  return { shadow, resources, self, validity: { attention, infrequency } };
}

/** Positions (0-based, in sequence order) of the validity items — used by UI to restyle them. */
export function validityAnswerIndexes(): number[] {
  return [...VALIDITY_POSITIONS].map(p => p - 1);
}
