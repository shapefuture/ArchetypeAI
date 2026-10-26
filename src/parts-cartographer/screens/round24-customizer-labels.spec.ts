// Round 24 probe (critic): PartEditor (cabinet.jsx) renders CustomizerLike (editor-kit.jsx) in the same sheet the round-23 commit
// labelled. In Russian, the head buttons get Russian accessible names (headLabels), but the shape, eye and mouth buttons are
// named with the raw English enum value (aria-label={s}, {e}, {m}), so a screen reader in the Russian UI says "cloud", "ovals".
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

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

function mountInRussian(): HTMLDivElement {
  appMock.current = { t: (key: string) => key, lang: 'ru' };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(CustomizerLike, { traits: TRAITS, onChange: () => undefined })); });
  return host;
}

describe('round24: the Cabinet customizer names its options in the active language', () => {
  it('control: the head buttons carry their Russian names', () => {
    const container = mountInRussian();
    const labels = Array.from(container.querySelectorAll('button[aria-label]')).map((b) => b.getAttribute('aria-label'));
    expect(labels).toContain('Без украшения');
  });

  it('the shape button for the selected shape is not named with the English enum value', () => {
    const container = mountInRussian();
    const shape = container.querySelector('button[aria-pressed="true"][aria-label="cloud"]');
    expect(shape, 'shape button named "cloud" in the Russian UI').toBeNull();
  });

  it('the eye and mouth buttons are not named with English enum values in the Russian UI', () => {
    const container = mountInRussian();
    const names = Array.from(container.querySelectorAll('button[aria-label]')).map((b) => b.getAttribute('aria-label'));
    expect(names.filter((name) => ['ovals', 'smile', 'googly', 'flat'].includes(name ?? '')), 'English enum names used as accessible names').toEqual([]);
  });
});
