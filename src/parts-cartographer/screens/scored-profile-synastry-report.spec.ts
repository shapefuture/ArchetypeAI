import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toAssessmentInput } from '../../app/core/data/assessment-adapter';
import { synastry, toSynastryProfile } from '../../app/core/data/synastry-v2';
import { scoreProfile } from '../../app/core/data/scoring-v2';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { ScoredProfileSynastryDetails } from './scored-profile-synastry-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(lang = 'en') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const local = scoreProfile(toAssessmentInput(Array(147).fill(2)));
  const partner = scoreProfile(toAssessmentInput(Array(147).fill(4)));
  const report = synastry(toSynastryProfile(local), toSynastryProfile(partner));
  const onDownload = vi.fn();
  act(() => { root?.render(React.createElement(ScoredProfileSynastryDetails, { report, lang, onDownload })); });
  return { container: host, report, onDownload };
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe('147-item scored-profile synastry report UI', () => {
  it('renders the scored interaction loop, interlocks, nourishment, and explicit JSON export', () => {
    const { container, report, onDownload } = mount();

    expect(container.textContent).toContain('Computed interaction patterns');
    expect(container.textContent).toContain('Possible interaction loop');
    expect(container.textContent).toContain(report.loop.name);
    expect(container.textContent).toContain('Possible complex interlocks');
    expect(container.textContent).toContain('Possible mutual nourishment');
    expect(container.textContent).toContain('not a compatibility score');
    const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes('Download full JSON report'));
    expect(button).toBeTruthy();
    act(() => { (button as HTMLButtonElement).click(); });
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('localizes labels and dynamic names in Russian', () => {
    const { container, report } = mount('ru');

    expect(container.textContent).toContain('Рассчитанные паттерны взаимодействия');
    expect(container.textContent).toContain('Ваша защитная часть');
    expect(container.textContent).toContain('Возможное сцепление комплексов');
    expect(container.textContent).toContain('не оценка совместимости');
    expect(container.textContent).not.toContain(report.loop.name);
  });
});
