import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The coach-panel uses an inline `template:` string, so vitest does not resolve
 * the template at runtime. Following the same pattern as cabinet.component.spec.ts,
 * we read the .ts file from disk and assert on its contents. The hardcoded
 * English strings previously embedded in the template were:
 *
 *   - [name]="'Wisdom Sage'"          → t('characterName', 'coach')
 *   - <h2>AI Coach</h2>                → t('title', 'coach')
 *   - aria-label="Close coach panel"   → t('closeAria', 'coach')
 *   - "💭 Suggested questions:"        → t('suggestedQuestionsLabel', 'coach')
 *   - placeholder="Ask the wisdom..."  → t('inputPlaceholder', 'coach')
 *   - aria-label="Type your message..."→ t('inputAria', 'coach')
 *   - [ariaLabel]="'Send message'"     → t('sendAria', 'coach')
 */

const COACH_DIR = resolve(__dirname);
const componentTs = readFileSync(resolve(COACH_DIR, 'coach-panel.component.ts'), 'utf-8');
// Post-consolidation: the translations dict physically lives in strings.ts
// (translations.ts is a thin re-export adapter). Scope the read to the
// TRANSLATIONS export — earlier sections in strings.ts also contain `en:`/
// `ru:`/`coach:` blocks that would foil the lazy regexes below.
const stringsTs = readFileSync(resolve(COACH_DIR, '../../../shared/i18n/strings.ts'), 'utf-8');
const translationsTs = stringsTs.slice(stringsTs.indexOf('export const TRANSLATIONS'));

describe('CoachPanelComponent — i18n (no hardcoded English in template)', () => {
  describe('TranslationService wiring', () => {
    it('should import TranslationService', () => {
      expect(componentTs).toMatch(/import\s*\{\s*TranslationService\s*\}\s*from\s*['"][^'"]*translation\.service['"]/);
    });

    it('should inject TranslationService via inject() or constructor', () => {
      // The component should make the service available to its template.
      // Accept either pattern (inject() in a property, or constructor DI).
      expect(componentTs).toMatch(/inject\s*\(\s*TranslationService\s*\)|constructor\s*\([^)]*TranslationService/);
    });

    it('should expose a t() shortcut or use translationService.t() in the template', () => {
      // Either the component defines a `t(key, fallback)` method (cabinet pattern)
      // or the template calls translationService.t() directly (synastry pattern).
      const hasTMethod = /t\s*\(\s*key\s*:/.test(componentTs);
      const usesTInTemplate = /t\(\s*['"][a-zA-Z]+['"]\s*,/.test(componentTs);
      expect(hasTMethod || usesTInTemplate).toBe(true);
    });
  });

  describe('Hardcoded English strings must be removed from the inline template', () => {
    it('should NOT contain hardcoded "AI Coach" heading', () => {
      // The <h2> used to be `<h2 class="coach-panel__title-text">AI Coach</h2>`.
      // The visible text must now come from translations.coach.title.
      expect(componentTs).not.toMatch(/>\s*AI\s+Coach\s*</);
    });

    it('should NOT contain hardcoded "Wisdom Sage" name', () => {
      // The [name] input used to be `[name]="'Wisdom Sage'"`. It must now
      // come from translations.coach.characterName.
      expect(componentTs).not.toMatch(/['"]Wisdom\s+Sage['"]/);
    });

    it('should NOT contain hardcoded "Suggested questions:" label', () => {
      // The label used to be `<div class="...label">💭 Suggested questions:</div>`.
      expect(componentTs).not.toMatch(/Suggested\s+questions\s*:/);
    });

    it('should NOT contain hardcoded English ARIA labels', () => {
      // ARIA labels must come from translations.coach.*Aria keys.
      expect(componentTs).not.toMatch(/Close\s+coach\s+panel/);
      expect(componentTs).not.toMatch(/Type\s+your\s+message\s+to\s+the\s+coach/);
      expect(componentTs).not.toMatch(/['"]Send\s+message['"]/);
    });

    it('should NOT contain the hardcoded input placeholder', () => {
      // The textarea used to have `placeholder="Ask the wisdom sage..."`.
      expect(componentTs).not.toMatch(/Ask\s+the\s+wisdom\s+sage/);
    });
  });

  describe('Translations file has the coach section in both languages', () => {
    it('English: should define translations.en.coach with all 7 keys', () => {
      const enSection = translationsTs.match(/en:\s*\{[\s\S]*?coach:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(aiReport|coach):/) ||
                        translationsTs.match(/en:\s*\{[\s\S]*?coach:\s*\{([\s\S]*?)\n\s+\}\s*\n\s+\},\s*\n\s+ru:/);
      expect(enSection).not.toBeNull();
      const enKeys = enSection![1];
      expect(enKeys).toContain('characterName');
      expect(enKeys).toContain('title');
      expect(enKeys).toContain('closeAria');
      expect(enKeys).toContain('suggestedQuestionsLabel');
      expect(enKeys).toContain('inputPlaceholder');
      expect(enKeys).toContain('inputAria');
      expect(enKeys).toContain('sendAria');
    });

    it('Russian: should define translations.ru.coach with all 7 keys', () => {
      // Russian section is at the end of translations.ts (after the en block).
      // Just match the second `coach:` definition (the ru one).
      const matches = [...translationsTs.matchAll(/coach:\s*\{([\s\S]*?)\n\s+\}/g)];
      expect(matches.length).toBeGreaterThanOrEqual(2);
      const ruSection = matches[matches.length - 1][1];
      expect(ruSection).toContain('characterName');
      expect(ruSection).toContain('title');
      expect(ruSection).toContain('closeAria');
      expect(ruSection).toContain('suggestedQuestionsLabel');
      expect(ruSection).toContain('inputPlaceholder');
      expect(ruSection).toContain('inputAria');
      expect(ruSection).toContain('sendAria');
      // Russian should have non-empty Russian strings (no English in Russian block)
      expect(ruSection).not.toMatch(/['"]Wisdom\s+Sage['"]/);
      expect(ruSection).not.toMatch(/['"]AI\s+Coach['"]/);
    });
  });
});
