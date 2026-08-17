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
        <div class="ip-head">
          <div class="ip-icon" aria-hidden="true">✦</div>
          <div class="ip-badge">
            <span class="google-eyes"><span class="google-eye"></span><span class="google-eye"></span></span>
          </div>
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
            <button class="sticker-btn ip-install" (click)="install.promptInstall()">
              ⬇ {{ ui().install }}
            </button>
          }
          <button class="ip-later" (click)="install.dismiss()">{{ ui().later }}</button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .ip-backdrop {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(32, 26, 58, 0.45);
      backdrop-filter: blur(3px);
      animation: ip-fade 0.25s ease both;
    }
    .ip-sheet {
      position: fixed; z-index: 301;
      left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px));
      transform: translateX(-50%);
      width: min(400px, calc(100vw - 24px));
      box-sizing: border-box;
      background: var(--color-paper, #fbf3e3);
      border: 3px solid var(--color-ink, #201a3a);
      border-radius: 2rem;
      box-shadow: 8px 8px 0 0 var(--color-ink, #201a3a);
      padding: 22px 22px 18px;
      text-align: center;
      animation: ip-rise 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .ip-head { position: relative; width: fit-content; margin: 0 auto 12px; }
    .ip-icon {
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      background: var(--color-mustard, #ffc23c);
      border: 3px solid var(--color-ink, #201a3a);
      border-radius: 22%;
      box-shadow: 4px 4px 0 0 var(--color-ink, #201a3a);
    }
    .ip-badge {
      position: absolute; top: -10px; right: -16px;
      background: #fffdf5;
      border: 2px solid var(--color-ink, #201a3a);
      border-radius: 999px;
      padding: 4px 6px;
      box-shadow: 2px 2px 0 0 var(--color-ink, #201a3a);
    }
    .ip-title {
      margin: 0 0 6px;
      font-family: var(--font-display, sans-serif);
      font-size: 22px; font-weight: 600; color: var(--color-ink, #201a3a);
    }
    .ip-desc {
      margin: 0 0 16px;
      font-size: 14px; line-height: 1.5;
      color: var(--color-ink-l, #4a3f6e);
    }
    .ip-steps {
      margin: 0 0 16px; padding: 0;
      list-style: none; text-align: left;
      display: flex; flex-direction: column; gap: 8px;
    }
    .ip-steps li {
      font-size: 14px; color: var(--color-ink-l, #4a3f6e);
      padding: 8px 12px;
      background: rgba(255, 253, 245, 0.8);
      border: 2px solid rgba(32, 26, 58, 0.25);
      border-radius: 12px;
      counter-increment: ip-step;
    }
    .ip-steps li::before {
      content: counter(ip-step);
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; margin-right: 8px;
      font-family: var(--font-display, sans-serif);
      font-size: 12px;
      background: var(--color-sage, #46d8ae);
      border: 2px solid var(--color-ink, #201a3a);
      border-radius: 999px;
    }
    .ip-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .ip-install { min-width: 180px; background: var(--color-coral, #ff6b57); }
    .ip-later {
      background: none; border: none; cursor: pointer;
      font-family: var(--font-display, sans-serif);
      font-size: 13px; font-weight: 600;
      color: var(--color-ink-l, #4a3f6e);
      text-decoration: underline;
      text-underline-offset: 4px;
      padding: 6px 10px;
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
