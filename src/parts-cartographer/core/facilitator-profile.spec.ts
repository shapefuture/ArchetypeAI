import { describe, expect, it, vi } from 'vitest';
import { checkFacilitatorStatement, saveCheckedFacilitatorStatement, STATEMENT_MAX_CHARS } from './facilitator-profile.ts';

const base = { name: 'Dr Lee', statement: '  I facilitate group sessions and do not diagnose.  ', qualificationProvidedBy: 'facilitator' as const };

describe('facilitator statement check', () => {
  it('accepts a plain statement, trims it, and returns only the profile fields', () => {
    const check = checkFacilitatorStatement(base);
    expect(check).toEqual({
      ok: true,
      profile: { name: 'Dr Lee', statement: 'I facilitate group sessions and do not diagnose.', qualificationProvidedBy: 'facilitator' },
    });
  });

  it('refuses an empty name or statement', () => {
    expect(checkFacilitatorStatement({ ...base, name: '  ' })).toEqual({ ok: false, reason: 'empty-name' });
    expect(checkFacilitatorStatement({ ...base, statement: '   ' })).toEqual({ ok: false, reason: 'empty-statement' });
  });

  it('refuses a statement over the length bound', () => {
    expect(checkFacilitatorStatement({ ...base, statement: 'a'.repeat(STATEMENT_MAX_CHARS + 1) }))
      .toEqual({ ok: false, reason: 'statement-too-long' });
    expect(checkFacilitatorStatement({ ...base, statement: 'a'.repeat(STATEMENT_MAX_CHARS) }).ok).toBe(true);
  });

  it('refuses efficacy or validation claims in English and Russian', () => {
    expect(checkFacilitatorStatement({ ...base, statement: 'A clinically proven method.' }))
      .toEqual({ ok: false, reason: 'efficacy-claim' });
    expect(checkFacilitatorStatement({ ...base, statement: 'Guaranteed results for everyone.' }))
      .toEqual({ ok: false, reason: 'efficacy-claim' });
    expect(checkFacilitatorStatement({ ...base, statement: 'Клинически доказанный метод.' }))
      .toEqual({ ok: false, reason: 'efficacy-claim' });
  });

  it('refuses an app-issued credential, a ranking field, or a recruitment-pressure field', () => {
    expect(checkFacilitatorStatement({ ...base, qualificationProvidedBy: 'app' as never }))
      .toEqual({ ok: false, reason: 'app-credential' });
    expect(checkFacilitatorStatement({ ...base, rank: 1 })).toEqual({ ok: false, reason: 'ranking-field' });
    expect(checkFacilitatorStatement({ ...base, recruitTarget: 50 })).toEqual({ ok: false, reason: 'pressure-field' });
  });
});

describe('saving a checked statement', () => {
  it('saves exactly the checked profile', async () => {
    const save = vi.fn(async () => undefined);
    const result = await saveCheckedFacilitatorStatement(base, save);
    expect(result.ok).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toEqual({ name: 'Dr Lee', statement: 'I facilitate group sessions and do not diagnose.', qualificationProvidedBy: 'facilitator' });
  });

  it('never calls save on a refusal', async () => {
    const save = vi.fn(async () => undefined);
    const result = await saveCheckedFacilitatorStatement({ ...base, deadline: '2026-12-01' }, save);
    expect(result).toEqual({ ok: false, reason: 'pressure-field' });
    expect(save).not.toHaveBeenCalled();
  });
});
