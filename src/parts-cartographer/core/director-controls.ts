// Watch and Director controls (ArchetypeAI-28h.4.2). Pure.
// Controls change only the imagined presentation. Canonical scores are never touched, and navigation is
// predictable: the same choice always leads to the same screen.

export interface Presentation { camera: 'wide' | 'close'; pacing: 'slow' | 'normal'; emphasis: string | null; }
export type Control = { kind: 'camera'; value: Presentation['camera'] } | { kind: 'pacing'; value: Presentation['pacing'] } | { kind: 'emphasis'; value: string | null };

export interface DirectorState<Scores> { presentation: Presentation; scores: Readonly<Scores>; }

export function applyControl<Scores>(state: DirectorState<Scores>, control: Control): DirectorState<Scores> {
  const presentation = control.kind === 'camera'
    ? { ...state.presentation, camera: control.value }
    : control.kind === 'pacing'
      ? { ...state.presentation, pacing: control.value }
      : { ...state.presentation, emphasis: control.value };
  return { presentation, scores: state.scores };
}

export type Screen = 'watch' | 'director' | 'universe' | 'intro';
const NEXT: Record<Screen, Partial<Record<'back' | 'open-director' | 'open-watch', Screen>>> = {
  watch: { 'open-director': 'director', back: 'intro' },
  director: { 'open-watch': 'watch', back: 'watch' },
  universe: { back: 'intro' },
  intro: { 'open-watch': 'watch', back: 'intro' },
};

/** Same choice, same screen, every time. Unknown choices stay where they are. */
export function nextScreen(current: Screen, choice: 'back' | 'open-director' | 'open-watch'): Screen {
  return NEXT[current][choice] ?? current;
}
