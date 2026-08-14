/**
 * AI COACH PANEL - SIGGRAPH-TIER STORYBOOK IMPLEMENTATION
 *
 * This is the complete coach panel implementation that transforms a generic
 * ChatGPT-style interface into an immersive storybook dialogue experience.
 *
 * FEATURES:
 * - Illustrated wisdom owl character with mood expressions
 * - Storybook-styled message bubbles with sketchy borders
 * - Animated suggestion chips
 * - Elegant textarea with warm focus effects
 * - Message entrance animations
 * - Typing indicator with character
 * - Responsive design
 *
 * INTEGRATION EXAMPLE:
 *
 * 1. Import the component in your app component or feature module:
 *
 * ```typescript
 * import { CoachPanelComponent } from './features/coach-panel/coach-panel.component';
 * ```
 *
 * 2. Add it to your component's imports or module declarations:
 *
 * ```typescript
 * @Component({
 *   selector: 'app-root',
 *   standalone: true,
 *   imports: [CoachPanelComponent, ...],
 *   template: `
 *     <app-coach-panel
 *       [isOpen]="isCoachOpen"
 *       [messages]="coachMessages"
 *       [isTyping]="isCoachTyping"
 *       [isSending]="isSendingMessage"
 *       [suggestedQuestions]="suggestedQuestions"
 *       [showSuggestions]="showSuggestions"
 *       [coachMood]="currentCoachMood"
 *       (close)="closeCoachPanel()"
 *       (sendMessageRequest)="handleCoachMessage($event)">
 *     </app-coach-panel>
 *
 *     <!-- Your toggle button -->
 *     <button (click)="toggleCoachPanel()">🧙 Ask AI Coach</button>
 *   `
 * })
 * export class AppComponent {
 *   isCoachOpen = false;
 *   isCoachTyping = false;
 *   isSendingMessage = false;
 *   showSuggestions = true;
 *   currentCoachMood: 'neutral' | 'happy' | 'excited' | 'thinking' = 'neutral';
 *
 *   coachMessages: CoachMessage[] = [
 *     {
 *       id: '1',
 *       role: 'coach',
 *       content: 'Welcome, seeker! I\\'m here to illuminate the paths of relational wisdom. What aspect of relationships would you like to explore today?',
 *       timestamp: new Date(),
 *       coachMood: 'neutral'
 *     }
 *   ];
 *
 *   suggestedQuestions = [
 *     { id: '1', text: 'What makes relationships thrive?' },
 *     { id: '2', text: 'How do I build deeper connections?' },
 *     { id: '3', text: 'Tell me about healthy boundaries' }
 *   ];
 *
 *   toggleCoachPanel() {
 *     this.isCoachOpen = !this.isCoachOpen;
 *   }
 *
 *   closeCoachPanel() {
 *     this.isCoachOpen = false;
 *   }
 *
 *   handleCoachMessage(message: string) {
 *     // Add user message
 *     this.coachMessages.push({
 *       id: Date.now().toString(),
 *       role: 'user',
 *       content: message,
 *       timestamp: new Date()
 *     });
 *
 *     // Show typing indicator
 *     this.isCoachTyping = true;
 *     this.currentCoachMood = 'thinking';
 *
 *     // Simulate AI response (replace with actual API call)
 *     setTimeout(() => {
 *       this.isCoachTyping = false;
 *       this.currentCoachMood = 'happy';
 *
 *       this.coachMessages.push({
 *         id: (Date.now() + 1).toString(),
 *         role: 'coach',
 *         content: 'That is a wonderful question! Let me share some wisdom about that...',
 *         timestamp: new Date(),
 *         coachMood: 'happy'
 *       });
 *     }, 2000);
 *   }
 * }
 * ```
 *
 * CUSTOMIZATION OPTIONS:
 *
 * 1. Coach Moods:
 *    - 'neutral': Default wisdom face
 *    - 'happy': Slight smile, welcoming
 *    - 'excited': Eyes wide, wings flutter, sparkles appear
 *    - 'thinking': Thoughtful expression, gentle tilt
 *
 * 2. Message Styling:
 *    - Coach messages use storybook prose with italic serif font
 *    - User messages use clean sans-serif with accent blue tint
 *    - Messages support basic markdown (bold, italic, line breaks)
 *
 * 3. Suggestion Chips:
 *    - Automatically styled as pill buttons with sketchy borders
 *    - Click to auto-populate and send
 *    - Can be hidden with showSuggestions = false
 *
 * 4. Animations:
 *    - Messages slide in with scale effect
 *    - Typing indicator pulses
 *    - Character animates based on mood
 *    - All animations respect prefers-reduced-motion
 *
 * DESIGN TOKENS USED:
 * - --paper-panel: #fdfbf6 (warm cream background)
 * - --ink-main: #4a3e35 (dark brown text)
 * - --accent-blue: #70a1d7 (primary accent color)
 * - --border-sketchy: 2px solid var(--ink-main) (hand-drawn border style)
 * - --radius-sketchy: Organic, irregular border radius
 * - --ease-storybook: Bouncy, playful easing function
 *
 * ACCESSIBILITY FEATURES:
 * - ARIA labels on all interactive elements
 * - Keyboard navigation support
 * - Focus indicators with warm glow
 * - Reduced motion support
 * - Semantic HTML structure
 * - Screen reader friendly timestamps
 *
 * PERFORMANCE CONSIDERATIONS:
 * - OnPush change detection strategy
 * - TrackBy functions for ngFor loops (implement with trackByFn)
 * - Lazy scroll to bottom
 * - Optimized animations using transform and opacity
 *
 * FUTURE ENHANCEMENTS:
 * - Voice input/output
 * - Message history persistence
 * - Custom character themes
 * - Multi-language support
 * - Export conversation feature
 */

export interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  timestamp: Date;
  coachMood?: 'neutral' | 'happy' | 'excited' | 'thinking';
}

export interface SuggestedQuestion {
  id: string;
  text: string;
}

/**
 * USAGE PATTERNS:
 *
 * 1. Welcome Message Pattern:
 *    Set coach mood to 'neutral' or 'happy' for the initial greeting
 *
 * 2. Question Response Pattern:
 *    Set mood to 'thinking' while processing, then 'happy' for the answer
 *
 * 3. Excitement Pattern:
 *    Use 'excited' mood for insights, breakthroughs, or positive feedback
 *
 * 4. Suggestion Flow:
 *    Update suggestedQuestions dynamically based on conversation context
 *
 * 5. Progressive Disclosure:
 *    Hide suggestions after first interaction to encourage open dialogue
 */
