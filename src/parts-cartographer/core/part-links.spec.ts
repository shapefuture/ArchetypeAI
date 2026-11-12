import { afterEach, describe, expect, it } from 'vitest';
import {
  LINKS_KEY, NOTE_MAX, addUserLink, derivedLinks, findComplexes, linkSignature, mapLinks, parseLinks, parts2PartId, readUserLinks,
  removeUserLink, saveUserLinks, type PartLink,
} from './part-links';

const link = (from: string, to: string, kind: PartLink['kind'], source: PartLink['source'] = 'user'): PartLink =>
  ({ id: `${kind}-${from}-${to}`, from, to, kind, note: '', source });

afterEach(() => localStorage.clear());

describe('stored links', () => {
  it('keeps valid links and drops self-links, unknown kinds, missing ends and duplicates', () => {
    const parsed = parseLinks([
      { id: 'a', from: 'x', to: 'y', kind: 'protects', note: '  shields it  ' },
      { id: 'b', from: 'x', to: 'x', kind: 'allied' },
      { id: 'c', from: 'x', to: 'y', kind: 'loves' },
      { id: 'd', from: 'x', kind: 'allied' },
      { id: 'e', from: 'x', to: 'y', kind: 'protects', note: 'duplicate' },
      'junk', null,
    ]);
    expect(parsed).toEqual([{ id: 'a', from: 'x', to: 'y', kind: 'protects', note: 'shields it', source: 'user' }]);
    expect(parseLinks({ not: 'a list' })).toEqual([]);
  });

  it('treats a symmetric kind drawn either way as the same link, and a directed kind as two', () => {
    expect(linkSignature({ from: 'a', to: 'b', kind: 'polarized' })).toBe(linkSignature({ from: 'b', to: 'a', kind: 'polarized' }));
    expect(linkSignature({ from: 'a', to: 'b', kind: 'protects' })).not.toBe(linkSignature({ from: 'b', to: 'a', kind: 'protects' }));
  });

  it('caps a note at the maximum length', () => {
    const [only] = parseLinks([{ from: 'a', to: 'b', kind: 'allied', note: 'x'.repeat(NOTE_MAX + 50) }]);
    expect(only.note).toHaveLength(NOTE_MAX);
  });

  it('saves, announces and reads back the person\'s links', () => {
    let announced = 0;
    const onChange = () => { announced += 1; };
    window.addEventListener('ifs:links-changed', onChange);
    expect(saveUserLinks([link('a', 'b', 'triggers')])).toBe(true);
    window.removeEventListener('ifs:links-changed', onChange);
    expect(announced).toBe(1);
    expect(readUserLinks().map((l) => [l.from, l.to, l.kind])).toEqual([['a', 'b', 'triggers']]);
    expect(JSON.parse(localStorage.getItem(LINKS_KEY)!)).toHaveLength(1);
  });

  it('adds a link, replaces the note of the same link instead of adding it twice, and removes by id', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    let links = addUserLink([], { from: 'a', to: 'b', kind: 'polarized', note: 'they argue' }, now);
    links = addUserLink(links, { from: 'b', to: 'a', kind: 'polarized', note: 'they fight over sleep' }, now);
    expect(links).toHaveLength(1);
    expect(links[0].note).toBe('they fight over sleep');
    expect(links[0].createdAt).toBe(now.toISOString());
    expect(addUserLink(links, { from: 'a', to: 'a', kind: 'allied' })).toBe(links);
    expect(removeUserLink(links, links[0].id)).toEqual([]);
  });
});

describe('links the Parts map 2.0 states', () => {
  const result = {
    parts: [
      { key: 'member:rebel', kind: 'protector', guards: ['frightened', 'ashamed'] },
      { key: 'member:numb', kind: 'protector', guards: ['frightened'] },
      { key: 'exile:frightened', kind: 'exile', guards: [] },
    ],
    conflicts: [{ type: 'strategy-against-strategy', keys: ['member:rebel', 'member:numb'] }],
  } as any;
  const ids = new Set(['member:rebel', 'member:numb', 'exile:frightened'].map(parts2PartId));

  it('links each protector to the exiles it guards, and each conflict as a polarisation, only between parts on the map', () => {
    const links = derivedLinks(result, ids);
    expect(links.map((l) => [l.from, l.kind, l.to])).toEqual([
      ['parts2_member_rebel', 'protects', 'parts2_exile_frightened'],
      ['parts2_member_numb', 'protects', 'parts2_exile_frightened'],
      ['parts2_member_rebel', 'polarized', 'parts2_member_numb'],
    ]);
    expect(links.every((l) => l.source === 'parts-2')).toBe(true);
    expect(links[2].note).toBe('strategy-against-strategy');
  });

  it('derives nothing without a result', () => {
    expect(derivedLinks(null, ids)).toEqual([]);
  });

  it('shows the person\'s own link instead of a derived one for the same pair and kind, and drops links to missing parts', () => {
    const derived = derivedLinks(result, ids);
    const own = { ...link('parts2_member_numb', 'parts2_member_rebel', 'polarized'), note: 'one numbs, one fights' };
    const shown = mapLinks([own, link('parts2_member_rebel', 'gone', 'allied')], derived, ids);
    expect(shown.filter((l) => l.kind === 'polarized')).toEqual([own]);
    expect(shown.some((l) => l.to === 'gone')).toBe(false);
    expect(shown).toHaveLength(3);
  });
});

describe('complexes', () => {
  const parts = [
    { id: 'critic', family: 'manager' },
    { id: 'binge', family: 'firefighter' },
    { id: 'shame', family: 'exile' },
    { id: 'planner', family: 'manager' },
    { id: 'pleaser', family: 'manager' },
    { id: 'self', family: 'resource' },
  ];

  it('chains protecting and triggering links into one complex around its exile', () => {
    const complexes = findComplexes([
      link('critic', 'shame', 'protects'),
      link('shame', 'binge', 'triggers'),
      link('planner', 'pleaser', 'allied'),
    ], parts);
    expect(complexes).toEqual([{ id: 'complex_shame', members: ['binge', 'critic', 'shame'], core: 'shame' }]);
  });

  it('names a complex with no exile for its most-linked member', () => {
    const complexes = findComplexes([link('planner', 'pleaser', 'triggers'), link('planner', 'critic', 'protects')], parts);
    expect(complexes).toEqual([{ id: 'complex_planner', members: ['critic', 'planner', 'pleaser'], core: 'planner' }]);
  });

  it('does not form a complex from alliances or polarisations alone, or from links to missing parts', () => {
    expect(findComplexes([link('planner', 'pleaser', 'allied'), link('critic', 'binge', 'polarized'), link('critic', 'ghost', 'protects')], parts)).toEqual([]);
  });

  it('keeps separate chains as separate complexes', () => {
    const complexes = findComplexes([link('critic', 'shame', 'protects'), link('planner', 'pleaser', 'carries')], parts);
    expect(complexes.map((c) => c.members)).toEqual([['critic', 'shame'], ['planner', 'pleaser']]);
  });
});
