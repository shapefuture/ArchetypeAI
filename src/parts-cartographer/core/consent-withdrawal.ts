// Consent withdrawal, role changes and solo-path parity (ArchetypeAI-28h.6.3). Pure.
// Withdrawing ends shared access at once. Each party keeps what they own, and the solo path keeps its progress.

export interface SharedSupport { shared: boolean; ownerA: string; ownerB: string; }
export interface SoloProgress { items: ReadonlyArray<string>; progress: number; }

export function withdraw(support: SharedSupport): SharedSupport {
  return { ...support, shared: false };
}

/** Each party's ownership and limits, stated plainly. */
export function ownershipSummary(support: SharedSupport): { a: string; b: string } {
  return {
    a: support.shared ? `${support.ownerA} owns their own entries; shared support is on.` : `${support.ownerA} owns their own entries; shared support is off.`,
    b: support.shared ? `${support.ownerB} owns their own entries; shared support is on.` : `${support.ownerB} owns their own entries; shared support is off.`,
  };
}

/** The solo view is the same before and after withdrawal, so no progress is lost. */
export function soloView(progress: SoloProgress): SoloProgress {
  return progress;
}
