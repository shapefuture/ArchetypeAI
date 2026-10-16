import { beforeEach, describe, expect, it } from 'vitest';
import { validateScene } from './scene-grammar.ts';
import { validateSceneAssets } from './asset-budget.ts';
import {
  DEFAULT_SCENE_ID, EMPTY_EVIDENCE, WORLD_KEY, finishScene, localizeDefaultScene, normalizeReplayRecord, normalizeWorld, saveVerified,
} from './replay-scenes.ts';
import { MAX_BEATS } from './replay-authoring.ts';
import { store } from './local-store.ts';

const en = localizeDefaultScene('en');
const ru = localizeDefaultScene('ru');
// Reconstruction, prediction and clinical-efficacy wording is not allowed in any authored copy (English and Russian).
const FORBIDDEN = /happened|will happen|predict|reconstruct|diagnos|validated|proven|therap|clinical|cure|heal|диагн|доказан|клиничес|терап|предск|реконстр|излеч/i;

beforeEach(() => { localStorage.clear(); });

describe('authored everyday scene', () => {
  it.each([['en', en], ['ru', ru]] as const)('passes the scene grammar in %s', (_lang, local) => {
    expect(validateScene(local.scene)).toEqual({ ok: true });
  });

  it.each([['en', en], ['ru', ru]] as const)('passes the asset budget in %s', (_lang, local) => {
    const result = validateSceneAssets(local.assets, local.budgetUnits);
    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ ok: true, totalUnits: 10 });
  });

  it('has the same structure in both languages', () => {
    expect(ru.scene.start).toBe(en.scene.start);
    expect(ru.scene.nodes.map((n) => [n.id, n.exits, n.terminal])).toEqual(en.scene.nodes.map((n) => [n.id, n.exits, n.terminal]));
    expect(ru.assets.map((a) => [a.id, a.costUnits, a.grammarId])).toEqual(en.assets.map((a) => [a.id, a.costUnits, a.grammarId]));
    expect(Object.keys(ru.choiceLabels).sort()).toEqual(Object.keys(en.choiceLabels).sort());
  });

  it('has a branch, at least one ending, and a text alternative for every frame in both languages', () => {
    for (const local of [en, ru]) {
      expect(local.scene.nodes.some((n) => n.exits.length >= 2)).toBe(true);
      expect(local.scene.nodes.filter((n) => n.terminal).length).toBeGreaterThan(0);
      expect(local.scene.nodes.every((n) => n.textAlternative.trim().length > 0)).toBe(true);
      expect(local.assets.every((a) => a.staticEquivalent.trim().length > 0)).toBe(true);
    }
  });

  it('uses only neutral copy, with no claims about real events or clinical effects', () => {
    const texts = [en.title, ru.title, ...en.scene.nodes.flatMap((n) => [n.text, n.textAlternative]),
      ...ru.scene.nodes.flatMap((n) => [n.text, n.textAlternative]), ...Object.values(en.choiceLabels), ...Object.values(ru.choiceLabels)];
    expect(texts.filter((text) => FORBIDDEN.test(text))).toEqual([]);
  });

  it('falls back to English for an unknown language', () => {
    expect(localizeDefaultScene('de').title).toBe(en.title);
    expect(localizeDefaultScene('de').id).toBe(DEFAULT_SCENE_ID);
  });
});

describe('Replay record normalization', () => {
  it('falls back to an empty record for corrupt or wrong-shaped values', () => {
    for (const bad of [null, 'text', 42, [], { scene: 'nope', evidence: null }]) {
      const record = normalizeReplayRecord(bad);
      expect(record.scene).toBeNull();
      expect(record.evidence).toEqual(EMPTY_EVIDENCE);
      expect(record.presentation).toEqual({ camera: 'wide', pacing: 'normal', emphasis: null });
    }
  });

  it('keeps valid pieces, caps lists, and drops an emphasis that is not a cast member', () => {
    const record = normalizeReplayRecord({
      scene: { id: 'own-1', title: 'Door', optIn: true, castNames: ['Sam', 7], beats: Array.from({ length: MAX_BEATS + 3 }, (_, i) => `b${i}`) },
      presentation: { camera: 'close', pacing: 'slow', emphasis: 'Nobody' },
      evidence: { playtimeMinutes: -5, userBenefitReports: 2.9, demandRecords: 'x', complexityNotes: ['a', null] },
    });
    expect(record.scene?.castNames).toEqual(['Sam']);
    expect(record.scene?.beats).toHaveLength(MAX_BEATS);
    expect(record.presentation).toEqual({ camera: 'close', pacing: 'slow', emphasis: null });
    expect(record.evidence).toEqual({ playtimeMinutes: 0, userBenefitReports: 2, demandRecords: 0, complexityNotes: ['a'] });
  });
});

describe('world record and scene completion', () => {
  it('records a finished scene once and keeps progress equal to the count', () => {
    const once = finishScene({ places: [], progress: 0, graduated: false }, DEFAULT_SCENE_ID);
    const twice = finishScene(once, DEFAULT_SCENE_ID);
    expect(twice).toBe(once);
    expect(twice).toEqual({ places: [DEFAULT_SCENE_ID], progress: 1, graduated: false });
  });

  it('never reduces places or progress when another scene is finished', () => {
    const next = finishScene({ places: ['a', 'b'], progress: 2, graduated: true }, 'c');
    expect(next).toEqual({ places: ['a', 'b', 'c'], progress: 3, graduated: true });
  });

  it('normalizes corrupt world values to an empty world', () => {
    expect(normalizeWorld('nope')).toEqual({ places: [], progress: 0, graduated: false });
    expect(normalizeWorld({ places: ['x', 3, 'x', ''], progress: 99 })).toEqual({ places: ['x'], progress: 1, graduated: false });
  });

  it('reports a save as stored only when the browser keeps the value', () => {
    expect(saveVerified(WORLD_KEY, { places: [], progress: 0, graduated: false })).toBe(true);
    expect(store.load(WORLD_KEY, null)).toEqual({ places: [], progress: 0, graduated: false });
  });
});
