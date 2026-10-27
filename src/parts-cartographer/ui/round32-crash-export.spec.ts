// Round 32 probe (critic). core/backup.ts says what leaves the device: NOT_PORTABLE keys ("bearer share codes", "the partner
// code of each synastry run ... must not leave the device", sign-in, billing, push tokens) are excluded from every backup
// file, and exportBackup (the Backup screen) honours that. The crash screen's "Save my data" button instead calls
// localDataSnapshot (ui/app-error-boundary.jsx), which copies every localStorage key into the downloaded file, so those
// bearer codes, partner codes, sign-in identity and billing receipt are written to the file the person may keep or share.
import { beforeEach, describe, expect, it } from 'vitest';
import { localDataSnapshot } from './app-error-boundary.jsx';
import { exportBackup } from '../core/backup';

const NOT_PORTABLE_SECRETS = [
  'ifs.share.codes',
  'INNERVERSE_SYNASTRY_RUNS_V1',
  'ifs.auth',
  'ifs.billing.verified.v2',
];

describe('round32: the crash-screen save writes only what the backup contract allows', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ifs.lang', JSON.stringify('en'));
    localStorage.setItem('ifs.share.codes', JSON.stringify([{ c: 'a1b2c3d4e5f6g7h8', uid: 'uid_x', at: 1, source: 'cloud-map' }]));
    localStorage.setItem('INNERVERSE_SYNASTRY_RUNS_V1', JSON.stringify([{ at: '2026-10-01T10:00:00.000Z', partnerCode: 'PARTNER42' }]));
    localStorage.setItem('ifs.auth', JSON.stringify({ uid: 'uid_x', email: 'person@example.com', provider: 'email', linked: true }));
    localStorage.setItem('ifs.billing.verified.v2', JSON.stringify({ uid: 'uid_x', sessionId: 'cs_test_123', verifiedAt: 1 }));
    localStorage.setItem('INNERVERSE_JOURNAL_NOTE', JSON.stringify('a private note'));
  });

  it('control: the Backup screen export leaves every bearer code and identity key out', () => {
    const keys = Object.keys(exportBackup(localStorage).data);
    for (const key of NOT_PORTABLE_SECRETS) expect(keys).not.toContain(key);
  });

  it('the crash-screen export leaves the same non-portable keys out', () => {
    const keys = Object.keys(localDataSnapshot().data);
    for (const key of NOT_PORTABLE_SECRETS) expect(keys).not.toContain(key);
  });
});
