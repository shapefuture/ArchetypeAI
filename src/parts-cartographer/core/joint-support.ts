// Jointly editable support experiments and Loop Finder (ArchetypeAI-28h.6.2). Pure.
// Neither person rewrites the other's text silently: a field changes only by its author or with the author's
// consent, and every change is recorded. The Loop Finder names patterns. It never gives a compatibility verdict.

export interface SharedField { value: string; author: 'a' | 'b'; }
export interface SharedDoc { fields: Record<string, SharedField>; history: Array<{ field: string; by: 'a' | 'b'; from: string; to: string }>; }

export function editField(doc: SharedDoc, by: 'a' | 'b', field: string, value: string, consentFromAuthor: boolean): { doc: SharedDoc; applied: boolean } {
  const current = doc.fields[field];
  const allowed = !current || current.author === by || consentFromAuthor;
  if (!allowed) return { doc, applied: false };
  const from = current?.value ?? '';
  const next: SharedDoc = {
    fields: { ...doc.fields, [field]: { value, author: current?.author ?? by } },
    history: [...doc.history, { field, by, from, to: value }],
  };
  return { doc: next, applied: true };
}

export interface LoopPattern { description: string; occurrences: number; }
/** Names recurring patterns in shared events. The result has no verdict, score or compatibility field. */
export function loopFinder(events: ReadonlyArray<string>): LoopPattern[] {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n > 1).map(([description, occurrences]) => ({ description, occurrences }));
}
