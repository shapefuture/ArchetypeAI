import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scoreProfile } from '../../app/core/data/scoring-v2';
import { toAssessmentInput } from '../../app/core/data/assessment-adapter';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { buildClinicalMarkdown } from '../core/clinical-report';
import { KEYS } from '../core/local-store';

const app = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => app.current }));
vi.mock('../pal/Character', () => ({ Character: () => React.createElement('span', { 'data-character-engine': 'felt-atelier' }) }));
import { ClinicalReport } from './clinical-report.jsx';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  const adapted = adaptClinicalProfile(scoreProfile(toAssessmentInput(Array(147).fill(3))), 'en');
  app.current = { ...adapted, lang: 'en', t: (key: string) => key,
    setParts: vi.fn(), setProfile: vi.fn(), setOverlay: vi.fn(), setSheet: vi.fn(), go: vi.fn(), downloadBackup: vi.fn() };
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('canonical report and specialist restrictions', () => {
  it.each(['en', 'ru'])('renders the complete canonical report and all four layers in %s', (language) => {
    app.current.lang = language;
    localStorage.setItem(`${KEYS.history}.hist`, JSON.stringify([JSON.stringify({ clinical: { malformed: true } })]));
    act(() => root.render(React.createElement(ClinicalReport)));
    for (const section of ['strength', 'self', 'parts', 'coping', 'needs', 'resources', 'continue', 'history']) {
      expect(host.querySelector(`#clinical-${section}`)).not.toBeNull();
    }
    expect(host.querySelectorAll('.part-card')).toHaveLength(14);
    const card = host.querySelector('.part-card') as HTMLButtonElement;
    const layers = new Set<string>();
    for (let i = 0; i < 4; i++) { layers.add(card.textContent!); act(() => card.click()); }
    expect(layers.size).toBe(4);
    const markdown = buildClinicalMarkdown(app.current.profile.clinical, language);
    expect(markdown.length).toBeGreaterThan(5000);
  });
  it('keeps specialist views read-only and excludes the specialist’s own private reflection', () => {
    localStorage.setItem('INNERVERSE_FUTURE_SELF_V1', JSON.stringify(['Private future of the specialist']));
    act(() => root.render(React.createElement(ClinicalReport, { profile: app.current.profile, readOnly: true, embedded: true, onBack: vi.fn() })));
    expect(host.querySelector('#clinical-continue')).toBeNull();
    expect(host.querySelector('#clinical-history')).toBeNull();
    expect(host.textContent).not.toContain('Private future of the specialist');
    expect(host.querySelectorAll('svg [role=button]')).toHaveLength(0);
    expect(app.current.setParts).not.toHaveBeenCalled();
    expect(app.current.setProfile).not.toHaveBeenCalled();
    expect(app.current.setOverlay).not.toHaveBeenCalled();
  });
});
