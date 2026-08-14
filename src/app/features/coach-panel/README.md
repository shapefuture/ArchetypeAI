# AI Coach Panel - Standalone Demo

This folder contains a self-contained coach panel example. The production app currently uses the inline coach shell in `src/app.component.html`, so treat this component as a reusable reference implementation rather than the canonical integration surface.

## 🎨 Visual Design

### Character: Wisdom Owl
- **Base Design**: Round, friendly owl with wisdom aesthetic
- **Expressions**:
  - Neutral: Default wisdom face (alert eyes, slight smile)
  - Thinking: Thoughtful expression with gentle tilt animation
  - Happy: Welcoming, slight smile, relaxed posture
  - Excited: Eyes wide, wings flutter, sparkles appear
- **Idle Animation**: Gentle hover/bob motion
- **Colors**: Sage blue (#70a1d7) with cream facial disc (#e8d5a3)

### Message Bubbles

**AI Messages:**
- Background: Cream paper panel (#fdfbf6)
- Border: Sketchy 2px border
- Alignment: Left
- Character: 40x40px wisdom owl avatar
- Typography: Serif italic font (storybook prose style)
- Animation: Slide in with scale effect

**User Messages:**
- Background: Light blue tint (rgba(112, 161, 215, 0.15))
- Border: Solid accent blue border
- Alignment: Right
- No character icon
- Typography: Clean sans-serif
- Animation: Slide in from right

### Suggestion Chips
- Style: Pill-shaped with sketchy borders
- Background: Cream with accent blue border
- Hover: Scale 1.05, color tint change
- Click: Auto-populate input and send
- Animation: Bouncy hover effect

### Input Area
- Textarea: Transparent background, warm glow on focus
- Send button: Hand-drawn arrow icon in circle
- Focus state: 3px warm glow border
- Placeholder: "Ask the wisdom sage..."
- Auto-resize: Grows to 120px max height

## 🚀 Features

### Core Functionality
- ✅ Illustrated wisdom owl character with mood expressions
- ✅ Storybook-styled message bubbles
- ✅ Animated suggestion chips
- ✅ Elegant textarea with auto-resize
- ✅ Message entrance animations
- ✅ Typing indicator with character
- ✅ Markdown support (bold, italic, line breaks)
- ✅ Responsive design (mobile-friendly)
- ✅ Accessibility (ARIA labels, keyboard nav, reduced motion)

### Personality System
- **Mood States**: neutral, happy, excited, thinking
- **Dynamic Expressions**: Character responds to conversation context
- **Animated Reactions**: Different animations for each mood
- **Wisdom Sparkles**: Appear during excited state

### Interaction Patterns
1. **Welcome**: Neutral/happy mood with warm greeting
2. **Processing**: Thinking mood with tilt animation
3. **Response**: Happy/excited mood with wisdom
4. **Suggestions**: Contextual question chips
5. **Typing**: Animated dots with character

## 📁 File Structure

```
src/app/features/coach-panel/
├── coach-panel.component.ts       # Main Angular component
├── coach-panel.example.ts         # Usage examples and documentation
├── coach-panel-demo.html          # Standalone HTML demo
└── README.md                      # This file

src/app/shared/components/
├── wisdom-owl/
│   └── wisdom-owl.component.ts   # Wisdom owl character component
├── blob-character/
│   └── blob-character.component.ts  # Alternative blob character
└── paper-button/
    └── paper-button.component.ts  # Sketchy button component
```

## 🎯 Usage

### Standalone Integration

```typescript
import { CoachPanelComponent } from './features/coach-panel/coach-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CoachPanelComponent],
  template: `
    <app-coach-panel
      [isOpen]="isCoachOpen"
      [messages]="coachMessages"
      [isTyping]="isCoachTyping"
      [suggestedQuestions]="suggestedQuestions"
      [coachMood]="currentMood"
      (close)="closeCoach()"
      (sendMessageRequest)="handleMessage($event)">
    </app-coach-panel>
  `
})
export class AppComponent {
  isCoachOpen = false;
  currentMood: 'neutral' | 'happy' | 'excited' | 'thinking' = 'neutral';
  coachMessages: CoachMessage[] = [];
  suggestedQuestions = [
    { id: '1', text: 'What makes relationships thrive?' },
    { id: '2', text: 'How do I build deeper connections?' }
  ];

  openCoach() {
    this.isCoachOpen = true;
    this.currentMood = 'happy';
  }

  closeCoach() {
    this.isCoachOpen = false;
  }

  handleMessage(message: string) {
    // Add user message
    this.coachMessages.push({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Show typing
    this.currentMood = 'thinking';
    this.isCoachTyping = true;

    // Simulate AI response
    setTimeout(() => {
      this.isCoachTyping = false;
      this.currentMood = 'happy';
      this.coachMessages.push({
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: 'That\'s a wonderful question!',
        timestamp: new Date(),
        coachMood: 'happy'
      });
    }, 1500);
  }
}
```

## 🎨 Design Tokens

```css
--paper-panel: #fdfbf6        /* Warm cream background */
--ink-main: #4a3e35           /* Dark brown text */
--ink-muted: #8b7d72          /* Muted text */
--ink-light: #c2b7ad          /* Light text */
--accent-blue: #70a1d7        /* Primary accent */
--accent-orange: #f4a261      /* Secondary accent */
--border-sketchy: 2px solid var(--ink-main)
--radius-sketchy: 255px 15px 225px 15px / 15px 225px 15px 255px
--ease-storybook: cubic-bezier(0.34, 1.56, 0.64, 1)
```

## ✨ Animations

### Message Entrance
```css
@keyframes messageSlideIn {
  from: opacity 0, translateY 20px, scale 0.95
  to: opacity 1, translateY 0, scale 1
}
```

### Character Idle
```css
@keyframes wisdomBob {
  0%, 100%: translateY 0
  50%: translateY -4px
}
```

### Typing Indicator
```css
@keyframes typingBounce {
  0%, 60%, 100%: translateY 0
  30%: translateY -8px
}
```

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation (Enter to send, Shift+Enter for newline)
- Focus indicators with warm glow
- Reduced motion support (prefers-reduced-motion)
- Semantic HTML structure
- Screen reader friendly timestamps
- High contrast text colors

## 📱 Responsive Design

- Desktop: 420px width, slides from right
- Mobile: Full width, slides from right
- Message bubbles: Auto-scale max-width
- Touch-friendly button sizes
- Optimized for both mouse and touch

## 🔧 Customization

### Character Colors
```typescript
<wisdom-owl
  [bodyColor]="'#70a1d7'"
  [chestColor]="'#8bb8e0'"
  [wingColor]="'#5a8bc7'"
  [facialDiscColor]="'#e8d5a3'">
</wisdom-owl>
```

### Panel Styling
```css
.coach-panel {
  width: 420px;
  background: var(--paper-panel);
  border-left: var(--border-sketchy);
}
```

### Message Formatting
```typescript
// Supports basic markdown
"Welcome **seeker**! I'm here to *help* you."
// Becomes:
// Welcome <strong>seeker</strong>! I'm here to <em>help</em> you.
```

## 🚀 Performance

- OnPush change detection strategy
- Optimized animations (transform, opacity only)
- Lazy scroll to bottom
- TrackBy functions for ngFor (implement with trackByFn)
- Minimal re-renders

## 🧪 Demo

Open `coach-panel-demo.html` in a browser to see the interactive demo without Angular.

## 📝 API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| isOpen | boolean | false | Panel open state |
| messages | CoachMessage[] | [] | Conversation history |
| isTyping | boolean | false | Show typing indicator |
| isSending | boolean | false | Disable send while sending |
| suggestedQuestions | SuggestedQuestion[] | [] | Suggestion chips |
| showSuggestions | boolean | true | Show/hide suggestions |
| coachMood | MoodType | 'neutral' | Character mood |

### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| close | void | Panel closed |
| sendMessageRequest | string | User sent message |

### Interfaces

```typescript
interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  timestamp: Date;
  coachMood?: MoodType;
}

interface SuggestedQuestion {
  id: string;
  text: string;
}

type MoodType = 'neutral' | 'happy' | 'excited' | 'thinking';
```

## 🎯 Future Enhancements

- [ ] Voice input/output
- [ ] Message history persistence
- [ ] Custom character themes
- [ ] Multi-language support
- [ ] Export conversation feature
- [ ] Message reactions
- [ ] File/image attachments
- [ ] Streaming responses
- [ ] Quick response templates
- [ ] Conversation branching

## 📄 License

Part of the Archetypal Universe project.

---

**Built with ❤️ for SIGGRAPH-tier storybook experiences**
