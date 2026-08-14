import {
  trigger,
  style,
  animate,
  transition,
  keyframes,
  query,
  stagger,
  state
} from '@angular/animations';

// === SCREEN TRANSITIONS ===
export const pageTransition = trigger('pageTransition', [
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

// === CARD ANIMATIONS ===
export const cardSlideUp = trigger('cardSlideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(100%) scale(0.95)' }),
    animate('500ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
]);

export const cardPopIn = trigger('cardPopIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

export const fadeScale = trigger('fadeScale', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('{{duration}} {{easing}}', style({ opacity: 1, transform: 'scale(1)' }))
  ], { params: { duration: '500ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' } })
]);

// === STAGGER ENTRANCE ===
export const staggerIn = trigger('staggerIn', [
  transition(':enter', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('100ms', animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
]);

// === BLOB CHARACTER ===
export const blobBounce = trigger('blobBounce', [
  state('idle', style({ transform: 'scale(1)' })),
  state('active', style({ transform: 'scale(1.15)' })),
  transition('idle => active', [
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(1.2) translateY(-5px)' }),
      style({ transform: 'scale(1.15)' })
    ]))
  ]),
  transition('active => idle', [
    animate('200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ transform: 'scale(1)' }))
  ])
]);

// === BUTTON INTERACTIONS ===
export const pressSpring = trigger('pressSpring', [
  transition('* => pressed', [
    animate('150ms ease-out', style({ transform: 'scale(0.95)' }))
  ]),
  transition('pressed => *', [
    animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)' }))
  ])
]);

// === PROGRESS BAR ===
export const progressFill = trigger('progressFill', [
  transition(':enter', [
    style({ width: '0%' }),
    animate('800ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ width: '{{value}}%' }))
  ], { params: { value: 0 } })
]);

// === ATTRIBUTE BARS ===
export const attrBarFill = trigger('attrBarFill', [
  transition(':enter', [
    style({ width: '0%' }),
    animate('800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ width: '{{value}}%' }))
  ], { params: { value: 0 } })
]);

// === TOGGLE PANELS ===
export const slideToggle = trigger('slideToggle', [
  state('open', style({ opacity: 1, transform: 'translateY(0)', visibility: 'visible' })),
  state('closed', style({ opacity: 0, transform: 'translateY(-10px)', visibility: 'hidden' })),
  transition('closed => open', [
    animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)')
  ]),
  transition('open => closed', [
    animate('200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
  ])
]);

export const slideRight = trigger('slideRight', [
  state('open', style({ transform: 'translateX(0)', opacity: 1 })),
  state('closed', style({ transform: 'translateX(-100%)', opacity: 0 })),
  transition('closed => open', [
    animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)')
  ]),
  transition('open => closed', [
    animate('200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
  ])
]);

// === MODAL ===
export const modalOpen = trigger('modalOpen', [
  state('open', style({ opacity: 1, pointerEvents: 'auto' })),
  state('closed', style({ opacity: 0, pointerEvents: 'none' })),
  transition('closed => open', [
    query('.modal-content', [
      style({ opacity: 0, transform: 'scale(0.9)' }),
      animate('300ms 100ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
    ], { optional: true }),
    animate('200ms ease-out')
  ]),
  transition('open => closed', [
    query('.modal-content', [
      animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
    ], { optional: true }),
    animate('200ms ease-in')
  ])
]);

// === BOOK CLOSE (loading -> intro transition) ===
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

// === CRYSTAL BALL ===
export const crystalPulse = trigger('crystalPulse', [
  transition(':enter', [
    animate('2s ease-in-out infinite', keyframes([
      style({ transform: 'scale(1)', boxShadow: 'inset 0 0 30px #70a1d7, 0 10px 30px rgba(74,62,53,0.3)' }),
      style({ transform: 'scale(1.05)', boxShadow: 'inset 0 0 50px #70a1d7, 0 15px 40px rgba(74,62,53,0.4)' }),
      style({ transform: 'scale(1)', boxShadow: 'inset 0 0 30px #70a1d7, 0 10px 30px rgba(74,62,53,0.3)' })
    ]))
  ])
]);
