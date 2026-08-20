import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstallService } from '../../../services/install.service';
import { TranslationService } from '../../../services/translation.service';

/**
 * Install dialog (inspired by khmyznikov/pwa-install): a branded sheet
 * instead of the browser mini-bar. Android/desktop get the native
 * prompt behind the Install button; iOS gets the Safari share steps.
 */
const UI = {
  en: {
    title: 'Install Innerverse',
    desc: 'Add it to your home screen — it opens full-screen and keeps your place offline.',
    install: 'Install',
    later: 'Not now',
    iosTitle: 'Add Innerverse to your Home Screen',
    iosSteps: [
      'Tap the Share button in Safari',
      'Scroll and tap “Add to Home Screen”',
      'Tap “Add” — Innerverse gets its own icon',
    ],
  },
  ru: {
    title: 'Установить Innerverse',
    desc: 'Добавьте на домашний экран — открывается на весь экран и сохраняет прогресс офлайн.',
    install: 'Установить',
    later: 'Позже',
    iosTitle: 'Добавьте Innerverse на экран «Домой»',
    iosSteps: [
      'Нажмите кнопку «Поделиться» в Safari',
      'Пролистайте и выберите «На экран “Домой”»',
      'Нажмите «Добавить» — у Innerverse появится своя иконка',
    ],
  },
};

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (install.dialogOpen()) {
      <div class="ip-backdrop" (click)="install.dismiss()"></div>
      <div class="ip-sheet" role="dialog" aria-modal="true" aria-labelledby="ip-title">
        <div class="ip-grip" aria-hidden="true"></div>

        <div class="ip-head">
          <div class="ip-icon" aria-hidden="true">✦</div>
        </div>

        @if (install.isIos() && !install.canInstall()) {
          <h2 id="ip-title" class="ip-title">{{ ui().iosTitle }}</h2>
          <ol class="ip-steps">
            @for (step of ui().iosSteps; track $index) {
              <li>{{ step }}</li>
            }
          </ol>
        } @else {
          <h2 id="ip-title" class="ip-title">{{ ui().title }}</h2>
          <p class="ip-desc">{{ ui().desc }}</p>
        }

        <div class="ip-actions">
          @if (!install.isIos() || install.canInstall()) {
            <button class="ip-btn ip-install" (click)="install.promptInstall()">
              {{ ui().install }}
            </button>
          }
          <button class="ip-btn ip-later" (click)="install.dismiss()">{{ ui().later }}</button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    /* ---------- scrim ---------- */
    .ip-backdrop {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(20, 12, 30, 0.45);
      animation: ip-fade 0.25s ease both;
    }

    /* ---------- bottom sheet ---------- */
    .ip-sheet {
      position: fixed; z-index: 301;
      left: 50%; bottom: 0;
      transform: translateX(-50%);
      width: min(400px, 100vw);
      box-sizing: border-box;
      background: #FBF5E6;
      border-top: 2px solid #1C1610;
      border-radius: 28px 28px 0 0;
      padding: 10px 22px calc(22px + env(safe-area-inset-bottom, 0px));
      text-align: center;
      animation: ip-rise 0.4s cubic-bezier(0.34, 1.3, 0.64, 1) both;
    }
    .ip-grip {
      width: 44px; height: 5px;
      border-radius: 999px;
      background: rgba(58, 50, 41, 0.14);
      margin: 4px auto 14px;
    }

    /* ---------- app icon tile ---------- */
    .ip-head { width: fit-content; margin: 0 auto 12px; }
    .ip-icon {
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      font-size: 30px;
      color: #F7DD4A;
      background: #181432;
      border-radius: 13px;
    }

    /* ---------- copy ---------- */
    .ip-title {
      margin: 0 0 6px;
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-size: 21px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1.15;
      color: #3A3229;
    }
    .ip-desc {
      margin: 0 0 18px;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-style: italic;
      font-size: 14px; line-height: 1.55;
      color: #7A6F5E;
    }

    /* ---------- iOS share-sheet steps ---------- */
    .ip-steps {
      margin: 0 0 18px; padding: 0;
      list-style: none; text-align: left;
      display: flex; flex-direction: column; gap: 8px;
      counter-reset: ip-step;
    }
    .ip-steps li {
      font-size: 14px; color: #3A3229;
      padding: 10px 14px;
      background: #EDE2C6;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      border-radius: 14px;
      counter-increment: ip-step;
    }
    .ip-steps li::before {
      content: counter(ip-step);
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; margin-right: 10px;
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-size: 12px;
      color: #1C1610;
      background: #F7DD4A;
      border: 2px solid #1C1610;
      border-radius: 999px;
      vertical-align: middle;
    }

    /* ---------- buttons (sticker physics) ---------- */
    .ip-actions {
      display: flex; flex-direction: column; align-items: stretch; gap: 10px;
    }
    .ip-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      box-sizing: border-box;
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      min-height: 52px;
      padding: 12px 24px;
      border-radius: 999px;
      cursor: pointer;
      transition: transform 0.06s ease, box-shadow 0.06s ease;
    }
    .ip-install {
      border: 2px solid #1C1610;
      box-shadow: 0 4px 0 #1C1610;
      background: #F7DD4A;
      color: #1C1610;
    }
    .ip-install:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #1C1610;
    }
    .ip-later {
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      background: transparent;
      color: #7A6F5E;
      min-height: 46px;
    }
    .ip-later:active {
      transform: scale(0.97);
    }

    /* ---------- centered card on wider screens ---------- */
    @media (min-width: 640px) {
      .ip-sheet {
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        width: min(400px, calc(100vw - 48px));
        border: 2px solid #1C1610;
        border-radius: 24px;
        box-shadow: 0 26px 60px rgba(24, 16, 6, 0.25);
      }
      .ip-grip { display: none; }
      .ip-actions { align-items: center; }
      .ip-install { min-width: 200px; }
    }

    @keyframes ip-rise {
      from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.95); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    @keyframes ip-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .ip-sheet, .ip-backdrop { animation: none; }
    }
  `],
})
export class InstallPromptComponent {
  readonly install = inject(InstallService);
  private readonly ts = inject(TranslationService);
  readonly ui = computed(() => UI[this.ts.getLanguage() === 'ru' ? 'ru' : 'en'] as typeof UI.en);
}
