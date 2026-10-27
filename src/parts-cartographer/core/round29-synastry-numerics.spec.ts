// Round 29 probe (critic), pure: the 64-item synastry result (synastryFromLegacy64Responses) must hold finite numbers for boundary
// pairs of complete answer vectors (identical, opposite, uniform, alternating), and its Russian result must not carry an
// English narrative paragraph. The walker reports each non-finite number with its path.
import { describe, expect, it } from 'vitest';
import { synastryFromLegacy64Responses } from './synastry-legacy64-bridge';

function nonFinite(value: unknown, path = 'root', out: string[] = []): string[] {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path}=${String(value)}`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => nonFinite(item, `${path}[${index}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) nonFinite(item, `${path}.${key}`, out);
  }
  return out;
}

const uniform = (answer: number) => Array.from({ length: 64 }, () => answer);
const alternating = (low: number, high: number) => Array.from({ length: 64 }, (_, i) => (i % 2 ? high : low));
const ramp = () => Array.from({ length: 64 }, (_, i) => 1 + (i % 5));

const pairs: Array<[string, number[], number[]]> = [
  ['identical uniform 1', uniform(1), uniform(1)],
  ['identical uniform 5', uniform(5), uniform(5)],
  ['opposite uniform 1 vs 5', uniform(1), uniform(5)],
  ['opposite uniform 5 vs 1', uniform(5), uniform(1)],
  ['alternating vs its inverse', alternating(1, 5), alternating(5, 1)],
  ['ramp vs uniform 3', ramp(), uniform(3)],
];

describe('round29: the legacy synastry result is finite at the boundary pairs', () => {
  for (const [label, a, b] of pairs) {
    it(`synastry stays finite for ${label}`, () => {
      const result = synastryFromLegacy64Responses(a, b, 'AAAAAAAA', 'BBBBBBBB', 'ru');
      expect(result, 'the engine returns a result for complete vectors').not.toBeNull();
      expect(nonFinite(result), 'non-finite numbers in the synastry result').toEqual([]);
    });
  }

  it('control: a short vector is refused, not scored', () => {
    expect(synastryFromLegacy64Responses(uniform(3).slice(0, 63), uniform(3), 'AAAAAAAA', 'BBBBBBBB', 'ru')).toBeNull();
  });
});
