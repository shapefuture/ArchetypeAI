// Round 23 probe (critic): a part whose family the person moved (a retake keeps it, withPersonEdits) must keep an archetype
// cluster that follows that family after a backup restore. backup.ts prepareBackup rebuilds each part as
// { ...rebuilt, ...saved, archetype: rebuilt.archetype } and so takes the cluster from the canonical family, not the saved one.
import { beforeEach, describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile, withPersonEdits, type ClinicalPart } from './clinical-profile-adapter.ts';
import { applyBackup, prepareBackup } from './backup';

const PARTS_KEY = 'ifs.parts';
const PROFILE_KEY = 'ifs.profile';

const answers = Array.from({ length: 147 }, (_, i) => (i % 5) + 1);
const adapted = adaptClinicalProfile(scoreProfile(toAssessmentInput(answers)), 'en');

/** The part as the app saves it after the person moved it from manager to exile on a retake. */
function movedToExile(): ClinicalPart[] {
  const base = adapted.parts.find((part) => part.id === 'taskmaster') as ClinicalPart;
  const moved = withPersonEdits(base, { ...base, family: 'exile' });
  return adapted.parts.map((part) => (part.id === 'taskmaster' ? moved : part)) as ClinicalPart[];
}

function backupText(parts: unknown[]): string {
  return JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { [PROFILE_KEY]: adapted.profile, [PARTS_KEY]: parts } });
}

beforeEach(() => localStorage.clear());

describe('round23: a restored part keeps the archetype cluster of the family the person chose', () => {
  it('control: the saved family itself survives the restore', async () => {
    const backup = await prepareBackup(backupText(movedToExile()), 'en');
    const part = (backup.entries[PARTS_KEY] as ClinicalPart[]).find((item) => item.id === 'taskmaster');
    expect(part?.family).toBe('exile');
  });

  it('the restored part\'s archetype cluster follows its restored family', async () => {
    const backup = await prepareBackup(backupText(movedToExile()), 'en');
    const part = (backup.entries[PARTS_KEY] as ClinicalPart[]).find((item) => item.id === 'taskmaster');
    expect(part?.archetype?.cluster, 'restored taskmaster archetype.cluster').toBe('exiles');
  });

  it('after a replace-mode restore the stored part\'s cluster follows its stored family', async () => {
    const backup = await prepareBackup(backupText(movedToExile()), 'en');
    applyBackup(backup, localStorage, 'replace');
    const stored = JSON.parse(localStorage.getItem(PARTS_KEY) ?? '[]') as ClinicalPart[];
    const part = stored.find((item) => item.id === 'taskmaster');
    expect(part?.family).toBe('exile');
    expect(part?.archetype?.cluster, 'stored taskmaster archetype.cluster').toBe('exiles');
  });
});
