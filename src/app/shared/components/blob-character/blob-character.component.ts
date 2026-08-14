import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blob-character',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="blob-wrapper"
      [ngClass]="[
        'size-' + size,
        'blob--' + size,
        animate && mood !== 'excited' && mood !== 'thinking' ? 'animate' : '',
        animate && mood === 'excited' ? 'blob--bounce' : '',
        animate && mood === 'thinking' ? 'blob--tilt' : '',
        noHover ? 'no-hover' : ''
      ]">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="blob-svg" role="img" [attr.aria-label]="name || null" [attr.aria-hidden]="name ? null : 'true'" [style.filter]="'drop-shadow(0 6px 12px rgba(74, 62, 53, 0.2))'">
        <!-- Body -->
        <path d="M 30,85 C 10,85 10,40 30,30 C 45,20 55,20 70,30 C 90,40 90,85 70,85 C 60,85 50,88 40,85 Z" 
              [attr.fill]="color" stroke="var(--ink-main)" stroke-width="3" stroke-linejoin="round"/>
        <!-- Left Arm -->
        <path d="M 23,55 Q 12,50 15,42" fill="none" stroke="var(--ink-main)" stroke-width="3" stroke-linecap="round"/>
        <!-- Right Arm -->
        <path d="M 77,55 Q 88,50 85,42" fill="none" stroke="var(--ink-main)" stroke-width="3" stroke-linecap="round"/>
        <!-- Left Leg -->
        <path d="M 35,85 V 93 Q 35,96 38,96 L 42,96" fill="none" stroke="var(--ink-main)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Right Leg -->
        <path d="M 65,85 V 93 Q 65,96 62,96 L 58,96" fill="none" stroke="var(--ink-main)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Eyes -->
        <circle cx="42" cy="46" r="3" fill="var(--ink-main)"/>
        <circle cx="58" cy="46" r="3" fill="var(--ink-main)"/>
        <!-- Mouth -->
        <path [attr.d]="mouthPath" [attr.fill]="mouthFill" stroke="var(--ink-main)" [attr.stroke-width]="mouthFill === 'none' ? 3 : 2" stroke-linecap="round"/>
        <!-- Cheek blush -->
        <ellipse cx="34" cy="52" rx="4" ry="2" fill="rgba(244, 162, 97, 0.35)" />
        <ellipse cx="66" cy="52" rx="4" ry="2" fill="rgba(244, 162, 97, 0.35)" />
      </svg>
      @if(name) {
        <div class="node-label">{{ name }}</div>
      }
    </div>
  `,
  styles: [`
    .blob-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s;
    }
    .blob-wrapper:hover:not(.no-hover) {
      transform: scale(1.1) translateY(-2px);
    }
    .blob-wrapper:hover:not(.no-hover) .blob-svg {
      filter: drop-shadow(0 12px 24px rgba(74, 62, 53, 0.3)) !important;
    }
    .blob-svg {
      width: 100%;
      height: 100%;
      transition: filter 0.2s;
    }
    .size-sm { width: 40px; height: 40px; }
    .size-md { width: 80px; height: 80px; }
    .size-lg { width: 120px; height: 120px; }
    .size-xl { width: 160px; height: 160px; }
    
    .node-label {
      margin-top: 8px;
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 700;
      background: rgba(253, 251, 246, 0.8);
      border: var(--border-soft);
      border-radius: 8px;
      padding: 2px 10px;
      backdrop-filter: blur(4px);
    }
    
    .blob-wrapper.animate .blob-svg {
      animation: blob-bob 3s ease-in-out infinite;
    }

    .blob-wrapper.blob--bounce .blob-svg {
      animation: blob-bounce 2.6s ease-in-out infinite;
    }

    .blob-wrapper.blob--tilt .blob-svg {
      animation: blob-blob-tilt 3.2s ease-in-out infinite;
    }
  `],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlobCharacterComponent {
  @Input() color = '#4a3e35';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  private _mood: 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking' | 'magic' = 'neutral';
  @Input() set mood(value: 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking' | 'magic') {
    this._mood = value;
    this.updateMouth();
  }
  get mood() {
    return this._mood;
  }
  @Input() name?: string;
  @Input() animate = true;
  @Input() noHover = false;

  mouthPath = 'M 45,55 Q 50,60 55,55';
  mouthFill = 'none';

  constructor() {
    this.updateMouth();
  }

  private updateMouth(): void {
    switch (this.mood) {
      case 'happy':
        this.mouthPath = 'M 44,53 Q 50,64 56,53 Z';
        this.mouthFill = 'var(--ink-main)';
        break;
      case 'sad':
        this.mouthPath = 'M 46,57 Q 50,54 54,57';
        this.mouthFill = 'none';
        break;
      case 'excited':
        this.mouthPath = 'M 43,52 Q 50,66 57,52 Z';
        this.mouthFill = 'var(--ink-main)';
        break;
      case 'thinking':
        this.mouthPath = 'M 46,55 Q 50,54 54,55';
        this.mouthFill = 'none';
        break;
      case 'magic':
        this.mouthPath = 'M 45,53 Q 50,58 55,53';
        this.mouthFill = 'none';
        break;
      default:
        this.mouthPath = 'M 45,55 Q 50,60 55,55';
        this.mouthFill = 'none';
    }
  }
}
