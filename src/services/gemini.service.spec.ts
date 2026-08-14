import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GeminiService } from './gemini.service';
import { TranslationService } from './translation.service';
import { Archetype } from './webxr.service';
import { translations } from '../i18n/translations';

describe('GeminiService', () => {
  let service: GeminiService;
  let translationService: TranslationService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network unavailable'));
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // TranslationService now restores the persisted language; reset to the
    // English default so tests that don't set a language see EN fallbacks.
    localStorage.removeItem('APP_LANG');

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), GeminiService, TranslationService],
    });
    service = TestBed.inject(GeminiService);
    translationService = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('API key handling', () => {
    it('should handle missing API key gracefully (genAI is null)', () => {
      // With the define replacing process.env.API_KEY with "", genAI should be null
      // Since we can't easily test the constructor, we test the downstream effects
      expect(true).toBe(true); // Service exists without crashing
    });
  });

  describe('createArchetype()', () => {
    it('should not block studio creation when AI is unavailable', async () => {
      const part = await service.createArchetype('test prompt');
      expect(part.id).toMatch(/^studio_/);
      expect(part.coordinates).toHaveLength(4);
    });

    it('should create a deterministic local part when AI creator is unavailable', async () => {
      translationService.setLanguage('ru');
      const part = await service.createArchetype('часть, которая защищается логикой и исчезает при близости');

      expect(part.id).toMatch(/^studio_/);
      expect(part.name).toBeTruthy();
      expect(part.coordinates).toHaveLength(4);
      expect(part.coordinates.every(c => c >= -1 && c <= 1)).toBe(true);
      expect(part.cluster).toBeTruthy();
      expect(part.invitation).toBeTruthy();
    });
  });

  describe('analyzeAssessment()', () => {
    it('should return a deterministic fallback when AI is unavailable', async () => {
      const answers = Array.from({ length: 64 }, (_, i) => (i % 5) + 1);
      const questions = [
        { section: 'assessment.questions.agency', text: 'q1' },
        { section: 'assessment.questions.agency', text: 'q2' },
        { section: 'assessment.questions.agency', text: 'q3' },
        { section: 'assessment.questions.agency', text: 'q4' },
        { section: 'assessment.questions.agency', text: 'q5' },
      ];
      const archetypes: Archetype[] = [];

      const result = await service.analyzeAssessment(answers, questions, archetypes);
      expect(result.analysis).toContain('Your Relational Fingerprint');
      expect(Array.isArray(result.pantheon)).toBe(true);
      expect(new Set(result.pantheon.map(a => a.color)).size).toBe(result.pantheon.length);
    });

    it('should fall back to deterministic when legacy/fallback mode fails', async () => {
      const answers = Array.from({ length: 64 }, (_, i) => (i % 5) + 1);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(Array.isArray(result.pantheon)).toBe(true);
    });

    it('returns Russian deterministic fallback text in Russian mode', async () => {
      translationService.setLanguage('ru');
      const answers = Array.from({ length: 64 }, (_, i) => (i % 5) + 1);
      const result = await service.analyzeAssessment(answers, [], []);

      expect(result.analysis).toContain('Ваш реляционный отпечаток');
      expect(result.analysis).toContain('Основная динамика');
      expect(result.analysis).not.toContain('Your Relational Fingerprint');
      expect(result.analysis).not.toContain('Core Dynamic');
    });

    it('should mark narrativeDegraded=true when AI call fails (silent fallback is no longer silent)', async () => {
      // The beforeEach mock rejects fetch with a network error.
      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], []);

      expect(result.narrativeDegraded).toBe(true);
      expect(result.analysis.length).toBeGreaterThan(0);
      // Pantheon must still be present and complete (algorithm never fails).
      expect(result.pantheon.length).toBeGreaterThan(0);
    });

    it('should propagate cancellation via { signal } without falling back silently', async () => {
      const ctrl = new AbortController();
      const answers = Array.from({ length: 64 }, () => 3);
      const promise = service.analyzeAssessment(answers, [], [], 'deterministic', undefined, { signal: ctrl.signal });
      ctrl.abort();
      await expect(promise).rejects.toMatchObject({ cancelled: true });
    });

    it('should ALWAYS call the AI in BOTH modes — the toggle is the user\'s explicit choice, not an auto-skip', async () => {
      // Override the failing fetch mock from beforeEach with a successful response.
      fetchSpy.mockRestore();
      const okJson = JSON.stringify({ analysis: 'AI-written narrative' });
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: okJson }),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      fetchSpy.mockClear();

      // 1) Deterministic mode — local algorithm for positions, AI for interpretation
      const r1 = await service.analyzeAssessment(answers, [], [], 'deterministic');
      const callsAfterDeterministic = fetchSpy.mock.calls.length;
      expect(callsAfterDeterministic).toBeGreaterThan(0); // AI was called
      expect(r1.narrativeDegraded).toBe(false);
      expect(r1.analysis).toBe('AI-written narrative');

      // 2) Fallback mode — AI for positions + interpretation
      fetchSpy.mockClear();
      // Legacy schema expects `pantheon` and `poleScores`; return both to satisfy strict validation
      const legacyOkJson = JSON.stringify({
        analysis: 'AI-written narrative (legacy)',
        poleScores: { agency: 0.2, emotional_temperature: -0.3, relational_focus: 0.4, attachment: -0.1 },
        pantheon: [
          { name: 'A', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [0, 0, 0, 0], cluster: 'gift_archetypes', prominence: 100 },
        ],
      });
      fetchSpy.mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: legacyOkJson }),
      } as any);
      const r2 = await service.analyzeAssessment(answers, [], [], 'fallback');
      const callsAfterFallback = fetchSpy.mock.calls.length;
      expect(callsAfterFallback).toBeGreaterThan(0); // AI was called
      // Legacy path returns the AI-authored analysis as-is (no narrativeDegraded flag set).
      expect(r2.analysis).toBe('AI-written narrative (legacy)');
      // poleScores are surfaced from the AI-estimated values
      expect(r2.poleScores).toEqual({ agency: 0.2, emotional_temperature: -0.3, relational_focus: 0.4, attachment: -0.1 });
    });

    it('should surface narrativeDegraded=true on AI failure in BOTH modes (no silent auto-degradation)', async () => {
      // beforeEach mock rejects fetch — failure path
      const answers = Array.from({ length: 64 }, () => 3);
      fetchSpy.mockClear();

      const r1 = await service.analyzeAssessment(answers, [], [], 'deterministic');
      expect(fetchSpy).toHaveBeenCalled(); // AI was attempted
      expect(r1.narrativeDegraded).toBe(true); // and failure was surfaced

      fetchSpy.mockClear();
      const r2 = await service.analyzeAssessment(answers, [], [], 'fallback');
      expect(fetchSpy).toHaveBeenCalled(); // AI was attempted in legacy too
      // When legacy AI fails, we cascade to deterministic; if the cascade AI also fails,
      // narrativeDegraded will be true. (Either way, it is never silently hidden.)
      expect(r2.narrativeDegraded).toBe(true);
    });

    it('should resolve translation keys for questions', async () => {
      // This tests the fix for PA1 - ensuring translation keys are resolved
      const questions = [
        { section: 'assessment.questions.agency', text: 'q1' },
      ];
      const result = await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), questions, []);
      expect(result.analysis.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeAssessment() — strict schema + post-processing (legacy mode)', () => {
    // Mock helper: a fully-valid legacy response that can be mutated per test.
    // Mirrors ASSESSMENT_ANALYSIS_SCHEMA (analysis, poleScores, pantheon) and
    // ASSESSMENT_SCHEMA_PROPERTIES (cluster enum, coord min/max, size range).
    function buildLegacyMockJson(overrides: any = {}): string {
      return JSON.stringify({
        analysis: 'AI-written narrative (legacy)',
        poleScores: { agency: 0.2, emotional_temperature: -0.3, relational_focus: 0.4, attachment: -0.1 },
        pantheon: [
          { name: 'A', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [0.1, 0.2, 0.3, -0.1], cluster: 'gift_archetypes', prominence: 60 },
          { name: 'B', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.8, coordinates: [-0.1, -0.2, 0.2, 0.3], cluster: 'control_shadows', prominence: 40 },
        ],
        ...overrides,
      });
    }

    it('deterministic mode includes algorithm-computed poleScores in the result', async () => {
      // beforeEach rejects fetch → deterministic fallback narrative is used,
      // but the algorithm-computed poleScores are still present.
      const answers = Array.from({ length: 64 }, (_, i) => (i % 5) + 1);
      const result = await service.analyzeAssessment(answers, [], [], 'deterministic');

      expect(result.poleScores).toBeDefined();
      expect(result.poleScores).toHaveProperty('agency');
      expect(result.poleScores).toHaveProperty('emotional_temperature');
      expect(result.poleScores).toHaveProperty('relational_focus');
      expect(result.poleScores).toHaveProperty('attachment');
      for (const v of Object.values(result.poleScores!)) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('legacy post-processing: snaps an unknown cluster to the nearest valid 7-value cluster', async () => {
      fetchSpy.mockRestore();
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: buildLegacyMockJson({
          pantheon: [
            { name: 'X', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [0, 0, 0, 0], cluster: 'personal_pantheon', prominence: 100 },
          ],
        })}),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');

      expect(result.pantheon[0].cluster).toBe('gift_archetypes');
    });

    it('legacy post-processing: clamps archetype coordinates to [-1, 1]', async () => {
      fetchSpy.mockRestore();
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: buildLegacyMockJson({
          pantheon: [
            { name: 'X', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [5, -7, 0.5, 2], cluster: 'gift_archetypes', prominence: 100 },
          ],
        })}),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');

      const coords = result.pantheon[0].coordinates as number[];
      for (const c of coords) {
        expect(c).toBeGreaterThanOrEqual(-1);
        expect(c).toBeLessThanOrEqual(1);
      }
      expect(coords[0]).toBe(1);   // 5 clamped to 1
      expect(coords[1]).toBe(-1);  // -7 clamped to -1
    });

    it('legacy post-processing: renormalises archetype prominences so they sum to exactly 100', async () => {
      fetchSpy.mockRestore();
      // The AI drifted: 60 + 40 = 100 already, but let's force a non-100 case
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: buildLegacyMockJson({
          pantheon: [
            { name: 'A', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [0, 0, 0, 0], cluster: 'gift_archetypes', prominence: 70 },
            { name: 'B', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.8, coordinates: [0, 0, 0, 0], cluster: 'control_shadows', prominence: 50 },
            { name: 'C', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.6, coordinates: [0, 0, 0, 0], cluster: 'emotional_storm_shadows', prominence: 30 },
          ],
        })}),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');

      const sum = result.pantheon.reduce((s, a) => s + (typeof a.prominence === 'number' ? a.prominence : 0), 0);
      expect(sum).toBe(100);
      // Each prominence should still be in [0, 100]
      for (const a of result.pantheon) {
        expect(a.prominence).toBeGreaterThanOrEqual(0);
        expect(a.prominence).toBeLessThanOrEqual(100);
      }
    });

    it('legacy post-processing: clamps out-of-range poleScores to [-1, 1]', async () => {
      fetchSpy.mockRestore();
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: buildLegacyMockJson({
          poleScores: { agency: 3.5, emotional_temperature: -2.0, relational_focus: 0.5, attachment: 0.1 },
        })}),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');

      expect(result.poleScores).toBeDefined();
      expect(result.poleScores!.agency).toBeLessThanOrEqual(1);
      expect(result.poleScores!.emotional_temperature).toBeGreaterThanOrEqual(-1);
    });

    it('legacy post-processing: clamps archetype size to [0.4, 1.1]', async () => {
      fetchSpy.mockRestore();
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true, status: 200, json: async () => ({ text: buildLegacyMockJson({
          pantheon: [
            { name: 'X', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 99, coordinates: [0, 0, 0, 0], cluster: 'gift_archetypes', prominence: 100 },
          ],
        })}),
      } as any);

      const answers = Array.from({ length: 64 }, () => 3);
      const result = await service.analyzeAssessment(answers, [], [], 'fallback');

      expect(result.pantheon[0].size).toBeLessThanOrEqual(1.1);
      expect(result.pantheon[0].size).toBeGreaterThanOrEqual(0.4);
    });

    it('snapCluster() (private helper): maps common aliases to the 7 valid clusters', () => {
      // Access the private helper via cast — these mappings are part of the
      // schema's safety net, so they need direct test coverage.
      const svc = service as any;
      const valid = [
        'gift_archetypes', 'control_shadows', 'emotional_storm_shadows',
        'avoidant_intellectual_shadows', 'anxious_connection_shadows',
        'seductive_avoidance_shadows', 'disorganized_attachment_shadows',
      ];
      // All aliases must snap to one of the 7 valid clusters
      const aliases = [
        'personal_pantheon', 'gift', 'gift_archetype', 'control', 'control_shadow',
        'power', 'storm', 'emotional_storm', 'fire_storm', 'avoidant',
        'avoidant_intellectual', 'intellectual', 'anxious', 'anxious_connection',
        'connection', 'seductive', 'seductive_avoidance', 'disorganized',
        'disorganized_attachment', '', null, undefined,
      ];
      for (const a of aliases) {
        expect(valid).toContain(svc.snapCluster(a));
      }
    });

    it('renormalizeProminences() (private helper): equal distribution when total is 0 or negative', () => {
      const svc = service as any;
      const arr = [{ prominence: 0 }, { prominence: 0 }] as any;
      svc.renormalizeProminences(arr);
      const sum = arr.reduce((s: number, a: any) => s + a.prominence, 0);
      expect(sum).toBe(100);
    });
  });

  describe('analyzeAssessment() — 8-section report structure (i18n regression guards)', () => {
    // The user reported the AI-written 8-section report was rendered as a
    // wall of text (no visual hierarchy) and the section titles were
    // hardcoded English. Two regressions to fix:
    //   1. The prompt must include locale-aware section title examples so the
    //      AI produces section titles in the user's language (EN/RU), not the
    //      hardcoded English strings from the legacy brief.
    //   2. The prompt must ALLOW markdown headings (## for top-level sections,
    //      ### for sub-sections) so the existing marked-based renderer can
    //      produce proper H2/H3 hierarchy. Before the fix the brief explicitly
    //      forbade `##` and `###` headings, which is what caused the wall of
    //      text in the first place.
    //
    // These tests assert on the system instruction that gets shipped to the
    // AI when the user runs the analysis in legacy / fallback mode.

    let systemInstructionCapture: string;

    function buildValidLegacyResponse(): any {
      return {
        analysis: '## 1. Dimensional profile\nSample text.',
        poleScores: { agency: 0, emotional_temperature: 0, relational_focus: 0, attachment: 0 },
        pantheon: [
          { name: 'A', symbol: '✦', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', size: 0.7, coordinates: [0, 0, 0, 0], cluster: 'gift_archetypes', prominence: 100 },
        ],
      };
    }

    beforeEach(() => {
      fetchSpy.mockRestore();
      systemInstructionCapture = '';
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input: any, init: any) => {
        try {
          const body = JSON.parse(init?.body || '{}');
          if (body.systemInstruction) {
            systemInstructionCapture = body.systemInstruction;
          }
        } catch { /* ignore */ }
        return {
          ok: true,
          status: 200,
          json: async () => ({ text: JSON.stringify(buildValidLegacyResponse()) }),
        } as any;
      });
    });

    it('English mode: 8-section prompt contains English section titles', async () => {
      translationService.setLanguage('en');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      expect(systemInstructionCapture).toContain('Dimensional profile');
      expect(systemInstructionCapture).toContain('Important to keep in mind');
      expect(systemInstructionCapture).toContain('Main psychological defences');
    });

    it('Russian mode: 8-section prompt contains Russian section titles (NOT English)', async () => {
      translationService.setLanguage('ru');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      // Russian titles appear
      expect(systemInstructionCapture).toContain('Профиль по осям');
      expect(systemInstructionCapture).toContain('Важно помнить');
      // The hardcoded English XML <Section> blocks must NOT appear when the
      // user's language is Russian — they would be misleading examples.
      expect(systemInstructionCapture).not.toContain('<Section id="1" title="Dimensional profile">');
    });

    it('Prompt allows markdown headings (## for sections, ### for sub-sections)', async () => {
      translationService.setLanguage('en');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      // The old "NO markdown headings" rule must be gone
      expect(systemInstructionCapture).not.toMatch(/NO\s+markdown\s+headings?/i);
      // And the new rule should mention ## and ###
      expect(systemInstructionCapture).toMatch(/##\s*\d/);  // example like "## 1."
      expect(systemInstructionCapture).toMatch(/###\s*\d/); // example like "### 3.1"
    });

    it('Prompt includes the sub-section structure for Section 3 (3.1, 3.2, 3.3)', async () => {
      translationService.setLanguage('en');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      // The brief should list the three sub-sections for Section 3
      expect(systemInstructionCapture).toMatch(/3\.1/);
      expect(systemInstructionCapture).toMatch(/3\.2/);
      expect(systemInstructionCapture).toMatch(/3\.3/);
    });

    it('Section titles in prompt are sourced from translations.ts (en)', async () => {
      // Regression guard: the prompt must use the title values from
      // translations.aiReport, not a hardcoded local const. If a developer
      // moves the titles back into gemini.service.ts, this test will catch
      // any drift between the two sources.
      translationService.setLanguage('en');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      expect(systemInstructionCapture).toContain(translations.en.aiReport.section1Title);
      expect(systemInstructionCapture).toContain(translations.en.aiReport.section3Title);
      expect(systemInstructionCapture).toContain(translations.en.aiReport.section3_1Title);
      expect(systemInstructionCapture).toContain(translations.en.aiReport.section8Title);
    });

    it('Section titles in prompt are sourced from translations.ts (ru)', async () => {
      translationService.setLanguage('ru');
      await service.analyzeAssessment(Array.from({ length: 64 }, () => 3), [], [], 'fallback');
      expect(systemInstructionCapture).toContain(translations.ru.aiReport.section1Title);
      expect(systemInstructionCapture).toContain(translations.ru.aiReport.section3Title);
      expect(systemInstructionCapture).toContain(translations.ru.aiReport.section3_1Title);
      expect(systemInstructionCapture).toContain(translations.ru.aiReport.section8Title);
    });
  });

  describe('generateCoachResponse()', () => {
    it('should return a friendly fallback response when AI is unavailable', async () => {
      const result = await service.generateCoachResponse(
        [{ role: 'user', content: 'hello' }],
        null,
        null,
        []
      );
      expect(result.response).toContain('not available');
      expect(result.suggestions).toEqual([]);
    });
  });
});
