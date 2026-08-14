import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="back-btn"
      (click)="clicked.emit()"
      [attr.aria-label]="label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="back-btn__arrow">
        <path d="M19 12H5"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      <span class="back-btn__text">{{ label }}</span>
    </button>
  `,
  styles: [`
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 20px;
      padding: 8px 16px;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      color: var(--ink-muted);
      cursor: pointer;
      transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .back-btn:hover {
      background: var(--accent-blue);
      color: white;
      transform: translateX(-4px);
    }

    .back-btn:active {
      transform: translateX(-2px) scale(0.97);
    }

    .back-btn:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    .back-btn__arrow {
      width: 16px;
      height: 16px;
    }

    .back-btn__text {
      line-height: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  @Input() label = 'Back';
  @Output() clicked = new EventEmitter<void>();
}
