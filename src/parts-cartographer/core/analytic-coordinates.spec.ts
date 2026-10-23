import { describe, expect, it } from 'vitest';
import { coordinatesFromTuple, project, projectionsAgree } from './analytic-coordinates.ts';

describe('four analytical coordinates', () => {
  it('never fills a missing or out-of-range coordinate with zero', () => {
    const coords = coordinatesFromTuple([0.4, undefined, 3, -0.2], 'measured');
    expect(coords.map((c) => c.value)).toEqual([0.4, null, null, -0.2]);
    expect(coords.map((c) => c.status)).toEqual(['measured', 'unknown', 'unknown', 'measured']);
  });

  it('always carries four axes, even when the input is short', () => {
    expect(coordinatesFromTuple([], 'reference')).toHaveLength(4);
  });

  it('keeps the fourth dimension in every projection, with its status visible', () => {
    const coords = coordinatesFromTuple([0.1, 0.2, 0.3], 'derived');
    const p = project(coords);
    expect(p.numeric).toHaveLength(4);
    expect(p.table).toHaveLength(4);
    expect(p.table[3]).toEqual(['Axis 4', 'unknown', 'unknown']);
    expect(p.staticText).toContain('Axis 4: unknown (unknown)');
  });

  it('shows the same values and statuses across numeric, table and static projections', () => {
    const p = project(coordinatesFromTuple([0.5, -0.5, 0, 1], 'measured'));
    expect(projectionsAgree(p)).toBe(true);
    expect(p.staticText.split('\n')[2]).toBe('Axis 3: 0.00 (measured)');
  });
});
