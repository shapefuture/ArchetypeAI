import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HelpItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="help-overlay" (click)="close.emit()" role="dialog" [attr.aria-label]="title" aria-modal="true">
        <div class="help-modal" (click)="$event.stopPropagation()">
          <!-- Decorative corners -->
          <span class="help-modal__deco help-modal__deco--tl" aria-hidden="true">&#10047;</span>
          <span class="help-modal__deco help-modal__deco--br" aria-hidden="true">&#10047;</span>

          <button class="help-modal__close" (click)="close.emit()" aria-label="Close help">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <h2 class="help-modal__title">{{ title }}</h2>
          <p class="help-modal__desc">{{ description }}</p>

          <ul class="help-modal__list">
            @for (item of items; track item.title) {
              <li class="help-modal__item">
                <strong class="help-modal__item-title">{{ item.title }}</strong>
                <span class="help-modal__item-desc">{{ item.description }}</span>
              </li>
            }
          </ul>

          <p class="help-modal__footer">{{ footer }}</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .help-overlay {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background:
        radial-gradient(circle at 20% 20%, rgba(240, 228, 66, 0.14), transparent 28%),
        radial-gradient(circle at 80% 30%, rgba(214, 94, 0, 0.10), transparent 24%),
        linear-gradient(135deg, rgba(28, 25, 23, 0.62), rgba(28, 25, 23, 0.35));
      backdrop-filter: blur(10px) saturate(1.1);
      -webkit-backdrop-filter: blur(10px) saturate(1.1);
      animation: fade-in 220ms ease-out;
    }

    .help-modal {
      position: relative;
      background:
        linear-gradient(180deg, rgba(253, 251, 246, 0.98), rgba(246, 243, 235, 0.98)),
        radial-gradient(circle at top, rgba(232, 221, 208, 0.55), transparent 45%);
      border: 2px solid var(--ink-main);
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      padding: 32px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow:
        0 24px 60px rgba(28, 25, 23, 0.22),
        4px 4px 0 rgba(200, 190, 180, 0.5),
        8px 8px 0 rgba(180, 170, 160, 0.3);
      animation: card-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .help-modal__deco {
      position: absolute;
      font-size: 24px;
      opacity: 0.25;
      color: var(--accent-orange);
      pointer-events: none;
    }

    .help-modal__deco--tl { top: 12px; left: 12px; }
    .help-modal__deco--br { bottom: 12px; right: 12px; transform: rotate(180deg); }

    .help-modal__close {
      position: absolute;
      top: 16px;
      right: 20px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ink-muted);
      padding: 4px;
      border-radius: 50%;
      transition: all 150ms;
    }

    .help-modal__close:hover {
      color: var(--ink-main);
      background: rgba(74, 62, 53, 0.08);
      transform: rotate(6deg) scale(1.05);
    }

    .help-modal__close:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    .help-modal__close svg { width: 24px; height: 24px; }

    .help-modal__title {
      font-family: var(--font-serif);
      font-size: 24px;
      font-weight: 700;
      color: var(--ink-main);
      margin-bottom: 12px;
      padding-right: 32px;
    }

    .help-modal__desc {
      font-family: var(--font-sans);
      font-size: 15px;
      color: var(--ink-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .help-modal__list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .help-modal__item {
      padding: 12px 0;
      border-bottom: 1px dashed var(--ink-light);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.6;
      color: var(--ink-main);
    }

    .help-modal__item:last-child {
      border-bottom: none;
    }

    .help-modal__item-title {
      color: var(--accent-orange);
      font-family: var(--font-serif);
      font-weight: 600;
    }

    .help-modal__item-desc {
      color: var(--ink-main);
    }

    .help-modal__footer {
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--ink-muted);
      margin-top: 20px;
      font-style: italic;
    }

    .help-modal::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0.12;
      mix-blend-mode: multiply;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes card-pop-in {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 640px) {
      .help-modal {
        border-radius: 16px;
        padding: 20px;
        max-height: 90vh;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .help-overlay, .help-modal { animation: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Help';
  @Input() description = '';
  @Input() items: HelpItem[] = [];
  @Input() footer = '';
  @Output() close = new EventEmitter<void>();
}
