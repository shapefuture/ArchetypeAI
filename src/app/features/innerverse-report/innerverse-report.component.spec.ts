import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { InnerverseReportComponent } from './innerverse-report.component';
import { SHADOW_PARTS, RESOURCES } from '../../core/data/parts';
import { scoreProfile, type AssessmentInput } from '../../core/data/scoring-v2';

/** templateUrl component → class-level tests via injection context + template-file assertions. */
const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'innerverse-report.component.html'), 'utf-8');

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return {
    shadow, resources, self: Array(8).fill(fill) as number[],
    validity: { attention: 3, infrequency: [1, 1] },
  };
};

function make(fill: number): InnerverseReportComponent {
  const c = TestBed.runInInjectionContext(
    () => new InnerverseReportComponent()) as InnerverseReportComponent;
  c.profile.set(scoreProfile(all(fill)));
  return c;
}

describe('InnerverseReportComponent — class logic', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('sorts parts dominant → dormant with family-order tiebreak', () => {
    const c = make(5);
    const tiers = c.sortedParts().map(id => c.profile().parts[id].tier);
    const order = { dominant: 0, prominent: 1, present: 2, dormant: 3 };
    expect(tiers.map(t => order[t])).toEqual([...tiers.map(t => order[t])].sort((a, b) => a - b));
  });

  it('derives the attachment style label source (§1.6)', () => {
    expect(make(5).attachmentStyle()).toBe('disorganized'); // 65.46/64.42 both ≥ 60
    expect(make(3).attachmentStyle()).toBe('anxious');
  });

  it('part cards flip through the 4 layers (§1.9)', () => {
    const c = make(3);
    const part = c.sortedParts()[0];
    expect(c.layerFor(part)).toBe('face');
    c.cycleLayer(part);
    expect(c.layerFor(part)).toBe('need');
    c.cycleLayer(part);
    expect(c.layerFor(part)).toBe('shadow');
    c.cycleLayer(part);
    expect(c.layerFor(part)).toBe('superpower');
    c.cycleLayer(part);
    expect(c.layerFor(part)).toBe('face');
  });

  it('layer copy resolves for every part and layer in both languages', () => {
    const c = make(3);
    for (const layer of ['face', 'need', 'shadow', 'superpower'] as const) {
      for (const p of SHADOW_PARTS) {
        expect(c.copyFor(p, layer).length).toBeGreaterThan(5);
      }
    }
  });

  it('exile floor beliefs render verbatim', () => {
    const c = make(5);
    expect(c.exileBelief('unseen')).toBe('I do not matter.');
  });

  it('resource bands flag leaks only when spillPart ≥ 60T (§1.14)', () => {
    const maxed = make(5);
    expect(maxed.resourceBand('sage').leak).toBeTruthy();   // → analyst 61.67
    expect(maxed.resourceBand('caregiver').leak).toBeTruthy(); // → pleaser 60
    const neutral = make(3);
    expect(neutral.resourceBand('sage').leak).toBeUndefined();
  });

  it('active complexes are top-2, ordered (§1.7)', () => {
    const c = make(5);
    expect(c.activeComplexDefs().map(x => x.id)).toEqual(['engulfment', 'unlovability']);
    expect(make(3).activeComplexDefs()).toEqual([]);
  });
});

describe('InnerverseReportComponent — template structure (§3.3)', () => {
  it('strength hero precedes shadow content (§1.1 non-negotiable)', () => {
    const heroIdx = templateHtml.search(/class="strength-hero"/);
    const partsIdx = templateHtml.search(/partsByTier/);
    expect(heroIdx).toBeGreaterThan(-1);
    expect(partsIdx).toBeGreaterThan(heroIdx);
  });
  it('crisis footer is conditionally rendered', () => {
    expect(templateHtml).toMatch(/@if \(p\.crisis\)/);
  });
  it('ends with the ethics card', () => {
    expect(templateHtml.search(/class="report-footer"/))
      .toBeGreaterThan(templateHtml.search(/class="resource-list"/));
  });
  it('coping stack renders the descent with a floor belief', () => {
    expect(templateHtml).toMatch(/exileBelief\(p\.copingStack\.floor\)/);
  });
  it('part cards are tappable 4-layer cycles', () => {
    expect(templateHtml).toMatch(/\(click\)="cycleLayer\(id\)"/);
    expect(templateHtml).toMatch(/layerFor\(id\)/);
  });
});

describe('InnerverseReportComponent — §3C.3 attribution weather-vane', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('draws the vane from stored sealed-verdict texts', () => {
    localStorage.removeItem('INNERVERSE_SEALED_VERDICTS_V1');
    const empty = TestBed.runInInjectionContext(() => new InnerverseReportComponent()) as InnerverseReportComponent;
    empty.profile.set(scoreProfile(all(3)));
    expect(empty.vane()).toBeNull();
    expect(empty.vanePosition()).toBe(50);

    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([
      { text: 'I always ruin everything. I am a failure my whole life.' },
      { text: 'This time I stayed. In that moment I chose differently.' },
    ]));
    const seeded = TestBed.runInInjectionContext(() => new InnerverseReportComponent()) as InnerverseReportComponent;
    seeded.profile.set(scoreProfile(all(3)));
    const v = seeded.vane()!;
    expect(v.globalizing).toBe(4); // always, everything, i am, my whole life
    expect(v.localizing).toBe(2);  // this time, in that moment
    expect(seeded.vanePosition()).toBeGreaterThan(50); // leaning essence-language
    localStorage.removeItem('INNERVERSE_SEALED_VERDICTS_V1');
  });

  it('template renders the vane inside the Self panel', () => {
    const html = readFileSync(resolve(DIR, 'innerverse-report.component.html'), 'utf-8');
    expect(html).toMatch(/class="vane"/);
    expect(html).toMatch(/vanePosition\(\)/);
  });
});
