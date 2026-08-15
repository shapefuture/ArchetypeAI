import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PracticePanelComponent } from './practice-panel.component';
import { SHADOW_PARTS, RESOURCES } from '../../core/data/parts';
import { scoreProfile, type AssessmentInput } from '../../core/data/scoring-v2';
import { loadEvents } from '../../core/data/state-v2';

const DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(DIR, 'practice-panel.component.html'), 'utf-8');

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

function make(): PracticePanelComponent {
  const c = TestBed.runInInjectionContext(() => new PracticePanelComponent()) as PracticePanelComponent;
  c.profile.set(scoreProfile(all(4)));
  return c;
}

describe('PracticePanelComponent — §3C.5 ladder (solo rungs 1–3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  afterEach(() => vi.useRealTimers());

  it('rungs advance by doing: name → if-then (logged) → rehearsal', () => {
    const c = make();
    expect(c.rungOf('soft-gaze')).toBe(0);
    c.namePrinciple('soft-gaze');
    expect(c.rungOf('soft-gaze')).toBe(1);
    c.ifThenDraft.set('When my chest tightens before a call, I will place both feet down and exhale');
    c.saveIfThen('soft-gaze');
    expect(c.rungOf('soft-gaze')).toBe(2);
    expect(loadEvents().some(e => e.kind === 'ifthen_written')).toBe(true);
    c.startRehearsal('soft-gaze');
    vi.advanceTimersByTime(91_000);
    expect(c.rungOf('soft-gaze')).toBe(3);
  });

  it('HARD RULE: solo UI cannot reach rungs 4–5 — ladder caps at 3', () => {
    const c = make();
    c.namePrinciple('soft-gaze');
    c.ifThenDraft.set('When X happens under load, I will do Y and stay');
    c.saveIfThen('soft-gaze');
    c.startRehearsal('soft-gaze');
    vi.advanceTimersByTime(91_000);
    expect(c.rungOf('soft-gaze')).toBe(3); // solo ceiling
    // no public solo path sets liveRep/verifiedUnderLoad
    expect(Object.keys(c.ladderOf('soft-gaze')).length).toBe(3);
  });

  it('a blank if-then plan never advances the rung', () => {
    const c = make();
    c.namePrinciple('soft-gaze');
    c.ifThenDraft.set('   ');
    c.saveIfThen('soft-gaze');
    expect(c.rungOf('soft-gaze')).toBe(1);
  });

  it('ladder persists in local practice state', () => {
    const c = make();
    c.namePrinciple('soft-gaze');
    const saved = JSON.parse(localStorage.getItem('INNERVERSE_PRACTICE_V1')!);
    expect(saved.ladder['soft-gaze'].principleNamed).toBe(true);
  });
});

describe('PracticePanelComponent — template', () => {
  it('renders five rungs with 4–5 marked therapist-locked', () => {
    expect(templateHtml).toMatch(/rungNames/);
    expect(templateHtml).toMatch(/state\(\)\.therapistLinked/);
    expect(templateHtml).toMatch(/startRehearsal/);
    expect(templateHtml).toMatch(/saveIfThen/);
  });
});
