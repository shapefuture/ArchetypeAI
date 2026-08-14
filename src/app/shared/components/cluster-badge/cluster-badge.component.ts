import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cluster-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cluster-badge" [class.active]="active" [style.--cluster-color]="color">
      <button
        class="cluster-badge__toggle"
        (click)="toggle.emit()"
        [attr.aria-pressed]="active"
        [attr.aria-label]="'Toggle ' + label + ' cluster'">
        <span class="cluster-badge__icon">{{ icon }}</span>
        <span class="cluster-badge__label">{{ label }}</span>
      </button>
      <button
        class="cluster-badge__view"
        (click)="view.emit(id)"
        [attr.aria-label]="'View ' + label + ' constellation'"
        title="View constellation">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path fill-rule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .cluster-badge {
      display: inline-flex;
      align-items: stretch;
      border-radius: 20px;
      overflow: hidden;
      border: 2px solid var(--ink-main);
      box-shadow: 2px 2px 0 rgba(200, 190, 180, 0.5);
      transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      background: var(--paper-panel);
    }

    .cluster-badge.active {
      background: var(--paper-panel);
      border-color: var(--cluster-color);
      border-left-width: 6px;
      color: var(--ink-main);
    }

    .cluster-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(74, 62, 53, 0.12);
    }

    .cluster-badge__toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 700;
      color: inherit;
      transition: background 150ms;
    }

    .cluster-badge__toggle:hover {
      background: rgba(74, 62, 53, 0.05);
    }

    .cluster-badge__toggle:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: -3px;
    }

    .cluster-badge__icon {
      font-size: 14px;
      line-height: 1;
    }

    .cluster-badge__label {
      white-space: nowrap;
    }

    .cluster-badge__view {
      display: grid;
      place-items: center;
      padding: 6px 8px;
      background: transparent;
      border: none;
      border-left: 2px solid var(--ink-main);
      cursor: pointer;
      color: inherit;
      transition: background 150ms;
    }

    .cluster-badge__view svg {
      width: 14px;
      height: 14px;
    }

    .cluster-badge__view:hover {
      background: rgba(74, 62, 53, 0.1);
    }

    .cluster-badge__view:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: -3px;
    }

    @media (max-width: 640px) {
      .cluster-badge__toggle {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClusterBadgeComponent {
  @Input() id = '';
  @Input() label = '';
  @Input() icon = '';
  @Input() color = '';
  @Input() active = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() view = new EventEmitter<string>();
}
