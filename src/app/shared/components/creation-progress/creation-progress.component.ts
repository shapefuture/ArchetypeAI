import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlobCharacterComponent } from '../blob-character/blob-character.component';

@Component({
  selector: 'app-creation-progress',
  standalone: true,
  imports: [CommonModule, BlobCharacterComponent],
  template: `
    <div class="creation-scene">
      <div class="summoning-circle crystal-ball" aria-hidden="true">
        <svg viewBox="0 0 200 200" class="summoning-svg">
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--ink-light)" stroke-width="2" stroke-dasharray="10 5" class="spin-slow" />
          <circle cx="100" cy="100" r="75" fill="none" stroke="var(--ink-main)" stroke-width="3" class="ink-draw spin-reverse" />
          <path d="M 100 10 L 100 25 M 100 175 L 100 190 M 10 100 L 25 100 M 175 100 L 190 100" stroke="var(--accent-blue)" stroke-width="2" />
        </svg>
        <div class="summon-character">
          <app-blob-character mood="magic" color="#70a1d7" size="lg" [animate]="true"></app-blob-character>
        </div>
      </div>
      <p class="creation-text">{{ message }}</p>
      <canvas class="creation-sparkles" #sparkleCanvas></canvas>
    </div>
  `,
  styles: [`
    .creation-scene {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      position: relative;
      padding: 40px 20px;
    }

    .summoning-circle {
      width: 160px;
      height: 160px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summoning-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      animation: pulse-glow 3s ease-in-out infinite;
    }

    .summon-character {
      position: relative;
      z-index: 2;
      animation: emerge 2s var(--ease-storybook) forwards;
    }

    .spin-slow {
      transform-origin: center;
      animation: storybook-spin 20s linear infinite;
    }

    .spin-reverse {
      transform-origin: center;
      animation: storybook-spin 15s linear infinite reverse;
    }

    .ink-draw {
      stroke-dasharray: 471;
      stroke-dashoffset: 471;
      animation: ink-draw-anim 3s var(--ease-storybook) forwards, storybook-spin 15s linear infinite reverse;
    }

    .creation-text {
      font-family: var(--font-serif);
      font-size: 18px;
      color: var(--ink-main);
      margin-top: 24px;
      animation: text-glow 2s ease-in-out infinite;
      text-align: center;
    }

    .creation-sparkles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      width: 100%;
      height: 100%;
    }

    @keyframes ink-draw-anim {
      to { stroke-dashoffset: 0; }
    }

    @keyframes emerge {
      0% { opacity: 0; transform: scale(0.5) translateY(20px); filter: blur(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }

    @keyframes pulse-glow {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(112, 161, 215, 0.4)); }
      50% { filter: drop-shadow(0 0 16px rgba(112, 161, 215, 0.8)); }
    }

    @keyframes text-glow {
      0%, 100% { text-shadow: 0 0 4px transparent; }
      50% { text-shadow: 0 0 8px rgba(112, 161, 215, 0.4); }
    }

    @keyframes storybook-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .summoning-svg, .summon-character, .spin-slow, .spin-reverse, .ink-draw, .creation-text {
        animation: none !important;
        opacity: 1;
        stroke-dashoffset: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationProgressComponent {
  @Input() message = 'Analyzing your relational patterns...';
}
