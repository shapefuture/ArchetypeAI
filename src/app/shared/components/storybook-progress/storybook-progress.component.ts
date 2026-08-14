import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-storybook-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <div class="progress-bar" role="progressbar" [attr.aria-valuenow]="progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="ariaLabel">
        <div class="progress-fill" [style.width.%]="progress"></div>
        @if (showLabel) {
          <span class="progress-label">{{ progress | number:'1.0-0' }}%</span>
        }
      </div>
      @if (sectionLabel) {
        <div class="progress-section">
          <span class="progress-section-icon">{{ sectionIcon }}</span>
          <span class="progress-section-text">{{ sectionLabel }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-container {
      width: 100%;
    }

    .progress-bar {
      width: 100%;
      height: 16px;
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--ink-main);
      border-right: 2px solid var(--ink-main);
      border-radius: 6px 0 0 6px;
      transition: width 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        rgba(255,255,255,0.15) 4px,
        rgba(255,255,255,0.15) 8px
      );
    }

    .progress-label {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-main);
      text-shadow: 0 0 4px var(--paper-panel);
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
    }

    .progress-section-icon {
      font-size: 14px;
    }

    .progress-section-text {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 700;
      color: var(--ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media (max-width: 640px) {
      .progress-bar {
        height: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorybookProgressComponent {
  @Input() progress = 0;
  @Input() sectionLabel = '';
  @Input() sectionIcon = '';
  @Input() showLabel = false;
  @Input() ariaLabel = 'Progress';
}
