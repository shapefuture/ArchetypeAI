// Round 31 probe (critic), pure. The therapist metrics tab labels the mean self-energy with STRINGS.sw39
// (innerverse.jsx, the metrics list). CLAUDE.md fixes the Russian term as «Self-энергия», and the shared glossary
// (src/shared/i18n/strings.ts, selfLabel) and this file's own selfEnergy entry use it. The sw39 Russian value is
// "Self-энерджи", a transliteration that is not the glossary term.
// Control: the English label holds. Expected (probe assertion): the Russian label uses «Self-энергия».
import { describe, expect, it } from 'vitest';
import { STRINGS } from './strings';

describe('round31: the therapist metrics label uses the Russian glossary term', () => {
  it('control: the English label names the metric', () => {
    expect(STRINGS.sw39.en).toBe('Mean Self-energy');
  });

  it('the Russian label uses the glossary term «Self-энергия»', () => {
    expect(STRINGS.sw39.ru).toContain('Self-энергия');
  });
});
