import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardStackComponent } from '../card-stack/card-stack.component';
import { BlobCharacterComponent } from '../blob-character/blob-character.component';
import { Archetype } from '../../../../services/webxr.service';
import { TranslationService } from '../../../../services/translation.service';

@Component({
  selector: 'app-archetype-detail-card',
  standalone: true,
  imports: [CommonModule, BlobCharacterComponent],

  template: `
    <div class="side-panel-wrapper" [class.panel-open]="archetype">
      <div class="card-layer cl-2"></div>
      <div class="card-layer cl-1"></div>
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
            <app-blob-character
              [color]="archetype.color"
              size="xl"
              mood="happy"
              [animate]="true">
            </app-blob-character>
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

        <!-- Dimensional Profile (Ink Bars) -->
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
                <app-blob-character [color]="related.color" size="sm" [animate]="false"></app-blob-character>
                <span class="related-name">{{ translationService.getArchetypeField(related.id, 'name', related.name) }}</span>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100dvh;
    }

    .side-panel-wrapper {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      z-index: var(--z-panel);
      transform: translateX(120%);
      transition: transform 0.6s var(--ease-storybook);
      padding: 16px;
      perspective: 1000px;
    }

    .panel-open {
      transform: translateX(0);
    }

    .card-layer {
      position: absolute;
      inset: 16px;
      background: var(--paper-viewport-bot);
      border: var(--border-soft);
      border-radius: var(--radius-soft);
    }
    .cl-2 { transform: translate(12px, 12px) rotate(2deg); z-index: 1; opacity: 0; transition: all 0.6s 0.2s var(--ease-storybook); }
    .cl-1 { transform: translate(6px, 6px) rotate(1deg); z-index: 2; opacity: 0; transition: all 0.6s 0.1s var(--ease-storybook); }

    .panel-open .cl-2 { opacity: 1; }
    .panel-open .cl-1 { opacity: 1; }

    .card-main {
      position: absolute;
      inset: 16px;
      background: var(--paper-panel);
      border: var(--border-soft);
      border-radius: var(--radius-soft);
      z-index: 3;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .ribbons {
      position: absolute;
      top: -2px;
      left: 24px;
      display: flex;
      gap: 6px;
    }
    .ribbon {
      width: 16px;
      height: 28px;
      border: var(--border-soft);
      border-top: none;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
    }

    .panel-close-btn {
      position: absolute;
      top: 16px;
      right: 20px;
      background: none;
      border: none;
      font-size: 24px;
      color: var(--ink-muted);
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .panel-close-btn:hover {
      color: var(--ink-main);
      transform: scale(1.1);
    }

    .panel-header {
      margin-top: 16px;
      margin-bottom: 32px;
      text-align: center;
    }

    .archetype-emblem {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }

    .panel-title {
      font-family: var(--font-serif);
      font-size: 32px;
      font-weight: 700;
      color: var(--ink-main);
      margin-bottom: 8px;
    }

    .panel-subtitle-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .cluster-tag {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .id-tag {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: var(--ink-muted);
    }

    .panel-description {
      font-size: 15px;
      line-height: 1.6;
      text-align: justify;
      color: var(--ink-main);
      margin-bottom: 32px;
      font-weight: 500;
    }

    .section-label {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      margin-bottom: 16px;
      display: block;
    }

    .ink-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
    }

    .ink-bar-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ink-bar-header {
      display: flex;
      justify-content: space-between;
    }

    .ink-bar-label {
      font-size: 12px;
      font-weight: 800;
      color: var(--ink-main);
    }

    .ink-bar-percent {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--ink-muted);
    }

    .attr-track {
      flex: 1;
      height: 12px;
      background: var(--paper-viewport-bot);
      border: 1.5px solid var(--ink-main);
      border-radius: 6px;
      position: relative;
      overflow: hidden;
    }

    .attr-fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      border-right: 1.5px solid var(--ink-main);
      transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .insight-card {
      background: rgba(0,0,0,0.03);
      padding: 16px;
      border: 1px dashed rgba(74, 62, 53, 0.2);
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .insight-label {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      color: var(--ink-main);
      margin-bottom: 6px;
    }

    .insight-text {
      font-size: 14px;
      line-height: 1.6;
      font-style: italic;
      color: var(--ink-muted);
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding-bottom: 16px;
    }

    .rcard {
      border: var(--border-soft);
      border-radius: 12px;
      background: #fff;
      padding: 12px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 2px 2px 0 rgba(74,62,53,0.1);
    }
    .rcard:hover {
      transform: translateY(-4px);
      box-shadow: 2px 6px 0 rgba(74,62,53,0.15);
    }

    .related-name {
      margin-top: 8px;
      font-size: 10px;
      font-weight: 800;
      text-align: center;
      line-height: 1.2;
      color: var(--ink-main);
    }
    
    @media (max-width: 900px) {
      .side-panel-wrapper {
        width: 100%;
        top: auto;
        bottom: 0;
        height: 80dvh;
        transform: translateY(120%);
      }
      .panel-open {
        transform: translateY(0);
      }
      .card-layer {
        display: none;
      }
      .card-main {
        border-radius: 24px 24px 0 0;
        border-bottom: none;
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
      gift_archetypes: ['#0072B2', '#009E73'],
      control_shadows: ['#0072B2', '#D55E00'],
      emotional_storm_shadows: ['#D55E00', '#CC79A7'],
      avoidant_intellectual_shadows: ['#56B4E9', '#E69F00'],
      anxious_connection_shadows: ['#CC79A7', '#D55E00'],
      seductive_avoidance_shadows: ['#CC79A7', '#E69F00']
    };

    return clusterColors[this.archetype.cluster || 'gift_archetypes'] || ['#0072B2', '#009E73'];
  });

  // Format cluster name for display
  readonly formattedCluster = computed(() => {
    if (!this.archetype?.cluster) return '';
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
