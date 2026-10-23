// Inner negotiation, possibility wardrobe and experiment handoff (ArchetypeAI-28h.4.3). Pure.
// No forced consensus and no identity upgrade. Every hypothetical branch is labelled as hypothetical.

export interface NegotiatingPart { id: string; agreed: boolean | null; }
export type Outcome = 'all-agreed' | 'partial' | 'open';

export function negotiate(parts: ReadonlyArray<NegotiatingPart>): Outcome {
  if (parts.length === 0 || parts.some((p) => p.agreed === null)) return 'open';
  return parts.every((p) => p.agreed === true) ? 'all-agreed' : 'partial';
}

/** A part may decline. A decline is recorded and never overridden. */
export function decline(parts: ReadonlyArray<NegotiatingPart>, id: string): NegotiatingPart[] {
  return parts.map((p) => (p.id === id ? { ...p, agreed: false } : p));
}

export interface Branch { label: 'hypothetical'; text: string; }
/** Every branch carries the hypothetical label, whatever the text. */
export function branch(text: string): Branch | null {
  const trimmed = text.trim();
  return trimmed ? { label: 'hypothetical', text: trimmed } : null;
}

/** A small move is editable; an empty edit is refused. */
export function editMove(current: string, edited: string): string {
  return edited.trim() ? edited.trim() : current;
}
