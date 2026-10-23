import { ChangeDetectionStrategy, Component, computed, inject, signal, input, output, effect, Injector, ChangeDetectorRef, ElementRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { localSet, localGet } from '../../../shared/core/data/local-store';
import { STRINGS } from '../../../shared/i18n/strings';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { GeminiService, GeneratedArchetype } from '../../../services/gemini.service';
import { UniverseStateService } from '../../../services/universe-state.service';
import type { DimensionalExpressions } from '../../../services/universe-state.service';
import { BlobCharacterComponent } from '../../shared/components/blob-character/blob-character.component';
import { ASSESSMENT_QUESTIONS } from '../../../shared/core/data/assessment-questions';
import { PartsDynamic, PoleScores, computePoleScores, detectComplexes, computeDefenseHierarchy, computeTriggerMap, computeIntegrationPathway, computeDissociation, computeRegulationCapacity, computeBoundaryStyle, computeNarrativeCoherence, generateArchetypes, Complex, DefenseHierarchy, TriggerEntry, PathwayStep, DissociationIndicator, RegulationCapacity, BoundaryAssessment, CoherenceIndicator, ScoredArchetype } from '../../../shared/core/data/scoring';



import { parseReportMarkdown } from '../../../shared/features/results-panel/report-parser';

export interface AssessmentResults {
  analysis: string;
  pantheon: GeneratedArchetype[];
  dynamics?: PartsDynamic[];
  /**
   * True when the AI narrative failed/cancelled and we are showing a local
   * fallback instead. Pantheon and dimensional data are still real.
   */
  narrativeDegraded?: boolean;
}

@Component({
  selector: 'app-results-panel',
  standalone: true,
  imports: [
    CommonModule, 
    BlobCharacterComponent
  ],

  templateUrl: './results-panel.component.html',
  styleUrls: ['./results-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  public readonly translationService = inject(TranslationService);
  private readonly geminiService = inject(GeminiService);
  private readonly universeState = inject(UniverseStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly el = inject(ElementRef<HTMLElement>);

  // Section navigation
  readonly SECTIONS = ['hero', 'profile', 'signature', 'spectrum', 'pantheon', 'dynamics', 'complexes', 'defense', 'triggers', 'pathway', 'diagnostics'];
  readonly activeSection = signal('hero');
  private sectionObserver: IntersectionObserver | null = null;

  // Inputs
  responses = input.required<number[]>();
  readonly questions = ASSESSMENT_QUESTIONS;

  dimensionalExpressions = input.required<DimensionalExpressions>();

  /** True when the user is authenticated anonymously — used to surface a "save to your account" CTA. */
  isAnonymous = input<boolean>(false);

  /**
   * True when this panel is being rendered for a specialist viewing a
   * CLIENT'S results (admin dashboard "View report" flow). When true:
   *  - The "Sign in", "Retake", and "View My Universe" CTAs are hidden
   *    (they only make sense for the data owner).
   *  - A specialist-view badge replaces the "eyebrow" in the top bar.
   *  - The "goBack" button goes back to the admin's cabinet (not the
   *    owner's intro), since the parent's handler switches on this flag.
   *  - Download / scoring-toggle still work — the specialist owns a copy
   *    of the rendered report.
   */
  isSpecialistView = input<boolean>(false);

  /**
   * Optional label for the client being viewed in specialist mode
   * (e.g. their email). Shown next to the specialist-view badge.
   */
  specialistClientLabel = input<string | null>(null);

  // Outputs
  viewUniverse = output<AssessmentResults>();
  resultsReady = output<AssessmentResults>();
  retakeAssessment = output<void>();
  goBack = output<void>();
  signInRequested = output<void>();

  // State
  readonly results = signal<AssessmentResults | null>(null);
  readonly isCalculating = signal(false);
  readonly error = signal<string | null>(null);
  readonly narrativeDegraded = signal<boolean>(false);
  readonly scoringMethod = signal<'deterministic' | 'fallback'>(this.readScoringMethod());

  /** AbortController for the in-flight AI call so the user can cancel the 180s wait. */
  private currentAbort: AbortController | null = null;

  readonly dimensionColors: { [key: string]: string } = {
    AGENCY: '#0072B2',      // Blue (Wong colorblind-safe)
    TEMPERATURE: '#D55E00', // Vermillion (Wong colorblind-safe)
    FOCUS: '#009E73',       // Bluish Green (Wong colorblind-safe)
    ATTACHMENT: '#E69F00'   // Amber (Wong colorblind-safe)
  };

  readonly poleScores = computed<PoleScores | null>(() => {
    const r = this.responses();
    if (!r || r.length < this.questions.length) return null;
    return computePoleScores(r);
  });

  readonly canonicalDimensionalExpressions = computed<DimensionalExpressions>(() => {
    const ps = this.poleScores();
    if (ps) {
      return {
        AGENCY: ps.center[0],
        TEMPERATURE: ps.center[1],
        FOCUS: ps.center[2],
        ATTACHMENT: ps.center[3],
      };
    }
    return this.dimensionalExpressions();
  });

  private currentLang(): 'en' | 'ru' {
    return this.translationService.getLanguage() === 'ru' ? 'ru' : 'en';
  }

  readonly isBalancedProfile = computed(() => {
    const ps = this.poleScores();
    if (!ps) return false;
    return Math.max(
      Math.abs(ps.agencyActive), Math.abs(ps.agencyReceptive),
      Math.abs(ps.tempHot), Math.abs(ps.tempCool),
      Math.abs(ps.focusOther), Math.abs(ps.focusSelf),
      Math.abs(ps.attAnxious), Math.abs(ps.attAvoidant),
    ) < 0.05;
  });

  readonly complexes = computed<Complex[]>(() => {
    const res = this.results();
    const ps = this.poleScores();
    if (!res || !ps || res.pantheon.length === 0) return [];
    const archetypes = this.toScoredArchetypes(res);
    return detectComplexes(archetypes, ps, this.currentLang());
  });

  readonly defenseHierarchy = computed<DefenseHierarchy | null>(() => {
    const res = this.results();
    const ps = this.poleScores();
    if (!res || !ps || res.pantheon.length === 0) return null;
    const archetypes = this.toScoredArchetypes(res);
    return computeDefenseHierarchy(archetypes, ps, this.currentLang());
  });

  readonly triggerMap = computed<TriggerEntry[]>(() => {
    const res = this.results();
    const ps = this.poleScores();
    if (!res || !ps || res.pantheon.length === 0) return [];
    const archetypes = this.toScoredArchetypes(res);
    return computeTriggerMap(archetypes, ps, this.currentLang());
  });

  readonly integrationPathway = computed<PathwayStep[]>(() => {
    const res = this.results();
    const ps = this.poleScores();
    if (!res || !ps || res.pantheon.length === 0) return [];
    const archetypes = this.toScoredArchetypes(res);
    return computeIntegrationPathway(archetypes, ps, this.currentLang());
  });

  // Phase 3 diagnostic indicators
  readonly dissociation = computed<DissociationIndicator | null>(() => {
    const r = this.responses();
    const ps = this.poleScores();
    if (!r || r.length < this.questions.length || !ps) return null;
    return computeDissociation(r, ps);
  });

  readonly regulation = computed<RegulationCapacity | null>(() => {
    const r = this.responses();
    const ps = this.poleScores();
    if (!r || r.length < this.questions.length || !ps) return null;
    return computeRegulationCapacity(r, ps);
  });

  readonly boundaryStyle = computed<BoundaryAssessment | null>(() => {
    const ps = this.poleScores();
    if (!ps) return null;
    return computeBoundaryStyle(ps);
  });

  readonly coherence = computed<CoherenceIndicator | null>(() => {
    const r = this.responses();
    const ps = this.poleScores();
    if (!r || r.length < this.questions.length || !ps) return null;
    return computeNarrativeCoherence(r, ps);
  });

  private toScoredArchetypes(res: AssessmentResults): ScoredArchetype[] {
    return res.pantheon.map(a => ({
      name: a.name,
      symbol: a.symbol || '',
      coordinates: a.coordinates || [0, 0, 0, 0],
      cluster: a.cluster || 'gift_archetypes',
      prominence: a.prominence,
      size: 1,
      description: a.description || '',
      wound: a.wound || '',
      shadow: a.shadow || '',
      invitation: a.invitation || '',
      coreBelief: a.coreBelief || '',
      attracts: a.attracts || '',
      partType: a.partType || 'self',
      developmentalOrigin: a.developmentalOrigin || 'adolescent',
      disorganizedModifier: a.disorganizedModifier ?? false,
    }));
  }

  private readScoringMethod(): 'deterministic' | 'fallback' {
    try {
      const raw = localStorage.getItem('archetype_scoring_method');
      return raw === 'fallback' || raw === 'legacy' ? 'fallback' : 'deterministic';
    } catch {
      return 'deterministic';
    }
  }

  private readonly injector = inject(Injector);
  private hasCalculated = false;

  constructor() {
    effect(() => {
      const responses = this.responses();
      if (this.isCompleteResponseSet(responses) && !this.hasCalculated) {
        this.hasCalculated = true;
        // Run async outside of the effect context
        Promise.resolve().then(() => this.calculate());
      }
    });
  }

  private isCompleteResponseSet(responses: number[] | null | undefined): responses is number[] {
    return Array.isArray(responses) &&
      responses.length === this.questions.length &&
      responses.every(r => Number.isFinite(r) && r >= 1 && r <= 5);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setupSectionObserver();
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  scrollToSection(id: string): void {
    const nativeEl = this.el.nativeElement;
    const section = nativeEl.querySelector(`#${id}`) as HTMLElement;
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private setupSectionObserver(): void {
    this.sectionObserver?.disconnect();
    const nativeEl = this.el.nativeElement;
    const scrollRoot = nativeEl.querySelector('.results-scroll');
    this.sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.activeSection.set(entry.target.id);
        }
      }
    }, { root: scrollRoot, threshold: 0.1, rootMargin: '-80px 0px -60% 0px' });

    for (const id of this.SECTIONS) {
      const section = nativeEl.querySelector(`#${id}`);
      if (section) this.sectionObserver.observe(section);
    }
  }

  getSectionLabel(id: string): string {
    const key = `section${id.charAt(0).toUpperCase() + id.slice(1)}`;
    const translated = this.translationService.t(key, 'assessment.results');
    // If t() returned the raw key (lookup failed), fall back to a readable name
    if (translated === key) {
      const fallbacks: Record<string, string> = {
        sectionHero: 'Connection', sectionProfile: 'Dimensional Profile',
        sectionSignature: 'Dimensional Profile',
        sectionSpectrum: 'Pole Scores', sectionPantheon: 'Pantheon',
        sectionDynamics: 'System Dynamics', sectionComplexes: 'Complexes',
        sectionDefense: 'Defense Hierarchy', sectionTriggers: 'Trigger Map',
        sectionPathway: 'Integration Pathway', sectionDiagnostics: 'Diagnostics',
      };
      return fallbacks[key] || id;
    }
    return translated;
  }

  /**
   * Maps each dimension key to its negative-pole label key in
   * assessment.results. The negative pole is the one shown when the
   * dimensional expression is < 0 (e.g. "Active" for AGENCY when agency < 0).
   */
  private readonly NEGATIVE_POLE_KEY: Record<string, string> = {
    AGENCY: 'agencyActive',
    TEMPERATURE: 'tempCool',
    FOCUS: 'focusSelf',
    ATTACHMENT: 'attAvoidant',
  };
  private readonly POSITIVE_POLE_KEY: Record<string, string> = {
    AGENCY: 'agencyReceptive',
    TEMPERATURE: 'tempHot',
    FOCUS: 'focusOther',
    ATTACHMENT: 'attAnxious',
  };

  /** Returns the localized pole label for a dimension based on the current signed value. */
  getPoleLabelForDimension(dim: string): string {
    const de = this.canonicalDimensionalExpressions();
    const value = de[dim as keyof typeof de] ?? 0;
    if (Math.abs(value) < 0.05) {
      return this.translationService.t('balanced', 'assessment.results');
    }
    const key = value < 0 ? this.NEGATIVE_POLE_KEY[dim] : this.POSITIVE_POLE_KEY[dim];
    return key ? this.translationService.t(key, 'assessment.results') : dim;
  }

  /** Returns a formatted signed percentage string for the dimension, e.g. "75% →" or "5%". */
  getDimensionPct(dim: string): string {
    const de = this.canonicalDimensionalExpressions();
    const value = de[dim as keyof typeof de] ?? 0;
    if (Math.abs(value) < 0.05) return '';
    return `${(Math.abs(value) * 100).toFixed(0)}%`;
  }

  private async calculate(): Promise<void> {
    this.isCalculating.set(true);
    this.error.set(null);
    this.narrativeDegraded.set(false);
    this.results.set(null);

    // Create a fresh AbortController for this run so the user can cancel.
    this.currentAbort?.abort();
    this.currentAbort = new AbortController();
    const signal = this.currentAbort.signal;
    this.cdr.detectChanges();

    // Draft backup (saved before any AI/network work). This guarantees recoverability even if
    // the analysis step crashes or the AI provider window fails mid-flight.
    try {
      const draftBackup = {
        app: 'ArchetypeAI',
        version: 1,
        timestamp: new Date().toISOString(),
        dimensionalExpressions: this.dimensionalExpressions(),
        assessmentResponses: this.responses(),
        results: null,
      };
      localSet('ARCHETYPE_COMPLETED_BACKUP', draftBackup);
    } catch (storageErr) {
      console.warn('LocalStorage draft backup failed:', storageErr);
    }

    try {
      const results = await this.geminiService.analyzeAssessment(
        this.responses(),
        this.questions,
        this.universeState.allArchetypes(),
        this.scoringMethod(),
        this.dimensionalExpressions(),
        { signal }
      );

      this.results.set(results);
      this.narrativeDegraded.set(results.narrativeDegraded === true);
      this.resultsReady.emit(results);
      try {
        const backup = {
          app: 'ArchetypeAI',
          version: 1,
          timestamp: new Date().toISOString(),
          dimensionalExpressions: this.dimensionalExpressions(),
          assessmentResponses: this.responses(),
          results: results,
        };
        localSet('ARCHETYPE_COMPLETED_BACKUP', backup);
      } catch (storageErr) {
        console.warn('LocalStorage auto-save failed:', storageErr);
      }
      this.cdr.detectChanges();
      // Set up section observer after results render
      setTimeout(() => this.setupSectionObserver(), 500);
    } catch (e: any) {
      console.error("Error calculating results:", e);
      // User-cancelled: surface a soft "cancelled" state, no scary error.
      if (e?.cancelled || e?.message === 'Analysis cancelled.') {
        this.error.set(this.translationService.t('analysisCancelled', 'assessment.results', 'Analysis cancelled.'));
      } else {
        let msg = e instanceof Error ? e.message : this.translationService.t('unknownError', 'assessment.results', 'An unknown error occurred.');
        if (msg.includes('429') || msg.includes('503') || msg.includes('502')) {
          msg = this.translationService.t('highDemand', 'assessment.results');
        }
        this.error.set(msg);
      }
      this.cdr.detectChanges();
    } finally {
      this.isCalculating.set(false);
      this.currentAbort = null;
      this.cdr.detectChanges();
    }
  }

  cancelCalculate(): void {
    this.currentAbort?.abort();
  }

  retryCalculate(): void {
    this.hasCalculated = false;
    this.error.set(null);
    this.results.set(null);
    this.hasCalculated = true;
    Promise.resolve().then(() => this.calculate());
  }

  toggleScoringMethod(): void {
    const newMethod = this.scoringMethod() === 'deterministic' ? 'fallback' : 'deterministic';
    this.scoringMethod.set(newMethod);
    try { localStorage.setItem('archetype_scoring_method', newMethod); } catch { /* storage unavailable */ }
    this.retryCalculate();
  }

  onViewUniverse(): void {
    if (this.results()) {
      this.viewUniverse.emit(this.results()!);
    }
  }

  parseMarkdown(content: string): string {
    // Delegate to the shared utility which:
    //   - rewrites numbered sections ("1. Title", "1.1 Subtitle") to
    //     markdown headings when the AI didn't include them, and
    //   - sanitises the rendered HTML via DOMPurify.
    // See report-parser.ts for the full safety-net behaviour.
    return parseReportMarkdown(content);
  }

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

  getPartTypeLabel(partType: string | undefined): string {
    if (!partType) return '';
    return this.translationService.t(partType, 'universe.partTypes') || partType;
  }

  getOriginLabel(origin: string | undefined): string {
    if (!origin) return '';
    return this.translationService.t(origin, 'universe.origins') || origin;
  }

  downloadFallbackData(): void {
    const res = this.results();
    const rawData = {
      app: 'ArchetypeAI',
      type: "ArchetypeAI_Assessment_Backup",
      version: 2,
      timestamp: new Date().toISOString(),
      dimensionalExpressions: this.dimensionalExpressions(),
      assessmentResponses: this.responses(),
      results: res,
      data: this.questions.map((q, index) => ({
        section: q.section,
        questionId: q.text,
        questionText: this.translationService.t(q.text, q.section),
        response: this.responses()[index]
      }))
    };

    const jsonString = JSON.stringify(rawData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'archetype_assessment_backup.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadClinicalReport(): void {
    const res = this.results();
    const ps = this.poleScores();
    if (!res || !ps) return;

    const isRu = this.translationService.getLanguage() === 'ru';
    const ES = STRINGS.resultsPanel.exportLabels[isRu ? 'ru' : 'en'];
    const ML = STRINGS.resultsPanel.metrics[isRu ? 'ru' : 'en'];
    const lang = isRu ? 'ru' as const : 'en' as const;
    const reportArchetypes = isRu ? generateArchetypes(this.responses(), 'ru').archetypes : this.toScoredArchetypes(res);
    const reportComplexes = detectComplexes(reportArchetypes, ps, lang);
    const reportDefense = computeDefenseHierarchy(reportArchetypes, ps, lang);
    const reportTriggers = computeTriggerMap(reportArchetypes, ps, lang);
    const reportPathway = computeIntegrationPathway(reportArchetypes, ps, lang);
    const reportDissociation = computeDissociation(this.responses(), ps);
    const reportRegulation = computeRegulationCapacity(this.responses(), ps);
    const reportBoundary = computeBoundaryStyle(ps);
    const reportCoherence = computeNarrativeCoherence(this.responses(), ps);
    const S = {
      title: ES.title,
      generated: ES.generated,
      language: ES.language,
      primary: ES.primary,
      narrative: ES.narrative,
      signature: ES.signature,
      poleScores: ES.poleScores,
      pantheon: ES.pantheon,
      complexes: ES.complexes,
      defense: ES.defense,
      triggers: ES.triggers,
      pathway: ES.pathway,
      diagnostics: ES.diagnostics,
      note: ES.note
    };
    const noneDetected = ES.noneDetected;
    const noneMapped = ES.noneMapped;
    const noNarrative = ES.noNarrative;
    const na = ES.na;
    const fmtPct = (n: number | null | undefined): string => `${Math.max(0, Math.min(100, Number(n) || 0)).toFixed(0)}%`;
    const fmtSigned = (n: number): string => `${(Math.abs(n) * 100).toFixed(0)}% ${n >= 0 ? '→' : '←'}`;
    const partType = (v?: string): string => isRu ? ({
      manager: STRINGS.resultsPanel.partTypesRu.manager,
      firefighter: STRINGS.resultsPanel.partTypesRu.firefighter,
      exile: STRINGS.resultsPanel.partTypesRu.exile,
      self: STRINGS.resultsPanel.partTypesRu.self,
    } as Record<string, string>)[v || ''] || na : v || na;
    const origin = (v?: string): string => isRu ? ({
      pre_verbal: STRINGS.resultsPanel.originsRu.pre_verbal,
      early_attachment: STRINGS.resultsPanel.originsRu.early_attachment,
      oedipal: STRINGS.resultsPanel.originsRu.oedipal,
      latency: STRINGS.resultsPanel.originsRu.latency,
      adolescent: STRINGS.resultsPanel.originsRu.adolescent,
    } as Record<string, string>)[v || ''] || na : v || na;
    const narrative = isRu
      ? this.buildRussianClinicalNarrative(reportArchetypes, reportComplexes, reportDissociation, reportRegulation, reportBoundary, reportCoherence)
      : (res.analysis || noNarrative);
    const lines: string[] = [
      `# ${S.title}`,
      '',
      `- ${S.generated}: ${new Date().toISOString()}`,
      `- ${S.language}: ${this.translationService.getLanguage()}`,
      `- ${S.primary}: ${reportArchetypes[0]?.name || na}`,
      '',
      `## ${S.narrative}`,
      narrative,
      '',
      `## ${S.signature}`,
      `${ML.agency}: ${fmtSigned(this.dimensionalExpressions().AGENCY)}`,
      `${ML.temperature}: ${fmtSigned(this.dimensionalExpressions().TEMPERATURE)}`,
      `${ML.focus}: ${fmtSigned(this.dimensionalExpressions().FOCUS)}`,
      `${ML.attachment}: ${fmtSigned(this.dimensionalExpressions().ATTACHMENT)}`,
      '',
      `## ${S.poleScores}`,
      `${ML.health}: ${fmtPct(ps.healthScore * 100)}`,
      `${ML.agencyCenter}: ${(ps.center[0] * 100).toFixed(0)}%`,
      `${ML.temperatureCenter}: ${(ps.center[1] * 100).toFixed(0)}%`,
      `${ML.focusCenter}: ${(ps.center[2] * 100).toFixed(0)}%`,
      `${ML.attachmentCenter}: ${(ps.center[3] * 100).toFixed(0)}%`,
      '',
      `## ${S.pantheon}`,
      ...reportArchetypes.flatMap(a => [
        `### ${a.name}`,
        `${ML.symbol}: ${a.symbol || na}`,
        `${ML.prominence}: ${isRu ? this.translationService.t(a.cluster, 'universe.clusterNames', a.cluster) : a.cluster}`,
        `${ML.partType}: ${fmtPct(a.prominence)}`,
        `${ML.origin}: ${partType(a.partType)}`,
        `${ML.wound}: ${origin(a.developmentalOrigin)}`,
        `${ML.shadow}: ${a.wound || na}`,
        `${ML.invitation}: ${a.shadow || na}`,
        `${ML.coreBelief}: ${a.invitation || na}`,
        `${ML.attracts}: ${a.coreBelief || na}`,
        `${ML.dissociation}: ${a.attracts || na}`,
        '',
      ]),
      `## ${S.complexes}`,
      ...(reportComplexes.length ? reportComplexes.map(cx => `- **${isRu ? cx.nameRu : cx.name}**: ${isRu ? cx.coreWoundRu : cx.coreWound} (${Math.round(cx.severity * 100)}%)`) : [`- ${noneDetected}`]),
      '',
      `## ${S.defense}`,
      ...(reportDefense.layers.length ? reportDefense.layers.map(layer => `- ${ML.layer} ${layer.level}: ${isRu ? layer.labelRu : layer.label} (${layer.parts.join(', ')})`) : [`- ${noneDetected}`]),
      '',
      `## ${S.triggers}`,
      ...(reportTriggers.length ? reportTriggers.map(trig => `- ${trig.partName}: ${(isRu ? trig.triggerSituationsRu : trig.triggerSituations).join('; ')}`) : [`- ${noneMapped}`]),
      '',
      `## ${S.pathway}`,
      ...(reportPathway.length
        ? reportPathway.map(step => `- ${step.stage}. ${isRu ? step.stageNameRu : step.stageName}: ${isRu ? step.actionRu : step.action}`)
        : [`- ${noneMapped}`]),
      '',
      `## ${S.diagnostics}`,
      `${ML.regulation}: ${isRu ? reportDissociation.levelRu : reportDissociation.level}`,
      `${ML.boundaries}: ${isRu ? reportRegulation.dysregulationPatternRu : reportRegulation.dysregulationPattern}`,
      `${ML.coherence}: ${isRu ? reportBoundary.styleRu : reportBoundary.style}`,
      `${ML.coherence}: ${isRu ? reportCoherence.levelRu : reportCoherence.level}`,
      '',
      `> ${S.note}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archetype_clinical_report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private buildRussianClinicalNarrative(
    archetypes: ScoredArchetype[],
    complexes: Complex[],
    dissociation: DissociationIndicator,
    regulation: RegulationCapacity,
    boundary: BoundaryAssessment,
    coherence: CoherenceIndicator
  ): string {
    const primary = archetypes[0];
    const FN = STRINGS.resultsPanel.fallbackNarrativeRu;
    if (!primary) return FN.noNarrative;
    const complexLine = complexes.length
      ? `${FN.complexTop} ${complexes[0].nameRu.toLowerCase()} (${Math.round(complexes[0].severity * 100)}%).`
      : FN.complexesNone;
    return [
      FN.title,
      '',
      FN.profileLine(primary.name, primary.prominence, primary.description),
      '',
      FN.coreDynamic,
      FN.shadowLine(primary.wound, primary.shadow),
      '',
      FN.clinicalTitle,
      FN.clinicalLine(complexLine, regulation.dysregulationPatternRu, dissociation.levelRu, boundary.styleRu, coherence.levelRu),
      '',
      FN.integrationTitle,
      primary.invitation,
    ].join('\n');
  }

  get Math() { return Math; }
}
