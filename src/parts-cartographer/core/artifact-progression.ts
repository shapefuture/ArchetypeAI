// Artifact-based progression with chosen workshop rewards (ArchetypeAI-28h.3.4). Pure.
// Progress counts artifacts the person made. There is no streak, energy, loot or essential lock. Revising,
// asking for help and resting never reduce progress.

export interface Artifact { id: string; kind: string; createdAt: string; revisedCount: number; }
export interface Progress { artifactCount: number; revisionCount: number; lastCreatedAt: string | null; }
export interface Reward { id: string; label: string; chosenBy: 'user'; }

export function progressFor(artifacts: ReadonlyArray<Artifact>): Progress {
  const lastCreatedAt = artifacts.reduce<string | null>((latest, a) => (latest === null || a.createdAt > latest ? a.createdAt : latest), null);
  return {
    artifactCount: artifacts.length,
    revisionCount: artifacts.reduce((sum, a) => sum + a.revisedCount, 0),
    lastCreatedAt,
  };
}

/** Revising keeps every artifact and its count; it can only add revisions. */
export function revise(artifacts: ReadonlyArray<Artifact>, id: string): Artifact[] {
  return artifacts.map((a) => (a.id === id ? { ...a, revisedCount: a.revisedCount + 1 } : a));
}

/** A reward is chosen from the person's own list. The person chooses it; nothing is assigned. */
export function chooseReward(options: ReadonlyArray<Reward>, id: string): Reward | null {
  return options.find((r) => r.id === id && r.chosenBy === 'user') ?? null;
}

/** Essentials are never locked behind progress. */
export function isEssentialLocked(_essentialId: string, _progress: Progress): false {
  return false;
}
