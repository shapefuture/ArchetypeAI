// Round 25 probe (critic): the 24th pass named shapes, eyes and mouths in the active language, but CustomizerLike
// (editor-kit.jsx) still names the face buttons with the raw enum value (aria-label={f} / title={f}) and the colour
// swatches with the English COLORS names (aria-label={c.name}; pal/traits.ts has no Russian names). Both sit in the same
// PartEditor sheet (cabinet.jsx) the commit touched, so a Russian screen reader announces "glasses" and "Azure".
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { CustomizerLike } from './editor-kit.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const TRAITS = { shape: 'cloud', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', color: '#00ffab', characterSeed: 7 };
const ENGLISH_COLOUR_NAMES = ['Azure', 'Lime', 'Yolk', 'Magenta', 'Tomato', 'Tang', 'Mint', 'Grape', 'Sky', 'Cocoa', 'Ink', 'Chalk'];

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

function mountIn(lang: 'ru' | 'en'): HTMLDivElement {
  appMock.current = { t: (key: string) => key, lang };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(CustomizerLike, { traits: TRAITS, onChange: () => undefined })); });
  return host;
}

function namesOf(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('button')).map((b) => b.getAttribute('aria-label') ?? '');
}

describe('round25: the Cabinet customizer names every option in the active language', () => {
  it('control: the head buttons carry their Russian names', () => {
    expect(namesOf(mountIn('ru'))).toContain('Без украшения');
  });

  it('the face buttons are not named with the raw English enum values in the Russian UI', () => {
    const names = namesOf(mountIn('ru'));
    expect(names.filter((name) => ['none', 'glasses', 'shades'].includes(name)), 'face buttons named with English enum values').toEqual([]);
  });

  it('the colour swatches are not named with the English colour names in the Russian UI', () => {
    const names = namesOf(mountIn('ru'));
    expect(names.filter((name) => ENGLISH_COLOUR_NAMES.includes(name)), 'colour swatches named in English').toEqual([]);
  });
});
