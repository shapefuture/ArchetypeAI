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

interface ShowcaseArchetype {
  id: string;
  type: string;
  color: string;
  mood: 'happy' | 'joy' | 'neutral' | 'wise';
  path: string;
  stats: { agency: number; temperature: number; focus: number; attachment: number };
  pos: { x: number; y: number; z: number };
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

const ARCHETYPES: ShowcaseArchetype[] = [
  { id: 'wanderer', type: 'Seeker', color: C.mustard, mood: 'happy', path: 'M50 8 C78 8 92 28 88 52 C85 76 68 92 50 92 C32 92 15 76 12 52 C8 28 22 8 50 8 Z', stats: { agency: 55, temperature: 45, focus: 40, attachment: 20 }, pos: {x:-150, y:-50, z:-80} },
  { id: 'catalyst', type: 'Disruptor', color: C.coral, mood: 'joy', path: 'M50 5 L72 28 L95 22 L78 50 L95 78 L68 68 L50 95 L32 68 L5 78 L22 50 L5 22 L28 28 Z', stats: { agency: 90, temperature: 85, focus: 30, attachment: 25 }, pos: {x:0, y:-180, z:50} },
  { id: 'anchor', type: 'Stabilizer', color: C.sky, mood: 'neutral', path: 'M22 22 L78 22 L78 78 L22 78 Z', stats: { agency: 35, temperature: 70, focus: 90, attachment: 85 }, pos: {x:180, y:0, z:-60} },
  { id: 'sage', type: 'Oracle', color: C.lavender, mood: 'wise', path: 'M50 5 L62 38 L98 38 L70 58 L80 92 L50 72 L20 92 L30 58 L2 38 L38 38 Z', stats: { agency: 40, temperature: 20, focus: 80, attachment: 50 }, pos: {x:-120, y:120, z:100} },
  { id: 'weaver', type: 'Connector', color: C.mint, mood: 'happy', path: 'M50 10 C82 10 94 38 86 62 C78 86 64 94 50 94 C36 94 22 86 14 62 C6 38 18 10 50 10 Z', stats: { agency: 60, temperature: 65, focus: 75, attachment: 70 }, pos: {x:140, y:-100, z:80} },
  { id: 'mirror', type: 'Reflector', color: C.rose, mood: 'neutral', path: 'M50 10 Q82 28 82 50 Q82 82 50 92 Q18 82 18 50 Q18 28 50 10 Z', stats: { agency: 30, temperature: 60, focus: 55, attachment: 60 }, pos: {x:-80, y:-100, z:-50} },
  { id: 'herald', type: 'Messenger', color: C.orange, mood: 'happy', path: 'M50 8 L90 68 L10 68 Z', stats: { agency: 70, temperature: 75, focus: 50, attachment: 35 }, pos: {x:80, y:130, z:-120} },
  { id: 'guardian', type: 'Protector', color: C.sage, mood: 'neutral', path: 'M50 5 L92 26 L92 74 L50 95 L8 74 L8 26 Z', stats: { agency: 45, temperature: 55, focus: 85, attachment: 90 }, pos: {x:-100, y:50, z:140} }
];

const PAIN_POINTS: ShowcasePainPoint[] = [
  { icon: '\u{1F32A}️', color: C.coral, titleKey: 'painTitle1', textKey: 'painText1' },
  { icon: '⚡', color: C.mustard, titleKey: 'painTitle2', textKey: 'painText2' },
  { icon: '\u{1FA9E}', color: C.lavender, titleKey: 'painTitle3', textKey: 'painText3' },
  { icon: '\u{1F4A3}', color: C.sky, titleKey: 'painTitle4', textKey: 'painText4' },
  { icon: '⚓', color: C.rose, titleKey: 'painTitle5', textKey: 'painText5' },
  { icon: '\u{1F300}', color: C.mint, titleKey: 'painTitle6', textKey: 'painText6' }
];

const EDGES: [number, number][] = [
  [0,3], [0,6], [0,4], [1,2], [1,4], [1,6], [2,7], [2,4], [2,3], [3,7], [3,5], [4,6], [4,5], [7,5]
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
    if ((a1.id === 'catalyst' && a2.id === 'anchor') || (a1.id === 'anchor' && a2.id === 'catalyst'))
      return { titleKey: 'synTension', descKey: 'synTensionDesc', label: 'Dynamic Tension' };
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

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = wrapperEl.offsetWidth * dpr;
      canvasEl.height = wrapperEl.offsetHeight * dpr;
    };
    window.addEventListener('resize', resize);
    resize();

    const W = () => wrapperEl.offsetWidth;
    const H = () => wrapperEl.offsetHeight;
    const DPR = () => window.devicePixelRatio || 1;

    const blobImgs: Record<string, HTMLImageElement> = {};
    ARCHETYPES.forEach(arch => {
      const svgStr = this.generateBlobSvgString(arch, 100);
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
      blobImgs[arch.id] = img;
    });

    // Enhanced dust particles with trails
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; color: string; size: number; trail: {x:number;y:number;z:number}[] }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.005,
        vy: (Math.random() - 0.5) * 0.005,
        vz: (Math.random() - 0.5) * 0.005,
        color: ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)].color,
        size: 1 + Math.random() * 2,
        trail: []
      });
    }

    const project = (x: number, y: number, z: number) => {
      const cX = Math.cos(cam.rx), sX = Math.sin(cam.rx);
      const y1 = y * cX - z * sX, z1 = y * sX + z * cX;
      const cY = Math.cos(cam.ry), sY = Math.sin(cam.ry);
      const x2 = x * cY + z1 * sY, z2 = -x * sY + z1 * cY;
      const depth = 9 + z2;
      if (depth < 0.5) return null;
      const sc = 5 / depth;
      return { sx: W() / 2 + x2 * sc * W() * 0.06, sy: H() / 2 - y1 * sc * W() * 0.06, sc, z2 };
    };

    const drawBackground = () => {
      const dpr = DPR();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createRadialGradient(W() / 2, H() / 2, 0, W() / 2, H() / 2, Math.max(W(), H()) * 0.7);
      bg.addColorStop(0, '#191833');
      bg.addColorStop(0.6, '#12122b');
      bg.addColorStop(1, '#0d0d24');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W(), H());
    };

    const drawGrids = () => {
      const gridSize = 10;
      const divisions = 10;
      const step = gridSize / divisions;
      const half = gridSize / 2;
      const planes = [
        { rot: 'XZ', color: '226,230,246' },
        { rot: 'XY', color: '226,230,246' },
        { rot: 'YZ', color: '226,230,246' },
      ];
      planes.forEach(plane => {
        for (let i = 0; i <= divisions; i++) {
          const pos = -half + i * step;
          const isMajor = i % 5 === 0;
          const opacity = isMajor ? 0.06 : 0.025;
          ctx.strokeStyle = `rgba(${plane.color}, ${opacity})`;
          ctx.lineWidth = isMajor ? 0.6 : 0.3;
          let p1a, p1b, p2a, p2b;
          if (plane.rot === 'XZ') {
            p1a = project(-half, 0, pos); p1b = project(half, 0, pos);
            p2a = project(pos, 0, -half); p2b = project(pos, 0, half);
          } else if (plane.rot === 'XY') {
            p1a = project(-half, pos, 0); p1b = project(half, pos, 0);
            p2a = project(pos, -half, 0); p2b = project(pos, half, 0);
          } else {
            p1a = project(0, -half, pos); p1b = project(0, half, pos);
            p2a = project(0, pos, -half); p2b = project(0, pos, half);
          }
          if (p1a && p1b) { ctx.beginPath(); ctx.moveTo(p1a.sx, p1a.sy); ctx.lineTo(p1b.sx, p1b.sy); ctx.stroke(); }
          if (p2a && p2b) { ctx.beginPath(); ctx.moveTo(p2a.sx, p2a.sy); ctx.lineTo(p2b.sx, p2b.sy); ctx.stroke(); }
        }
      });
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
        const fontSize = Math.max(10, Math.min(15, 13 * p.sc));
        ctx.font = `700 ${fontSize}px 'Fraunces', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(l.text);
        const tw = metrics.width + 16;
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

    const loop = () => {
      // PERF: no work at all when paused (manual), offscreen, or tab hidden —
      // previously this still drew the full scene every frame.
      if (this.enginePaused() || this.engineOffscreen() || document.hidden) {
        animFrame = requestAnimationFrame(loop);
        return;
      }
      time += 0.006;
      if (!dragging) {
        tcam.ry += 0.002;
        tcam.rx += velX; tcam.ry += velY;
        velX *= 0.94; velY *= 0.94;
      }
      tcam.rx = Math.max(-1.0, Math.min(1.0, tcam.rx));
      cam.rx += (tcam.rx - cam.rx) * 0.06;
      cam.ry += (tcam.ry - cam.ry) * 0.06;

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

      // Connection lines with enhanced glow
      EDGES.forEach(([i, j]) => {
        const pa = projMap.get(ARCHETYPES[i].id);
        const pb = projMap.get(ARCHETYPES[j].id);
        if (!pa || !pb) return;
        const pulse = 0.15 + Math.sin(time * 2 + i + j) * 0.08;

        // Outer glow
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.15})`;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Core line
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes with enhanced glow
      proj.forEach(({ arch, p }) => {
        const sz = 100 * p.sc;
        if (sz < 8) return;

        // Multi-layer glow
        const g2 = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, sz * 0.9);
        g2.addColorStop(0, arch.color + '30');
        g2.addColorStop(1, arch.color + '00');
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, sz * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();

        const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, sz * 0.6);
        g.addColorStop(0, arch.color + '70');
        g.addColorStop(1, arch.color + '00');
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, sz * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

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
        const fontSize = Math.max(10, Math.min(15, 13 * p.sc));
        ctx.font = `700 ${fontSize}px 'Fraunces', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = this.getArchName(arch);
        const metrics = ctx.measureText(label);
        const tw = metrics.width + 12;
        const th = fontSize + 6;
        const lx = p.sx;
        const ly = p.sy + sz / 2 + th / 2 + 4;
        ctx.fillStyle = `rgba(13, 11, 9, 0.8)`;
        ctx.beginPath();
        ctx.roundRect(lx - tw / 2, ly - th / 2, tw, th, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, lx, ly);
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
    return this.t(`arch${arch.id.charAt(0).toUpperCase() + arch.id.slice(1)}`);
  }

  getSynArchName(index: number): string {
    const id = this.synSelected()[index];
    const arch = id ? ARCHETYPES.find(a => a.id === id) : null;
    return arch ? this.getArchName(arch) : '';
  }

  getArchType(arch: ShowcaseArchetype): string {
    return this.t(`arch${arch.id.charAt(0).toUpperCase() + arch.id.slice(1)}Type`);
  }

  getArchDesc(arch: ShowcaseArchetype): string {
    return this.t(`arch${arch.id.charAt(0).toUpperCase() + arch.id.slice(1)}Desc`);
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
