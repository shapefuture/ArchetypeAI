// Quiet mode, graduation and continuity (ArchetypeAI-28h.5.4). Pure.
// Resting or leaving never changes the world. Graduation happens only on an explicit choice. There is no
// mascot, streak or pressure to return.

export interface WorldState { places: ReadonlyArray<string>; progress: number; }

/** Leaving or resting returns the world exactly as it was. */
export function leaveOrRest(world: WorldState): WorldState {
  return world;
}

/** Graduation requires an explicit yes from the person. Anything else keeps the current state. */
export function graduate(world: WorldState, personChoseGraduation: boolean): { world: WorldState; graduated: boolean } {
  return personChoseGraduation ? { world: { ...world }, graduated: true } : { world, graduated: false };
}
