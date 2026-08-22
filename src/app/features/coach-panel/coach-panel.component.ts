import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { BlobCharacterComponent } from '../../shared/components/blob-character/blob-character.component';
import { TranslationService } from '../../../services/translation.service';

/**
 * One rendered turn in the AI Coach conversation.
 *
 * `timestamp` is a pre-formatted absolute local time string (e.g. "14:32") —
 * it's set once at message creation and never recomputed, so it stays stable
 * across change-detection cycles. (A `Date` + a relative-time getter was
 * originally causing every historical message to re-stamp as "just now" on
 * each CD burst.)
 */
export interface CoachMessage {
  id: string;
  /** Visual role for the panel template. */
  role: 'coach' | 'user';
  content: string;
  timestamp: string;
  coachMood?: 'neutral' | 'happy' | 'excited' | 'thinking';
  /**
   * Role Gemini should treat this turn as when building chat history for
   * the next request. If absent, the turn is excluded from the history
   * (used for surfaced error turns — we don't want the "Sorry, I
   * encountered an issue" text to leak back as a model turn).
   */
  chatRole?: 'user' | 'model';
}

export interface SuggestedQuestion {
  id: string;
  text: string;
}

/**
 * Pre-format a `Date.now()` millisecond timestamp into a stable `HH:MM`
 * (24-hour, locale-neutral) string for stable, never-recomputing display.
 * 24-hour keeps the format predictable across the en/ru locales — the
 * en-US `'2-digit', '2-digit'` defaults to 12-hour with AM/PM, which
 * trips our own `^\d{1,2}:\d{2}$` regression regex in the future.
 */
export function formatCoachClock(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

@Component({
  selector: 'app-coach-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, BlobCharacterComponent],
  template: `
    <div
      class="coach-overlay"
      [class.coach-overlay--open]="isOpen"
      (click)="close.emit()">
      <!--
        Bottom sheet — near-full height, capped to the phone-stage width
        (min(430px, 100vw), centered) so it stays glued to the centered
        app stage on desktop instead of detaching to the viewport edge.
        Tapping the scrim closes, mirroring the quickscan/landing sheets.
      -->
      <section
        class="coach-panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="t('title')"
        [class.coach-panel--open]="isOpen"
        (click)="$event.stopPropagation()">
        <div class="coach-panel__grip" aria-hidden="true"></div>

        <!-- Header -->
        <div class="coach-panel__header">
          <div class="coach-panel__title">
            <app-blob-character
              [color]="'#F7DD4A'"
              [size]="'sm'"
              [mood]="coachMood"
              [animate]="true"
              [noHover]="true">
            </app-blob-character>
            <h2 class="coach-panel__title-text">{{ t('title') }}</h2>
          </div>
          <!--
            Persona toggle. The pill flips between "general" coaching tone and
            the IFS-aware Parts Dialogue mode. [mode] is owned by the parent
            (AppComponent) so the model routing + welcome reset can be
            orchestrated centrally; the panel just reflects state and emits
            toggle requests.
          -->
          <button
            type="button"
            class="coach-panel__mode-pill"
            [class.coach-panel__mode-pill--active]="mode === 'parts'"
            [attr.aria-label]="t('partsDialoguePillAria', 'universe')"
            [attr.aria-pressed]="mode === 'parts'"
            [title]="mode === 'parts' ? t('partsDialogueExitHint', 'universe') : ''"
            (click)="modeToggle.emit()">
            <span class="coach-panel__mode-pill-dot" aria-hidden="true"></span>
            <span class="coach-panel__mode-pill-label">{{ t('partsDialogue', 'universe') }}</span>
          </button>
          <button class="coach-panel__close" (click)="close.emit()" [attr.aria-label]="t('closeAria')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Messages Area -->
        <div class="coach-panel__messages" #messagesContainer>
          @for (message of messages; track message.id) {
            <div class="coach-message coach-message--{{ message.role }}" [@messageEnter]>

              <!-- Coach Message -->
              @if (message.role === 'coach') {
                <div class="coach-message__avatar">
                  <app-blob-character
                    [color]="'#F7DD4A'"
                    [size]="'sm'"
                    [mood]="message.coachMood || 'neutral'"
                    [animate]="true"
                    [noHover]="true">
                  </app-blob-character>
                </div>
                <div class="coach-message__bubble coach-message__bubble--coach">
                  <div class="coach-message__content prose-storybook" [innerHTML]="formatMessage(message.content)"></div>
                  <div class="coach-message__timestamp">{{ message.timestamp }}</div>
                </div>
              }

              <!-- User Message -->
              @if (message.role === 'user') {
                <div class="coach-message__bubble coach-message__bubble--user">
                  <div class="coach-message__content">{{ message.content }}</div>
                  <div class="coach-message__timestamp">{{ message.timestamp }}</div>
                </div>
              }
            </div>
          }

          <!-- Typing Indicator -->
          @if (isTyping) {
            <div class="coach-message coach-message--coach" [@typingIndicator]>
              <div class="coach-message__avatar">
                <app-blob-character
                  [color]="'#F7DD4A'"
                  [size]="'sm'"
                  [mood]="'thinking'"
                  [animate]="true"
                  [noHover]="true">
                </app-blob-character>
              </div>
              <div class="coach-message__bubble coach-message__bubble--coach">
                <div class="typing-indicator">
                  <span class="typing-indicator__dot"></span>
                  <span class="typing-indicator__dot"></span>
                  <span class="typing-indicator__dot"></span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Suggested Questions -->
        @if (showSuggestions && suggestedQuestions.length > 0) {
          <div class="coach-panel__suggestions">
            <div class="coach-panel__suggestions-label">{{ t('suggestedQuestionsLabel') }}</div>
            <div class="coach-panel__suggestions-chips">
              @for (suggestion of suggestedQuestions; track suggestion.id) {
                <button type="button" class="coach-panel__chip" (click)="selectSuggestion(suggestion.text)">
                  {{ suggestion.text }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Input Area -->
        <div class="coach-panel__input">
          <div class="coach-panel__input-row">
            <div class="coach-panel__input-wrapper">
              <textarea
                #messageInput
                class="coach-panel__textarea"
                [placeholder]="mode === 'parts' ? t('partsModePlaceholder') : t('inputPlaceholder')"
                [(ngModel)]="userInput"
                (keydown.enter)="handleEnter($event)"
                (input)="adjustTextareaHeight()"
                rows="1"
                [attr.aria-label]="t('inputAria')"></textarea>
            </div>
            <button
              type="button"
              class="coach-panel__send"
              [disabled]="!userInput.trim() || isSending"
              [attr.aria-label]="t('sendAria')"
              (click)="sendMessage()">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    /* ============================================================
       COACH PANEL — cream storybook bottom sheet.
       paper #F3EAD4 · card #FBF5E6 · deep #EDE2C6
       ink #332A1F · ink3 #857A69 · outline #1C1610 · lemon #F7DD4A
       Rises over a scrim, capped to the phone-stage width so it stays
       glued to the centered app stage on desktop.
       ============================================================ */
    .coach-overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-panel, 30);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      background: rgba(20, 12, 30, 0.45);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .coach-overlay--open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Desktop: shrink the overlay's content box to the phone-stage
       geometry (stage is min(900px, 95dvh) tall, vertically centered) so
       the sheet docks to the stage's bottom edge, not the viewport's. */
    @media (min-width: 520px) {
      .coach-overlay {
        padding-top: calc((100dvh - min(900px, 95dvh)) / 2);
        padding-bottom: calc((100dvh - min(900px, 95dvh)) / 2);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
      }
    }

    /* Sheet */
    .coach-panel {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: min(430px, 100vw);
      height: 88%;
      background: #FBF5E6;
      border: 2.5px solid #1C1610;
      border-bottom: 0;
      border-radius: 28px 28px 0 0;
      box-shadow: 0 -3px 0 #1C1610;
      transform: translateY(105%);
      transition: transform 0.45s var(--ease-storybook, cubic-bezier(0.34, 1.45, 0.4, 1));
      font-family: var(--font-serif, 'Fraunces', serif);
      color: #332A1F;
      will-change: transform;
    }

    .coach-panel--open {
      transform: translateY(0);
    }

    /* Desktop: the sheet sits flush inside the rounded stage, so close
       its bottom edge instead of leaving it open like a phone sheet. */
    @media (min-width: 520px) {
      .coach-panel {
        border-bottom: 2.5px solid #1C1610;
        border-radius: 28px 28px 30px 30px;
      }
    }

    .coach-panel__grip {
      flex: none;
      width: 44px;
      height: 5px;
      border-radius: 4px;
      background: rgba(28, 22, 16, 0.18);
      margin: 10px auto 2px;
    }

    /* Header */
    .coach-panel__header {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 12px 12px 16px;
      background: #FBF5E6;
      border-bottom: 2px solid #1C1610;
    }

    .coach-panel__title {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .coach-panel__title-text {
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-size: 19px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: #332A1F;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Persona toggle — sticker chip: card bg + outline, lemon when the
       IFS Parts Dialogue mode is on. Always visible so users discover
       the affordance; the active class inverts the colors so the
       *current* state (parts vs general) reads at a glance without
       needing a separate label swap. */
    .coach-panel__mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FBF5E6;
      border: 2px solid #1C1610;
      border-radius: 999px;
      box-shadow: 0 2px 0 #1C1610;
      padding: 7px 12px 7px 10px;
      cursor: pointer;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 700;
      font-size: 11px;
      color: #857A69;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.2s ease, color 0.2s ease;
      flex-shrink: 0;
    }

    .coach-panel__mode-pill:hover {
      color: #332A1F;
    }

    .coach-panel__mode-pill:active {
      transform: translateY(2px);
      box-shadow: 0 0 0 #1C1610;
    }

    .coach-panel__mode-pill:focus-visible {
      outline: 3px solid rgba(28, 22, 16, 0.4);
      outline-offset: 2px;
    }

    .coach-panel__mode-pill--active {
      background: #F7DD4A;
      color: #1C1610;
    }

    .coach-panel__mode-pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #857A69;
      transition: background var(--duration-quick, 300ms) var(--ease-relational, ease);
    }

    .coach-panel__mode-pill--active .coach-panel__mode-pill-dot {
      background: #1C1610;
    }

    .coach-panel__mode-pill-label {
      white-space: nowrap;
    }

    /* Close — sticker iconbtn */
    .coach-panel__close {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      padding: 0;
      cursor: pointer;
      background: #FBF5E6;
      border: 2px solid #1C1610;
      border-radius: 14px;
      box-shadow: 0 2px 0 #1C1610;
      color: #332A1F;
      transition: transform 0.15s var(--ease-storybook, cubic-bezier(0.34, 1.45, 0.4, 1));
    }

    .coach-panel__close:active {
      transform: scale(0.9) rotate(-6deg);
    }

    /* Messages */
    .coach-panel__messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #F3EAD4;
      scroll-behavior: smooth;
    }

    .coach-message {
      display: flex;
      gap: 10px;
      max-width: 100%;
    }

    .coach-message--coach {
      justify-content: flex-start;
    }

    .coach-message--user {
      justify-content: flex-end;
    }

    .coach-message__avatar {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
    }

    .coach-message__bubble {
      padding: 12px 15px;
      border-radius: 18px;
      border: 2px solid #1C1610;
      position: relative;
    }

    /* theirs: card sticker, sharper corner toward the coach */
    .coach-message__bubble--coach {
      flex: 1;
      min-width: 0;
      background: #FBF5E6;
      border-top-left-radius: 7px;
    }

    /* yours: lemon tint, sharper corner toward the user */
    .coach-message__bubble--user {
      flex: 0 1 auto;
      max-width: 85%;
      align-self: flex-end;
      background: color-mix(in srgb, #F7DD4A 38%, #FBF5E6);
      border-top-right-radius: 7px;
    }

    .coach-message__content {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 14.5px;
      line-height: 1.55;
      color: #332A1F;
      word-wrap: break-word;
    }

    .coach-message__bubble--coach .coach-message__content {
      font-style: italic;
    }

    .coach-message__timestamp {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.06em;
      color: #857A69;
      margin-top: 6px;
      text-align: right;
    }

    /* Suggestions — sticker chips */
    .coach-panel__suggestions {
      flex: none;
      padding: 12px 14px 14px;
      background: #EDE2C6;
      border-top: 2px solid #1C1610;
    }

    .coach-panel__suggestions-label {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 600;
      font-size: 11px;
      color: #857A69;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }

    .coach-panel__suggestions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .coach-panel__chip {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      border-radius: 999px;
      background: #FBF5E6;
      border: 2px solid #1C1610;
      box-shadow: 0 2px 0 #1C1610;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 13px;
      font-weight: 600;
      color: #332A1F;
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.2s ease;
    }

    .coach-panel__chip:hover {
      background: color-mix(in srgb, #F7DD4A 30%, #FBF5E6);
    }

    .coach-panel__chip:active {
      transform: translateY(2px);
      box-shadow: 0 0 0 #1C1610;
    }

    /* Input Area — paper2 bar, rounded field, round lemon send */
    .coach-panel__input {
      flex: none;
      padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
      background: #EDE2C6;
      border-top: 2px solid #1C1610;
    }

    .coach-panel__input-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }

    .coach-panel__input-wrapper {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      background: #FBF5E6;
      border: 2px solid rgba(28, 22, 16, 0.35);
      border-radius: 999px;
      padding: 12px 16px;
      transition: border-color 0.15s ease;
    }

    .coach-panel__input-wrapper:focus-within {
      border-color: #1C1610;
    }

    .coach-panel__textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 15px;
      line-height: 1.45;
      color: #332A1F;
      resize: none;
      min-height: 22px;
      max-height: 120px;
      overflow-y: auto;
      padding: 0;
    }

    .coach-panel__textarea::placeholder {
      color: #857A69;
      font-style: italic;
      opacity: 0.85;
    }

    .coach-panel__send {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      padding: 0;
      cursor: pointer;
      background: #F7DD4A;
      border: 2.5px solid #1C1610;
      border-radius: 50%;
      box-shadow: 0 4px 0 #1C1610;
      color: #1C1610;
      transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease;
    }

    .coach-panel__send:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #1C1610;
    }

    .coach-panel__send:disabled {
      opacity: 0.45;
      cursor: default;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 6px;
      padding: 4px 0;
    }

    .typing-indicator__dot {
      width: 8px;
      height: 8px;
      background: #857A69;
      border-radius: 50%;
      animation: typing-bounce 1.4s ease-in-out infinite;
    }

    .typing-indicator__dot:nth-child(1) { animation-delay: 0s; }
    .typing-indicator__dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator__dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-8px);
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .coach-message__bubble--user {
        max-width: calc(100% - 64px);
      }

      .coach-panel__mode-pill-label {
        /* Hide the verbose label on phones — keep the dot to convey the
           toggle affordance, augmented with aria-pressed for screen readers. */
        display: none;
      }

      .coach-panel__mode-pill {
        padding: 6px 8px;
      }
    }

    /* Custom scrollbar for messages */
    .coach-panel__messages::-webkit-scrollbar {
      width: 6px;
    }

    .coach-panel__messages::-webkit-scrollbar-track {
      background: rgba(28, 22, 16, 0.05);
      border-radius: 10px;
    }

    .coach-panel__messages::-webkit-scrollbar-thumb {
      background: rgba(28, 22, 16, 0.25);
      border-radius: 10px;
    }

    .coach-panel__messages::-webkit-scrollbar-thumb:hover {
      background: rgba(28, 22, 16, 0.4);
    }
  `],
  animations: [
    trigger('messageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('typingIndicator', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachPanelComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Input() messages: CoachMessage[] = [];
  @Input() isTyping = false;
  @Input() isSending = false;
  @Input() suggestedQuestions: SuggestedQuestion[] = [];
  @Input() showSuggestions = true;
  @Input() coachMood: 'neutral' | 'happy' | 'excited' | 'thinking' = 'neutral';
  /**
   * Pixel offset the legacy viewport-fixed right drawer used to dodge
   * `ArchetypeDetailCardComponent` (fixed top:0; right:0; width: 480px).
   * Retained for API compatibility — the bottom-sheet skin is a centered
   * modal overlay, so the value no longer affects layout.
   */
  @Input() coachOffsetPx: number = 0;
  /**
   * Persona the parent wants the coach to use. Drives the textarea
   * placeholder and, through `AppComponent.askCoach`, the system
   * instruction prefix sent to Gemini. Defaults to `'general'` so the
   * panel still renders cleanly when dropped into a context that
   * doesn't pass the input.
   */
  @Input() mode: 'general' | 'parts' = 'general';

  @Output() close = new EventEmitter<void>();
  @Output() sendMessageRequest = new EventEmitter<string>();
  /**
   * Emitted when the user clicks the persona pill. The parent owns the
   * `mode` signal — the panel is intentionally dumb here so the parent
   * can orchestrate a conversation reset (or not) alongside the flip.
   */
  @Output() modeToggle = new EventEmitter<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  private readonly translationService = inject(TranslationService);
  /**
   * Shortcut for the inline template — `t(key)` resolves to the `coach`
   * section, but you can pass a different section explicitly (`t(key,
   * 'universe')`) for bundled keys like `partsDialogue` that we expose
   * for the persona pill. Templates get a free AOT-safe bridge without
   * having to denormalize the panel into touching `private` fields.
   */
  t(key: string, section: string = 'coach'): string {
    return this.translationService.t(key, section);
  }

  userInput = '';

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  /**
   * Keyboard-first users expect focus on the textarea when the panel
   * opens (the inline version had this). `ngAfterViewInit` only fires
   * once at component mount; `ngOnChanges` runs every time `isOpen`
   * flips, so we focus the textarea on *every* open (initial + reopen).
   * 350ms covers the slide-in transform (300ms transition + a tick).
   */
  ngOnChanges(changes: SimpleChanges): void {
    // `SimpleChanges` only contains inputs that *actually changed* this
    // cycle, so `changes['isOpen']` may be `undefined` when `messages` or
    // `suggestedQuestions` mutated while the panel stayed open. The
    // transition predicate (`previousValue !== true && currentValue === true`)
    // catches both the first false→true and every subsequent reopen, but
    // skips true→true noise and the false→false close path.
    const openChange = changes['isOpen'];
    if (
      openChange?.currentValue === true &&
      openChange?.previousValue !== true
    ) {
      // Re-check `isOpen` inside the timeout so a fast open→close doesn't
      // strand focus inside a now-hidden textarea.
      setTimeout(() => {
        if (this.isOpen) this.messageInput?.nativeElement.focus();
      }, 350);
    }
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (message && !this.isSending) {
      this.sendMessageRequest.emit(message);
      this.userInput = '';
      this.adjustTextareaHeight();
    }
  }

  selectSuggestion(question: string) {
    this.userInput = question;
    // Emit through the same channel as manual entry — `sendMessageRequest`.
    // No need to wait: `sendMessage()` already guards on empty input. Because
    // we just set `userInput = question`, `sendMessage()` reads it as
    // non-empty and emits.
    this.sendMessage();
  }

  handleEnter(event: Event) {
    // Only act on plain Enter; let Shift+Enter insert a newline.
    if (event instanceof KeyboardEvent && event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.sendMessage();
  }

  adjustTextareaHeight() {
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  /**
   * Render a coach-content string as sanitized markdown HTML.
   *
   * Mirrors `parseMarkdown()` in `AppComponent`: `marked.parse(...)` for the
   * conversion, `DOMPurify.sanitize(...)` for safety. Wrapped in try/catch so
   * a malformed Gemini response falls back to the raw text instead of
   * breaking the message bubble.
   */
  formatMessage(content: string): string {
    try {
      const html = marked.parse(content, { async: false }) as string;
      return DOMPurify.sanitize(html);
    } catch (err) {
      console.error('[CoachPanelComponent] Markdown parse failed', err);
      return content;
    }
  }
}
