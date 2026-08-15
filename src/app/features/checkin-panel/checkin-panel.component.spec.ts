import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CheckInPanelComponent } from './checkin-panel.component';
import { SHADOW_PARTS, RESOURCES } from '../../core/data/parts';
import { scoreProfile, type AssessmentInput } from '../../core/data/scoring-v2';

const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'checkin-panel.component.html'), 'utf-8');

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

function make(): CheckInPanelComponent {
  const c = TestBed.runInInjectionContext(() => new CheckInPanelComponent()) as CheckInPanelComponent;
  c.profile.set(scoreProfile(all(4)));
  return c;
}

describe('CheckInPanelComponent', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });

  it('walks the 15-second loop: arousal → event → confirm → recorded', () => {
    const c = make();
    expect(c.stage()).toBe('arousal');
    c.chooseArousal(1);
    expect(c.stage()).toBe('event');
    c.chooseEvent('achievement');
    expect(c.stage()).toBe('confirm');
    expect(c.predicted()).toBe('ashamed'); // uniform 4s: ashamed 60.8 tops achievement candidates
    c.confirmPart('confirm');
    expect(c.stage()).toBe('done');
    expect(c.history().length).toBe(1);
    expect(c.history()[0].confirmedPart).toBe('ashamed');
    expect(JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1')!)[0].predictedPart).toBe('ashamed');
  });

  it('correct mode records the picked part instead of the prediction', () => {
    const c = make();
    c.chooseArousal(0);
    c.chooseEvent('relational');
    c.confirmPart('correct');
    expect(c.correcting()).toBe(true);
    c.pickPart('hermit');
    expect(c.history()[0].confirmedPart).toBe('hermit');
    expect(c.history()[0].predictedPart).toBe('charmer'); // uniform: charmer 62.7 tops relational candidates
  });

  it('noticed mode logs confirmedPart null ("I noticed and chose")', () => {
    const c = make();
    c.chooseArousal(0);
    c.chooseEvent(null);
    c.confirmPart('noticed');
    expect(c.history()[0].confirmedPart).toBeNull();
    expect(c.history()[0].predictedPart).toBe('bypasser'); // stack L1 uniform 4s
  });

  it('seals a verdict to storage and rates it on resurface', () => {
    const c = make();
    c.verdictDraft.set('I am a disaster');
    c.sealCurrentVerdict();
    const stored = JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1')!);
    expect(stored.length).toBe(1);
    expect(stored[0].text).toBe('I am a disaster');
    c.resurfacing.set(stored[0]);
    c.rateByLabel('state artifact');
    const rated = JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1')!);
    expect(rated[0].reRating).toBe('state artifact');
    expect(c.resurfacing()).toBeNull();
  });

  it('part names resolve to subtypes', () => {
    const c = make();
    expect(c.partName('rebel')).toBe('The Cornered One');
    expect(c.partName('sage')).toBe('Sage');
  });
});

describe('CheckInPanelComponent — template', () => {
  it('renders the 5-step arousal scale bottom-up with window mid', () => {
    expect(templateHtml).toMatch(/column-reverse|arousalForIndex/);
    expect(templateHtml).toContain('chooseArousal(arousalForIndex($index))');
  });
  it('sealed-verdict resurface view takes precedence', () => {
    expect(templateHtml.search(/resurfacing\(\); as v/))
      .toBeLessThan(templateHtml.search(/@switch \(stage\(\)\)/));
  });
  it('confirm screen offers confirm / noticed / correct', () => {
    expect(templateHtml).toMatch(/confirmPart\('confirm'\)/);
    expect(templateHtml).toMatch(/confirmPart\('noticed'\)/);
    expect(templateHtml).toMatch(/confirmPart\('correct'\)/);
  });
});

describe('CheckInPanelComponent — §3C.2/§3C.6 charter + events', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });

  it('charter sliders record a delivery and the repair/told events', () => {
    const c = make();
    c.blame.set(7); c.license.set(2);
    c.recordCharter(true, true);
    const d = JSON.parse(localStorage.getItem('INNERVERSE_CHARTER_V1')!);
    expect(d.length).toBe(1);
    expect(d[0].blame).toBe(7);
    const kinds = JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1')!).map((e: any) => e.kind);
    expect(kinds).toContain('repair');
    expect(kinds).toContain('told');
  });

  it('a firefighter lapse check-in records a lapse event', () => {
    const c = make();
    c.chooseArousal(2);
    c.chooseEvent('boundary');
    c.correcting.set(true);
    c.pickPart('rebel');
    const kinds = JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1') ?? '[]').map((e: any) => e.kind);
    expect(kinds).toContain('lapse');
  });

  it('firedUnderLoad logs the if-then fire event', () => {
    const c = make();
    c.firedUnderLoad();
    const kinds = JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1')!).map((e: any) => e.kind);
    expect(kinds).toContain('ifthen_fired');
  });

  it('worsening charter trend swaps to the stricter variant copy', () => {
    const c = make();
    localStorage.setItem('INNERVERSE_CHARTER_V1', JSON.stringify([
      { blame: 8, license: 2, at: '2026-08-01T10:00:00' },
      { blame: 6, license: 4, at: '2026-08-05T10:00:00' },
      { blame: 3, license: 7, at: '2026-08-09T10:00:00' },
    ]));
    const fresh = make(); // reloads deliveries from storage
    expect(fresh.charterDeliveries().length).toBe(3);
    const copy = fresh.jitaiCopy('dual_bound_charter');
    expect(copy.body).toContain('No verdicts');
  });

  it('template renders the two sliders and the fired button', () => {
    const html = readFileSync(resolve(DIR, 'checkin-panel.component.html'), 'utf-8');
    expect(html).toMatch(/blameQ/);
    expect(html).toMatch(/licenseQ/);
    expect(html).toMatch(/recordCharter\(repair\.checked, told\.checked\)/);
    expect(html).toMatch(/firedUnderLoad\(\)/);
  });
});

describe('arousal scale mapping (sign convention)', () => {
  it('Shutdown = −2 … Hyper = +2, matching shutdownStreak’s convention', () => {
    TestBed.configureTestingModule({});
    const c = TestBed.runInInjectionContext(() => new CheckInPanelComponent()) as CheckInPanelComponent;
    expect(c.arousalForIndex(0)).toBe(-2); // Shutdown
    expect(c.arousalForIndex(2)).toBe(0);  // Window
    expect(c.arousalForIndex(4)).toBe(2);  // Hyper
  });
});
