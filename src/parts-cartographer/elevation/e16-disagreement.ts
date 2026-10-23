// E16 therapist analysis of disagreement: comparison derivations that keep unknown values unknown, keep each
// instrument record separate, and keep the full 3+1 analysis (ArchetypeAI-9ejq, step 04). The recovery cases of
// ArchetypeAI-8jty (step 07) are tested in the spec.
// Pure: no React, DOM, network, storage or clock reads. `now` is always injected.
// Reuses analytic-coordinates.ts (project, projectionsAgree, Coordinate) and therapist-access.ts (decideAccess).
// Rules: 64 and 147 stay separate records with their own version and coordinate status; a missing or unknown axis
// stays null, never zero; the fourth dimension is always shown as +1; a note keeps its author, provenance and the
// results it refers to; agreement means equality at two-decimal display precision.
// NOT done: the table and scene UI (step 05), wiring to the scene service or Firestore (step 06), note storage,
// rules and consent screens, the 64/147 scoring itself (not read or changed), evidence and acceptance (steps 10-12).
// No clinical, efficacy or validation claim is made.

import { AXES, project, projectionsAgree, type Axis, type Coordinate, type CoordinateStatus } from '../core/analytic-coordinates';
import { decideAccess, type AccessDecision, type Relationship } from '../core/therapist-access';

export type Instrument = '64' | '147';
export type Completeness = 'complete' | 'sparse' | 'empty';

/** One source record. `coordinates` may be sparse; the record is never merged with the other instrument. */
export interface ResultRecord {
  readonly recordId: string;
  readonly instrument: Instrument;
  readonly instrumentVersion: string;
  readonly context: string;
  readonly takenAt: string;
  readonly coordinates: ReadonlyArray<Coordinate>;
}

export interface RecordRef {
  readonly recordId: string;
  readonly instrument: Instrument;
  readonly instrumentVersion: string;
  readonly context: string;
  readonly takenAt: string;
  readonly provenance: 'canonical-measurement';
  readonly completeness: Completeness;
}

export type AxisRelation = 'equal' | 'different' | 'unknown';
export interface AxisComparison { readonly axis: Axis; readonly left: Coordinate; readonly right: Coordinate; readonly relation: AxisRelation; }
export interface ResultComparison {
  readonly left: RecordRef;
  readonly right: RecordRef;
  readonly comparability: 'same-instrument' | 'cross-instrument';
  readonly sameContext: boolean;
  readonly sameTime: boolean;
  /** Always four entries, in axis order. */
  readonly axes: ReadonlyArray<AxisComparison>;
  readonly unknownAxes: ReadonlyArray<Axis>;
}
export type CompareOutcome = { readonly ok: true; readonly comparison: ResultComparison } | { readonly ok: false; readonly reason: 'same-record' };

/** 4 known axes is complete, 0 is empty, anything between is sparse. Nothing is filled in. */
export function completenessOf(coords: ReadonlyArray<Coordinate>): Completeness {
  const known = project(coords).numeric.filter((c) => c.value !== null).length;
  return known === AXES.length ? 'complete' : known === 0 ? 'empty' : 'sparse';
}

const refOf = (r: ResultRecord): RecordRef => ({
  recordId: r.recordId, instrument: r.instrument, instrumentVersion: r.instrumentVersion, context: r.context,
  takenAt: r.takenAt, provenance: 'canonical-measurement', completeness: completenessOf(r.coordinates),
});

/** Compares two source records axis by axis. An unknown on either side stays unknown. */
export function compareResults(left: ResultRecord, right: ResultRecord): CompareOutcome {
  if (left.recordId === right.recordId) return { ok: false, reason: 'same-record' };
  const lv = project(left.coordinates).numeric;
  const rv = project(right.coordinates).numeric;
  const axes: AxisComparison[] = lv.map((a, i) => {
    const b = rv[i];
    const relation: AxisRelation = a.value === null || b.value === null
      ? 'unknown'
      : Math.round(a.value * 100) === Math.round(b.value * 100) ? 'equal' : 'different';
    return { axis: a.axis, left: a, right: b, relation };
  });
  return {
    ok: true,
    comparison: {
      left: refOf(left),
      right: refOf(right),
      comparability: left.instrument === right.instrument ? 'same-instrument' : 'cross-instrument',
      sameContext: left.context === right.context,
      sameTime: Date.parse(left.takenAt) === Date.parse(right.takenAt),
      axes,
      unknownAxes: axes.filter((x) => x.relation === 'unknown').map((x) => x.axis),
    },
  };
}

// ---------------------------------------------------------------------------
// 3+1 projection
// ---------------------------------------------------------------------------

export interface PlusRow {
  readonly role: 'dimension' | 'plus';
  readonly axis: Axis;
  /** Axis label, value and status, as the full-vector table shows them. */
  readonly cells: readonly [string, string, string];
  readonly value: number | null;
  readonly status: CoordinateStatus;
}

export interface ThreePlusOne {
  readonly dims: readonly [Axis, Axis, Axis];
  /** The remaining axis, explicitly identified as the fourth dimension. */
  readonly plus: Axis;
  /** Always four rows: three dimensions in chosen order, then the +1 row. */
  readonly rows: ReadonlyArray<PlusRow>;
  readonly matchesFullVector: boolean;
}

export type ThreePlusOneOutcome = { readonly ok: true; readonly projection: ThreePlusOne } | { readonly ok: false; readonly reason: 'duplicate-axis' | 'invalid-axis' };

/** Three chosen axes plus the remaining axis as +1. Always four rows; no axis is dropped. */
export function threePlusOne(coords: ReadonlyArray<Coordinate>, dims: readonly [Axis, Axis, Axis]): ThreePlusOneOutcome {
  if (!dims.every((d) => AXES.includes(d))) return { ok: false, reason: 'invalid-axis' };
  if (new Set(dims).size !== 3) return { ok: false, reason: 'duplicate-axis' };
  const plus = AXES.find((a) => !dims.includes(a));
  if (plus === undefined) return { ok: false, reason: 'duplicate-axis' };
  const full = project(coords);
  const rowFor = (axis: Axis, role: PlusRow['role']): PlusRow => {
    const n = full.numeric[axis];
    const [label, value, status] = full.table[axis];
    return { role, axis, cells: [label, value, status], value: n.value, status: n.status };
  };
  const rows = [...dims.map((d) => rowFor(d, 'dimension')), rowFor(plus, 'plus')];
  // Each row must equal the input coordinate for its axis, and the full table must agree with its own projections.
  const matchesFullVector = projectionsAgree(full) && AXES.every((axis) => {
    const src = coords.find((c) => c.axis === axis);
    const row = rows.find((x) => x.axis === axis);
    return row !== undefined && row.value === (src ? src.value : null) && row.status === (src ? src.status : 'unknown');
  });
  return { ok: true, projection: { dims, plus, rows, matchesFullVector } };
}

export interface RenderPlan { readonly mode: 'scene' | 'table'; readonly rows: ReadonlyArray<PlusRow>; readonly text: string; }

/** Renderer loss, or a projection that does not match the full vector, falls back to the table and text. The rows are the same either way. */
export function renderPlan(p: ThreePlusOne, rendererAvailable: boolean): RenderPlan {
  const text = p.rows
    .map((row) => `${row.role === 'plus' ? '+1' : 'dimension'} ${row.cells[0]}: ${row.cells[1]} (${row.cells[2]})`)
    .join('\n');
  return { mode: rendererAvailable && p.matchesFullVector ? 'scene' : 'table', rows: p.rows, text };
}

// ---------------------------------------------------------------------------
// Report grants and historical therapist notes
// ---------------------------------------------------------------------------

export interface ReportGrant { readonly expiresAt: string | null; }
export type ReadDecision = { readonly allowed: true } | { readonly allowed: false; readonly reason: Extract<AccessDecision, { allowed: false }>['reason'] | 'grant-expired' };

/** Link checks come from decideAccess. An expired report grant fails closed, and so does an unreadable expiry. */
export function therapistReadDecision(input: { readonly therapistUid: string; readonly relationship: Relationship | null; readonly grant: ReportGrant | null; readonly now: Date }): ReadDecision {
  const probe = decideAccess({ actorUid: input.therapistUid, actorRole: 'therapist', action: 'read-client-map', relationship: input.relationship });
  if (!probe.allowed) return probe;
  const expiresAt = input.grant?.expiresAt ?? null;
  if (expiresAt !== null && !(Date.parse(expiresAt) > input.now.getTime())) return { allowed: false, reason: 'grant-expired' };
  return { allowed: true };
}

export interface HistoricalNote {
  readonly noteId: string;
  readonly authorUid: string;
  readonly authorRole: 'therapist' | 'client';
  readonly provenance: 'observation' | 'hypothesis' | 'user-authored';
  readonly writtenAt: string;
  readonly refRecordIds: ReadonlyArray<string>;
  readonly recipientUids: ReadonlyArray<string>;
  readonly text: string;
}

export interface Viewer { readonly uid: string; readonly role: 'client' | 'therapist'; }

/**
 * Notes a viewer may see. Returns the same note objects, so author, time and referenced results are never rewritten.
 * A therapist reads with a live link and a valid report grant; a client always keeps their own notes, and sees
 * therapist notes only when addressed to them on a live link.
 */
export function visibleNotes(notes: ReadonlyArray<HistoricalNote>, viewer: Viewer, relationship: Relationship | null, grant: ReportGrant | null, now: Date): ReadonlyArray<HistoricalNote> {
  if (viewer.role === 'therapist') {
    if (!therapistReadDecision({ therapistUid: viewer.uid, relationship, grant, now }).allowed) return [];
    return notes.filter((n) => n.authorUid === viewer.uid || n.authorRole === 'client');
  }
  const link = decideAccess({ actorUid: viewer.uid, actorRole: 'client', action: 'read-report', relationship });
  return notes.filter((n) => n.authorUid === viewer.uid || (link.allowed && n.authorRole === 'therapist' && n.recipientUids.includes(viewer.uid)));
}
