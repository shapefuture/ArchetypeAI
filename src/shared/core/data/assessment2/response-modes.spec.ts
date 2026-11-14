import { describe, expect, it } from 'vitest';
import { FAMILIES } from './taxonomy';
import { RESPONSE_MODE_COPY } from './content';
import { FAMILY_MODE, RESPONSE_MODES, integrationProfile, modesInUse } from './response-modes';
import type { MapPart } from './scoring';

const part = (over: Partial<MapPart>): MapPart => ({
  key: 'k', kind: 'protector', classKnown: true, rank: null, level: null, confidence: null, guards: [], costume: null,
  placement: 'default', coordinates: [0, 0, 0, 0], unmeasuredAxes: [], depthState: 'unanswered', blending: null, mapFamily: 'manager',
  ...over,
} as MapPart);

describe('response modes', () => {
  it('gives every family one mode, and every mode at least one family', () => {
    for (const family of FAMILIES) expect(RESPONSE_MODES).toContain(FAMILY_MODE[family]);
    for (const mode of RESPONSE_MODES) expect(FAMILIES.some((family) => FAMILY_MODE[family] === mode)).toBe(true);
  });

  it('has English and Russian names for every mode', () => {
    for (const mode of RESPONSE_MODES) {
      expect(RESPONSE_MODE_COPY[mode].en.length).toBeGreaterThan(0);
      expect(RESPONSE_MODE_COPY[mode].ru.length).toBeGreaterThan(0);
    }
  });

  it('lists used and unused modes in the fixed order, and ignores unknown families', () => {
    expect(modesInUse(['attack', 'appease', 'attack'])).toEqual({ used: ['take', 'give'], unused: ['receive', 'accept'] });
    expect(modesInUse(['nope' as never])).toEqual({ used: [], unused: [...RESPONSE_MODES] });
  });
});

describe('integration profile', () => {
  const result = {
    centre: { awareness: 4, will: null, qualities: [] },
    parts: [
      part({ family: 'attack', blending: 'itIsMe' }),
      part({ family: 'withdraw', blending: 'curious' }),
      part({ kind: 'exile', exile: 'ashamed', blending: 'neutral', mapFamily: 'exile' }),
      part({ kind: 'exile', exile: 'unseen', blending: null, mapFamily: 'exile' }),
      part({ kind: 'capacity', blending: 'afraid', mapFamily: 'resource' }),
    ],
  };

  it('keeps five capacities apart, with counts for regulation and no total', () => {
    const profile = integrationProfile(result);
    expect(profile).toEqual({
      awareness: 4,
      regulation: { withIt: 1, mixed: 1, runsMe: 1, unanswered: 1 },
      flexibility: { used: ['accept', 'take'], unused: ['receive', 'give'] },
      realityContact: null,
      accountability: null,
    });
    expect(Object.keys(profile)).not.toContain('total');
  });

  it('reads a missing or invalid Centre awareness as unanswered, never as zero', () => {
    expect(integrationProfile({ parts: [] }).awareness).toBeNull();
    expect(integrationProfile({ parts: [], centre: { awareness: 9, will: null, qualities: [] } }).awareness).toBeNull();
  });
});
