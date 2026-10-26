// Round 24 probe (critic): the round-23 commit makes a family set the archetype cluster when a part is edited, retaken or
// restored. Parts already in the person's storage from before that fix keep the cluster of their old family: the round-23 test
// comment says the old Cabinet commit "keeps the cluster of the old family". On load, usableParts keeps every part that
// passes validMapParts, so such a part would still reach the Universe cluster filter under its old cluster.
import { describe, expect, it } from 'vitest';
import { usableParts } from './usable-parts';

const TRAITS = { shape: 'cloud', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', color: '#FF2D8A', characterSeed: 7 };

/** A part as the pre-fix Cabinet editor stored it: family moved to exile, archetype left as the manager's. */
const STORED_BEFORE_FIX = {
  id: 'taskmaster',
  name: 'Taskmaster',
  nameEn: 'Taskmaster',
  nameRu: 'Таскмастер',
  family: 'exile',
  traits: TRAITS,
  role: 'Keeps the day on schedule',
  blurb: '',
  energy: 50,
  burden: 'T 40',
  need: '',
  voice: '',
  star: false,
  since: 'from your map',
  archetype: {
    schema: 'archetype-map.v1',
    sourceAssessment: 'descent147',
    coordinateBasis: 'fixed-reference-147',
    coordinates: [0, 0, 0, 0],
    cluster: 'managers',
    prominence: 40,
    size: 0.75,
    description: '',
    invitation: '',
    shadow: '',
  },
};

describe('round24: a part stored before the family fix has its cluster and size follow its family when it is loaded', () => {
  it('control: a part stored after the fix (cluster and size of exile) loads unchanged', () => {
    const fixed = { ...STORED_BEFORE_FIX, archetype: { ...STORED_BEFORE_FIX.archetype, cluster: 'exiles', size: 0.6 } };
    const [loaded] = usableParts([fixed]);
    expect(loaded?.archetype?.cluster).toBe('exiles');
  });

  it('a stored exile whose archetype still names the manager cluster is loaded under the exile cluster', () => {
    const [loaded] = usableParts([STORED_BEFORE_FIX]);
    expect(loaded?.family).toBe('exile');
    expect(loaded?.archetype?.cluster, 'loaded taskmaster archetype.cluster').toBe('exiles');
  });

  it('a stored exile whose archetype still has the manager size is loaded at the exile size', () => {
    const [loaded] = usableParts([STORED_BEFORE_FIX]);
    expect(loaded?.archetype?.size, 'loaded taskmaster archetype.size').toBe(0.6);
  });
});
