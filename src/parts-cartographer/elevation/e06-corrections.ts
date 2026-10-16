// E06 step 04 (ArchetypeAI-2on) and step 07 recovery (ArchetypeAI-p4t): precise invalidation and restoration when a
// person corrects an interpretation, with stale-retrieval guards, concurrency checks and refused failed propagation. Pure.
// A correction appends a receipt and marks only what was derived from the corrected record. Undo restores the
// interpretation, but projections built during the rejection stay stale until rebuilt from active sources. Deleting a
// source erases its wording and everything derived from it. Canonical 64/147 measurements are never modified.
// Corrections create no score, streak or causal claim.
// NOT done: receipt and undo screens (E06.05, step 05), wiring into memory, coach context and storage (step 06),
// and evidence, privacy or acceptance review (steps 10-12).
import { appendVersion, latestFor, type VersionHistory } from '../core/content-versions';
import { contextMemories, deleteWithDerived, type Memory, type Source } from '../core/personal-memory';
import { allowedFormulation } from '../core/situation-inquiry';

export type NodeKind = 'observation' | 'hypothesis' | 'user-authorship' | 'canonical-measurement' | 'summary' | 'context';
export type NodeStatus = 'active' | 'rejected' | 'deleted';
export type Effective = NodeStatus | 'stale';
export type Actor = 'user' | 'model';
export type Action = 'reject' | 'undo' | 'revise' | 'delete-source' | 'rebuild';
export type Refusal = 'stale-revision' | 'not-authorized' | 'not-found' | 'duplicate' | 'empty' | 'overclaim' | 'rejected-wording'
  | 'canonical-immutable' | 'canonical-parent' | 'not-a-hypothesis' | 'not-a-source' | 'not-a-projection' | 'not-active'
  | 'already-rejected' | 'not-rejected' | 'deleted' | 'rejected-source' | 'deleted-source' | 'stale-source' | 'corrupt-lineage';
export type Blocked = 'unknown' | 'deleted' | 'rejected' | 'stale' | 'stale-snapshot' | 'unsaved' | 'rejected-wording';

export interface Node extends Memory {
  kind: NodeKind;
  locale: string;
  status: NodeStatus;
  /** Revision at which this wording was built from its parents. */
  basedOn: number;
  /** Revision of this record's last status or wording change. */
  changedAt: number;
  /** Append-only wording history (content-versions). */
  versions: VersionHistory;
}
export interface Receipt {
  id: string; action: Action; target: string; at: number;
  /** Records whose stored state this change wrote. */
  changed: string[];
  /** Projections that this change made stale or deleted. */
  marked: string[];
  /** Sources and canonical records this change deliberately left alone. */
  unchanged: string[];
  scoreDelta: 0; causalClaim: false;
}
export interface CorrectionState {
  revision: number;
  nodes: ReadonlyArray<Node>;
  receipts: ReadonlyArray<Receipt>;
  /** One-way, non-cryptographic fingerprints of rejected wording. They survive deletion. */
  rejections: ReadonlyArray<{ nodeId: string; fingerprint: string }>;
}
export interface Ctx { actor: Actor; expectedRevision: number; now: number; receiptId: string; }
export type Result = { ok: true; state: CorrectionState; receipt: Receipt | null } | { ok: false; reason: Refusal };
export interface Candidate { nodeId: string; text: string; basedOn: number; }

const PERSON_ONLY: ReadonlyArray<NodeKind> = ['observation', 'user-authorship'];
const APP_WRITTEN: ReadonlyArray<NodeKind> = ['hypothesis', 'summary', 'context'];
const PROJECTIONS: ReadonlyArray<NodeKind> = ['summary', 'context'];
const KINDS: ReadonlyArray<string> = ['observation', 'hypothesis', 'user-authorship', 'canonical-measurement', 'summary', 'context'];
const STATUSES: ReadonlyArray<string> = ['active', 'rejected', 'deleted'];

const sourceOf = (kind: NodeKind): Source => (kind === 'canonical-measurement' ? 'assessment' : PERSON_ONLY.includes(kind) ? 'user-entry' : 'model-inference');
const fail = (reason: Refusal): Result => ({ ok: false, reason });
const find = (s: CorrectionState, id: string): Node | null => s.nodes.find((n) => n.id === id) ?? null;
const isRec = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const patch = (s: CorrectionState, id: string, p: Partial<Node>): Node[] => s.nodes.map((n): Node => (n.id === id ? { ...n, ...p } : n));

/** Non-cryptographic FNV-1a fingerprint of normalised wording. It keeps no words. */
export function fingerprint(text: string): string {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let h = 0x811c9dc5;
  for (let i = 0; i < norm.length; i += 1) { h ^= norm.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

export function emptyCorrections(): CorrectionState { return { revision: 0, nodes: [], receipts: [], rejections: [] }; }

function ancestorNodes(s: CorrectionState, id: string): Node[] {
  const out: Node[] = [];
  const seen = new Set<string>();
  const queue: string[] = [...(find(s, id)?.derivedFrom ?? [])];
  for (let i = 0; i < queue.length; i += 1) {
    const pid = queue[i];
    if (seen.has(pid)) continue;
    seen.add(pid);
    const parent = find(s, pid);
    if (!parent) continue; // a dangling parent is reported by lineageOk
    out.push(parent);
    queue.push(...parent.derivedFrom);
  }
  return out;
}

/** Projections derived, directly or transitively, from a record. Uses the same closure as deleteWithDerived. */
function descendantIds(s: CorrectionState, id: string): string[] {
  return deleteWithDerived(s.nodes, id).removed.filter((x) => x !== id);
}

/** Stale when a parent was rejected or deleted, or a parent changed after this wording was built. */
export function effectiveStatus(s: CorrectionState, id: string): Effective | null {
  const node = find(s, id);
  if (!node) return null;
  if (node.status !== 'active') return node.status;
  const parents = ancestorNodes(s, id);
  return parents.some((p) => p.status !== 'active' || p.changedAt > node.basedOn) ? 'stale' : 'active';
}

/** The latest revision that touched this record or anything it derives from. */
function lastChangeOf(s: CorrectionState, id: string): number {
  return Math.max(find(s, id)?.changedAt ?? 0, ...ancestorNodes(s, id).map((p) => p.changedAt));
}

const lineageOk = (s: CorrectionState): boolean => s.nodes.every((n) => n.derivedFrom.every((p) => find(s, p) !== null));

function gate(s: CorrectionState, ctx: Ctx, personOnly: boolean): Refusal | null {
  if (personOnly && ctx.actor !== 'user') return 'not-authorized';
  if (ctx.expectedRevision !== s.revision) return 'stale-revision';
  return lineageOk(s) ? null : 'corrupt-lineage';
}

/** A retried correction with a known receipt id returns the original receipt and never applies twice. */
function replayed(s: CorrectionState, ctx: Ctx): Result | null {
  const prior = s.receipts.find((r) => r.id === ctx.receiptId);
  return prior ? { ok: true, state: s, receipt: prior } : null;
}

function aim(s: CorrectionState, id: string, kinds: ReadonlyArray<NodeKind>, wrong: Refusal): { node: Node } | { refusal: Refusal } {
  const node = find(s, id);
  if (!node) return { refusal: 'not-found' };
  if (node.kind === 'canonical-measurement') return { refusal: 'canonical-immutable' };
  if (!kinds.includes(node.kind)) return { refusal: wrong };
  if (node.status === 'deleted') return { refusal: 'deleted' };
  return { node };
}

function parentRefusal(s: CorrectionState, parents: string[]): Refusal | null {
  for (const p of parents) {
    const n = find(s, p);
    if (!n) return 'not-found';
    if (n.kind === 'canonical-measurement') return 'canonical-parent';
    const st = effectiveStatus(s, p);
    if (st === 'rejected') return 'rejected-source';
    if (st === 'deleted') return 'deleted-source';
    if (st === 'stale') return 'stale-source';
  }
  return null;
}

function wordingRefusal(s: CorrectionState, kind: NodeKind, text: string): Refusal | null {
  if (!text) return 'empty';
  if (!APP_WRITTEN.includes(kind)) return null;
  if (!allowedFormulation(text)) return 'overclaim';
  return s.rejections.some((r) => r.fingerprint === fingerprint(text)) ? 'rejected-wording' : null;
}

interface Change { rev: number; action: Action; target: string; nodes: Node[]; rejections: CorrectionState['rejections']; changed: string[]; }

/** Writes one correction: new revision, receipt appended, affected projections listed, sources and canonical records named as unchanged. */
function land(s: CorrectionState, ctx: Ctx, c: Change): Result {
  const next: CorrectionState = { revision: c.rev, nodes: c.nodes, receipts: s.receipts, rejections: c.rejections };
  const marked = descendantIds(next, c.target).filter((id) => !c.changed.includes(id) && effectiveStatus(next, id) === 'stale');
  const canonical = s.nodes.filter((n) => n.kind === 'canonical-measurement').map((n) => n.id);
  const unchanged = [...new Set([...ancestorNodes(next, c.target).map((n) => n.id), ...canonical])].filter((id) => !c.changed.includes(id));
  const receipt: Receipt = { id: ctx.receiptId, action: c.action, target: c.target, at: ctx.now, changed: c.changed, marked, unchanged, scoreDelta: 0, causalClaim: false };
  return { ok: true, state: { ...next, receipts: [...s.receipts, receipt] }, receipt };
}

/** Adds a record. The model may add interpretations and projections; observations and authored wording are the person's. */
export function addNode(s: CorrectionState, input: { id: string; kind: NodeKind; text: string; derivedFrom?: string[]; locale?: string }, ctx: Ctx): Result {
  const g = gate(s, ctx, false);
  if (g) return fail(g);
  if (ctx.actor === 'model' && PERSON_ONLY.includes(input.kind)) return fail('not-authorized');
  const text = input.text.trim();
  const parents = input.derivedFrom ?? [];
  if (find(s, input.id)) return fail('duplicate');
  if (input.kind === 'canonical-measurement' && parents.length > 0) return fail('canonical-parent');
  const refusal = wordingRefusal(s, input.kind, text) ?? parentRefusal(s, parents);
  if (refusal) return fail(refusal);
  const rev = s.revision + 1;
  const locale = input.locale ?? 'en';
  const node: Node = {
    id: input.id, text, source: sourceOf(input.kind), derivedFrom: parents, saved: input.kind !== 'canonical-measurement',
    kind: input.kind, locale, status: 'active', basedOn: rev, changedAt: rev,
    versions: appendVersion([], { version: String(rev), locale, text, private: true }),
  };
  return { ok: true, state: { ...s, revision: rev, nodes: [...s.nodes, node] }, receipt: null };
}

/** Rejects a hypothesis (person only). Its derived projections become stale; its sources stay as they were. */
export function rejectHypothesis(s: CorrectionState, id: string, ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, true); if (g) return fail(g);
  const hit = aim(s, id, ['hypothesis'], 'not-a-hypothesis');
  if ('refusal' in hit) return fail(hit.refusal);
  if (hit.node.status === 'rejected') return fail('already-rejected');
  const rev = s.revision + 1;
  return land(s, ctx, {
    rev, action: 'reject', target: id, changed: [id],
    rejections: [...s.rejections, { nodeId: id, fingerprint: fingerprint(hit.node.text) }],
    nodes: patch(s, id, { status: 'rejected', changedAt: rev }),
  });
}

/** Undoes a rejection (person only). Projections built during the rejection stay stale until rebuilt. */
export function undoRejection(s: CorrectionState, id: string, ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, true); if (g) return fail(g);
  const hit = aim(s, id, ['hypothesis'], 'not-a-hypothesis');
  if ('refusal' in hit) return fail(hit.refusal);
  if (hit.node.status !== 'rejected') return fail('not-rejected');
  const rev = s.revision + 1;
  return land(s, ctx, {
    rev, action: 'undo', target: id, changed: [id],
    rejections: s.rejections.filter((r) => r.nodeId !== id),
    nodes: patch(s, id, { status: 'active', changedAt: rev }),
  });
}

/**
 * Revises a hypothesis in the person's own words (person only). The earlier wording is superseded and kept on record
 * as rejected, and the new wording is a new user-authorship record with the same sources.
 */
export function reviseHypothesis(s: CorrectionState, id: string, newId: string, text: string, ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, true); if (g) return fail(g);
  const hit = aim(s, id, ['hypothesis'], 'not-a-hypothesis');
  if ('refusal' in hit) return fail(hit.refusal);
  if (hit.node.status !== 'active') return fail('not-active');
  const clean = text.trim();
  if (!clean) return fail('empty');
  if (find(s, newId)) return fail('duplicate');
  const rev = s.revision + 1;
  const fresh: Node = {
    id: newId, text: clean, source: 'user-entry', derivedFrom: hit.node.derivedFrom, saved: true, kind: 'user-authorship',
    locale: hit.node.locale, status: 'active', basedOn: rev, changedAt: rev,
    versions: appendVersion([], { version: String(rev), locale: hit.node.locale, text: clean, private: true }),
  };
  return land(s, ctx, {
    rev, action: 'revise', target: id, changed: [id, newId],
    rejections: [...s.rejections, { nodeId: id, fingerprint: fingerprint(hit.node.text) }],
    nodes: [...patch(s, id, { status: 'rejected', changedAt: rev }), fresh],
  });
}

/** Deletes a source (person only). Its wording is erased, and everything derived from it is erased too. Receipts keep ids only. */
export function deleteSource(s: CorrectionState, id: string, ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, true); if (g) return fail(g);
  const hit = aim(s, id, ['observation', 'user-authorship'], 'not-a-source');
  if ('refusal' in hit) return fail(hit.refusal);
  const rev = s.revision + 1;
  const doomed = deleteWithDerived(s.nodes, id).removed;
  const nodes = s.nodes.map((n): Node => (doomed.includes(n.id) ? { ...n, text: '', versions: [], saved: false, status: 'deleted', changedAt: rev } : n));
  return land(s, ctx, { rev, action: 'delete-source', target: id, changed: doomed, rejections: s.rejections, nodes });
}

/** Rebuilds a summary or context from active sources (the model or the person). Rejected wording and rejected sources are refused. */
export function rebuildProjection(s: CorrectionState, id: string, text: string, derivedFrom: string[], ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, false); if (g) return fail(g);
  const hit = aim(s, id, PROJECTIONS, 'not-a-projection');
  if ('refusal' in hit) return fail(hit.refusal);
  const clean = text.trim();
  const refusal = wordingRefusal(s, hit.node.kind, clean) ?? parentRefusal(s, derivedFrom);
  if (refusal) return fail(refusal);
  const rev = s.revision + 1;
  return land(s, ctx, {
    rev, action: 'rebuild', target: id, changed: [id], rejections: s.rejections,
    nodes: s.nodes.map((n): Node => (n.id === id
      ? { ...n, text: clean, derivedFrom, basedOn: rev, changedAt: rev, versions: appendVersion(n.versions, { version: String(rev), locale: n.locale, text: clean, private: true }) }
      : n)),
  });
}

/**
 * Filters cached or fresh retrieval candidates. Only saved, active, current-revision records pass. A rejected or deleted
 * interpretation never passes, by id or by wording, and a cached copy older than a change is stale.
 */
export function filterRetrieval(s: CorrectionState, candidates: ReadonlyArray<Candidate>): { allowed: Candidate[]; blocked: Array<{ nodeId: string; reason: Blocked }> } {
  const saved = new Set(contextMemories(s.nodes).map((n) => n.id));
  const allowed: Candidate[] = [];
  const blocked: Array<{ nodeId: string; reason: Blocked }> = [];
  for (const c of candidates) {
    const reason = blockReason(s, c, saved);
    if (reason) blocked.push({ nodeId: c.nodeId, reason }); else allowed.push(c);
  }
  return { allowed, blocked };
}

function blockReason(s: CorrectionState, c: Candidate, saved: Set<string>): Blocked | null {
  const status = effectiveStatus(s, c.nodeId);
  if (status === 'deleted' || status === 'rejected' || status === 'stale') return status;
  if (s.rejections.some((r) => r.fingerprint === fingerprint(c.text))) return 'rejected-wording';
  if (!status) return 'unknown';
  if (c.basedOn < lastChangeOf(s, c.nodeId)) return 'stale-snapshot';
  return saved.has(c.nodeId) ? null : 'unsaved';
}

/** Loads stored corrections. Malformed data, wording that disagrees with its latest version, or broken lineage returns null. */
export function parseCorrections(raw: unknown): CorrectionState | null {
  if (!isRec(raw) || !Number.isInteger(raw.revision) || (raw.revision as number) < 0) return null;
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.receipts) || !Array.isArray(raw.rejections)) return null;
  const nodes = raw.nodes as unknown[];
  const ids = new Set(nodes.filter(isRec).map((n) => n.id));
  const sound = nodes.every((n) => isRec(n) && typeof n.id === 'string' && KINDS.includes(n.kind) && STATUSES.includes(n.status)
    && Array.isArray(n.derivedFrom) && n.derivedFrom.every((p: unknown) => ids.has(p))
    && Array.isArray(n.versions) && (n.versions.length === 0 ? n.text === '' : latestFor(n.versions, n.locale)?.text === n.text));
  return sound ? (raw as unknown as CorrectionState) : null;
}
