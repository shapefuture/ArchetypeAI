import { beforeEach, describe, expect, it } from 'vitest';
import { prepareBackup, validMapParts } from './backup';

beforeEach(() => localStorage.clear());

const part = (extra: Record<string, unknown>) => ({
  id: 'p-mine', name: 'Mine', family: 'manager',
  traits: { shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false },
  role: 'keeps order', blurb: 'b', energy: 50, burden: 'carries plans', need: 'to be heard', voice: 'v', star: false, since: 'now', ...extra,
});

describe('critic r14: restored parts with non-text fields the screens draw', () => {
  it('validMapParts refuses a part whose role is an object', () => {
    expect(validMapParts([part({ role: { nested: 1 } })])).toBe(false);
  });

  it('validMapParts refuses a part whose need is an object', () => {
    expect(validMapParts([part({ need: { nested: 1 } })])).toBe(false);
  });

  it('a backup with a part whose role is an object is skipped as damaged, not restored', async () => {
    const text = JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', 'ifs.parts': [part({ role: { nested: 1 } })] } });
    const prepared = await prepareBackup(text, 'en');
    expect(prepared.skipped).toEqual(['ifs.parts']);
  });
});
