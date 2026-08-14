import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslationService, Language } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), TranslationService] });
    service = TestBed.inject(TranslationService);
  });

  it('should default to English', () => {
    expect(service.getLanguage()).toBe('en');
  });

  it('should switch language', () => {
    service.setLanguage('ru');
    expect(service.getLanguage()).toBe('ru');
    service.setLanguage('en');
    expect(service.getLanguage()).toBe('en');
  });

  describe('t()', () => {
    it('should resolve a simple key without section', () => {
      const result = service.t('title', 'intro');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return the key when section not found', () => {
      const result = service.t('nonexistent', 'some.missing.path');
      expect(result).toBe('nonexistent');
    });

    it('should return the key when key not found in section', () => {
      const result = service.t('nonexistent_key', 'intro');
      expect(result).toBe('nonexistent_key');
    });

    it('should use fallback when provided', () => {
      const result = service.t('nonexistent_key', 'intro', 'fallback text');
      expect(result).toBe('fallback text');
    });

    it('should resolve nested section paths', () => {
      const result = service.t('q1', 'assessment.questions.agency');
      expect(result).toBeTruthy();
      expect(result).not.toBe('q1'); // should be actual text, not the key
    });

    it('should resolve dimension labels', () => {
      const result = service.t('agencyHypo', 'universe.dimensions');
      expect(result).toBeTruthy();
      expect(result).not.toBe('agencyHypo');
    });

    it('should return different translations for different languages', () => {
      const enResult = service.t('beginAssessment', 'intro');
      service.setLanguage('ru');
      const ruResult = service.t('beginAssessment', 'intro');
      expect(enResult).not.toBe(ruResult);
      service.setLanguage('en'); // reset
    });
  });

  describe('getArchetypeField()', () => {
    it('should return translated archetype name', () => {
      const result = service.getArchetypeField('the_sovereign', 'name', 'The Sovereign');
      expect(result).toBeTruthy();
    });

    it('should return fallback when no translation exists', () => {
      const result = service.getArchetypeField('nonexistent_archetype', 'name', 'Fallback Name');
      expect(result).toBe('Fallback Name');
    });

    it('should return empty string when no fallback provided', () => {
      const result = service.getArchetypeField('nonexistent_archetype', 'name');
      expect(result).toBe('');
    });
  });
});
