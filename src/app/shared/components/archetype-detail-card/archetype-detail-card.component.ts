import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardStackComponent } from '../card-stack/card-stack.component';
import { PartStickerComponent } from '../part-sticker/part-sticker.component';
import type { Archetype } from '../../../../services/universe-state.service';
import { STRINGS } from '../../../../shared/i18n/strings';
import { TranslationService } from '../../../../services/translation.service';

@Component({
  selector: 'app-archetype-detail-card',
  standalone: true,
  imports: [CommonModule, PartStickerComponent],

  template: `
    <div class="side-panel-wrapper" [class.panel-open]="archetype">
      <div class="card-main custom-scrollbar">
        <div class="ribbons">
          @for (color of ribbonColors(); track color) {
            <div class="ribbon" [style.background-color]="color"></div>
          }
        </div>

        <button class="panel-close-btn" (click)="close.emit()" aria-label="Close details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <!-- Hero Section -->
        <header class="panel-header">
          <div class="archetype-emblem">
            <app-part-sticker [archetype]="archetype" [sizePx]="124"></app-part-sticker>
          </div>

          <div class="title-block">
            <h2 class="panel-title">{{ translationService.getArchetypeField(archetype.id, 'name', archetype.name) }}</h2>
            <div class="panel-subtitle-row">
              <span class="cluster-tag" [style.background-color]="archetype.color + '33'" [style.color]="archetype.color">
                {{ formattedCluster() }}
              </span>
              <span class="id-tag">#{{ archetype.id.split('-')[0] }}</span>
            </div>
          </div>
        </header>

        <!-- Description -->
        <section class="prose-section">
          <p class="panel-description">
            {{ translationService.getArchetypeField(archetype.id, 'description', archetype.description) }}
          </p>
        </section>

        <!-- Dimensional Profile (stat meters) -->
        <section class="profile-section">
          <h3 class="section-label">{{ translationService.t('dimensionalSignature', 'assessment.results') || 'Dimensional Profile' }}</h3>
          <div class="ink-bars">
            @for (dimension of dimensions(); track dimension.key) {
              <div class="ink-bar-group">
                <div class="ink-bar-header">
                  <span class="ink-bar-label">{{ dimension.label }}</span>
                  <span class="ink-bar-percent">{{ dimension.value }}%</span>
                </div>
                <div class="attr-track">
                  <div class="attr-fill"
                       [style.width.%]="dimension.value"
                       [style.background-color]="dimension.color">
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Deep Insights -->
        <div class="insights-grid">
          @if (archetype.coreBelief) {
            <div class="insight-card">
              <h4 class="insight-label">{{ translationService.t('coreBelief', 'universe.archetypeDetails') }}</h4>
              <p class="insight-text">"{{ translationService.getArchetypeField(archetype.id, 'coreBelief', archetype.coreBelief) }}"</p>
            </div>
          }
          @if (archetype.shadow) {
            <div class="insight-card shadow-card">
              <h4 class="insight-label">{{ translationService.t('shadow', 'universe.archetypeDetails') }}</h4>
              <p class="insight-text">{{ translationService.getArchetypeField(archetype.id, 'shadow', archetype.shadow) }}</p>
            </div>
          }
        </div>

        <!-- Related Archetypes -->
        <section class="related-section">
          <h3 class="section-label">{{ translationService.t('synchronousArchetypes', 'universe.archetypeDetails') || 'Synchronous Archetypes' }}</h3>
          <div class="related-grid">
            @for (related of relatedArchetypes(); track related.id) {
              <div class="rcard" (click)="navigateToArchetype.emit(related)">
                <app-part-sticker [archetype]="related" [sizePx]="46"></app-part-sticker>
                <span class="related-name">{{ translationService.getArchetypeField(related.id, 'name', related.name) }}</span>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    /* ============================================================
       ARCHETYPE DETAIL CARD — storybook sheet
       card #FBF5E6 · paper2 #EDE2C6 · outline #1C1610
       ink #332A1F · ink2 #5C5142 · ink3 #7A6F5E · lemon #F7DD4A
       ============================================================ */
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
      z-index: 30;
    }

    .side-panel-wrapper {
      position: absolute;
      top: 14px;
      right: 14px;
      bottom: 14px;
      width: min(440px, calc(100vw - 28px));
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.55s cubic-bezier(0.34, 1.45, 0.4, 1);
      will-change: transform;
    }

    .panel-open {
      transform: translateX(0);
    }

    .card-main {
      position: absolute;
      inset: 0;
      background: #FBF5E6;
      border: 2.5px solid #1C1610;
      border-radius: 26px;
      box-shadow: 0 5px 0 #1C1610;
      padding: 30px 22px 24px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .ribbons {
      position: absolute;
      top: -2.5px;
      left: 22px;
      display: flex;
      gap: 6px;
    }
    .ribbon {
      width: 15px;
      height: 24px;
      border: 2px solid #1C1610;
      border-top: none;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
    }

    .panel-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: #FBF5E6;
      border: 2px solid #1C1610;
      box-shadow: 0 2px 0 #1C1610;
      color: #332A1F;
      cursor: pointer;
      transition: transform 0.15s cubic-bezier(0.34, 1.45, 0.4, 1), box-shadow 0.12s ease, background 0.2s ease;
    }
    .panel-close-btn:hover { background: #F7DD4A; }
    .panel-close-btn:active {
      transform: scale(0.9) rotate(-6deg);
      box-shadow: 0 1px 0 #1C1610;
    }
    .panel-close-btn svg {
      width: 18px;
      height: 18px;
    }

    .panel-header {
      margin-top: 6px;
      margin-bottom: 22px;
      text-align: center;
    }

    .archetype-emblem {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
    }

    .panel-title {
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-weight: 400;
      font-size: clamp(24px, 6.4vw, 30px);
      line-height: 1.0;
      letter-spacing: 0.015em;
      text-transform: uppercase;
      color: #332A1F;
      margin: 0 0 10px;
    }

    .panel-subtitle-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .cluster-tag {
      font-size: 10.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 4px 10px;
      border-radius: 999px;
      border: 2px solid #1C1610;
    }

    .id-tag {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: #7A6F5E;
    }

    .panel-description {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 14.5px;
      line-height: 1.6;
      color: #5C5142;
      margin: 0 0 26px;
      font-weight: 500;
    }

    .section-label {
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-weight: 400;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #7A6F5E;
      margin-bottom: 14px;
      display: block;
    }

    .ink-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }

    .ink-bar-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .ink-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .ink-bar-label {
      font-size: 12px;
      font-weight: 800;
      color: #5C5142;
    }

    .ink-bar-percent {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      font-weight: 700;
      color: #7A6F5E;
    }

    .attr-track {
      flex: 1;
      height: 12px;
      background: #EDE2C6;
      border: 2px solid #1C1610;
      border-radius: 999px;
      position: relative;
      overflow: hidden;
    }

    .attr-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      border-right: 2px solid #1C1610;
      border-radius: 999px 0 0 999px;
      transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .insight-card {
      background: rgba(237, 226, 198, 0.45);
      padding: 14px 16px;
      border: 2px dashed rgba(28, 22, 16, 0.3);
      border-radius: 16px;
      margin-bottom: 12px;
    }

    .insight-card.shadow-card {
      background: rgba(28, 22, 16, 0.06);
    }

    .insight-label {
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-weight: 400;
      font-size: 10.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #332A1F;
      margin: 0 0 6px;
    }

    .insight-text {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 14px;
      line-height: 1.6;
      font-style: italic;
      color: #5C5142;
      margin: 0;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding-bottom: 14px;
    }

    .rcard {
      border: 2px solid #1C1610;
      border-radius: 16px;
      background: #FBF5E6;
      padding: 12px 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.16s cubic-bezier(0.34, 1.45, 0.4, 1), box-shadow 0.16s ease;
      box-shadow: 0 2px 0 #1C1610;
    }
    .rcard:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 0 #1C1610;
    }
    .rcard:active {
      transform: scale(0.93) rotate(-2deg);
    }

    .related-name {
      margin-top: 8px;
      font-size: 10.5px;
      font-weight: 800;
      text-align: center;
      line-height: 1.2;
      color: #332A1F;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(28, 22, 16, 0.25);
      border-radius: 999px;
    }

    @media (max-width: 900px) {
      .side-panel-wrapper {
        left: 0;
        right: 0;
        top: auto;
        bottom: 0;
        width: auto;
        height: min(82dvh, 640px);
        transform: translateY(105%);
      }
      .panel-open {
        transform: translateY(0);
      }
      .card-main {
        border-radius: 28px 28px 0 0;
        border-bottom: none;
        box-shadow: 0 -3px 0 #1C1610;
        padding-top: 24px;
      }
      .card-main::before {
        content: "";
        width: 44px;
        height: 5px;
        border-radius: 4px;
        background: rgba(28, 22, 16, 0.18);
        margin: 0 auto 12px;
        flex: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .side-panel-wrapper {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchetypeDetailCardComponent implements OnInit {
  @Input() archetype!: Archetype;
  @Input() allArchetypes: Archetype[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() navigateToArchetype = new EventEmitter<Archetype>();

  public translationService = inject(TranslationService);

  // Convert coordinates to 0-100% values for display
  readonly dimensions = computed(() => {
    if (!this.archetype) return [];

    const coords = this.archetype.coordinates;
    const dimensionData = [
      { key: 'AGENCY', labelKey: 'agency', color: '#0072B2', index: 0 },
      { key: 'TEMPERATURE', labelKey: 'temperature', color: '#D55E00', index: 1 },
      { key: 'FOCUS', labelKey: 'focus', color: '#009E73', index: 2 },
      { key: 'ATTACHMENT', labelKey: 'attachment', color: '#E69F00', index: 3 }
    ];

    return dimensionData.map((dim, idx) => {
      // Convert -1 to 1 range to 0-100%
      const value = ((coords[dim.index] + 1) / 2) * 100;
      return {
        key: dim.key,
        label: this.translationService.t(dim.labelKey, 'universe.dimensions'),
        value: Math.round(value),
        color: dim.color,
        delay: `${idx * 100}ms` // Stagger animations
      };
    });
  });

  // Get ribbon colors based on cluster
  readonly ribbonColors = computed(() => {
    if (!this.archetype) return [];

    const clusterColors: { [key: string]: string[] } = {
      // The four IFS families
      managers: ['#E1734B', '#D5793B'],
      firefighters: ['#E58FA0', '#DE5F50'],
      exiles: ['#8F63C0', '#7A6FD1'],
      resources: ['#46A29D', '#2FA39E'],
      // legacy/AI-generated clusters keep their old ribbons
      gift_archetypes: ['#0072B2', '#009E73'],
      control_shadows: ['#0072B2', '#D55E00'],
      emotional_storm_shadows: ['#D55E00', '#CC79A7'],
      avoidant_intellectual_shadows: ['#56B4E9', '#E69F00'],
      anxious_connection_shadows: ['#CC79A7', '#D55E00'],
      seductive_avoidance_shadows: ['#CC79A7', '#E69F00']
    };

    return clusterColors[this.archetype.cluster || ''] || ['#0072B2', '#009E73'];
  });

  // Format cluster name for display
  readonly formattedCluster = computed(() => {
    if (!this.archetype?.cluster) return '';
    // The four IFS families live in STRINGS.archetypeDetailCard.familyNames
    const inline = STRINGS.archetypeDetailCard.familyNames[this.archetype.cluster];
    if (inline) {
      return this.translationService.getLanguage() === 'en' ? inline[0] : inline[1];
    }
    // Let the translation service handle it, or format raw if missing
    const tCluster = this.translationService.t(this.archetype.cluster, 'universe.clusterNames');
    if (tCluster && tCluster !== this.archetype.cluster) {
      return tCluster;
    }
    return this.archetype.cluster.replace(/_/g, ' ').toUpperCase();
  });

  // Get related archetypes from service
  readonly relatedArchetypes = computed(() => {
    if (!this.archetype || !this.allArchetypes.length) return [];

    // For now, return archetypes from the same cluster (excluding self)
    return this.allArchetypes
      .filter(a => a.cluster === this.archetype.cluster && a.id !== this.archetype.id)
      .slice(0, 3);
  });

  ngOnInit(): void {
    // Set CSS variable for animation targets
    setTimeout(() => {
      const fills = document.querySelectorAll('.dimension-fill');
      fills.forEach((fill, idx) => {
        const dimension = this.dimensions()[idx];
        if (dimension) {
          (fill as HTMLElement).style.setProperty('--target-width', `${dimension.value}%`);
        }
      });
    });
  }
}
