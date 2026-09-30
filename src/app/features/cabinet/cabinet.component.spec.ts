import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The cabinet component uses `templateUrl` and `styleUrls` (external files),
 * which vitest does not resolve at runtime in this project. Instead of going
 * through TestBed, we read the template and CSS files directly and assert on
 * their contents. These tests are pinned to the specific UI bugs:
 *
 *   1. The "Assessment history" rows used to render
 *        #{{ h.responses?.length || 0 }}
 *      which always produced "#64" (the assessment has 64 questions, so the
 *      responses array is always 64 elements). The badge conveyed no useful
 *      information and made every row look identical.
 *
 *   2. The cabinet CSS only had `:host { display: block; }`, so when content
 *      was taller than the viewport the page was unscrollable (body has
 *      `overflow: hidden`, the parent #container uses `min-h-[100dvh]` not
 *      a fixed height). The fix establishes a self-contained scroll context
 *      on the host element, matching landing.component.css / results-panel.
 */

const CABINET_DIR = resolve(__dirname);
const templateHtml = readFileSync(resolve(CABINET_DIR, 'cabinet.component.html'), 'utf-8');
const stylesCss = readFileSync(resolve(CABINET_DIR, 'cabinet.component.css'), 'utf-8');
const componentTs = readFileSync(resolve(CABINET_DIR, 'cabinet.component.ts'), 'utf-8');
// i18n copy consolidated into strings.ts (translations.ts is now a re-export shim)
const translationsTs = readFileSync(resolve(CABINET_DIR, '../../../i18n/strings.ts'), 'utf-8');
const landingHtml = readFileSync(resolve(CABINET_DIR, '../landing/landing.component.html'), 'utf-8');
const appHtml = readFileSync(resolve(CABINET_DIR, '../../../app.component.html'), 'utf-8');
const appTs = readFileSync(resolve(CABINET_DIR, '../../../app.component.ts'), 'utf-8');

describe('CabinetComponent — template + CSS regression guards', () => {
  describe('history list (#64 badge regression)', () => {
    it('template should NOT render the meaningless "#64" badge via h.responses?.length', () => {
      // Before the fix:
      //   <div class="text-[10px] font-bold text-ink-l">#{{ h.responses?.length || 0 }}</div>
      // This always evaluated to "#64" because the assessment always has 64
      // questions, so the responses array length is always 64.
      expect(templateHtml).not.toMatch(/h\.responses\?\.length/);
      // Also verify the rendered "#" badge on a history row is gone entirely.
      expect(templateHtml).not.toMatch(/>\s*#\{\{[^}]*\}\}\s*</);
    });

    it('template should still render the timestamp and scoring method for each history entry', () => {
      // The history row should still show the date and the scoring method.
      expect(templateHtml).toContain('formatTs');
      expect(templateHtml).toContain('h.scoringMethod');
    });
  });

  describe('history list → dropdown (regression: long page regression)', () => {
    // The user reported that with 16+ retests, the long vertical list of
    // history cards made the cabinet page uncomfortably long. The fix
    // converts the list into a single <select> dropdown so the user picks
    // a version in place. The full timestamp + scoring method still need
    // to be visible — both inside each <option> and in a "selected"
    // preview below the dropdown.

    it('template should render a <select> for the history picker, not a long list of cards', () => {
      // The history list must be a <select> with <option>s, not a vertical
      // stack of cards. (Cards were the previous design — the @for rendered
      // one rounded-2xl div per entry, which is exactly the "long page" the
      // user complained about.)
      expect(templateHtml).toMatch(/<select[\s>][^]*?<\/select>/s);
      // The previous design rendered one rounded-2xl div per history entry
      // in a "space-y-3" container. It must be gone.
      expect(templateHtml).not.toMatch(/<div class="rounded-2xl border-2 border-ink\/10 bg-paper\/50 p-3">[\s\S]*?h\.scoringMethod/);
    });

    it('template should keep the timestamp and scoring method visible on the selected entry', () => {
      // Even though the per-entry card list is gone, the user must still
      // see the date and scoring method for whichever entry is currently
      // selected in the dropdown.
      expect(templateHtml).toContain('selectedHistoryEntry');
      expect(templateHtml).toContain('formatTs');
    });

    it('template should expose a per-version backup download button for the selected entry', () => {
      expect(templateHtml).toContain('downloadSelectedHistoryBackup()');
      expect(templateHtml).toContain('downloadVersionBackup');
    });

    it('component should expose a selectedHistoryId signal', () => {
      expect(componentTs).toMatch(/selectedHistoryId\s*=\s*signal/);
    });

    it('component should expose a selectedHistoryEntry computed signal', () => {
      expect(componentTs).toMatch(/selectedHistoryEntry\s*=\s*computed/);
    });

    it('component should auto-select the most recent history entry by default', () => {
      // When the history list loads, the dropdown must default to the
      // first item (loadHistory returns newest-first). Verify the
      // component reads `history()[0]` to seed the selection.
      expect(componentTs).toMatch(/history\(\)\[0\]|history\(\)\.at\(0\)/);
    });
  });

  describe('scroll (cabinet must scroll)', () => {
    it('CSS :host must declare overflow-y: auto to establish a scroll context', () => {
      // The :host rule must include overflow-y: auto so the cabinet can scroll
      // when its content (account + tasks + history + past synastries + admin)
      // is taller than the viewport.
      expect(stylesCss).toMatch(/:host\s*\{[^}]*overflow-y:\s*auto[^}]*\}/);
    });

    it('CSS :host must be position: absolute with inset: 0 to fill its parent', () => {
      // :host needs position: absolute and inset: 0 so the cabinet fills the
      // app shell (#container) and the overflow-y: auto has a fixed container
      // to scroll within. Without this, the host grows with its content and
      // no overflow occurs.
      expect(stylesCss).toMatch(/:host\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*\}/);
    });

    it('CSS :host must also clamp horizontal overflow', () => {
      // Defensive: prevent any horizontal scrollbar from breaking layout.
      expect(stylesCss).toMatch(/:host\s*\{[^}]*overflow-x:\s*hidden[^}]*\}/);
    });
  });

  describe('i18n translations (Russian coverage)', () => {
    // The user reported the cabinet and the Dashboard/Logout/Login buttons
    // in the landing navbar had no Russian translation. The fix: inject
    // TranslationService, add a t() shortcut, replace every hardcoded
    // string with t('key', 'English fallback') calls, and add a new
    // `cabinet` section in BOTH en and ru in translations.ts.

    it('component should import and inject TranslationService', () => {
      expect(componentTs).toMatch(/import\s*\{[^}]*TranslationService[^}]*\}/);
      expect(componentTs).toMatch(/inject\(TranslationService\)/);
    });

    it('component should expose a t() shortcut method using the cabinet section', () => {
      // The cabinet uses the 'cabinet' section of translations.ts; landing
      // uses 'landing'. CabinetComponent must use 'cabinet' specifically.
      expect(componentTs).toMatch(/t\(key:\s*string/);
      expect(componentTs).toMatch(/['"]cabinet['"]/);
    });

    it('template should call t() for header, login CTA, history, and client/admin controls', () => {
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]personalCabinet['"]/);
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]yourSpace['"]/);
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]loginCta['"]/);
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]assessmentHistory['"]/);
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]myClients['"]/);
      expect(templateHtml).not.toMatch(/shareWithSpecialist|quickActions|pastSynastries/);
    });

    it('translations.ts should declare a `cabinet` section in BOTH en and ru', () => {
      // en block contains a cabinet: { ... } section
      expect(translationsTs).toMatch(/en:\s*\{[\s\S]*?cabinet:\s*\{/);
      // ru block contains a cabinet: { ... } section
      expect(translationsTs).toMatch(/ru:\s*\{[\s\S]*?cabinet:\s*\{/);
    });

    it('translations.ts should contain the new landing navbar keys', () => {
      // These are referenced by landing.component.html for the
      // Dashboard / Logout / Login buttons. They live in the existing
      // `landing` section in BOTH languages.
      expect(translationsTs).toMatch(/navDashboard/);
      expect(translationsTs).toMatch(/navLogout/);
      expect(translationsTs).toMatch(/navLogin/);
    });
  });

  describe('LandingComponent — navbar i18n (Russian coverage)', () => {
    // The user reported Dashboard / Logout / Login in the landing navbar
    // had no Russian translation. The fix: call t('navDashboard') etc.
    // from landing.component.html (the t() shortcut on LandingComponent
    // already routes to section='landing').
    it('cabinet/logout/login controls should be rendered via t()', () => {
      // After the app-stage revamp the navbar is gone; the controls live
      // on the You screen. The regression intent stands: no hardcoded
      // English labels, everything through t().
      expect(landingHtml).not.toMatch(/>\s*Dashboard\s*</);
      expect(landingHtml).not.toMatch(/>\s*Logout\s*</);
      expect(landingHtml).not.toMatch(/>\s*Login\s*</);
      // And every replacement should be a t() call:
      expect(landingHtml).toMatch(/\{\{\s*t\(['"]youCabinet['"]/);
      expect(landingHtml).toMatch(/\{\{\s*t\(['"]youLogout['"]/);
      expect(landingHtml).toMatch(/\{\{\s*t\(['"]youSignIn['"]/);
    });
  });

  describe('Admin "My clients" specialist dashboard', () => {
    // The user (admin@example.com, bootstrap admin) reported logging in
    // expecting client panels and getting the regular cabinet. There was
    // no UI to RECEIVE shares, no client list, no per-client view, and
    // no task assignment. The fix adds a "My clients" section gated on
    // isAdmin(), plus the read-only specialist view of a client's report.

    it('component should inject SpecialistClientService', () => {
      expect(componentTs).toMatch(/import\s*\{[^}]*SpecialistClientService[^}]*\}/);
      expect(componentTs).toMatch(/inject\(SpecialistClientService\)/);
    });

    it('component should expose a `onDownloadClientReport` method (TXT download, no parent event)', () => {
      // The "Download report" button is a pure browser side-effect: the
      // cabinet formats the TXT body and triggers the download itself, so
      // there is NO `viewClientReport` output anymore. This regression
      // test guards that contract — if someone re-adds the output and
      // re-wires it to the parent, the "Download report" and "View AI
      // report" buttons would do the same thing again (the bug we're
      // fixing now).
      expect(componentTs).toMatch(/onDownloadClientReport\s*\(/);
      expect(componentTs).not.toMatch(/viewClientReport\s*=\s*output/);
      expect(componentTs).not.toMatch(/onViewClientReport\s*\(/);
      // The download runs inside a try/finally that clears the loading
      // signal — pin the signal itself so the loading label in the
      // template can resolve.
      expect(componentTs).toMatch(/downloadingReportFor\s*=\s*signal/);
    });

    it('component should expose the client-list state signals', () => {
      // The template reads these signals to render rows.
      expect(componentTs).toMatch(/myClients\s*=\s*signal/);
      expect(componentTs).toMatch(/clientResults\s*=\s*signal/);
      expect(componentTs).toMatch(/clientUidInput\s*=\s*signal/);
      expect(componentTs).toMatch(/clientEmailInput\s*=\s*signal/);
      expect(componentTs).toMatch(/notesDraft\s*=\s*signal/);
      expect(componentTs).toMatch(/savingNotesFor\s*=\s*signal/);
    });

    it('component should expose the client-list action methods', () => {
      // These are the methods the template calls.
      expect(componentTs).toMatch(/addClientByUid\s*\(\s*\)\s*:\s*Promise/);
      expect(componentTs).toMatch(/removeClientFromList\s*\(/);
      expect(componentTs).toMatch(/onNotesDraftChange\s*\(/);
      expect(componentTs).toMatch(/saveNotes\s*\(/);
      expect(componentTs).toMatch(/onDownloadClientReport\s*\(/);
      expect(componentTs).toMatch(/notesAreDirty\s*\(/);
      expect(componentTs).toMatch(/notesDraftValue\s*\(/);
      expect(componentTs).toMatch(/downloadSelectedHistoryBackup\s*\(/);
      expect(componentTs).toMatch(/lookupByUid\(uid\)/);
    });

    it('template should render the "My clients" section, gated on isAdmin()', () => {
      // The section must exist as a top-level @if (isAdmin()) block — same
      // gating as the existing "Share admin access" section. We look for
      // the "My clients" t() call which only appears in the new section.
      expect(templateHtml).toMatch(/\{\{\s*t\(['"]myClients['"]/);
      // The section must be visible only to admins:
      const sectionMatches = templateHtml.match(/@if\s*\(\s*isAdmin\(\)\s*\)/g) || [];
      // The "Share admin access" section uses one @if; the new "My clients"
      // section uses a second @if. We need at least 2 admin-gated blocks.
      expect(sectionMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('template should not contain any hardcoded English in the new admin-clients section', () => {
      // Pin to the specific strings that would mean the dev forgot a t() call.
      expect(templateHtml).not.toMatch(/>\s*My clients\s*</);
      expect(templateHtml).not.toMatch(/>\s*Add client by User ID\s*</);
      expect(templateHtml).not.toMatch(/>\s*Add client\s*</);
      expect(templateHtml).not.toMatch(/>\s*Save notes\s*</);
      expect(templateHtml).not.toMatch(/>\s*Download report\s*</);
      expect(templateHtml).not.toMatch(/>\s*View report\s*</);
      expect(templateHtml).not.toMatch(/>\s*No clients yet\.\s*</);
      expect(templateHtml).not.toMatch(/>\s*Client User ID \(UID\)\s*</);
      expect(templateHtml).not.toMatch(/>\s*Client email \(optional\)\s*</);
    });

    it('template should call t() for every visible admin-clients string', () => {
      // The check accepts both interpolation `{{ t('...') }}` (for visible
      // text) and property binding `[attr.aria-label]="t('...')"` /
      // `[placeholder]="t('...')"` (for attributes and placeholders).
      // The order in the template determines which form each key uses.
      const tCall = (key: string) => new RegExp(`t\\(['"]${key}['"]`);

      // Visible text (interpolated)
      const interpolation = (key: string) => new RegExp(`\\{\\{\\s*t\\(['"]${key}['"]`);

      // Property / attribute binding
      const attrBinding = (key: string) => new RegExp(`=\\s*"\\s*t\\(['"]${key}['"]`);

      const check = (key: string) => {
        // Key must be referenced via t() somewhere in the template.
        if (!tCall(key).test(templateHtml)) {
          throw new Error(`t('${key}', ...) not found in cabinet template`);
        }
      };

      // Visible interpolations
      for (const k of [
        'myClients', 'myClientsBody', 'addClientByUid', 'addClientHint',
        'clientUidLabel', 'clientEmailLabel', 'clientTaskLabel',
        'addClient', 'assignTask', 'downloadClientReport', 'removeClient',
        'noClients', 'noClientsBody', 'clientLastAssessment', 'noAssessmentYet',
        'downloadClientReportAria',
      ]) {
        check(k);
        // And at least one of: visible text or attribute binding form
        const ok = interpolation(k).test(templateHtml) || attrBinding(k).test(templateHtml);
        if (!ok) throw new Error(`${k} should be referenced via t()`);
        expect(ok).toBe(true);
      }

      // Placeholders are bound via [placeholder]="t('...')" only
      for (const k of [
        'clientUidPlaceholder', 'clientEmailPlaceholder', 'clientTaskPlaceholder',
      ]) {
        check(k);
        const ok = attrBinding(k).test(templateHtml);
        if (!ok) throw new Error(`${k} should be bound as attribute`);
        expect(ok).toBe(true);
      }
    });

    it('template should bind the "Download report" button to onDownloadClientReport(c)', () => {
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"onDownloadClientReport\(c\)"/);
    });

    it('template should bind the "Assign a task" button to saveNotes(c)', () => {
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"saveNotes\(c\)"/);
    });

    it('template should bind the "Remove" client button to removeClientFromList(c.clientUid)', () => {
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"removeClientFromList\(c\.clientUid\)"/);
    });

    it('template should disable the "Download report" button when the client has no assessment', () => {
      // We must NOT let the specialist trigger a download of a row that
      // has no assessment data. The button is disabled when
      // clientResults().get(c.clientUid) is falsy. The binding also ORs
      // in a "download in progress" guard so the button stays disabled
      // while a TXT is being generated (a few ms, but no double-clicks).
      const findButton = (handler: string): string => {
        const start = templateHtml.indexOf(`(click)="${handler}(c)"`);
        expect(start).toBeGreaterThan(0);
        const btnOpenStart = templateHtml.lastIndexOf('<button', start);
        expect(btnOpenStart).toBeGreaterThan(0);
        const btnOpenEnd = templateHtml.indexOf('>', btnOpenStart);
        const btnClose = templateHtml.indexOf('</button>', btnOpenEnd);
        return templateHtml.slice(btnOpenStart, btnClose + '</button>'.length);
      };
      const dlBtn = findButton('onDownloadClientReport');
      expect(dlBtn).toMatch(/\[disabled\]/);
      expect(dlBtn).toMatch(/!clientResults\(\)\.get\(c\.clientUid\)/);
    });

    it('template should bind the notes textarea value via notesDraftValue(c) and the input via onNotesDraftChange', () => {
      expect(templateHtml).toMatch(/\[value\]\s*=\s*"notesDraftValue\(c\)"/);
      expect(templateHtml).toMatch(/\(input\)\s*=\s*"onNotesDraftChange\(c\.clientUid/);
    });

    it('translations.ts should declare the new admin-clients keys in BOTH en and ru', () => {
      // Every key referenced in the template must exist in BOTH languages
      // — the fallback only kicks in for missing keys, and a missing
      // Russian translation is the exact bug we're guarding against.
      const newKeys = [
        'myClients', 'myClientsBody', 'addClient', 'addClientByUid',
        'addClientHint', 'clientUidLabel', 'clientUidPlaceholder',
        'clientEmailLabel', 'clientEmailPlaceholder', 'clientTaskLabel',
        'clientTaskPlaceholder', 'assignTask', 'downloadClientReport',
        'downloadClientReportAria', 'viewClientMatrix', 'viewClientMatrixAria',
        'viewClientAiReport', 'viewClientAiReportAria', 'removeClient',
        'noClients', 'noClientsBody', 'clientLastAssessment', 'noAssessmentYet',
        'loadClientsFailed', 'saveNotesFailed', 'addClientFailed', 'removeClientFailed',
      ];
      for (const key of newKeys) {
        const enMatch = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        const ruMatch = new RegExp(`ru:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        // Pin the failure to the specific key so the diagnostic is
        // actionable when the test breaks.
        const enPresent = enMatch.test(translationsTs);
        const ruPresent = ruMatch.test(translationsTs);
        if (!enPresent) throw new Error(`en.${key} must be defined in translations.ts`);
        if (!ruPresent) throw new Error(`ru.${key} must be defined in translations.ts`);
        expect(enPresent).toBe(true);
        expect(ruPresent).toBe(true);
      }
    });
  });

  describe('Admin "My clients" — three action buttons (matrix + AI report)', () => {
    // The user reported that the "My clients" admin dashboard only had a
    // single "View report" button per client. They want three buttons:
    //   1. View report (existing — the full results panel)
    //   2. View matrix (new — the client's universe/constellation view)
    //   3. View AI report (new — focused on the AI narrative)
    // Each button emits a distinct output that app.component routes to a
    // different view.

    it('component should expose `viewClientMatrix` and `viewClientAiReport` outputs', () => {
      expect(componentTs).toMatch(/viewClientMatrix\s*=\s*output/);
      expect(componentTs).toMatch(/viewClientAiReport\s*=\s*output/);
    });

    it('component should expose `onViewClientMatrix` and `onViewClientAiReport` methods', () => {
      expect(componentTs).toMatch(/onViewClientMatrix\s*\(/);
      expect(componentTs).toMatch(/onViewClientAiReport\s*\(/);
    });

    it('template should render a "View matrix" button bound to onViewClientMatrix', () => {
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"onViewClientMatrix\(c\)"/);
    });

    it('template should render a "View AI report" button bound to onViewClientAiReport', () => {
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"onViewClientAiReport\(c\)"/);
    });

    it('template should call t() for the new matrix + AI report labels and ARIA hints', () => {
      for (const k of ['viewClientMatrix', 'viewClientMatrixAria', 'viewClientAiReport', 'viewClientAiReportAria']) {
        if (!new RegExp(`t\\(['"]${k}['"]`).test(templateHtml)) {
          throw new Error(`t('${k}', ...) not found in cabinet template`);
        }
      }
    });

    it('template should disable the new matrix + AI report buttons when the client has no assessment', () => {
      // Mirrors the existing "View report" button: disabled until
      // clientResults().get(c.clientUid) is truthy.
      // Find the <button ...> ... </button> block that contains the
      // (click)="onViewClientMatrix(c)" binding, then assert the [disabled]
      // attribute is on that same button.
      const findButton = (handler: string): string => {
        // Locate the <button ...> open tag immediately before the click binding.
        const start = templateHtml.indexOf(`(click)="${handler}(c)"`);
        expect(start).toBeGreaterThan(0);
        // Walk backwards from the click to find the <button open tag.
        const btnOpenStart = templateHtml.lastIndexOf('<button', start);
        expect(btnOpenStart).toBeGreaterThan(0);
        const btnOpenEnd = templateHtml.indexOf('>', btnOpenStart);
        // The first `</button>` after the open tag closes this button.
        const btnClose = templateHtml.indexOf('</button>', btnOpenEnd);
        return templateHtml.slice(btnOpenStart, btnClose + '</button>'.length);
      };
      const matrixBtn = findButton('onViewClientMatrix');
      expect(matrixBtn).toMatch(/\[disabled\]\s*=\s*"!clientResults\(\)\.get\(c\.clientUid\)"/);
      const aiReportBtn = findButton('onViewClientAiReport');
      expect(aiReportBtn).toMatch(/\[disabled\]\s*=\s*"!clientResults\(\)\.get\(c\.clientUid\)"/);
    });
  });

  describe('Admin "Share admin access" form (placeholder regression)', () => {
    // The user reported the "Share admin access" section looked like a
    // placeholder: the template had only a title and a description, but
    // NO input field, NO "Add admin" button, and NO list of current
    // admins. The cabinet component had all the signals and methods
    // (`addAdminEmail`, `removeAdminEmail`, `adminEmailInput`, `adminList`,
    // `adminBusy`, `adminError`), they just weren't wired up in the
    // template. This describe block pins the form to the template.

    it('template should render an email input bound to adminEmailInput', () => {
      // The input is part of the "Share admin access" section. We look
      // for the input by its placeholder, then walk back to the opening
      // `<input` to capture the full element (the `type="email"` comes
      // before the [placeholder] binding in the multi-line source).
      const placeholderIdx = templateHtml.indexOf("t('adminEmailPlaceholder'");
      expect(placeholderIdx).toBeGreaterThan(0);
      // Walk back to find the <input that opens this element
      const inputOpenStart = templateHtml.lastIndexOf('<input', placeholderIdx);
      expect(inputOpenStart).toBeGreaterThan(0);
      // Find the self-closing `/>` after the placeholder
      const inputCloseEnd = templateHtml.indexOf('/>', placeholderIdx);
      expect(inputCloseEnd).toBeGreaterThan(0);
      const inputBlock = templateHtml.slice(inputOpenStart, inputCloseEnd + 2);
      // The input is bound to the adminEmailInput signal via [value]
      // and updated via (input) — the standard signal-based two-way.
      expect(inputBlock).toMatch(/\[value\]\s*=\s*"adminEmailInput\(\)"/);
      // The input type MUST be "email" so mobile keyboards show the
      // right layout and browsers can do basic format validation.
      expect(inputBlock).toMatch(/type\s*=\s*"email"/);
    });

    it('template should render an "Add admin" button bound to addAdminEmail()', () => {
      // The button is disabled when busy or the email field is empty.
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"addAdminEmail\(\)"/);
      // Find the button block and verify the disable conditions.
      const start = templateHtml.indexOf('(click)="addAdminEmail()"');
      expect(start).toBeGreaterThan(0);
      const btnOpenStart = templateHtml.lastIndexOf('<button', start);
      const btnOpenEnd = templateHtml.indexOf('>', btnOpenStart);
      const btnClose = templateHtml.indexOf('</button>', btnOpenEnd);
      const btn = templateHtml.slice(btnOpenStart, btnClose + '</button>'.length);
      expect(btn).toMatch(/\[disabled\]\s*=\s*"adminBusy\(\)\s*\|\|\s*!adminEmailInput\(\)\.trim\(\)"/);
    });

    it('template should render the adminError display when an error is set', () => {
      // The error block follows the same rose-tinted style as the
      // existing clientsError and loadError blocks.
      expect(templateHtml).toMatch(/@if\s*\(\s*adminError\(\)/);
    });

    it('template should render the adminList with a Remove button per entry', () => {
      // The list is a @for over adminList(), each entry shows the email
      // + an "Added:" timestamp + a Remove button.
      expect(templateHtml).toMatch(/@for\s*\(\s*a\s+of\s+adminList\(\)/);
      // Remove button is bound to removeAdminEmail(a.email)
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"removeAdminEmail\(a\.email\)"/);
    });

    it('the form must be inside the existing @if (isAdmin()) "Share admin access" block', () => {
      // The form elements (input, button, list) must all be inside the
      // SAME @if (isAdmin()) block as the "Share admin access" title,
      // so non-admins never see the controls (not even briefly).
      // Locate the "Share admin access" t() call, then find the
      // enclosing @if block, then check the form elements are inside it.
      const sectionStart = templateHtml.indexOf("t('shareAdminAccess'");
      expect(sectionStart).toBeGreaterThan(0);
      // Walk backwards to find the @if (isAdmin()) that opens this section
      const ifStart = templateHtml.lastIndexOf('@if (isAdmin())', sectionStart);
      expect(ifStart).toBeGreaterThan(0);
      // Find the matching closing brace of the @if block. The block
      // contains a `}` at the same indent as the `@if` line. Easiest
      // approach: the next @if (isAdmin()) or @else would be the next
      // sibling, so the form must appear before the next @if (isAdmin()).
      const nextIf = templateHtml.indexOf('@if (isAdmin())', ifStart + 1);
      // If there's a next @if (isAdmin()), the form must be between
      // ifStart and nextIf. If there isn't (this is the last @if), the
      // form must be between ifStart and end.
      const sectionEnd = nextIf > 0 ? nextIf : templateHtml.length;
      const sectionBody = templateHtml.slice(ifStart, sectionEnd);
      // The form elements must be inside this section
      expect(sectionBody).toMatch(/adminEmailPlaceholder/);
      expect(sectionBody).toMatch(/addAdminEmail\(\)/);
      expect(sectionBody).toMatch(/adminList\(\)/);
    });

    it('template should not contain any hardcoded English in the admin-sharing form', () => {
      // Pin to specific strings that would mean the dev forgot a t() call.
      expect(templateHtml).not.toMatch(/>\s*Add admin\s*</);
      expect(templateHtml).not.toMatch(/>\s*Admin email\s*</);
    });

    it('translations.ts should declare addAdminFailed + removeAdminFailed in BOTH en and ru', () => {
      // The error fallbacks in the component (addAdminEmail /
      // removeAdminEmail) currently use the hardcoded English strings
      // "Failed to add admin" and "Failed to remove admin" as last-resort
      // fallbacks. The Russian version is a hardcoded English fallback
      // too, which is the exact bug the i18n coverage was supposed to
      // prevent. The fix: add the keys to BOTH en and ru, then the
      // component's t('addAdminFailed', 'Failed to add admin') call
      // will resolve to the right language.
      const newKeys = ['addAdminFailed', 'removeAdminFailed'];
      for (const key of newKeys) {
        const enMatch = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        const ruMatch = new RegExp(`ru:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        if (!enMatch.test(translationsTs)) {
          throw new Error(`en.${key} must be defined in translations.ts`);
        }
        if (!ruMatch.test(translationsTs)) {
          throw new Error(`ru.${key} must be defined in translations.ts`);
        }
      }
    });
  });

  describe('Admin "My clients" — per-version assessment download (full history)', () => {
    // The user reported they can only download the LATEST assessment for
    // each client. They want to download each historical version
    // individually (e.g. "the one from March 15th"). The fix:
    //   1. Add a getClientHistory() method to SpecialistClientService
    //      (covered in its own spec) that reads the full history.
    //   2. Add a clientHistory signal in the cabinet.
    //   3. Render the full history under each client with a download
    //      button per version.
    // These tests pin the cabinet's WIRING of that data.

    it('component should expose a clientHistory signal (Map<uid, AssessmentData[]>)', () => {
      expect(componentTs).toMatch(/clientHistory\s*=\s*signal/);
    });

    it('loadMyClients should call getClientHistory for each linked client', () => {
      // We grep the source for the call — the wiring is the contract.
      // The method is invoked inside an async map() over the client
      // list, so we just look for the call shape.
      expect(componentTs).toMatch(/specialistClients\.getClientHistory\(/);
    });

    it('template should render a per-client history list with a download button per version', () => {
      // Inside the existing @for (c of myClients(); ...) block, there
      // must be a NESTED @for over the history for THAT client, with a
      // download button per entry. We look for:
      //   @for (h of clientHistory().get(c.clientUid) || []; track ...)
      //     <button (click)="onDownloadClientVersion(c, h)">
      // The "(click)="onDownloadClientVersion" must exist.
      expect(templateHtml).toMatch(/\(click\)\s*=\s*"onDownloadClientVersion\(/);
      // And the nested @for over the history list
      expect(templateHtml).toMatch(/@for\s*\(\s*h\s+of\s+clientHistory\(\)\.get\(c\.clientUid\)\s*\|\|\s*\[\]/);
    });

    it('template should disable the per-version download button when the history entry is missing', () => {
      // The per-version button is disabled when the history entry is
      // null/undefined (defensive — the @for loop guarantees the entry
      // is in scope, but the guard mirrors the existing pattern).
      const start = templateHtml.indexOf('(click)="onDownloadClientVersion(');
      expect(start).toBeGreaterThan(0);
      const btnOpenStart = templateHtml.lastIndexOf('<button', start);
      const btnOpenEnd = templateHtml.indexOf('>', btnOpenStart);
      const btnClose = templateHtml.indexOf('</button>', btnOpenEnd);
      const btn = templateHtml.slice(btnOpenStart, btnClose + '</button>'.length);
      expect(btn).toMatch(/\[disabled\]/);
    });

    it('component should expose an onDownloadClientVersion method that takes (client, assessment)', () => {
      // The per-version download reuses the existing report-builder
      // helpers (formatClientReportText + triggerTextDownload) but is
      // parameterized on a specific AssessmentData, not "the latest".
      expect(componentTs).toMatch(/onDownloadClientVersion\s*\(\s*client\s*:\s*ClientLink\s*,\s*assessment\s*:\s*AssessmentData\s*\)/);
    });

    it('translations.ts should declare clientAllAssessments in BOTH en and ru', () => {
      // The section header above the per-version list. Both languages
      // must define it so the section title never shows a raw key.
      const enMatch = /en:\s*\{[\s\S]*?clientAllAssessments\s*:/;
      const ruMatch = /ru:\s*\{[\s\S]*?clientAllAssessments\s*:/;
      if (!enMatch.test(translationsTs)) {
        throw new Error('en.clientAllAssessments must be defined in translations.ts');
      }
      if (!ruMatch.test(translationsTs)) {
        throw new Error('ru.clientAllAssessments must be defined in translations.ts');
      }
    });
  });

  describe('Admin "Add client" — UID<->email auto-fill (user directory)', () => {
    // The admin's "Add client" form has two fields: UID + email. The
    // user reported the friction of having to type BOTH. The fix:
    // look up the publicProfiles directory on every keystroke (debounced)
    // and auto-fill the OTHER field when a match is found. The
    // implementation lives in `UserDirectoryService` (covered in its
    // own spec); these tests pin the cabinet's WIRING of that service.

    it('component should inject UserDirectoryService', () => {
      expect(componentTs).toMatch(/import\s*\{[^}]*UserDirectoryService[^}]*\}/);
      expect(componentTs).toMatch(/inject\(UserDirectoryService\)/);
    });

    it('component should expose clientLookupInProgress + clientLookupError signals', () => {
      // The template reads these signals to render the "Looking up…" /
      // "No user found" status indicator.
      expect(componentTs).toMatch(/clientLookupInProgress\s*=\s*signal/);
      expect(componentTs).toMatch(/clientLookupError\s*=\s*signal/);
    });

    it('component should expose onClientUidChange and onClientEmailChange handlers', () => {
      expect(componentTs).toMatch(/onClientUidChange\s*\(\s*value\s*:\s*string\s*\)/);
      expect(componentTs).toMatch(/onClientEmailChange\s*\(\s*value\s*:\s*string\s*\)/);
    });

    it('template should bind the UID input to onClientUidChange (not direct signal set)', () => {
      // The OLD wiring was `(input)="clientUidInput.set(...)"`. The new
      // wiring goes through onClientUidChange so the debounced lookup
      // can fire. Both forms are syntactically valid Angular — the
      // test pins the new form.
      expect(templateHtml).toMatch(/\(input\)\s*=\s*"onClientUidChange/);
      // And the old direct-setter pattern is gone for this input.
      // We look for the specific input with the UID placeholder, then
      // capture everything up to the self-closing `/>` of the input.
      const uidInputBlock = templateHtml.match(
        /\[placeholder\]\s*=\s*"t\('clientUidPlaceholder'[^]*?\/>/,
      );
      expect(uidInputBlock).not.toBeNull();
      expect(uidInputBlock![0]).not.toMatch(/\(input\)\s*=\s*"clientUidInput\.set/);
    });

    it('template should bind the email input to onClientEmailChange (not direct signal set)', () => {
      expect(templateHtml).toMatch(/\(input\)\s*=\s*"onClientEmailChange/);
      const emailInputBlock = templateHtml.match(
        /\[placeholder\]\s*=\s*"t\('clientEmailPlaceholder'[^]*?\/>/,
      );
      expect(emailInputBlock).not.toBeNull();
      expect(emailInputBlock![0]).not.toMatch(/\(input\)\s*=\s*"clientEmailInput\.set/);
    });

    it('template should render the lookup status indicator (Looking up / No user found)', () => {
      // The indicator is wrapped in `@if (clientLookupInProgress()) { ... }
      // @else if (clientLookupError()) { ... }` and uses aria-live="polite"
      // so screen readers announce the status change.
      expect(templateHtml).toMatch(/@if\s*\(\s*clientLookupInProgress\(\)/);
      expect(templateHtml).toMatch(/@else\s+if\s*\(\s*clientLookupError\(\)/);
      expect(templateHtml).toMatch(/aria-live\s*=\s*"polite"/);
      expect(templateHtml).toMatch(/role\s*=\s*"alert"/);
    });

    it('translations.ts should declare clientLookup* keys in BOTH en and ru', () => {
      // The three new keys: clientLookupInProgress, clientLookupNotFound,
      // clientLookupError. Each must exist in both languages so the
      // status indicator never falls back to the raw key.
      const newKeys = ['clientLookupInProgress', 'clientLookupNotFound', 'clientLookupError'];
      for (const key of newKeys) {
        const enMatch = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        const ruMatch = new RegExp(`ru:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        if (!enMatch.test(translationsTs)) {
          throw new Error(`en.${key} must be defined in translations.ts`);
        }
        if (!ruMatch.test(translationsTs)) {
          throw new Error(`ru.${key} must be defined in translations.ts`);
        }
      }
    });
  });

  describe('app.component — three client-view handlers (matrix + AI report)', () => {
    // The cabinet emits two events for the parent (the buttons that need
    // app state changes):
    //   (viewClientMatrix)     → openClientMatrix     (universe with client data)
    //   (viewClientAiReport)   → openClientAiReport   (specialist-client-view, AI focus)
    //
    // The "Download report" button does NOT emit — the cabinet handles the
    // TXT download itself (pure browser side-effect, no app state change).
    // We previously also had (viewClientReport) → openClientReport, but
    // that handler did the same thing as openClientAiReport, so the two
    // buttons behaved identically. Removing that binding is the fix.

    it('app.component.ts should expose openClientMatrix and openClientAiReport methods', () => {
      expect(appTs).toMatch(/openClientMatrix\s*\(/);
      expect(appTs).toMatch(/openClientAiReport\s*\(/);
    });

    it('app.component.ts should have a context-aware universe back handler', () => {
      // The matrix view uses appState='universe' but with specialist
      // context (specialistViewClientUid set). The universe's viewIntro
      // event must route to the cabinet in that case, not to intro.
      expect(appTs).toMatch(/onUniverseBack\s*\(/);
    });

    it('app.component.html should wire the new cabinet outputs to the handlers', () => {
      expect(appHtml).toMatch(/\(viewClientMatrix\)\s*=\s*"openClientMatrix\(\$event\)"/);
      expect(appHtml).toMatch(/\(viewClientAiReport\)\s*=\s*"openClientAiReport\(\$event\)"/);
    });

    it('app.component.html should wire the universe viewIntro event to onUniverseBack (context-aware)', () => {
      // The previous wiring was `(viewIntro)="goToIntro()"`. After the
      // fix, the universe back goes through a context-aware handler so
      // specialist matrix users land back in the cabinet, not intro.
      expect(appHtml).toMatch(/\(viewIntro\)\s*=\s*"onUniverseBack\(\)"/);
    });

    it('app.component.html should NOT bind the removed (viewClientReport) output', () => {
      // Regression guard: the binding was removed because the old
      // `openClientReport` handler did the same thing as
      // `openClientAiReport`. If someone re-adds it, the two buttons
      // will behave identically again.
      expect(appHtml).not.toMatch(/\(viewClientReport\)\s*=/);
    });
  });

  describe('"Download report" button — TXT report builder', () => {
    // The user reported that "View report" and "View AI report" did the
    // same thing (both opened the specialist-client-view with the AI
    // narrative). The fix makes "View report" trigger a LOCAL TXT
    // download of all 64 answers + dimensional expressions + metadata,
    // leaving "View AI report" to do the actual narrative view.
    //
    // The download runs in the cabinet (no parent event) because it is
    // a pure browser side-effect. This describe block pins the new
    // method, the helper that formats the TXT body, the likert label
    // mapping, the filename builder, and the report.* i18n keys.

    it('component should expose the report-builder helpers', () => {
      expect(componentTs).toMatch(/formatClientReportText\s*\(/);
      expect(componentTs).toMatch(/likertLabel\s*\(/);
      expect(componentTs).toMatch(/reportFilename\s*\(/);
      expect(componentTs).toMatch(/triggerTextDownload\s*\(/);
    });

    it('component should import ASSESSMENT_QUESTIONS for the 64-question loop', () => {
      expect(componentTs).toMatch(/import\s*\{[^}]*ASSESSMENT_QUESTIONS[^}]*\}/);
    });

    it('likertLabel maps 0..5 to (not answered) / Strongly Disagree..Strongly Agree', () => {
      // Pin the mapping by code-shape — the actual labels come from
      // translations.ts and are tested separately below. The mapping is
      // what the test pins: 0 = unanswered, 1 = strongest disagree,
      // 5 = strongest agree. We use a simple regex to extract the
      // method body (which is bracket-delimited, so the lazy match
      // is reliable for this single-line-of-branches shape).
      const block = componentTs.match(/likertLabel\s*\(\s*value\s*:\s*number\s*\)\s*:\s*string\s*\{([\s\S]*?)\n\s+\}/);
      expect(block).not.toBeNull();
      const body = block![1];
      // 0 → unanswered
      expect(body).toMatch(/value\s*<=\s*0/);
      // 1..5 each have a branch in order
      for (const v of [1, 2, 3, 4, 5]) {
        expect(body).toMatch(new RegExp(`value\\s*===\\s*${v}`));
      }
    });

    it('formatClientReportText iterates all 64 questions in 4 sections of 12', () => {
      // Use a simple non-anchored substring check instead of a method-body
      // extraction. The important shape properties:
      //   - 4 section keys referenced in order
      //   - inner loop bounded by 12
      //   - each line has the response value, the likert label, and a separator
      const sections = ['agency', 'temperature', 'focus', 'attachment'];
      let lastIdx = -1;
      for (const s of sections) {
        const idx = componentTs.indexOf(`'assessment.questions.${s}'`);
        expect(idx).toBeGreaterThan(lastIdx);
        lastIdx = idx;
      }
      // The inner loop must iterate 12 questions per section (4 × 12 = 64).
      expect(componentTs).toMatch(/i\s*<\s*12/);
      // Each line includes the response value, the likert label, and a separator arrow.
      expect(componentTs).toMatch(/qIndex\s*\+\s*1/);
      expect(componentTs).toMatch(/likertLabel\s*\(/);
      expect(componentTs).toMatch(/->/);
    });

    it('reportFilename uses email (or UID fallback), sanitises it, and includes a date stamp', () => {
      // Filename must include the assessment prefix and `.txt` extension.
      expect(componentTs).toMatch(/archetypeai_report_/);
      expect(componentTs).toMatch(/\.txt/);
      // The handle must fall back to the UID when email is missing.
      expect(componentTs).toMatch(/client\.clientEmail\s*\|\|\s*client\.clientUid/);
      // Non-alphanumerics must be sanitised to underscores (filename safety).
      expect(componentTs).toMatch(/replace\(/);
    });

    it('triggerTextDownload uses a Blob + invisible anchor (no window in SSR)', () => {
      // SSR-safe early return.
      expect(componentTs).toMatch(/typeof\s+window\s*===\s*'undefined'/);
      // Blob + URL.createObjectURL + anchor click.
      expect(componentTs).toMatch(/new\s+Blob\s*\(/);
      expect(componentTs).toMatch(/URL\.createObjectURL\s*\(/);
      expect(componentTs).toMatch(/\.click\s*\(\s*\)/);
      // Anchor is removed from the DOM after click.
      expect(componentTs).toMatch(/removeChild\s*\(\s*a\s*\)/);
    });

    it('translations.ts should declare the report.* block in BOTH en and ru', () => {
      // The TXT body uses ~20 report.* labels. The structural check is
      // that BOTH the en and ru trees have a `report: { ... }` block;
      // per-key string values are checked separately to catch missing
      // translations without coupling the test to indentation rules.
      expect(translationsTs).toMatch(/en:\s*\{[\s\S]*?\bcabinet:[\s\S]*?\breport:\s*\{/);
      expect(translationsTs).toMatch(/ru:\s*\{[\s\S]*?\bcabinet:[\s\S]*?\breport:\s*\{/);
    });

    it('translations.ts should contain the English AND Russian values for each report.* key', () => {
      // The simplest robust check: each key's English value appears in
      // the file AND its Russian value appears in the file. If either
      // is missing, the user-facing download would show a raw key in
      // one of the two languages.
      const enRuPairs: Array<[string, string]> = [
        ['ArchetypeAI Assessment Report', 'Отчёт об оценке ArchetypeAI'],
        ['Completed', 'Завершено'],
        ['Scoring method', 'Метод оценки'],
        ['deterministic', 'точный расчёт'],
        ['fallback (no AI narrative available)', 'резервный (ИИ-нарратив недоступен)'],
        ['Dimensional Expressions', 'Размерные выражения'],
        ['All 64 Answers', 'Все 64 ответа'],
        ['(not answered)', '(не отвечено)'],
        ['Strongly Disagree', 'Полностью не согласен'],
        ['Disagree', 'Не согласен'],
        ['Neutral', 'Нейтрально'],
        ['Agree', 'Согласен'],
        ['Strongly Agree', 'Полностью согласен'],
        ['Generated by ArchetypeAI', 'Создано ArchetypeAI'],
      ];
      for (const [en, ru] of enRuPairs) {
        if (!translationsTs.includes(en)) {
          throw new Error(`English value "${en}" missing from translations.ts`);
        }
        if (!translationsTs.includes(ru)) {
          throw new Error(`Russian value "${ru}" missing from translations.ts`);
        }
      }
    });

    it('translations.ts should declare downloadClientReport + downloadClientReportAria in BOTH en and ru', () => {
      // The button label and ARIA hint for the new "Download report" row.
      const newKeys = ['downloadClientReport', 'downloadClientReportAria'];
      for (const key of newKeys) {
        const enMatch = new RegExp(`en:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        const ruMatch = new RegExp(`ru:\\s*\\{[\\s\\S]*?${key}\\s*:`);
        if (!enMatch.test(translationsTs)) {
          throw new Error(`en.${key} must be defined in translations.ts`);
        }
        if (!ruMatch.test(translationsTs)) {
          throw new Error(`ru.${key} must be defined in translations.ts`);
        }
      }
    });
  });
});
