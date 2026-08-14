import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard: when the user reloads mid-test, the assessment panel must
 * restore BOTH the answers AND the question they were on. Without persisting
 * the index, the panel's loadPersistedResponses() jumps to the first
 * unanswered question, which is a confusing UX (user was on Q12, reload,
 * lands on Q1).
 *
 * The fix: persist currentQuestionIndex in localStorage under a dedicated
 * key. On load, prefer the persisted index if present, fall back to the
 * firstUnanswered heuristic for backward compatibility.
 */

const ASSESSMENT_DIR = resolve(__dirname);
const componentTs = readFileSync(resolve(ASSESSMENT_DIR, 'assessment-panel.component.ts'), 'utf-8');

describe('AssessmentPanelComponent — currentQuestionIndex persistence (regression guard)', () => {
  describe('Index persistence key', () => {
    it('should define a separate localStorage key for the question index', () => {
      // The component already has LOCAL_STORAGE_KEY for responses. There must
      // be a separate constant for the index (e.g. INDEX_KEY).
      expect(componentTs).toMatch(/(?:const|let|var)\s+INDEX_KEY\s*=\s*['"][A-Z_]+['"]/);
    });
  });

  describe('Save side', () => {
    it('should write currentQuestionIndex to localStorage when the index changes', () => {
      // The component already saves responses in answerQuestion. There must be
      // equivalent persistence for the index — accept either a save inside
      // answerQuestion (after goToNextQuestion / goToPreviousQuestion) or a
      // separate method called from the navigation methods.
      // Look for: localStorage.setItem(INDEX_KEY, ...) somewhere in the .ts.
      expect(componentTs).toMatch(/localStorage\.setItem\(\s*INDEX_KEY\s*,/);
    });
  });

  describe('Load side', () => {
    it('should read currentQuestionIndex from localStorage in loadPersistedResponses', () => {
      // The load function must read INDEX_KEY. If present, use it; if absent,
      // fall back to the firstUnanswered heuristic.
      expect(componentTs).toMatch(/getItem\(\s*INDEX_KEY\s*\)/);
    });

    it('should clamp the persisted index to valid range [0, questions.length - 1]', () => {
      // A corrupted/stale localStorage value (e.g. index = 999) must not break
      // the panel. The load function must clamp the value to the valid range
      // before using it.
      expect(componentTs).toMatch(/Math\.(?:min|max)\s*\(/);
    });
  });
});
