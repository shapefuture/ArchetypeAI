import { describe, expect, it } from 'vitest';
import { advance, availablePractices, interrupt, resume, start, stepsFor, type Practice } from './contextual-checkin.ts';

const breath: Practice = { id: 'breath', title: 'Breath', status: 'reviewed', requires: [], steps: ['Notice', 'Breathe out', 'Name it'] };
const draft: Practice = { id: 'draft', title: 'Draft', status: 'draft', requires: [], steps: ['x'] };
const chained: Practice = { id: 'chained', title: 'Chained', status: 'reviewed', requires: ['breath'], steps: ['y'] };

describe('contextual check-in', () => {
  it('offers a reviewed practice without any assessment or synastry being completed', () => {
    expect(availablePractices([breath], []).map((p) => p.id)).toEqual(['breath']);
  });

  it('never offers an unreviewed draft', () => {
    expect(availablePractices([draft], [])).toEqual([]);
  });

  it('offers a chained practice only after its own prerequisite', () => {
    expect(availablePractices([chained], []).map((p) => p.id)).toEqual([]);
    expect(availablePractices([chained], ['breath']).map((p) => p.id)).toEqual(['chained']);
  });

  it('shows one step on the quiet path and every step on the full path', () => {
    expect(stepsFor(breath, 'quiet')).toEqual(['Notice']);
    expect(stepsFor(breath, 'full')).toHaveLength(3);
  });

  it('resumes at the same step after an interruption, with nothing discarded', () => {
    let state = advance(start(breath, 'full'), breath.steps.length);
    state = interrupt(state);
    expect(state.interrupted).toBe(true);
    state = resume(state);
    expect(state.stepIndex).toBe(1);
    expect(state.interrupted).toBe(false);
  });

  it('never advances past the last step', () => {
    let state = start(breath, 'full');
    for (let i = 0; i < 10; i += 1) state = advance(state, breath.steps.length);
    expect(state.stepIndex).toBe(2);
  });
});
