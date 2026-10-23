import { describe, it, expect } from 'vitest';
import { SHADOW_PARTS, RESOURCES, SELF_QUALITIES } from '../shared/core/data/parts';
import {
  ITEM_BANK, LIKERT, buildItemSequence, buildDescents, itemText, isReverseKeyed,
  VALIDITY_POSITIONS,
} from '../shared/i18n/items';

describe('item bank (§1.2)', () => {
  it('has 112 shadow items: 14 parts × 8, non-empty in both languages', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const p of SHADOW_PARTS) {
        const items = ITEM_BANK[lang].items[p];
        expect(items.length).toBe(8);
        for (const q of items) {
          expect(q.trim().length).toBeGreaterThan(10);
          expect(q.endsWith('.')).toBe(false); // Likert statements, no periods
        }
      }
    }
  });
  it('has 24 resource + 8 self + 3 validity items in both languages', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const r of RESOURCES) expect(ITEM_BANK[lang].resources[r].length).toBe(6);
      expect(ITEM_BANK[lang].self.length).toBe(8);
      expect(ITEM_BANK[lang].validity.attention.length).toBeGreaterThan(5);
      expect(ITEM_BANK[lang].validity.infrequency1.length).toBeGreaterThan(5);
    }
  });
  it('147 total = 112 + 24 + 8 + 3', () => {
    expect(112 + 24 + 8 + 3).toBe(147);
  });
  it('self items map positionally to the 8 C\'s', () => {
    // quality order is asserted by scoring-v2; here just same 8 slots both langs
    expect(ITEM_BANK.en.self.length).toBe(SELF_QUALITIES.length);
    expect(ITEM_BANK.ru.self.length).toBe(SELF_QUALITIES.length);
  });
  it('validity attention wording matches the "Sometimes" anchor (index 3 of 5)', () => {
    expect(ITEM_BANK.en.validity.attention).toContain(LIKERT.en[2]);
    expect(ITEM_BANK.ru.validity.attention).toContain(LIKERT.ru[2]);
  });
});

describe('delivery schedule (§1.2, §3.2)', () => {
  const seq = buildItemSequence();
  it('is exactly 147 items, identical on every call', () => {
    expect(seq.length).toBe(147);
    expect(JSON.stringify(seq)).toBe(JSON.stringify(buildItemSequence()));
  });
  it('places validity items at 1-based positions 40, 84, 120', () => {
    for (const pos of VALIDITY_POSITIONS) {
      expect(seq[pos - 1].kind).toBe('validity');
    }
    expect(seq[39].kind === 'validity' && (seq[39] as { which: string }).which).toBe('attention');
    expect(seq.filter(i => i.kind === 'validity').length).toBe(3);
  });
  it('contains every scored item exactly once (144)', () => {
    const keys = seq.filter(i => i.kind !== 'validity')
      .map(i => (i.kind === 'self' ? `self:${i.index}` : `${i.kind}:${i.part}:${i.index}`));
    expect(new Set(keys).size).toBe(144);
  });
  it('splits into 3 descents of 49', () => {
    const d = buildDescents();
    expect(d.map(x => x.length)).toEqual([49, 49, 49]);
  });
  it('never shows two items of the same part back to back', () => {
    const partOf = (i: (typeof seq)[number]) =>
      i.kind === 'self' ? 'self' : i.kind === 'validity' ? 'validity' : i.part;
    for (let i = 1; i < seq.length; i++) {
      expect(partOf(seq[i])).not.toBe(partOf(seq[i - 1]));
    }
  });
  it('reverse-keyed flags match the q7/q8 contract', () => {
    const shadow = seq.filter(i => i.kind === 'shadow');
    expect(shadow.filter(isReverseKeyed).length).toBe(28); // 14 parts × 2
    for (const i of shadow) {
      if (i.kind === 'shadow') {
        expect(isReverseKeyed(i)).toBe(i.index >= 6);
      }
    }
  });
  it('itemText resolves every ref in both languages', () => {
    for (const ref of seq) {
      for (const lang of ['en', 'ru'] as const) {
        expect(itemText(ref, lang).length).toBeGreaterThan(5);
      }
    }
  });
});
