import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { BlobCharacterComponent } from '../../shared/components/blob-character/blob-character.component';
import { PaperButtonComponent } from '../../shared/components/paper-button/paper-button.component';
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
  imports: [CommonModule, FormsModule, BlobCharacterComponent, PaperButtonComponent],
  template: `
    <div
      class="coach-panel"
      [class.coach-panel--open]="isOpen"
      [style.--coach-offset.px]="coachOffsetPx">
      <!-- Header -->
      <div class="coach-panel__header">
        <div class="coach-panel__title">
          <app-blob-character
            [color]="'#70a1d7'"
            [size]="'sm'"
            [mood]="coachMood"
            [name]="t('characterName')"
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  [color]="'#70a1d7'"
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
                [color]="'#70a1d7'"
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
              <app-paper-button
                [sketchy]="true"
                [size]="'sm'"
                (clicked)="selectSuggestion(suggestion.text)">
                {{ suggestion.text }}
              </app-paper-button>
            }
          </div>
        </div>
      }

      <!-- Input Area -->
      <div class="coach-panel__input">
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
          <app-paper-button
            class="coach-panel__send"
            [sketchy]="true"
            [size]="'sm'"
            [disabled]="!userInput.trim() || isSending"
            [icon]="'→'"
            [ariaLabel]="t('sendAria')"
            (clicked)="sendMessage()">
          </app-paper-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ============================================================
       COACH PANEL — light minimal skin.
       paper #F3EAD4 · card #FBF5E6 · deep #EDE2C6
       ink #3A3229 · muted #7A6F5E · outline #1C1610 · lemon #F7DD4A
       ============================================================ */
    .coach-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: min(420px, 100dvw);
      height: 100dvh;
      background: #F3EAD4;
      border-left: 2px solid #1C1610;
      display: flex;
      flex-direction: column;
      transform: translateX(calc(100% + var(--coach-offset, 0px)));
      transition: transform var(--duration-standard) var(--ease-storybook);
      z-index: var(--z-panel);
      font-family: var(--font-serif, 'Fraunces', serif);
      will-change: transform;
    }

    .coach-panel--open {
      transform: translateX(var(--coach-offset, 0px));
    }

    /* Header */
    .coach-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 16px 18px;
      border-bottom: 1.5px solid rgba(58, 50, 41, 0.2);
      background: #FBF5E6;
    }

    .coach-panel__title {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .coach-panel__title-text {
      font-family: 'Lilita One', var(--font-sans, sans-serif);
      font-size: 21px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: #3A3229;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Persona toggle pill — ghost pill by default, lemon when active.
       Always visible so users discover the affordance; the active class
       inverts the colors so the *current* state (parts vs general) reads
       at a glance without needing a separate label swap. */
    .coach-panel__mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      border-radius: 999px;
      padding: 6px 12px 6px 10px;
      cursor: pointer;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 600;
      font-size: 11px;
      color: #7A6F5E;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: transform 0.06s ease, border-color 0.15s ease, background-color 0.15s ease;
      flex-shrink: 0;
    }

    .coach-panel__mode-pill:hover {
      border-color: #1C1610;
      color: #3A3229;
    }

    .coach-panel__mode-pill:active {
      transform: scale(0.97);
    }

    .coach-panel__mode-pill:focus-visible {
      outline: 3px solid rgba(58, 50, 41, 0.4);
      outline-offset: 2px;
    }

    .coach-panel__mode-pill--active {
      background: #F7DD4A;
      color: #1C1610;
      border: 2px solid #1C1610;
      box-shadow: 0 4px 0 #1C1610;
    }

    .coach-panel__mode-pill--active:hover {
      background: #F7DD4A;
      color: #1C1610;
    }

    .coach-panel__mode-pill--active:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #1C1610;
    }

    .coach-panel__mode-pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(58, 50, 41, 0.4);
      transition: background var(--duration-quick) var(--ease-relational);
    }

    .coach-panel__mode-pill--active .coach-panel__mode-pill-dot {
      background: #1C1610;
    }

    .coach-panel__mode-pill-label {
      white-space: nowrap;
    }

    .coach-panel__close {
      background: transparent;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      border-radius: 999px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7A6F5E;
      flex-shrink: 0;
      transition: transform 0.06s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .coach-panel__close:hover {
      color: #3A3229;
      border-color: #1C1610;
    }

    .coach-panel__close:active {
      transform: scale(0.94);
    }

    /* Messages */
    .coach-panel__messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
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
      width: 36px;
      height: 36px;
    }

    .coach-message__bubble {
      flex: 1;
      min-width: 0;
      max-width: 100%;
      padding: 13px 16px;
      border-radius: 20px;
      position: relative;
    }

    /* theirs: card bg + hairline */
    .coach-message__bubble--coach {
      background: #FBF5E6;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      align-self: flex-start;
      border-top-left-radius: 8px;
    }

    /* yours: lemon tint, right-aligned */
    .coach-message__bubble--user {
      background: rgba(247, 221, 74, 0.38);
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      align-self: flex-end;
      border-top-right-radius: 8px;
      flex: 0 1 auto;
    }

    .coach-message__content {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 14px;
      line-height: 1.6;
      color: #3A3229;
      word-wrap: break-word;
    }

    .coach-message__bubble--coach .coach-message__content {
      font-style: italic;
    }

    .coach-message__timestamp {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 600;
      font-size: 10.5px;
      letter-spacing: 0.08em;
      color: #7A6F5E;
      margin-top: 8px;
      text-align: right;
    }

    /* Suggestions */
    .coach-panel__suggestions {
      padding: 14px 18px;
      border-top: 1.5px solid rgba(58, 50, 41, 0.2);
      background: #EDE2C6;
    }

    .coach-panel__suggestions-label {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-weight: 600;
      font-size: 11px;
      color: #7A6F5E;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }

    .coach-panel__suggestions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* suggestion chips render as ghost pills (paper-button internals
       are neutralized here so the chips read as native pills) */
    .coach-panel__suggestions-chips app-paper-button {
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 13px;
      padding: 9px 15px;
      background: #FBF5E6;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      border-radius: 999px;
      box-shadow: none;
      color: #3A3229;
      transition: transform 0.06s ease, border-color 0.15s ease, background-color 0.15s ease;
    }

    .coach-panel__suggestions-chips app-paper-button:hover {
      border-color: #1C1610;
    }

    .coach-panel__suggestions-chips app-paper-button:active {
      transform: scale(0.97);
    }

    /* Input Area */
    .coach-panel__input {
      padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
      border-top: 1.5px solid rgba(58, 50, 41, 0.2);
      background: #FBF5E6;
    }

    .coach-panel__input-wrapper {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      background: #F3EAD4;
      border: 1.5px solid rgba(58, 50, 41, 0.3);
      border-radius: 999px;
      padding: 8px 8px 8px 16px;
    }

    .coach-panel__textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--font-serif, 'Fraunces', serif);
      font-size: 14px;
      line-height: 1.5;
      color: #3A3229;
      resize: none;
      min-height: 24px;
      max-height: 120px;
      overflow-y: auto;
      padding: 6px 0;
    }

    .coach-panel__textarea::placeholder {
      color: rgba(122, 111, 94, 0.8);
      font-style: italic;
    }

    .coach-panel__textarea:focus {
      outline: none;
    }

    .coach-panel__input-wrapper:focus-within {
      border-color: #1C1610;
    }

    /* pill send button — lemon, solid shadow */
    .coach-panel__send {
      flex-shrink: 0;
      min-width: 44px;
      height: 44px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F7DD4A;
      border: 2px solid #1C1610;
      border-radius: 999px;
      box-shadow: 0 4px 0 #1C1610;
      color: #1C1610;
      transition: transform 0.06s ease, box-shadow 0.06s ease, opacity 0.15s ease;
    }

    .coach-panel__send:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #1C1610;
    }

    .coach-panel__send[disabled],
    .coach-panel__send.disabled {
      opacity: 0.45;
    }

    .coach-panel__send .paper-btn__icon {
      font-size: 20px;
      margin: 0;
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
      background: #7A6F5E;
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

    /* Animations */
    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes typingPulse {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .coach-panel {
        width: 100%;
        height: 100dvh;
      }

      .coach-message__bubble {
        max-width: calc(100% - 60px);
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
      background: rgba(58, 50, 41, 0.05);
      border-radius: 10px;
    }

    .coach-panel__messages::-webkit-scrollbar-thumb {
      background: rgba(58, 50, 41, 0.25);
      border-radius: 10px;
    }

    .coach-panel__messages::-webkit-scrollbar-thumb:hover {
      background: rgba(58, 50, 41, 0.4);
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
   * Pixel offset to slide the panel left by, so it doesn't visually pile up
   * on top of `ArchetypeDetailCardComponent` (also fixed top:0; right:0;
   * width: 480px). Set to 480 (or your detail-card width) when both are open.
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
