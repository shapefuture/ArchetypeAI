import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TherapistPanelComponent } from './therapist-panel.component';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { of } from 'rxjs';

const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'therapist-panel.component.html'), 'utf-8');

describe('TherapistPanelComponent — §3C.6 resistant outcomes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_PORT, useValue: { user$: of({ uid: 't1' }), isAuthenticated$: of(true) } },
      ],
    });
  });

  it('renders metrics from the device event log — never fabricated', () => {
    localStorage.setItem('INNERVERSE_EVENTS_V1', JSON.stringify([
      { kind: 'lapse', at: '2026-08-10T10:00:00' },
      { kind: 'repair', at: '2026-08-10T11:00:00' },
      { kind: 'ifthen_written', at: '2026-08-09T10:00:00' },
      { kind: 'ifthen_written', at: '2026-08-09T11:00:00' },
      { kind: 'ifthen_fired', at: '2026-08-10T18:00:00' },
    ]));
    const c = TestBed.runInInjectionContext(() => new TherapistPanelComponent()) as TherapistPanelComponent;
    expect(c.metrics().timeToRepairH).toBe(1);
    expect(c.metrics().ifThenFireRate).toBe(0.5);
    expect(c.metrics().secrecyH).toBeNull();
    localStorage.removeItem('INNERVERSE_EVENTS_V1');
  });

  it('attestation gates the dashboard until license + checkbox + enter', () => {
    const c = TestBed.runInInjectionContext(() => new TherapistPanelComponent()) as TherapistPanelComponent;
    expect(c.entered()).toBe(false);
    c.attest(true);
    expect(c.entered()).toBe(false); // checkbox alone no longer flips the view
    c.setLicense('LIC-1');
    c.enter();
    expect(c.entered()).toBe(true);
  });

  it('template shows the §3C.6 rule verbatim and the four metrics', () => {
    expect(templateHtml).toMatch(/metricsRule|th-metrics-rule/);
    expect(templateHtml).toMatch(/timeToRepairH/);
    expect(templateHtml).toMatch(/secrecyH/);
    expect(templateHtml).toMatch(/ifThenFireRate/);
    expect(templateHtml).toMatch(/disclosureRatio/);
  });
});
