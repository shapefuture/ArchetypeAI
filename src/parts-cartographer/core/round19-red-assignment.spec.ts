// Critic 19: the only therapist UI path (innerverse.jsx sendAssignment) calls assignExercise
// without the `red` option, so the RED container gate never runs. The module's own comments
// say RED "passes the gate ONLY here" and that "even therapists cannot skip the container (§3E.3)".
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setDoc } = vi.hoisted(() => ({ setDoc: vi.fn(async () => undefined) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join('/') })),
  setDoc,
  collection: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));

import { assignExercise } from './therapist-link';
import { EXERCISE_TYPES, EXERCISES } from '../../shared/core/data/exercises';

beforeEach(() => setDoc.mockClear());

describe('therapist assignment of a RED exercise (round 19)', () => {
  it('the RED witnessing exercise is a RED-gated type', () => {
    const exercise = EXERCISES.find((e) => e.id === 'witnessing-notes');
    expect(exercise).toBeDefined();
    expect(EXERCISE_TYPES[exercise!.type].gate).toBe('red');
  });

  it('is refused when the client has no Safe-Place container, as the call the dashboard makes', async () => {
    // Same argument shape as innerverse.jsx: assignExercise(user.uid, clientUid, { exerciseId, frequency }).
    const saved = await assignExercise('therapist-1', 'client-1', { exerciseId: 'witnessing-notes', frequency: 'once' } as any);
    expect(saved).toBe(false);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('is saved when the container proof is supplied (control)', async () => {
    const saved = await assignExercise('therapist-1', 'client-1', { exerciseId: 'witnessing-notes', frequency: 'once' } as any, {
      red: { profile: { resources: {} } as any, container: { safePlaceBuilt: true, resourcesMobilized: true } },
    });
    expect(saved).toBe(true);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('a GREEN exercise is saved without a container (control)', async () => {
    const green = EXERCISES.find((e) => EXERCISE_TYPES[e.type].gate === 'green')!;
    const saved = await assignExercise('therapist-1', 'client-1', { exerciseId: green.id, frequency: 'once' } as any);
    expect(saved).toBe(true);
  });
});
