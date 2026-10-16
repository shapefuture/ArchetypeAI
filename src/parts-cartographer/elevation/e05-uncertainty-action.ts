// E05 step 04 (ArchetypeAI-6s7) and step 07 recovery (ArchetypeAI-2hl): reviewed action eligibility across
// alternative explanations, and recovery for inconclusive, contradictory and unhelpful outcomes. Pure.
// Two or more plausible readings may share one modest, reversible, voluntary action. A recorded answer to a probe can
// lean a reading (open, leaning or rejected). No answer confirms a reading, a part or a cause. Canonical 64/147
// measurements are refused as a basis and are never read or written here.
// NOT done: the why-this-action wording and card UI (E05.05, step 05), wiring into coach, practice or storage
// (step 06), and evidence or acceptance review (steps 10-12).
import { allowedFormulation } from '../core/situation-inquiry';
import { decideSuggestion } from '../core/ai-suggestions';
import type { ExperimentCard } from '../core/experiment-outcome';

export type EvidenceKind = 'observation' | 'hypothesis' | 'user-authored' | 'canonical-measurement';
export type Actor = 'user' | 'model';
export type Standing = 'open' | 'leaning' | 'rejected';
export type ProbeOutcome = 'points-to' | 'no-difference' | 'inconclusive' | 'contradictory' | 'not-recorded';
export type Refusal = 'stale-revision' | 'not-authorized' | 'not-found' | 'unknown-probe' | 'invalid-pointer' | 'invalid-input';

export interface Reading { id: string; text: string; kind: 'hypothesis' | 'user-authored'; standing: Standing; sources: ReadonlyArray<EvidenceKind>; }
export interface Probe { id: string; text: string; distinguishes: ReadonlyArray<string>; }
export interface ActionOption {
  id: string;
  card: ExperimentCard;
  reversible: boolean;
  modest: boolean;
  /** Reading ids this action is useful under. */
  supports: ReadonlyArray<string>;
  sources: ReadonlyArray<EvidenceKind>;
  review: { schemaValid: boolean; evidence: { id: string; reviewedBy: 'app-review' | 'borrowed' } | null };
}
export interface ObservationRecord { id: string; probeId: string; kind: 'observation'; outcome: ProbeOutcome; pointsTo: string | null; note: string | null; }
export interface E05State {
  revision: number;
  readings: ReadonlyArray<Reading>;
  actions: ReadonlyArray<ActionOption>;
  probes: ReadonlyArray<Probe>;
  observations: ReadonlyArray<ObservationRecord>;
  unhelpful: ReadonlyArray<string>;
}
export interface Verdict { verdict: 'eligible' | 'needs-review' | 'refused'; reason: string; }
export interface Offer { status: 'no-readings' | 'offered' | 'nothing-eligible'; offered: ActionOption[]; withheld: Array<{ id: string; reason: string }>; }
export type Result = { ok: true; state: E05State } | { ok: false; reason: Refusal };
export interface ObservationInput { id: string; probeId: string; outcome: ProbeOutcome; pointsTo?: string; note?: string; }

const STANDINGS: ReadonlyArray<string> = ['open', 'leaning', 'rejected'];
const ok = (state: E05State): Result => ({ ok: true, state });
const fail = (reason: Refusal): Result => ({ ok: false, reason });
const isRec = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

export const emptyState = (): E05State => ({ revision: 0, readings: [], actions: [], probes: [], observations: [], unhelpful: [] });
const active = (s: E05State): Reading[] => s.readings.filter((r) => r.standing !== 'rejected');
const readingOf = (s: E05State, id: string): Reading | undefined => s.readings.find((r) => r.id === id);
const withStanding = (r: Reading, standing: Standing): Reading => ({ ...r, standing });
const guard = (s: E05State, actor: Actor, expectedRevision: number): Refusal | null =>
  actor !== 'user' ? 'not-authorized' : expectedRevision !== s.revision ? 'stale-revision' : null;

/** Eligibility of one action across the current readings. Absolute refusals come first; nothing throws. */
export function evaluateAction(s: E05State, a: ActionOption): Verdict {
  const refuse = (reason: string): Verdict => ({ verdict: 'refused', reason });
  if (s.unhelpful.includes(a.id)) return refuse('unhelpful');
  if (!a.card.action.trim()) return refuse('empty-wording');
  if (!allowedFormulation(`${a.card.action} ${a.card.prediction ?? ''}`)) return refuse('overclaim');
  if (!a.reversible) return refuse('not-reversible');
  if (!a.modest) return refuse('not-modest');
  const basedOnCanonical = a.sources.includes('canonical-measurement') || a.supports.some((id) => readingOf(s, id)?.sources.includes('canonical-measurement'));
  if (basedOnCanonical) return refuse('canonical-basis');
  if (!a.supports.every((id) => readingOf(s, id))) return refuse('unknown-reading');
  if (a.card.authoredBy === 'user') return { verdict: 'eligible', reason: 'user-choice' };
  const open = active(s);
  if (open.length === 0) return refuse('no-active-readings');
  if (!open.every((r) => a.supports.includes(r.id))) return refuse('not-robust');
  const decision = decideSuggestion({ id: a.id, type: 'practice-copy', text: a.card.action, schemaValid: a.review.schemaValid, evidence: a.review.evidence });
  if (decision === 'refused') return refuse('schema-refused');
  if (decision === 'needs-review') return { verdict: 'needs-review', reason: 'needs-review' };
  return { verdict: 'eligible', reason: 'shared-by-open-readings' };
}

/** What may be offered now. Quiet presentation shows at most one action. Nothing is offered without an open reading. */
export function offerActions(s: E05State, opts: { quiet: boolean }): Offer {
  if (active(s).length === 0) return { status: 'no-readings', offered: [], withheld: [] };
  const offered: ActionOption[] = [];
  const withheld: Offer['withheld'] = [];
  for (const a of s.actions) {
    const v = evaluateAction(s, a);
    if (v.verdict === 'eligible') offered.push(a); else withheld.push({ id: a.id, reason: v.reason });
  }
  const shown = opts.quiet ? offered.slice(0, 1) : offered;
  return { status: shown.length > 0 ? 'offered' : 'nothing-eligible', offered: shown, withheld };
}

/** Unanswered probes that can separate at least two open readings. */
export function eligibleProbes(s: E05State): Probe[] {
  const open = new Set(active(s).map((r) => r.id));
  const asked = new Set(s.observations.map((o) => o.probeId));
  return s.probes.filter((p) => !asked.has(p.id) && allowedFormulation(p.text) && p.distinguishes.filter((id) => open.has(id)).length >= 2);
}

/** The next probe to offer. Quiet presentation asks nothing. */
export function nextProbe(s: E05State, opts: { quiet: boolean }): Probe | null {
  return opts.quiet ? null : eligibleProbes(s)[0] ?? null;
}

/**
 * Records one answer to a probe. Only the person answers. "points-to" leans one open reading and returns any other
 * lean to open; "contradictory" clears a lean; no outcome ever confirms a reading. "not-recorded" stores no words.
 */
export function recordObservation(s: E05State, input: ObservationInput, actor: Actor, expectedRevision: number): Result {
  const refused = guard(s, actor, expectedRevision);
  if (refused) return fail(refused);
  const probe = s.probes.find((p) => p.id === input.probeId);
  if (!probe) return fail('unknown-probe');
  if (s.observations.some((o) => o.id === input.id)) return fail('invalid-input');
  const pointer = input.outcome === 'points-to' ? input.pointsTo ?? null : null;
  if (input.outcome === 'points-to' && (!pointer || !probe.distinguishes.includes(pointer) || !active(s).some((r) => r.id === pointer))) return fail('invalid-pointer');
  const readings = s.readings.map((r): Reading => {
    if (input.outcome === 'points-to') return r.id === pointer ? withStanding(r, 'leaning') : r.standing === 'leaning' ? withStanding(r, 'open') : r;
    if (input.outcome === 'contradictory' && r.standing === 'leaning') return withStanding(r, 'open');
    return r;
  });
  const record: ObservationRecord = {
    id: input.id, probeId: probe.id, kind: 'observation', outcome: input.outcome, pointsTo: pointer,
    note: input.outcome === 'not-recorded' ? null : input.note?.trim() || null,
  };
  return ok({ ...s, revision: s.revision + 1, readings, observations: [...s.observations, record] });
}

/** Only the person rejects a reading. A rejected reading is never offered as open. */
export function rejectReading(s: E05State, readingId: string, actor: Actor, expectedRevision: number): Result {
  const refused = guard(s, actor, expectedRevision);
  if (refused) return fail(refused);
  const r = readingOf(s, readingId);
  if (!r) return fail('not-found');
  if (r.standing === 'rejected') return fail('invalid-input');
  return ok({ ...s, revision: s.revision + 1, readings: s.readings.map((x) => (x.id === readingId ? withStanding(x, 'rejected') : x)) });
}

/** Only the person marks an action unhelpful. That withdraws this action alone, with no penalty. */
export function markUnhelpful(s: E05State, actionId: string, actor: Actor, expectedRevision: number): Result {
  const refused = guard(s, actor, expectedRevision);
  if (refused) return fail(refused);
  if (!s.actions.some((a) => a.id === actionId)) return fail('not-found');
  if (s.unhelpful.includes(actionId)) return ok(s);
  return ok({ ...s, revision: s.revision + 1, unhelpful: [...s.unhelpful, actionId] });
}

/** Loads stored state. Malformed input or two leaning readings returns null. Never throws. Validation is shallow. */
export function parseState(raw: unknown): E05State | null {
  if (!isRec(raw) || !Number.isInteger(raw.revision) || (raw.revision as number) < 0) return null;
  const lists = ['readings', 'actions', 'probes', 'observations', 'unhelpful'].map((k) => raw[k]);
  if (!lists.every((v) => Array.isArray(v))) return null;
  const readings = raw.readings as unknown[];
  const readingsOk = readings.every((r) => isRec(r) && typeof r.id === 'string' && typeof r.text === 'string' && STANDINGS.includes(r.standing));
  const leaning = readings.filter((r) => isRec(r) && r.standing === 'leaning').length;
  return readingsOk && leaning <= 1 ? (raw as unknown as E05State) : null;
}

export function loadOrEmpty(raw: unknown): E05State { return parseState(raw) ?? emptyState(); }

export const RECOVERY_CASES = ['inconclusive', 'contradictory', 'unhelpful-suggestion', 'interrupted-probe', 'storage-malformed', 'concurrent-write', 'model-authority', 'canonical-basis'] as const;
export type RecoveryCase = (typeof RECOVERY_CASES)[number];

/** Recovery matrix: what this module does and what the person may do next. Plain words; no streak, points or pressure. */
export const RECOVERY: Record<RecoveryCase, { handled: string; next: string }> = {
  'inconclusive': { handled: 'Readings keep their standing; the answer is stored with no causal claim.', next: 'Another untried probe may be offered; otherwise the inquiry rests.' },
  'contradictory': { handled: 'Any lean returns to open; nothing is confirmed.', next: 'The person may write another reading or stop.' },
  'unhelpful-suggestion': { handled: 'That one action is withdrawn; nothing else changes and no penalty is recorded.', next: 'Another eligible action may be offered, or none.' },
  'interrupted-probe': { handled: 'A refused or interrupted write changes nothing; the probe stays pending.', next: 'Resume the same probe where it was.' },
  'storage-malformed': { handled: 'parseState returns null and loadOrEmpty falls back to an empty state.', next: 'Start again from what the person chooses to keep.' },
  'concurrent-write': { handled: 'A write from an old revision is refused; the state is untouched.', next: 'Reload, then retry.' },
  'model-authority': { handled: 'The model may propose readings and actions; answers, rejections and unhelpful marks need the person.', next: 'The person decides.' },
  'canonical-basis': { handled: 'An action resting on a canonical measurement is refused.', next: 'Choose a reading or action grounded in the person\'s own observations.' },
};
