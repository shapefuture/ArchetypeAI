// Contextual validity of personal knowledge (ArchetypeAI-mfv, E07.04). Pure: no storage, no clock, no UI.
// A validity mark (still fits, fits in some contexts, no longer fits) sits beside a personal-memory record.
// A change never edits the wording, the source, derived records, the person's certainty, a canonical instrument
// result or a resurfacing decline. Only the person changes marks; the model cannot.
// Recovery cases (ArchetypeAI-4pt, E07.07) are here too: sparse evidence, changed circumstances, declined
// resurfacing, interruption, concurrency, storage and deletion. The spec holds the recovery matrix.
// NOT DONE HERE: the inspection UI (step 05), wiring into the memory library or retrieval (step 06), persistence
// (callers store the returned ledger), and evidence or acceptance (steps 10-12). The therapist 3+1 analysis and
// assessment-free support are neither read nor gated here.

import { contextMemories, deleteWithDerived, type Memory, type Source } from '../core/personal-memory';

export const VALIDITY_STATES = ['still-fits', 'context-specific', 'no-longer-fits'] as const;
export type ValidityState = (typeof VALIDITY_STATES)[number];
export type MarkState = ValidityState | 'unmarked';
export type CertaintyLevel = 'very-sure' | 'somewhat-sure' | 'unsure' | 'unset';
export type ResurfacingChoice = 'allowed' | 'declined' | 'unset';
export type Actor = 'person' | 'model';
export type EpistemicKind = 'observation' | 'hypothesis' | 'canonical-measurement';
export type WordingAuthor = 'user' | 'model' | 'instrument';

export interface ValidityMark {
  memoryId: string;
  state: MarkState;
  /** Where or when a context-specific item applies. Null for every other state. */
  contextLabel: string | null;
  /** Wording at the first mark. Later edits to the memory never overwrite it. */
  originalWording: string;
  /** Set only by the person. No validity change touches it. */
  certainty: CertaintyLevel;
  /** Set only by the person. No validity change touches it. */
  resurfacing: ResurfacingChoice;
  revision: number;
}
export type ValidityLedger = ReadonlyArray<ValidityMark>;

/** Kind and wording author follow the record's source. Validity marks can never change either. */
export interface Provenance { kind: EpistemicKind; wording: WordingAuthor; canonical: boolean; }
const PROVENANCE: Record<Source, Provenance> = {
  'user-entry': { kind: 'observation', wording: 'user', canonical: false },
  assessment: { kind: 'canonical-measurement', wording: 'instrument', canonical: true },
  'model-inference': { kind: 'hypothesis', wording: 'model', canonical: false },
};

export function provenanceOf(memory: Memory): Provenance | null {
  return PROVENANCE[memory.source] ?? null;
}

/** Plain labels. None claims that an item is validated, proven or clinically meaningful. */
export const VALIDITY_LABELS: Record<MarkState, string> = {
  unmarked: 'Not marked yet',
  'still-fits': 'Still fits',
  'context-specific': 'Fits in some contexts',
  'no-longer-fits': 'No longer fits',
};

export function markFor(ledger: ValidityLedger, memory: Memory): ValidityMark {
  return ledger.find((m) => m.memoryId === memory.id)
    ?? { memoryId: memory.id, state: 'unmarked', contextLabel: null, originalWording: memory.text, certainty: 'unset', resurfacing: 'unset', revision: 0 };
}

/** True when the item was drawn, directly or through other items, from a source marked no longer fitting. */
function fromNoLongerFitting(memory: Memory, memories: ReadonlyArray<Memory>, ledger: ValidityLedger, seen = new Set<string>()): boolean {
  if (seen.has(memory.id)) return false;
  seen.add(memory.id);
  return memory.derivedFrom.some((parentId) => {
    const parent = memories.find((m) => m.id === parentId);
    return !!parent && (markFor(ledger, parent).state === 'no-longer-fits' || fromNoLongerFitting(parent, memories, ledger, seen));
  });
}

export type ValidityEvent =
  | { type: 'validity'; state: ValidityState; contextLabel?: string }
  | { type: 'certainty'; level: CertaintyLevel }
  | { type: 'resurfacing'; choice: 'allowed' | 'declined' };

export type ChangeRefusal = 'unknown-source' | 'model-actor' | 'context-required' | 'stale-revision';
export type ChangeResult =
  | { ok: true; ledger: ValidityLedger; mark: ValidityMark }
  | { ok: false; reason: ChangeRefusal; ledger: ValidityLedger };

/**
 * Applies one person-authored change. The input ledger is never mutated, and a refusal returns the earlier ledger,
 * so a failed or refused change leaves everything as it was.
 */
export function applyChange(memories: ReadonlyArray<Memory>, ledger: ValidityLedger, memoryId: string, event: ValidityEvent, actor: Actor, expectedRevision?: number): ChangeResult {
  const refuse = (reason: ChangeRefusal): ChangeResult => ({ ok: false, reason, ledger });
  if (actor !== 'person') return refuse('model-actor');
  const memory = memories.find((m) => m.id === memoryId);
  if (!memory) return refuse('unknown-source');
  const current = markFor(ledger, memory);
  if (expectedRevision !== undefined && expectedRevision !== current.revision) return refuse('stale-revision');
  const label = event.type === 'validity' ? event.contextLabel?.trim() || null : null;
  if (event.type === 'validity' && event.state === 'context-specific' && !label) return refuse('context-required');
  const next: ValidityMark = {
    ...current,
    revision: current.revision + 1,
    ...(event.type === 'validity' ? { state: event.state, contextLabel: event.state === 'context-specific' ? label : null } : {}),
    ...(event.type === 'certainty' ? { certainty: event.level } : {}),
    ...(event.type === 'resurfacing' ? { resurfacing: event.choice } : {}),
  };
  const exists = ledger.some((m) => m.memoryId === memoryId);
  const nextLedger = exists ? ledger.map((m) => (m.memoryId === memoryId ? next : m)) : [...ledger, next];
  return { ok: true, ledger: nextLedger, mark: next };
}

export interface StagedChange { memoryId: string; event: ValidityEvent; baseRevision: number; startedAt: string; }

/** Stages a change without applying it. An interrupted or unconfirmed change never lands by itself. */
export function stageChange(ledger: ValidityLedger, memoryId: string, event: ValidityEvent, now: () => string): StagedChange {
  return { memoryId, event, baseRevision: ledger.find((m) => m.memoryId === memoryId)?.revision ?? 0, startedAt: now() };
}

/** Confirms a staged change. If the mark moved since staging, the confirmation is refused and the newer choice stands. */
export function confirmStaged(memories: ReadonlyArray<Memory>, ledger: ValidityLedger, staged: StagedChange, actor: Actor): ChangeResult {
  return applyChange(memories, ledger, staged.memoryId, staged.event, actor, staged.baseRevision);
}

export const SCOPE_NOTE = 'Only the sources you selected for this question were considered. Nothing else was searched.';

export type PreviewReason =
  | 'included-still-fits' | 'included-unmarked' | 'included-context-match'
  | 'excluded-missing' | 'excluded-unsaved' | 'excluded-no-longer-fits' | 'excluded-parent-no-longer-fits'
  | 'excluded-resurfacing-declined' | 'excluded-context-mismatch' | 'excluded-context-unspecified';

export interface PreviewRow {
  memoryId: string;
  included: boolean;
  reason: PreviewReason;
  explanation: string;
  wording: string | null;
  originalWording: string | null;
  kind: EpistemicKind | null;
}
export interface RetrievalRequest { contextLabel: string | null; selectedIds: ReadonlyArray<string>; }

interface Decision { included: boolean; reason: PreviewReason; explanation: string; }
const out = (included: boolean, reason: PreviewReason, explanation: string): Decision => ({ included, reason, explanation });
const norm = (text: string) => text.trim().toLowerCase();

function decide(isSaved: boolean, fromRetired: boolean, mark: ValidityMark, contextLabel: string | null): Decision {
  if (!isSaved) return out(false, 'excluded-unsaved', 'Not included: it is not saved to your memory.');
  if (mark.state === 'no-longer-fits') return out(false, 'excluded-no-longer-fits', 'Not included: you marked it as no longer fitting. Its wording is kept.');
  if (fromRetired) return out(false, 'excluded-parent-no-longer-fits', 'Not included: it was drawn from a source you marked as no longer fitting.');
  if (mark.resurfacing === 'declined') return out(false, 'excluded-resurfacing-declined', 'Not included: you declined to have it brought back.');
  if (mark.state === 'context-specific') {
    if (!contextLabel) return out(false, 'excluded-context-unspecified', `Not included: it fits only in "${mark.contextLabel}", and this question names no context.`);
    if (norm(contextLabel) !== norm(mark.contextLabel ?? '')) return out(false, 'excluded-context-mismatch', `Not included: it fits in "${mark.contextLabel}", and this question is about "${contextLabel}".`);
    return out(true, 'included-context-match', `Included: it fits in "${mark.contextLabel}", which matches this question.`);
  }
  if (mark.state === 'still-fits') return out(true, 'included-still-fits', 'Included: you marked it as still fitting.');
  return out(true, 'included-unmarked', 'Included: saved and selected, not yet marked. You can mark it at any time.');
}

/** Retrieval considers only the selected sources. Each selected source gets a row that says why it is in or out. */
export function previewRetrieval(memories: ReadonlyArray<Memory>, ledger: ValidityLedger, request: RetrievalRequest): { rows: PreviewRow[]; scopeNote: string } {
  const saved = new Set(contextMemories(memories).map((m) => m.id));
  const rows = [...new Set(request.selectedIds)].map((id): PreviewRow => {
    const memory = memories.find((m) => m.id === id);
    if (!memory) return { memoryId: id, included: false, reason: 'excluded-missing', explanation: 'Not included: this source is no longer in your memory.', wording: null, originalWording: null, kind: null };
    const mark = markFor(ledger, memory);
    const decision = decide(saved.has(id), fromNoLongerFitting(memory, memories, ledger), mark, request.contextLabel);
    return { memoryId: id, ...decision, wording: memory.text, originalWording: mark.originalWording, kind: provenanceOf(memory)?.kind ?? null };
  });
  return { rows, scopeNote: SCOPE_NOTE };
}

/** Resurfacing offers only saved items the person has allowed. Quiet mode offers none. Retrieval is unaffected. */
export function resurfacingCandidates(memories: ReadonlyArray<Memory>, ledger: ValidityLedger, quiet: boolean): string[] {
  if (quiet) return [];
  return contextMemories(memories)
    .filter((m) => {
      const mark = markFor(ledger, m);
      return mark.resurfacing === 'allowed' && mark.state !== 'no-longer-fits' && !fromNoLongerFitting(m, memories, ledger);
    })
    .map((m) => m.id);
}

/** Educated guess: no evidence base sets this threshold. Below it, no pattern is described. */
export const PATTERN_MIN_OBSERVATIONS = 3;

export interface EvidenceDepth { usableObservations: number; patternsAllowed: boolean; message: string; }

/** Counts only saved observations that have not been marked no longer fitting. Hypotheses never count as corroboration. */
export function evidenceDepth(memories: ReadonlyArray<Memory>, ledger: ValidityLedger): EvidenceDepth {
  const usableObservations = contextMemories(memories).filter((m) =>
    provenanceOf(m)?.kind === 'observation' && markFor(ledger, m).state !== 'no-longer-fits' && !fromNoLongerFitting(m, memories, ledger)).length;
  const patternsAllowed = usableObservations >= PATTERN_MIN_OBSERVATIONS;
  const message = usableObservations === 0 ? 'No saved observations yet. Nothing is inferred from their absence.'
    : usableObservations === 1 ? 'We have one saved observation. It is useful as it is, and it is not enough to describe a pattern.'
    : patternsAllowed ? `We have ${usableObservations} saved observations. Any pattern is offered as a question to check, not as a finding.`
    : `We have ${usableObservations} saved observations. That is not enough to describe a pattern yet.`;
  return { usableObservations, patternsAllowed, message };
}

/** Deletes a source and what was derived from it, together with the marks of every removed item. */
export function deleteSource(memories: ReadonlyArray<Memory>, ledger: ValidityLedger, id: string): { memories: Memory[]; ledger: ValidityLedger; removed: string[] } {
  const { memories: kept, removed } = deleteWithDerived(memories, id);
  return { memories: kept, ledger: reconcile(kept, ledger), removed };
}

/** Drops marks whose source no longer exists. A leftover mark never revives a deleted item. */
export function reconcile(memories: ReadonlyArray<Memory>, ledger: ValidityLedger): ValidityLedger {
  const ids = new Set(memories.map((m) => m.id));
  return ledger.filter((m) => ids.has(m.memoryId));
}

/** Evidence this module does not supply. Each stays pending until its own review or study records it. */
export const PENDING_EVIDENCE = ['independent-review', 'user-testing-of-retrieval-preview', 'participant-evidence-on-validity-changes'] as const;
