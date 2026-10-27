import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { KEYS } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { computeSynastry } from '../../shared/core/data/synastry';
import { SYNASTRY_DIM_LABELS } from '../../shared/i18n/strings';

// Round 12 critic scratch reproductions. Each test states the expected behaviour.

const input = () => ({
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])),
  self: [3, 4, 5, 3, 4, 5, 3, 4],
  validity: { attention: 3, infrequency: [1, 2] as [number, number] },
});

beforeEach(() => localStorage.clear());

describe('R12-1 full backup restore keeps a part the person renamed', () => {
  it('a renamed canonical part keeps its name after export and restore', async () => {
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'));
    const parts = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    const target = parts[0];
    target.name = 'My own name for this part';
    localStorage.setItem(KEYS.parts, JSON.stringify(parts));
    const exported = exportBackup();
    localStorage.clear();
    const restored = await prepareBackup(JSON.stringify(exported), 'en');
    const back = (restored.entries[KEYS.parts] as any[]).find((part) => part.id === target.id);
    expect(back.name).toBe('My own name for this part');
  });
});

describe('R12-2 legacy cloud restore leaves the parts and profile alone', () => {
  it('an angular-assessment64 restore changes only the 64-answer data; its confirm copy says so', async () => {
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'));
    const partsBefore = localStorage.getItem(KEYS.parts);
    const profileBefore = localStorage.getItem(KEYS.profile);
    const legacy = { schema: 'angular-assessment64', responses: Array(64).fill(3), results: undefined };
    applyBackup(await prepareBackup(JSON.stringify(legacy), 'en', JSON.parse(partsBefore!)));
    const unchanged = localStorage.getItem(KEYS.parts) === partsBefore && localStorage.getItem(KEYS.profile) === profileBefore;
    // The 64-answer branch touches only its own keys. Its confirm copy (cloudRestoreLegacyConfirm) names only that result.
    expect(unchanged).toBe(true);
  });
});

// 64 answers whose AGENCY centre is (b - a) / 4. Other dimensions are neutral (3).
const agency = (a: number, b: number) => [...Array(6).fill(a), ...Array(6).fill(b), ...Array(52).fill(3)];
const neutral = agency(3, 3);
const pos025 = agency(2, 3); // centre +0.25, polePos (follows)
const pos1 = agency(1, 5); // centre +1.0
const neg1 = agency(5, 1); // centre -1.0
const neg05 = agency(4, 2); // centre -0.5, poleNeg (leads)

const agencyText = (p1: number[], p2: number[]) => {
  const row = computeSynastry(p1, p2, 'en').dimensionalResonance.find((d) => d.dimension === 'AGENCY')!;
  return { row, en: row.descriptionEn };
};
const labels = SYNASTRY_DIM_LABELS.AGENCY;

describe('R12-3 synastry harmonic text names a pole only one person holds', () => {
  it('"Both of you are <pole>" is printed when person 2 is balanced', () => {
    const { row, en } = agencyText(pos025, neutral);
    expect(row.pattern).toBe('harmonic');
    expect(en).not.toContain(`Both of you are ${labels.polePos.en}`);
  });
});

describe('R12-4 synastry English pole labels are verbs, not adjectives', () => {
  it('a polarized pair reads as a grammatical sentence', () => {
    const { row, en } = agencyText(pos1, neg1);
    expect(row.pattern).toBe('dissonant');
    // Observed: "Person 1 is follows, Person 2 is leads."
    expect(en).not.toMatch(/\b(is|are|leans?) (follows|leads|balanced)\b/);
  });

  it('a complementary pair does not say "leans balanced"', () => {
    const { row, en } = agencyText(neutral, neg05);
    expect(row.pattern).toBe('complementary');
    expect(en).not.toMatch(/leans balanced/);
  });
});

describe('R12-5 synastry gap percentage keeps distinct gaps distinct', () => {
  it('a 1.5 gap and a 2.0 gap do not both print "100%"', () => {
    const a = agencyText(pos1, neg05).en; // gap 1.5
    const b = agencyText(pos1, neg1).en; // gap 2.0
    const pctA = a.match(/\((\d+)% gap\)/)?.[1];
    const pctB = b.match(/\((\d+)% gap\)/)?.[1];
    expect(pctA).toBeDefined();
    expect(pctA).not.toBe(pctB);
  });
});
