import { describe, expect, it } from 'vitest';
import {
  ALL_ARCHETYPES,
  buildDynamicRelationalIds,
  buildPartRelations,
  type Archetype,
} from './universe-state.service';

describe('part relationships carry an explicit source and status', () => {
  it('labels curated guard pairs as authored templates, ahead of computed proximity', () => {
    const pleaser = ALL_ARCHETYPES.find((a) => a.id === 'pleaser')!;
    const relations = buildPartRelations(pleaser, ALL_ARCHETYPES, 4);

    expect(relations[0]).toEqual({ targetId: 'abandoned', source: 'curated-template', status: 'association' });
    expect(relations.every((relation) => relation.status === 'association')).toBe(true);
    expect(relations.map((relation) => relation.targetId)).toEqual(buildDynamicRelationalIds(pleaser, ALL_ARCHETYPES, 4));
  });

  it('labels coordinate-only neighbours as computed proximity rather than a template or verdict', () => {
    const source: Archetype = {
      id: 'studio_logic_guard',
      name: 'Logic Guard',
      coordinates: [0.7, -0.8, -0.1, -0.9],
      color: '#4A90E2',
      size: 0.8,
      symbol: '◎',
      cluster: 'managers',
      invitation: 'Soften',
      coreBelief: 'Closeness is dangerous',
      attracts: 'Warm witnesses',
    };
    const relations = buildPartRelations(source, ALL_ARCHETYPES, 4);

    expect(relations.length).toBeGreaterThan(0);
    expect(relations.every((relation) => relation.source === 'computed-proximity' && relation.status === 'association')).toBe(true);
  });
});
