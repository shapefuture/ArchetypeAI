import { describe, expect, it } from 'vitest';
import { snapshot } from './cloud-storage';

describe('cloud copies keep the unknown-axis state', () => {
  it('keeps the axis version, the unknown-axis list and the depth marker', () => {
    const part = {
      id: 'parts2_member_rebel', name: 'Rebel', family: 'firefighter',
      traits: { shape: 'bean', color: '#ffffff', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false, characterSeed: 1 },
      role: 'r', blurb: 'b', energy: 50, burden: '', need: '', voice: '', star: false, since: 's',
      archetype: { schema: 'archetype-map.v1', sourceAssessment: 'parts-2', coordinateBasis: 'self-placed-2', coordinates: [0.2, 0.5, 0.3, -0.6], cluster: 'parts_two_member', prominence: 50, size: 0.8, axisVersion: 2, depthRecord: 2, unmeasuredAxes: ['DEPTH'] },
    };
    const copy = snapshot({}, [part], '2026-11-10T00:00:00Z');
    expect(copy.parts[0].archetype).toMatchObject({ axisVersion: 2, depthRecord: 2, unmeasuredAxes: ['DEPTH'] });
  });
});
