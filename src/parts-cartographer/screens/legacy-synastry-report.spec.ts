import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeSynastry } from '../../shared/core/data/synastry';
import { LegacySynastryDetails } from './legacy-synastry-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(lang = 'en') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const report = computeSynastry(
    Array.from({ length: 64 }, (_, index) => (index % 5) + 1),
    Array.from({ length: 64 }, (_, index) => 5 - (index % 5)),
    lang as 'en' | 'ru',
  );
  const onDownload = vi.fn();
  act(() => { root?.render(React.createElement(LegacySynastryDetails, { report, lang, onDownload })); });
  return { container: host, report, onDownload };
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe('legacy 64-item synastry report UI', () => {
  it('renders the detailed deterministic report and exposes an explicit JSON export action', () => {
    const { container, report, onDownload } = mount();

    expect(container.textContent).toContain(report.relationalArchetype.nameEn);
    expect(container.textContent).toContain('Attachment dance');
    expect(container.textContent).toContain('Dimensional resonance');
    expect(container.textContent).toContain('Possible cross-person triggers');
    expect(container.textContent).toContain('Joint reflection pathway');
    expect(container.textContent).toContain('not clinical findings or predictions');
    const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes('Download full JSON report'));
    expect(button).toBeTruthy();
    act(() => { (button as HTMLButtonElement).click(); });
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('renders Russian copy from the localized report fields', () => {
    const { container, report } = mount('ru');

    expect(container.textContent).toContain('Реляционный архетип');
    expect(container.textContent).toContain(report.relationalArchetype.nameRu);
    expect(container.textContent).toContain('Танец привязанности');
    expect(container.textContent).toContain('не клинические выводы или прогнозы');
  });
});
