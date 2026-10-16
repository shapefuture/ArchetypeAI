// Contextual check-in with reviewed practices (ArchetypeAI-28h.3.1). Pure.
// A practice is offered when it is reviewed and its own prerequisites are met. Unrelated assessment
// and synastry gates never apply. A quiet path shows one step, and an interrupted check-in resumes in place.

export type PracticeStatus = 'reviewed' | 'draft';
export interface Practice { id: string; title: string; status: PracticeStatus; requires: ReadonlyArray<string>; steps: ReadonlyArray<string>; }
export type CheckInMode = 'full' | 'quiet';
export interface CheckInState { practiceId: string; mode: CheckInMode; stepIndex: number; interrupted: boolean; }

/** Offers only reviewed practices whose own prerequisites are completed. */
export function availablePractices(practices: ReadonlyArray<Practice>, completed: ReadonlyArray<string>): Practice[] {
  return practices.filter((p) => p.status === 'reviewed' && p.requires.every((id) => completed.includes(id)));
}

/** Full mode shows every step. Quiet mode shows one, so the path stays small. */
export function stepsFor(practice: Practice, mode: CheckInMode): ReadonlyArray<string> {
  return mode === 'quiet' ? practice.steps.slice(0, 1) : practice.steps;
}

export function start(practice: Practice, mode: CheckInMode): CheckInState {
  return { practiceId: practice.id, mode, stepIndex: 0, interrupted: false };
}

/** Interrupting keeps the place. Nothing is discarded and nothing is scored. */
export function interrupt(state: CheckInState): CheckInState {
  return { ...state, interrupted: true };
}

/** Resuming returns to the same step, not to the first one. */
export function resume(state: CheckInState): CheckInState {
  return { ...state, interrupted: false };
}

export function advance(state: CheckInState, stepCount: number): CheckInState {
  return { ...state, stepIndex: Math.min(state.stepIndex + 1, stepCount - 1) };
}
