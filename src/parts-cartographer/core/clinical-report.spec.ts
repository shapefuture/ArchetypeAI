import { describe, expect, it } from 'vitest';
import { scoreProfile, type AssessmentInput } from '../../shared/core/data/scoring-v2';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { buildClinicalMarkdown } from './clinical-report';

function input(shadowItem: number, resItem: number, validity = { attention: 3, infrequency: [1, 1] as [number, number] }): AssessmentInput {
  const shadow = Object.fromEntries(SHADOW_PARTS.map((p) => [p, [...Array(6).fill(shadowItem), 6 - shadowItem, 6 - shadowItem]])) as AssessmentInput['shadow'];
  const resources = Object.fromEntries(RESOURCES.map((r) => [r, Array(6).fill(resItem)])) as AssessmentInput['resources'];
  return { shadow, resources, self: Array(8).fill(3), validity };
}

describe('downloaded report', () => {
  const flagged = buildClinicalMarkdown(scoreProfile(input(3, 3, { attention: 1, infrequency: [5, 1] })), 'ru');

  it('prints whole numbers, never raw floating point', () => {
    expect(flagged).not.toMatch(/\d\.\d{3,}/);
  });

  it('prints Russian validity notes instead of internal flag ids', () => {
    const validity = flagged.split('## Достоверность')[1];
    expect(validity).not.toMatch(/attention|infrequency/);
    expect(validity).toContain('Ответ на проверку внимания отличается от заданного.');
  });

  it('says no need is unmet for a well-fed profile instead of naming joy', () => {
    const report = buildClinicalMarkdown(scoreProfile(input(1, 5)), 'ru');
    expect(report).not.toContain('Радость');
    expect(report).toContain('Сейчас все потребности, которые измеряет тест, выглядят удовлетворёнными.');
  });

  it('never leaves a section heading empty', () => {
    const sections = buildClinicalMarkdown(scoreProfile(input(1, 3)), 'ru').split(/\n(?=## )/).slice(1);
    for (const section of sections) expect(section.split('\n').slice(1).join('').trim(), section).not.toBe('');
  });
});
