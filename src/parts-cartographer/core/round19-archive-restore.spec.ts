// Critic 19: a report archive (<key>.hist) is validated as one value. One copy that fails the
// current validator makes prepareBackup skip the whole archive, so the valid copies in the same
// file are not restored, and the screen reports only "1 damaged item".
import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { prepareBackup } from './backup';

const { profile } = adaptClinicalProfile(scoreProfile(toAssessmentInput(Array(147).fill(3))), 'en');
const good = JSON.stringify(profile);
const { selfEnergyRadar: _omitted, ...withoutRadar } = profile as any;
const stale = JSON.stringify(withoutRadar);

const backupWith = (archive: string[]) => JSON.stringify({
  schema: 'parts-cartographer.backup.v2',
  data: { 'ifs.lang': 'en', 'ifs.profile.hist': archive },
});

describe('report archive restore (round 19)', () => {
  it('control: an archive of valid copies restores', async () => {
    const prepared = await prepareBackup(backupWith([good, good]), 'en');
    expect(prepared.skipped).toEqual([]);
    expect(prepared.entries['ifs.profile.hist']).toHaveLength(2);
  });

  it('one stale copy in the archive does not discard the valid copies beside it', async () => {
    const prepared = await prepareBackup(backupWith([good, stale]), 'en');
    expect(prepared.skipped).toEqual([]);
    expect(prepared.entries['ifs.profile.hist']).toHaveLength(2);
  });
});
