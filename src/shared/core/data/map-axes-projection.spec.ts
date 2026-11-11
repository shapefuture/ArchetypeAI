import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAP_AXIS_KEYS, legacy64ToMapPlacement } from './map-axes';

/*
 * Pins the sign convention of the 64 projection to the 64 pole labels in
 * src/parts-cartographer/screens/legacy-report.jsx. The expectations are written from those labels.
 *
 * AXES (lines 56-61) names the left and right pole of each centre. POLES (lines 63-72) marks each right
 * pole 'positive' and each left pole 'negative', so a centre above 0 is its right pole and below 0 its left.
 *
 * The labels do not say "mobilised" or "toward people". Plan section 3.5 defines those ends of the axes.
 * Read against it, the labels give:
 *   energy +1 (mobilised):   Active (agency low), Expressive (temperature high)
 *   energy -1 (shut down):   Receptive (agency high), Composed (temperature low)
 *   direction +1 (toward):   Other-focused (focus high), Anxious (attachment high)
 *   direction -1 (away):     Self-focused (focus low), Avoidant (attachment low)
 */

const LEGACY_REPORT = resolve(__dirname, '../../../parts-cartographer/screens/legacy-report.jsx');

/** The text of one `const NAME = [ ... ];` array in the report source. */
function arrayBlock(source: string, name: string): string {
  const start = source.indexOf(`const ${name} = [`);
  expect(start, `const ${name} = [ in legacy-report.jsx`).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf('];', start));
}

describe('legacy-report.jsx pole labels that the 64 projection relies on', () => {
  it('still names these poles, with each right pole positive and each left pole negative', () => {
    const source = readFileSync(LEGACY_REPORT, 'utf8');
    const axes = [...arrayBlock(source, 'AXES').matchAll(/left: '([^']+)'.*?right: '([^']+)'/g)].map((m) => [m[1], m[2]]);
    const poles = [...arrayBlock(source, 'POLES').matchAll(/\['(\w+)', '\w+', '\w+', '(positive|negative)'\]/g)].map((m) => [m[1], m[2]]);
    expect(axes).toEqual([
      ['Active', 'Receptive'],
      ['Composed', 'Expressive'],
      ['Self-focused', 'Other-focused'],
      ['Avoidant', 'Anxious'],
    ]);
    expect(poles).toEqual([
      ['agencyActive', 'negative'], ['agencyReceptive', 'positive'],
      ['tempHot', 'positive'], ['tempCool', 'negative'],
      ['focusOther', 'positive'], ['focusSelf', 'negative'],
      ['attAnxious', 'positive'], ['attAvoidant', 'negative'],
    ]);
  });
});

describe('64 projection signs, written from the pole labels and plan section 3.5', () => {
  it('keeps energy in slot 0 and direction in slot 1', () => {
    expect(MAP_AXIS_KEYS.slice(0, 2)).toEqual(['ENERGY', 'DIRECTION']);
  });

  it('energy is positive when Active and Expressive are strong (agency low, temperature high)', () => {
    const [energy] = legacy64ToMapPlacement([-1, 1, 0, 0]).coordinates;
    expect(energy).toBeGreaterThan(0);
  });

  it('energy is negative when Receptive and Composed are strong (agency high, temperature low)', () => {
    const [energy] = legacy64ToMapPlacement([1, -1, 0, 0]).coordinates;
    expect(energy).toBeLessThan(0);
  });

  it('energy follows each pole alone: Active and Expressive raise it, Receptive and Composed lower it', () => {
    const energyOf = (agency: number, temperature: number) => legacy64ToMapPlacement([agency, temperature, 0, 0]).coordinates[0];
    expect(energyOf(-0.6, 0)).toBeCloseTo(0.3); // Active
    expect(energyOf(0, 0.6)).toBeCloseTo(0.3); // Expressive
    expect(energyOf(0.6, 0)).toBeCloseTo(-0.3); // Receptive
    expect(energyOf(0, -0.6)).toBeCloseTo(-0.3); // Composed
  });

  it('direction is positive when Other-focused and Anxious are strong (focus high, attachment high)', () => {
    const [, direction] = legacy64ToMapPlacement([0, 0, 1, 1]).coordinates;
    expect(direction).toBeGreaterThan(0);
  });

  it('direction is negative when Self-focused and Avoidant are strong (focus low, attachment low)', () => {
    const [, direction] = legacy64ToMapPlacement([0, 0, -1, -1]).coordinates;
    expect(direction).toBeLessThan(0);
  });

  it('direction follows each pole alone: Other-focused and Anxious raise it, Self-focused and Avoidant lower it', () => {
    const directionOf = (focus: number, attachment: number) => legacy64ToMapPlacement([0, 0, focus, attachment]).coordinates[1];
    expect(directionOf(0.4, 0)).toBeCloseTo(0.2); // Other-focused
    expect(directionOf(0, 0.4)).toBeCloseTo(0.2); // Anxious
    expect(directionOf(-0.4, 0)).toBeCloseTo(-0.2); // Self-focused
    expect(directionOf(0, -0.4)).toBeCloseTo(-0.2); // Avoidant
  });
});
