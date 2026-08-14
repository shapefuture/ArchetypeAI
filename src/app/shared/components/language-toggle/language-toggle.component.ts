import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="language-toggle"
      (click)="clicked.emit()"
      [attr.aria-label]="ariaLabel"
      [attr.aria-pressed]="currentLanguage === 'ru'">
      <span class="language-toggle__icon"></span>
      <span class="language-toggle__label">{{ currentLanguage }}</span>
    </button>
  `,
  styles: [`
    .language-toggle {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid var(--ink-light);
      border-radius: 10px;
      padding: 8px 14px;
      font-family: var(--font-sans);
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ink-main);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(74, 62, 53, 0.05);
    }

    .language-toggle__icon {
      font-size: 14px;
      opacity: 0.7;
    }

    .language-toggle__icon::before {
      content: '🌐';
    }

    .language-toggle:hover {
      background: white;
      border-color: var(--ink-main);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(74, 62, 53, 0.1);
    }

    .language-toggle:hover .language-toggle__icon {
      opacity: 1;
      animation: globe-spin 1.5s ease-in-out infinite;
    }

    .language-toggle:active {
      transform: scale(1.02);
    }

    .language-toggle:focus-visible {
      outline: 3px solid var(--accent-blue);
      outline-offset: 2px;
    }

    @keyframes globe-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .language-toggle {
        padding: 5px 10px;
        font-size: 10px;
      }

      .language-toggle__icon {
        font-size: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .language-toggle:hover {
        transform: scale(1.02);
      }

      .language-toggle:hover .language-toggle__icon {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {
  @Input() currentLanguage: 'en' | 'ru' = 'en';
  @Output() clicked = new EventEmitter<void>();
  @Input() ariaLabel = 'Toggle language';
}
