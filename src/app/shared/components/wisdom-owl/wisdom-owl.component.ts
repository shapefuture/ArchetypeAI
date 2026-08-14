import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../services/translation.service';

@Component({
  selector: 'app-wisdom-owl',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="wisdom-owl-wrapper"
      [ngClass]="[
        'wisdom-owl--' + size,
        mood === 'thinking' ? 'wisdom-owl--thinking' : '',
        mood === 'excited' ? 'wisdom-owl--excited' : ''
      ]">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" [attr.aria-label]="translationService.t('aiCoach', 'universe')" role="img">
        <!-- Wisdom Glow -->
        <defs>
          <radialGradient id="wisdomGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#f9c74f;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#f9c74f;stop-opacity:0" />
          </radialGradient>
        </defs>

        <!-- Background Glow -->
        <circle cx="50" cy="50" r="45" fill="url(#wisdomGlow)" class="wisdom-glow"/>

        <!-- Body -->
        <ellipse
          cx="50"
          cy="55"
          rx="30"
          ry="35"
          [attr.fill]="bodyColor"
          stroke="var(--ink-main)"
          stroke-width="2.5"
          stroke-linejoin="round"
        />

        <!-- Chest Details -->
        <ellipse cx="50" cy="65" rx="15" ry="18" [attr.fill]="chestColor" opacity="0.6"/>

        <!-- Wings -->
        <path
          d="M 22,50 Q 10,45 15,35 Q 20,40 25,50"
          [attr.fill]="wingColor"
          stroke="var(--ink-main)"
          stroke-width="2"
          stroke-linejoin="round"
          class="wing wing--left"
        />
        <path
          d="M 78,50 Q 90,45 85,35 Q 80,40 75,50"
          [attr.fill]="wingColor"
          stroke="var(--ink-main)"
          stroke-width="2"
          stroke-linejoin="round"
          class="wing wing--right"
        />

        <!-- Head -->
        <circle
          cx="50"
          cy="32"
          r="22"
          [attr.fill]="bodyColor"
          stroke="var(--ink-main)"
          stroke-width="2.5"
        />

        <!-- Ear Tufts -->
        <path d="M 32,18 Q 28,8 35,15" [attr.fill]="bodyColor" stroke="var(--ink-main)" stroke-width="2" stroke-linejoin="round"/>
        <path d="M 68,18 Q 72,8 65,15" [attr.fill]="bodyColor" stroke="var(--ink-main)" stroke-width="2" stroke-linejoin="round"/>

        <!-- Eye Circles (facial disc) -->
        <ellipse cx="40" cy="30" rx="10" ry="12" [attr.fill]="facialDiscColor" stroke="var(--ink-main)" stroke-width="1.5"/>
        <ellipse cx="60" cy="30" rx="10" ry="12" [attr.fill]="facialDiscColor" stroke="var(--ink-main)" stroke-width="1.5"/>

        <!-- Eyes (mood-based) -->
        <g class="eyes">
          <!-- Left Eye -->
          @switch (mood) {
            @case ('happy') {
              <circle cx="40" cy="30" r="5" fill="var(--ink-main)"/>
            }
            @case ('excited') {
              <circle cx="40" cy="30" r="6" fill="var(--ink-main)"/>
            }
            @case ('thinking') {
              <g>
                <circle cx="40" cy="30" r="5" fill="var(--ink-main)"/>
                <path d="M 36,26 Q 40,24 44,26" fill="none" stroke="var(--ink-main)" stroke-width="1.5"/>
              </g>
            }
            @default {
              <circle cx="40" cy="30" r="5" fill="var(--ink-main)"/>
            }
          }

          <!-- Right Eye -->
          @switch (mood) {
            @case ('happy') {
              <circle cx="60" cy="30" r="5" fill="var(--ink-main)"/>
            }
            @case ('excited') {
              <circle cx="60" cy="30" r="6" fill="var(--ink-main)"/>
            }
            @case ('thinking') {
              <g>
                <circle cx="60" cy="30" r="5" fill="var(--ink-main)"/>
                <path d="M 56,26 Q 60,24 64,26" fill="none" stroke="var(--ink-main)" stroke-width="1.5"/>
              </g>
            }
            @default {
              <circle cx="60" cy="30" r="5" fill="var(--ink-main)"/>
            }
          }

          <!-- Eye Highlights -->
          <circle cx="38" cy="28" r="2" fill="white" opacity="0.8" class="eye-highlight"/>
          <circle cx="58" cy="28" r="2" fill="white" opacity="0.8" class="eye-highlight"/>
        </g>

        <!-- Beak -->
        <path
          d="M 47,35 L 50,42 L 53,35 Z"
          fill="var(--accent-orange)"
          stroke="var(--ink-main)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />

        <!-- Wisdom Sparkles (when excited) -->
        @if (mood === 'excited') {
          <g class="sparkles">
            <text x="25" y="15" font-size="8" fill="#f9c74f">✦</text>
            <text x="70" y="20" font-size="6" fill="#f9c74f">✦</text>
            <text x="30" y="80" font-size="7" fill="#f9c74f">✦</text>
          </g>
        }

        <!-- Blush -->
        <ellipse cx="32" cy="38" rx="4" ry="2" fill="rgba(244, 162, 97, 0.4)" class="blush"/>
        <ellipse cx="68" cy="38" rx="4" ry="2" fill="rgba(244, 162, 97, 0.4)" class="blush"/>

        <!-- Feet -->
        <path d="M 40,88 L 38,95 M 40,88 L 42,95 M 40,88 L 40,95" stroke="var(--ink-main)" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M 60,88 L 58,95 M 60,88 L 62,95 M 60,88 L 60,95" stroke="var(--ink-main)" stroke-width="2" stroke-linecap="round" fill="none"/>
      </svg>
    </div>
  `,
  styles: [`
    .wisdom-owl-wrapper {
      display: inline-block;
      filter: drop-shadow(0 4px 8px rgba(74, 62, 53, 0.15));
      animation: wisdom-bob 3s ease-in-out infinite;
      line-height: 0;
    }

    .wisdom-owl--sm svg { width: 32px; height: 32px; }
    .wisdom-owl--md svg { width: 48px; height: 48px; }
    .wisdom-owl--lg svg { width: 64px; height: 64px; }
    .wisdom-owl--xl svg { width: 96px; height: 96px; }

    .wisdom-glow {
      animation: glow-pulse 2s ease-in-out infinite;
    }

    .wisdom-owl--thinking {
      animation: wisdom-tilt 2s ease-in-out infinite;
    }

    .wisdom-owl--excited {
      animation: wisdom-bounce 0.6s ease-in-out infinite;
    }

    .wing {
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    .wisdom-owl--excited .wing--left {
      animation: wing-flap-left 0.3s ease-in-out infinite;
    }

    .wisdom-owl--excited .wing--right {
      animation: wing-flap-right 0.3s ease-in-out infinite;
    }

    .eye-highlight {
      animation: twinkle 2s ease-in-out infinite;
    }

    .sparkles text {
      animation: sparkle-fade 1.5s ease-in-out infinite;
    }

    .sparkles text:nth-child(2) {
      animation-delay: 0.3s;
    }

    .sparkles text:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes wisdom-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes wisdom-tilt {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(2deg); }
      75% { transform: rotate(-2deg); }
    }

    @keyframes wisdom-bounce {
      0%, 100% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.08) translateY(-6px); }
    }

    @keyframes glow-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    @keyframes wing-flap-left {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-10deg); }
    }

    @keyframes wing-flap-right {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(10deg); }
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }

    @keyframes sparkle-fade {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    @media (prefers-reduced-motion: reduce) {
      .wisdom-owl-wrapper { animation: none; }
      .wisdom-owl--thinking, .wisdom-owl--excited { animation: none; }
      .wing { animation: none; }
      .eye-highlight { animation: none; }
      .sparkles text { animation: none; }
      .wisdom-glow { animation: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WisdomOwlComponent {
  public translationService = inject(TranslationService);
  @Input() bodyColor = '#70a1d7';
  @Input() chestColor = '#8bb8e0';
  @Input() wingColor = '#5a8bc7';
  @Input() facialDiscColor = '#e8d5a3';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() mood: 'neutral' | 'happy' | 'excited' | 'thinking' = 'neutral';
  @Input() ariaLabel = '';
}
