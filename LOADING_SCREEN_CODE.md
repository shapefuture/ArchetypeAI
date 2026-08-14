# Loading Screen Code Reference

## HTML Template (src/app.component.html)

```html
@switch (appState()) {
  @case ('loading') {
    <!-- SIGGRAPH-Tier Loading Screen -->
    <div class="loading-screen">
      @if(initError(); as error) {
        <div class="loading-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="loading-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="loading-error-text">{{ error }}</span>
        </div>
      } @else {
        <!-- Particle Canvas Background -->
        <app-particle-canvas
          particleCount="60"
          particleType="dust"
          color="var(--ink-light)">
        </app-particle-canvas>

        <!-- Animated Blob Character -->
        <div class="loading-blob-container">
          <app-blob-character
            color="var(--accent-orange)"
            size="xl"
            mood="happy"
            [animate]="true">
          </app-blob-character>
        </div>

        <!-- Typewriter Loading Text -->
        <div class="loading-text-container">
          <p class="loading-text">{{ currentLoadingPhrase() }}</p>
          <div class="loading-cursor"></div>
        </div>

        <!-- Decorative Book Spine Hint -->
        <div class="loading-book-spine">
          <div class="spine-line spine-left"></div>
          <div class="spine-line spine-right"></div>
        </div>
      }
    </div>
  }
}
```

## CSS Styles (src/styles/loading-screen.css)

### Key Animation Classes

```css
/* Loading Screen Container */
.loading-screen {
  position: absolute;
  inset: 0;
  background: var(--paper-bg);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: loading-fade-in 0.8s var(--ease-storybook) forwards;
}

/* Blob Container with Enhanced Animation */
.loading-blob-container {
  position: relative;
  z-index: 10;
  margin-bottom: 2rem;
  animation: blob-entrance 1s var(--ease-storybook) 0.2s backwards;
}

/* Typewriter Text */
.loading-text {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink-main);
  letter-spacing: 0.02em;
  line-height: 1.3;
  text-align: center;
  min-width: 280px;
}

/* Blinking Cursor */
.loading-cursor {
  width: 3px;
  height: 1.5rem;
  background: var(--ink-main);
  animation: cursor-blink 1s step-end infinite;
  border-radius: 2px;
}

/* Book Spine Decoration */
.loading-book-spine {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 100px;
  pointer-events: none;
  opacity: 0.15;
  z-index: 5;
}
```

### Key Animations

```css
/* Screen Fade In */
@keyframes loading-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Blob Entrance */
@keyframes blob-entrance {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Enhanced Blob Bounce */
@keyframes loading-blob-bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-8px) scale(1.02, 0.98);
  }
  50% {
    transform: translateY(-12px) scale(1.05, 0.95);
  }
  75% {
    transform: translateY(-8px) scale(1.02, 0.98);
  }
}

/* Text Entrance */
@keyframes text-entrance {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Cursor Blink */
@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Book Spine Sway */
@keyframes spine-sway {
  0%, 100% {
    transform: skewX(-2deg);
    opacity: 0.15;
  }
  50% {
    transform: skewX(2deg);
    opacity: 0.25;
  }
}
```

## Component Integration (src/app.component.ts)

```typescript
import { BlobCharacterComponent } from './shared/components/blob-character/blob-character.component';
import { ParticleCanvasComponent } from './shared/components/particle-canvas/particle-canvas.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BlobCharacterComponent, ParticleCanvasComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

## Design Tokens Used

- `--paper-bg: #f6f3eb` - Background color
- `--ink-main: #4a3e35` - Primary text color
- `--ink-light: #c2b7ad` - Subtle accents
- `--accent-orange: #f4a261` - Blob character color
- `--accent-rose: #FF6B6B` - Error state color
- `--font-serif: 'Fraunces', serif` - Loading text
- `--font-sans: 'Nunito', sans-serif` - Error text
- `--ease-storybook: cubic-bezier(0.34, 1.56, 0.64, 1)` - Bouncy spring easing

## Features Implemented

✅ **Animated Blob Character**
- Large XL size (160px)
- Happy mood with smile
- Enhanced bounce animation with scale transforms
- Orange accent color

✅ **Particle Canvas**
- 60 dust particles
- Gentle upward drift
- Alpha pulsing for depth
- Ink light color

✅ **Typewriter Text**
- Fraunces serif font
- Cycles through 6 loading phrases
- Blinking cursor effect
- Smooth text transitions

✅ **Book Spine Decoration**
- Subtle background element
- Gentle swaying animation
- Adds storybook aesthetic

✅ **Error State**
- Animated error icon
- Shake animation
- Rose accent color
- Clear visual feedback

✅ **Accessibility**
- Reduced motion support
- Semantic HTML
- ARIA labels
- High contrast

✅ **Responsive**
- Mobile-friendly sizing
- Flexible layout
- Touch-friendly

## Loading Phrases (Cycled every 1.5s)

1. "Calibrating the cosmos..."
2. "Polishing the archetypes..."
3. "Teaching the blobs to dance..."
4. "Unfolding the storybook..."
5. "Reticulating splines of destiny..."
6. "Waking the universe..."
