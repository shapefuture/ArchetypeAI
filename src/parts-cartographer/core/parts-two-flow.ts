// core/parts-two-flow.ts — the order of the Assessment 2.0 screens (plan §4). Pure: no storage, no UI.
// The list is derived from the answers so far. Screens are only ever appended after the ones already answered,
// so a Next step always lands on the first screen that is still owed.

import {
  SCENES, rankFamilies, scoreFamilies, skipsConfirm, type Assessment2Input, type SceneId,
} from '../../shared/core/data/assessment2/scoring';
import { EXILES, MEMBERS, MEMBER_DEFS, type ExileId, type FamilyId, type MemberId } from '../../shared/core/data/assessment2/taxonomy';

export type Parts2Screen =
  | { kind: 'ground' }
  | { kind: 'scene'; scene: SceneId; index: number }
  | { kind: 'pick'; family: FamilyId }
  | { kind: 'timing'; member: MemberId }
  | { kind: 'confirm'; member: MemberId }
  | { kind: 'fear'; member: MemberId }
  | { kind: 'exile'; exile: ExileId }
  | { kind: 'blend'; key: string }
  | { kind: 'provider'; exile: ExileId }
  | { kind: 'capacity' }
  | { kind: 'ground2' }
  | { kind: 'place' }
  | { kind: 'result' };

/** The stage each screen belongs to (plan §4): 0 ground, 1 scenes, 2 narrow, 3 confirm, 4 beneath, 5 toward, 6 place. */
export function stageOf(screen: Parts2Screen): number {
  switch (screen.kind) {
    case 'ground': return 0;
    case 'scene': return 1;
    case 'pick': case 'timing': return 2;
    case 'confirm': return 3;
    case 'fear': case 'exile': return 4;
    case 'blend': case 'provider': case 'capacity': case 'ground2': return 5;
    case 'place': return 6;
    case 'result': return 7;
  }
}

/** Members the person picked in stage 2, in the fixed member order. A family's pick is 'none' when nothing fits. */
export function namedMembers(input: Assessment2Input): MemberId[] {
  return MEMBERS.filter((member) => input.picks[MEMBER_DEFS[member].family] === member);
}

/** Exiles named by a protector's fear answer, in the fixed exile order. */
export function namedExiles(input: Assessment2Input): ExileId[] {
  const named = new Set<ExileId>();
  for (const member of namedMembers(input)) {
    const fear = input.fears[member];
    if (fear && fear !== 'none') named.add(fear);
  }
  return EXILES.filter((exile) => named.has(exile));
}

/** The screens owed, in order. Stops after the scenes until every scene has been answered. */
export function buildScreens(input: Assessment2Input): Parts2Screen[] {
  const screens: Parts2Screen[] = [{ kind: 'ground' }];
  SCENES.forEach((scene, index) => screens.push({ kind: 'scene', scene, index }));
  if (input.scenes.length !== SCENES.length) return screens;

  for (const { family } of rankFamilies(scoreFamilies(input.scenes))) screens.push({ kind: 'pick', family });

  const members = namedMembers(input);
  for (const member of members) screens.push({ kind: 'timing', member });
  for (const member of members) {
    if (!skipsConfirm(MEMBER_DEFS[member].family, input.scenes)) screens.push({ kind: 'confirm', member });
  }

  const exiles = namedExiles(input);
  if (!input.lighter) {
    for (const member of members) screens.push({ kind: 'fear', member });
    for (const exile of exiles) screens.push({ kind: 'exile', exile });
  }

  for (const member of members) screens.push({ kind: 'blend', key: `member:${member}` });
  if (!input.lighter) {
    for (const exile of exiles) screens.push({ kind: 'blend', key: `exile:${exile}` });
    for (const exile of exiles) screens.push({ kind: 'provider', exile });
  }

  screens.push({ kind: 'capacity' }, { kind: 'ground2' }, { kind: 'place' }, { kind: 'result' });
  return screens;
}

/** Keep an index inside the list when answers have changed the list under it. */
export function clampIndex(screens: Parts2Screen[], index: number): number {
  return Math.max(0, Math.min(index, screens.length - 1));
}

/** Stages the person has passed. The lighter path skips stage 4 (beneath), so it is not listed. */
export function completedStagesFor(input: Assessment2Input): number[] {
  const all = [0, 1, 2, 3, 4, 5, 6];
  return input.lighter ? all.filter((stage) => stage !== 4) : all;
}
