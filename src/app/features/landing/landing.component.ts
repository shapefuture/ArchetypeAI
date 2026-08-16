import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy,
  afterNextRender, computed, inject, signal, viewChild, output, input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { gsap } from 'gsap';
import { User } from '../../core/ports/auth.port';
import { PART_COPY } from '../../core/data/part-copy';

interface ShowcaseArchetype {
  id: string;
  type: string;
  color: string;
  mood: 'happy' | 'joy' | 'neutral' | 'wise';
  path: string;
  stats: { agency: number; temperature: number; focus: number; attachment: number };
}

interface ShowcasePainPoint {
  icon: string;
  color: string;
  titleKey: string;
  textKey: string;
}

const C = {
  coral: '#FF6B5B', mustard: '#FFD93D', sage: '#7BC5A0', mint: '#6EE7B7',
  sky: '#7DD3FC', lavender: '#C4B5FD', rose: '#FCA5A5', orange: '#FB923C', ink: '#1C1917'
};

// The REAL taxonomy (core/data/parts.ts): 7 managers + 3 firefighters +
// 4 exiles + 4 resources = the 18 inner parts the battery measures.
const SHAPES = [
  'M50 8 C78 8 92 28 88 52 C85 76 68 92 50 92 C32 92 15 76 12 52 C8 28 22 8 50 8 Z',
  'M50 5 L72 28 L95 22 L78 50 L95 78 L68 68 L50 95 L32 68 L5 78 L22 50 L5 22 L28 28 Z',
  'M22 22 L78 22 L78 78 L22 78 Z',
  'M50 5 L62 38 L98 38 L70 58 L80 92 L50 72 L20 92 L30 58 L2 38 L38 38 Z',
  'M50 10 C82 10 94 38 86 62 C78 86 64 94 50 94 C36 94 22 86 14 62 C6 38 18 10 50 10 Z',
  'M50 10 Q82 28 82 50 Q82 82 50 92 Q18 82 18 50 Q18 28 50 10 Z',
  'M50 8 L90 68 L10 68 Z',
  'M50 5 L92 26 L92 74 L50 95 L8 74 L8 26 Z',
];
const shape = (i: number) => SHAPES[i % SHAPES.length];

const s = (agency: number, temperature: number, focus: number, attachment: number) =>
  ({ agency, temperature, focus, attachment });

const ARCHETYPES: ShowcaseArchetype[] = [
  // Managers — preemptive order-keepers (wise faces)
  { id: 'taskmaster',    type: 'manager',    color: '#ffb03a', mood: 'wise',    path: shape(0), stats: s(82, 60, 78, 30) },
  { id: 'inner_critic',  type: 'manager',    color: '#9a6bff', mood: 'wise',    path: shape(3), stats: s(55, 40, 85, 45) },
  { id: 'pleaser',       type: 'manager',    color: '#ff9fd1', mood: 'wise',    path: shape(4), stats: s(45, 70, 55, 88) },
  { id: 'controller',    type: 'manager',    color: '#57c4ff', mood: 'wise',    path: shape(2), stats: s(75, 50, 90, 40) },
  { id: 'analyst',       type: 'manager',    color: '#a5e3ff', mood: 'wise',    path: shape(5), stats: s(50, 25, 88, 35) },
  { id: 'hermit',        type: 'manager',    color: '#b9b3e8', mood: 'wise',    path: shape(6), stats: s(40, 20, 70, 25) },
  { id: 'bypasser',      type: 'manager',    color: '#8fe3b0', mood: 'wise',    path: shape(7), stats: s(48, 45, 50, 40) },
  // Firefighters — reactive extinguishers (joy faces)
  { id: 'numb',          type: 'firefighter', color: '#c9c4f0', mood: 'joy',    path: shape(1), stats: s(30, 15, 45, 20) },
  { id: 'rebel',         type: 'firefighter', color: '#ff6b57', mood: 'joy',    path: shape(1), stats: s(88, 85, 35, 30) },
  { id: 'charmer',       type: 'firefighter', color: '#ffc23c', mood: 'joy',    path: shape(0), stats: s(65, 80, 50, 75) },
  // Exiles — the young carriers (neutral faces)
  { id: 'abandoned',     type: 'exile',       color: '#f4a7c3', mood: 'neutral', path: shape(4), stats: s(25, 55, 30, 92) },
  { id: 'ashamed',       type: 'exile',       color: '#c084fc', mood: 'neutral', path: shape(5), stats: s(20, 40, 35, 85) },
  { id: 'frightened',    type: 'exile',       color: '#89d0f5', mood: 'neutral', path: shape(6), stats: s(22, 60, 28, 90) },
  { id: 'unseen',        type: 'exile',       color: '#b0b7c9', mood: 'neutral', path: shape(7), stats: s(28, 35, 40, 80) },
  // Resources — the grown strengths (happy faces)
  { id: 'sage',          type: 'resource',    color: '#46d8ae', mood: 'happy',  path: shape(3), stats: s(60, 30, 75, 45) },
  { id: 'warrior',       type: 'resource',    color: '#ef5a45', mood: 'happy',  path: shape(2), stats: s(90, 55, 80, 35) },
  { id: 'caregiver',     type: 'resource',    color: '#ffd93d', mood: 'happy',  path: shape(4), stats: s(55, 75, 60, 82) },
  { id: 'explorer',      type: 'resource',    color: '#4cc9f0', mood: 'happy',  path: shape(0), stats: s(78, 65, 55, 40) },
];

/** Bilingual display names — the register the report uses. */
const PART_NAMES: Record<string, [string, string]> = {
  taskmaster: ['The Taskmaster', 'Деятель'],
  inner_critic: ['The Inner Critic', 'Внутренний критик'],
  pleaser: ['The Pleaser', 'Угодник'],
  controller: ['The Controller', 'Контролёр'],
  analyst: ['The Analyst', 'Аналитик'],
  hermit: ['The Hermit', 'Отшельник'],
  bypasser: ['The Bypasser', 'Обходчик'],
  numb: ['The Numb', 'Онемение'],
  rebel: ['The Rebel', 'Бунтарь'],
  charmer: ['The Charmer', 'Обаяшка'],
  abandoned: ['The Abandoned One', 'Брошенный'],
  ashamed: ['The Ashamed One', 'Стыдящийся'],
  frightened: ['The Frightened One', 'Напуганный'],
  unseen: ['The Unseen One', 'Незамеченный'],
  sage: ['The Sage', 'Мудрец'],
  warrior: ['The Warrior', 'Воин'],
  caregiver: ['The Caregiver', 'Заботник'],
  explorer: ['The Explorer', 'Исследователь'],
};

const CLASS_LABELS: Record<string, [string, string]> = {
  manager: ['Manager', 'Менеджер'],
  firefighter: ['Firefighter', 'Пожарный'],
  exile: ['Exile', 'Изгнанник'],
  resource: ['Resource', 'Ресурс'],
};

/** Resource face-lines — shadow parts read PART_COPY (§1.9). */
const RESOURCE_FACE: Record<string, [string, string]> = {
  sage: ['The quiet knowing that sees the whole field.', 'Тихое знание, которое видит всю картину.'],
  warrior: ['The clear no that protects what matters.', 'Ясное «нет», которое защищает важное.'],
  caregiver: ['The warm tending that asks nothing back.', 'Тепло, которое заботится и ничего не ждёт взамен.'],
  explorer: ['The curious reach toward the new.', 'Любопытный шаг навстречу новому.'],
};

const PAIN_POINTS: ShowcasePainPoint[] = [
  { icon: '\u{1F32A}️', color: C.coral, titleKey: 'painTitle1', textKey: 'painText1' },
  { icon: '⚡', color: C.mustard, titleKey: 'painTitle2', textKey: 'painText2' },
  { icon: '\u{1FA9E}', color: C.lavender, titleKey: 'painTitle3', textKey: 'painText3' },
  { icon: '\u{1F4A3}', color: C.sky, titleKey: 'painTitle4', textKey: 'painText4' },
  { icon: '⚓', color: C.rose, titleKey: 'painTitle5', textKey: 'painText5' },
  { icon: '\u{1F300}', color: C.mint, titleKey: 'painTitle6', textKey: 'painText6' }
];

// Constellation wiring for the 18-part layout: family rings, the
// manager→exile guarding links (who protects whom), and resource spokes.
const EDGES: [number, number][] = [
  ...Array.from({ length: 18 }, (_, i) => [i, (i + 1) % 18] as [number, number]),
  // Guards: each exile is shielded by the manager that binds it
  [2, 10],  // pleaser → abandoned
  [1, 11],  // inner_critic → ashamed
  [3, 12],  // controller → frightened
  [4, 13],  // analyst → unseen
  // Resource spokes: what each resource grows from
  [7, 14],  // numb → sage
  [8, 15],  // rebel → warrior
  [10, 16], // abandoned → caregiver
  [9, 17],  // charmer → explorer
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnDestroy {
  readonly ts = inject(TranslationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly hostEl = this.el;
  private readonly cdr = inject(ChangeDetectorRef);

  readonly user = input<User | null>(null);

  // Outputs
  readonly startTest = output<void>();
  readonly quickScanRequested = output<void>();
  readonly therapistRequested = output<void>();
  readonly exploreUniverse = output<void>();
  readonly langToggle = output<void>();
  readonly backupUpload = output<Event>();
  readonly restoreLocalBackup = output<void>();
  readonly loginRequested = output<void>();
  readonly dashboardRequested = output<void>();
  readonly logoutRequested = output<void>();

  // UI State
  readonly mobileMenuOpen = signal(false);
  readonly synSelected = signal<string[]>([]);
  readonly enginePaused = signal(false);
  readonly navScrolled = signal(false);
  readonly flippedCards = signal<Set<string>>(new Set());
  readonly hasCompletedBackup = signal(false);
  // In-progress test (auto-saved per answer, before completion). Distinct
  // from hasCompletedBackup (only true after the AI returns). Drives the
  // "Resume test in progress — X of 64" CTA on the landing page hero.
  readonly hasInProgressBackup = signal(false);
  readonly answeredCount = signal(0);
  readonly totalQuestions = 64;

  // Mouse tracking for parallax and cursor effects
  private mouseX = 0;
  private mouseY = 0;
  private parallaxFrame = 0;

  // Template data
  readonly archetypes = ARCHETYPES;
  readonly painPoints = PAIN_POINTS;
  readonly edges = EDGES;

  // ViewChilds
  readonly codexContainer = viewChild<ElementRef<HTMLDivElement>>('codexContainer');
  readonly engineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('engineCanvas');
  readonly engineWrapper = viewChild<ElementRef<HTMLDivElement>>('engineWrapper');
  readonly backupFileInput = viewChild<ElementRef<HTMLInputElement>>('backupFileInput');

  // Internal
  private svgCache = new Map<string, SafeHtml>();
  private cleanupFns: (() => void)[] = [];
  private codexDrag = { active: false, startX: 0, scrollLeft: 0 };
  private cursorEl: HTMLDivElement | null = null;
  private cursorTrail: HTMLDivElement[] = [];

  // Computed
  readonly isLoggedIn = computed(() => {
    const u = this.user();
    return !!u && !u.isAnonymous;
  });

  readonly synResult = computed(() => {
    const sel = this.synSelected();
    if (sel.length < 2) return null;
    const a1 = ARCHETYPES.find(a => a.id === sel[0]);
    const a2 = ARCHETYPES.find(a => a.id === sel[1]);
    if (!a1 || !a2) return null;
    if (a1.id === a2.id) return { titleKey: 'synEcho', descKey: 'synEchoDesc', label: 'Echo Chamber' };
    // A protector paired with the exile it guards reads as dynamic tension;
    // everything else flows through the composite complexes.
    const pair = [a1.type, a2.type];
    const isGuard = pair.includes('exile') && (pair.includes('manager') || pair.includes('firefighter'));
    if (isGuard) return { titleKey: 'synTension', descKey: 'synTensionDesc', label: 'Dynamic Tension' };
    return { titleKey: 'synComplex', descKey: 'synComplexDesc', label: 'Complex Flow' };
  });

  readonly synOneSelected = computed(() => {
    const sel = this.synSelected();
    if (sel.length !== 1) return null;
    return ARCHETYPES.find(a => a.id === sel[0]) || null;
  });

  readonly isEnglish = computed(() => this.ts.getLanguage() === 'en');

  constructor() {
    afterNextRender(() => {
      this.setupCustomCursor();
      this.setupScrollReveal();
      this.setupNavScroll();
      this.setupCodexDrag();
      this.setupHeroParallax();
      this.setupMagneticButtons();
      this.runEntranceAnimation();
      this.initEngine();
      this.checkLocalBackup();
      this.checkInProgressBackup();
    });
  }

  private checkLocalBackup(): void {
    try {
      const backup = localStorage.getItem('ARCHETYPE_COMPLETED_BACKUP');
      if (backup) {
        this.hasCompletedBackup.set(true);
      }
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Detects an in-progress assessment: any non-zero answers in
   * ARCHETYPE_ASSESSMENT_RESPONSES. The assessment panel auto-saves every
   * answer to this key, so a half-finished test is recoverable even if the
   * user reloads the page. We display "Resume test (X of 64)" as a CTA.
   */
  private checkInProgressBackup(): void {
    try {
      const raw = localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES');
      if (!raw) return;
      const responses = JSON.parse(raw);
      if (!Array.isArray(responses)) return;
      const answered = responses.filter((r: unknown) => typeof r === 'number' && r !== 0).length;
      if (answered > 0) {
        this.hasInProgressBackup.set(true);
        this.answeredCount.set(answered);
      }
    } catch {
      // Storage unavailable
    }
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach(fn => fn());
    cancelAnimationFrame(this.parallaxFrame);
    if (this.cursorEl) this.cursorEl.remove();
    this.cursorTrail.forEach(t => t.remove());
  }

  t(key: string): string {
    return this.ts.t(key, 'landing');
  }

  // ===== CUSTOM CURSOR =====
  private setupCustomCursor(): void {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-cursor';
    this.cursorEl.style.cssText = 'position:fixed;width:20px;height:20px;border-radius:50%;border:2px solid #1C1917;pointer-events:none;z-index:100000;transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1),width 0.2s,height 0.2s,border-color 0.2s;mix-blend-mode:difference;transform:translate(-50%,-50%);background:transparent;';
    document.body.appendChild(this.cursorEl);

    // Trail particles
    for (let i = 0; i < 4; i++) {
      const trail = document.createElement('div');
      trail.style.cssText = `position:fixed;width:${6-i}px;height:${6-i}px;border-radius:50%;background:#D55E00;pointer-events:none;z-index:99999;opacity:${0.3-i*0.06};transform:translate(-50%,-50%);transition:all ${0.15+i*0.08}s ease-out;`;
      document.body.appendChild(trail);
      this.cursorTrail.push(trail);
    }

    const onMove = (e: MouseEvent) => {
      if (!this.cursorEl) return;
      gsap.to(this.cursorEl, { left: e.clientX, top: e.clientY, duration: 0.08, ease: 'power2.out' });
      this.cursorTrail.forEach((trail, i) => {
        gsap.to(trail, { left: e.clientX, top: e.clientY, duration: 0.12 + i * 0.06, ease: 'power2.out' });
      });
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };

    // Enlarge cursor on interactive elements
    const onOver = () => {
      if (!this.cursorEl) return;
      this.cursorEl.style.width = '40px';
      this.cursorEl.style.height = '40px';
      this.cursorEl.style.borderColor = '#D55E00';
    };
    const onOut = () => {
      if (!this.cursorEl) return;
      this.cursorEl.style.width = '20px';
      this.cursorEl.style.height = '20px';
      this.cursorEl.style.borderColor = '#1C1917';
    };

    document.addEventListener('mousemove', onMove);
    this.cleanupFns.push(() => document.removeEventListener('mousemove', onMove));

    // Attach hover effects after a tick so DOM is ready
    setTimeout(() => {
      const host = this.el.nativeElement;
      const interactives = host.querySelectorAll('button, a, [role="button"], .neo-card, .hover-lift');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', onOver);
        el.addEventListener('mouseleave', onOut);
      });
    }, 500);
  }

  // ===== HERO PARALLAX =====
  private setupHeroParallax(): void {
    const host = this.el.nativeElement;
    const heroSection = host.querySelector('.hero-section');
    const floatingBlobs = host.querySelectorAll('.hero-float-blob');
    if (!heroSection) return;

    const animate = () => {
      const rect = heroSection.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (this.mouseX - centerX) / rect.width;
      const dy = (this.mouseY - centerY) / rect.height;

      floatingBlobs.forEach((blob, i) => {
        const depth = 15 + i * 8;
        gsap.to(blob, {
          x: dx * depth,
          y: dy * depth,
          duration: 0.8 + i * 0.2,
          ease: 'power2.out'
        });
      });

      this.parallaxFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  // ===== MAGNETIC BUTTONS =====
  private setupMagneticButtons(): void {
    const host = this.el.nativeElement;
    const buttons = host.querySelectorAll('.neo-btn, .magentic-target');

    buttons.forEach(btn => {
      const htmlBtn = btn as HTMLElement;
      const onMove = (e: MouseEvent) => {
        const rect = htmlBtn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(htmlBtn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power2.out' });
      };
      const onLeave = () => {
        gsap.to(htmlBtn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      };
      htmlBtn.addEventListener('mousemove', onMove);
      htmlBtn.addEventListener('mouseleave', onLeave);
      this.cleanupFns.push(() => {
        htmlBtn.removeEventListener('mousemove', onMove);
        htmlBtn.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  // ===== ENTRANCE ANIMATION =====
  private runEntranceAnimation(): void {
    const host = this.el.nativeElement;

    // Navbar slides down
    const nav = host.querySelector('.landing-nav');
    if (nav) {
      gsap.fromTo(nav,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );
    }

    // Hero elements stagger
    const heroElements = host.querySelectorAll('.hero-stagger');
    if (heroElements.length) {
      gsap.fromTo(heroElements,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.3 }
      );
    }

    // Hero title letter reveal
    const heroTitle = host.querySelector('.hero-title-animated');
    if (heroTitle) {
      gsap.fromTo(heroTitle,
        { y: 60, opacity: 0, clipPath: 'inset(100% 0 0 0)' },
        { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.out', delay: 0.2 }
      );
    }

    // Stats counter animation
    const statNums = host.querySelectorAll('.stat-animate');
    statNums.forEach((el) => {
      const text = el.textContent || '';
      const match = text.match(/\d+/);
      if (match) {
        const target = parseInt(match[0], 10);
        const proxy = { val: 0 };
        gsap.to(proxy, {
          val: target,
          duration: 1.5,
          delay: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = text.replace(/\d+/, Math.round(proxy.val).toString());
          }
        });
      }
    });
  }

  // ===== SVG GENERATION =====
  private generateBlobSvgString(arch: ShowcaseArchetype, size: number, isHovered = false): string {
    const scaleY = isHovered ? 0.97 : 1;
    const ecx = 50, eyeY = 44, er = 4.5, eSp = 14;
    const mY = 62;

    let mouth = '';
    if (arch.mood === 'joy') mouth = `<polygon points="${ecx-6},${mY} ${ecx+7},${mY-3} ${ecx+2},${mY+7}" fill="${C.ink}" />`;
    else if (arch.mood === 'wise') mouth = `<path d="M${ecx-9},${mY} Q${ecx},${mY+8} ${ecx+9},${mY}" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round" />`;
    else mouth = `<line x1="${ecx-9}" y1="${mY}" x2="${ecx+9}" y2="${mY}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" />`;

    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;transition:filter 0.3s;${isHovered ? `filter:drop-shadow(0 6px 12px ${arch.color}88);` : ''}">
      <path d="${arch.path}" fill="rgba(28,25,23,0.15)" transform="translate(4,5) scale(1,${scaleY})" style="transform-origin:50px 50px;" />
      <path d="${arch.path}" fill="${arch.color}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round" style="transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);transform:${isHovered ? 'scale(1.04)' : 'scale(1)'};transform-origin:center;" />
      <g class="blob-eyes" data-mouse="true" style="transition:transform 0.3s;transform:translateY(${isHovered ? '-2px' : '0px'});">
        <circle cx="${ecx-eSp}" cy="${eyeY}" r="${er}" fill="${C.ink}" class="animate-blink" />
        <circle cx="${ecx+eSp}" cy="${eyeY}" r="${er}" fill="${C.ink}" class="animate-blink" />
        <circle cx="${ecx-eSp+2}" cy="${eyeY-2}" r="${er*0.4}" fill="#FFF" />
        <circle cx="${ecx+eSp+2}" cy="${eyeY-2}" r="${er*0.4}" fill="#FFF" />
        ${mouth}
        <ellipse cx="${ecx-eSp-6}" cy="${mY-3}" rx="5.5" ry="3.2" fill="rgba(255,100,80,0.28)" />
        <ellipse cx="${ecx+eSp+6}" cy="${mY-3}" rx="5.5" ry="3.2" fill="rgba(255,100,80,0.28)" />
      </g>
    </svg>`;
  }

  getBlobHtml(archId: string, size: number, isHovered = false): SafeHtml {
    const key = `${archId}-${size}-${isHovered}`;
    if (!this.svgCache.has(key)) {
      const arch = ARCHETYPES.find(a => a.id === archId);
      if (!arch) return '';
      this.svgCache.set(key, this.sanitizer.bypassSecurityTrustHtml(this.generateBlobSvgString(arch, size, isHovered)));
    }
    return this.svgCache.get(key)!;
  }

  // ===== SYNERGY LOGIC =====
  toggleSynergy(archId: string): void {
    const sel = [...this.synSelected()];
    if (sel.includes(archId)) {
      this.synSelected.set(sel.filter(id => id !== archId));
    } else if (sel.length < 2) {
      sel.push(archId);
      this.synSelected.set(sel);
    } else {
      sel.shift();
      sel.push(archId);
      this.synSelected.set(sel);
    }
  }

  isSynActive(archId: string): boolean {
    return this.synSelected().includes(archId);
  }

  // ===== CARD FLIP =====
  toggleFlip(archId: string): void {
    const current = new Set(this.flippedCards());
    if (current.has(archId)) current.delete(archId);
    else current.add(archId);
    this.flippedCards.set(current);
  }

  isFlipped(archId: string): boolean {
    return this.flippedCards().has(archId);
  }

  // ===== MOBILE MENU =====
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // ===== ENGINE PAUSE =====
  toggleEnginePause(): void {
    this.enginePaused.update(v => !v);
  }

  // ===== BACKUP UPLOAD =====
  triggerBackupUpload(): void {
    this.backupFileInput()?.nativeElement.click();
  }

  onBackupUpload(event: Event): void {
    this.backupUpload.emit(event);
  }

  // ===== SCROLL REVEAL =====
  private setupScrollReveal(): void {
    const host = this.el.nativeElement;
    const revealNodes = Array.from(host.querySelectorAll('.reveal-on-scroll')) as HTMLElement[];
    revealNodes.forEach((node, i) => {
      node.style.transitionDelay = `${Math.min(i * 60, 260)}ms`;
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');

          // GSAP stagger for children
          const children = (e.target as HTMLElement).querySelectorAll('.stagger-child');
          if (children.length) {
            gsap.fromTo(children,
              { y: 30, opacity: 0, scale: 0.95 },
              { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
            );
          }

          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, root: host });
    revealNodes.forEach(el => observer.observe(el));
    revealNodes.slice(0, 4).forEach(el => el.classList.add('is-revealed'));
    this.cleanupFns.push(() => observer.disconnect());
  }

  // ===== NAVBAR SCROLL =====
  private setupNavScroll(): void {
    const host = this.el.nativeElement;
    const handler = () => this.navScrolled.set(host.scrollTop > 50);
    host.addEventListener('scroll', handler, { passive: true });
    this.cleanupFns.push(() => host.removeEventListener('scroll', handler));
  }

  // ===== CODEX DRAG SCROLL =====
  private setupCodexDrag(): void {
    const el = this.codexContainer()?.nativeElement;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      this.codexDrag.active = true;
      this.codexDrag.startX = e.pageX - el.offsetLeft;
      this.codexDrag.scrollLeft = el.scrollLeft;
    };
    const onLeave = () => { this.codexDrag.active = false; };
    const onUp = () => { this.codexDrag.active = false; };
    const onMove = (e: MouseEvent) => {
      if (!this.codexDrag.active) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = this.codexDrag.scrollLeft - (x - this.codexDrag.startX);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    this.cleanupFns.push(() => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMove);
    });
  }

  // ===== 3D MAP ENGINE =====
  /** PERF: the engine only renders while its canvas is on screen. */
  readonly engineOffscreen = signal(true);

  private initEngine(): void {
    const canvasEl = this.engineCanvas()?.nativeElement;
    const wrapperEl = this.engineWrapper()?.nativeElement;
    if (!canvasEl || !wrapperEl) return;

    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(entries => {
        this.engineOffscreen.set(!entries.some(e => e.isIntersecting));
      }, { rootMargin: '120px' }).observe(wrapperEl);
    } else {
      this.engineOffscreen.set(false);
    }

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    let cam = { rx: 0.35, ry: 0.5 };
    let tcam = { rx: 0.35, ry: 0.5 };
    let dragging = false, lx = 0, ly = 0, velX = 0, velY = 0;
    let time = 0;
    let animFrame = 0;

    // PERF (reference EngineScene): cached layout reads + capped backing
    // store. Retina DPR 2 quadruples every fill; 1.5 is visually identical
    // for a slowly-rotating galaxy, and the width cap bounds the worst case.
    let vw = 0, vh = 0, dprEff = 1;
    const bgCanvas = document.createElement('canvas');
    const resize = () => {
      vw = wrapperEl.offsetWidth;
      vh = wrapperEl.offsetHeight;
      dprEff = Math.min(window.devicePixelRatio || 1, 1.5, 1600 / Math.max(vw, 1));
      canvasEl.width = Math.max(1, Math.round(vw * dprEff));
      canvasEl.height = Math.max(1, Math.round(vh * dprEff));
      // Pre-render the background gradient once per resize — a per-frame
      // createRadialGradient over a 4K-pixel canvas was the top frame cost.
      bgCanvas.width = canvasEl.width;
      bgCanvas.height = canvasEl.height;
      const bctx = bgCanvas.getContext('2d')!;
      const bg = bctx.createRadialGradient(
        bgCanvas.width / 2, bgCanvas.height / 2, 0,
        bgCanvas.width / 2, bgCanvas.height / 2, Math.max(bgCanvas.width, bgCanvas.height) * 0.7,
      );
      bg.addColorStop(0, '#191833');
      bg.addColorStop(0.6, '#12122b');
      bg.addColorStop(1, '#0d0d24');
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    const blobImgs: Record<string, HTMLImageElement> = {};
    ARCHETYPES.forEach(arch => {
      const svgStr = this.generateBlobSvgString(arch, 100);
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
      blobImgs[arch.id] = img;
    });

    // PERF (reference): glow sprites pre-rendered once per archetype —
    // replaces 2 createRadialGradient + 2 arc fills per node per frame
    // (36 gradient allocations/frame) with 2 image blits per node.
    const glowSprites: Record<string, HTMLCanvasElement[]> = {};
    ARCHETYPES.forEach(arch => {
      const layers: HTMLCanvasElement[] = [];
      ([[0.9, '30'], [0.6, '70']] as const).forEach(([radiusF, alphaHex]) => {
        const S = 128;
        const c = document.createElement('canvas');
        c.width = S; c.height = S;
        const g = c.getContext('2d')!;
        const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
        grad.addColorStop(0, arch.color + alphaHex);
        grad.addColorStop(1, arch.color + '00');
        g.fillStyle = grad;
        g.fillRect(0, 0, S, S);
        layers.push(c);
      });
      glowSprites[arch.id] = layers;
    });

    // PERF: label metrics cache — measureText re-parses the font each call;
    // snapped integer sizes keep the cache tiny and hit-stable.
    const labelWidthCache = new Map<string, number>();
    const labelWidth = (label: string, fontSize: number): number => {
      const key = fontSize + '|' + label;
      let w = labelWidthCache.get(key);
      if (w === undefined) {
        ctx.font = `600 ${fontSize}px 'Fredoka','Comfortaa','Nunito',sans-serif`;
        w = ctx.measureText(label).width + 12;
        labelWidthCache.set(key, w);
      }
      return w;
    };

    // PERF: rotation trig hoisted out of project() — was recomputed for
    // every projected point (100+ sin/cos pairs per frame).
    let rcx = 1, rsx = 0, rcy = 1, rsy = 0;
    const updateRotation = () => {
      rcx = Math.cos(cam.rx); rsx = Math.sin(cam.rx);
      rcy = Math.cos(cam.ry); rsy = Math.sin(cam.ry);
    };
    const project = (x: number, y: number, z: number) => {
      const y1 = y * rcx - z * rsx, z1 = y * rsx + z * rcx;
      const x2 = x * rcy + z1 * rsy, z2 = -x * rsy + z1 * rcy;
      const depth = 9 + z2;
      if (depth < 0.5) return null;
      const sc = 5 / depth;
      return { sx: vw / 2 + x2 * sc * vw * 0.06, sy: vh / 2 - y1 * sc * vw * 0.06, sc, z2 };
    };

    const drawBackground = () => {
      // One blit of the cached gradient canvas instead of a fresh gradient.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.setTransform(dprEff, 0, 0, dprEff, 0, 0);
    };

    const drawGrids = () => {
      const gridSize = 10;
      const divisions = 10;
      const step = gridSize / divisions;
      const half = gridSize / 2;
      // PERF: batched paths — one beginPath/stroke per (major, plane)
      // bucket instead of 2 strokes per grid line (60+ stroke calls/frame).
      for (const isMajor of [true, false]) {
        ctx.strokeStyle = `rgba(226,230,246,${isMajor ? 0.06 : 0.025})`;
        ctx.lineWidth = isMajor ? 0.6 : 0.3;
        ctx.beginPath();
        for (let i = 0; i <= divisions; i++) {
          if ((i % 5 === 0) !== isMajor) continue;
          const pos = -half + i * step;
          const seg = (a: { sx: number; sy: number } | null, b: { sx: number; sy: number } | null) => {
            if (a && b) { ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); }
          };
          seg(project(-half, 0, pos), project(half, 0, pos));
          seg(project(pos, 0, -half), project(pos, 0, half));
          seg(project(-half, pos, 0), project(half, pos, 0));
          seg(project(pos, -half, 0), project(pos, half, 0));
          seg(project(0, -half, pos), project(0, half, pos));
          seg(project(0, pos, -half), project(0, pos, half));
        }
        ctx.stroke();
      }
    };

    const drawAxisLabels = () => {
      const labels = [
        { text: 'Agency', pos: [6.5, 0, 0], color: '#E1846D' },
        { text: 'Temperature', pos: [0, 6.5, 0], color: '#FCA5A5' },
        { text: 'Focus', pos: [0, 0, 6.5], color: '#5EEAD4' },
      ];
      labels.forEach(l => {
        const p = project(...l.pos as [number, number, number]);
        if (!p || p.sc < 0.15) return;
        const fontSize = Math.max(10, Math.min(15, Math.round(13 * p.sc)));
        ctx.font = `600 ${fontSize}px 'Fredoka','Comfortaa','Nunito',sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = labelWidth(l.text, fontSize) + 4;
        const th = fontSize + 10;
        ctx.fillStyle = 'rgba(18, 18, 43, 0.85)';
        ctx.strokeStyle = l.color + '66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.sx - tw / 2, p.sy - th / 2, tw, th, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, p.sx, p.sy);
      });
    };

    // PERF (reference): 30fps cap — the scene drifts slowly, so rendering
    // every other frame halves all rasterization cost for no visible loss.
    const FRAME_MS = 1000 / 30;
    let lastFrame = 0;

    const loop = (now = 0) => {
      // PERF: no work at all when paused (manual), offscreen, or tab hidden —
      // previously this still drew the full scene every frame.
      if (this.enginePaused() || this.engineOffscreen() || document.hidden) {
        animFrame = requestAnimationFrame(loop);
        return;
      }
      if (now - lastFrame < FRAME_MS) {
        animFrame = requestAnimationFrame(loop);
        return;
      }
      lastFrame = now;
      time += 0.006 * 2;
      if (!dragging) {
        tcam.ry += 0.004;
        tcam.rx += velX; tcam.ry += velY;
        velX *= 0.94; velY *= 0.94;
      }
      tcam.rx = Math.max(-1.0, Math.min(1.0, tcam.rx));
      cam.rx += (tcam.rx - cam.rx) * 0.12;
      cam.ry += (tcam.ry - cam.ry) * 0.12;
      updateRotation();

      drawBackground();
      drawGrids();

      const proj = ARCHETYPES.map((arch, i) => {
        const x = (arch.stats.agency - 50) / 50 * 5;
        const y = (arch.stats.temperature - 50) / 50 * 5;
        const z = (arch.stats.focus - 50) / 50 * 5;
        const fY = Math.sin(time * 1.5 + i * 1.2) * 0.15;
        const fX = Math.cos(time + i * 0.9) * 0.08;
        const p = project(x + fX, y + fY, z);
        return p ? { arch, p, i } : null;
      }).filter(Boolean) as { arch: ShowcaseArchetype; p: NonNullable<ReturnType<typeof project>>; i: number }[];

      proj.sort((a, b) => b.p.z2 - a.p.z2);
      const projMap = new Map(proj.map(n => [n.arch.id, n.p]));

      // Connection lines — batched into one glow path + one dashed core
      // path (was 2 strokes + 2 dash state changes per edge).
      const pulse = 0.15 + Math.sin(time * 2) * 0.08;
      ctx.beginPath();
      EDGES.forEach(([i, j]) => {
        const pa = projMap.get(ARCHETYPES[i].id);
        const pb = projMap.get(ARCHETYPES[j].id);
        if (!pa || !pb) return;
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
      });
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.15})`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw nodes — glow via pre-rendered sprites, labels via cached widths
      proj.forEach(({ arch, p }) => {
        const sz = 100 * p.sc;
        if (sz < 8) return;

        const sprites = glowSprites[arch.id];
        if (sprites) {
          const r9 = sz * 0.9, r6 = sz * 0.6;
          ctx.drawImage(sprites[0], p.sx - r9, p.sy - r9, r9 * 2, r9 * 2);
          ctx.drawImage(sprites[1], p.sx - r6, p.sy - r6, r6 * 2, r6 * 2);
        }

        const img = blobImgs[arch.id];
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, p.sx - sz / 2, p.sy - sz / 2, sz, sz);
        } else {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, sz * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = arch.color;
          ctx.fill();
        }

        // Name label
        const fontSize = Math.max(10, Math.min(15, Math.round(13 * p.sc)));
        ctx.font = `600 ${fontSize}px 'Fredoka','Comfortaa','Nunito',sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = this.getArchName(arch);
        const tw = labelWidth(label, fontSize);
        const th = fontSize + 6;
        const llx = p.sx;
        const lly = p.sy + sz / 2 + th / 2 + 4;
        ctx.fillStyle = `rgba(13, 11, 9, 0.8)`;
        ctx.beginPath();
        ctx.roundRect(llx - tw / 2, lly - th / 2, tw, th, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, llx, lly);
      });

      drawAxisLabels();
      animFrame = requestAnimationFrame(loop);
    };

    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; velX = 0; velY = 0; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      tcam.ry -= dx * 0.004; tcam.rx -= dy * 0.004;
      velY = -dx * 0.0004; velX = -dy * 0.0004;
      lx = e.clientX; ly = e.clientY;
    };
    const onUp = () => { dragging = false; };

    wrapperEl.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    loop();

    this.cleanupFns.push(() => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      wrapperEl.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    });
  }

  // ===== HELPERS =====
  getArchName(arch: ShowcaseArchetype): string {
    const entry = PART_NAMES[arch.id];
    return entry ? entry[this.isEnglish() ? 0 : 1] : arch.id;
  }

  getSynArchName(index: number): string {
    const id = this.synSelected()[index];
    const arch = id ? ARCHETYPES.find(a => a.id === id) : null;
    return arch ? this.getArchName(arch) : '';
  }

  getArchType(arch: ShowcaseArchetype): string {
    const entry = CLASS_LABELS[arch.type];
    return entry ? entry[this.isEnglish() ? 0 : 1] : arch.type;
  }

  getArchDesc(arch: ShowcaseArchetype): string {
    const lang = this.isEnglish() ? 'en' : 'ru';
    const resource = RESOURCE_FACE[arch.id];
    if (resource) return resource[this.isEnglish() ? 0 : 1];
    const copy = PART_COPY[lang][arch.id as keyof typeof PART_COPY['en']];
    return copy ? copy.face : '';
  }

  getStatLabel(key: string): string {
    const map: Record<string, string> = {
      agency: 'statAgency', temperature: 'statTemperature', focus: 'statFocus', attachment: 'statAttachment'
    };
    return this.t(map[key] || key);
  }

  padIndex(i: number): string {
    return String(i + 1).padStart(2, '0');
  }

  archStats(arch: ShowcaseArchetype): [string, number][] {
    return Object.entries(arch.stats) as [string, number][];
  }
}
