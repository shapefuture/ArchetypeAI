// E06 step 04 (ArchetypeAI-2on) and step 07 recovery (ArchetypeAI-p4t): precise invalidation and restoration of corrected
// interpretations, with stale-retrieval guards, concurrency checks and refused failed propagation. Pure.
// NOT done: receipt and undo screens (E06.05), wiring into memory and coach context (step 06), evidence and acceptance (steps 10-12).
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

/** basedOn: revision the wording was built from its parents. changedAt: revision of the last status or wording change. */
export interface Node extends Memory {
  kind: NodeKind; locale: string; status: NodeStatus; basedOn: number; changedAt: number; versions: VersionHistory;
}
/** changed: records this change wrote. marked: projections it made stale. unchanged: sources and canonical records it left alone. */
export interface Receipt {
  id: string; action: Action; target: string; at: number;
  changed: string[]; marked: string[]; unchanged: string[];
  scoreDelta: 0; causalClaim: false;
}
/** rejections: one-way, non-cryptographic fingerprints of rejected wording. They survive deletion. */
export interface CorrectionState {
  revision: number;
  nodes: ReadonlyArray<Node>;
  receipts: ReadonlyArray<Receipt>;
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
export function fingerprint(text: string): string {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let h = 0x811c9dc5;
  for (let i = 0; i < norm.length; i += 1) { h ^= norm.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}
export function emptyCorrections(): CorrectionState { return { revision: 0, nodes: [], receipts: [], rejections: [] }; }
function ancestorNodes(s: CorrectionState, id: string): Node[] {
  const out = new Map<string, Node>();
  const walk = (pid: string): void => {
    const parent = out.has(pid) ? undefined : find(s, pid);
    if (!parent) return;
    out.set(pid, parent);
    parent.derivedFrom.forEach(walk);
  };
  (find(s, id)?.derivedFrom ?? []).forEach(walk);
  return [...out.values()];
}
export function effectiveStatus(s: CorrectionState, id: string): Effective | null {
  const node = find(s, id);
  if (!node) return null;
  if (node.status !== 'active') return node.status;
  return ancestorNodes(s, id).some((p) => p.status !== 'active' || p.changedAt > node.basedOn) ? 'stale' : 'active';
}
function lastChangeOf(s: CorrectionState, id: string): number {
  return Math.max(find(s, id)?.changedAt ?? 0, ...ancestorNodes(s, id).map((p) => p.changedAt));
}

const lineageOk = (s: CorrectionState): boolean => s.nodes.every((n) => n.derivedFrom.every((p) => find(s, p) !== null));
function gate(s: CorrectionState, ctx: Ctx, personOnly: boolean): Refusal | null {
  if (personOnly && ctx.actor !== 'user') return 'not-authorized';
  if (ctx.expectedRevision !== s.revision) return 'stale-revision';
  return lineageOk(s) ? null : 'corrupt-lineage';
}
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
function land(s: CorrectionState, ctx: Ctx, c: Change): Result {
  const next: CorrectionState = { revision: c.rev, nodes: c.nodes, receipts: s.receipts, rejections: c.rejections };
  const marked = deleteWithDerived(next.nodes, c.target).removed
    .filter((id) => id !== c.target && !c.changed.includes(id) && effectiveStatus(next, id) === 'stale');
  const canonical = s.nodes.filter((n) => n.kind === 'canonical-measurement').map((n) => n.id);
  const unchanged = [...new Set([...ancestorNodes(next, c.target).map((n) => n.id), ...canonical])].filter((id) => !c.changed.includes(id));
  const receipt: Receipt = { id: ctx.receiptId, action: c.action, target: c.target, at: ctx.now, changed: c.changed, marked, unchanged, scoreDelta: 0, causalClaim: false };
  return { ok: true, state: { ...next, receipts: [...s.receipts, receipt] }, receipt };
}
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
    kind: input.kind, locale, status: 'active', basedOn: rev, changedAt: rev, versions: appendVersion([], { version: String(rev), locale, text, private: true }),
  };
  return { ok: true, state: { ...s, revision: rev, nodes: [...s.nodes, node] }, receipt: null };
}

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
  const { locale, derivedFrom } = hit.node;
  const fresh: Node = {
    id: newId, text: clean, source: 'user-entry', derivedFrom, saved: true, kind: 'user-authorship', locale, status: 'active',
    basedOn: rev, changedAt: rev, versions: appendVersion([], { version: String(rev), locale, text: clean, private: true }),
  };
  return land(s, ctx, {
    rev, action: 'revise', target: id, changed: [id, newId],
    rejections: [...s.rejections, { nodeId: id, fingerprint: fingerprint(hit.node.text) }],
    nodes: [...patch(s, id, { status: 'rejected', changedAt: rev }), fresh],
  });
}

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

export function rebuildProjection(s: CorrectionState, id: string, text: string, derivedFrom: string[], ctx: Ctx): Result {
  const prior = replayed(s, ctx); if (prior) return prior;
  const g = gate(s, ctx, false); if (g) return fail(g);
  const hit = aim(s, id, PROJECTIONS, 'not-a-projection');
  if ('refusal' in hit) return fail(hit.refusal);
  const clean = text.trim();
  const refusal = wordingRefusal(s, hit.node.kind, clean) ?? parentRefusal(s, derivedFrom);
  if (refusal) return fail(refusal);
  const rev = s.revision + 1;
  const rebuilt = (n: Node): Node => ({
    ...n, text: clean, derivedFrom, basedOn: rev, changedAt: rev, versions: appendVersion(n.versions, { version: String(rev), locale: n.locale, text: clean, private: true }),
  });
  return land(s, ctx, { rev, action: 'rebuild', target: id, changed: [id], rejections: s.rejections, nodes: s.nodes.map((n) => (n.id === id ? rebuilt(n) : n)) });
}

/** Filters retrieval candidates: saved, active and current only; rejected or deleted wording never passes. */
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
