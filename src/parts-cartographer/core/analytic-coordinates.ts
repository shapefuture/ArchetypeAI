// Four analytical coordinates with explicit status (ArchetypeAI-28h.2.21). Pure.
// The fourth dimension is never dropped from any projection, and an unknown coordinate is never filled in.

export type Axis = 0 | 1 | 2 | 3;
export const AXES: ReadonlyArray<Axis> = [0, 1, 2, 3];
export type CoordinateStatus = 'measured' | 'derived' | 'reference' | 'unknown';

export interface Coordinate {
  axis: Axis;
  value: number | null;
  status: CoordinateStatus;
}

/** Builds exactly four coordinates. A missing or out-of-range value becomes unknown, never 0. */
export function coordinatesFromTuple(values: ReadonlyArray<unknown>, status: Exclude<CoordinateStatus, 'unknown'>): Coordinate[] {
  return AXES.map((axis) => {
    const raw = values[axis];
    const valid = typeof raw === 'number' && Number.isFinite(raw) && raw >= -1 && raw <= 1;
    return valid ? { axis, value: raw, status } : { axis, value: null, status: 'unknown' };
  });
}

const LABEL: Record<CoordinateStatus, string> = { measured: 'measured', derived: 'derived', reference: 'reference', unknown: 'unknown' };

function valueText(c: Coordinate): string {
  return c.value === null ? 'unknown' : c.value.toFixed(2);
}

export interface Projections {
  /** Numeric list: always four entries, unknown values as null. */
  numeric: Array<{ axis: Axis; value: number | null; status: CoordinateStatus }>;
  /** Table rows: always four rows, with the status column visible. */
  table: string[][];
  /** Static text: one line per axis, the same content as the table. */
  staticText: string;
}

/** Projects the same coordinates three ways. All three always contain the four axes, with their status. */
export function project(coords: ReadonlyArray<Coordinate>): Projections {
  const byAxis = AXES.map((axis) => coords.find((c) => c.axis === axis) ?? { axis, value: null, status: 'unknown' as const });
  const numeric = byAxis.map((c) => ({ axis: c.axis, value: c.value, status: c.status }));
  const table = byAxis.map((c) => [`Axis ${c.axis + 1}`, valueText(c), LABEL[c.status]]);
  const staticText = byAxis.map((c) => `Axis ${c.axis + 1}: ${valueText(c)} (${LABEL[c.status]})`).join('\n');
  return { numeric, table, staticText };
}

/** Parity check: the three projections agree on every axis, value and status. */
export function projectionsAgree(p: Projections): boolean {
  if (p.numeric.length !== 4 || p.table.length !== 4) return false;
  return p.numeric.every((n, i) => {
    const row = p.table[i];
    const line = p.staticText.split('\n')[i] ?? '';
    return row[0] === `Axis ${n.axis + 1}` && row[1] === (n.value === null ? 'unknown' : n.value.toFixed(2)) && row[2] === LABEL[n.status] && line.includes(row[1]);
  });
}
