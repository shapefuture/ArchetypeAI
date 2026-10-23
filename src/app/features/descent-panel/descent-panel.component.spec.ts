import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { flushLocal, resetLocalQueueForTests } from '../../../shared/core/data/local-store';
import { DescentPanelComponent } from './descent-panel.component';
import { scoreProfile } from '../../../shared/core/data/scoring-v2';

/**
 * Like the other templateUrl components in this repo, the descent panel is
 * tested at the class level (via runInInjectionContext) plus template-file
 * assertions — vitest does not resolve external templates.
 *
 * Flow contract: entry lands on the ethics gate, then the FULL battery runs
 * (three sittings, 147 items). The Quick Scan is NOT part of the flow — it is
 * reserved as a standalone lead magnet (engine tests live in scoring-v2.spec).
 */
const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'descent-panel.component.html'), 'utf-8');

function make(): DescentPanelComponent {
  return TestBed.runInInjectionContext(() => new DescentPanelComponent()) as DescentPanelComponent;
}

describe('DescentPanelComponent — flow', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear(); resetLocalQueueForTests();
    TestBed.configureTestingModule({});
  });
  afterEach(() => vi.useRealTimers());

  it('starts at the ethics gate with the 147-item battery (no quick-scan detour)', () => {
    const c = make();
    expect(c.stage()).toBe('ethics');
    expect(c.sequence.length).toBe(147);
    expect(c.descents.map(d => d.length)).toEqual([49, 49, 49]);
    c.acceptEthics();
    expect(c.stage()).toBe('item');
    expect(c.currentRef().kind).toBe('shadow'); // item 0 = taskmaster q1
  });

  it('shows the recalibration notice on the gate when legacy 64-item data exists', () => {
    localStorage.setItem('ARCHETYPE_ASSESSMENT_RESPONSES', JSON.stringify(new Array(64).fill(3)));
    const c = make();
    expect(c.recalibrated()).toBe(true);
    localStorage.removeItem('ARCHETYPE_ASSESSMENT_RESPONSES');
    expect(make().recalibrated()).toBe(false);
  });

  it('somatic follow-ups are disabled pending redesign (§1.12 paused)', () => {
    const c = make();
    c.acceptEthics();
    // Item 0 is taskmaster q1 (a 4 used to trigger the body map) — with the
    // feature flag off the popup must NOT appear and the zone store stays empty.
    c.answer(4);
    expect(c.pendingSomaticPart()).toBeNull();
    expect(c.somatic()['taskmaster'] ?? []).toEqual([]);
  });

  it('walks all three descents and emits a scoreable AssessmentInput', () => {
    const c = make();
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
    while (c.stage() !== 'complete') {
      if (guard++ > 1200) throw new Error('descent did not terminate');
      if (c.stage() === 'break') { breaks++; c.resumeFromBreak(); continue; }
      if (c.stage() === 'future-self') { c.skipFutureSelf(); continue; }
      if (c.pendingSomaticPart()) { c.skipZone(); vi.advanceTimersByTime(200); continue; }
      c.answer(4);
      vi.advanceTimersByTime(200);
    }
    expect(breaks).toBe(2); // one break between each sitting
    expect(emitted).toBe(true);
  });

  it('break screen offers BOTH options — resume now, or leave with progress kept', () => {
    // The subtitle promises "continue now or return later" — the template
    // must render the second button (regression: it was promise-only).
    expect(templateHtml).toMatch(/leaveFromBreak\(\)/);
    expect(templateHtml).toMatch(/breakResume\(descentIndex\(\)\)/);
    const c = make();
    c.acceptEthics();
    // Walk to the first break (49 answers → sitting I done).
    let guard = 0;
    while (c.stage() !== 'break') {
      if (guard++ > 400) throw new Error('never reached break');
      if (c.pendingSomaticPart()) { c.skipZone(); vi.advanceTimersByTime(200); continue; }
      c.answer(4);
      vi.advanceTimersByTime(200);
    }
    let left = false;
    c.cancelled.subscribe(() => { left = true; });
    c.leaveFromBreak();
    expect(left).toBe(true);
    // Progress is persisted — a fresh instance resumes at the same sitting.
    const resumed = make();
    expect(resumed.stage()).toBe('item');
    expect(resumed.litStars()).toBe(49);
  });

  it('§3D.2 Future Self: min-2-sentence gate, saved before the reveal', () => {
    const c = make();
    c.acceptEthics();
    expect(c.futureSelfValid()).toBe(false);
    c.setFutureSelfAnswer(0, 'I am building a quiet studio of my own.');
    expect(c.futureSelfValid()).toBe(false); // one answer, one sentence
    c.setFutureSelfAnswer(1, 'They pause. They ask the part what it fears. They stay.');
    expect(c.futureSelfValid()).toBe(true);
    c.saveFutureSelf();
    flushLocal();
    const saved = JSON.parse(localStorage.getItem('INNERVERSE_FUTURE_SELF_V1')!);
    expect(saved[0]).toContain('quiet studio');
    expect(c.stage()).toBe('complete');
  });

  it('§3D.2 skipping leaves the dim placeholder (no stored star)', () => {
    const c = make();
    c.acceptEthics();
    c.skipFutureSelf();
    flushLocal();
    expect(localStorage.getItem('INNERVERSE_FUTURE_SELF_V1')).toBeNull();
  });

  it('persists progress and restores mid-descent after reload', () => {
    const c = make();
    c.acceptEthics();
    c.answer(4);
    if (c.pendingSomaticPart()) c.skipZone();
    vi.advanceTimersByTime(200);
    flushLocal();
    expect(localStorage.getItem('INNERVERSE_DESCENT_V1')).toBeTruthy();
    const c2 = make();
    expect(c2.stage()).toBe('item'); // restored straight into the battery
    expect(c2.answers()[0]).toBe(4);
  });
});

describe('DescentPanelComponent — template structure', () => {
  it('renders one item per screen with a 5-point Likert', () => {
    expect(templateHtml).toMatch(/stage\(\) === 'item'/);
    expect(templateHtml).toMatch(/likert\[lang\(\)\]/);
    expect((templateHtml.match(/class="likert-btn"/g) ?? []).length).toBeGreaterThanOrEqual(1);
  });
  it('ethics gate explains the three-sitting plan before the first statement', () => {
    expect(templateHtml).toMatch(/planTitle/);
    expect(templateHtml).toMatch(/sittings-row/);
    expect(templateHtml).toMatch(/ethicsWhy/);
  });

  it('contains the mandatory ethics gate and break screens', () => {
    expect(templateHtml).toMatch(/stage\(\) === 'ethics'/);
    expect(templateHtml).toMatch(/stage\(\) === 'break'/);
  });
  it('Quick Scan is NOT in the flow (reserved as lead magnet)', () => {
    expect(templateHtml).not.toMatch(/stage\(\) === 'scan/);
    expect(templateHtml).not.toMatch(/scan-result/);
    expect(templateHtml).not.toMatch(/startScan|answerScan/);
  });
  it('somatic body-map is skippable with one tap', () => {
    expect(templateHtml).toMatch(/skipZone\(\)/);
    expect(templateHtml).toMatch(/chooseZone\(zone\)/);
  });
  it('recalibration notice renders on the ethics gate', () => {
    expect(templateHtml.search(/recalibrated\(\)/))
      .toBeGreaterThan(templateHtml.search(/stage\(\) === 'ethics'/));
  });
});
