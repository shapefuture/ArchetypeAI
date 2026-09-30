import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard for the "in-progress test resume" feature.
 *
 * The bug: when the user started the assessment, answered some questions, then
 * reloaded the page, the landing page only checked for a COMPLETED backup
 * (ARCHETYPE_COMPLETED_BACKUP) — created only after the AI returns — and
 * never surfaced the in-progress responses (ARCHETYPE_ASSESSMENT_RESPONSES).
 * The result: the user saw a blank landing page with no resume CTA, even
 * though their per-answer auto-save was intact in localStorage.
 *
 * The fix: landing must also check for in-progress responses, expose a
 * `hasInProgressBackup` signal, and render a "Resume test (X of 64)"
 * CTA in the hero section. The X must be a computed derived from the
 * actual responses array (so it stays accurate as the user resumes).
 */

const LANDING_DIR = resolve(__dirname);
const componentTs = readFileSync(resolve(LANDING_DIR, 'landing.component.ts'), 'utf-8');
const componentCss = readFileSync(resolve(LANDING_DIR, 'landing.component.css'), 'utf-8');
const templateHtml = readFileSync(resolve(LANDING_DIR, 'landing.component.html'), 'utf-8');
// Post-consolidation: the translations dict physically lives in strings.ts
// (translations.ts is a thin re-export adapter). Scope the read to the
// TRANSLATIONS export — earlier sections in strings.ts also contain `en:`/
// `ru:`/`landing:` blocks that would foil the lazy regexes below.
const stringsTs = readFileSync(resolve(LANDING_DIR, '../../../i18n/strings.ts'), 'utf-8');
const translationsTs = stringsTs.slice(stringsTs.indexOf('export const TRANSLATIONS'));

describe('LandingComponent — in-progress test resume (regression guard)', () => {
  describe('Component wiring', () => {
    it('should expose a hasInProgressBackup signal (initialised to false)', () => {
      expect(componentTs).toMatch(/hasInProgressBackup\s*=\s*signal\(\s*false\s*\)/);
    });

    it('should expose a computed count of answered questions (e.g. answeredCount)', () => {
      // The CTA should show "X of 64" — the X must be a computed signal
      // that reads the in-progress responses array. This is the mechanism
      // that keeps the count accurate if the user resumes.
      expect(componentTs).toMatch(/(answeredCount|progressCount|inProgressCount)\s*=\s*(computed|signal)/);
    });

    it('should check ARCHETYPE_ASSESSMENT_RESPONSES (in-progress key) for the in-progress backup', () => {
      // The completed backup is checked in checkLocalBackup. There must be a
      // separate check (or a combined one) that reads the responses key.
      expect(componentTs).toMatch(/ARCHETYPE_ASSESSMENT_RESPONSES/);
    });

    it('should set hasInProgressBackup true only when there is at least one non-zero answer', () => {
      // An empty all-zeros responses array (initial state) should NOT count
      // as "in progress". Look for a check that excludes zero values.
      // Accept either a filter for non-zero OR a check on .some(r => r > 0) style.
      expect(componentTs).toMatch(/filter\(.*=>\s*[^)]*[!=]=\s*0\)|some\(.*=>\s*[^)]*>\s*0\)|filter\(r\s*=>\s*r\s*[!=]=\s*0\)|\.length\s*>\s*0/);
    });
  });

  describe('Template — resume CTA', () => {
    it('should render a resume CTA block gated on hasInProgressBackup()', () => {
      expect(templateHtml).toMatch(/@if\s*\(\s*hasInProgressBackup\(\)\s*\)/);
    });

    it('the resume CTA should call a resume output or method on click', () => {
      // The CTA must trigger either an output emission, a method, or a router
      // navigation. Find the @if block and check it has a click handler.
      const resumeBlock = templateHtml.match(/@if\s*\(\s*hasInProgressBackup\(\)\s*\)\s*\{[\s\S]*?\}\s*\n/);
      expect(resumeBlock).not.toBeNull();
      expect(resumeBlock![0]).toMatch(/\(click\)\s*=\s*["'][^"']*["']/);
    });

    it('the resume CTA should display the count of answered questions', () => {
      const resumeBlock = templateHtml.match(/@if\s*\(\s*hasInProgressBackup\(\)\s*\)\s*\{[\s\S]*?\}\s*\n/);
      expect(resumeBlock).not.toBeNull();
      // The block must reference the answeredCount signal (or equivalent)
      expect(resumeBlock![0]).toMatch(/(answeredCount|progressCount|inProgressCount)\(\)/);
    });

    it('the resume CTA should use a localised label, not hardcoded English', () => {
      const resumeBlock = templateHtml.match(/@if\s*\(\s*hasInProgressBackup\(\)\s*\)\s*\{[\s\S]*?\}\s*\n/);
      expect(resumeBlock).not.toBeNull();
      // Must use the t() shortcut, not raw "Resume" / "Продолжить" / "answered"
      expect(resumeBlock![0]).toMatch(/t\(['"][a-zA-Z]+['"]/);
    });
  });

  describe('Translations — resume keys in both languages', () => {
    it('English: translations.en.landing has resumeInProgress and resumeInProgressXofY', () => {
      // Both keys must exist in the en.landing block
      expect(translationsTs).toMatch(/en:\s*\{[\s\S]*?landing:\s*\{([\s\S]*?)\n\s+\},?\s*\n\s+(?:universe|assessment|cabinet|aiReport|coach)/);
      const enMatch = translationsTs.match(/en:\s*\{[\s\S]*?landing:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(?:universe|assessment|cabinet|aiReport|coach)/);
      expect(enMatch).not.toBeNull();
      const enLanding = enMatch![1];
      expect(enLanding).toContain('resumeInProgress');
      expect(enLanding).toContain('resumeInProgressXofY');
    });

    it('Russian: translations.ru.landing has resumeInProgress and resumeInProgressXofY', () => {
      const ruMatch = translationsTs.match(/ru:\s*\{[\s\S]*?landing:\s*\{([\s\S]*?)\n\s+\}\s*,?\s*\n\s+(?:universe|assessment|cabinet|aiReport|coach)/);
      expect(ruMatch).not.toBeNull();
      const ruLanding = ruMatch![1];
      expect(ruLanding).toContain('resumeInProgress');
      expect(ruLanding).toContain('resumeInProgressXofY');
    });
  });
});

describe('LandingComponent — resume button styling (regression guard)', () => {
  // The "Resume test" button used `bg-amber/20` for its body, but `amber`
  // was NOT in tailwind.config.cjs's color extend, so Tailwind purged the
  // class during build. The button body then had no background — just a
  // 3px ink border with no fill — so the button looked dark/empty on the
  // cream hero. The fix: define `amber` (and `amber-deep`) in
  // tailwind.config.cjs so Tailwind generates the corresponding CSS rules.
  //
  // (Same root cause as the anonymous-save button in results-panel and
  // the degraded-banner — they also use `amber` / `amber-deep`.)
  const tailwindConfig = readFileSync(resolve(__dirname, '../../../../tailwind.config.cjs'), 'utf-8');
  const generatedCssPath = resolve(__dirname, '../../../styles/tailwind.generated.css');
  // pretest regenerates this file, but if it doesn't exist yet (e.g. running
  // specs in isolation) the test will fail loudly, which is what we want.
  const generatedCss = readFileSync(generatedCssPath, 'utf-8');

  function colorsBlock(): string {
    const m = tailwindConfig.match(/colors:\s*\{([\s\S]*?)\n\s+\}/);
    if (!m) throw new Error('Could not find colors: { ... } block in tailwind.config.cjs');
    return m[1];
  }

  function isColorDefinedInTailwindConfig(token: string): boolean {
    return new RegExp(`['"]?${token}['"]?\\s*:`).test(colorsBlock());
  }

  it('tailwind config should define an `amber` color (source of truth)', () => {
    expect(isColorDefinedInTailwindConfig('amber')).toBe(true);
  });

  it('tailwind config should define an `amber-deep` color (used by results-panel)', () => {
    expect(isColorDefinedInTailwindConfig('amber-deep')).toBe(true);
  });

  it('generated CSS should contain a rule for bg-amber (end-to-end check)', () => {
    // The strongest test: even if the config is right but the build pipeline
    // is broken, the deployed CSS would still be missing the rule. Check the
    // actual generated CSS bundle for a `.bg-amber` (or `.bg-amber\/N`) rule.
    expect(generatedCss).toMatch(/\.bg-amber(?:\\\\\/\d+)?\s*\{/);
  });

  it('resume card should have a painted background (component CSS)', () => {
    // After the app-stage revamp the resume CTA is a `.resumecard`
    // (welcome screen), styled by landing.component.css — not by a
    // Tailwind bg-* utility. The regression intent stays: the button
    // must not render with an empty/unpainted body. Assert the class
    // is used in the template AND painted in the component stylesheet.
    const resumeBlock = templateHtml.match(/@if\s*\(\s*hasInProgressBackup\(\)\s*\)\s*\{[\s\S]*?\}/);
    expect(resumeBlock).not.toBeNull();
    expect(resumeBlock![0]).toMatch(/<button\s+class="resumecard"/);
    const resumecardRule = componentCss.match(/\.resumecard\s*\{[^}]*\}/);
    expect(resumecardRule).not.toBeNull();
    expect(resumecardRule![0]).toMatch(/background\s*:/);
  });

  it('the resumecard background must survive the oklch/color-mix pipeline', () => {
    // End-to-end guard: the rule must use a paint value that renders in
    // every supported browser (color-mix over component-scoped vars is
    // the design token path; a raw var(--undefined) would paint nothing).
    const resumecardRule = componentCss.match(/\.resumecard\s*\{[^}]*\}/);
    expect(resumecardRule).not.toBeNull();
    expect(resumecardRule![0]).toMatch(/background\s*:\s*color-mix\(/);
    expect(resumecardRule![0]).not.toMatch(/background\s*:\s*var\(--[a-z-]+\)\s*;/);
  });
});
