import {
  trigger,
  transition,
  style,
  animate,
  state,
  query,
  stagger,
  animateChild,
  keyframes,
} from '@angular/animations';

// Spring-like easing for natural motion
const springEasing = 'cubic-bezier(0.35, 0, 0.25, 1)';
const easeOut = 'cubic-bezier(0.0, 0.0, 0.2, 1)';

/**
 * Fade in animation - simple opacity transition
 * Usage: [@fadeIn] or [@fadeIn]="'enter'"
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`200ms ${easeOut}`, style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate(`150ms ${easeOut}`, style({ opacity: 0 })),
  ]),
]);

/**
 * Fade slide animation - slide in from direction with fade
 * Usage: [@fadeSlide] or [@fadeSlide]="'fromBottom'"
 */
export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-10px)' }),
    animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'translateY(-10px)' })),
  ]),
]);

/**
 * Scale in animation - scale from center for cards/modals
 * Usage: [@scaleIn]
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate(`250ms ${springEasing}`, style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'scale(0.95)' })),
  ]),
]);

/**
 * Stagger list animation - staggered entrance for list items
 * Usage: [@staggerList]="items.length" on container
 *        [@listItem] on each child
 */
export const staggerList = trigger('staggerList', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger('50ms', [
        animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const listItem = trigger('listItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(15px)' }),
    animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'translateX(-10px)' })),
  ]),
]);

/**
 * Stagger cards animation - staggered entrance for card grids
 * Usage: [@staggerCards]="cards.length" on container
 *        [@cardItem] on each card
 */
export const staggerCards = trigger('staggerCards', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px) scale(0.98)' }),
      stagger('75ms', [
        animate(`350ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const cardItem = trigger('cardItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px) scale(0.98)' }),
    animate(`350ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate(`250ms ${easeOut}`, style({ opacity: 0, transform: 'scale(0.95)' })),
  ]),
]);

/**
 * Shake animation - form validation error feedback
 * Usage: [@shake]="isInvalid"
 */
export const shake = trigger('shake', [
  state('false', style({ transform: 'translateX(0)' })),
  state('true', style({ transform: 'translateX(0)' })),
  transition('false => true', [
    animate('400ms ease-out', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-8px)', offset: 0.1 }),
      style({ transform: 'translateX(8px)', offset: 0.2 }),
      style({ transform: 'translateX(-8px)', offset: 0.3 }),
      style({ transform: 'translateX(8px)', offset: 0.4 }),
      style({ transform: 'translateX(-4px)', offset: 0.5 }),
      style({ transform: 'translateX(4px)', offset: 0.6 }),
      style({ transform: 'translateX(-2px)', offset: 0.7 }),
      style({ transform: 'translateX(2px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 }),
    ])),
  ]),
]);

/**
 * Pulse animation - badge/notification attention grabber
 * Usage: [@pulse]="badgeCount"
 */
export const pulse = trigger('pulse', [
  transition('* => *', [
    animate('300ms ease-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.15)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 }),
    ])),
  ]),
]);

/**
 * Icon rotate animation - smooth icon rotation
 * Usage: [@iconRotate]="isExpanded ? 'expanded' : 'collapsed'"
 */
export const iconRotate = trigger('iconRotate', [
  state('collapsed', style({ transform: 'rotate(0deg)' })),
  state('expanded', style({ transform: 'rotate(180deg)' })),
  transition('collapsed <=> expanded', [
    animate(`250ms ${springEasing}`),
  ]),
]);

/**
 * Enhanced collapse/expand animation with spring easing
 * Usage: [@collapseExpand]="isExpanded ? 'expanded' : 'collapsed'"
 */
export const collapseExpand = trigger('collapseExpand', [
  state('collapsed', style({
    height: '0',
    opacity: 0,
    paddingTop: '0',
    paddingBottom: '0',
    overflow: 'hidden',
  })),
  state('expanded', style({
    height: '*',
    opacity: 1,
    overflow: 'hidden',
  })),
  transition('collapsed => expanded', [
    style({ overflow: 'hidden' }),
    animate(`300ms ${springEasing}`),
  ]),
  transition('expanded => collapsed', [
    style({ overflow: 'hidden' }),
    animate(`250ms ${easeOut}`),
  ]),
]);

/**
 * Slide in from left animation
 * Usage: [@slideInLeft]
 */
export const slideInLeft = trigger('slideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'translateX(-20px)' })),
  ]),
]);

/**
 * Slide in from right animation
 * Usage: [@slideInRight]
 */
export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'translateX(20px)' })),
  ]),
]);

/**
 * Slide in from bottom animation
 * Usage: [@slideInBottom]
 */
export const slideInBottom = trigger('slideInBottom', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(`300ms ${springEasing}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`200ms ${easeOut}`, style({ opacity: 0, transform: 'translateY(20px)' })),
  ]),
]);
