import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paper-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="paper-btn"
      [class.paper-btn--primary]="variant === 'primary'"
      [class.paper-btn--secondary]="variant === 'secondary'"
      [class.paper-btn--accent]="variant === 'accent'"
      [class.paper-btn--danger]="variant === 'danger'"
      [class.paper-btn--sm]="size === 'sm'"
      [class.paper-btn--lg]="size === 'lg'"
      [class.paper-btn--sketchy]="sketchy"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      (click)="!disabled && clicked.emit($event)">
      @if (icon) {
        <span class="paper-btn__icon" [attr.aria-hidden]="true">{{ icon }}</span>
      }
      <span class="paper-btn__label">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .paper-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--paper-panel);
      border: 2px solid var(--ink-main);
      border-radius: 16px;
      padding: 10px 20px;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 700;
      color: var(--ink-main);
      cursor: pointer;
      box-shadow: 2px 2px 0 rgba(200, 190, 180, 0.5), 4px 4px 0 rgba(180, 170, 160, 0.3);
      transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
      white-space: nowrap;
    }

    .paper-btn:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 12px 24px rgba(74, 62, 53, 0.15);
    }

    .paper-btn:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: inset 0 2px 4px rgba(74, 62, 53, 0.1);
    }

    .paper-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .paper-btn:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    .paper-btn--sketchy {
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    }

    .paper-btn--primary {
      background: var(--paper-panel);
      color: var(--ink-main);
    }

    .paper-btn--secondary {
      background: transparent;
      box-shadow: none;
      border-radius: 20px;
    }

    .paper-btn--secondary:hover:not(:disabled) {
      background: rgba(74, 62, 53, 0.05);
      box-shadow: none;
    }

    .paper-btn--accent {
      background: var(--accent-blue);
      color: white;
      border-color: var(--ink-main);
    }

    .paper-btn--accent:hover:not(:disabled) {
      background: #5a91c7;
    }

    .paper-btn--danger {
      background: var(--accent-rose);
      color: white;
      border-color: var(--ink-main);
    }

    .paper-btn--sm {
      padding: 6px 14px;
      font-size: 12px;
      gap: 4px;
    }

    .paper-btn--lg {
      padding: 14px 28px;
      font-size: 16px;
      gap: 10px;
    }

    .paper-btn__icon {
      font-size: 18px;
      line-height: 1;
    }

    .paper-btn__label {
      line-height: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaperButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() sketchy = false;
  @Input() ariaLabel = '';
  @Output() clicked = new EventEmitter<MouseEvent>();
}
