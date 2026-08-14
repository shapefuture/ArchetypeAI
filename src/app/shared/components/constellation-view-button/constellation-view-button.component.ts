import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-constellation-view-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="constellation-view-btn"
      (click)="clicked.emit()"
      [attr.aria-label]="ariaLabel"
      title="View constellation">
    </button>
  `,
  styles: [`
    .constellation-view-btn {
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 8px;
      padding: 6px;
      cursor: pointer;
      transition: all 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
      display: grid;
      place-items: center;
      min-width: 32px;
      min-height: 32px;
    }

    .constellation-view-btn::before {
      content: '🔭';
      font-size: 16px;
      display: block;
    }

    .constellation-view-btn:hover {
      background: var(--accent-blue);
      transform: scale(1.1) rotate(-5deg);
    }

    .constellation-view-btn:hover::before {
      content: '🌌';
    }

    .constellation-view-btn:active {
      transform: scale(1.05) rotate(-3deg);
    }

    .constellation-view-btn:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .constellation-view-btn:hover {
        transform: scale(1.05);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstellationViewButtonComponent {
  @Output() clicked = new EventEmitter<void>();
  @Input() ariaLabel = 'View constellation';
}
