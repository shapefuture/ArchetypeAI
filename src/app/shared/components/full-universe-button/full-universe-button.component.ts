import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-full-universe-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="full-universe-btn"
      (click)="clicked.emit()"
      [attr.aria-label]="ariaLabel">
      <span class="full-universe-btn__icon"></span>
      <span class="full-universe-btn__label">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .full-universe-btn {
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      padding: 8px 16px;
      color: var(--ink-main);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 4px 4px 0 rgba(74, 62, 53, 0.1), 8px 8px 0 rgba(74, 62, 53, 0.05);
      cursor: pointer;
      transition: all 0.3s var(--ease-storybook);
      position: relative;
      overflow: hidden;
    }

    .full-universe-btn__icon {
      font-size: 16px;
    }

    .full-universe-btn__icon::before {
      content: '🌍';
    }

    .full-universe-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 6px 6px 0 rgba(74, 62, 53, 0.15), 10px 10px 0 rgba(74, 62, 53, 0.1);
      background: #fff;
    }

    .full-universe-btn:hover .full-universe-btn__icon {
      animation: world-spin 0.6s ease-in-out;
    }

    .full-universe-btn:active {
      transform: translateY(0) scale(0.98);
      box-shadow: inset 0 2px 4px rgba(74, 62, 53, 0.1);
    }

    .full-universe-btn:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    @keyframes world-spin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }

    @media (max-width: 640px) {
      .full-universe-btn {
        padding: 6px 12px;
        font-size: 11px;
      }

      .full-universe-btn__icon {
        font-size: 14px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .full-universe-btn:hover {
        transform: translateY(-2px);
      }

      .full-universe-btn:hover .full-universe-btn__icon {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullUniverseButtonComponent {
  @Output() clicked = new EventEmitter<void>();
  @Input() ariaLabel = 'View full universe';
}
