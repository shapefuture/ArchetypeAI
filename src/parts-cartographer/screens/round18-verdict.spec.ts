// Critic 18 scratch: sealing a verdict when storage is full, and malformed verdicts on the check-in screen.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../../shared/i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
import { CheckIn } from './check-in.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;
const ui = STRINGS.checkin.ui.en;

// The App toast is last-write-wins (setToastMsg replaces the previous message), so the model does the same.
let shownToast: string | null = null;
const toastCalls: string[] = [];
const appToast = (message: string) => { shownToast = message; toastCalls.push(message); };
const onStorageFull = () => appToast('⚠ storage full');

function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(CheckIn)); });
  return host;
}
function setTextarea(container: ParentNode, value: string) {
  const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return textarea;
}
/** Logs a high-arousal check-in with no part, which reaches the done stage where the verdict form lives. */
function reachDoneWithBadArousal(container: ParentNode) {
  press(container, ui.arousal[0]);
  press(container, ui.skip);
  press(container, 'Log without a part');
}
function press(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`no button "${text}"`);
  act(() => { (button as HTMLButtonElement).click(); });
}

beforeEach(() => {
  localStorage.clear();
  shownToast = null;
  toastCalls.length = 0;
  appMock.current = { t: (key: string) => key, lang: 'en', setOverlay: vi.fn(), toast: appToast, profile: null };
  window.addEventListener('ifs:storage-full', onStorageFull);
});
afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  window.removeEventListener('ifs:storage-full', onStorageFull);
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('critic18-B: sealing a verdict when storage is full', () => {
  it('B1: the storage-full warning is not replaced by "sealed", and the typed verdict is not discarded', () => {
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'INNERVERSE_SEALED_VERDICTS_V1') throw new DOMException('quota', 'QuotaExceededError');
      return realSetItem.call(this, key, value);
    });
    const container = mount();
    reachDoneWithBadArousal(container);
    const textarea = setTextarea(container, 'This feeling will not last forever');
    press(container, ui.seal);
    const finalText = textarea.value;
    // Expected: the person is told the verdict was not kept, and the typed text is still in the box.
    // Observed (see assertions): the last toast says sealed and the text is cleared.
    expect({ lastToast: shownToast, draft: finalText }).toEqual({ lastToast: expect.stringContaining('storage'), draft: 'This feeling will not last forever' });
  });

  it('B2: the verdict form still says sealed only when the save really succeeded (control)', () => {
    const container = mount();
    reachDoneWithBadArousal(container);
    const textarea = setTextarea(container, 'Kept verdict');
    press(container, ui.seal);
    expect(shownToast).toContain('sealed');
    expect(textarea.value).toBe('');
    expect(JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1')!)).toHaveLength(1);
  });
});

describe('critic18-B: malformed stored verdicts on the check-in screen', () => {
  it('B3: non-string verdict text, null and primitive entries do not crash; a valid due verdict still shows', () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString();
    const due = new Date(Date.now() - 86400000).toISOString();
    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([
      { text: 42, createdAt: past, resurfacesAt: due },
      { text: { a: 1 }, createdAt: past, resurfacesAt: due },
      null,
      'x',
      { text: ['arr'], createdAt: past, resurfacesAt: due },
      { text: 'REAL DUE VERDICT', createdAt: past, resurfacesAt: due },
    ]));
    const container = mount();
    expect(container.textContent).toContain('REAL DUE VERDICT');
  });

  it('B4: a verdict whose resurfacesAt is not a date does not crash the screen', () => {
    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([
      { text: 'odd date', createdAt: '2026-01-01T00:00:00.000Z', resurfacesAt: 'soon' },
    ]));
    expect(() => mount()).not.toThrow();
  });
});
