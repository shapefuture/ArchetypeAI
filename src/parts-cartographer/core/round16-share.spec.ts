import { beforeEach, describe, expect, it } from 'vitest';
import { exportBackup } from './backup';

beforeEach(() => localStorage.clear());

describe('critic: bearer share codes are not exported in a backup', () => {
  it('a partner share code remembered from a synastry run is absent from the exported file', () => {
    localStorage.setItem('INNERVERSE_SYNASTRY_RUNS_V1', JSON.stringify([{ at: '2026-10-20T10:00:00.000Z', partnerCode: 'partnerabc123' }]));
    const text = JSON.stringify(exportBackup(localStorage));
    expect(text).not.toContain('partnerabc123');
  });
});
