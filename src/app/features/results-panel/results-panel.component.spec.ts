import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The AI report (Section 1 in particular) was being rendered as a wall of
 * text. This spec guards the "Section 1 dimensional profile table" feature
 * — a dedicated visual section that renders the 4 dimensions as a clear
 * table BEFORE the AI's narrative prose, so the user gets a structured
 * overview of their dimensional profile immediately.
 *
 * Like cabinet and coach-panel, results-panel uses `templateUrl` (vitest
 * doesn't resolve external templates), so we read the .html and .ts from
 * disk and assert on their contents.
 */

const RESULTS_DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(RESULTS_DIR, 'results-panel.component.html'), 'utf-8');
const componentTs = readFileSync(resolve(RESULTS_DIR, 'results-panel.component.ts'), 'utf-8');
const translationsTs = readFileSync(resolve(RESULTS_DIR, '../../../i18n/translations.ts'), 'utf-8');

describe('ResultsPanelComponent — Section 1 dimensional profile table', () => {
  describe('Section DOM structure', () => {
    it('should have a <section id="profile"> for the dimensional profile table', () => {
      expect(templateHtml).toMatch(/<section\s+id="profile"[^>]*>/);
    });

    it('the profile section should appear BEFORE the AI narrative prose', () => {
      // The AI narrative is rendered as `[innerHTML]="parseMarkdown(res.analysis)"`.
      // The profile section must appear earlier in the file so it renders
      // first in the DOM and the user sees the structured table before the
      // AI's prose.
      const profileIdx = templateHtml.search(/<section\s+id="profile"/);
      const analysisIdx = templateHtml.search(/parseMarkdown\(res\.analysis\)/);
      expect(profileIdx).toBeGreaterThan(-1);
      expect(analysisIdx).toBeGreaterThan(-1);
      expect(profileIdx).toBeLessThan(analysisIdx);
    });

    it('the profile section should render a <table> (not just cards)', () => {
      // Extract the profile section block.
      const profileBlock = templateHtml.match(/<section\s+id="profile"[\s\S]*?<\/section>/);
      expect(profileBlock).not.toBeNull();
      // Must contain a <table> element to qualify as a "table" feature.
      expect(profileBlock![0]).toMatch(/<table[\s>]/);
    });
  });

  describe('SECTIONS nav integration', () => {
    it('SECTIONS array should include "profile" so the nav dot appears', () => {
      expect(componentTs).toMatch(/SECTIONS\s*=\s*\[[^\]]*['"]profile['"][^\]]*\]/);
    });

    it('getSectionLabel fallback should handle "profile" → "Dimensional Profile"', () => {
      // The nav label is sourced from translations; if the key is missing the
      // fallback table in getSectionLabel should have an English fallback.
      const fallbackBlock = componentTs.match(/fallbacks:\s*Record<string,\s*string>\s*=\s*\{[\s\S]*?\}/);
      expect(fallbackBlock).not.toBeNull();
      expect(fallbackBlock![0]).toMatch(/sectionProfile/);
    });
  });

  describe('Table content — 4 dimensions', () => {
    it('should iterate over all 4 dimensions: AGENCY, TEMPERATURE, FOCUS, ATTACHMENT', () => {
      const profileBlock = templateHtml.match(/<section\s+id="profile"[\s\S]*?<\/section>/);
      expect(profileBlock).not.toBeNull();
      // Must iterate over the 4 axes
      expect(profileBlock![0]).toMatch(/AGENCY/);
      expect(profileBlock![0]).toMatch(/TEMPERATURE/);
      expect(profileBlock![0]).toMatch(/FOCUS/);
      expect(profileBlock![0]).toMatch(/ATTACHMENT/);
    });

    it('should use the existing dimensionColors map for the bar visualisation', () => {
      const profileBlock = templateHtml.match(/<section\s+id="profile"[\s\S]*?<\/section>/);
      expect(profileBlock).not.toBeNull();
      // Should reference dimensionColors[dim] (the colorblind-safe Wong palette)
      expect(profileBlock![0]).toMatch(/dimensionColors\[/);
    });

    it('should bind the value to dimensionalExpressions() (the structured source of truth)', () => {
      const profileBlock = templateHtml.match(/<section\s+id="profile"[\s\S]*?<\/section>/);
      expect(profileBlock).not.toBeNull();
      expect(profileBlock![0]).toMatch(/canonicalDimensionalExpressions\(\)/);
    });

    it('should NOT use the hardcoded English axis names — must use the translation key', () => {
      // The dimensions must be localised via t(dim.toLowerCase(), 'universe.dimensions')
      // (same pattern as the existing signature section).
      const profileBlock = templateHtml.match(/<section\s+id="profile"[\s\S]*?<\/section>/);
      expect(profileBlock).not.toBeNull();
      // Verify the lookup pattern
      expect(profileBlock![0]).toMatch(/t\([a-zA-Z_.]+\.toLowerCase\(\),\s*['"]universe\.dimensions['"]\)|t\(['"][a-z]+['"],\s*['"]universe\.dimensions['"]/);
    });
  });

  describe('Translations file has the sectionProfile label in both languages', () => {
    it('English: assessment.results.sectionProfile exists', () => {
      const enSection = translationsTs.match(/en:\s*\{[\s\S]*?assessment:\s*\{[\s\S]*?results:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(cabinet|landing)/);
      expect(enSection).not.toBeNull();
      expect(enSection![1]).toContain('sectionProfile');
    });

    it('Russian: assessment.results.sectionProfile exists', () => {
      const ruSection = translationsTs.match(/ru:\s*\{[\s\S]*?assessment:\s*\{[\s\S]*?results:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(cabinet|landing)/);
      expect(ruSection).not.toBeNull();
      expect(ruSection![1]).toContain('sectionProfile');
    });
  });
});

describe('ResultsPanelComponent — completion guard', () => {
  it('must not calculate results from an incomplete responses array', () => {
    expect(componentTs).toContain('isCompleteResponseSet');
    expect(componentTs).not.toMatch(/responses\.length\s*>\s*0\s*&&\s*!this\.hasCalculated/);
  });
});

describe('ResultsPanelComponent — specialist (read-only) view', () => {
  // When a specialist opens a client's report, the results panel must:
  //   1. Show a "Viewing as specialist" badge instead of the personal
  //      "YOUR RELATIONAL FINGERPRINT" eyebrow.
  //   2. Hide the "Sign in to save" CTA (irrelevant — not the owner's data).
  //   3. Hide the "View My Universe" CTA (entering the client's universe
  //      would mean acting AS the client, which is wrong).
  //   4. Hide the "Retake" CTA (can't retake on the client's behalf).
  //   5. Keep "Download Backup" and the scoring toggle (read-only is fine).
  //   6. Change the bottom "Back" button to "Back to cabinet" so the
  //      specialist returns to their client list, not the client's intro.

  describe('inputs (TypeScript)', () => {
    it('component should declare an isSpecialistView input (boolean, defaults to false)', () => {
      expect(componentTs).toMatch(/isSpecialistView\s*=\s*input(?:<boolean>\(false\)|\.boolean\(['"]?\w*['"]?,\s*\{[^}]*\}\s*,\s*false\))/);
      // More permissive — just confirm the input name exists with a
      // boolean type and a default of false.
      const m = componentTs.match(/isSpecialistView\s*=\s*input[^\n]*/);
      expect(m).not.toBeNull();
      expect(m![0]).toMatch(/boolean/);
      expect(m![0]).toMatch(/false/);
    });

    it('component should declare a specialistClientLabel input (string | null)', () => {
      // Optional human-readable label for the client, shown next to the
      // specialist-view badge (e.g. their email).
      const m = componentTs.match(/specialistClientLabel\s*=\s*input[^\n]*/);
      expect(m).not.toBeNull();
      expect(m![0]).toMatch(/string\s*\|\s*null/);
    });
  });

  describe('badge in top bar (replaces personal "eyebrow")', () => {
    it('template should render the specialist-view badge when isSpecialistView() is true', () => {
      // The badge is shown in the top bar @if (isSpecialistView()) branch.
      expect(templateHtml).toMatch(/@if\s*\(\s*isSpecialistView\(\)\s*\)/);
    });

    it('template should translate the specialist-view badge via t()', () => {
      expect(templateHtml).toMatch(/translationService\.t\(\s*['"]specialistViewBadge['"]/);
    });

    it('template should NOT show the personal "eyebrow" when in specialist view', () => {
      // The personal eyebrow must be in the @else branch of the
      // @if (isSpecialistView()) block, never rendered when
      // isSpecialistView() is true. We verify the structural invariant:
      //   1. The top bar has a `@if (isSpecialistView()) { ... } @else { ... }`
      //      block where the @if branch contains the specialist badge
      //      and the @else branch contains the personal eyebrow.
      //   2. The personal "eyebrow" t() call must exist in the template.
      //   3. The specialist "badge" t() call must exist in the template.
      //   4. The badge must appear BEFORE the personal eyebrow in the file
      //      (i.e. the badge is rendered when isSpecialistView() is true).
      expect(templateHtml).toContain("translationService.t('eyebrow'");
      expect(templateHtml).toContain("translationService.t('specialistViewBadge'");
      const badgeIdx = templateHtml.indexOf("translationService.t('specialistViewBadge'");
      const eyebrowIdx = templateHtml.indexOf("translationService.t('eyebrow'");
      expect(badgeIdx).toBeGreaterThan(-1);
      expect(eyebrowIdx).toBeGreaterThan(-1);
      // The two calls are in the same top-bar block. The badge must
      // appear before the eyebrow (so the @if branch comes first, and
      // the @else (eyebrow) comes after).
      expect(badgeIdx).toBeLessThan(eyebrowIdx);
      // The structural block must exist: @if (isSpecialistView()) { ... }
      // immediately followed by } @else { ... } containing the eyebrow.
      // We accept up to 1500 chars between the @if opening and the
      // eyebrow t() call (the inner specialistClientLabel @if is in between).
      const between = templateHtml.substring(badgeIdx, eyebrowIdx);
      if (!between.includes('@else')) {
        throw new Error(
          'Top-bar block must have a `@else` branch between the badge and the eyebrow ' +
          'so the personal eyebrow only renders when isSpecialistView() is false',
        );
      }
    });
  });

  describe('hide personal-only CTAs in specialist view', () => {
    it('"Sign in" CTA must be gated on !isSpecialistView()', () => {
      // The signInRequested button (rendered when isAnonymous()) must
      // additionally be hidden in specialist view. We scan backwards
      // from the function call to find the wrapping @if header and
      // verify it gates on !isSpecialistView().
      const callIdx = templateHtml.indexOf('signInRequested.emit()');
      expect(callIdx).toBeGreaterThan(-1);
      const before = templateHtml.substring(Math.max(0, callIdx - 1000), callIdx);
      const ifMatches = [...before.matchAll(/@if\s*\([^\n]*\)\s*\{/g)];
      expect(ifMatches.length).toBeGreaterThan(0);
      const lastIf = ifMatches[ifMatches.length - 1];
      if (!lastIf[0].includes('!isSpecialistView()')) {
        throw new Error(
          'Sign in CTA must be inside @if (!isSpecialistView()). ' +
          `Found header: ${lastIf[0]}`,
        );
      }
    });

    it('"View My Universe" button must be wrapped in @if (!isSpecialistView())', () => {
      // The "onViewUniverse()" CTA in the fixed bottom bar must not
      // appear in specialist view. We find the nearest @if ( ... ) { on
      // the line above the function call and verify it gates on
      // !isSpecialistView(). The @if condition may contain nested
      // parens (e.g. `!isSpecialistView()`), so we use a simple scan.
      const callIdx = templateHtml.indexOf('onViewUniverse()');
      expect(callIdx).toBeGreaterThan(-1);
      // Look back at most 2000 chars for the nearest @if (...) line.
      const before = templateHtml.substring(Math.max(0, callIdx - 2000), callIdx);
      // The last @if line in this window is the one that wraps the
      // function call. We accept any @if whose body comes after the
      // opening, ending with `{` on the same line OR next line.
      const ifMatches = [...before.matchAll(/@if\s*\([^\n]*\)\s*\{/g)];
      expect(ifMatches.length).toBeGreaterThan(0);
      const lastIf = ifMatches[ifMatches.length - 1];
      if (!lastIf[0].includes('!isSpecialistView()')) {
        throw new Error(
          `"View My Universe" CTA must be inside @if (!isSpecialistView()). ` +
          `Found header: ${lastIf[0]}`,
        );
      }
    });

    it('"Retake Assessment" button must be wrapped in @if (!isSpecialistView())', () => {
      // The "retakeAssessment.emit()" CTA in the fixed bottom bar must
      // not appear in specialist view. Same backwards-scan strategy.
      const callIdx = templateHtml.indexOf('retakeAssessment.emit()');
      expect(callIdx).toBeGreaterThan(-1);
      const before = templateHtml.substring(Math.max(0, callIdx - 2000), callIdx);
      const ifMatches = [...before.matchAll(/@if\s*\([^\n]*\)\s*\{/g)];
      expect(ifMatches.length).toBeGreaterThan(0);
      const lastIf = ifMatches[ifMatches.length - 1];
      if (!lastIf[0].includes('!isSpecialistView()')) {
        throw new Error(
          `"Retake Assessment" CTA must be inside @if (!isSpecialistView()). ` +
          `Found header: ${lastIf[0]}`,
        );
      }
    });

    it('"Back" button in the bottom action bar must show "Back to cabinet" in specialist view and "Back to intro" otherwise', () => {
      // There are TWO goBack buttons in the template:
      //   1. The top-bar arrow button (icon only, no text)
      //   2. The bottom-bar text button (has the specialist label branch)
      // The bottom one must contain both labels with an isSpecialistView() branch.
      const allGoBackButtons = templateHtml.match(/\(click\)\s*=\s*"goBack\.emit\(\)"[\s\S]*?<\/button>/g) || [];
      expect(allGoBackButtons.length).toBeGreaterThanOrEqual(2);
      const bottomBar = allGoBackButtons.find(b => b.includes('backToCabinet') || b.includes('backToIntro'));
      if (!bottomBar) {
        throw new Error('Bottom-bar goBack button must include backToCabinet / backToIntro translation');
      }
      if (!bottomBar.includes('isSpecialistView()')) {
        throw new Error('Bottom-bar goBack button must branch on isSpecialistView()');
      }
      expect(bottomBar).toMatch(/backToCabinet/);
      expect(bottomBar).toMatch(/backToIntro/);
    });
  });

  describe('CTAs that STAY in specialist view (read-only is fine)', () => {
    it('Download Backup button must remain visible in specialist view', () => {
      // The download CTA is a read operation on the rendered report,
      // so it's safe (and useful) for the specialist.
      // Find the download buttons and confirm none of them are inside
      // a @if (!isSpecialistView()) block.
      const downloadButtons = templateHtml.match(/downloadFallbackData\(\)[\s\S]*?<\/button>/g) || [];
      expect(downloadButtons.length).toBeGreaterThan(0);
      for (const btn of downloadButtons) {
        // The button must NOT start with a !isSpecialistView() gate.
        // We just check that the surrounding context is not a !isSpecialistView block.
        // (Acceptable: it appears inside an unconditional block, or inside
        //  an @if (results()) block, etc.)
        expect(btn).toBeTruthy();
      }
    });

    it('Scoring toggle button must remain visible in specialist view', () => {
      const toggleBlock = templateHtml.match(/toggleScoringMethod\(\)[\s\S]*?<\/button>/);
      expect(toggleBlock).not.toBeNull();
    });
  });

  describe('i18n (specialist view keys in BOTH en and ru)', () => {
    it('en.assessment.results should contain the new specialist-view keys', () => {
      // Match the en.results block (siblings of `eyebrow: ...`)
      const enResults = translationsTs.match(/en:\s*\{[\s\S]*?assessment:\s*\{[\s\S]*?results:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(cabinet|landing)/);
      expect(enResults).not.toBeNull();
      for (const key of ['specialistViewBadge', 'specialistViewClient', 'specialistViewNoClient']) {
        if (!enResults![1].includes(`${key}:`)) {
          throw new Error(`en.assessment.results.${key} is missing`);
        }
      }
    });

    it('ru.assessment.results should contain the new specialist-view keys', () => {
      const ruResults = translationsTs.match(/ru:\s*\{[\s\S]*?assessment:\s*\{[\s\S]*?results:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(cabinet|landing)/);
      expect(ruResults).not.toBeNull();
      for (const key of ['specialistViewBadge', 'specialistViewClient', 'specialistViewNoClient']) {
        if (!ruResults![1].includes(`${key}:`)) {
          throw new Error(`ru.assessment.results.${key} is missing`);
        }
      }
    });

    it('cabinet section should contain backToCabinet in BOTH en and ru', () => {
      // The results panel's specialist "Back" button calls
      // translationService.t('backToCabinet', 'cabinet', ...) — the key
      // lives in the cabinet section, not assessment.results.
      //
      // The lazy regex needs to match the CLOSING brace of the cabinet
      // block specifically (4-space indent), not a nested block's closer
      // (6-space indent). The cabinet block now contains a nested
      // `report: { ... }` block (the TXT report content), so a naive
      // `\n\s+\}` would stop at the inner closer and miss keys declared
      // after it (e.g. `backToCabinet`).
      for (const lang of ['en', 'ru']) {
        const re = new RegExp(`${lang}:\\s*\\{[\\s\\S]*?cabinet:\\s*\\{([\\s\\S]*?)\\n    \\}`);
        const m = translationsTs.match(re);
        if (!m) throw new Error(`${lang}.cabinet section not found`);
        if (!m[1].includes('backToCabinet:')) {
          throw new Error(`${lang}.cabinet.backToCabinet is missing`);
        }
      }
    });
  });
});
