// Personal-memory provenance and deletion propagation (ArchetypeAI-28h.5.1). Pure.
// Every memory states its source. Deleting a memory removes what was derived from it. The person can correct
// any memory, and the earlier wording is kept. Only saved memories are offered as context; unsaved chat never is.

export type Source = 'user-entry' | 'assessment' | 'model-inference';
export interface Memory { id: string; text: string; source: Source; derivedFrom: ReadonlyArray<string>; saved: boolean; }
export interface Correction { memoryId: string; previous: string; next: string; }

export function addMemory(memories: ReadonlyArray<Memory>, memory: Memory): Memory[] | null {
  if (!memory.source) return null;
  return [...memories, memory];
}

/** Keeps the earlier wording on record, so a correction is never silent. */
export function correctMemory(memories: ReadonlyArray<Memory>, id: string, text: string): { memories: Memory[]; correction: Correction | null } {
  const target = memories.find((m) => m.id === id);
  if (!target || !text.trim()) return { memories: [...memories], correction: null };
  const updated = memories.map((m) => (m.id === id ? { ...m, text: text.trim() } : m));
  return { memories: updated, correction: { memoryId: id, previous: target.text, next: text.trim() } };
}

/** Deletes a memory and, transitively, every memory derived from it. Returns the ids removed. */
export function deleteWithDerived(memories: ReadonlyArray<Memory>, id: string): { memories: Memory[]; removed: string[] } {
  const removed = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of memories) {
      if (!removed.has(m.id) && m.derivedFrom.some((parent) => removed.has(parent))) {
        removed.add(m.id);
        grew = true;
      }
    }
  }
  return { memories: memories.filter((m) => !removed.has(m.id)), removed: [...removed] };
}

/** Context offers only saved memories. Unsaved chat and raw drafts never become context by default. */
export function contextMemories(memories: ReadonlyArray<Memory>): Memory[] {
  return memories.filter((m) => m.saved);
}
