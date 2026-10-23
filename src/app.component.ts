import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild, afterNextRender, inject, computed, WritableSignal, Signal, OnDestroy, effect, Injector, runInInjectionContext, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
// The three.js renderer is LAZY: dynamically imported on first universe
// entry so the 3D module (+three/gsap/postprocessing) ships as its own chunk
// instead of weighing down the landing page. Type-only import keeps the
// static graph clean.
import type { VisualizationService } from './services/webxr.service';
import { UniverseStateService } from './services/universe-state.service';
import { localSet, localSetRaw, localGet, localRemove, flushLocal } from './shared/core/data/local-store';
import { STRINGS } from './shared/i18n/strings';
import type { Archetype, Dimension, DimensionalExpressions } from './services/universe-state.service';
import { GeminiService, ChatMessage, CoachResponse, GeneratedArchetype, AssessmentAnalysis } from './services/gemini.service';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { TranslationService } from './services/translation.service';
import { CommonModule } from '@angular/common';
import { BlobCharacterComponent } from './app/shared/components/blob-character/blob-character.component';
import { ArchetypeDetailCardComponent } from './app/shared/components/archetype-detail-card/archetype-detail-card.component';
import { HelpModalComponent, HelpItem } from './app/shared/components/help-modal/help-modal.component';

import { AssessmentPanelComponent } from './app/features/assessment-panel/assessment-panel.component';
import { DescentPanelComponent } from './app/features/descent-panel/descent-panel.component';
import { InnerverseReportComponent } from './app/features/innerverse-report/innerverse-report.component';
import { CheckInPanelComponent } from './app/features/checkin-panel/checkin-panel.component';
import { PracticePanelComponent } from './app/features/practice-panel/practice-panel.component';
import { QuickScanPanelComponent } from './app/features/quickscan-panel/quickscan-panel.component';
import { TherapistPanelComponent } from './app/features/therapist-panel/therapist-panel.component';
import { InstallPromptComponent } from './app/shared/install-prompt/install-prompt.component';
import { InstallService } from './services/install.service';
import { SynastryCompareComponent } from './app/features/synastry-compare/synastry-compare.component';
import { scoreProfile, type AssessmentInput, type ScoredProfile } from './shared/core/data/scoring-v2';
import { recordAndStore, syncTelemetry, loadTelemetry } from './app/core/data/telemetry';
import { ResultsPanelComponent, AssessmentResults } from './app/features/results-panel/results-panel.component';
import { UniverseControlsComponent } from './app/features/universe-controls/universe-controls.component';
import { SynastryPanelComponent } from './app/features/synastry-panel/synastry-panel.component';
import { SpecialistClientService } from './services/specialist-client.service';

import { ASSESSMENT_QUESTIONS } from './shared/core/data/assessment-questions';
import { computePoleScores, generateArchetypes } from './shared/core/data/scoring';
import { cardPopIn } from './app/core/animations/storybook.animations';
import { gsap } from 'gsap';
import { LandingComponent } from './app/features/landing/landing.component';
import { CabinetComponent } from './app/features/cabinet/cabinet.component';
import { CoachPanelComponent, CoachMessage, formatCoachClock } from './app/features/coach-panel/coach-panel.component';

import { AUTH_PORT, User } from './app/core/ports/auth.port';
import { STORAGE_PORT, AssessmentData } from './app/core/ports/storage.port';
import { BillingService } from './services/billing.service';






const LOCAL_STORAGE_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES';
const PROFILE_KEY = 'INNERVERSE_PROFILE_V1';
const ASSESSMENT_INDEX_KEY = 'ARCHETYPE_ASSESSMENT_INDEX';
const AUTH_REDIRECT_PENDING_KEY = 'ARCHETYPE_AUTH_REDIRECT_PENDING';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DescentPanelComponent,
    InnerverseReportComponent,
    CheckInPanelComponent,
    PracticePanelComponent,
    QuickScanPanelComponent,
    TherapistPanelComponent,
    InstallPromptComponent,
    SynastryCompareComponent,
    CommonModule,
    BlobCharacterComponent,
    ArchetypeDetailCardComponent,
    HelpModalComponent,
    AssessmentPanelComponent,
    ResultsPanelComponent,
    UniverseControlsComponent,
    SynastryPanelComponent,
    LandingComponent,
    CabinetComponent,
    CoachPanelComponent
  ],


  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [cardPopIn]
})
export class AppComponent implements OnDestroy {
  readonly assessmentQuestions = ASSESSMENT_QUESTIONS;
  /** STRINGS catalog exposed for template-level copy (single EN/RU source). */
  protected readonly STRINGS = STRINGS;
  /** Eager universe state — safe to bind anywhere, any app state. */
  private readonly universeState = inject(UniverseStateService);
  /** Lazy renderer instance — set on first universe entry (see loadRenderer). */
  private vizRenderer: VisualizationService | null = null;
  /** Determinism seed captured before the renderer exists; applied on load. */
  private pendingDeterminismSeed: string | null = null;
  private rendererLoad: Promise<VisualizationService> | null = null;

  private readonly geminiService = inject(GeminiService);
  public readonly translationService = inject(TranslationService);
  private readonly injector = inject(Injector);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authPort = inject(AUTH_PORT);
  private readonly storagePort = inject(STORAGE_PORT);
  private readonly specialistClients = inject(SpecialistClientService);
  
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private loadingScreen = viewChild<ElementRef<HTMLDivElement>>('loadingScreen');
  private loadingCanvas = viewChild<ElementRef<HTMLCanvasElement>>('loadingCanvas');
  private chatHistory = viewChild<ElementRef<HTMLDivElement>>('chatHistory');

  // App State
  readonly appState = signal<'loading' | 'intro' | 'cabinet' | 'assessment' | 'assessment-gate' | 'assessment-results' | 'universe' | 'specialist-client-view' | 'descent' | 'innerverse'>('loading');
  readonly loadingProgress = signal(0);

  // Specialist view: when an admin opens a client's report, we cache
  // the loaded assessment here so the `specialist-client-view` state
  // can render it. Cleared on `goBack` from the specialist view.
  readonly specialistViewClientUid = signal<string | null>(null);
  readonly specialistViewClientEmail = signal<string | null>(null);
  readonly specialistViewClientResults = signal<AssessmentData | null>(null);
  readonly specialistViewClientLoadError = signal<string | null>(null);
  readonly specialistViewBusy = signal(false);

  // UI State Signals
  readonly activeClusterFilters: WritableSignal<Set<string>> = signal(new Set());
  readonly dimensionalExpressions: WritableSignal<DimensionalExpressions> = signal({
      AGENCY: 0,
      TEMPERATURE: 0,
      FOCUS: 0,
      ATTACHMENT: 0,
  });
  readonly isSettingsPanelCollapsed = signal(true);
  readonly isHelpPanelOpen = signal(false);
  readonly isSynastryOpen = signal(false);
  readonly universeLoading = signal(false);
  readonly synastryPartnerResponses = signal<number[]>([]);
  readonly synastryPartnerUid = signal<string | null>(null);
  readonly synastryConnectionId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly isolatedDimension = signal<Dimension | null>(null);


  // Help Items
  readonly helpItems = computed<HelpItem[]>(() => [
    {
      title: this.translationService.t('help1Title', 'universe'),
      description: this.translationService.t('help1Desc', 'universe')
    },
    {
      title: this.translationService.t('help2Title', 'universe'),
      description: this.translationService.t('help2Desc', 'universe')
    },
    {
      title: this.translationService.t('help3Title', 'universe'),
      description: this.translationService.t('help3Desc', 'universe')
    },
    {
      title: this.translationService.t('help4Title', 'universe'),
      description: this.translationService.t('help4Desc', 'universe')
    },
    {
      title: this.translationService.t('help5Title', 'universe'),
      description: this.translationService.t('help5Desc', 'universe')
    },
    {
      title: this.translationService.t('help6Title', 'universe'),
      description: this.translationService.t('help6Desc', 'universe')
    },
    {
      title: this.translationService.t('help7Title', 'universe'),
      description: this.translationService.t('help7Desc', 'universe')
    }
  ]);

  // Loading State
  readonly initError = signal<string | null>(null);
  private readonly loadingPhraseKeys = [
    'calibrating',
    'polishing',
    'teaching',
    'unfolding',
    'reticulating',
    'waking'
  ];
  readonly currentLoadingPhrase = signal(this.translationService.t(this.loadingPhraseKeys[0], 'universe.loadingPhrases'));
  private phraseInterval: ReturnType<typeof setInterval> | null = null;



  // Comparison State Signals
  readonly isComparing = signal(false);
  readonly firstComparisonArchetype = signal<Archetype | null>(null);
  readonly secondComparisonArchetype = computed(() => this.isComparing() ? this.universeState.selectedArchetype() : null);
  readonly displayArchetype = computed(() => this.isComparing() ? this.firstComparisonArchetype() : this.universeState.selectedArchetype());
  


  // AI Coach State
  readonly isCoachPanelOpen = signal(false);
  /** Storage for the coach conversation. Each entry carries a stable id
   * (so `@for ... track` in `<app-coach-panel>` replays the slide-in on
   * genuine new messages) and a pre-formatted timestamp string (set at
   * insertion so it never drifts on later CD). */
  readonly coachMessages = signal<CoachMessage[]>([]);
  /** Bumped every time `resetCoachConversation()` runs. The bump is folded
   * into the welcome message's id, so re-seeding the conversation mounts
   * a *new* DOM node (the `@messageEnter` slide-in plays again) instead of
   * reusing the previous welcome's node in place. */
  readonly coachSessionId = signal(0);
  /**
   * Persona the coach should adopt. Owned here (parent) so we can
   * orchestrate the persona switch alongside Gemini routing and
   * (optionally) a welcome-message reset. `'<app-coach-panel>` reflects
   * this via `[mode]` and flips it via `(modeToggle)`.
   *
   * - 'general' — base coach persona: relational/archetypal exploration.
   *   Same persona as before this toggle existed. Stub for any user who
   *   never taps the pill.
   * - 'parts'   — IFS-aware overlay. The system instruction sent to
   *   Gemini gets prepended with a parts-listening persona (see
   *   `universe.partsModeSystemInstruction` in translations.ts AND
   *   `gemini.service.generateCoachResponse(mode = 'parts')`). The
   *   textarea placeholder also flips to `coach.partsModePlaceholder`.
   */
  readonly coachMode = signal<'general' | 'parts'>('general');
  /** Stable suggested-question wrapper for <app-coach-panel>.
   * `coachSuggestions` is a `string[]` (the AI returns plain text). The
   * panel expects `SuggestedQuestion[]` (`{id, text}[]`). The id is
   * seeded by the current message count so each new reply produces a
   * distinct id set, while keeping ids stable within a single reply
   * (`@for ... track suggestion.id` keeps the same DOM node until the
   * suggestions are replaced). */
  readonly coachPanelSuggestions = computed(() => {
    const seed = this.coachMessages().length;
    return (this.coachSuggestions() ?? []).map((text, i) => ({
      id: `s-${seed}-${i}`,
      text,
    }));
  });
  /** Horizontal offset (px) so the coach panel doesn't visually pile up
   * on top of <archetype-detail-card> — both are `position: fixed;
   * right: 0` at the top-right corner. Push the coach panel left by:
   *   - 960px when both side-by-side comparison cards are visible
   *     (two 480px width cards)
   *   - 480px when a single detail card is open
   *   - 0px otherwise */
  readonly coachOffset = computed(() => {
    if (this.isComparing() && this.secondComparisonArchetype()) {
      return 960;
    }
    return this.displayArchetype() ? 480 : 0;
  });
  readonly coachQuestion = signal('');
  readonly isCoachLoading = signal(false);
  readonly coachSuggestions = signal<string[]>([]);



  // Assessment State
  readonly assessmentResponses = signal<number[]>([]);
  readonly assessmentResults = signal<AssessmentResults | null>(null);

  // Auth State
  readonly currentUser = signal<User | null>(null);
  readonly showSavePrompt = signal(false);
  readonly shareCode = signal<string | null>(null);
  readonly shareCodeConsent = signal(false);
  readonly shareCodeLoading = signal(false);
  readonly shareCodeError = signal<string | null>(null);
  readonly partnerCode = signal('');
  readonly partnerCodeLoading = signal(false);
  readonly partnerCodeError = signal<string | null>(null);
  readonly saveEmailForm = signal(false);

  // Login modal (Landing/Cabinet)
  readonly isLoginModalOpen = signal(false);
  readonly loginBusy = signal(false);
  readonly loginError = signal<string | null>(null);



  // Interaction Signals from Service
  readonly selectedArchetype: Signal<Archetype | null> = this.universeState.selectedArchetype;


  private initializationPromise: Promise<void> | null = null;

  private loadingAnimFrame = 0;
  private loadingFallback: ReturnType<typeof setTimeout> | null = null;
  private constellationParticles: { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; pulse: number }[] = [];
  private redirectPendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private anonymousBootstrapTimeout: ReturnType<typeof setTimeout> | null = null;
  private authSubscription: Subscription | null = null;

  private readonly installService = inject(InstallService);

  constructor() {
    // PWA install dialog: offer once per week, well after first paint.
    this.installService.autoOpenAfterDelay(9000);

    effect(() => this.universeState.setComparisonState(this.isComparing(), this.firstComparisonArchetype()));

    // Auth state tracking
    effect(() => {
      const user = this.currentUser();
      // Auto-save when user is authenticated and has results
      if (user && !user.isAnonymous && this.assessmentResponses().length > 0) {
        this.persistToCloud();
      }
    });

    // Subscribe first so redirect auth can settle before any anonymous bootstrap.
    this.authSubscription = this.authPort.user$.subscribe(user => {
      this.currentUser.set(user);
      this.pendingDeterminismSeed = user?.uid || null;
      this.vizRenderer?.setDeterminismSeed(this.pendingDeterminismSeed);

      if (user && this.anonymousBootstrapTimeout) {
        clearTimeout(this.anonymousBootstrapTimeout);
        this.anonymousBootstrapTimeout = null;
      }

      if (user && !user.isAnonymous && this.isAuthRedirectPending()) {
        this.clearAuthRedirectPending();
        if (this.redirectPendingTimeout) {
          clearTimeout(this.redirectPendingTimeout);
          this.redirectPendingTimeout = null;
        }
        this.appState.set('cabinet');
      }

      if (user) {
        this.loadFromCloud(user.uid);
      }
    });

    // Delay anonymous auth so Google redirect sign-in/link can complete without race conditions.
    this.anonymousBootstrapTimeout = setTimeout(() => {
      if (!this.currentUser()) {
        this.authPort.signInAnonymously().catch(() => {});
      }
    }, 4000);

    // Safety valve: if redirect never resolves, clear the flag and recover to anonymous mode.
    if (this.isAuthRedirectPending()) {
      this.redirectPendingTimeout = setTimeout(() => {
        this.clearAuthRedirectPending();
        if (!this.currentUser()) {
          this.authPort.signInAnonymously().catch(() => {});
        }
      }, 12000);
    }

    effect(() => {
      const messages = this.coachMessages();
      const el = this.chatHistory()?.nativeElement;
      if (el && messages.length > 0) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    });

    effect(() => {
      const currentSelection = this.selectedArchetype();
      const currentComparison = this.firstComparisonArchetype();
      this.resetCoachConversation();
    });

    effect(() => {
      const panelsOpen = this.isSynastryOpen() ||
        this.appState() === 'assessment' ||
        this.appState() === 'assessment-gate' ||
        this.appState() === 'assessment-results';
      // The axis-label layer lives on <body> (outside Angular's subtree, so
      // the CSS2DRenderer survives view switches). Show it ONLY inside the
      // 3D universe view — otherwise this effect re-shows it after sleep()
      // hid it, and the frozen labels linger on top of whatever screen the
      // user returned to (intro, cabinet, …).
      const inUniverseView = this.appState() === 'universe';
      this.vizRenderer?.setLabelsVisible(inUniverseView && !panelsOpen);
    });

    this.startLoadingPhrases();

    afterNextRender(() => {
      this.initLoadingConstellation();
      this.runLoadingChoreography();
    });
  }

  ngOnDestroy(): void {
    this.vizRenderer?.destroy();
    clearInterval(this.phraseInterval);
    if (this.loadingFallback) clearTimeout(this.loadingFallback);
    if (this.redirectPendingTimeout) clearTimeout(this.redirectPendingTimeout);
    if (this.anonymousBootstrapTimeout) clearTimeout(this.anonymousBootstrapTimeout);
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = null;
    }
    cancelAnimationFrame(this.loadingAnimFrame);
  }

  private isAuthRedirectPending(): boolean {
    try {
      return sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === '1';
    } catch {
      return false;
    }
  }

  private markAuthRedirectPending(): void {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, '1');
    } catch {
      // storage unavailable
    }
  }

  private clearAuthRedirectPending(): void {
    try {
      sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    } catch {
      // storage unavailable
    }
  }

  private finishLoading(screen?: HTMLElement): void {
    if (this.appState() !== 'loading') return;
    if (this.loadingFallback) {
      clearTimeout(this.loadingFallback);
      this.loadingFallback = null;
    }
    clearInterval(this.phraseInterval);
    cancelAnimationFrame(this.loadingAnimFrame);

    if (!screen) {
      this.restoreInnerverseProfile();
      this.appState.set('intro');
      return;
    }

    gsap.to(screen, {
      opacity: 0,
      y: -12,
      filter: 'blur(10px)',
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: () => { this.restoreInnerverseProfile(); this.appState.set('intro'); }
    });
  }

  // === GSAP Loading Choreography ===
  private runLoadingChoreography(): void {
    const screen = this.loadingScreen()?.nativeElement;
    if (!screen) return;

    const blob = screen.querySelector('.loading-blob-container');
    const blobGlow = screen.querySelector('.loading-blob-glow');
    const textContainer = screen.querySelector('.loading-text-container');
    const progressTrack = screen.querySelector('.loading-progress-track');
    const tagline = screen.querySelector('.loading-tagline');
    const orbits = screen.querySelectorAll('.loading-orbit');
    const orbitDots = screen.querySelectorAll('.loading-orbit-dot');

    this.loadingFallback = setTimeout(() => this.finishLoading(screen), 4200);

    const tl = gsap.timeline({
      onComplete: () => this.finishLoading(screen)
    });

    // Phase 1: Orbits spin in
    tl.to(orbits, {
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out'
    }, 0);

    // Orbit dots appear
    tl.to(orbitDots, {
      opacity: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(2)'
    }, 0.3);

    // Animate orbit rotation via GSAP
    orbits.forEach((orbit, i) => {
      gsap.to(orbit, {
        rotation: 360,
        duration: 20 + i * 15,
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center'
      });
    });

    // Phase 2: Blob entrance
    tl.to(blob, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'elastic.out(1, 0.5)'
    }, 0.4);

    gsap.to(blobGlow, {
      opacity: 1,
      scale: 1.1,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // Phase 3: Text slide in
    tl.fromTo(textContainer,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
      0.8
    );

    // Phase 4: Progress bar
    tl.to(progressTrack, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, 1.0);

    // Animate progress
    tl.to(this.loadingProgress, {
      set: () => this.loadingProgress.set(100),
      duration: 0.01
    }, 1.2);

    // GSAP can't directly animate signals, so use a tween on a proxy
    const proxy = { progress: 0 };
    gsap.to(proxy, {
      progress: 100,
      duration: 2.2,
      delay: 1.2,
      ease: 'power1.inOut',
      onUpdate: () => this.loadingProgress.set(Math.round(proxy.progress))
    });

    // Phase 5: Tagline
    tl.to(tagline, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 1.4);

    // Hold for a moment then close
    tl.to({}, { duration: 0.6 });
  }

  // === Constellation Particle Canvas ===
  private initLoadingConstellation(): void {
    const canvasEl = this.loadingCanvas()?.nativeElement;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const parent = canvasEl.parentElement;
    if (!parent) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = parent.clientWidth * dpr;
      canvasEl.height = parent.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => parent.clientWidth;
    const H = () => parent.clientHeight;

    const colors = ['#E69F00', '#D55E00', '#56B4E9', '#009E73', '#CC79A7', '#F0E442'];
    const PARTICLE_COUNT = 45;

    this.constellationParticles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2
    }));

    const CONNECTION_DIST = 120;

    const animate = () => {
      ctx.clearRect(0, 0, W(), H());
      const particles = this.constellationParticles;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        if (p.x < 0) p.x = W();
        if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H();
        if (p.y > H()) p.y = 0;

        const pAlpha = p.alpha + Math.sin(p.pulse) * 0.15;

        // Glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, p.color + Math.round(Math.max(0, pAlpha) * 255).toString(16).padStart(2, '0'));
        g.addColorStop(1, p.color + '00');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, pAlpha);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Constellation connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(226, 230, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      this.loadingAnimFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Dynamically import the three.js renderer on first universe entry.
   * The chunk (~three/gsap/postprocessing) never loads for users who don't
   * open the universe; landing/results stay featherweight. The module is
   * cached by the browser, so subsequent entries resolve instantly.
   */
  private loadRenderer(): Promise<VisualizationService> {
    if (!this.rendererLoad) {
      this.rendererLoad = import('./services/webxr.service').then(mod => {
        const viz = this.injector.get(mod.VisualizationService);
        this.vizRenderer = viz;
        if (this.pendingDeterminismSeed) viz.setDeterminismSeed(this.pendingDeterminismSeed);
        return viz;
      });
    }
    return this.rendererLoad;
  }

  /** Speculative prefetch (zero-r economic scheduler, simplified): call on
   *  hover/focus of likely universe entry points — the chunk downloads while
   *  the user is still deciding, so the eventual entry feels instant. */
  prefetchUniverseRenderer(): void {
    void this.loadRenderer();
  }

  private initializeUniverse(canvasEl: HTMLCanvasElement): Promise<void> {
    if (this.initializationPromise) {
      // Scene survived a sleep (route exit) — repair the DOM binding first:
      // Angular destroyed the original canvas when the @case switched away,
      // so swap the fresh placeholder for the renderer's real canvas, then
      // wake. Without this, the renderer keeps drawing into a detached
      // canvas and the universe appears dead (no drag, no clicks).
      this.vizRenderer?.reattachCanvas(canvasEl);
      this.vizRenderer?.wake();
      return this.initializationPromise;
    }
    this.initializationPromise = (async () => {
      this.startLoadingPhrases();
      try {
        const isFirstVisit = !(() => { try { return localStorage.getItem('hasVisited'); } catch { return null; } })();
        const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1000));
        await Promise.all([
            (await this.loadRenderer()).init(canvasEl, isFirstVisit),
            minDelayPromise
        ]);
        clearInterval(this.phraseInterval);

      if (this.appState() === 'universe' && isFirstVisit) {
            setTimeout(() => {
                this.isHelpPanelOpen.set(true);
                localSetRaw('hasVisited', 'true');
            }, 500);
        }
        

      } catch (error) {
          console.error("Fatal error during visualization initialization:", error);
          this.initError.set(this.translationService.t('universeInitFailed', 'universe', 'Failed to load the universe. Please refresh the page.'));
          clearInterval(this.phraseInterval);
          this.universeLoading.set(false);
          this.appState.set('loading');
          this.initializationPromise = null; // Allow retry on error
          throw error;
      }
    })();
    return this.initializationPromise;
  }

  private waitForNextRender(): Promise<void> {
    return new Promise(resolve => {
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => resolve());
      });
    });
  }

  private waitForSceneReady(timeoutMs = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const tick = () => {
        if (this.vizRenderer?.sceneReady()) {
          resolve();
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(this.translationService.t('sceneReadyTimeout', 'universe', 'The universe took too long to stabilize. Please try again.')));
          return;
        }
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  startAssessment(): void {
    this.universeState.selectedArchetype.set(null);
    this.assessmentResponses.set(new Array(this.assessmentQuestions.length).fill(0));
    this.appState.set('assessment');
    this.assessmentResults.set(null);
  }

  restartAssessment(): void {
    try {
      localRemove(LOCAL_STORAGE_KEY);
      localStorage.removeItem(ASSESSMENT_INDEX_KEY);
    } catch { /* storage unavailable */ }
    this.startAssessment();
  }

  // --- Innerverse (REVAMP v2) flow ---

  readonly innerverseProfile = signal<ScoredProfile | null>(null);

  startDescent(): void {
    this.appState.set('descent');
  }

  onDescentCompleted(input: AssessmentInput): void {
    this.innerverseProfile.set(scoreProfile(input));
    recordAndStore(input); // §4 step 10: anonymized item distributions, local-only
    void syncTelemetry(loadTelemetry()); // fire-and-forget to Firestore (no PII)
    localSet(PROFILE_KEY, input);
    this.appState.set('innerverse');
  }

  /** Restore the last completed descent so a reload never loses the report. */
  restoreInnerverseProfile(): void {
    try {
      const raw = (() => { try { return JSON.stringify(localGet<unknown>(PROFILE_KEY, null)); } catch { return null; } })();
      if (!raw) return;
      this.innerverseProfile.set(scoreProfile(JSON.parse(raw) as AssessmentInput));
    } catch { localStorage.removeItem(PROFILE_KEY); }
  }

  onInnerverseBack(): void {
    this.goToIntro();
  }

  /** Map-gate popup: shown when You-tab buttons that need the innerverse
   *  map are used before the first descent is completed. */
  readonly mapGate = signal(false);

  openInnerverse(): void {
    if (this.innerverseProfile()) this.appState.set('innerverse');
    else this.mapGate.set(true);
  }

  readonly checkinOpen = signal(false);
  openCheckin(): void {
    if (this.innerverseProfile()) this.checkinOpen.set(true);
    else this.mapGate.set(true);
  }
  closeCheckin(): void { this.checkinOpen.set(false); }

  readonly practiceOpen = signal(false);
  openPractice(): void {
    if (this.innerverseProfile()) this.practiceOpen.set(true);
    else this.mapGate.set(true);
  }
  closePractice(): void { this.practiceOpen.set(false); }

  readonly quickScanOpen = signal(false);
  openQuickScan(): void { this.quickScanOpen.set(true); }
  closeQuickScan(): void { this.quickScanOpen.set(false); }

  readonly therapistOpen = signal(false);
  openTherapist(): void { this.therapistOpen.set(true); }
  closeTherapist(): void { this.therapistOpen.set(false); }

  readonly synastryOpen = signal(false);
  openSynastry(): void {
    if (this.innerverseProfile()) this.synastryOpen.set(true);
    else this.mapGate.set(true);
  }
  closeSynastry(): void { this.synastryOpen.set(false); }

  /** Gate copy — RU-first, EN inline (translations.ts is off-limits). */
  readonly gateCopy = computed(() => {
    const ru = this.translationService.getLanguage() === 'ru';
    return STRINGS.app.gate[ru ? 'ru' : 'en'];
  });

  /** Loading-screen tagline (moved here from a hardcoded template string). */
  readonly loadingTagline = computed(() => {
    const ru = this.translationService.getLanguage() === 'ru';
    return STRINGS.app.alerts.loadingTagline[ru ? 1 : 0];
  });

  /** Signed in with a real (non-anonymous) account? */
  readonly hasRealAccount = computed(() => !!this.currentUser() && !this.currentUser()?.isAnonymous);

  startDescentFromGate(): void {
    this.mapGate.set(false);
    this.startDescent();
  }

  loginFromGate(): void {
    this.mapGate.set(false);
    this.openLoginModal();
  }

  toggleLanguage(): void {
    const newLang = this.translationService.getLanguage() === 'en' ? 'ru' : 'en';
    this.translationService.setLanguage(newLang);
  }


  goToIntro(): void {
    if (this.appState() === 'universe') {
      this.vizRenderer?.sleep(); // keep context + scene: instant re-entry
    }
    this.universeLoading.set(false);
    this.initError.set(null);
    this.isCoachPanelOpen.set(false);
    this.isSynastryOpen.set(false);
    this.isHelpPanelOpen.set(false);
    this.appState.set('intro');
  }

  /**
   * Open a client's universe / matrix visualisation. Loads the latest
   * assessment, then routes to the universe view with the client's
   * personal constellation. The cabinet emits this event when the admin
   * clicks "View matrix" on a client row.
   *
   * (The "Download report" button on the cabinet row does NOT emit
   * a parent event — the cabinet formats and downloads the TXT file
   * itself, since it's a pure browser side-effect that needs no app
   * state change. The "View AI report" button below is the other
   * read-only specialist view.)
   */
  async openClientMatrix(payload: { clientUid: string; clientEmail: string | null }): Promise<void> {
    const data = await this.loadClientAssessmentData(payload);
    if (!data) {
      // No assessment or no computed results — fall back to the
      // specialist-client-view so the admin sees the "no assessment"
      // placeholder rather than a blank universe.
      this.appState.set('specialist-client-view');
      return;
    }
    const results: AssessmentResults = data.results
      ? { analysis: data.results.analysis, pantheon: data.results.pantheon || [] }
      : this.buildPersonalAssessmentResultsFromResponses(data.responses || []);
    if (!results) {
      this.appState.set('specialist-client-view');
      return;
    }
    this.assessmentResults.set(results);
    await this.viewMyUniverse(results);
  }

  /**
   * Open a client's AI-generated narrative report. Routes the parent to
   * the read-only specialist-client-view (results panel rendered with
   * `isSpecialistView: true`). Kept as a separate handler from
   * `openClientMatrix` because the buttons live next to each other on
   * the cabinet row and route to distinct views.
   */
  async openClientAiReport(payload: { clientUid: string; clientEmail: string | null }): Promise<void> {
    this.appState.set('specialist-client-view');
    await this.loadClientAssessmentData(payload);
  }

  /**
   * Load a client's latest assessment from Firestore and hydrate the
   * specialist-view signals. Returns the loaded data (or null on
   * error / no assessment). Shared by openClientMatrix and
   * openClientAiReport — each handler is responsible for setting
   * `appState` because they route to different states.
   */
  private async loadClientAssessmentData(payload: { clientUid: string; clientEmail: string | null }): Promise<AssessmentData | null> {
    this.specialistViewClientUid.set(payload.clientUid);
    this.specialistViewClientEmail.set(payload.clientEmail);
    this.specialistViewClientResults.set(null);
    this.specialistViewClientLoadError.set(null);
    this.specialistViewBusy.set(true);
    try {
      const data = await this.specialistClients.getClientLatestResults(payload.clientUid);
      if (!data) {
        // Client has no assessment yet — the specialist-client-view
        // shows the "no assessment" placeholder for this state.
        this.specialistViewClientLoadError.set('no-assessment');
        return null;
      }
      this.specialistViewClientResults.set(data);
      // Hydrate the per-component results the results panel reads.
      this.assessmentResponses.set(data.responses || []);
      this.dimensionalExpressions.set(
        data.dimensionalExpressions || { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
      );
      this.assessmentResults.set(
        data.results ? { analysis: data.results.analysis, pantheon: data.results.pantheon || [] } : null,
      );
      return data;
    } catch (e: any) {
      this.specialistViewClientLoadError.set(e?.message || 'Failed to load client assessment');
      return null;
    } finally {
      this.specialistViewBusy.set(false);
    }
  }

  private buildPersonalAssessmentResultsFromResponses(responses: number[]): AssessmentResults | null {
    if (!this.isCompleteAssessmentResponses(responses)) return null;
    const lang = this.translationService.getLanguage() === 'ru' ? 'ru' : 'en';
    const generated = generateArchetypes(responses, lang);
    return {
      analysis: '',
      pantheon: generated.archetypes,
      dynamics: generated.dynamics,
    };
  }

  /**
   * The results panel's `goBack` event is contextual: in personal view
   * it returns to the intro; in specialist view it returns to the
   * admin's cabinet. This handler dispatches based on the current state.
   */
  onResultsGoBack(): void {
    if (this.appState() === 'specialist-client-view') {
      this.specialistViewClientUid.set(null);
      this.specialistViewClientEmail.set(null);
      this.specialistViewClientResults.set(null);
      this.specialistViewClientLoadError.set(null);
      this.appState.set('cabinet');
      return;
    }
    this.goToIntro();
  }

  /**
   * The universe view's `viewIntro` event is contextual: in normal
   * universe browsing it returns to the intro; if the user is in a
   * specialist-client matrix view (state 'universe' but with
   * specialistViewClientUid set), it returns to the admin's cabinet
   * so they can pick another client or button.
   */
  onUniverseBack(): void {
    if (this.specialistViewClientUid()) {
      // Tear down the universe and return to the cabinet in specialist
      // mode. The cabinet itself will refresh its client list.
      this.exitSpecialistMatrixView();
      return;
    }
    this.goToIntro();
  }

  /**
   * Tear down the specialist matrix view and return to the admin's
   * cabinet. Destroys the universe to free GPU resources (same as
   * `goToIntro` does for the universe teardown).
   */
  private exitSpecialistMatrixView(): void {
    if (this.appState() === 'universe') {
      this.vizRenderer?.sleep(); // keep context + scene: instant re-entry
    }
    this.universeLoading.set(false);
    this.specialistViewClientUid.set(null);
    this.specialistViewClientEmail.set(null);
    this.specialistViewClientResults.set(null);
    this.specialistViewClientLoadError.set(null);
    this.appState.set('cabinet');
  }

  async enterUniverse(): Promise<void> {
    this.universeState.personalConstellation.set(null); // Ensure we see the full universe
    this.initError.set(null);
    this.appState.set('universe');
    this.universeLoading.set(true);
    try {
      await this.waitForNextRender();
      const canvasEl = this.canvas()?.nativeElement;
      if (!canvasEl) {
        throw new Error(this.translationService.t('canvasMissing', 'universe', 'The universe canvas is missing.'));
      }
      await this.initializeUniverse(canvasEl);
      await this.waitForSceneReady();
      this.universeLoading.set(false);
    } catch (error) {
      console.error('Failed to enter universe:', error);
      this.universeLoading.set(false);
      this.appState.set('loading');
      this.initError.set(error instanceof Error ? error.message : this.translationService.t('sceneInitFailed', 'universe', 'The universe could not initialize.'));
    }
  }

  /**
   * Used by the cabinet's "See Universe" button. Render the user's own map
   * whenever we can reconstruct it from saved answers; only fall back to the
   * full universe when there is truly no assessment data.
   */
  async openCabinetUniverse(): Promise<void> {
    const results = this.getPersonalUniverseResults();
    if (results) {
      await this.viewMyUniverse(results);
      return;
    }
    // No personal assessment yet — show the full matrix map.
    await this.enterUniverse();
  }

  private getPersonalUniverseResults(): AssessmentResults | null {
    const saved = this.assessmentResults();
    if (saved?.pantheon?.length) return saved;
    const responses = this.assessmentResponses();
    const rebuilt = this.buildPersonalAssessmentResultsFromResponses(responses);
    if (!rebuilt) return null;
    return { ...rebuilt, analysis: saved?.analysis || rebuilt.analysis };
  }

  toggleClusterFilter(clusterId: string): void {
    const filters = this.activeClusterFilters();
    if (filters.has(clusterId)) {
      filters.delete(clusterId);
    } else {
      filters.add(clusterId);
    }
    this.activeClusterFilters.set(new Set(filters));
  }

  startCompareMode(archetype: Archetype): void {
    this.firstComparisonArchetype.set(archetype);
    this.isComparing.set(true);
    this.resetCoachConversation();
  }

  exitCompareMode(): void {
    this.isComparing.set(false);
    this.firstComparisonArchetype.set(null);
    this.universeState.selectedArchetype.set(null); // Clear the second via shared service
    this.resetCoachConversation();
  }


  onAssessmentCompleted(responses: number[]): void {
    this.assessmentResponses.set(responses);
    this.dimensionalExpressions.set(this.calculateAssessmentDimensions(responses));
    this.assessmentResults.set(null); // Clear previous results to trigger new calculation

    const user = this.currentUser();
    if (user && !user.isAnonymous) {
      this.showSavePrompt.set(false);
      this.persistToCloud().catch(err => console.warn('[Firebase] Post-assessment save failed:', err));
      this.appState.set('cabinet');
      return;
    }

    this.showSavePrompt.set(true);
    this.appState.set('assessment-gate');
  }

  onResultsReady(results: AssessmentResults): void {
    this.assessmentResults.set(results);

    // Persist to cloud for ANY authenticated user (including anonymous). The
    // anonymous account can be later linked to a real account via
    // linkWithCredential/linkWithPopup which preserves the UID, so the data
    // follows the user across the upgrade. This is the only way to give
    // anonymous users cross-device continuity; clearing cookies still wipes
    // the data, so the in-page Download Backup button remains essential.
    if (this.currentUser()) {
      this.persistToCloud();
    }
  }

  private async persistToCloud(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    const data: AssessmentData = {
      responses: this.assessmentResponses(),
      dimensionalExpressions: this.dimensionalExpressions(),
      results: this.assessmentResults(),
      scoringMethod: 'deterministic',
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.storagePort.saveAssessment(user.uid, data);
      // Also archive a snapshot to the per-user history collection so the
      // cabinet's "Assessment history" panel shows every retest, not just the
      // latest. Without this, the history collection is always empty.
      await this.storagePort.saveToHistory(user.uid, data);
    } catch (err) {
      console.warn('[Firebase] Save failed, data in localStorage:', err);
    }
  }

  private async loadFromCloud(userId: string): Promise<void> {
    try {
      const data = await this.storagePort.loadAssessment(userId);
      if (!data || !Array.isArray(data.responses) || data.responses.length === 0) return;

      const normalizedResponses = this.normalizeUploadedResponses(data.responses as unknown as unknown[]);
      const dims = data.dimensionalExpressions || this.calculateAssessmentDimensions(normalizedResponses);

      this.assessmentResponses.set(normalizedResponses);
      this.dimensionalExpressions.set(dims);

      if (data.results) {
        this.assessmentResults.set(data.results);
      }

      // Routing rules for the auto-load path:
      //  - Returning user with COMPLETE responses: route to 'cabinet'.
      //  - Returning user with INCOMPLETE responses: only route to 'cabinet' if we
      //    haven't already routed there (e.g. from a fresh sign-in via the modal).
      //    This prevents the race where loadFromCloud fires *after* onLoginSuccess
      //    set 'cabinet' and overrides it with 'assessment', stranding the user.
      //  - Page reload with signed-in user and intro state: route to 'cabinet' so
      //    returning clients land in their dashboard.
      const isComplete = this.isCompleteAssessmentResponses(normalizedResponses);
      const isFreshlySignedIn = this.appState() === 'cabinet';

      if (isComplete) {
        this.showSavePrompt.set(false);
        this.appState.set('cabinet');
      } else if (!isFreshlySignedIn) {
        this.appState.set('assessment');
      }

      this.cdr.markForCheck();
    } catch (err) {
      console.warn('[Firebase] Load failed:', err);
    }
  }

  readonly authError = signal<string | null>(null);

  async signUpWithGoogle(): Promise<void> {
    this.authError.set(null);
    try {
      const user = this.currentUser();
      if (user?.isAnonymous) {
        // Link the anonymous account to Google. This preserves the UID so the
        // assessment data follows the user across the upgrade. The previous
        // flow had a "credential-already-in-use" fallback that opened a SECOND
        // Google popup (signInWithGoogle). That was confusing UX: the user
        // saw two popups in a row, and on success the cabinet rendered the
        // "Log in to unlock your cabinet" screen because the new user had a
        // fresh UID with no data. We no longer auto-fall-back. If the link
        // fails because the Google account is already in use, the user can
        // either retry with a different Google account, or use the gate's
        // "Skip & download backup" button to preserve their answers locally
        // and then sign in fresh.
        await this.authPort.linkAnonymousToGoogle();
      } else {
        await this.authPort.signInWithGoogle();
      }

      // Firebase's onAuthStateChanged callback fires inside the SDK, but it
      // propagates to our `currentUser` signal on the next microtask. Without
      // waiting for it, `appState.set('cabinet')` runs while `currentUser()`
      // is still the stale anonymous user (or briefly null after
      // signInWithGoogle signs the old user out), and the cabinet renders
      // the "Log in to unlock your cabinet" screen.
      const propagated = await this.waitForAuthPropagation(
        u => !!u && !u.isAnonymous,
        3000,
      );
      if (!propagated || propagated.isAnonymous) {
        throw new Error('Sign-in completed but the auth state did not propagate in time. Please refresh and try again.');
      }

      // Save only for signed-up users (per requirement), then route to cabinet.
      this.showSavePrompt.set(false);
      await this.persistToCloud();
      this.appState.set('cabinet');
    } catch (err: any) {
      const code = String(err?.code || '');
      const message = String(err?.message || '');
      const isPopupBlocked = code === 'auth/popup-blocked' || message.includes('popup-blocked');
      const isCredentialConflict =
        code === 'auth/credential-already-in-use' ||
        code === 'auth/account-exists-with-different-credential' ||
        message.includes('credential-already-in-use');

      if (isCredentialConflict) {
        this.authError.set(
          'This Google account is already linked to another ArchetypeAI account. ' +
          'Use "Skip & download backup" to save your answers locally, then sign in with that account.',
        );
        return;
      }

      if (isPopupBlocked) {
        try {
          const user = this.currentUser();
          this.markAuthRedirectPending();
          if (user?.isAnonymous) {
            await this.authPort.linkAnonymousToGoogleRedirect();
          } else {
            await this.authPort.signInWithGoogleRedirect();
          }
          return;
        } catch (redirectErr: any) {
          this.authError.set(redirectErr?.message || 'Google redirect sign-in failed');
          return;
        }
      }

      this.authError.set(err?.message || 'Google sign-in failed');
    }
  }

  async signUpWithEmail(emailEl: HTMLInputElement, passwordEl: HTMLInputElement): Promise<void> {
    const email = emailEl?.value || '';
    const password = passwordEl?.value || '';
    if (!email || !password || password.length < 6) {
      this.authError.set(this.translationService.t('validEmailPasswordRequired', 'universe'));
      return;
    }
    this.authError.set(null);
    try {
      const user = this.currentUser();
      if (user?.isAnonymous) {
        await this.authPort.linkAnonymousToEmail(email, password);
      } else {
        await this.authPort.signUpWithEmail(email, password);
      }

      // Wait for the auth state to propagate to the currentUser signal before
      // closing the gate / saving / routing. Without this, the gate would
      // close while currentUser is still flagged as anonymous (or null), and
      // the post-auth state checks in loadFromCloud could race ahead and
      // route the user back to the assessment screen instead of the cabinet.
      // Mirrors the waitForAuthPropagation pattern used in signUpWithGoogle
      // and loginCreateAccountEmailFromModal.
      const propagated = await this.waitForAuthPropagation(
        u => !!u && !u.isAnonymous,
        3000,
      );
      if (!propagated || propagated.isAnonymous) {
        throw new Error('Sign-in completed but the auth state did not propagate in time. Please refresh and try again.');
      }

      // Save only for signed-up users (per requirement), then route to
      // cabinet. All three steps must succeed for the gate to fully close —
      // if any throws, the form stays open with the error so the user can
      // retry instead of being stranded on a blank gate.
      this.showSavePrompt.set(false);
      this.saveEmailForm.set(false);
      await this.persistToCloud();
      this.appState.set('cabinet');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        this.authError.set(this.translationService.t('emailAlreadyInUse', 'universe'));
      } else {
        this.authError.set(err?.message || 'Email sign-up failed');
      }
    }
  }

  openLoginModal(): void {
    this.loginError.set(null);
    this.isLoginModalOpen.set(true);
  }

  closeLoginModal(): void {
    this.isLoginModalOpen.set(false);
    this.loginBusy.set(false);
  }

  openCabinet(): void {
    const user = this.currentUser();
    if (user && !user.isAnonymous) {
      this.appState.set('cabinet');
      return;
    }
    this.openLoginModal();
  }

  async logoutToIntro(): Promise<void> {
    try {
      await this.authPort.signOut();
    } catch {
      // best-effort logout
    }

    try {
      await this.authPort.signInAnonymously();
    } catch {
      // best-effort anonymous fallback
    }

    this.goToIntro();
  }

  private onLoginSuccess(): void {
    this.isLoginModalOpen.set(false);
    this.loginBusy.set(false);
    this.loginError.set(null);
    // Clear any stale redirect-pending flag so a subsequent auth-state emit
    // doesn't re-trigger the redirect-resolved routing path.
    if (this.isAuthRedirectPending()) {
      this.clearAuthRedirectPending();
    }
    if (this.redirectPendingTimeout) {
      clearTimeout(this.redirectPendingTimeout);
      this.redirectPendingTimeout = null;
    }
    this.appState.set('cabinet');
  }

  /**
   * Wait for the next user$ emission that matches `matcher`, with a hard
   * timeout. Firebase's onAuthStateChanged callback fires synchronously
   * inside the SDK when a popup auth flow completes, but it propagates to
   * our `currentUser` signal on the next microtask. Without an explicit
   * wait, post-auth code (e.g. `appState.set('cabinet')`) can run while
   * `currentUser()` is still stale — producing UI like a "Log in to unlock
   * your cabinet" screen on a freshly-authenticated user.
   *
   * Resolves with the matching user, or with the current `currentUser()`
   * value if the timeout fires first.
   */
  private waitForAuthPropagation(
    matcher: (u: User | null) => boolean,
    timeoutMs = 2000,
  ): Promise<User | null> {
    return new Promise<User | null>(resolve => {
      // First, check the current value — it may already match (e.g. when
      // a mock or a previously-emitted state satisfies the predicate).
      if (matcher(this.currentUser())) {
        resolve(this.currentUser());
        return;
      }
      const sub = this.authPort.user$.subscribe(user => {
        if (matcher(user)) {
          sub.unsubscribe();
          clearTimeout(timer);
          resolve(user);
        }
      });
      const timer = setTimeout(() => {
        sub.unsubscribe();
        resolve(this.currentUser());
      }, timeoutMs);
    });
  }

  async loginWithGoogleFromModal(): Promise<void> {
    this.loginBusy.set(true);
    this.loginError.set(null);
    try {
      // Modal "Continue with Google" = sign in to (or create) a Google-backed account.
      // The previous "link first, sign in on failure" flow caused TWO popups, which
      // is what users were seeing. Going directly through signInWithGoogle signs the
      // anonymous user out and signs in cleanly with one popup.
      await this.authPort.signInWithGoogle();
      this.onLoginSuccess();
    } catch (err: any) {
      const code = String(err?.code || '');
      const message = String(err?.message || '');
      const isPopupBlocked = code === 'auth/popup-blocked' || message.includes('popup-blocked');

      if (isPopupBlocked) {
        try {
          this.markAuthRedirectPending();
          await this.authPort.signInWithGoogleRedirect();
          return;
        } catch (redirectErr: any) {
          this.loginError.set(redirectErr?.message || 'Google redirect sign-in failed');
          return;
        }
      }

      this.loginError.set(err?.message || 'Google login failed');
    } finally {
      this.loginBusy.set(false);
    }
  }

  async loginSignInEmailFromModal(emailEl: HTMLInputElement, passwordEl: HTMLInputElement): Promise<void> {
    const email = emailEl?.value || '';
    const password = passwordEl?.value || '';
    if (!email || !password || password.length < 6) {
      this.loginError.set(this.translationService.t('validEmailPasswordRequired', 'universe'));
      return;
    }

    this.loginBusy.set(true);
    this.loginError.set(null);
    try {
      // Modal "Sign in" = sign in to an existing account. We go directly to
      // signInWithEmail instead of attempting to link first; the link-first
      // approach caused a confusing "two attempts" path and a race with the
      // subsequent auth state change. Anonymous data loss is acceptable here
      // because the user is explicitly targeting an existing account.
      await this.authPort.signInWithEmail(email, password);
      this.onLoginSuccess();
    } catch (err: any) {
      this.loginError.set(err?.message || 'Email sign-in failed');
    } finally {
      this.loginBusy.set(false);
    }
  }

  async loginCreateAccountEmailFromModal(emailEl: HTMLInputElement, passwordEl: HTMLInputElement): Promise<void> {
    const email = emailEl?.value || '';
    const password = passwordEl?.value || '';
    if (!email || !password || password.length < 6) {
      this.loginError.set(this.translationService.t('validEmailPasswordRequired', 'universe'));
      return;
    }

    this.loginBusy.set(true);
    this.loginError.set(null);
    try {
      const user = this.currentUser();
      if (user?.isAnonymous) {
        await this.authPort.linkAnonymousToEmail(email, password);
      } else {
        await this.authPort.signUpWithEmail(email, password);
      }

      // Wait for the auth state to propagate to the currentUser signal.
      // Without this, onLoginSuccess() can run while currentUser is still
      // the stale anonymous (or null) value, and the cabinet would render
      // its "Log in to unlock your cabinet" screen for a freshly-signed-in
      // user. Mirrors the waitForAuthPropagation pattern used in
      // signUpWithGoogle and signUpWithEmail.
      const propagated = await this.waitForAuthPropagation(
        u => !!u && !u.isAnonymous,
        3000,
      );
      if (!propagated || propagated.isAnonymous) {
        throw new Error('Sign-in completed but the auth state did not propagate in time. Please refresh and try again.');
      }

      this.onLoginSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        this.loginError.set(this.translationService.t('emailAlreadyInUse', 'universe'));
      } else {
        this.loginError.set(err?.message || 'Email sign-up failed');
      }
    } finally {
      this.loginBusy.set(false);
    }
  }

  dismissSavePrompt(): void {
    this.showSavePrompt.set(false);
    // Gate flow: skipping save continues to results analysis.
    if (this.appState() === 'assessment-gate') {
      this.appState.set('assessment-results');
    }
  }

  /**
   * Trigger a one-time download of the assessment answers as a JSON file.
   * Called from the gate's "Skip" button so the user gets a portable backup
   * even when they choose not to sign in. Browsers permit this because it
   * runs inside a user-gesture click handler.
   */
  downloadAssessmentBackupFromGate(): void {
    const responses = this.assessmentResponses();
    if (!responses || responses.length === 0) return;
    const payload = {
      app: 'ArchetypeAI',
      version: 1,
      type: 'assessment_answers',
      timestamp: new Date().toISOString(),
      assessmentResponses: responses,
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archetype_answers_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.warn('[Gate] Auto-download of backup failed:', err);
    }
  }

  /** Report: download the innerverse profile as a local backup file. */
  downloadInnerverseBackup(): void {
    try {
      const raw = (() => { try { return JSON.stringify(localGet<unknown>('INNERVERSE_PROFILE_V1', null)); } catch { return null; } })();
      if (!raw) return;
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      el.href = url;
      el.download = `innerverse_map_${new Date().toISOString().slice(0, 10)}.json`;
      el.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.warn('[Report] Local backup failed:', err);
    }
  }

  /** Combined "skip and download" action — skip the gate AND save a local copy. */
  skipGateAndDownload(): void {
    this.downloadAssessmentBackupFromGate();
    this.dismissSavePrompt();
  }

  /** Universe HUD «download copy»: save the innerverse map when present,
   *  otherwise the raw assessment responses; explain when there is no data. */
  downloadBackup(): void {
    if (localGet<unknown>('INNERVERSE_PROFILE_V1', null) !== null) {
      this.downloadInnerverseBackup();
      return;
    }
    if (this.assessmentResponses() && this.assessmentResponses().length > 0) {
      this.downloadAssessmentBackupFromGate();
      return;
    }
    const ru = this.translationService.getLanguage() === 'ru';
    try { alert(STRINGS.app.alerts.nothingToSave[ru ? 1 : 0]); } catch { /* non-interactive */ }
  }

  /** Universe HUD «synastry»: leave the universe, then open synastry
   *  (or the descent funnel when no map exists yet). */
  onOpenSynastry(): void {
    this.onUniverseBack();
    this.openSynastry();
  }

  async generateShareCode(): Promise<void> {
    const user = this.currentUser();
    if (!user || this.assessmentResponses().length === 0 || !this.shareCodeConsent()) return;
    this.shareCodeLoading.set(true);
    this.shareCodeError.set(null);
    try {
      await this.persistToCloud();
      const code = await this.storagePort.createShareCode(user.uid);
      this.shareCode.set(code);
      this.shareCodeConsent.set(false);
    } catch (err) {
      this.shareCodeError.set('Failed to generate share code');
    } finally {
      this.shareCodeLoading.set(false);
    }
  }

  async loadPartnerByCode(): Promise<void> {
    const code = this.partnerCode().trim();
    if (!code) return;
    this.partnerCodeLoading.set(true);
    this.partnerCodeError.set(null);
    try {
      let data: AssessmentData | null = null;
      let partnerUid: string | null = null;

      // Prefer share code (8 chars). If it doesn't look like a share code, treat as a UID.
      if (code.length === 8) {
        const shared = await this.storagePort.loadSharedWithUid(code);
        partnerUid = shared?.uid || null;
        data = shared?.data || null;
      } else {
        partnerUid = code;
        data = await this.storagePort.loadAssessment(code);
      }

      if (!data || !data.responses || data.responses.length === 0) {
        this.partnerCodeError.set(code.length === 8 ? 'Share code not found' : 'User not found');
        return;
      }

      const validResponses = this.normalizeUploadedResponses(data.responses);
      if (!this.isCompleteAssessmentResponses(validResponses)) {
        this.partnerCodeError.set('Invalid assessment data');
        return;
      }

      // Local backup (always)
      try {
        localStorage.setItem('ARCHETYPE_SYNASTRY_PARTNER', JSON.stringify({
          timestamp: new Date().toISOString(),
          partnerUid: partnerUid,
          shareCodeUsed: code.length === 8 ? code : null,
          partnerResponses: validResponses,
        }));
      } catch { /* storage unavailable */ }

      this.synastryPartnerUid.set(partnerUid);
      this.synastryPartnerResponses.set(validResponses);
      this.cdr.markForCheck();

      // Cloud connection record (signed-up only)
      const user = this.currentUser();
      if (user && !user.isAnonymous && partnerUid) {
        const connectionId = await this.storagePort.saveSynastryConnection(user.uid, partnerUid, code.length === 8 ? code : null);
        this.synastryConnectionId.set(connectionId);
      } else {
        this.synastryConnectionId.set(partnerUid);
      }
    } catch (err) {
      this.partnerCodeError.set('Failed to load partner data');
    } finally {
      this.partnerCodeLoading.set(false);
    }
  }

  restoreLocalBackup(): void {
    try {
      const backupStr = (() => { try { return JSON.stringify(localGet<unknown>('ARCHETYPE_COMPLETED_BACKUP', null)); } catch { return null; } })();
      if (!backupStr) return;
      const parsed = JSON.parse(backupStr);
      let responses = parsed.assessmentResponses;
      const results = parsed.results;

      if (responses && Array.isArray(responses)) {
        responses = this.normalizeUploadedResponses(responses);
        const isComplete = this.isCompleteAssessmentResponses(responses);

        // If we have complete responses but missing results, treat this as a draft backup
        // and resume analysis (no need for the user to retake the test).
        if (isComplete && !results) {
          this.assessmentResponses.set(responses);
          this.dimensionalExpressions.set(parsed.dimensionalExpressions || this.calculateAssessmentDimensions(responses));
          this.assessmentResults.set(null);
          this.appState.set('assessment-results');
          return;
        }

        if (results && isComplete) {
          this.assessmentResponses.set(responses);
          this.dimensionalExpressions.set(parsed.dimensionalExpressions || this.calculateAssessmentDimensions(responses));
          this.assessmentResults.set(results);
          this.appState.set('assessment-results');
        } else {
          console.warn('[Restore Local Backup] Saved backup is incomplete or invalid.');
        }
      }
    } catch (err) {
      console.error('[Restore Local Backup] Failed to parse local backup:', err);
    }
  }

  /**
   * Synastry partner upload. Mirrors onBackupUploaded but validates the
   * partner's assessment is complete (no unanswered 0 sentinels, all values
   * in 1–5) and writes the result to `synastryPartnerResponses` instead of
   * the user's own `assessmentResponses`. On invalid input, shows an alert
   * and does not touch the signal — same contract as onBackupUploaded.
   */
  onSynastryFileUploaded(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        let responses: number[] | null = null;
        let partnerUid: string | null = null;

        if (Array.isArray(parsed) && parsed.length > 50 && typeof parsed[0] === 'number') {
          // Raw number array
          responses = parsed;
        } else if (parsed.assessmentResponses && Array.isArray(parsed.assessmentResponses)) {
          // Download format: { app: 'ArchetypeAI', assessmentResponses: [...], results: {...} }
          responses = parsed.assessmentResponses;
          partnerUid = parsed.partnerUid || parsed.uid || null;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          // Legacy format: { type: '...', data: [{ response: ... }, ...] }
          responses = parsed.data.map((d: any) => typeof d === 'object' ? d.response : d);
        } else if (parsed.responses && Array.isArray(parsed.responses)) {
          // Alternative key
          responses = parsed.responses;
          partnerUid = parsed.partnerUid || parsed.uid || null;
        }

        if (!responses) {
          alert(this.translationService.t('backupInvalidFormat', 'universe', 'Invalid backup file format. Could not find assessment responses in the file.'));
          return;
        }

        // Normalize (preserves 0 sentinels so the completeness check below catches them)
        responses = this.normalizeUploadedResponses(responses);

        if (!this.isCompleteAssessmentResponses(responses)) {
          alert(this.translationService.t('backupIncomplete', 'universe', 'Uploaded backup is incomplete. Please upload a completed assessment backup.'));
          return;
        }

        // Local backup (always) — same key shape as loadPartnerByCode
        try {
          localStorage.setItem('ARCHETYPE_SYNASTRY_PARTNER', JSON.stringify({
            timestamp: new Date().toISOString(),
            partnerUid: partnerUid,
            shareCodeUsed: null,
            partnerResponses: responses,
          }));
        } catch { /* storage unavailable */ }

        this.synastryPartnerResponses.set(responses);
        if (partnerUid) this.synastryPartnerUid.set(partnerUid);
        this.cdr.markForCheck();
      } catch (err) {
        console.error('[Synastry backup] Parse Error:', err);
        alert(this.translationService.t('backupParseFailed', 'universe', 'Failed to parse backup data. Check the file format and try again.'));
      }
    };
    reader.readAsText(file);
    input.value = ''; // Reset input
  }


  private toastRestore(kind: 'innerverse' | 'assessment'): void {
    const ru = this.translationService.getLanguage() === 'ru';
    const msg = ru
      ? (kind === 'innerverse' ? STRINGS.app.alerts.mapRestored[1] : STRINGS.app.alerts.answersRestored[1])
      : (kind === 'innerverse' ? STRINGS.app.alerts.mapRestored[0] : STRINGS.app.alerts.answersRestored[0]);
    try { alert(msg); } catch { /* non-interactive */ }
  }

  onBackupUploaded(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        // Innerverse map backup ({shadow, resources, self, validity}) —
        // the file the report's "local copy" button downloads.
        if (parsed && parsed.shadow && parsed.resources && parsed.self) {
          localSet('INNERVERSE_PROFILE_V1', parsed);
          // Marker so the landing surfaces the map CTAs (the legacy restore
          // parser ignores this format's missing fields safely).
          if (localGet<unknown>('ARCHETYPE_COMPLETED_BACKUP', null) === null) {
            localStorage.setItem('ARCHETYPE_COMPLETED_BACKUP', '{}');
          }
          this.innerverseProfile.set(scoreProfile(parsed));
          this.toastRestore('innerverse');
          location.reload();
          return;
        }
        // Flexible: try to extract responses from any reasonable backup format
        let responses: number[] | null = null;
        let results: any = null;

        if (Array.isArray(parsed) && parsed.length > 50 && typeof parsed[0] === 'number') {
          // Raw number array
          responses = parsed;
        } else if (parsed.assessmentResponses && Array.isArray(parsed.assessmentResponses)) {
          // Download format: { app: 'ArchetypeAI', assessmentResponses: [...], results: {...} }
          responses = parsed.assessmentResponses;
          results = parsed.results || null;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          // Legacy format: { type: '...', data: [...] }
          responses = parsed.data.map((d: any) => typeof d === 'object' ? d.response : d);
        } else if (parsed.responses && Array.isArray(parsed.responses)) {
          // Alternative key
          responses = parsed.responses;
          results = parsed.results || null;
        }

        if (responses && responses.length > 50) {
          // Normalize to number array while preserving unanswered 0 sentinels.
          responses = this.normalizeUploadedResponses(responses);

          const isComplete = this.isCompleteAssessmentResponses(responses);

          if (results && isComplete) {
            this.assessmentResponses.set(responses);
            this.dimensionalExpressions.set(parsed.dimensionalExpressions || this.calculateAssessmentDimensions(responses));
            this.assessmentResults.set(results);
            this.appState.set('assessment-results');
          } else if (isComplete) {
            this.onAssessmentCompleted(responses);
          } else {
            this.resumeAssessment(responses);
          }
        } else {
          console.error('[Backup] Validation failed. Could not extract responses.', {
            keys: Object.keys(parsed || {}),
            hasAssessmentResponses: !!parsed?.assessmentResponses,
            hasData: !!parsed?.data,
            hasResponses: !!parsed?.responses,
            isArray: Array.isArray(parsed),
          });
          alert(this.translationService.t('backupInvalidFormat', 'universe', 'Invalid backup file format. Could not find assessment responses in the file.'));
        }
      } catch (err) {
        console.error('[Backup] Parse Error:', err);
        alert(this.translationService.t('backupParseFailed', 'universe', 'Failed to parse backup data. Check the file format and try again.'));
      }
    };
    reader.readAsText(file);
    input.value = ''; // Reset input
  }

  private calculateAssessmentDimensions(responses: number[]): DimensionalExpressions {
    if (!responses || responses.length < 52) {
      return { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 };
    }

    // Use the canonical scoring engine which handles undifferentiated patterns
    const poles = computePoleScores(responses);

    return {
      AGENCY: poles.center[0],
      TEMPERATURE: poles.center[1],
      FOCUS: poles.center[2],
      ATTACHMENT: poles.center[3]
    };
  }

  private normalizeUploadedResponses(responses: unknown[]): number[] {
    return responses.slice(0, this.assessmentQuestions.length).map((r: any) => {
      const value = (r && typeof r === 'object') ? (r.response ?? 0) : r;
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      if (num === 0) return 0;
      return Math.max(1, Math.min(5, Math.round(num)));
    });
  }

  private isCompleteAssessmentResponses(responses: number[]): boolean {
    return responses.length === this.assessmentQuestions.length &&
      responses.every(r => Number.isFinite(r) && r >= 1 && r <= 5);
  }

  private resumeAssessment(responses: number[]): void {
    localSet(LOCAL_STORAGE_KEY, responses);
    this.assessmentResponses.set(responses);
    this.assessmentResults.set(null);
    this.appState.set('assessment');
  }

  async viewMyUniverse(results: AssessmentResults): Promise<void> {
    if (!results || !results.pantheon) return;
    this.assessmentResults.set(results);

    // Save prompt moved to a pre-results gate (assessment-gate). Do not prompt here.

    this.initError.set(null);
    this.appState.set('universe');
    this.universeLoading.set(true);

    try {
      await this.waitForNextRender();
      const canvasEl = this.canvas()?.nativeElement;
      if (!canvasEl) {
        throw new Error(this.translationService.t('canvasMissing', 'universe', 'The universe canvas is missing.'));
      }
      await this.initializeUniverse(canvasEl);
      await this.waitForSceneReady();

      let newClusterId = '';
      const usedIds = new Set(this.universeState.allArchetypes().map(a => a.id));
      // Universe placement must be consistent across regenerations.
      // Always derive coordinates/prominence from the deterministic scoring engine (answers),
      // regardless of whether the narrative/pantheon fields came from an AI mode.
      const deterministicPantheon = generateArchetypes(this.assessmentResponses(), this.translationService.getLanguage() === 'ru' ? 'ru' : 'en')
        .archetypes;

      // Always render a complete, deterministic personal pantheon.
      // AI pantheon content may be partial (e.g. 2 parts), so we use deterministic as source-of-truth.
      const sourcePantheon = deterministicPantheon.length > 0 ? deterministicPantheon : results.pantheon;

      const constellationData = sourcePantheon.map((base, index) => {
        const generated = results.pantheon[index] || base;
        const stableCoords = (base?.coordinates || generated.coordinates || [0, 0, 0, 0]) as [number, number, number, number];
        const stableProminence = typeof base?.prominence === 'number'
          ? base.prominence
          : (typeof (generated as any).prominence === 'number' ? (generated as any).prominence : 0);

        const stableGenerated = {
          ...generated,
          ...base,
          coordinates: stableCoords,
          prominence: stableProminence,
        };

        const baseId = this.buildPantheonArchetypeId(stableGenerated, index);
        const isExistingPersonal = usedIds.has(baseId) && baseId.startsWith('personal_');
        let id = baseId;
        let suffix = 1;
        while (usedIds.has(id) && !isExistingPersonal) {
          id = `${baseId}_${suffix++}`;
        }
        usedIds.add(id);

        let hash = 0;
        const colorSeed = `${id}:${stableGenerated.cluster || ''}`;
        for (let c = 0; c < colorSeed.length; c++) {
          hash = colorSeed.charCodeAt(c) + ((hash << 5) - hash);
        }
        const hue = ((hash % 360) + 360) % 360;

        const newArchetype: Archetype = {
          ...stableGenerated,
          id,
          color: `hsl(${hue}, 70%, 70%)`,
          size: Math.max(0.4, Math.min(1.1, stableGenerated.size || 0.8)),
        };
        if (!newClusterId) newClusterId = newArchetype.cluster || 'personal_pantheon';
        this.vizRenderer?.addArchetype(newArchetype);
        return { archetypeId: newArchetype.id, percentage: stableProminence };
      });

      this.universeState.personalConstellation.set(constellationData);
      this.universeLoading.set(false);

      setTimeout(() => {
        if (newClusterId) {
          this.vizRenderer?.flyToConstellation(newClusterId);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to render personal universe:', error);
      this.universeLoading.set(false);
      this.appState.set('assessment-results');
      this.initError.set(error instanceof Error ? error.message : this.translationService.t('sceneInitFailed', 'universe', 'The universe could not initialize.'));
    }
  }

  private buildPantheonArchetypeId(generated: GeneratedArchetype, index: number): string {
    const maybeId = (generated as GeneratedArchetype & { id?: string }).id;

    // If an upstream system already provides a stable, valid personal id, keep it.
    // Otherwise: derive ID ONLY from stable signals (cluster + coordinates + rank) so that
    // regenerating with the same answers yields the same IDs/placement (names may vary by language/AI).
    if (maybeId && maybeId.startsWith('personal_') && /^[a-z0-9_]+$/.test(maybeId)) return maybeId;

    const coords = (generated.coordinates || [0, 0, 0, 0])
      .map(c => Math.round((Number(c) || 0) * 100))
      .join('_');
    const cluster = (generated.cluster || 'pantheon').replace(/[^a-z0-9_]/g, '') || 'pantheon';

    return `personal_${cluster}_${coords}_${index}`;
  }

  private startLoadingPhrases(): void {
    clearInterval(this.phraseInterval);
    let i = 0;
    this.currentLoadingPhrase.set(this.translationService.t(this.loadingPhraseKeys[i], 'universe.loadingPhrases'));
    this.phraseInterval = setInterval(() => {
      i = (i + 1) % this.loadingPhraseKeys.length;
      this.currentLoadingPhrase.set(this.translationService.t(this.loadingPhraseKeys[i], 'universe.loadingPhrases'));
    }, 1500);
  }

  private resetCoachConversation(): void {
    this.coachSuggestions.set([]);
    // Bump the sessionId so the welcome id changes — this forces
    // <app-coach-panel>'s @for to mount a *new* DOM node, replaying the
    // slide-in animation, instead of reusing the previous welcome's node.
    this.coachSessionId.update((n) => n + 1);
    let welcomeMessage = this.translationService.t('aiCoachWelcome', 'universe');
    
    if (this.isComparing()) {
      if (this.secondComparisonArchetype()) {
        const arch1Name = this.translationService.getArchetypeField(this.firstComparisonArchetype()!.id, 'name', this.firstComparisonArchetype()!.name);
        const arch2Name = this.translationService.getArchetypeField(this.secondComparisonArchetype()!.id, 'name', this.secondComparisonArchetype()!.name);
        welcomeMessage = this.translationService.t('coachComparing', 'universe')
          .replace('{archetype1}', arch1Name)
          .replace('{archetype2}', arch2Name);
      } else {
        const arch1Name = this.translationService.getArchetypeField(this.firstComparisonArchetype()!.id, 'name', this.firstComparisonArchetype()!.name);
        welcomeMessage = this.translationService.t('coachExploring', 'universe')
          .replace('{archetype1}', arch1Name);
      }
    } else if (this.selectedArchetype()) {
      const archName = this.translationService.getArchetypeField(this.selectedArchetype()!.id, 'name', this.selectedArchetype()!.name);
      welcomeMessage = this.translationService.t('coachSelected', 'universe')
        .replace('{archetype1}', archName);
    }
    
    this.coachMessages.set([
      {
        id: `welcome-${this.coachSessionId()}-0`,
        role: 'coach',
        content: welcomeMessage,
        timestamp: formatCoachClock(Date.now()),
      },
    ]);
  }

  // --- Universe Control Handlers ---
  onArchetypeSelected(archetype: Archetype): void {
    this.vizRenderer?.flyToArchetype(archetype);
  }

  onArchetypeCreated(archetype: Archetype): void {
    this.vizRenderer?.addArchetype(archetype);
  }


  // Open the AI coach overlay from the intro (landing) state - mounted in the
  // global overlay block gated on appState() === universe || intro.
  private readonly billing = inject(BillingService);

  openCoachPanel(): void { this.isCoachPanelOpen.set(true); }

  async startSubscription(): Promise<void> {
    const u = this.currentUser();
    try {
      await this.billing.startCheckout(u?.email ?? undefined);
    } catch (err) {
      console.warn('[Billing] checkout failed:', err);
      const ru = this.translationService.getLanguage() === 'ru';
      try { alert(STRINGS.app.alerts.checkoutUnavailable[ru ? 1 : 0]); } catch { /* non-interactive */ }
    }
  }

  toggleCoachPanel(): void {
    this.isCoachPanelOpen.update((v) => !v);
    if (this.isCoachPanelOpen() && this.coachMessages().length === 0) {
      // Initialize conversation: welcome gets a fresh id so the
      // <app-coach-panel> @for mounts a *new* DOM node and the slide-in
      // animation plays.
      this.resetCoachConversation();
    }
  }

  /**
   * Flip `coachMode` between `'general'` and `'parts'`. Bound from the
   * `<app-coach-panel>` header pill via `(modeToggle)`.
   *
   * History-preserve rule: we DO NOT wipe the conversation on a persona
   * flip mid-thread. A user in the middle of asking Parts questions
   * shouldn't lose context just because they want to compare tones; the
   * next `askCoach` simply prepends the IFS persona prefix (or strips it).
   *
   * Welcome-refresh rule: if the persona flip happens while the
   * conversation only has the welcome message, reset so the welcome
   * greeting reflects the persona too. Otherwise the greeting stays out
   * of sync with the new system instruction.
   */
  toggleCoachMode(): void {
    const wasParts = this.coachMode() === 'parts';
    this.coachMode.set(wasParts ? 'general' : 'parts');
    if (this.isCoachPanelOpen() && this.coachMessages().length <= 1) {
      this.resetCoachConversation();
    }
  }


  // ── Coach-panel wiring ─────────────────────────────────────────────
  // The standalone <app-coach-panel> owns its own textarea and emits the
  // user's text on (sendMessageRequest). We just need to delegate that
  // text into the existing askCoach pipeline.
  // The standalone <app-coach-panel> owns its own textarea and emits the
  // user's text on (sendMessageRequest). We delegate that text into the
  // existing askCoach pipeline. Returns the askCoach promise so callers
  // can `await` the round-trip (suggestion chips, regression tests).
  // Also guards against re-entrancy at the entry-point itself so a
  // chip-click during an in-flight call doesn't silently set
  // `coachQuestion` to the suggestion text.
  async onCoachPanelSend(text: string): Promise<void> {
    if (this.isCoachLoading()) return;
    const trimmed = (text ?? '').trim();
    if (!trimmed) return;
    this.coachQuestion.set(trimmed);
    await this.askCoach();
  }

  // ── Coach pipeline (Gemini) ────────────────────────────────────────
  //
  // Bound from <app-coach-panel> via (sendMessageRequest); also called
  // internally by onCoachPanelSend above.  Pipeline:
  //   1. Append the user's turn (with stable id + pre-formatted timestamp).
  //   2. Mark the panel loading; clear stale suggestions.
  //   3. Call Gemini with the user/model turns of the chat history plus
  //      the currently focused archetype(s) for situational context.
  //   4. Append the model response and 2-3 follow-up suggestions.
  //   5. On failure surface a local translated error turn and continue.
  async askCoach(): Promise<void> {
    const text = this.coachQuestion().trim();
    if (!text || this.isCoachLoading()) return;

    const now = Date.now();
    const userTurn: CoachMessage = {
      id: `u-${now}-${this.coachMessages().length}`,
      role: 'user',
      content: text,
      timestamp: formatCoachClock(now),
      chatRole: 'user',
    };
    this.coachMessages.update((m) => [...m, userTurn]);
    this.coachQuestion.set('');
    this.coachSuggestions.set([]);
    this.isCoachLoading.set(true);

    // GeminiService accepts `{role: 'user' | 'model'; content}` turns.
    // Map from `chatRole` so error turns (no chatRole) don't pollute the
    // history with the translated error text acting as a model turn.
    const history: ChatMessage[] = this.coachMessages()
      .filter((m): m is CoachMessage & { chatRole: 'user' | 'model' } => !!m.chatRole)
      .map((m) => ({ role: m.chatRole, content: m.content }));

    try {
      const resp = await this.geminiService.generateCoachResponse(
        history,
        this.firstComparisonArchetype() ?? this.selectedArchetype(),
        this.secondComparisonArchetype(),
        this.universeState.allArchetypes(),
        // Persona carries through to the GeminiService so the persona
        // prefix is composed at the prompt-engineering layer. The next
        // ask reuses the same `coachMode` — leftover parts-mode turns
        // stay wrapped in IFS persona until the user flips back.
        this.coachMode(),
      );
      const replyAt = Date.now();
      const modelTurn: CoachMessage = {
        id: `m-${replyAt}-${this.coachMessages().length}`,
        role: 'coach',
        content: resp.response,
        timestamp: formatCoachClock(replyAt),
        chatRole: 'model',
      };
      this.coachMessages.update((m) => [...m, modelTurn]);
      this.coachSuggestions.set(Array.isArray(resp.suggestions) ? resp.suggestions : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errAt = Date.now();
      // Intentionally omit `chatRole` so this turn is excluded from the
      // next Gemini history mapping — we don't want the translated
      // "Sorry, I encountered an issue." text to be replayed as a model
      // turn on the subsequent send.
      const errorTurn: CoachMessage = {
        id: `e-${errAt}-${this.coachMessages().length}`,
        role: 'coach',
        content: this.translationService.t('coachError', 'universe')
          .replace('{error}', message),
        timestamp: formatCoachClock(errAt),
        coachMood: 'thinking',
      };
      this.coachMessages.update((m) => [...m, errorTurn]);
    } finally {
      this.isCoachLoading.set(false);
    }
  }

  dismissInitError(): void {
    this.initError.set(null);
  }

  parseMarkdown(content: string): string {
    try {
      const html = marked.parse(content, { async: false }) as string;
      return DOMPurify.sanitize(html);
    } catch {
      return DOMPurify.sanitize(content);
    }
  }

  // === Helper Methods for Assessment Results Display ===
  getClusterColor(clusterId: string): string {
    const clusterColors: { [key: string]: string } = {
      gift_archetypes: 'var(--cluster-gift)',
      control_shadows: 'var(--cluster-control)',
      emotional_storm_shadows: 'var(--cluster-storm)',
      avoidant_intellectual_shadows: 'var(--cluster-avoidant)',
      anxious_connection_shadows: 'var(--cluster-anxious)',
      seductive_avoidance_shadows: 'var(--cluster-seductive)',
      disorganized_attachment_shadows: 'var(--cluster-disorganized)'
    };
    return clusterColors[clusterId] || 'var(--ink-main)';
  }

  getClusterIcon(clusterId: string): string {
    const clusterIcons: { [key: string]: string } = {
      gift_archetypes: '🎁',
      control_shadows: '🎭',
      emotional_storm_shadows: '⛈️',
      avoidant_intellectual_shadows: '🧠',
      anxious_connection_shadows: '💔',
      seductive_avoidance_shadows: '🌹',
      disorganized_attachment_shadows: '🌀'
    };
    return clusterIcons[clusterId] || '✨';
  }

  get clusterIconStyle(): { [key: string]: string } {
    return {
      gift_archetypes: '🎁',
      control_shadows: '🎭',
      emotional_storm_shadows: '⛈️',
      avoidant_intellectual_shadows: '🧠',
      anxious_connection_shadows: '💔',
      seductive_avoidance_shadows: '🌹',
      disorganized_attachment_shadows: '🌀'
    };
  }

  getArchetypeMood(clusterId: string): 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking' {
    const clusterMoods: { [key: string]: 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking' } = {
      gift_archetypes: 'excited',
      control_shadows: 'thinking',
      emotional_storm_shadows: 'sad',
      avoidant_intellectual_shadows: 'thinking',
      anxious_connection_shadows: 'sad',
      seductive_avoidance_shadows: 'happy',
      disorganized_attachment_shadows: 'thinking'
    };
    return clusterMoods[clusterId] || 'neutral';
  }
}
