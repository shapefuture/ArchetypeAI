import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { KEYS, store } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { IV_PARTS } from '../../shared/features/landing/stickers';
import { snapshot, fromDocument } from './cloud-storage';
import { validClinicalScore } from './profile-contract';

const input = () => ({ shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])), self: [3, 4, 5, 3, 4, 5, 3, 4], validity: { attention: 3, infrequency: [1, 2] as [number, number] } });
beforeEach(() => localStorage.clear());

describe('cross-version local backup and cloud boundaries', () => {
  it('reconstructs canonical scores and reference coordinates in either language', async () => {
    const expected = scoreProfile(input() as any);
    const prepared = await prepareBackup(JSON.stringify(input()), 'ru');
    const profile = prepared.entries[KEYS.profile] as any;
    expect(profile.clinical).toEqual(expected);
    expect(validClinicalScore(profile.clinical)).toBe(true);
    for (const part of prepared.entries[KEYS.parts] as any[]) {
      const reference = IV_PARTS.find((item) => item.id === part.id)!;
      expect(part.archetype.coordinates).toEqual([reference.ax.ag, reference.ax.te, reference.ax.fo, reference.ax.at].map((v) => (v - 50) / 50));
    }
    expect(profile.headlineRu).not.toBe(profile.headlineConstellation);
  });

  it('preserves local custom parts and edits when rebuilding an imported assessment', async () => {
    const parts = adaptClinicalProfile(scoreProfile(input() as any), 'en').parts;
    const custom = { ...parts[0], id: 'custom-one', name: 'My custom part' };
    const prepared = await prepareBackup(JSON.stringify(input()), 'en', [{ ...parts[0], need: 'edited privately' }, custom]);
    const restored = prepared.entries[KEYS.parts] as any[];
    expect(restored.find((p) => p.id === parts[0].id).need).toBe('edited privately');
    expect(restored.find((p) => p.id === custom.id)).toEqual(custom);
  });

  it('round-trips local answers, reflection and history without auth, billing or push tokens', async () => {
    const prepared = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(prepared);
    store.save('INNERVERSE_FUTURE_SELF_V1', ['Private A', 'Private B', 'Private C']);
    store.save(KEYS.history, prepared.entries[KEYS.profile]);
    store.save(KEYS.auth, { uid: 'secret' });
    localStorage.setItem('INNERVERSE_PUSH_TOKEN_V1', 'secret');
    store.save(KEYS.billing, { premium: true });
    const exported = exportBackup();
    expect(JSON.stringify(exported)).not.toContain('secret');
    expect(exported.data).not.toHaveProperty(KEYS.billing);
    const imported = await prepareBackup(JSON.stringify(exported), 'ru');
    expect(imported.entries.INNERVERSE_FUTURE_SELF_V1).toEqual(['Private A', 'Private B', 'Private C']);
    expect(imported.entries[`${KEYS.history}.hist`]).toHaveLength(1);
    expect((imported.entries[KEYS.profile] as any).clinical).toEqual((prepared.entries[KEYS.profile] as any).clinical);
  });

  it('round-trips the goal record and rejects a corrupt goal before any write', async () => {
    const goal = { schema: 'goal.v1', id: 'goal-1', status: 'active', updatedAt: '2026-10-01T00:00:00.000Z', revision: 1,
      season: { goals: ['Speak up in meetings'], endpoints: [] }, statementHistory: ['Speak up in meetings'], hypotheses: [], rejected: [], tools: [], outcomes: [] };
    store.save('INNERVERSE_GOAL_V1', goal);
    const exported = exportBackup();
    localStorage.clear();
    applyBackup(await prepareBackup(JSON.stringify(exported), 'en'));
    expect(JSON.parse(localStorage.getItem('INNERVERSE_GOAL_V1')!)).toEqual(goal);
    localStorage.clear();
    // A corrupt goal is left out (and listed) while the rest of the backup stays restorable; nothing is written yet.
    const partial = await prepareBackup(JSON.stringify({ ...exported, data: { ...exported.data, INNERVERSE_GOAL_V1: { schema: 'goal.v1' } } }), 'en');
    expect(partial.skipped).toEqual(['INNERVERSE_GOAL_V1']);
    expect(partial.entries.INNERVERSE_GOAL_V1).toBeUndefined();
    expect(localStorage.length).toBe(0);
  });

  it('rejects malformed answers, incomplete report contracts, pollution and unknown versions before writes', async () => {
    const malformed = input(); malformed.shadow[SHADOW_PARTS[0]][0] = 8;
    for (const text of [JSON.stringify(malformed), '{"__proto__":{}}', '{"schema":"parts-cartographer.backup.v9","data":{}}', JSON.stringify({ [KEYS.profile]: { testModel: 'angular-v2', clinical: {} } })]) {
      await expect(prepareBackup(text, 'en')).rejects.toThrow();
    }
    expect(localStorage.length).toBe(0);
  });

  it('restores canonical reference coordinates over a stale saved archetype while keeping user edits', async () => {
    const parts = adaptClinicalProfile(scoreProfile(input() as any), 'en').parts;
    const stale = { ...parts[0], need: 'kept edit', archetype: { ...parts[0].archetype!, coordinates: [0.9, 0.9, 0.9, 0.9] as [number, number, number, number] } };
    const prepared = await prepareBackup(JSON.stringify(input()), 'en', [stale]);
    const restored = (prepared.entries[KEYS.parts] as any[]).find((p) => p.id === parts[0].id);
    expect(restored.archetype).toEqual(parts[0].archetype);
    expect(restored.archetype.coordinateBasis).toBe('fixed-reference-147');
    expect(restored.need).toBe('kept edit');
  });

  it('restores full and partial historical 64-item backups without confusing the two result routes', async () => {
    const complete = await prepareBackup(JSON.stringify({ assessmentResponses: Array(64).fill(3), results: { analysis: 'old report' } }), 'ru');
    expect((complete.entries['ifs.legacy64.result'] as any).version).toBe('angular-assessment-64.v2');
    expect(complete.entries.ARCHETYPE_ASSESSMENT_RESPONSES).toEqual(Array(64).fill(3));
    expect(complete.entries).not.toHaveProperty(KEYS.profile);
    const partial = await prepareBackup(JSON.stringify([3, ...Array(63).fill(0)]), 'en');
    expect(partial.entries.ARCHETYPE_ASSESSMENT_INDEX).toBe(1);
    expect(partial.entries['ifs.legacy64.result']).toBeNull();
    applyBackup(partial);
    await expect(prepareBackup(JSON.stringify(exportBackup()), 'en')).resolves.toBeTruthy();
  });

  it('rolls back every key on quota failure and emits refresh only on success', () => {
    localStorage.setItem('ifs.lang', '"en"');
    const actualSet = localStorage.setItem.bind(localStorage);
    const storage = { getItem: localStorage.getItem.bind(localStorage), removeItem: localStorage.removeItem.bind(localStorage), setItem: vi.fn((key, value) => { if (key === 'ifs.theme' && value === '"dark"') throw new Error('quota'); actualSet(key, value); }) } as unknown as Storage;
    const refresh = vi.fn(); window.addEventListener('ifs:local-restored', refresh);
    expect(() => applyBackup({ schema: 'parts-cartographer.backup.v2', source: 'test', entries: { 'ifs.lang': 'ru', 'ifs.theme': 'dark' } }, storage)).toThrow('quota');
    expect(localStorage.getItem('ifs.lang')).toBe('"en"');
    expect(refresh).not.toHaveBeenCalled();
    applyBackup({ schema: 'parts-cartographer.backup.v2', source: 'test', entries: { 'ifs.lang': 'ru' } });
    expect(refresh).toHaveBeenCalledTimes(1);
    window.removeEventListener('ifs:local-restored', refresh);
  });

  it('replace clears portable state but retains the authenticated account', () => {
    localStorage.setItem(KEYS.auth, 'account');
    localStorage.setItem('INNERVERSE_FUTURE_SELF_V1', '["old"]');
    applyBackup({ schema: 'parts-cartographer.backup.v2', source: 'test', entries: { 'ifs.lang': 'ru' } }, localStorage, 'replace');
    expect(localStorage.getItem('INNERVERSE_FUTURE_SELF_V1')).toBeNull();
    expect(localStorage.getItem(KEYS.auth)).toBe('account');
  });

  it('projects minimal cloud aggregates without raw answers or nested private content', async () => {
    const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    const profile = { ...adapted.profile, answers: input(), futureSelf: ['private'], clinical: { ...adapted.profile.clinical, responses: input(), parts: { ...adapted.profile.clinical.parts, taskmaster: { ...adapted.profile.clinical.parts.taskmaster, journal: 'private' } } } };
    const data = snapshot(profile, [{ ...adapted.parts[0], somatic: 5, journal: 'private', traits: { ...adapted.parts[0].traits, answers: 'private' } }], '2026-10-03T00:00:00Z');
    expect(JSON.stringify(data)).not.toContain('private');
    expect(JSON.stringify(data)).not.toContain('somatic');
    expect(await fromDocument('saved', data as any)).toMatchObject({ id: 'saved', schema: 'parts-cartographer.v1' });
    expect(await fromDocument('malformed', { ...data, profile: {} })).toBeNull();
    const historical = await fromDocument('legacy', { responses: Array(64).fill(3), results: { analysis: 'old' } });
    expect(historical?.source?.responses).toHaveLength(64);
    expect(historical?.parts.length).toBeGreaterThan(0);
  });
});

describe('sealed notes in a backup', () => {
  it('refuses a malformed ifs.sealed instead of storing a value that breaks start-up', async () => {
    for (const bad of [{}, [null], [{ until: 'soon', text: 'x' }]]) {
      await expect(prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.sealed': bad } }), 'en'))
        .rejects.toThrow();
    }
    const ok = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.sealed': [{ until: 1, text: 'note' }] } }), 'en');
    expect(ok.entries['ifs.sealed']).toEqual([{ until: 1, text: 'note' }]);
  });
});

describe('partly damaged backups', () => {
  it('restores the good keys and lists the damaged ones', async () => {
    const prepared = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: {
      'ifs.lang': 'ru',
      'ifs.journal': [{ id: 1, at: 1, kind: 'jTrigger', what: 'kept', where: '', part: '', note: '' }],
      'ifs.sealed': {},
    } }), 'en');
    expect(prepared.entries['ifs.journal']).toEqual([{ id: 1, at: 1, kind: 'jTrigger', what: 'kept', where: '', part: '', note: '' }]);
    expect(prepared.skipped).toEqual(['ifs.sealed']);
  });

  it('refuses a journal of the wrong shape', async () => {
    const prepared = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', 'ifs.journal': {} } }), 'en');
    expect(prepared.entries['ifs.journal']).toBeUndefined();
    expect(prepared.skipped).toEqual(['ifs.journal']);
  });
});
