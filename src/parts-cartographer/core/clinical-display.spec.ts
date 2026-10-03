import { describe, expect, it } from 'vitest';
import { clinicalNeedName, clinicalPartName, clinicalPolarizationName } from './clinical-display';

describe('clinical-display', () => {
  it('localizes stable clinical part identifiers', () => {
    expect(clinicalPartName('inner_critic', 'ru')).toBe('Внутренний критик');
    expect(clinicalPartName('sage', 'en')).toBe('Sage');
  });

  it('switches polarization labels in either language direction', () => {
    expect(clinicalPolarizationName('Grind–Collapse Cycle', 'ru')).toBe('Цикл «измор — отключка»');
    expect(clinicalPolarizationName('Цикл «измор — отключка»', 'en')).toBe('Grind–Collapse Cycle');
  });

  it('resolves both canonical and localized need keys', () => {
    expect(clinicalNeedName('needSafety', 'ru')).toBe('Безопасность');
    expect(clinicalNeedName('joy', 'en')).toBe('Joy');
  });
});
