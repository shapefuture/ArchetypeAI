import { ChangeDetectionStrategy, Component, computed, inject, signal, output, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { VisualizationService, Archetype, DimensionalExpressions } from '../../../services/webxr.service';
import { GeminiService } from '../../../services/gemini.service';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';

/** Inline RU/EN copy for the four IFS families (translations.ts is legacy-only). */
const CLUSTER_COPY = {
  ru: {
    managers: 'Менеджеры',
    firefighters: 'Пожарные',
    exiles: 'Изгнанники',
    resources: 'Ресурсы',
  },
  en: {
    managers: 'Managers',
    firefighters: 'Firefighters',
    exiles: 'Exiles',
    resources: 'Resources',
  },
} as const;

const CLUSTER_DESC_COPY = {
  ru: {
    managers: 'Заранее удерживают порядок, чтобы плохой день так и не наступил.',
    firefighters: 'Прибегают мгновенно, когда внутри уже горит.',
    exiles: 'Несут юную боль, спрятанную от повседневной жизни.',
    resources: 'Выращенные силы, на которые может опереться Self.',
  },
  en: {
    managers: 'Keep order preemptively so the bad day never arrives.',
    firefighters: 'Arrive the moment something inside catches fire.',
    exiles: 'Carry the young pain hidden from daily life.',
    resources: 'Grown strengths the Self can lean on.',
  },
} as const;

const CLUSTER_COLORS: { [key: string]: string } = {
  managers: '#E1734B',
  firefighters: '#E58FA0',
  exiles: '#8F63C0',
  resources: '#46A29D',
  // legacy/AI-generated clusters keep their old palette
  gift_archetypes: 'var(--cluster-gift)',
  control_shadows: 'var(--cluster-control)',
  emotional_storm_shadows: 'var(--cluster-storm)',
  avoidant_intellectual_shadows: 'var(--cluster-avoidant)',
  anxious_connection_shadows: 'var(--cluster-anxious)',
  seductive_avoidance_shadows: 'var(--cluster-seductive)',
  disorganized_attachment_shadows: 'var(--cluster-disorganized)',
};


@Component({
  selector: 'app-universe-controls',
  standalone: true,
  imports: [
    CommonModule, 
    SearchBoxComponent, 
  ],

  templateUrl: './universe-controls.component.html',
  styleUrls: ['./universe-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniverseControlsComponent {
  public readonly translationService = inject(TranslationService);
  public readonly visualizationService = inject(VisualizationService);
  public readonly geminiService = inject(GeminiService);
  public readonly DIMENSIONS_DATA = {
    AGENCY: { labels: { hypo: 'agencyHypo', hyper: 'agencyHyper' } },
    TEMPERATURE: { labels: { hypo: 'temperatureHypo', hyper: 'temperatureHyper' } },
    FOCUS: { labels: { hypo: 'focusHypo', hyper: 'focusHyper' } },
    ATTACHMENT: { labels: { hypo: 'attachmentHypo', hyper: 'attachmentHyper' } }
  };

  // Inputs/States from App
  isSettingsPanelCollapsed = signal(true);
  
  // Search State
  readonly searchQuery = signal('');
  readonly searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return [];
    return this.visualizationService.allArchetypes().filter(a => {
      const translatedName = this.translationService.getArchetypeField(a.id, 'name', a.name).toLowerCase();
      return translatedName.includes(query) || a.name.toLowerCase().includes(query);
    });
  });

  // AI Creation State
  readonly creationPrompt = signal('');
  readonly isCreatingArchetype = signal(false);

  // Outputs
  archetypeSelected = output<Archetype>();
  viewIntro = output<void>();
  viewFullUniverse = output<void>();
  toggleCoach = output<void>();
  saveBackup = output<void>();
  toggleHelp = output<void>();
  openSynastry = output<void>();


  // "Living Glass" Glow Effect
  readonly dominantExpressionGlow = computed(() => {
    const expressions = this.visualizationService.dimensionalExpressions();
    let maxKey = '';
    let maxValue = 0;
    for (const [key, value] of Object.entries(expressions)) {
      const absValue = Math.abs(value as number);
      if (absValue > maxValue) {
        maxValue = absValue;
        maxKey = key;
      }
    }
    if (maxValue < 0.1) return 'transparent';

    const colors: { [key: string]: string } = {
      AGENCY: `rgba(112, 161, 215, ${maxValue * 0.5})`,      // --accent-blue
      TEMPERATURE: `rgba(244, 162, 97, ${maxValue * 0.5})`, // --accent-orange
      FOCUS: `rgba(144, 190, 109, ${maxValue * 0.5})`,      // --accent-green
      ATTACHMENT: `rgba(249, 199, 79, ${maxValue * 0.5})`,  // --accent-yellow
    };
    return colors[maxKey] || 'transparent';
  });


  get dimensionTooltips(): { [key: string]: string } {

    return {
      AGENCY: this.translationService.t('agencyDesc', 'universe.dimensions'),
      TEMPERATURE: this.translationService.t('temperatureDesc', 'universe.dimensions'),
      FOCUS: this.translationService.t('focusDesc', 'universe.dimensions'),
      ATTACHMENT: this.translationService.t('attachmentDesc', 'universe.dimensions')
    };
  }

  get clusterTooltips(): { [key: string]: string } {
    const lang = this.translationService.getLanguage() === 'en' ? 'en' : 'ru';
    return {
      managers: CLUSTER_DESC_COPY[lang].managers,
      firefighters: CLUSTER_DESC_COPY[lang].firefighters,
      exiles: CLUSTER_DESC_COPY[lang].exiles,
      resources: CLUSTER_DESC_COPY[lang].resources,
    };
  }

  /** Inline family label for a cluster id (legacy ids fall back to translations). */
  clusterName(clusterId: string): string {
    const lang = this.translationService.getLanguage() === 'en' ? 'en' : 'ru';
    const copy = CLUSTER_COPY[lang] as Record<string, string>;
    return copy[clusterId] ?? this.translationService.t(clusterId, 'universe.clusterNames');
  }

  clusterTooltip(clusterId: string): string {
    const lang = this.translationService.getLanguage() === 'en' ? 'en' : 'ru';
    const copy = CLUSTER_DESC_COPY[lang] as Record<string, string>;
    return copy[clusterId] ?? this.translationService.t(clusterId, 'universe.clusterDescs');
  }

  // Dimension Mappings
  readonly dimensionalExpressions = this.visualizationService.dimensionalExpressions;
  readonly isolatedDimension = this.visualizationService.isolatedDimension;
  readonly activeClusterFilters = this.visualizationService.activeClusterFilters;

  toggleSettingsPanel(): void {
    this.isSettingsPanelCollapsed.update(v => !v);
  }

  summonArchetype(archetype: Archetype): void {
    this.archetypeSelected.emit(archetype);
    this.searchQuery.set('');
  }

  toggleClusterFilter(clusterId: string): void {
    this.activeClusterFilters.update(currentFilters => {
      const newFilters = new Set(currentFilters);
      if (newFilters.has(clusterId)) {
        newFilters.delete(clusterId);
      } else {
        newFilters.add(clusterId);
      }
      return newFilters;
    });
    this.visualizationService.updateClusterFilters(this.activeClusterFilters());
  }

  getClusterColor(clusterId: string): string {
    return CLUSTER_COLORS[clusterId] || 'var(--ink-main)';
  }

  onCreationInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.creationPrompt.set(target.value);
  }

  getSliderColor(dim: string): string {

    const colors: { [key: string]: string } = {
      AGENCY: 'var(--accent-blue)',
      TEMPERATURE: 'var(--accent-orange)',
      FOCUS: 'var(--accent-green)',
      ATTACHMENT: 'var(--accent-yellow)'
    };
    return colors[dim] || 'var(--ink-muted)';
  }

  async createArchetype(): Promise<void> {

    const prompt = this.creationPrompt().trim();
    if (!prompt || this.isCreatingArchetype()) return;

    this.isCreatingArchetype.set(true);
    try {
      const newArchetype = await this.geminiService.createArchetype(prompt);
      this.visualizationService.addArchetype(newArchetype);
      this.creationPrompt.set('');
      setTimeout(() => this.summonArchetype(newArchetype), 100);
    } catch (error) {
      console.error("Error creating archetype:", error);
    } finally {
      this.isCreatingArchetype.set(false);
    }
  }



  // SIGGRAPH-TIER SLIDER INTERACTIONS
  private isDraggingSlider = false;
  private activeSliderDimension: string | null = null;

  startSliderDrag(event: PointerEvent, dimension: string): void {
    this.isDraggingSlider = true;
    this.activeSliderDimension = dimension;
    this.updateSliderFromEvent(event, dimension);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onSliderDrag(event: PointerEvent, dimension: string): void {
    if (this.isDraggingSlider && this.activeSliderDimension === dimension) {
      this.updateSliderFromEvent(event, dimension);
    }
  }

  stopSliderDrag(): void {
    this.isDraggingSlider = false;
    this.activeSliderDimension = null;
  }

  private updateSliderFromEvent(event: PointerEvent, dimension: string): void {
    const track = (event.target as HTMLElement).closest('.slider-track-illustrated');
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const value = (percent * 2) - 1; // Map 0..1 to -1..1

    this.dimensionalExpressions.update(expressions => ({
      ...expressions,
      [dimension]: value
    }));
    this.visualizationService.updateDimensionalExpressions(this.dimensionalExpressions());
  }

  toggleLanguage(): void {
    const current = this.translationService.getLanguage();
    this.translationService.setLanguage(current === 'en' ? 'ru' : 'en');
  }
}
