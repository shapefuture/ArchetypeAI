import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DescentPanelComponent } from './descent-panel.component';
import { scoreProfile } from '../../core/data/scoring-v2';

/**
 * Like the other templateUrl components in this repo, the descent panel is
 * tested at the class level (via runInInjectionContext) plus template-file
 * assertions — vitest does not resolve external templates.
 */
const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'descent-panel.component.html'), 'utf-8');

function make(): DescentPanelComponent {
  return TestBed.runInInjectionContext(() => new DescentPanelComponent()) as DescentPanelComponent;
}

describe('DescentPanelComponent — flow', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  afterEach(() => vi.useRealTimers());

  it('starts at the Quick Scan offer with the 147-item schedule', () => {
    const c = make();
    expect(c.stage()).toBe('offer');
    expect(c.sequence.length).toBe(147);
    expect(c.descents.map(d => d.length)).toEqual([49, 49, 49]);
  });

  it('quick scan: 14 answers resolve a family teaser (§1.13)', () => {
    const c = make();
    c.startScan();
    for (let i = 0; i < 13; i++) c.answerScan(3);
    c.answerScan(5);
    expect(c.stage()).toBe('scan-result');
    expect(c.scanFamily()?.kind).toBe('family');
    expect(c.scanFamily()?.family).toBe(c.quickScanParts[13]);
  });

  it('quick scan: nothing ≥ 4 → Self teaser', () => {
    const c = make();
    c.startScan();
    for (let i = 0; i < 14; i++) c.answerScan(3);
    expect(c.scanFamily()?.kind).toBe('self');
  });

  it('ethics gate precedes the first item (§3 mandatory onboarding)', () => {
    const c = make();
    c.proceedToEthics();
    expect(c.stage()).toBe('ethics');
    c.acceptEthics();
    expect(c.stage()).toBe('item');
  });

  it('fires a somatic follow-up exactly per §1.12 and stores the zone locally', () => {
    const c = make();
    c.proceedToEthics();
    c.acceptEthics();
    // Item 0 is taskmaster q1 (index 0 → mod 5 == 0); a 4 triggers the body map.
    if (c.currentRef().kind === 'shadow') expect(c.currentRef().index).toBe(0);
    c.answer(4);
    expect(c.pendingSomaticPart()).toBe('taskmaster');
    c.chooseZone('chest');
    expect(c.pendingSomaticPart()).toBeNull();
    expect(c.somatic()['taskmaster']).toEqual(['chest']);
  });

  it('walks all three descents and emits a scoreable AssessmentInput', () => {
    const c = make();
    c.proceedToEthics();
    c.acceptEthics();
    let emitted = false;
    c.completed.subscribe(input => {
      emitted = true;
      const profile = scoreProfile(input);
      expect(profile.headline.name).toBeTruthy();
      expect(profile.burden).toBeGreaterThanOrEqual(0);
    });
    let guard = 0;
    let breaks = 0;
    while (c.stage() === 'item' || c.stage() === 'break') {
      if (guard++ > 1200) throw new Error('descent did not terminate');
      if (c.stage() === 'break') { breaks++; c.resumeFromBreak(); continue; }
      if (c.pendingSomaticPart()) { c.skipZone(); vi.advanceTimersByTime(200); continue; }
      c.answer(4);
      vi.advanceTimersByTime(200);
    }
    expect(breaks).toBe(2); // one break between each sitting
    expect(emitted).toBe(true);
    expect(c.stage()).toBe('complete');
  });

  it('persists progress and restores mid-descent after reload', () => {
    const c = make();
    c.proceedToEthics();
    c.acceptEthics();
    c.answer(4);
    if (c.pendingSomaticPart()) c.skipZone();
    vi.advanceTimersByTime(200);
    expect(localStorage.getItem('INNERVERSE_DESCENT_V1')).toBeTruthy();
    const c2 = make();
    expect(c2.stage()).toBe('item');
    expect(c2.answers()[0]).toBe(4);
  });
});

describe('DescentPanelComponent — template structure', () => {
  it('renders one item per screen with a 5-point Likert', () => {
    expect(templateHtml).toMatch(/stage\(\) === 'item'/);
    expect(templateHtml).toMatch(/likert\[lang\(\)\]/);
    expect((templateHtml.match(/class="likert-btn"/g) ?? []).length).toBeGreaterThanOrEqual(1);
  });
  it('contains the mandatory ethics card and break screens', () => {
    expect(templateHtml).toMatch(/stage\(\) === 'ethics'/);
    expect(templateHtml).toMatch(/stage\(\) === 'break'/);
  });
  it('somatic body-map is skippable with one tap', () => {
    expect(templateHtml).toMatch(/skipZone\(\)/);
    expect(templateHtml).toMatch(/chooseZone\(zone\)/);
  });
});
