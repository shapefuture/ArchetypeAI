import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-stack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-stack" role="region" [attr.aria-label]="ariaLabel">
      <!-- Background offset layers -->
      <div class="card-layer card-layer--2" aria-hidden="true"></div>
      <div class="card-layer card-layer--1" aria-hidden="true"></div>

      <!-- Main content card -->
      <div class="card-stack__main">
        <!-- Ribbons -->
        @if (ribbons.length > 0) {
          <div class="card-stack__ribbons" aria-hidden="true">
            @for (ribbon of ribbons; track $index) {
              <div class="card-stack__ribbon" [style.background]="ribbon"></div>
            }
          </div>
        }

        <!-- Close button -->
        @if (showClose) {
          <button
            class="card-stack__close"
            (click)="close.emit()"
            [attr.aria-label]="closeLabel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }

        <!-- Content slot -->
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .card-stack {
      position: relative;
      perspective: 1000px;
    }

    .card-layer {
      position: absolute;
      inset: 0;
      background: #eaddd0;
      border: 2px solid var(--ink-main);
      border-radius: 16px;
      pointer-events: none;
    }

    .card-layer--2 {
      transform: translate(12px, 12px) rotate(2deg);
      z-index: 1;
    }

    .card-layer--1 {
      transform: translate(6px, 6px) rotate(1deg);
      z-index: 2;
    }

    .card-stack__main {
      position: relative;
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 16px;
      z-index: 3;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      animation: card-slide-up 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .card-stack__ribbons {
      position: absolute;
      top: -2px;
      left: 24px;
      display: flex;
      gap: 6px;
      z-index: 4;
    }

    .card-stack__ribbon {
      width: 16px;
      height: 28px;
      border: 2px solid var(--ink-main);
      border-top: none;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
    }

    .card-stack__close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ink-muted);
      padding: 4px;
      border-radius: 50%;
      transition: color 150ms, background 150ms;
      z-index: 5;
      display: grid;
      place-items: center;
    }

    .card-stack__close:hover {
      color: var(--ink-main);
      background: rgba(74, 62, 53, 0.05);
    }

    .card-stack__close:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    .card-stack__close svg {
      width: 20px;
      height: 20px;
    }

    @keyframes card-slide-up {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 640px) {
      .card-stack__main {
        border-radius: 24px 24px 0 0;
        border-bottom: none;
        border-left: none;
        border-right: none;
      }

      .card-layer {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .card-stack__main {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStackComponent {
  @Input() ribbons: string[] = [];
  @Input() showClose = true;
  @Input() closeLabel = 'Close';
  @Input() ariaLabel = 'Detail card';
  @Output() close = new EventEmitter<void>();
}
