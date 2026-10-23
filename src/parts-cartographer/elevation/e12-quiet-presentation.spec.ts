import { describe, expect, it } from 'vitest';
import { DEFAULT_SENSORY_PREFERENCES, type SensoryPreferences } from '../core/sensory-preferences';
import {
  LARGE_TEXT_SCALE,
  SINGLE_COLUMN_WIDTH,
  lensRows,
  presentItems,
  readSensoryChoice,
  selectPresentation,
  type PresentableItem,
  type PresentationInput,
} from './e12-quiet-presentation';

const sensory: SensoryPreferences = { preset: 'gentle', motion: 'gentle', sound: false, texture: true, density: 'open' };
const base: PresentationInput = {
  webgl: true, audio: true, systemReducedMotion: false, viewportWidth: 1280, zoom: 1, textScale: 1, sensory,
  ambience: { hidden: false, typing: false, error: false },
};
const withInput = (patch: Partial<PresentationInput>): PresentationInput => ({ ...base, ...patch });
const ITEMS: PresentableItem[] = [
  { id: 'part-a', label: 'Part A', source: 'computed', action: 'open-detail' },
  { id: 'part-b', label: 'Part B', source: 'reference', action: 'talk' },
  { id: 'part-c', label: 'Part C', source: 'studio', action: 'book' },
];

describe('E12.04 selectors: the same tasks on every surface', () => {
  it('no WebGL: the accessible list carries the same rows, source and action as the map', () => {
    const map = presentItems(ITEMS, 'part-b', base);
    const list = presentItems(ITEMS, 'part-b', withInput({ webgl: false }));
    expect(map.presentation.surface).toBe('map-3d');
    expect(list.presentation.surface).toBe('accessible-list');
    expect(list.rows).toEqual(map.rows);
    expect(list.rows.map(({ source, action }) => [source, action])).toEqual([
      ['computed', 'open-detail'], ['reference', 'talk'], ['studio', 'book'],
    ]);
  });

  it('a failed or lost WebGL context mid-session keeps the selected item and the chosen sensory settings', () => {
    const before = presentItems(ITEMS, 'part-b', base);
    const after = presentItems(ITEMS, 'part-b', withInput({ webgl: false }));
    expect(after.selectedId).toBe('part-b');
    expect(after.rows.find((row) => row.selected)?.id).toBe('part-b');
    expect(after.presentation).toEqual({ ...before.presentation, surface: 'accessible-list' });
  });

  it('no audio: sound is off with reason unavailable, motion and texture stay, and sound returns without a new choice', () => {
    const wantsSound = withInput({ sensory: { ...sensory, sound: true } });
    expect(selectPresentation({ ...wantsSound, audio: false })).toMatchObject({
      sound: 'off', soundReason: 'unavailable', decorativeMotion: 'play', texture: true,
    });
    expect(wantsSound.sensory.sound).toBe(true);
    expect(selectPresentation(wantsSound)).toMatchObject({ sound: 'on', soundReason: 'chosen' });
    expect(selectPresentation(withInput({ audio: false }))).toMatchObject({ sound: 'off', soundReason: 'not-chosen' });
  });

  it('system reduced motion stops decorative motion and camera inertia whatever the preset or motion setting', () => {
    for (const motion of ['gentle', 'lively', 'still'] as const) {
      const presentation = selectPresentation(withInput({ systemReducedMotion: true, sensory: { ...sensory, motion, preset: motion } }));
      expect(presentation, motion).toMatchObject({ decorativeMotion: 'rest', motionReason: 'system-reduced-motion', cameraInertia: false });
    }
    expect(selectPresentation(base)).toMatchObject({ decorativeMotion: 'play', cameraInertia: true });
  });

  it('mixed sensory settings: each choice keeps its own reason, and the preset label never overrides the motion field', () => {
    const mixed = selectPresentation(withInput({
      webgl: false, audio: true, sensory: { preset: 'custom', motion: 'still', sound: true, texture: false, density: 'compact' },
    }));
    expect(mixed).toMatchObject({
      surface: 'accessible-list', decorativeMotion: 'rest', motionReason: 'still-preference', cameraInertia: false,
      sound: 'on', soundReason: 'chosen', texture: false, density: 'compact', densityReason: 'as-chosen', layout: 'columns',
    });
    expect(selectPresentation(withInput({ sensory: { ...sensory, preset: 'still', motion: 'lively' } })).decorativeMotion).toBe('play');
  });

  it('extreme text expansion keeps every row, uses one column and opens compact density without rewriting the choice', () => {
    const compactChoice = { ...sensory, density: 'compact' as const };
    const input = withInput({ textScale: 2.5, sensory: compactChoice });
    expect(selectPresentation(input)).toMatchObject({
      layout: 'single-column', textFit: 'expand', density: 'open', densityReason: 'opened-for-space',
    });
    expect(input.sensory.density).toBe('compact');
    expect(selectPresentation(withInput({ textScale: 1, sensory: compactChoice }))).toMatchObject({ density: 'compact', densityReason: 'as-chosen' });
    expect(presentItems(ITEMS, null, input).rows).toHaveLength(ITEMS.length);
  });

  it('a 400 percent zoom on a 1280 px window reflows to a single column at 320 CSS px', () => {
    expect(selectPresentation(withInput({ zoom: 4 }))).toMatchObject({ effectiveWidth: 320, layout: 'single-column', textFit: 'expand' });
    expect(selectPresentation(withInput({ zoom: 1 }))).toMatchObject({ layout: 'columns', textFit: 'natural' });
  });

  it('narrow Russian layout keeps long labels with their source and action', () => {
    const ru: PresentableItem[] = [{ id: 'ru-1', label: 'Очень длинное название части для узкого экрана', source: 'вычислено', action: 'открыть' }];
    const narrow = presentItems(ru, 'ru-1', withInput({ viewportWidth: 360, sensory: { ...sensory, density: 'compact' } }));
    expect(narrow.presentation).toMatchObject({ layout: 'single-column', density: 'open', densityReason: 'opened-for-space' });
    expect(narrow.rows).toEqual([{ id: 'ru-1', label: ru[0].label, source: 'вычислено', action: 'открыть', selected: true }]);
  });

  it('layout boundaries sit exactly at the single-column width and the large-text scale', () => {
    expect(selectPresentation(withInput({ viewportWidth: SINGLE_COLUMN_WIDTH })).layout).toBe('columns');
    expect(selectPresentation(withInput({ viewportWidth: SINGLE_COLUMN_WIDTH - 1 })).layout).toBe('single-column');
    expect(selectPresentation(withInput({ textScale: LARGE_TEXT_SCALE - 0.01 })).layout).toBe('columns');
    expect(selectPresentation(withInput({ textScale: LARGE_TEXT_SCALE })).layout).toBe('single-column');
  });

  it('suspended ambience (hidden, typing or error) rests decoration and never changes the rows or the surface', () => {
    const calm = presentItems(ITEMS, 'part-a', base);
    for (const signal of ['hidden', 'typing', 'error'] as const) {
      const quieted = presentItems(ITEMS, 'part-a', withInput({ ambience: { hidden: false, typing: false, error: false, [signal]: true } }));
      expect(quieted.presentation, signal).toMatchObject({ decorativeMotion: 'rest', motionReason: 'ambience-suspended', surface: 'map-3d' });
      expect(quieted.rows, signal).toEqual(calm.rows);
    }
  });

  it('presentation is independent of business outcomes: score and booking fields never reach the presentation or rows', () => {
    const withOutcomes = ITEMS.map((item, index) => ({ ...item, score: 90 - index, bookingState: 'confirmed', outcome: 'high' }));
    const plain = presentItems(ITEMS, 'part-a', base);
    const scored = presentItems(withOutcomes, 'part-a', base);
    expect(scored.presentation).toEqual(plain.presentation);
    expect(scored.rows).toEqual(plain.rows);
    expect(Object.keys(scored.rows[0]).sort()).toEqual(['action', 'id', 'label', 'selected', 'source']);
  });

  it('a stale selection is cleared, and an empty list gives an explicit empty state', () => {
    const stale = presentItems(ITEMS, 'removed-part', base);
    expect(stale.selectedId).toBeNull();
    expect(stale.rows.some((row) => row.selected)).toBe(false);
    expect(presentItems([], 'anything', withInput({ webgl: false }))).toMatchObject({
      rows: [], selectedId: null, empty: true, presentation: { surface: 'accessible-list' },
    });
  });

  it('malformed stored sensory choices fall back to defaults, and valid fields survive', () => {
    expect(readSensoryChoice(null)).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(readSensoryChoice('lively')).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(readSensoryChoice({ motion: 'hyper', sound: 'yes', texture: false, density: 'compact' }))
      .toEqual({ ...DEFAULT_SENSORY_PREFERENCES, texture: false, density: 'compact' });
  });

  it('lens readings: invalid coordinates are unknown (null), not zero, and repeated axes fall back to the default map', () => {
    expect(lensRows(['AGENCY', 'AGENCY', 'FOCUS'], [0.5, 0, 0, 0]).axes).toEqual(['AGENCY', 'TEMPERATURE', 'FOCUS']);
    const valid = lensRows(['AGENCY', 'TEMPERATURE', 'ATTACHMENT'], [0.5, 2, 0, -0.2]);
    expect(valid.rows.find((row) => row.key === 'TEMPERATURE')).toEqual({ key: 'TEMPERATURE', onMap: true, value: 1 });
    expect(valid.rows.find((row) => row.key === 'FOCUS')).toEqual({ key: 'FOCUS', onMap: false, value: 0 });
    expect(lensRows(['AGENCY', 'TEMPERATURE', 'FOCUS'], [0.5, NaN, 0, 0]).rows.every((row) => row.value === null)).toBe(true);
  });

  it('identical inputs give identical presentations, and the inputs are not mutated', () => {
    const items = JSON.parse(JSON.stringify(ITEMS)) as PresentableItem[];
    const snapshot = JSON.stringify({ base, items });
    const first = presentItems(items, 'part-c', base);
    expect(presentItems(items, 'part-c', base)).toEqual(first);
    expect(JSON.stringify({ base, items })).toBe(snapshot);
  });
});
