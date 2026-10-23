import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, input, output, OnInit, OnDestroy, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { GeminiService } from '../../../services/gemini.service';
import { computeSynastry, SynastryReport } from '../../../shared/core/data/synastry';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-synastry-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './synastry-panel.component.html',
  styleUrls: ['./synastry-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynastryPanelComponent implements OnInit, OnDestroy {
  public readonly translationService = inject(TranslationService);
  private readonly geminiService = inject(GeminiService);
  private readonly el = inject(ElementRef<HTMLElement>);

  person1Responses = input.required<number[]>();
  person2Responses = input.required<number[]>();

  close = output<void>();
  reportReady = output<{ report: SynastryReport; narrative: string | null }>();

  readonly report = signal<SynastryReport | null>(null);
  readonly isLoading = signal(true);
  readonly narrative = signal('');
  readonly activeSection = signal('hero');
  readonly loadingPhase = signal(0);

  readonly loadingCanvas = viewChild<ElementRef<HTMLCanvasElement>>('loadingCanvas');

  private hasComputed = false;
  private loadingAnimFrame = 0;
  private loadingParticles: { x: number; y: number; vx: number; vy: number; r: number; color: string; life: number }[] = [];
  private loadingPhaseInterval: any;
  private sectionObserver: IntersectionObserver | null = null;

  private readonly SECTIONS = ['hero', 'scores', 'resonance', 'attachment', 'shadow', 'systems', 'growth', 'narrative'];
  private readonly LOADING_PHASES = ['loadingPhase1', 'loadingPhase2', 'loadingPhase3', 'loadingPhase4'];

  constructor() {
    effect(() => {
      const p1 = this.person1Responses();
      const p2 = this.person2Responses();
      if (p1.length > 0 && p2.length > 0 && !this.hasComputed) {
        this.hasComputed = true;
        this.compute();
      }
    });
  }

  ngOnInit(): void {
    this.startLoadingAnimation();
    this.startPhaseRotation();

    const p1 = this.person1Responses();
    const p2 = this.person2Responses();
    if (p1.length > 0 && p2.length > 0 && !this.hasComputed) {
      this.hasComputed = true;
      this.compute();
    }
  }

  ngOnDestroy(): void {
    this.destroyLoadingAnimation();
    this.stopPhaseRotation();
    this.sectionObserver?.disconnect();
  }

  // ===== LOADING ANIMATION =====

  private startLoadingAnimation(): void {
    const init = () => {
      const canvas = this.loadingCanvas()?.nativeElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;

      // Create two orbital particle clouds
      this.loadingParticles = [];
      for (let i = 0; i < 40; i++) {
        const angle1 = (Math.PI * 2 * i) / 20;
        const angle2 = (Math.PI * 2 * i) / 20;
        // Person 1 cloud (coral, left orbit)
        this.loadingParticles.push({
          x: 150 + Math.cos(angle1) * (40 + Math.random() * 30),
          y: 150 + Math.sin(angle1) * (40 + Math.random() * 30),
          vx: 0, vy: 0, r: 1.5 + Math.random() * 2,
          color: i < 20 ? '#FF6B5B' : '#7DD3FC',
          life: 0.5 + Math.random() * 0.5,
        });
      }

      let time = 0;
      const animate = () => {
        if (!this.isLoading()) return;
        time += 0.015;
        ctx!.clearRect(0, 0, 300, 300);

        // Draw connection lines
        ctx!.strokeStyle = 'rgba(255, 107, 91, 0.08)';
        ctx!.lineWidth = 0.5;
        for (let i = 0; i < this.loadingParticles.length; i++) {
          for (let j = i + 1; j < this.loadingParticles.length; j++) {
            const dx = this.loadingParticles[i].x - this.loadingParticles[j].x;
            const dy = this.loadingParticles[i].y - this.loadingParticles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 50) {
              ctx!.beginPath();
              ctx!.moveTo(this.loadingParticles[i].x, this.loadingParticles[i].y);
              ctx!.lineTo(this.loadingParticles[j].x, this.loadingParticles[j].y);
              ctx!.stroke();
            }
          }
        }

        // Update and draw particles
        for (let i = 0; i < this.loadingParticles.length; i++) {
          const p = this.loadingParticles[i];
          const isP1 = i < 20;
          const baseAngle = (Math.PI * 2 * i) / 20;
          const orbitRadius = 50 + Math.sin(time * 2 + i) * 15;
          const convergeFactor = Math.min(time * 0.05, 0.4);

          // Orbital motion with gradual convergence
          const centerX = isP1
            ? 150 - 30 * (1 - convergeFactor)
            : 150 + 30 * (1 - convergeFactor);
          const centerY = 150;
          const speed = isP1 ? 1.2 : -0.9;
          const angle = baseAngle + time * speed;

          p.x = centerX + Math.cos(angle) * orbitRadius + Math.sin(time * 3 + i) * 3;
          p.y = centerY + Math.sin(angle) * (orbitRadius * 0.7) + Math.cos(time * 2.5 + i) * 3;

          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.globalAlpha = p.life * (0.6 + Math.sin(time * 4 + i) * 0.3);
          ctx!.fill();
          ctx!.globalAlpha = 1;

          // Glow
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grad.addColorStop(0, p.color + '40');
          grad.addColorStop(1, p.color + '00');
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        }

        // Center convergence glow
        const glowSize = 15 + Math.sin(time * 3) * 5;
        const cGrad = ctx!.createRadialGradient(150, 150, 0, 150, 150, glowSize);
        cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        cGrad.addColorStop(0.5, 'rgba(255, 107, 91, 0.05)');
        cGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
        ctx!.beginPath();
        ctx!.arc(150, 150, glowSize, 0, Math.PI * 2);
        ctx!.fillStyle = cGrad;
        ctx!.fill();

        this.loadingAnimFrame = requestAnimationFrame(animate);
      };
      this.loadingAnimFrame = requestAnimationFrame(animate);
    };
    // Small delay to ensure canvas is in DOM
    setTimeout(init, 50);
  }

  private destroyLoadingAnimation(): void {
    if (this.loadingAnimFrame) {
      cancelAnimationFrame(this.loadingAnimFrame);
      this.loadingAnimFrame = 0;
    }
  }

  private startPhaseRotation(): void {
    let phase = 0;
    this.loadingPhaseInterval = setInterval(() => {
      phase = (phase + 1) % this.LOADING_PHASES.length;
      this.loadingPhase.set(phase);
    }, 1800);
  }

  private stopPhaseRotation(): void {
    if (this.loadingPhaseInterval) {
      clearInterval(this.loadingPhaseInterval);
      this.loadingPhaseInterval = null;
    }
  }

  // ===== SCROLL NAVIGATION =====

  setupSectionObserver(): void {
    const host = this.el.nativeElement.querySelector('.synastry-scroll') as HTMLElement;
    if (!host) return;

    this.sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          this.activeSection.set(entry.target.id);
        }
      }
    }, { root: host, threshold: 0.3 });

    for (const id of this.SECTIONS) {
      const section = host.querySelector('#' + id);
      if (section) this.sectionObserver!.observe(section);
    }
  }

  scrollToSection(id: string): void {
    const host = this.el.nativeElement.querySelector('.synastry-scroll') as HTMLElement;
    const target = host?.querySelector('#' + id) as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getSectionLabel(id: string): string {
    const map: Record<string, string> = {
      hero: 'sectionHero',
      scores: 'sectionScores',
      resonance: 'sectionResonance',
      attachment: 'sectionAttachment',
      shadow: 'sectionShadow',
      systems: 'sectionSystems',
      growth: 'sectionGrowth',
      narrative: 'sectionNarrative',
    };
    const key = map[id];
    return key ? this.translationService.t(key, 'universe.synastry') : id;
  }

  // ===== COMPUTE =====

  private compute(): void {
    this.isLoading.set(true);

    let r!: SynastryReport;
    try {
      const p1 = this.person1Responses();
      const p2 = this.person2Responses();
      const lang = this.translationService.getLanguage() === 'ru' ? 'ru' as const : 'en' as const;
      try {
        localStorage.setItem('ARCHETYPE_SYNASTRY_DRAFT', JSON.stringify({
          timestamp: new Date().toISOString(),
          person1Responses: p1,
          person2Responses: p2,
        }));
      } catch { /* storage unavailable */ }

      r = computeSynastry(p1, p2, lang);
      this.report.set(r);
      this.reportReady.emit({ report: r, narrative: null });
      this.isLoading.set(false);
      this.destroyLoadingAnimation();
      this.stopPhaseRotation();

      // Setup scroll observer after view renders
      setTimeout(() => this.setupSectionObserver(), 100);
    } catch (err) {
      console.error('[SynastryPanel] Compute error:', err);
      this.isLoading.set(false);
      this.destroyLoadingAnimation();
      this.stopPhaseRotation();
      return;
    }

    // AI narrative
    const reportSummary = JSON.stringify({
      person1: r.person1Summary.topArchetypes.slice(0, 3).map(a => ({ name: a.name, cluster: a.cluster, prominence: a.prominence, wound: a.wound, partType: a.partType })),
      person2: r.person2Summary.topArchetypes.slice(0, 3).map(a => ({ name: a.name, cluster: a.cluster, prominence: a.prominence, wound: a.wound, partType: a.partType })),
      resonance: r.dimensionalResonance.map(d => ({ dim: d.dimension, pattern: d.pattern, delta: d.delta.toFixed(2) })),
      attachmentDance: r.attachmentDance.pattern,
      shadowProjections: r.shadowProjections.map(s => s.mechanismEn),
      relationalArchetype: r.relationalArchetype.nameEn,
      scores: { resonance: (r.resonanceDepth * 100).toFixed(0), growth: (r.growthPotential * 100).toFixed(0), challenge: (r.challengeLevel * 100).toFixed(0), safety: (r.safetyIndex * 100).toFixed(0) },
      polarMap: r.polarMap.map(p => ({ dimension: p.dimension, direction: p.direction, severity: (p.severity * 100).toFixed(0) })),
      dyadicAnalysis: { emotionalLoadCarrier: r.dyadicAnalysis.emotionalLoadCarrier, unconsciousContract: r.dyadicAnalysis.unconsciousContract },
      person1Complexes: r.person1Complexes.map(c => c.name),
      person2Complexes: r.person2Complexes.map(c => c.name),
      sharedComplexes: r.sharedComplexes,
      complementaryComplexes: r.complementaryComplexes,
      crossPersonTriggers: r.crossPersonTriggers.map(t => ({ p1: t.person1Trigger, p2: t.person2Trigger })),
      boundaryInteraction: { pattern: r.boundaryInteraction.pattern, risk: r.boundaryInteraction.risk },
      diagnostics: {
        person1: { regulation: r.person1Regulation.dysregulationPattern, boundary: r.person1Boundary.style, dissociation: r.person1Dissociation.level, coherence: r.person1Coherence.level },
        person2: { regulation: r.person2Regulation.dysregulationPattern, boundary: r.person2Boundary.style, dissociation: r.person2Dissociation.level, coherence: r.person2Coherence.level },
      },
    });

    this.geminiService.generateSynastryNarrative(reportSummary).then(text => {
      if (text) {
        this.narrative.set(text);
        this.reportReady.emit({ report: r, narrative: text });
      }
    }).catch(() => {});
  }

  // ===== HELPERS =====

  parseMarkdown(content: string): string {
    try {
      const html = marked.parse(content, { async: false }) as string;
      const cleaned = html.replace(/(<h[1-6][^>]*)\s+id="[^"]*"/g, '$1');
      return DOMPurify.sanitize(cleaned);
    } catch {
      return DOMPurify.sanitize(content);
    }
  }

  getDanceIcon(pattern: string): string {
    const icons: Record<string, string> = {
      'pursue-withdraw': '🔄', 'mutual-escalation': '🔥', 'deep-freeze': '❄️',
      'healing-container': '🧿', 'volatile-bond': '⚡', 'parallel-sovereignty': '🕊️',
    };
    return icons[pattern] || '✨';
  }

  formatDancePattern(pattern: string): string {
    const keyMap: Record<string, string> = {
      'pursue-withdraw': 'dancePursueWithdraw', 'mutual-escalation': 'danceMutualEscalation',
      'deep-freeze': 'danceDeepFreeze', 'healing-container': 'danceHealingContainer',
      'volatile-bond': 'danceVolatileBond', 'parallel-sovereignty': 'danceParallelSovereignty',
    };
    const key = keyMap[pattern];
    return key ? this.translationService.t(key, 'universe.synastry') : pattern;
  }

  getResonancePatternLabel(pattern: string): string {
    const keyMap: Record<string, string> = {
      harmonic: 'resonanceHarmonic', complementary: 'resonanceComplementary',
      polarized: 'resonancePolarized', dissonant: 'resonanceDissonant',
    };
    const key = keyMap[pattern];
    return key ? this.translationService.t(key, 'universe.synastry') : pattern;
  }

  getDimensionLabel(dim: string): string {
    const map: Record<string, string> = { AGENCY: 'agency', TEMPERATURE: 'temperature', FOCUS: 'focus', ATTACHMENT: 'attachment' };
    const key = map[dim];
    return key ? this.translationService.t(key, 'universe.dimensions') : dim;
  }

  getClusterLabel(clusterId: string): string {
    return this.translationService.t(clusterId, 'universe.clusterNames') || clusterId;
  }

  getPartTypeLabel(partType: string): string {
    const map: Record<string, string> = { manager: 'manager', firefighter: 'firefighter', exile: 'exile', self: 'self' };
    const key = map[partType];
    return key ? this.translationService.t(key, 'universe.partTypes') : partType;
  }

  getOriginLabel(origin: string): string {
    const map: Record<string, string> = { pre_verbal: 'pre_verbal', early_attachment: 'early_attachment', oedipal: 'oedipal', latency: 'latency', adolescent: 'adolescent' };
    const key = map[origin];
    return key ? this.translationService.t(key, 'universe.origins') : origin;
  }

  getDynamicMechanismLabel(mechanism: string): string {
    const map: Record<string, string> = { manages: 'dynamicProtects', firefights: 'dynamicFirefights', carries_wound: 'dynamicProtects' };
    const key = map[mechanism];
    return key ? this.translationService.t(key, 'universe') : mechanism;
  }

  getLoadingPhaseText(): string {
    const key = this.LOADING_PHASES[this.loadingPhase()];
    return this.translationService.t(key, 'universe.synastry');
  }

  lang(lang: 'en' | 'ru'): string {
    return this.translationService.getLanguage() === 'ru' ? lang : 'en';
  }

  isLangRu(): boolean {
    return this.translationService.getLanguage() === 'ru';
  }

  get Math() { return Math; }

  downloadClinicalReport(): void {
    const r = this.report();
    if (!r) return;
    const report = {
      type: 'ArchetypeAI_SynastryClinicalReport', version: '2.0',
      timestamp: new Date().toISOString(),
      language: this.translationService.getLanguage(),
      person1: { summary: r.person1Summary, dynamics: r.person1Dynamics, complexes: r.person1Complexes, dissociation: r.person1Dissociation, regulation: r.person1Regulation, boundary: r.person1Boundary, coherence: r.person1Coherence },
      person2: { summary: r.person2Summary, dynamics: r.person2Dynamics, complexes: r.person2Complexes, dissociation: r.person2Dissociation, regulation: r.person2Regulation, boundary: r.person2Boundary, coherence: r.person2Coherence },
      dimensionalResonance: r.dimensionalResonance, attachmentDance: r.attachmentDance,
      shadowProjections: r.shadowProjections, relationalArchetype: r.relationalArchetype,
      polarMap: r.polarMap, dyadicAnalysis: r.dyadicAnalysis,
      sharedComplexes: r.sharedComplexes, complementaryComplexes: r.complementaryComplexes,
      crossPersonTriggers: r.crossPersonTriggers, boundaryInteraction: r.boundaryInteraction,
      jointPathway: r.jointPathway, growthSequence: r.growthSequence,
      scores: { resonanceDepth: r.resonanceDepth, growthPotential: r.growthPotential, challengeLevel: r.challengeLevel, safetyIndex: r.safetyIndex },
      aiNarrative: this.narrative(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archetype_synastry_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
