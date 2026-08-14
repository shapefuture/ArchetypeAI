# 🎨 SIGGRAPH-TIER DESIGN OVERHAUL PLAN
## Archetypal Relational Universe: From 1/10 to 10/10

> **STATUS**: COMPLETE DESIGN SPEC - READY FOR IMPLEMENTATION
> **TARGET**: Ghibli/Storybook aesthetic with SIGGRAPH-tier animations
> **SCOPE**: Complete visual overhaul - no incremental changes

## IMPLEMENTATION PROGRESS

- [x] Normalize leaf component input contracts and fix bad `ariaLabel` decorators.
- [x] Flatten jsdom-hostile nested CSS in shared button/panel components.
- [x] Add AI availability fallbacks and clearer service errors.
- [x] Convert the root shell and side panels to dynamic viewport sizing for mobile.
- [x] Remove debug upload logging and add reduced-motion defaults.
- [x] Rewire coach auto-scroll to follow message updates.
- [x] Re-run the full Vitest suite and clean up any remaining spec mismatches.
- [x] Normalize health scoring to the answered 1..5 baseline.
- [x] Unify directional pole semantics across scoring, diagnostics, and synastry.
- [x] Add regression coverage for shutdown, disorganization, rigid boundaries, and pursue-withdraw order.
- [x] Fix dark-section contrast drift across Synergy Matrix, Codex, engine HUD, and footer CTA sections.
- [x] Rewire landing scroll-reveal to the real component scroll root and add section-level ambient motion.
- [x] Upgrade the intro loading screen and help modal backdrop to match the premium visual system.
- [x] Ship global styles through the Angular production bundle and inline critical loader CSS to prevent unstyled first paint.

---

## 📋 TABLE OF CONTENTS

1. [Current State Analysis](#current-state-analysis)
2. [Design Vision](#design-vision)
3. [Complete Design System](#complete-design-system)
4. [Screen-by-Screen Specifications](#screen-by-screen-specifications)
5. [Component Library](#component-library)
6. [Animation System](#animation-system)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Hardcoded Decisions Reference](#hardcoded-decisions-reference)

---

## 🔍 CURRENT STATE ANALYSIS

### What We Have (1/10)
```
❌ Generic Tailwind grays everywhere
❌ Flat, corporate "Zen Garden" theme
❌ No illustrations, no personality
❌ Standard spinner loading
❌ Boring form inputs
❌ No particle effects
❌ No ambient animations
❌ ChatGPT-like coach interface
❌ Basic Three.js spheres for archetypes
❌ No texture, no warmth, no soul
```

### What We Want (10/10)
```
✅ Warm paper/canvas aesthetic
✅ Hand-drawn blob characters with personalities
✅ Procedural SVG illustrations for each archetype
✅ Dust particles, fireflies, leaves
✅ Sketchy/hand-drawn borders
✅ Card-stack detail panels with ribbons
✅ 3D diorama with islands and clouds
✅ Storybook typography (Fraunces + Nunito)
✅ Bouncy spring animations
✅ Living paper texture overlay
✅ Quirky, illustrated UI elements
✅ SIGGRAPH-tier transitions and reveals
```

---

## 🎯 DESIGN VISION

### Core Aesthetic: "The Cosmic Storybook"

```
Imagine a universe that lives inside an enchanted storybook.
Each archetype is a quirky blob character floating in a 3D diorama.
The interface feels like turning pages of a cosmic journal.
Everything breathes, bounces, and has personality.
```

### Three Design Pillars

1. **PAPER & WARMTH** - Cream/beige canvas, subtle grain, ink-like strokes
2. **CHARACTER & PERSONALITY** - Each archetype has a unique illustrated blob with expressions
3. **MOTION & LIFE** - Nothing is static - dust floats, blobs breathe, cards stack with physics

---

## 🎨 COMPLETE DESIGN SYSTEM

### 1. COLOR PALETTE (Exact Hex Values)

```css
/* === PAPER WARM PALETTE === */
--paper-bg: #f6f3eb;              /* Main canvas - cream */
--paper-panel: #fdfbf6;           /* Card panels - lighter cream */
--paper-viewport-top: #a7c5d2;    /* Sky gradient start */
--paper-viewport-bot: #eaddd0;    /* Sky gradient end */

/* === INK & TEXT === */
--ink-main: #4a3e35;              /* Primary text - warm brown */
--ink-muted: #8b7d72;             /* Secondary text - taupe */
--ink-light: #c2b7ad;             /* Tertiary text - light taupe */

/* === ACCENT COLORS (for dimensions) === */
--accent-blue: #70a1d7;           /* Agency - soft blue */
--accent-orange: #f4a261;         /* Temperature - warm orange */
--accent-green: #90be6d;          /* Focus - sage green */
--accent-yellow: #f9c74f;         /* Attachment - golden yellow */

/* === CLUSTER COLORS === */
--cluster-control: #6A040F;       /* Control shadows - deep red */
--cluster-storm: #9D0208;         /* Storm shadows - volcanic red */
--cluster-avoidant: #4CC9F0;      /* Avoidant - cool blue */
--cluster-anxious: #FF5D8F;       /* Anxious - pink */
--cluster-seductive: #FF006E;     /* Seductive - magenta */
--cluster-gift: #38B000;          /* Gifts - forest green */
```

### 2. TYPOGRAPHY (Exact Font Stack)

```css
/* === FONT IMPORT (add to index.html head) === */
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400&family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

/* === FONT VARIABLES === */
--font-serif: 'Fraunces', serif;     /* Headings, display */
--font-sans: 'Nunito', sans-serif;    /* Body, UI */

/* === TYPOGRAPHY SCALE === */
/* Headers: Fraunces */
.text-hero { font-family: var(--font-serif); font-size: 48px; font-weight: 700; letter-spacing: -0.5px; }
.text-h1 { font-family: var(--font-serif); font-size: 36px; font-weight: 700; letter-spacing: -0.3px; }
.text-h2 { font-family: var(--font-serif); font-size: 28px; font-weight: 600; letter-spacing: -0.2px; }
.text-h3 { font-family: var(--font-serif); font-size: 22px; font-weight: 600; }

/* Body: Nunito */
.text-body { font-family: var(--font-sans); font-size: 16px; font-weight: 500; line-height: 1.6; }
.text-small { font-family: var(--font-sans); font-size: 14px; font-weight: 600; }
.text-tiny { font-family: var(--font-sans); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
```

### 3. BORDER & SHADOW SYSTEM

```css
/* === SKETCHY BORDERS === */
/* Two variants - choose based on context */

/* Classic sketchy (most cards, buttons) */
--border-sketchy: 2px solid var(--ink-main);
--radius-sketchy: 255px 15px 225px 15px / 15px 225px 15px 255px;

/* Soft rounded (panels, containers) */
--border-soft: 2px solid var(--ink-main);
--radius-soft: 16px;

/* === SHADOW SYSTEM === */

/* Floating elements (cards, dropdowns) */
--shadow-float: 0 12px 24px rgba(74, 62, 53, 0.15);

/* Stacked paper effect (multi-layer cards) */
--shadow-card: 4px 4px 0 rgba(200, 190, 180, 0.5), 8px 8px 0 rgba(180, 170, 160, 0.3);

/* Blob character shadows */
--shadow-blob: drop-shadow(0 6px 12px rgba(74, 62, 53, 0.2));
--shadow-blob-hover: drop-shadow(0 12px 24px rgba(74, 62, 53, 0.3));

/* Pressed state */
--shadow-pressed: inset 0 2px 4px rgba(74, 62, 53, 0.1);
```

### 4. ANIMATION CURVES

```css
/* === EASING FUNCTIONS === */

/* Quantum bounce - for UI reveals, springs */
--ease-quantum: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Relational flow - for smooth transitions */
--ease-relational: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Storybook pop - for cards, buttons */
--ease-storybook: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Duration standards */
--duration-instant: 150ms;
--duration-quick: 300ms;
--duration-standard: 500ms;
--duration-slow: 800ms;
--duration-cinematic: 1200ms;
```

### 5. TEXTURE SYSTEM

```css
/* === PAPER TEXTURE OVERLAY === */
/* Add to body as fixed overlay */

.texture-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999;
    opacity: 0.3;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
```

---

## 📱 SCREEN-BY-SCREEN SPECIFICATIONS

### SCREEN 1: LOADING SCREEN

**Current**: Boring spinner on gray
**Target**: Animated storybook reveal with character

```typescript
// === FILE: src/app/features/loading/loading.component.ts ===

// SPECIFICATION:
// 1. Background: --paper-bg (#f6f3eb)
// 2. Center element: Large animated blob character (SVG)
// 3. Animation: Character bounces gently, dust particles float
// 4. Loading text cycles through phrases with typewriter effect
// 5. Transition: When complete, book "closes" and transitions to intro

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │                                     │
// │         [Animated Blob]             │
// │         (bouncing gently)           │
// │                                     │
// │      "Calibrating the cosmos..."    │
// │      (typewriter effect)            │
// │                                     │
// │      [Dust particles floating]      │
// │                                     │
// └─────────────────────────────────────┘

// IMPLEMENTATION CHECKLIST:
// [ ] Create blob SVG with 3-part animation (body bounce, arm wave, eye blink)
// [ ] Add dust canvas with 60 particles, random drift
// [ ] Implement typewriter text cycler
// [ ] Add book-close transition animation
// [ ] Use Fraunces for loading text

// LOADING PHRASES (cycle through):
const LOADING_PHRASES = [
    "Calibrating the cosmos...",
    "Polishing the archetypes...",
    "Teaching the blobs to dance...",
    "Unfolding the storybook...",
    "Reticulating splines of destiny...",
    "Waking the universe..."
];
```

---

### SCREEN 2: INTRO SCREEN

**Current**: Two generic glass cards
**Target**: Illustrated storybook spread with animated elements

```typescript
// === FILE: src/app/features/intro/intro.component.html ===

// SPECIFICATION:
// 1. Background: --paper-bg with subtle gradient
// 2. Layout: Centered storybook spread
// 3. Hero: Large illustrated emblem at top
// 4. Title: "Discover Your Inner Universe" (Fraunces 48px)
// 5. Subtitle: Warm, inviting text (Nunito 16px)
// 6. Two illustrated cards with hover effects

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │                                     │
// │         ✿ [Emblem]                 │
// │                                     │
// │    Discover Your Inner Universe    │
// │    Explore the cosmic map of...     │
// │                                     │
// │   ┌─────────────┐  ┌─────────────┐ │
// │   │  ⚡ Explore │  │  📝 Take    │ │
// │   │  [illustr.] │  │  [illustr.] │ │
// │   │  the        │  │  the        │ │
// │   │  Universe   │  │  Assessment │ │
// │   └─────────────┘  └─────────────┘ │
// │                                     │
// │   [Decorative blobs floating]       │
// └─────────────────────────────────────┘

// CARD SPECIFICATIONS:
// Each card should have:
// - Background: --paper-panel (#fdfbf6)
// - Border: --border-sketchy
// - Shadow: --shadow-card (stacked effect)
// - Icon: Large emoji (72px) with subtle animation
// - Hover: Scale up 1.05, shadow deepens
// - Active: Quick spring animation (--ease-storybook)

// IMPLEMENTATION CHECKLIST:
// [ ] Create illustrated emblem SVG (cosmic flower/moon design)
// [ ] Build two storybook cards with sketchy borders
// [ ] Add floating blob decorations (3-4 small blobs)
// [ ] Implement hover spring animations
// [ ] Add subtle grain texture to cards
// [ ] Typography: Fraunces for title, Nunito for body
```

---

### SCREEN 3: ASSESSMENT SCREEN

**Current**: Boring form with radio buttons
**Target**: Storybook question cards with character host

```typescript
// === FILE: src/app/features/assessment/assessment.component.html ===

// SPECIFICATION:
// 1. Background: --paper-bg
// 2. Layout: Centered card with character host
// 3. Left side: Friendly blob character (reacts to answers)
// 4. Center: Question in storybook frame
// 5. Bottom: 5 illustrated answer buttons
// 6. Progress: Hand-drawn progress bar at top

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │  ← Back      [======....] 85%       │
// │                                     │
// │      [Blob Character]               │
// │      (watching, reacts)             │
// │                                     │
// │   ┌───────────────────────────┐     │
// │   │ 📖 Agency Spectrum        │     │
// │   │                           │     │
// │   │ "I naturally take charge  │     │
// │   │  in group situations"     │     │
// │   │                           │     │
// │   │  [1] [2] [3] [4] [5]      │     │
// │   │   ↓   ↓   ↓   ↓   ↓       │     │
// │   │  😐  🫤  😐  🙂  😄        │     │
// │   └───────────────────────────┘     │
// │                                     │
// │      ← Previous    Cancel          │
// └─────────────────────────────────────┘

// CHARACTER HOST SPECIFICATIONS:
// - Base blob: 120x120px SVG
// - Expressions (5 states):
//   * curious: eyes wide, slight smile
//   * thinking: one eye squint, hand on chin
//   * happy: big smile, both eyes open
//   * excited: open mouth, arms up
//   - Idle animation: gentle float/bob every 2s
//   - Reaction animation: quick bounce on answer click

// ANSWER BUTTONS SPECIFICATIONS:
// - Size: 48x48px circular
// - Border: --border-sketchy (adapted to circle)
// - States:
//   * Default: Cream background, sketchy border
//   * Hover: Scale 1.1, shadow deepens
//   * Selected: Accent color background, emoji appears
// - Transition: --ease-storybook spring

// PROGRESS BAR SPECIFICATIONS:
// - Style: Hand-drawn path (SVG)
// - Fill: Animated with "stroke-dashoffset" trick
// - Color: --accent-blue (Agency), --accent-orange (Temperature), etc.
// - Label: Current section name (e.g., "Agency Spectrum")

// IMPLEMENTATION CHECKLIST:
// [ ] Create character blob with 5 expression states
// [ ] Build storybook question card frame
// [ ] Create 5 illustrated answer buttons
// [ ] Implement hand-drawn progress bar SVG
// [ ] Add character reaction animations
// [ ] Section-based color theming
```

---

### SCREEN 4: ASSESSMENT RESULTS

**Current**: Generic markdown text
**Target**: Illustrated storybook spread with pantheon cards

```typescript
// === FILE: src/app/features/assessment/results/results.component.html ===

// SPECIFICATION:
// 1. Background: --paper-bg
// 2. Layout: Two-column storybook spread
// 3. Left: Illustrated analysis text (storybook paper)
// 4. Right: Generated archetype cards in stack
// 5. Bottom: "View My Universe" illustrated button
// 6. Loading: Character blob with magnifying glass animation

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │  Your Relational Fingerprint        │
// │                                     │
// │  ┌─────────────────┐ ┌─────────────┐│
// │  │ [Analysis]      │ │ [Pantheon]  ││
// │  │                 │ │             ││
// │  │ Based on your  │ │  ┌─────────┐││
// │  │ answers, you   │ │  │ [Card1] │││
// │  │ embody...      │ │  │ The X   │││
// │  │                 │ │  └─────────┘││
// │  │ ### Core       │ │  ┌─────────┐││
// │  │ Dynamic        │ │  │ [Card2] │││
// │  │                 │ │  │ The Y   │││
// │  │ [storybook     │ │  └─────────┘││
// │  │  styled text]  │ │  ┌─────────┐││
// │  │                 │ │  │ [Card3] │││
// │  │                 │ │  │ The Z   │││
// │  │                 │ │  └─────────┘││
// │  └─────────────────┘ └─────────────┘│
// │                                     │
// │        [View My Universe]           │
// │        (illustrated button)         │
// └─────────────────────────────────────┘

// ANALYSIS PANEL SPECIFICATIONS:
// - Background: Storybook paper texture
// - Typography: Fraunces headings, Nunito body
// - Styling: Custom prose with storybook flair
// - Illustrations: Small blob doodles in margins
// - Decorations: Section dividers with hand-drawn lines

// PANTHEON CARD STACK SPECIFICATIONS:
// - Layout: Vertical stack with slight offset
// - Each card:
//   * Hero blob: 100x100px SVG (procedurally colored)
//   * Name: Fraunces 18px bold
//   * Prominence: Animated percentage bar
//   * Description: Nunito 14px
//   * Cluster badge: Small tag with cluster color
// - Interaction: Click to expand, full card reveal
// - Animation: Stagger entrance (300ms between cards)

// "VIEW MY UNIVERSE" BUTTON SPECIFICATIONS:
// - Style: Large, prominent, illustrated
// - Background: Accent color (gradient from cluster)
// - Border: --border-sketchy
// - Icon: Rocket/spaceship emoji (animated hover)
// - Hover: Scale 1.05, slight rotation
// - Ripple: Hand-drawn starburst effect on click

// IMPLEMENTATION CHECKLIST:
// [ ] Create storybook prose styling component
// [ ] Build pantheon card stack with stagger animation
// [ ] Create illustrated CTA button
// [ ] Add margin doodle illustrations
// [ ] Implement card expand interaction
// [ ] Loading state: character with magnifying glass
```

---

### SCREEN 5: UNIVERSE VIEW (Main 3D Scene)

**Current**: Basic Three.js with colored spheres
**Target**: Full storybook diorama with illustrated characters

```typescript
// === FILE: src/app/features/universe/universe.component.html ===

// SPECIFICATION:
// 1. Three.js canvas with custom shader materials
// 2. Each archetype = illustrated blob sprite (not sphere)
// 3. Environment: Floating islands, clouds, dust particles
// 4. Connection lines: Hand-drawn dashed curves
// 5. Labels: Storybook-style floating tags
// 6. Controls: Orbit with storybook flair

// 3D SCENE COMPOSITION:
// - Camera: Perspective, positioned for storytelling angle
// - Lighting: Warm, soft (like sunlight through paper)
// - Fog: Subtle depth fog (ink wash effect)
// - Background: Gradient from --paper-viewport-top to --paper-viewport-bot

// ARCHETYPE VISUAL SPECIFICATIONS:
// Each archetype node is:
// - Base: 3D plane facing camera (billboard)
// - Content: Blob SVG (procedurally generated per archetype)
// - Size: Based on archetype.size property (0.4-1.1 scale)
// - Animation:
//   * Idle: Gentle bob up/down (sin wave, 2s period)
//   * Hover: Scale up 1.2, quick bounce
//   * Selected: Pulse glow, orbit around
// - Label: Floating below (storybook tag style)
// - Shadow: Soft blob shadow below (disc sprite)

// ENVIRONMENT PROPS:
// - Islands: 3-5 floating islands at varying depths
//   * SVG-based island sprites
//   * Gentle rotation animation
//   * Depth-based blur and opacity
// - Clouds: 6-8 floating clouds
//   * Soft white blob shapes
//   * Drift animation (slow horizontal movement)
//   * Varying sizes and opacity
// - Dust particles: 100+ particles
//   * Small white/gold specks
//   * Floating in all directions
//   * Twinkling opacity animation

// CONNECTION LINES SPECIFICATIONS:
// - Style: SVG quadratic bezier curves
// - Stroke: Dashed, --ink-main color, 1.5px
// - Animation: "Flowing dash" effect (stroke-dashoffset)
// - Cluster coloring: Lines take cluster color
// - Highlight: When archetype selected, connected lines glow

// UI OVERLAY SPECIFICATIONS:
// Top-left:
//   [✿ Archetypal Universe] ← Back
//   [Search box with storybook styling]
//   [Filters toggle button]

// Right panel (filters):
//   - Dimension sliders: Storybook style (see component spec)
//   - Cluster tags: Illustrated pill buttons
//   - AI Creation: Text area with character peeking

// Bottom:
//   - Selected archetype detail card (if any)

// IMPLEMENTATION CHECKLIST:
// [ ] Replace Three.js spheres with blob sprites
// [ ] Create environment prop sprites (islands, clouds)
// [ ] Implement dust particle system
// [ ] Add hand-drawn connection lines
// [ ] Create storybook floating labels
// [ ] Implement idle/hover/selected animations
// [ ] Add cluster-based environment theming
// [ ] Optimize for 60fps performance
```

---

### SCREEN 6: ARCHETYPE DETAIL HUD

**Current**: Generic flat panel
**Target**: Card-stack with ribbons (exactly like style.txt)

```typescript
// === FILE: src/app/features/universe/detail-hud/detail-hud.component.html ===

// SPECIFICATION:
// Recreate the card-stack design from style.txt EXACTLY:

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │  [╱] [╱] [ribbons]                  │
// │                                     │
// │         [Blob Character]            │
// │         (120x120px, animated)       │
// │                                     │
// │       The Sovereign                  │
// │       Gift Archetype                │
// │                                     │
// │  Agency:     [████████░░] 80%       │
// │  Temperature:[██████░░░░] 60%       │
// │  Focus:      [████░░░░░░] 40%       │
// │  Attachment: [██░░░░░░░░] 20%       │
// │                                     │
// │  Master of context-appropriate...   │
// │                                     │
// │  ▾ Core Belief:                     │
// │    "I am the source of my..."       │
// │                                     │
// │  ▾ Shadow:                          │
// │    Can become rigid when...         │
// │                                     │
// │  ▾ Invitation:                      │
// │    To balance clarity with...       │
// │                                     │
// │  ══════════════════════════════     │
// │  Related Archetypes                 │
// │  ┌───┐┌───┐┌───┐                    │
// │  │ 🌊││ 🎨││ 🌳│                    │
// │  │Flu││Emb││Syn│                    │
// │  └───┘└───┘└───┘                    │
// └─────────────────────────────────────┘

// LAYER STACK SPECIFICATIONS (bottom to top):
// 1. cl-2 (offset 12px, rotate 2deg): Darker, offset layer
// 2. cl-1 (offset 6px, rotate 1deg): Medium offset layer
// 3. Main: Top layer with content

// RIBBONS SPECIFICATIONS:
// - Position: Top-left, hanging down
// - Count: 2-3 ribbons per card
// - Colors: Cluster color + accent color
// - Shape: Trapezoid with pointed bottom
// - CSS: clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)

// ATTRIBUTE BARS SPECIFICATIONS:
// - Track: --ink-light background, --border-soft
// - Fill: Animated from 0 to value over 800ms
// - Color: Dimension accent color
// - Height: 12px
// - Corner radius: 6px
// - Animation: --ease-relational

// RELATED ARCHETYPE CARDS:
// - Size: 80px wide, 70px tall
// - Content: Mini blob + name
// - Border: --border-soft
// - Hover: Lift up, shadow deepens
// - Click: Navigate to that archetype

// ANIMATION SPECIFICATIONS:
// - Entrance: Slide up from bottom with spring
// - Exit: Slide down with spring
// - Bar fills: Stagger by 100ms each
// - Blob: Idle animation (gentle bounce)

// IMPLEMENTATION CHECKLIST:
// [ ] Create 3-layer card stack HTML structure
// [ ] Add ribbon elements with clip-path
// [ ] Implement animated attribute bars
// [ ] Create related archetype mini cards
// [ ] Add slide-up entrance animation
// [ ] Implement blob character with idle anim
```

---

### SCREEN 7: AI COACH PANEL

**Current**: Generic chat interface
**Target**: Storybook conversation with illustrated character

```typescript
// === FILE: src/app/features/coach/coach-panel.component.html ===

// SPECIFICATION:
// Transform the AI coach into a storybook dialogue:

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │  🧙 AI Coach                    [×] │
// │                                     │
// │  ┌─────────────────────────────┐   │
// │  │ 💬                          │   │
// │  │                             │   │
// │  │ "Welcome, seeker! I'm here │   │
// │  │  to illuminate the paths of │   │
// │  │  relational wisdom..."      │   │
// │  │                             │   │
// │  │ (wisdom owl character)      │   │
// │  └─────────────────────────────┘   │
// │                                     │
// │  ┌─────────────────────────────┐   │
// │  │ 🫵 You                      │   │
// │  │                             │   │
// │  │ "Tell me about the..."      │   │
// │  └──────────────────────────────┘   │
// │                                     │
// │  💭 Suggested questions:            │
// │  [What makes...] [How do I...]      │
// │                                     │
// │  ┌─────────────────────────────┐   │
// │  │ Ask your question...        │   │
// │  │                        [→]  │   │
// │  └─────────────────────────────┘   │
// └─────────────────────────────────────┘

// COACH CHARACTER SPECIFICATIONS:
// - Base: Wisdom owl or sage blob
// - Size: 40x40px avatar in messages
// - Expressions:
//   * Neutral: Default wisdom face
//   * Thinking: One eye closed, hand on chin
//   * Happy: Slight smile
//   * Excited: Eyes wide, small wings
// - Idle: Gentle hover/bob

// MESSAGE BUBBLE SPECIFICATIONS:
// AI messages:
// - Background: --paper-panel
// - Border: --border-sketchy
// - Alignment: Left
// - Character: Small icon next to text
// - Markdown: Storybook-styled prose

// User messages:
// - Background: Accent color (light tint)
// - Border: --border-sketchy
// - Alignment: Right
// - No character icon

// SUGGESTION CHIPS SPECIFICATIONS:
// - Style: Pill-shaped, sketchy border
// - Background: Cream with accent border
// - Hover: Scale 1.05, color tint
// - Click: Populate input, auto-send

// INPUT AREA SPECIFICATIONS:
// - Textarea: Storybook styled (no default browser styles)
// - Send button: Hand-drawn arrow icon
// - Focus: Warm glow effect
// - Placeholder: "Ask the wisdom sage..."

// IMPLEMENTATION CHECKLIST:
// [ ] Create coach character SVG with expressions
// [ ] Build storybook message bubbles
// [ ] Implement suggestion pill chips
// [ ] Style textarea with storybook flair
// [ ] Add message entrance animations
// [ ] Typing indicator: Animated dots with character
```

---

### SCREEN 8: SETTINGS/FILTERS PANEL

**Current**: Generic dropdown
**Target**: Storybook panel with custom controls (like style.txt)

```typescript
// === FILE: src/app/features/universe/filters/filters-panel.component.html ===

// SPECIFICATION:
// Recreate the sliders EXACTLY as shown in style.txt:

// VISUAL COMPOSITION:
// ┌─────────────────────────────────────┐
// │  Filters ▼                          │
// │  ┌─────────────────────────────┐   │
// │  │                             │   │
// │  │ DIMENSIONAL EXPRESSION       │   │
// │  │                             │   │
// │  │ Agency                      │   │
// │  │ 🍃 ━━━━━━○━━━━━ 🪄           │   │
// │  │                             │   │
// │  │ Temperature                 │   │
// │  │ ❄️ ━━━━━━━━○━━━ 🔥          │   │
// │  │                             │   │
// │  │ Focus                       │   │
// │  │ 👤 ━━━━━○━━━━━━ 👥          │   │
// │  │                             │   │
// │  │ Attachment                  │   │
// │  │ ⭕ ━━○━━━━━━━━━ 🔗          │   │
// │  │                             │   │
// │  │ ════════════════════════    │   │
// │  │ CLUSTERS                    │   │
// │  │ [✓] Gifts  [✓] Control      │   │
// │  │ [✓] Storm  [  ] Avoidant    │   │
// │  │                             │   │
// │  │ ════════════════════════    │   │
// │  │ AI CREATION                 │   │
// │  │ ┌─────────────────────┐     │   │
// │  │ │ Describe an archetype│     │   │
// │  │ └─────────────────────┘     │   │
// │  │                    [Create] │   │
// │  └─────────────────────────────┘   │
// └─────────────────────────────────────┘

// SLIDER SPECIFICATIONS (EXACT FROM STYLE.TXT):
```css
.slider-box {
    border: var(--panel-border);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* Background color based on dimension */
}

.slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.slider-icon {
    font-size: 16px;
}

.track {
    flex: 1;
    height: 16px;
    background: #fff;
    border: var(--panel-border);
    border-radius: 8px;
    position: relative;
    cursor: pointer;
}

.fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-right: var(--panel-border);
    border-radius: 8px 0 0 8px;
    transition: width 0.1s;
    /* Color based on dimension */
}

.thumb {
    position: absolute;
    width: 18px;
    height: 18px;
    background: #fff;
    border: var(--panel-border);
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

/* Reset button (appears when not at center) */
.reset-btn {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

// DIMENSION THEMING:
// Agency: --accent-blue (#70a1d7)
// Temperature: --accent-orange (#f4a261)
// Focus: --accent-green (#90be6d)
// Attachment: --accent-yellow (#f9c74f)

// CLUSTER CHECKBOX SPECIFICATIONS:
```css
.cluster-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    cursor: pointer;
}

.cluster-checkbox .box {
    width: 18px;
    height: 18px;
    border: var(--panel-border);
    border-radius: 6px;
    background: #fff;
    display: grid;
    place-items: center;
}

.cluster-checkbox.active .box {
    background: var(--cluster-color);
}

.cluster-checkbox .check::after {
    content: '✓';
    font-size: 12px;
    font-weight: 900;
    color: var(--ink-main);
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s;
}

.cluster-checkbox.active .check::after {
    opacity: 1;
    transform: scale(1);
}
```

// AI CREATION AREA SPECIFICATIONS:
// - Textarea: Storybook styled
// - Button: "Create" with magic wand icon
// - Character: Small blob peeking from corner

// IMPLEMENTATION CHECKLIST:
// [ ] Create slider component with exact styling
// [ ] Implement cluster checkboxes
// [ ] Add dimension-based color theming
// [ ] Create AI creation textarea
// [ ] Add reset button functionality
// [ ] Implement "living glass" glow effect
```

---

## 🧩 COMPONENT LIBRARY

All reusable components with exact specifications:

### C1: PaperButton Component

```typescript
// === FILE: src/app/shared/components/paper-button/paper-button.component.ts ===

@Component({
  selector: 'app-paper-button',
  template: `
    <button
      [class]="variant"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel">
      @if (icon) {
        <span class="icon">{{ icon }}</span>
      }
      <span class="label"><ng-content></ng-content></span>
    </button>
  `,
  styleUrls: ['./paper-button.component.scss']
})
export class PaperButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' = 'primary';
  @Input() icon?: string;
  @Input() disabled = false;
  @Input() ariaLabel = '';
}
```

```scss
// paper-button.component.scss
button {
  background: var(--paper-panel);
  border: var(--border-sketchy);
  border-radius: var(--radius-sketchy);
  padding: 12px 24px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-main);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-quick) var(--ease-storybook);

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-float);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    box-shadow: var(--shadow-pressed);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    // Default styling above
  }

  &.secondary {
    background: transparent;
    box-shadow: none;
    border-radius: var(--radius-soft);
  }

  &.accent {
    background: var(--accent-blue);
    color: white;
  }

  .icon {
    font-size: 18px;
  }
}
```

### C2: BlobCharacter Component

```typescript
// === FILE: src/app/shared/components/blob-character/blob-character.component.ts ===

@Component({
  selector: 'app-blob-character',
  template: `
    <div class="blob-wrapper" [class.size]="size" [class.mood]="mood">
      <svg [class]="svgClass" viewBox="0 0 100 100">
        <!-- Body -->
        <path
          class="blob-body"
          [attr.fill]="color"
          d="M 30,85 C 10,85 10,40 30,30 C 45,20 55,20 70,30 C 90,40 90,85 70,85 C 60,85 50,88 40,85 Z"
        />
        <!-- Arms -->
        <path class="blob-arm-left" d="M 23,55 Q 12,50 15,42" />
        <path class="blob-arm-right" d="M 77,55 Q 88,50 85,42" />
        <!-- Legs -->
        <path class="blob-leg-left" d="M 35,85 V 93 Q 35,96 38,96 L 42,96" />
        <path class="blob-leg-right" d="M 65,85 V 93 Q 65,96 62,96 L 58,96" />
        <!-- Face -->
        <circle class="blob-eye-left" cx="42" cy="46" r="3" />
        <circle class="blob-eye-right" cx="58" cy="46" r="3" />
        <ellipse class="blob-blush-left" cx="34" cy="52" rx="4" ry="2" fill="rgba(255,255,255,0.5)" />
        <ellipse class="blob-blush-right" cx="66" cy="52" rx="4" ry="2" fill="rgba(255,255,255,0.5)" />
        <!-- Mouth (changes based on mood) -->
        <path
          class="blob-mouth"
          [attr.d]="mouthPath"
          fill="none"
          stroke="var(--ink-main)"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>
  `,
  styleUrls: ['./blob-character.component.scss']
})
export class BlobCharacterComponent {
  @Input() color = '#4a3e35';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() mood: 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking' = 'neutral';
  @Input() svgClass = '';

  get mouthPath(): string {
    switch (this.mood) {
      case 'happy':
        return 'M 44,53 Q 50,64 56,53 Z'; // Open smile
      case 'sad':
        return 'M 46,57 Q 50,54 54,57'; // Frown
      case 'excited':
        return 'M 43,52 Q 50,66 57,52 Z'; // Big smile
      case 'thinking':
        return 'M 46,55 Q 50,54 54,55'; // Slight frown
      default:
        return 'M 45,55 Q 50,60 55,55'; // Neutral
    }
  }
}
```

```scss
// blob-character.component.scss
.blob-wrapper {
  display: inline-block;
  filter: var(--shadow-blob);

  &.sm svg { width: 40px; height: 40px; }
  &.md svg { width: 80px; height: 80px; }
  &.lg svg { width: 120px; height: 120px; }
  &.xl svg { width: 160px; height: 160px; }

  svg {
    overflow: visible;

    path, circle, ellipse {
      stroke: var(--ink-main);
      stroke-width: 2;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .blob-body {
      stroke-width: 3;
    }

    // Idle animation
    animation: blob-bob 2s ease-in-out infinite;
  }

  // Mood-based animations
  &.mood-excited svg {
    animation: blob-bounce 0.5s ease-in-out infinite;
  }

  &.mood-thinking svg {
    animation: blob-tilt 1s ease-in-out infinite;
  }
}

@keyframes blob-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes blob-bounce {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.05) translateY(-5px); }
}

@keyframes blob-tilt {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  75% { transform: rotate(-3deg); }
}
```

### C3: CardStack Component

```typescript
// === FILE: src/app/shared/components/card-stack/card-stack.component.ts ===

@Component({
  selector: 'app-card-stack',
  template: `
    <div class="card-stack-container">
      <!-- Background layers -->
      <div class="card-layer cl-2"></div>
      <div class="card-layer cl-1"></div>

      <!-- Main card -->
      <div class="card-main">
        <!-- Ribbons -->
        <div class="ribbons">
          @for (ribbon of ribbons; track ribbon) {
            <div class="ribbon" [style.background]="ribbon"></div>
          }
        </div>

        <!-- Close button -->
        <button class="close-btn" (click)="close.emit()">
          <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/></svg>
        </button>

        <!-- Content -->
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./card-stack.component.scss']
})
export class CardStackComponent {
  @Input() ribbons: string[] = [];
  @Output() close = new EventEmitter<void>();
}
```

```scss
// card-stack.component.scss
.card-stack-container {
  position: relative;
  perspective: 1000px;
}

.card-layer {
  position: absolute;
  inset: 0;
  background: #eaddd0;
  border: var(--panel-border);
  border-radius: 16px;

  &.cl-2 {
    transform: translate(12px, 12px) rotate(2deg);
    z-index: 1;
  }

  &.cl-1 {
    transform: translate(6px, 6px) rotate(1deg);
    z-index: 2;
  }
}

.card-main {
  position: relative;
  background: var(--paper-panel);
  border: var(--panel-border);
  border-radius: 16px;
  z-index: 3;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  // Entrance animation
  animation: card-slide-up var(--duration-slow) var(--ease-storybook);
}

.ribbons {
  position: absolute;
  top: -2px;
  left: 24px;
  display: flex;
  gap: 6px;
  z-index: 4;
}

.ribbon {
  width: 16px;
  height: 28px;
  border: var(--panel-border);
  border-top: none;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  padding: 4px;

  &:hover {
    color: var(--ink-main);
  }

  svg {
    width: 24px;
    height: 24px;
  }
}

@keyframes card-slide-up {
  from {
    opacity: 0;
    transform: translateY(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### C4: StorybookCard Component

```typescript
// === FILE: src/app/shared/components/storybook-card/storybook-card.component.ts ===

@Component({
  selector: 'app-storybook-card',
  template: `
    <div class="storybook-card" [class.clickable]="clickable" (click)="clickable && clicked.emit()">
      @if (decoration) {
        <div class="card-decoration">{{ decoration }}</div>
      }

      @if (icon) {
        <div class="card-icon">{{ icon }}</div>
      }

      @if (title) {
        <h3 class="card-title">{{ title }}</h3>
      }

      @if (subtitle) {
        <p class="card-subtitle">{{ subtitle }}</p>
      }

      <ng-content></ng-content>

      @if (badge) {
        <span class="card-badge" [style.background]="badgeColor">{{ badge }}</span>
      }
    </div>
  `,
  styleUrls: ['./storybook-card.component.scss']
})
export class StorybookCardComponent {
  @Input() decoration?: string;
  @Input() icon?: string;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() badge?: string;
  @Input() badgeColor?: string;
  @Input() clickable = false;
  @Output() clicked = new EventEmitter<void>();
}
```

```scss
// storybook-card.component.scss
.storybook-card {
  background: var(--paper-panel);
  border: var(--border-sketchy);
  border-radius: var(--radius-sketchy);
  padding: 16px;
  position: relative;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-quick) var(--ease-storybook);

  &.clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: var(--shadow-float);
    }

    &:active {
      transform: translateY(-2px) scale(1);
    }
  }

  .card-decoration {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 24px;
    opacity: 0.3;
  }

  .card-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: 12px;
  }

  .card-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 4px;
  }

  .card-subtitle {
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--ink-muted);
    text-align: center;
    line-height: 1.4;
  }

  .card-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
}
```

### C5: ParticleCanvas Component

```typescript
// === FILE: src/app/shared/components/particle-canvas/particle-canvas.component.ts ===

@Component({
  selector: 'app-particle-canvas',
  template: `<canvas class="particle-canvas"></canvas>`,
  styleUrls: ['./particle-canvas.component.scss']
})
export class ParticleCanvasComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() particleCount = 60;
  @Input() particleType: 'dust' | 'firefly' | 'leaf' = 'dust';

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId!: number;

  ngAfterViewInit() {
    this.init();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  private init() {
    const canvas = this.canvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.initParticles();
    this.animate();
  }

  private resize() {
    const canvas = this.canvas.nativeElement;
    const parent = canvas.parentElement;
    canvas.width = parent?.clientWidth || window.innerWidth;
    canvas.height = parent?.clientHeight || window.innerHeight;
  }

  private initParticles() {
    this.particles = Array.from({ length: this.particleCount }, () => ({
      x: Math.random() * this.canvas.nativeElement.width,
      y: Math.random() * this.canvas.nativeElement.height,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.5 + 0.2
    }));
  }

  private animate() {
    const canvas = this.canvas.nativeElement;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach(p => {
      p.y -= p.s;
      p.a += 0.05;

      if (p.y < 0) {
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }

      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.2 + Math.sin(p.a) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x % canvas.width, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

interface Particle {
  x: number;
  y: number;
  r: number;
  a: number;
  s: number;
}
```

```scss
// particle-canvas.component.scss
.particle-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
```

---

## 🎬 ANIMATION SYSTEM

### Animation Library (using Angular Animations)

```typescript
// === FILE: src/app/core/animations/storybook.animations.ts ===

import {
  trigger,
  style,
  animate,
  transition,
  keyframes,
  query,
  stagger
} from '@angular/animations';

// Fade in with storybook flair
export const fadeInStorybook = trigger('fadeInStorybook', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('{{duration}} {{easing}}', style({ opacity: 1, transform: 'scale(1)' })),
  ], { params: { duration: '500ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' } })
]);

// Slide up from bottom (like card stack)
export const slideUpStack = trigger('slideUpStack', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(100%)' }),
    animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ])
]);

// Stagger children entrance
export const staggerIn = trigger('staggerIn', [
  transition(':enter', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('100ms', animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
    ])
  ])
]);

// Blob bounce (for characters)
export const blobBounce = trigger('blobBounce', [
  transition('* => active', [
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(1.1) translateY(-5px)' }),
      style({ transform: 'scale(1)' })
    ]))
  ])
]);

// Wiggle/shake animation
export const wiggle = trigger('wiggle', [
  transition('* => wiggling', [
    animate('400ms ease-in-out', keyframes([
      style({ transform: 'rotate(0deg)' }),
      style({ transform: 'rotate(-5deg)' }),
      style({ transform: 'rotate(5deg)' }),
      style({ transform: 'rotate(-5deg)' }),
      style({ transform: 'rotate(0deg)' })
    ]))
  ])
]);

// Pulse glow (for living glass effect)
export const pulseGlow = trigger('pulseGlow', [
  transition(':enter', [
    style({ boxShadow: 'inset 0 0 10px 0px transparent' }),
    animate('2s ease-in-out infinite', style({ boxShadow: 'inset 0 0 16px 2px var(--glow-color)' }))
  ])
]);

// Page transition (between screens)
export const pageTransition = trigger('pageTransition', [
  transition('loading => intro', [
    style({ opacity: 1 }),
    animate('500ms ease-out', style({ opacity: 0 }))
  ]),
  transition('* => *', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(':leave', [
      style({ opacity: 1 }),
      animate('300ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
      animate('500ms 300ms ease-out', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);
```

### Specialized Animations

```typescript
// === FILE: src/app/core/animations/specialized.animations.ts ===

// Book close transition (loading -> intro)
export const bookClose = trigger('bookClose', [
  transition(':leave', [
    animate('800ms cubic-bezier(0.68, -0.15, 0.32, 1.15)', keyframes([
      style({ transform: 'scale(1) rotateY(0deg)', opacity: 1 }),
      style({ transform: 'scale(0.9) rotateY(-10deg)', opacity: 0.8 }),
      style({ transform: 'scale(0.1) rotateY(-90deg)', opacity: 0.3 }),
      style({ transform: 'scale(0) rotateY(-180deg)', opacity: 0 })
    ]))
  ])
]);

// Assessment answer reaction
export const answerReaction = trigger('answerReaction', [
  transition('* => selected', [
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(1.3)' }),
      style({ transform: 'scale(1)' })
    ]))
  ])
]);

// Progress bar fill
export const progressFill = trigger('progressFill', [
  transition(':enter', [
    style({ width: '0%' }),
    animate('800ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ width: '{{value}}%' }))
  ], { params: { value: 0 } })
]);

// Typewriter effect
export function typewriter(text: string): string {
  return text; // Use directive for actual implementation
}

// Shimmer/skeleton loading
export const shimmer = trigger('shimmer', [
  transition(':enter', [
    style({ backgroundPosition: '-200% 0' }),
    animate('1.5s ease-in-out infinite', style({ backgroundPosition: '200% 0' }))
  ])
]);
```

---

## 🗺️ IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Days 1-3)

**Step 1.1: Setup Design System**
- [ ] Create global CSS variables file
- [ ] Add Fraunces + Nunito fonts to index.html
- [ ] Create paper texture overlay component
- [ ] Set up animation library

**Files to create:**
```
src/styles/
  ├── design-system.css          (All CSS variables)
  ├── animations.css             (Animation keyframes)
  └── paper-texture.css          (Texture overlay)

src/app/core/
  └── animations/
      ├── storybook.animations.ts
      └── specialized.animations.ts
```

**Step 1.2: Create Base Components**
- [ ] PaperButton component
- [ ] BlobCharacter component
- [ ] CardStack component
- [ ] StorybookCard component
- [ ] ParticleCanvas component

**Files to create:**
```
src/app/shared/components/
  ├── paper-button/
  ├── blob-character/
  ├── card-stack/
  ├── storybook-card/
  └── particle-canvas/
```

---

### Phase 2: Screen Overhaul (Days 4-10)

**Step 2.1: Loading Screen (Day 4)**
- [ ] Replace loading.component.html
- [ ] Add animated blob character
- [ ] Implement dust particle canvas
- [ ] Create typewriter text cycler
- [ ] Build book-close transition

**Step 2.2: Intro Screen (Day 5)**
- [ ] Redesign intro cards with storybook style
- [ ] Add illustrated emblem
- [ ] Create floating blob decorations
- [ ] Implement hover spring animations

**Step 2.3: Assessment Screen (Days 6-7)**
- [ ] Build character host component
- [ ] Create illustrated question card
- [ ] Design answer button cluster
- [ ] Implement hand-drawn progress bar
- [ ] Add character reaction system

**Step 2.4: Results Screen (Day 8)**
- [ ] Create storybook prose styling
- [ ] Build pantheon card stack
- [ ] Design illustrated CTA button
- [ ] Add margin doodle illustrations

**Step 2.5: Universe View (Days 9-10)**
- [ ] Replace Three.js spheres with blob sprites
- [ ] Create environment props (islands, clouds)
- [ ] Implement dust particle system
- [ ] Add hand-drawn connection lines
- [ ] Create storybook floating labels

---

### Phase 3: UI Overlays (Days 11-13)

**Step 3.1: Detail HUD (Day 11)**
- [ ] Build card-stack detail panel
- [ ] Create animated attribute bars
- [ ] Design related archetype cards
- [ ] Implement slide-up animations

**Step 3.2: Filters Panel (Day 12)**
- [ ] Create storybook sliders
- [ ] Build cluster checkboxes
- [ ] Add dimension theming
- [ ] Implement living glass glow

**Step 3.3: Coach Panel (Day 13)**
- [ ] Create coach character
- [ ] Design storybook message bubbles
- [ ] Build suggestion chips
- [ ] Style textarea with storybook flair

---

### Phase 4: Polish & Optimize (Days 14-15)

**Step 4.1: Performance**
- [ ] Optimize Three.js rendering
- [ ] Implement object pooling for particles
- [ ] Add lazy loading for images
- [ ] Reduce animation repaints

**Step 4.2: Accessibility**
- [ ] Add ARIA labels to all components
- [ ] Implement keyboard navigation
- [ ] Ensure color contrast ratios
- [ ] Add screen reader announcements

**Step 4.3: Cross-browser**
- [ ] Test on Chrome, Firefox, Safari
- [ ] Add vendor prefixes where needed
- [ ] Handle mobile Safari quirks
- [ ] Test on various screen sizes

**Step 4.4: Final Polish**
- [ ] Adjust animation timings
- [ ] Fine-tune color values
- [ ] Add micro-interactions
- [ ] Test all user flows

---

## 📖 HARDCODED DECISIONS REFERENCE

### Color Matrix (Quick Reference)

| Element | Variable | Value | Use Case |
|---------|----------|-------|----------|
| Background | --paper-bg | #f6f3eb | Main canvas |
| Panel | --paper-panel | #fdfbf6 | Card backgrounds |
| Ink Main | --ink-main | #4a3e35 | Primary text |
| Ink Muted | --ink-muted | #8b7d72 | Secondary text |
| Agency | --accent-blue | #70a1d7 | Agency dimension |
| Temperature | --accent-orange | #f4a261 | Temperature dimension |
| Focus | --accent-green | #90be6d | Focus dimension |
| Attachment | --accent-yellow | #f9c74f | Attachment dimension |

### Typography Scale (Quick Reference)

| Element | Font | Size | Weight | Use |
|---------|------|------|--------|-----|
| Hero | Fraunces | 48px | 700 | Page titles |
| H1 | Fraunces | 36px | 700 | Section titles |
| H2 | Fraunces | 28px | 600 | Card titles |
| H3 | Fraunces | 22px | 600 | Subtitles |
| Body | Nunito | 16px | 500 | Paragraphs |
| Small | Nunito | 14px | 600 | Labels |
| Tiny | Nunito | 12px | 700 | Badges/caps |

### Animation Timings (Quick Reference)

| Duration | Variable | Value | Use |
|----------|----------|-------|-----|
| Instant | --duration-instant | 150ms | Hover effects |
| Quick | --duration-quick | 300ms | Button clicks |
| Standard | --duration-standard | 500ms | Screen transitions |
| Slow | --duration-slow | 800ms | Complex reveals |
| Cinematic | --duration-cinematic | 1200ms | Special sequences |

### Border Radius (Quick Reference)

| Name | Variable | Value | Use |
|------|----------|-------|-----|
| Sketchy | --radius-sketchy | 255px 15px... | Cards, buttons |
| Soft | --radius-soft | 16px | Panels |
| Round | - | 50% | Circular elements |
| None | - | 0 | Sharp edges |

---

## ✅ QUALITY CHECKLIST

### Visual Design (10/10 Goal)
- [ ] All colors match design system exactly
- [ ] Typography uses Fraunces + Nunito consistently
- [ ] Borders are sketchy/hand-drawn style
- [ ] Shadows use card-stack effect
- [ ] Paper texture overlay is visible but subtle
- [ ] No default browser styles remain
- [ ] All animations use storybook easing
- [ ] Spacing is consistent (8px grid)

### Interaction Design (10/10 Goal)
- [ ] All buttons have hover/active states
- [ ] Character reactions are timely
- [ ] Page transitions feel natural
- [ ] 3D navigation is smooth
- [ ] Forms give immediate feedback
- [ ] Loading states are engaging
- [ ] Error states are friendly

### Performance (60fps Goal)
- [ ] Three.js maintains 60fps
- [ ] Animations use GPU acceleration
- [ ] No layout thrashing
- [ ] Particle count is optimized
- [ ] Images are lazy-loaded
- [ ] Memory leaks are prevented

### Accessibility (WCAG AA Goal)
- [ ] All interactive elements have focus states
- [ ] Color contrast is 4.5:1 minimum
- [ ] ARIA labels are present
- [ ] Keyboard navigation works
- [ ] Screen readers announce important changes
- [ ] Motion can be reduced (prefers-reduced-motion)

---

## 🎓 IMPLEMENTATION NOTES FOR JUNIOR DEVELOPER

### How to Use This Document

1. **Read the entire plan first** - Understand the full vision
2. **Follow phases in order** - Don't skip ahead
3. **Copy exact values** - All hex codes, sizes, timings are intentional
4. **Test each component** - Verify animations and interactions
5. **Ask questions** - If something is unclear, ask before assuming

### Common Pitfalls to Avoid

❌ **Don't** use default browser styles
❌ **Don't** guess at color values - use the variables
❌ **Don't** skip animations - they're core to the aesthetic
❌ **Don't** use box-shadows other than specified
❌ **Don't** change font families
❌ **Don't** make borders uniform - sketchy is intentional

### File Organization

```
src/
├── styles/
│   ├── design-system.css          (Apply FIRST)
│   ├── animations.css
│   └── paper-texture.css
├── app/
│   ├── core/
│   │   └── animations/            (Apply SECOND)
│   ├── shared/
│   │   └── components/            (Apply THIRD)
│   └── features/
│       ├── loading/               (Apply FOURTH)
│       ├── intro/
│       ├── assessment/
│       ├── universe/
│       └── coach/
```

### Testing Your Work

After each component:
1. [ ] Visual check against this spec
2. [ ] Hover/active states work
3. [ ] Animations play smoothly
4. [ ] No console errors
5. [ ] Accessibility check (keyboard nav)
6. [ ] Cross-browser check (Chrome + Safari)

---

## 📚 APPENDIX: COMPLETE CSS VARIABLES

Copy this entire block into `design-system.css`:

```css
:root {
  /* === PAPER WARM PALETTE === */
  --paper-bg: #f6f3eb;
  --paper-panel: #fdfbf6;
  --paper-viewport-top: #a7c5d2;
  --paper-viewport-bot: #eaddd0;

  /* === INK & TEXT === */
  --ink-main: #4a3e35;
  --ink-muted: #8b7d72;
  --ink-light: #c2b7ad;

  /* === ACCENT COLORS === */
  --accent-blue: #70a1d7;
  --accent-orange: #f4a261;
  --accent-green: #90be6d;
  --accent-yellow: #f9c74f;

  /* === CLUSTER COLORS === */
  --cluster-control: #6A040F;
  --cluster-storm: #9D0208;
  --cluster-avoidant: #4CC9F0;
  --cluster-anxious: #FF5D8F;
  --cluster-seductive: #FF006E;
  --cluster-gift: #38B000;

  /* === BORDERS === */
  --border-sketchy: 2px solid var(--ink-main);
  --border-soft: 2px solid var(--ink-main);
  --radius-sketchy: 255px 15px 225px 15px / 15px 225px 15px 255px;
  --radius-soft: 16px;

  /* === SHADOWS === */
  --shadow-float: 0 12px 24px rgba(74, 62, 53, 0.15);
  --shadow-card: 4px 4px 0 rgba(200, 190, 180, 0.5), 8px 8px 0 rgba(180, 170, 160, 0.3);
  --shadow-blob: drop-shadow(0 6px 12px rgba(74, 62, 53, 0.2));
  --shadow-blob-hover: drop-shadow(0 12px 24px rgba(74, 62, 53, 0.3));
  --shadow-pressed: inset 0 2px 4px rgba(74, 62, 53, 0.1);

  /* === EASING === */
  --ease-quantum: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-relational: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-storybook: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === DURATIONS === */
  --duration-instant: 150ms;
  --duration-quick: 300ms;
  --duration-standard: 500ms;
  --duration-slow: 800ms;
  --duration-cinematic: 1200ms;

  /* === TYPOGRAPHY === */
  --font-serif: 'Fraunces', serif;
  --font-sans: 'Nunito', sans-serif;
}
```

---

---

## 🔴 ADDENDUM: ADDITIONAL ELEMENTS DISCOVERED

After deeper code analysis, these additional elements require restyling:

### 3D SCENE ELEMENTS (Three.js)

#### E1: Background Sphere (Sky Gradient)
**Current**: ShaderMaterial with generic blue/cream gradient
**Target**: Storybook atmospheric gradient with paper texture

```typescript
// FILE: src/app/services/webxr.service.ts
// LOCATION: createZenBackground() method (line ~849)

// NEW SPECIFICATION:
- Top color: --paper-viewport-top (#a7c5d2)
- Bottom color: --paper-viewport-bot (#eaddd0)
- Add subtle noise texture to shader
- Add floating "dust motes" in 3D space
- Add atmospheric fog for depth
```

#### E2: Axis Grids (3D Reference Planes)
**Current**: Brown GridHelper, very technical
**Target**: Hand-drawn grid lines, storybook style

```typescript
// NEW SPECIFICATION:
- Replace GridHelper with custom LineSegments
- Stroke: Sketchy/dashed lines (like story.txt connection lines)
- Color: --ink-light with low opacity
- Labels: Storybook floating tags (see E3)
- Animation: Gentle pulse when first viewed
```

#### E3: Axis Labels (Floating 3D Labels)
**Current**: CSS2DObject with Tailwind classes
**Target**: Storybook floating tag labels

```typescript
// NEW SPECIFICATION:
- Style: .focus-tag from style.txt
- Background: rgba(255, 255, 255, 0.6) with blur
- Border: 1px solid rgba(0, 0, 0, 0.05)
- Border-radius: 8px
- Padding: 4px 10px
- Font: Nunito 14px font-weight 600
- Color: --ink-main
- Optional: Add small emoji icon per dimension
```

#### E4: Archetype "Stress Orbs" (Attachment Shells)
**Current**: ShaderMaterial sphere around archetype
**Target**: Illustrated attachment aura (storybook style)

```typescript
// NEW SPECIFICATION:
// Currently: Pink (anxious) and purple (avoidant) shells
// Transform to: Illustrated aura effects

// ANXIOUS ATTACHMENT (positive values):
- Instead of shell: Multiple orbiting small blobs
- Color: Warm pink/coral gradient
- Animation: Quick, nervous orbiting
- Visual: Small "worry blobs" circling the main character

// AVOIDANT ATTACHMENT (negative values):
- Instead of shell: Expanding rings/barrier
- Color: Cool lavender/purple gradient
- Animation: Slow, protective expansion
- Visual: Concentric sketchy circles pushing outward

// IMPLEMENTATION:
- Replace ShaderMaterial with sprite-based system
- Use SVG sprites for hand-drawn look
- Add subtle rotation/breathing animation
```

#### E5: Relational Tethers (Connection Lines)
**Current**: Lines connecting related archetypes
**Target**: Hand-drawn dashed curves

```typescript
// NEW SPECIFICATION:
- Style: Dashed stroke (stroke-dasharray: 4 6)
- Color: --ink-main with 0.4 opacity
- Animation: "Flowing dash" effect
- Highlight: Orange glow when archetype selected
- Width: 1.5px
- Line cap: round
```

#### E6: Assessment Aura (Torus Ring)
**Current**: TorusGeometry with white glow
**Target: Illustrated "spotlight" effect

```typescript
// NEW SPECIFICATION:
- Replace torus with sprite-based ring
- Style: Hand-drawn circle with sketchy strokes
- Animation: Pulse + rotation
- Color: Based on cluster (gift = blue, shadow = red)
- Add small "sparkles" around ring
```

#### E7: Creation Particle Burst (When AI Creates Archetype)
**Current**: PointsMaterial sphere expansion
**Target: Storybook "poof" effect with stars/magic

```typescript
// NEW SPECIFICATION:
- Replace particles with illustrated sprites
- Shapes: Stars, sparkles, small blobs
- Animation: Burst outward, then fade
- Color: Match archetype color
- Add "magic trail" effect
- Duration: 2 seconds (same as current)
```

---

### UI ELEMENTS (HTML/CSS)

#### E8: Search Box
**Current**: `bg-neutral-50/60 backdrop-blur-lg border border-black/5`
**Target**: Storybook search with character

```scss
// NEW SPECIFICATION:
.search-storybook {
  background: var(--paper-panel);
  border: var(--border-sketchy);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: var(--shadow-card);

  input {
    background: transparent;
    border: none;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-main);

    &::placeholder {
      color: var(--ink-muted);
      font-style: italic;
    }
  }

  // Small blob icon peeking from right
  .search-icon-blob {
    position: absolute;
    right: 12px;
    width: 24px;
    height: 24px;
  }
}
```

#### E9: Cluster Filter Pills
**Current**: `bg-black/5 hover:bg-black/10` pills
**Target**: Illustrated cluster badges

```scss
// NEW SPECIFICATION:
.cluster-pill {
  display: flex;
  align-items: center;
  background: var(--paper-panel);
  border: var(--border-soft);
  border-radius: 20px;
  padding: 6px 12px;
  box-shadow: 2px 2px 0 rgba(200, 190, 180, 0.5);
  transition: all var(--duration-quick) var(--ease-storybook);

  // Cluster emoji icon (left side)
  .cluster-icon {
    font-size: 16px;
    margin-right: 6px;
  }

  // View constellation button (right side)
  .view-btn {
    background: var(--cluster-color);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    color: white;
    font-size: 12px;
    margin-left: 6px;

    &:hover {
      transform: scale(1.1);
    }
  }

  &.active {
    background: var(--cluster-color);
    color: white;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-float);
  }
}
```

#### E10: View Constellation Button (Eye Icon)
**Current**: Generic button with eye SVG
**Target:** Illustrated "spyglass" or "telescope" button

```scss
// NEW SPECIFICATION:
.constellation-view-btn {
  background: var(--paper-panel);
  border: var(--border-sketchy);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  transition: all var(--duration-instant) var(--ease-storybook);

  // Telescope/Spyglass emoji or icon
  &::before {
    content: '🔭';
    font-size: 16px;
  }

  &:hover {
    background: var(--accent-blue);
    transform: scale(1.1) rotate(-5deg);

    &::before {
      content: '🌌'; // Switch to galaxy
    }
  }
}
```

#### E11: "View Full Universe" Button (After Assessment)
**Current**: `bg-teal-500/20 hover:bg-teal-500/30`
**Target:** Illustrated return button

```scss
// NEW SPECIFICATION:
.full-universe-btn {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
  border: var(--border-sketchy);
  border-radius: var(--radius-sketchy);
  padding: 8px 16px;
  color: white;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-card);

  &::before {
    content: '🌍';
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-float);
  }
}
```

#### E12: Language Toggle (EN/RU)
**Current:** Simple text button
**Target:** Illustrated language toggle

```scss
// NEW SPECIFICATION:
.language-toggle {
  background: var(--paper-panel);
  border: var(--border-soft);
  border-radius: 20px;
  padding: 6px 12px;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all var(--duration-instant) var(--ease-storybook);

  &:hover {
    background: var(--accent-yellow);
    transform: scale(1.05);
  }
}
```

#### E13: Help Panel (Modal)
**Current:** `bg-neutral-50/80 backdrop-blur-xl`
**Target:** Storybook scroll/modal

```scss
// NEW SPECIFICATION:
.help-modal {
  background: var(--paper-panel);
  border: var(--border-sketchy);
  border-radius: var(--radius-sketchy);
  box-shadow: var(--shadow-card);
  padding: 32px;
  max-width: 600px;

  // Decorative corner elements
  &::before,
  &::after {
    content: '✿';
    position: absolute;
    font-size: 24px;
    opacity: 0.3;
  }

  &::before { top: 12px; left: 12px; }
  &::after { bottom: 12px; right: 12px; }

  h2 {
    font-family: var(--font-serif);
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  ul {
    list-style: none;

    li {
      padding: 12px 0;
      border-bottom: 1px dashed var(--ink-light);

      &:last-child {
        border-bottom: none;
      }

      strong {
        color: var(--accent-orange);
        font-family: var(--font-serif);
      }
    }
  }
}
```

#### E14: Creation Progress (During Assessment Analysis)
**Current:** Generic spinner
**Target:** Animated scene with character

```typescript
// NEW SPECIFICATION:
// Replace the loading div with:

.creation-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;

  // Large crystal ball or mirror
  .crystal-ball {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), var(--accent-blue));
    border: 3px solid var(--ink-main);
    box-shadow:
      inset 0 0 30px var(--accent-blue),
      0 10px 30px rgba(74, 62, 53, 0.3);
    animation: crystal-pulse 2s ease-in-out infinite;

    // Small silhouettes appearing inside
    &::after {
      content: '👤👤';
      font-size: 24px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: silhouettes-fade 3s ease-in-out infinite;
    }
  }

  // Mystical text
  .creation-text {
    font-family: var(--font-serif);
    font-size: 18px;
    color: var(--ink-main);
    margin-top: 24px;
    animation: text-glow 2s ease-in-out infinite;
  }

  // Floating dust/sparkles
  .sparkle-canvas {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
}

@keyframes crystal-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      inset 0 0 30px var(--accent-blue),
      0 10px 30px rgba(74, 62, 53, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow:
      inset 0 0 50px var(--accent-blue),
      0 15px 40px rgba(74, 62, 53, 0.4);
  }
}

@keyframes silhouettes-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
```

#### E15: Back Button (Various Screens)
**Current:** Generic text with arrow
**Target:** Illustrated back button

```scss
// NEW SPECIFICATION:
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--paper-panel);
  border: var(--border-soft);
  border-radius: 20px;
  padding: 8px 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--duration-instant) var(--ease-storybook);

  &::before {
    content: '←';
    font-size: 16px;
  }

  &:hover {
    background: var(--accent-blue);
    color: white;
    transform: translateX(-4px);
  }
}
```

#### E16: Progress Bar (Assessment)
**Current:** `bg-neutral-200` with `bg-teal-500` fill
**Target:** Hand-drawn progress bar

```scss
// NEW SPECIFICATION:
.progress-bar-storybook {
  width: 100%;
  height: 16px;
  background: var(--paper-panel);
  border: var(--border-soft);
  border-radius: 8px;
  position: relative;
  overflow: hidden;

  // Sketched fill effect
  .progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--accent-blue) 0%,
      var(--accent-orange) 50%,
      var(--accent-green) 100%
    );
    border-right: 2px solid var(--ink-main);
    border-radius: 6px 0 0 6px;
    transition: width var(--duration-standard) var(--ease-relational);

    // Add "scribble" texture overlay
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='scribble'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23scribble)' opacity='0.3'/%3E%3C/svg%3E");
      opacity: 0.5;
    }
  }

  // Progress percentage label
  .progress-label {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-main);
  }
}
```

---

### MISSING COMPONENTS TO CREATE

#### E17: ConstellationViewButton Component
```typescript
@Component({
  selector: 'app-constellation-view-btn',
  template: `
    <button
      class="constellation-view-btn"
      [title]="tooltip"
      (click)="clicked.emit()">
    </button>
  `
})
export class ConstellationViewButtonComponent {
  @Input() tooltip = 'View constellation';
  @Output() clicked = new EventEmitter<void>();
}
```

#### E18: ClusterBadge Component
```typescript
@Component({
  selector: 'app-cluster-badge',
  template: `
    <div class="cluster-badge" [class.active]="active" (click)="toggle.emit()">
      <span class="cluster-icon">{{ icon }}</span>
      <span class="cluster-label">{{ label }}</span>
      <button class="view-btn" (click)="viewConstellation($event)">
        🔭
      </button>
    </div>
  `
})
export class ClusterBadgeComponent {
  @Input() id = '';
  @Input() label = '';
  @Input() icon = '';
  @Input() color = '';
  @Input() active = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() view = new EventEmitter<string>();
}
```

#### E19: StorybookProgress Component
```typescript
@Component({
  selector: 'app-storybook-progress',
  template: `
    <div class="progress-container">
      <div class="progress-bar-storybook">
        <div class="progress-fill" [style.width.%]="progress"></div>
        <span class="progress-label">{{ progress }}%</span>
      </div>
      @if (showSection) {
        <div class="progress-section">{{ sectionLabel }}</div>
      }
    </div>
  `
})
export class StorybookProgressComponent {
  @Input() progress = 0;
  @Input() sectionLabel = '';
  @Input() showSection = false;
}
```

---

### UPDATED TASK LIST

Add these new tasks to the implementation:

**Phase 2b: Additional 3D Elements** (Day 10b)
- [ ] E1: Transform background sphere with storybook gradient
- [ ] E2: Replace axis grids with hand-drawn lines
- [ ] E3: Style axis labels as storybook tags
- [ ] E4: Redesign attachment shells as illustrated auras
- [ ] E5: Style connection lines as hand-drawn curves
- [ ] E6: Replace assessment torus with illustrated ring
- [ ] E7: Transform creation particles into magic burst

**Phase 2c: Additional UI Elements** (Day 10c)
- [ ] E8: Storybook search box
- [ ] E9: Illustrated cluster pills
- [ ] E10: Constellation view button
- [ ] E11: Full universe button
- [ ] E12: Language toggle
- [ ] E13: Help modal styling
- [ ] E14: Creation progress scene
- [ ] E15: Back button styling
- [ ] E16: Progress bar redesign

**Phase 1b: Additional Base Components** (Day 3b)
- [ ] Create ClusterBadge component
- [ ] Create ConstellationViewButton component
- [ ] Create StorybookProgress component
- [ ] Create CreationProgress component

---

**END OF COMPLETE DESIGN SPECIFICATION**

This document contains every decision needed to implement the SIGGRAPH-tier overhaul. Follow it exactly, and the result will be a 10/10 visual experience.

*Last Updated: 2025-01-12*
*Version: 1.1 - WITH ADDENDUM*
*Added: 16 additional elements, 4 new components*
