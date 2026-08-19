import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app.component';
import { VisualizationService } from './services/webxr.service';
import { GeminiService, ChatMessage } from './services/gemini.service';
import { TranslationService } from './services/translation.service';
import { AUTH_PORT } from './app/core/ports/auth.port';
import { STORAGE_PORT } from './app/core/ports/storage.port';
import { of, BehaviorSubject } from 'rxjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AppComponent', () => {
  let component: AppComponent;
  let visualizationService: VisualizationService;
  let mockAuthPort: any;
  let mockStoragePort: any;

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    mockAuthPort = {
      signInAnonymously: vi.fn().mockResolvedValue(undefined),
      signInWithGoogle: vi.fn().mockResolvedValue(undefined),
      signInWithGoogleRedirect: vi.fn().mockResolvedValue(undefined),
      signInWithEmail: vi.fn().mockResolvedValue(undefined),
      signUpWithEmail: vi.fn().mockResolvedValue(undefined),
      linkAnonymousToGoogle: vi.fn().mockResolvedValue(undefined),
      linkAnonymousToGoogleRedirect: vi.fn().mockResolvedValue(undefined),
      linkAnonymousToEmail: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
      user$: of({ uid: 'anon', email: null, displayName: null, isAnonymous: true }),
      isAuthenticated$: of(false),
    };

    mockStoragePort = {
      saveAssessment: vi.fn().mockResolvedValue(undefined),
      loadAssessment: vi.fn().mockResolvedValue(null),
      saveToHistory: vi.fn().mockResolvedValue('id'),
      loadHistory: vi.fn().mockResolvedValue([]),
      createShareCode: vi.fn().mockResolvedValue('code1234'),
      loadShared: vi.fn().mockResolvedValue(null),
      loadSharedWithUid: vi.fn().mockResolvedValue(null),
      saveSynastryConnection: vi.fn().mockResolvedValue('partner'),
      saveSynastryReport: vi.fn().mockResolvedValue(undefined),
      listSynastryReports: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ChangeDetectorRef,
          useValue: {
            detectChanges: vi.fn(),
            markForCheck: vi.fn(),
          },
        },
        { provide: AUTH_PORT, useValue: mockAuthPort },
        { provide: STORAGE_PORT, useValue: mockStoragePort },
        VisualizationService,
        GeminiService,
        TranslationService,
      ],
    }).compileComponents();

    component = TestBed.runInInjectionContext(() => new AppComponent());
    visualizationService = TestBed.inject(VisualizationService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start in loading state', () => {
      expect(component.appState()).toBe('loading');
    });

    it('should have empty search query', () => {
      expect(component.searchQuery()).toBe('');
    });

    it('should have empty coach messages', () => {
      expect(component.coachMessages().length).toBe(0);
    });

    it('should not be comparing', () => {
      expect(component.isComparing()).toBe(false);
    });

    it('should have no isolated dimension', () => {
      expect(component.isolatedDimension()).toBeNull();
    });
  });

  describe('assessment flow', () => {
    it('should have 64 assessment questions', () => {
      expect(component.assessmentQuestions.length).toBe(64);
    });

    it('startAssessment should transition to assessment state', () => {
      component.startAssessment();
      expect(component.appState()).toBe('assessment');
    });

    it('startAssessment should initialize responses array', () => {
      component.startAssessment();
      expect(component.assessmentResponses().length).toBe(64);
    });

    it('startAssessment should clear previous results', () => {
      component.startAssessment();
      expect(component.assessmentResults()).toBeNull();
    });

    it('restartAssessment should clear persisted state and start fresh', () => {
      localStorage.setItem('ARCHETYPE_ASSESSMENT_RESPONSES', '1');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
      component.startAssessment();
      component.restartAssessment();
      expect(removeSpy).toHaveBeenCalledWith('ARCHETYPE_ASSESSMENT_RESPONSES');
      expect(localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES')).toBeNull();
      expect(component.appState()).toBe('assessment');
      expect(component.assessmentResponses().length).toBe(64);
    });

    it('onAssessmentCompleted should route anonymous users through the sign-up gate', () => {
      const responses = new Array(64).fill(3);
      component.onAssessmentCompleted(responses);
      expect(component.appState()).toBe('assessment-gate');
      expect(component.showSavePrompt()).toBe(true);
    });

    it('dismissSavePrompt should continue to results after the gate', () => {
      const responses = new Array(64).fill(3);
      component.onAssessmentCompleted(responses);
      component.dismissSavePrompt();
      expect(component.appState()).toBe('assessment-results');
    });

    it('skipGateAndDownload should dismiss the gate without leaving a stuck modal', () => {
      const responses = new Array(64).fill(3);
      component.onAssessmentCompleted(responses);
      expect(component.appState()).toBe('assessment-gate');
      expect(component.showSavePrompt()).toBe(true);
      component.skipGateAndDownload();
      expect(component.appState()).toBe('assessment-results');
      expect(component.showSavePrompt()).toBe(false);
    });

    it('skipGateAndDownload should silently no-op download when no responses (e.g. backup-restore path)', () => {
      // No responses set — must not throw, must not crash the gate flow.
      component.appState.set('assessment-gate');
      expect(() => component.skipGateAndDownload()).not.toThrow();
      expect(component.appState()).toBe('assessment-results');
    });

    it('downloadAssessmentBackupFromGate should be a no-op when no responses are set', () => {
      // Guard against calling it on a fresh state.
      expect(() => component.downloadAssessmentBackupFromGate()).not.toThrow();
    });

    it('restoreLocalBackup should resume analysis from a draft backup (results missing)', () => {
      const responses = new Array(64).fill(3);
      localStorage.setItem('ARCHETYPE_COMPLETED_BACKUP', JSON.stringify({
        app: 'ArchetypeAI',
        version: 1,
        timestamp: new Date().toISOString(),
        dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
        assessmentResponses: responses,
        results: null,
      }));

      component.restoreLocalBackup();

      expect(component.appState()).toBe('assessment-results');
      expect(component.assessmentResponses().length).toBe(64);
      expect(component.assessmentResults()).toBeNull();
    });

    it('onBackupUploaded should resume incomplete backups instead of fabricating results', () => {
      const responses = new Array(64).fill(3);
      responses[7] = 0;
      const payload = JSON.stringify({ assessmentResponses: responses });

      class MockFileReader {
        onload: ((ev: { target: { result: string } }) => void) | null = null;
        readAsText(): void {
          this.onload?.({ target: { result: payload } });
        }
      }

      vi.stubGlobal('FileReader', MockFileReader as any);
      component.appState.set('intro');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      });

      component.onBackupUploaded({ target: input } as unknown as Event);

      expect(component.appState()).toBe('assessment');
      expect(component.assessmentResponses()[7]).toBe(0);
      expect(localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES')).toBe(JSON.stringify(responses));
    });

    it('onBackupUploaded should not trust embedded results when responses are incomplete', () => {
      const responses = new Array(64).fill(3);
      responses[7] = 0;
      const payload = JSON.stringify({
        assessmentResponses: responses,
        results: { pantheon: [{ name: 'X', prominence: 100 }] }
      });

      class MockFileReader {
        onload: ((ev: { target: { result: string } }) => void) | null = null;
        readAsText(): void {
          this.onload?.({ target: { result: payload } });
        }
      }

      vi.stubGlobal('FileReader', MockFileReader as any);
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);
      component.appState.set('intro');

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      });

      component.onBackupUploaded({ target: input } as unknown as Event);

      expect(viewSpy).not.toHaveBeenCalled();
      expect(component.appState()).toBe('assessment');
      expect(component.assessmentResponses()[7]).toBe(0);
    });

    it('onSynastryFileUploaded should reject incomplete backups', () => {
      const responses = new Array(64).fill(3);
      responses[12] = 0;
      const payload = JSON.stringify({ assessmentResponses: responses });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      class MockFileReader {
        onload: ((ev: { target: { result: string } }) => void) | null = null;
        readAsText(): void {
          this.onload?.({ target: { result: payload } });
        }
      }

      vi.stubGlobal('FileReader', MockFileReader as any);

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      });

      component.onSynastryFileUploaded({ target: input } as unknown as Event);

      expect(component.synastryPartnerResponses().length).toBe(0);
      expect(alertSpy).toHaveBeenCalled();
    });

    it('onSynastryFileUploaded should preserve zero values in legacy raw data', () => {
      const payload = JSON.stringify({
        type: 'ArchetypeAI_Assessment_RawData',
        data: new Array(64).fill(null).map((_, i) => ({ response: i === 12 ? 0 : 3 }))
      });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      class MockFileReader {
        onload: ((ev: { target: { result: string } }) => void) | null = null;
        readAsText(): void {
          this.onload?.({ target: { result: payload } });
        }
      }

      vi.stubGlobal('FileReader', MockFileReader as any);

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      });

      component.onSynastryFileUploaded({ target: input } as unknown as Event);

      expect(component.synastryPartnerResponses().length).toBe(0);
      expect(alertSpy).toHaveBeenCalled();
    });

    it('onSynastryFileUploaded should accept a complete download-format backup and populate synastryPartnerResponses', () => {
      const responses = new Array(64).fill(3);
      const payload = JSON.stringify({ assessmentResponses: responses, partnerUid: 'p-1' });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      class MockFileReader {
        onload: ((ev: { target: { result: string } }) => void) | null = null;
        readAsText(): void {
          this.onload?.({ target: { result: payload } });
        }
      }

      vi.stubGlobal('FileReader', MockFileReader as any);

      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      });

      component.onSynastryFileUploaded({ target: input } as unknown as Event);

      expect(alertSpy).not.toHaveBeenCalled();
      expect(component.synastryPartnerResponses().length).toBe(64);
      expect(component.synastryPartnerResponses()[12]).toBe(3);
    });
  });

  describe('goToIntro()', () => {
    it('should transition to intro state and reset overlays', () => {
      component.appState.set('universe');
      component.isCoachPanelOpen.set(true);
      component.isSynastryOpen.set(true);
      component.isHelpPanelOpen.set(true);
      component.universeLoading.set(true);
      component.initError.set('boom');
      component.goToIntro();
      expect(component.appState()).toBe('intro');
      expect(component.isCoachPanelOpen()).toBe(false);
      expect(component.isSynastryOpen()).toBe(false);
      expect(component.isHelpPanelOpen()).toBe(false);
      expect(component.universeLoading()).toBe(false);
      expect(component.initError()).toBeNull();
    });
  });

  describe('enterUniverse()', () => {
    it('should clear personal constellation and initialize the scene', async () => {
      const canvas = document.createElement('canvas');
      (component as any).canvas = () => ({ nativeElement: canvas });
      vi.spyOn(component as any, 'waitForNextRender').mockResolvedValue(undefined);
      vi.spyOn(component as any, 'initializeUniverse').mockResolvedValue(undefined);
      vi.spyOn(component as any, 'waitForSceneReady').mockResolvedValue(undefined);
      visualizationService.personalConstellation.set([{ archetypeId: 'test', percentage: 100 }]);
      await component.enterUniverse();
      expect(visualizationService.personalConstellation()).toBeNull();
      expect(component.appState()).toBe('universe');
      expect(component.universeLoading()).toBe(false);
    });
  });

  describe('openCabinetUniverse() (cabinet "See Universe" routing)', () => {
    it('should route to the PERSONALIZED view when the user has saved results', async () => {
      // Spy on the two downstream entry points and verify which one we land in.
      const enterSpy = vi.spyOn(component, 'enterUniverse').mockResolvedValue(undefined);
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);

      // Pretend the user has results from a completed assessment.
      (component as any).assessmentResults.set({
        analysis: '',
        pantheon: [{ id: 'gift_a', name: 'Test', description: '', cluster: 'gift_archetypes' }],
      });

      await (component as any).openCabinetUniverse();

      expect(viewSpy).toHaveBeenCalledTimes(1);
      expect(enterSpy).not.toHaveBeenCalled();
    });

    it('should reconstruct the PERSONALIZED view from completed responses even if saved results are missing', async () => {
      const enterSpy = vi.spyOn(component, 'enterUniverse').mockResolvedValue(undefined);
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);

      (component as any).assessmentResults.set(null);
      (component as any).assessmentResponses.set(new Array(64).fill(3));

      await (component as any).openCabinetUniverse();

      expect(viewSpy).toHaveBeenCalledTimes(1);
      expect(enterSpy).not.toHaveBeenCalled();
    });

    it('should fall back to the full universe when the user has no saved results yet', async () => {
      const enterSpy = vi.spyOn(component, 'enterUniverse').mockResolvedValue(undefined);
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);

      (component as any).assessmentResults.set(null);
      (component as any).assessmentResponses.set([]);

      await (component as any).openCabinetUniverse();

      expect(enterSpy).toHaveBeenCalledTimes(1);
      expect(viewSpy).not.toHaveBeenCalled();
    });

    it('should fall back to the full universe when results exist but pantheon is empty', async () => {
      const enterSpy = vi.spyOn(component, 'enterUniverse').mockResolvedValue(undefined);
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);

      (component as any).assessmentResults.set({ analysis: '', pantheon: [] });

      await (component as any).openCabinetUniverse();

      expect(enterSpy).toHaveBeenCalledTimes(1);
      expect(viewSpy).not.toHaveBeenCalled();
    });
  });

  describe('openClientMatrix() (admin cabinet matrix routing)', () => {
    it('should open the universe when a client has responses but no saved results blob', async () => {
      const viewSpy = vi.spyOn(component, 'viewMyUniverse').mockResolvedValue(undefined);
      const loadSpy = vi.spyOn((component as any), 'loadClientAssessmentData').mockResolvedValueOnce({
        responses: new Array(64).fill(3),
        dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
        results: null,
        scoringMethod: 'deterministic',
        updatedAt: new Date().toISOString(),
      });

      await component.openClientMatrix({ clientUid: 'client-1', clientEmail: 'c@example.com' });

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(viewSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('markdown parsing', () => {
    it('should sanitize script tags from markdown', () => {
      const malicious = '<script>alert("xss")</script>';
      const result = component.parseMarkdown(malicious);
      expect(result).not.toContain('<script>');
    });

    it('should render basic markdown', () => {
      const result = component.parseMarkdown('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should sanitize iframe tags', () => {
      const malicious = '<iframe src="evil.com"></iframe>';
      const result = component.parseMarkdown(malicious);
      expect(result).not.toContain('<iframe');
    });
  });

  describe('toggleLanguage()', () => {
    it('should switch from en to ru', () => {
      const translationService = TestBed.inject(TranslationService);
      translationService.setLanguage('en');
      component.toggleLanguage();
      expect(translationService.getLanguage()).toBe('ru');
    });

    it('should toggle back', () => {
      const translationService = TestBed.inject(TranslationService);
      translationService.setLanguage('en');
      component.toggleLanguage(); // en -> ru
      component.toggleLanguage(); // ru -> en
      expect(translationService.getLanguage()).toBe('en');
    });
  });

  describe('cluster filters', () => {
    it('toggleClusterFilter should add and remove filters', () => {
      component.toggleClusterFilter('gift_archetypes');
      expect(component.activeClusterFilters().has('gift_archetypes')).toBe(true);
      component.toggleClusterFilter('gift_archetypes');
      expect(component.activeClusterFilters().has('gift_archetypes')).toBe(false);
    });
  });

  describe('comparison mode', () => {
    it('startCompareMode should set comparing and first archetype', () => {
      const archetype = visualizationService.allArchetypes()[0];
      component.startCompareMode(archetype);
      expect(component.isComparing()).toBe(true);
      expect(component.firstComparisonArchetype()).toBe(archetype);
    });

    it('exitCompareMode should clear comparison state', () => {
      const archetype = visualizationService.allArchetypes()[0];
      component.startCompareMode(archetype);
      component.exitCompareMode();
      expect(component.isComparing()).toBe(false);
      expect(component.firstComparisonArchetype()).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('sign-in flows (bug regression guards)', () => {
    function makeInput(value: string): HTMLInputElement {
      const el = document.createElement('input');
      (el as any).value = value;
      return el;
    }

    it('loginSignInEmailFromModal should sign in directly (no link attempt) and route to cabinet', async () => {
      mockAuthPort.signInWithEmail.mockClear();
      mockAuthPort.linkAnonymousToEmail.mockClear();
      // Pretend the user is anonymous
      mockAuthPort.user$ = of({ uid: 'anon-1', email: null, displayName: null, isAnonymous: true });
      // Re-create the component to pick up the new user$ behavior
      component = TestBed.runInInjectionContext(() => new AppComponent());

      await (component as any).loginSignInEmailFromModal(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      expect(mockAuthPort.linkAnonymousToEmail).not.toHaveBeenCalled();
      expect(mockAuthPort.signInWithEmail).toHaveBeenCalledWith('user@example.com', 'password123');
      expect((component as any).isLoginModalOpen()).toBe(false);
      expect((component as any).appState()).toBe('cabinet');
    });

    it('loginWithGoogleFromModal should use a single signInWithGoogle call (no link popup) and route to cabinet', async () => {
      mockAuthPort.signInWithGoogle.mockClear();
      mockAuthPort.linkAnonymousToGoogle.mockClear();
      mockAuthPort.user$ = of({ uid: 'anon-1', email: null, displayName: null, isAnonymous: true });
      component = TestBed.runInInjectionContext(() => new AppComponent());

      await (component as any).loginWithGoogleFromModal();

      expect(mockAuthPort.linkAnonymousToGoogle).not.toHaveBeenCalled();
      expect(mockAuthPort.signInWithGoogle).toHaveBeenCalledTimes(1);
      expect((component as any).isLoginModalOpen()).toBe(false);
      expect((component as any).appState()).toBe('cabinet');
    });

    // ---- Gate-flow "Sign in with Google" regression guards ----------------
    // The bug: anonymous users completing the assessment see the gate, click
    // "Sign in with Google", and got TWO popups in a row. The first tried to
    // link their anonymous UID to their Google account; when that failed with
    // auth/credential-already-in-use (the Google account already exists in
    // Firebase), the code fell back to a second signInWithGoogle() popup.
    // After both popups, the cabinet rendered the "Log in to unlock your
    // cabinet" screen because `appState.set('cabinet')` ran before the new
    // auth state propagated to the `currentUser` signal.
    //
    // The fix: link once (no fallback popup), and wait for the auth state to
    // propagate before routing to the cabinet.

    function makeUser(uid: string, isAnonymous: boolean) {
      return { uid, email: isAnonymous ? null : `${uid}@example.com`, displayName: null, isAnonymous };
    }

    it('signUpWithGoogle (gate) should use a single linkAnonymousToGoogle call when the user is anonymous', async () => {
      mockAuthPort.linkAnonymousToGoogle.mockClear();
      mockAuthPort.signInWithGoogle.mockClear();

      // BehaviorSubject replays the current value to new subscribers, so the
      // component's constructor subscription receives the anonymous user even
      // though we set it up before constructing the component.
      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');

      // Simulate the link resolving AND the auth state propagating (same UID, no longer anonymous)
      const propagate = () => userSubject.next(makeUser('anon-1', false));

      // The link call resolves on the next microtask
      mockAuthPort.linkAnonymousToGoogle.mockImplementation(async () => {
        // Match real Firebase behavior: auth state propagates inside the SDK
        // on the next microtask after the link promise resolves.
        await Promise.resolve();
        propagate();
      });

      await (component as any).signUpWithGoogle();

      // ONE popup, not two
      expect(mockAuthPort.linkAnonymousToGoogle).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.signInWithGoogle).not.toHaveBeenCalled();

      // Cabinet rendered, not the "Log in" screen
      expect((component as any).appState()).toBe('cabinet');
      expect((component as any).authError()).toBeNull();
    });

    it('signUpWithGoogle (gate) should NOT fall back to a second popup on credential-already-in-use', async () => {
      mockAuthPort.linkAnonymousToGoogle.mockClear();
      mockAuthPort.signInWithGoogle.mockClear();

      mockAuthPort.user$ = of(makeUser('anon-1', true));
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');

      // The Google account already exists in Firebase — link fails
      const linkError: any = new Error('credential already in use');
      linkError.code = 'auth/credential-already-in-use';
      mockAuthPort.linkAnonymousToGoogle.mockRejectedValue(linkError);

      await (component as any).signUpWithGoogle();

      // The fix: NO second popup, NO signInWithGoogle call
      expect(mockAuthPort.linkAnonymousToGoogle).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.signInWithGoogle).not.toHaveBeenCalled();

      // User sees a clear error explaining the situation
      const err = (component as any).authError();
      expect(err).toBeTruthy();
      expect(String(err)).toMatch(/already linked/);

      // User stays on the gate so they can use "Skip & download backup"
      expect((component as any).appState()).toBe('assessment-gate');
    });

    it('signUpWithGoogle (gate) should wait for auth state propagation before routing to cabinet', async () => {
      // The bug: linkWithPopup resolves before onAuthStateChanged propagates
      // to the Angular signal. Without a wait, appState.set('cabinet') runs
      // while currentUser() is still the anonymous user → the cabinet
      // renders the "Log in to unlock your cabinet" screen.
      mockAuthPort.linkAnonymousToGoogle.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');

      // Simulate real Firebase behavior: link resolves BEFORE the auth state
      // propagates. The auth-state emission comes on a later microtask.
      mockAuthPort.linkAnonymousToGoogle.mockImplementation(async () => {
        // Do NOT emit the new user here — emit it later to prove the wait works.
      });

      // Kick off signUpWithGoogle (don't await yet)
      const promise = (component as any).signUpWithGoogle();

      // Give the link microtask a chance to resolve
      await Promise.resolve();
      await Promise.resolve();

      // At this point: link has resolved but auth state has NOT propagated.
      // The cabinet must still be hidden / still be the gate, because
      // currentUser is still anonymous.
      expect((component as any).appState()).toBe('assessment-gate');
      expect((component as any).currentUser().isAnonymous).toBe(true);

      // NOW the auth state propagates
      userSubject.next(makeUser('anon-1', false));

      // The wait should resolve and routing should continue
      await promise;

      expect((component as any).appState()).toBe('cabinet');
      expect((component as any).currentUser().isAnonymous).toBe(false);
    });

    it('signUpWithGoogle (gate) should not route to cabinet if the auth state never becomes non-anonymous', async () => {
      // Defensive: if for any reason the auth state fails to propagate within
      // the timeout, the gate should remain visible and the user should see
      // an error, not a broken cabinet.
      mockAuthPort.linkAnonymousToGoogle.mockClear();
      mockAuthPort.signInWithGoogle.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');

      // Link resolves but no auth-state change is ever emitted
      mockAuthPort.linkAnonymousToGoogle.mockResolvedValue(undefined);

      // Use fake timers so the production 3-second propagation timeout
      // doesn't slow the test suite.
      vi.useFakeTimers();
      try {
        const promise = (component as any).signUpWithGoogle();
        await vi.advanceTimersByTimeAsync(3000);
        await promise;
      } finally {
        vi.useRealTimers();
      }

      // The cabinet was never reached; we surfaced an error to the user
      expect((component as any).appState()).toBe('assessment-gate');
      expect((component as any).authError()).toBeTruthy();
    });

    it('loadFromCloud must not override a freshly-set cabinet state with assessment (race-condition guard)', async () => {
      // Simulate "user just signed in via the modal" by pre-setting cabinet state.
      (component as any).appState.set('cabinet');

      // Pretend the user has stale incomplete responses in the cloud.
      const incomplete = new Array(64).fill(3);
      incomplete[5] = 0; // 0 sentinel = incomplete
      mockStoragePort.loadAssessment.mockResolvedValueOnce({
        responses: incomplete,
        dimensionalExpressions: {} as any,
        results: null,
        scoringMethod: 'deterministic',
        updatedAt: new Date().toISOString(),
      });

      await (component as any).loadFromCloud('uid-123');

      // State must remain at cabinet — loadFromCloud must not push the user
      // into the assessment screen after a fresh sign-in.
      expect((component as any).appState()).toBe('cabinet');
    });

    it('loadFromCloud should still route a returning user (intro state) with complete responses to cabinet', async () => {
      (component as any).appState.set('intro');

      const complete = new Array(64).fill(3);
      mockStoragePort.loadAssessment.mockResolvedValueOnce({
        responses: complete,
        dimensionalExpressions: {} as any,
        results: null,
        scoringMethod: 'deterministic',
        updatedAt: new Date().toISOString(),
      });

      await (component as any).loadFromCloud('uid-456');

      expect((component as any).appState()).toBe('cabinet');
    });
  });

  // ---------------------------------------------------------------------------
  // Email sign-up flow (bug regression guards)
  //
  // The bug: signing up with email (NOT Google) sent the user "back to the
  // main screen" instead of routing to the cabinet, and a follow-up sign-in
  // attempt with the same credentials returned `auth/invalid-credential`.
  //
  // Root cause: the email sign-up paths (gate and modal) did not wait for
  // the auth state to propagate to the `currentUser` signal before closing
  // the form / routing. This let the post-auth `loadFromCloud` race ahead
  // and push the user to the wrong screen. The gate flow also auto-closed
  // the form BEFORE persistToCloud, so any failure left the user stranded.
  //
  // The fix: mirror the `signUpWithGoogle` pattern — `waitForAuthPropagation`
  // after the auth call, move the gate-close to AFTER the propagation check,
  // and add `auth/email-already-in-use` handling in the gate flow (the modal
  // already had it).
  // ---------------------------------------------------------------------------
  describe('email sign-up flows (bug regression guards)', () => {
    function makeInput(value: string): HTMLInputElement {
      const el = document.createElement('input');
      (el as any).value = value;
      return el;
    }

    function makeUser(uid: string, isAnonymous: boolean) {
      return { uid, email: isAnonymous ? null : `${uid}@example.com`, displayName: null, isAnonymous };
    }

    // ---- Gate flow (assessment-gate → signUpWithEmail) -------------------

    it('signUpWithEmail (gate) should link anonymous user and route to cabinet', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();
      mockAuthPort.signUpWithEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);
      (component as any).saveEmailForm.set(true);

      // Link resolves AND auth state propagates (same UID, no longer anonymous)
      mockAuthPort.linkAnonymousToEmail.mockImplementation(async () => {
        await Promise.resolve();
        userSubject.next(makeUser('anon-1', false));
      });

      await (component as any).signUpWithEmail(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      // ONE link call (NOT a signUpWithEmail)
      expect(mockAuthPort.linkAnonymousToEmail).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.signUpWithEmail).not.toHaveBeenCalled();
      expect(mockAuthPort.linkAnonymousToEmail).toHaveBeenCalledWith('user@example.com', 'password123');

      // Cabinet rendered, gate closed, form closed
      expect((component as any).appState()).toBe('cabinet');
      expect((component as any).showSavePrompt()).toBe(false);
      expect((component as any).saveEmailForm()).toBe(false);
      expect((component as any).authError()).toBeNull();
      expect((component as any).currentUser().isAnonymous).toBe(false);
    });

    it('signUpWithEmail (gate) should create a brand-new account when user is NOT anonymous', async () => {
      mockAuthPort.signUpWithEmail.mockClear();
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('signed-in', false));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);

      mockAuthPort.signUpWithEmail.mockImplementation(async () => {
        await Promise.resolve();
        // (Auth state already non-anonymous in this test, no propagation needed.)
      });

      await (component as any).signUpWithEmail(
        makeInput('new@example.com'),
        makeInput('password123'),
      );

      expect(mockAuthPort.signUpWithEmail).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.linkAnonymousToEmail).not.toHaveBeenCalled();
      expect((component as any).appState()).toBe('cabinet');
    });

    it('signUpWithEmail (gate) should show a clear error and KEEP the form open on auth/email-already-in-use', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);
      (component as any).saveEmailForm.set(true);

      const linkError: any = new Error('email already in use');
      linkError.code = 'auth/email-already-in-use';
      mockAuthPort.linkAnonymousToEmail.mockRejectedValue(linkError);

      await (component as any).signUpWithEmail(
        makeInput('taken@example.com'),
        makeInput('password123'),
      );

      // Form must stay open so the user can switch to "Sign in" or try a
      // different email. This is the bug the user hit: previously the form
      // would close prematurely, stranding them on a blank page.
      expect((component as any).showSavePrompt()).toBe(true);
      expect((component as any).saveEmailForm()).toBe(true);
      expect((component as any).appState()).toBe('assessment-gate');

      // Error message is the localized, user-friendly one — not the raw
      // Firebase message with the "auth/email-already-in-use" code.
      const err = (component as any).authError();
      expect(err).toBeTruthy();
      expect(String(err)).not.toMatch(/auth\/email-already-in-use/);
      expect(String(err)).toMatch(/already exists|уже существует/i);
    });

    it('signUpWithEmail (gate) should keep the form open on link failure (generic error)', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);
      (component as any).saveEmailForm.set(true);

      mockAuthPort.linkAnonymousToEmail.mockRejectedValue(new Error('network down'));

      await (component as any).signUpWithEmail(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      // Form stays open with the raw error
      expect((component as any).showSavePrompt()).toBe(true);
      expect((component as any).saveEmailForm()).toBe(true);
      expect((component as any).appState()).toBe('assessment-gate');
      expect((component as any).authError()).toBe('network down');
    });

    it('signUpWithEmail (gate) should NOT close the gate before auth state propagates', async () => {
      // The bug: linkWithCredential resolves before onAuthStateChanged
      // propagates to the Angular signal. Without a wait, the gate was
      // closed while currentUser was still anonymous, and the cabinet
      // either rendered the "Log in" screen or got pushed to assessment
      // by a race with loadFromCloud.
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);
      (component as any).saveEmailForm.set(true);

      // Link resolves but auth state does NOT propagate yet
      mockAuthPort.linkAnonymousToEmail.mockImplementation(async () => {
        // No userSubject.next(...) — auth state stays anonymous
      });

      // Kick off sign-up (don't await)
      const promise = (component as any).signUpWithEmail(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      // Microtasks: link resolved, but propagation still pending
      await Promise.resolve();
      await Promise.resolve();

      // Gate must still be visible (showSavePrompt=true) and the form
      // (saveEmailForm=true). The state must NOT have changed yet.
      expect((component as any).showSavePrompt()).toBe(true);
      expect((component as any).saveEmailForm()).toBe(true);
      expect((component as any).appState()).toBe('assessment-gate');
      expect((component as any).currentUser().isAnonymous).toBe(true);

      // Now propagate
      userSubject.next(makeUser('anon-1', false));

      await promise;

      // Now everything resolves: gate closes, state moves to cabinet
      expect((component as any).appState()).toBe('cabinet');
      expect((component as any).showSavePrompt()).toBe(false);
      expect((component as any).currentUser().isAnonymous).toBe(false);
    });

    it('signUpWithEmail (gate) should surface a clear error if the auth state never becomes non-anonymous', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);

      mockAuthPort.linkAnonymousToEmail.mockResolvedValue(undefined);

      vi.useFakeTimers();
      try {
        const promise = (component as any).signUpWithEmail(
          makeInput('user@example.com'),
          makeInput('password123'),
        );
        await vi.advanceTimersByTimeAsync(3000);
        await promise;
      } finally {
        vi.useRealTimers();
      }

      // Cabinet was never reached; the user sees a clear error and the
      // form stays open so they can retry or refresh.
      expect((component as any).appState()).toBe('assessment-gate');
      expect((component as any).authError()).toBeTruthy();
      expect(String((component as any).authError())).toMatch(/propagate|did not/i);
    });

    it('signUpWithEmail (gate) should set authError for short passwords (validation guard)', async () => {
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).appState.set('assessment-gate');
      (component as any).showSavePrompt.set(true);
      (component as any).saveEmailForm.set(true);

      await (component as any).signUpWithEmail(
        makeInput('user@example.com'),
        makeInput('12345'),
      );

      expect(mockAuthPort.linkAnonymousToEmail).not.toHaveBeenCalled();
      expect(mockAuthPort.signUpWithEmail).not.toHaveBeenCalled();
      expect((component as any).authError()).toBeTruthy();
      // Form stays open
      expect((component as any).showSavePrompt()).toBe(true);
      expect((component as any).saveEmailForm()).toBe(true);
    });

    // ---- Modal flow (login modal → loginCreateAccountEmailFromModal) ------

    it('loginCreateAccountEmailFromModal should link anonymous user and route to cabinet', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();
      mockAuthPort.signUpWithEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());

      mockAuthPort.linkAnonymousToEmail.mockImplementation(async () => {
        await Promise.resolve();
        userSubject.next(makeUser('anon-1', false));
      });

      await (component as any).loginCreateAccountEmailFromModal(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      expect(mockAuthPort.linkAnonymousToEmail).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.signUpWithEmail).not.toHaveBeenCalled();
      expect((component as any).isLoginModalOpen()).toBe(false);
      expect((component as any).appState()).toBe('cabinet');
      expect((component as any).loginError()).toBeNull();
    });

    it('loginCreateAccountEmailFromModal should create a brand-new account when user is NOT anonymous', async () => {
      mockAuthPort.signUpWithEmail.mockClear();
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('signed-in', false));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());

      await (component as any).loginCreateAccountEmailFromModal(
        makeInput('new@example.com'),
        makeInput('password123'),
      );

      expect(mockAuthPort.signUpWithEmail).toHaveBeenCalledTimes(1);
      expect(mockAuthPort.linkAnonymousToEmail).not.toHaveBeenCalled();
      expect((component as any).isLoginModalOpen()).toBe(false);
      expect((component as any).appState()).toBe('cabinet');
    });

    it('loginCreateAccountEmailFromModal should show a clear error and keep the modal open on auth/email-already-in-use', async () => {
      mockAuthPort.signUpWithEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(null);
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).isLoginModalOpen.set(true);

      const err: any = new Error('email already in use');
      err.code = 'auth/email-already-in-use';
      mockAuthPort.signUpWithEmail.mockRejectedValue(err);

      await (component as any).loginCreateAccountEmailFromModal(
        makeInput('taken@example.com'),
        makeInput('password123'),
      );

      // Modal must stay open so the user can switch to "Sign in"
      expect((component as any).isLoginModalOpen()).toBe(true);
      expect((component as any).appState()).not.toBe('cabinet');
      const loginError = (component as any).loginError();
      expect(loginError).toBeTruthy();
      expect(String(loginError)).not.toMatch(/auth\/email-already-in-use/);
      expect(String(loginError)).toMatch(/already exists|уже существует/i);
    });

    it('loginCreateAccountEmailFromModal should wait for auth state propagation before closing the modal', async () => {
      mockAuthPort.linkAnonymousToEmail.mockClear();

      const userSubject = new BehaviorSubject<any>(makeUser('anon-1', true));
      mockAuthPort.user$ = userSubject;
      component = TestBed.runInInjectionContext(() => new AppComponent());
      (component as any).isLoginModalOpen.set(true);

      // Link resolves, auth state NOT yet propagated
      mockAuthPort.linkAnonymousToEmail.mockImplementation(async () => {
        // No emission — propagation is delayed
      });

      const promise = (component as any).loginCreateAccountEmailFromModal(
        makeInput('user@example.com'),
        makeInput('password123'),
      );

      await Promise.resolve();
      await Promise.resolve();

      // Modal still open, no routing yet
      expect((component as any).isLoginModalOpen()).toBe(true);
      expect((component as any).appState()).not.toBe('cabinet');

      // Now propagate
      userSubject.next(makeUser('anon-1', false));

      await promise;

      expect((component as any).isLoginModalOpen()).toBe(false);
      expect((component as any).appState()).toBe('cabinet');
    });
  });

  describe('assessment history (bug regression guards)', () => {
    it('persistToCloud should save BOTH the current assessment and a history entry so the cabinet panel shows retests', async () => {
      mockStoragePort.saveAssessment.mockClear();
      mockStoragePort.saveToHistory.mockClear();

      // Signed-in user with completed responses
      mockAuthPort.user$ = of({
        uid: 'u-1', email: 'u@example.com', displayName: null, isAnonymous: false,
      });
      const c = TestBed.runInInjectionContext(() => new AppComponent());
      c.assessmentResponses.set(new Array(64).fill(3));
      c.assessmentResults.set({ analysis: '', pantheon: [] } as any);
      c.dimensionalExpressions.set({ AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 });

      await (c as any).persistToCloud();

      expect(mockStoragePort.saveAssessment).toHaveBeenCalledWith('u-1', expect.objectContaining({
        responses: expect.any(Array),
      }));
      expect(mockStoragePort.saveToHistory).toHaveBeenCalledWith('u-1', expect.objectContaining({
        responses: expect.any(Array),
      }));
    });

    it('onResultsReady should persist for ANONYMOUS users too (cross-device continuity for gate-skippers)', async () => {
      mockStoragePort.saveAssessment.mockClear();
      mockStoragePort.saveToHistory.mockClear();

      // Anonymous user (the default in the test bootstrap) with results
      const c = TestBed.runInInjectionContext(() => new AppComponent());
      c.assessmentResponses.set(new Array(64).fill(3));
      c.assessmentResults.set({ analysis: 'ok', pantheon: [] } as any);
      c.dimensionalExpressions.set({ AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 });

      c.onResultsReady({ analysis: 'ok', pantheon: [] } as any);

      // Wait for the async persistToCloud
      await new Promise(resolve => setTimeout(resolve, 0));
      await Promise.resolve();

      expect(mockStoragePort.saveAssessment).toHaveBeenCalled();
      expect(mockStoragePort.saveToHistory).toHaveBeenCalled();
    });
  });

  describe('AI Coach pipeline (regression guard for the 5-missing-methods bug + swap to standalone <app-coach-panel>)', () => {
    let generateCoachSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Default mocked response; individual tests can override per-case.
      generateCoachSpy = vi
        .spyOn(TestBed.inject(GeminiService), 'generateCoachResponse')
        .mockResolvedValue({
          response: '<p>Default mock reply</p>',
          suggestions: ['Follow-up A', 'Follow-up B']
        });
    });

    afterEach(() => {
      generateCoachSpy.mockRestore();
    });

    // ▒▒ New wiring (post-swap): <app-coach-panel> emits the user's text
    // via (sendMessageRequest) and AppComponent.onCoachPanelSend delegates
    // to the existing askCoach pipeline. The textarea/input/mode-toggle
    // UI now lives entirely inside the standalone component — so onCoachInput,
    // toggleCoachMode, coachPlaceholder, askSuggestedQuestion are gone.

    it('onCoachPanelSend should bail on whitespace input', async () => {
      await component.onCoachPanelSend('   ');
      expect(generateCoachSpy).not.toHaveBeenCalled();
      expect(component.isCoachLoading()).toBe(false);
    });

    it('onCoachPanelSend should seed coachQuestion and invoke askCoach', async () => {
      await component.onCoachPanelSend('hello from panel');
      const userMsgs = component.coachMessages().filter((m) => m.role === 'user');
      expect(userMsgs.length).toBe(1);
      expect(userMsgs[0].content).toBe('hello from panel');
      expect(component.coachSuggestions()).toEqual(['Follow-up A', 'Follow-up B']);
      expect(generateCoachSpy).toHaveBeenCalledTimes(1);
    });

    it('onCoachPanelSend should refuse a second dispatch while loading', async () => {
      let resolveSpy!: (v: any) => void;
      generateCoachSpy.mockReturnValueOnce(new Promise((r) => { resolveSpy = r; }));

      const firstCall = component.onCoachPanelSend('first');
      await component.onCoachPanelSend('second'); // should bail at isCoachLoading guard
      expect(component.coachMessages().filter((m) => m.role === 'user').length).toBe(1);
      expect(generateCoachSpy).toHaveBeenCalledTimes(1);

      resolveSpy({ response: 'reply', suggestions: [] });
      await firstCall;
    });

    it('coachPanelSuggestions should wrap string[] into SuggestedQuestion[] with stable ids', () => {
      component.coachQuestion.set('trigger a reply');
      // Three suggestions arrive with the response
      generateCoachSpy.mockResolvedValueOnce({
        response: 'ok',
        suggestions: ['A', 'B', 'C'],
      });
      // Need to seed one prior message so the seed in coachPanelSuggestions
      // is non-zero and changes between regenerations.
      component.coachMessages.set([
        { id: 'seed-0', role: 'coach', content: 'welcome', timestamp: '12:00' } as any,
      ]);
      // Cache result before pipeline runs (no new user turn yet)
      const before = component.coachPanelSuggestions();
      expect(before).toEqual([]);

      return component.askCoach().then(() => {
        const after = component.coachPanelSuggestions();
        expect(after.length).toBe(3);
        // Each suggestion gets an id and the text
        expect(after.map((s) => s.text)).toEqual(['A', 'B', 'C']);
        expect(after.every((s) => typeof s.id === 'string' && s.id.length > 0)).toBe(true);
        // Ids are unique and stable for the current suggestion set
        expect(new Set(after.map((s) => s.id)).size).toBe(3);
      });
    });

    it('coachOffset should be 480px when an archetype is displayed, 960px in side-by-side comparison', () => {
      // No archetype visible
      expect(component.coachOffset()).toBe(0);

      // Single archetype visible
      const lone = visualizationService.allArchetypes()[0];
      visualizationService.selectedArchetype.set(lone);
      expect(component.displayArchetype()).not.toBeNull();
      expect(component.coachOffset()).toBe(480);

      // Side-by-side comparison: isComparing + second archetype
      const second = visualizationService.allArchetypes()[1] ?? lone;
      component.isComparing.set(true);
      visualizationService.selectedArchetype.set(second);
      expect(component.secondComparisonArchetype()).toBeTruthy();
      expect(component.coachOffset()).toBe(960);

      // Cleanup
      component.isComparing.set(false);
      visualizationService.selectedArchetype.set(null);
      expect(component.coachOffset()).toBe(0);
    });

    it('chatRole: user/model turns carry chatRole; error turns do not (so they are excluded from Gemini history)', async () => {
      // 1. Successful send: user + model carry chatRole
      generateCoachSpy.mockResolvedValueOnce({
        response: 'first reply',
        suggestions: [],
      });
      component.coachQuestion.set('first');
      await component.askCoach();

      const userTurn = component.coachMessages().find((m) => m.role === 'user')!;
      const modelTurn = component.coachMessages().find(
        (m) => m.role === 'coach' && m.chatRole === 'model',
      )!;
      expect(userTurn.chatRole).toBe('user');
      expect(modelTurn.chatRole).toBe('model');

      // 2. Failing send: error turn has NO chatRole (so it's excluded from
      //    the next Gemini history rather than polluting it as a fake model turn)
      generateCoachSpy.mockRejectedValueOnce(new Error('boom'));
      component.coachQuestion.set('second');
      await component.askCoach();

      const errorMsg = component.coachMessages().at(-1)!;
      expect(errorMsg.role).toBe('coach');
      expect(errorMsg.coachMood).toBe('thinking');
      expect(errorMsg.chatRole).toBeUndefined();

      // 3. Next send: history passed to Gemini does NOT contain the error text
      generateCoachSpy.mockClear();
      generateCoachSpy.mockResolvedValueOnce({ response: 'r3', suggestions: [] });
      component.coachQuestion.set('third');
      await component.askCoach();

      const lastHistory = generateCoachSpy.mock.calls.at(-1)?.[0] as Array<{
        role: string;
        content: string;
      }>;
      // Expected: first user + first model + second user + third user
      // (the error turn has no chatRole, so it is excluded from the Gemini history)
      expect(lastHistory.length).toBe(4);
      expect(lastHistory.map((m) => m.role)).toEqual(['user', 'model', 'user', 'user']);
      expect(lastHistory.some((m) => /Sorry|error|encountered/i.test(m.content))).toBe(false);
    });

    // ▒▒ Sharing-the-regression: the original 5 missing methods must NOT
    // silently come back. Belt-and-braces assertion of the API surface.
    it('the inline-template surface area must be gone (no dead methods calling nothing)', () => {
      const proto = Object.getPrototypeOf(component) as Record<string, unknown>;
      expect(typeof proto['onCoachInput']).toBe('undefined');
      // toggleCoachMode is now back (the persona-toggle wiring needs it).
      expect(typeof proto['toggleCoachMode']).toBe('function');
      expect(typeof proto['askSuggestedQuestion']).toBe('undefined');
      expect(typeof proto['coachPlaceholder']).toBe('undefined');
      expect(proto).toHaveProperty('onCoachPanelSend');
      expect(proto).toHaveProperty('askCoach');
      expect(proto).toHaveProperty('toggleCoachPanel');
    });


    // ▒▒ Persona toggle behaviour — the panel header pill round-trips
    // through `(modeToggle)` and the `[mode]` input gates the placeholder.
    it('coachMode defaults to \'general\' so unconfigured callers still render cleanly', () => {
      expect(component.coachMode()).toBe('general');
    });

    it('toggleCoachMode flips coachMode between \'general\' and \'parts\' and back', () => {
      expect(component.coachMode()).toBe('general');
      component.toggleCoachMode();
      expect(component.coachMode()).toBe('parts');
      component.toggleCoachMode();
      expect(component.coachMode()).toBe('general');
    });

    it('toggleCoachMode refreshes the welcome when conversation only has the welcome', () => {
      // Prime state explicitly so the test doesn't depend on the
      // constructor's archetype-change effect firing during CD.
      component.coachMessages.set([{
        id: 'welcome-seed-0',
        role: 'coach',
        content: 'seed',
        timestamp: '00:00',
      }]);
      // Production `toggleCoachMode()` only re-seeds the welcome when the
      // panel is OPEN. Mirror that here so the reset guard fires.
      component.isCoachPanelOpen.set(true);
      const beforeId = component.coachMessages()[0].id;
      component.toggleCoachMode();
      const afterId = component.coachMessages()[0].id;
      expect(afterId).not.toBe(beforeId);
      expect(afterId.startsWith('welcome-')).toBe(true);
      expect(component.coachMode()).toBe('parts');
    });

    it('toggleCoachMode preserves history when the conversation has more than the welcome', async () => {
      // Await the send so the inner askCoach async chain has settled —
      // otherwise microtask timing varies across the rest of the test env.
      await component.onCoachPanelSend('What does my inner critic say?');
      const before = component.coachMessages().map((m) => m.id).join(',');
      expect(before.split(',').length).toBeGreaterThan(1);
      component.toggleCoachMode();
      const after = component.coachMessages().map((m) => m.id).join(',');
      expect(after).toBe(before);
      expect(component.coachMode()).toBe('parts');
    });

    // ▒▒ Parts-mode routing — askCoach must thread `coachMode()` into the
    // Gemini call so the persona prefix is composed by the service.
    it('askCoach forwards coachMode to generateCoachResponse (general by default)', async () => {
      // Prime a single welcome so filter() doesn't see an undefined slot.
      component.coachMessages.set([{
        id: 'welcome-seed-0',
        role: 'coach',
        content: 'seed',
        timestamp: '00:00',
      }]);
      const initialMode = component.coachMode();
      component.coachQuestion.set('What is my Sovereign mode?');
      await component.askCoach();
      const lastCall = generateCoachSpy.mock.calls.at(-1);
      expect(lastCall).toBeTruthy();
      expect(lastCall![4]).toBe(initialMode);
    });

    it('askCoach forwards coachMode=\'parts\' to generateCoachResponse after toggleCoachMode', async () => {
      // Prime a single welcome so the filter doesn't see undefined.
      component.coachMessages.set([{
        id: 'welcome-seed-0',
        role: 'coach',
        content: 'seed',
        timestamp: '00:00',
      }]);
      component.toggleCoachMode();  // -> 'parts'
      // toggleCoachMode may have re-issued the welcome (length was 1
      // <= 1, so the reset guard fired) — re-prime to a stable seed so the
      // userTurn/history counts are deterministic.
      component.coachMessages.set([{
        id: 'welcome-seed-after-toggle-0',
        role: 'coach',
        content: 'seed',
        timestamp: '00:00',
      }]);
      // Drop in a seeding user turn with chatRole so the history filter
      // has something to include in the chatHistory payload passed to
      // generateCoachResponse.
      component.coachMessages.update((m) => [
        ...m,
        { id: 'u-seed-0', role: 'user', content: 'seed user', timestamp: '00:00', chatRole: 'user' },
      ]);
      component.coachQuestion.set('What does this part feel?');
      await component.askCoach();
      const lastCall = generateCoachSpy.mock.calls.at(-1);
      expect(lastCall).toBeTruthy();
      expect(lastCall![4]).toBe('parts');
    });

    // ▒▒ Stable ids (blocker #3): the welcome id must change between
    // resetCoachConversation calls so <app-coach-panel>'s @for replays
    // the slide-in animation.
    it('resetCoachConversation should bump coachSessionId so the welcome id is unique per reset', () => {
      const before = component.coachSessionId();
      // Open the panel first to trigger the resetCoachConversation path.
      component.isCoachPanelOpen.set(false);
      component.toggleCoachPanel(); // open
      const after = component.coachSessionId();
      expect(after).toBeGreaterThan(before);
      const welcomes = component.coachMessages().filter((m) => m.id.startsWith('welcome-'));
      expect(welcomes.length).toBe(1);
      expect(welcomes[0].id).toMatch(new RegExp(`^welcome-${after}-0$`));
    });

    // ▒▒ Stable string timestamps (blocker #2): every message carries a
    // pre-formatted `HH:MM` timestamp that NEVER recomputes on CD.
    it('askCoach should emit messages with a stable HH:MM timestamp and unique id', async () => {
      component.coachQuestion.set('what is an archetype?');
      await component.askCoach();

      const lastTwo = component.coachMessages().slice(-2);
      expect(lastTwo.length).toBe(2);

      const [userTurn, modelTurn] = lastTwo;
      expect(userTurn.role).toBe('user');
      expect(modelTurn.role).toBe('coach');

      // Both carry stable, distinct ids (welcome was seeded; user is
      // `u-...`, model is `m-...`).
      expect(userTurn.id).toMatch(/^u-\d+-\d+$/);
      expect(modelTurn.id).toMatch(/^m-\d+-\d+$/);
      expect(userTurn.id).not.toEqual(modelTurn.id);

      // Both have a `timestamp` string in HH:MM (or HH:MM:SS) shape.
      const hhmm = /^\d{1,2}:\d{2}(?::\d{2})?$/;
      expect(userTurn.timestamp).toMatch(hhmm);
      expect(modelTurn.timestamp).toMatch(hhmm);

      // The user turn comes BEFORE the model turn in coachMessages.
      const userIdx = component.coachMessages().indexOf(userTurn);
      const modelIdx = component.coachMessages().indexOf(modelTurn);
      expect(userIdx).toBeLessThan(modelIdx);
    });

    // ▒▒ Error handling: a Gemini failure surfaces a translated error
    // turn (still role 'coach' with mood 'thinking') and clears loading.
    it('askCoach should surface an error turn on Gemini failure and not crash', async () => {
      generateCoachSpy.mockRejectedValueOnce(new Error('upstream timeout'));

      component.coachQuestion.set('will fail');
      await component.askCoach();

      const lastMsg = component.coachMessages().at(-1)!;
      // Error is rendered as a coach role with thinking mood.
      expect(lastMsg.role).toBe('coach');
      expect(lastMsg.coachMood).toBe('thinking');
      expect(lastMsg.id).toMatch(/^e-\d+-\d+$/);
      // Gemini was called once, loading is off, no suggestions populated.
      expect(generateCoachSpy).toHaveBeenCalledTimes(1);
      expect(component.isCoachLoading()).toBe(false);
      expect(component.coachSuggestions()).toEqual([]);
    });
  });
});

describe('LocalStorageAdapter history fallback (mirrors Firebase adapter fix)', () => {
  it('returns [current] when no separate history exists', async () => {
    const { LocalStorageAdapter } = await import('./app/core/adapters/local-storage.adapter');
    const adapter = new LocalStorageAdapter();
    const complete = new Array(64).fill(3);
    localStorage.setItem('ARCHETYPE_COMPLETED_BACKUP', JSON.stringify({
      app: 'ArchetypeAI',
      version: 1,
      timestamp: new Date().toISOString(),
      dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
      assessmentResponses: complete,
      results: null,
    }));
    const history = await adapter.loadHistory('u-1');
    expect(history.length).toBe(1);
    expect(history[0].responses.length).toBe(64);
  });
});

describe('AppComponent — login modal i18n (regression guard)', () => {
  // The bug: the login modal (shown when isLoginModalOpen() is true) had two
  // hardcoded English strings — the title "Login" and the body
  // "Sign in to access your cabinet, history, and saved synastries." — that
  // did not switch to Russian when the user toggled the language. Every other
  // string in the modal already goes through translationService.t() (e.g.
  // 'continueWithGoogle', 'signInCta'); these two were missed.
  //
  // The fix: add loginModalTitle and loginModalBody keys to translations.en
  // and translations.ru under the 'universe' section, and wire them through
  // translationService.t() in app.component.html.
  const appHtml = readFileSync(resolve(__dirname, 'app.component.html'), 'utf-8');
  const translationsTs = readFileSync(resolve(__dirname, 'i18n/translations.ts'), 'utf-8');

  // Extract the @if (isLoginModalOpen()) { ... } block.
  // Use [\s\S] to span newlines and a non-greedy match.
  const loginModalBlock = (() => {
    const m = appHtml.match(/@if\s*\(\s*isLoginModalOpen\(\)\s*\)\s*\{([\s\S]*?)\n\s+\}\s*\n\s+\}\s*\n/);
    return m ? m[1] : null;
  })();

  describe('Translations', () => {
    it('English: translations.en.universe has loginModalTitle and loginModalBody', () => {
      // Anchor on the en top-level block (it's the FIRST language in the
      // file) and verify the new keys are defined inside it. Mirrors the
      // pattern used in cabinet.component.spec.ts for the same file.
      const enBlock = new RegExp(`en:\\s*\\{[\\s\\S]*?loginModalTitle\\s*:`);
      const enBody  = new RegExp(`en:\\s*\\{[\\s\\S]*?loginModalBody\\s*:`);
      expect(enBlock.test(translationsTs)).toBe(true);
      expect(enBody.test(translationsTs)).toBe(true);
    });

    it('Russian: translations.ru.universe has loginModalTitle and loginModalBody', () => {
      const ruBlock = new RegExp(`ru:\\s*\\{[\\s\\S]*?loginModalTitle\\s*:`);
      const ruBody  = new RegExp(`ru:\\s*\\{[\\s\\S]*?loginModalBody\\s*:`);
      expect(ruBlock.test(translationsTs)).toBe(true);
      expect(ruBody.test(translationsTs)).toBe(true);
    });
  });

  describe('Template — no hardcoded English in login modal', () => {
    it('the @if (isLoginModalOpen()) block exists in the template', () => {
      expect(loginModalBlock).not.toBeNull();
    });

    it('login modal title is not the hardcoded "Login" string', () => {
      // The title was "<h3 ...>Login</h3>" — raw, no i18n. After the fix
      // it must use translationService.t('loginModalTitle', 'universe').
      // Look for the h3 element inside the modal block.
      const titleMatch = loginModalBlock!.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      expect(titleMatch).not.toBeNull();
      const inner = titleMatch![1].trim();
      // Inner should be a translation binding, not literal "Login"
      expect(inner).not.toBe('Login');
      expect(inner).toMatch(/translationService\.t\(\s*['"]loginModalTitle['"]\s*,\s*['"]universe['"]/);
    });

    it('login modal body is not the hardcoded "Sign in to access your cabinet..." string', () => {
      // The body was a raw <p> with English text. After the fix it must
      // use translationService.t('loginModalBody', 'universe').
      const bodyMatch = loginModalBlock!.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      expect(bodyMatch).not.toBeNull();
      const inner = bodyMatch![1].trim();
      expect(inner).not.toMatch(/Sign in to access your cabinet, history, and saved synastries\./);
      expect(inner).toMatch(/translationService\.t\(\s*['"]loginModalBody['"]\s*,\s*['"]universe['"]/);
    });
  });
});
