import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

const springEasing = 'cubic-bezier(0.35, 0, 0.25, 1)';

/**
 * Route transition animation - cross-fade between routes
 * Usage: Apply to router-outlet wrapper with [@routeAnimations]="outlet.activatedRouteData['animation']"
 *
 * Example in app.component.ts:
 * <div [@routeAnimations]="outlet.activatedRouteData['animation']">
 *   <router-outlet #outlet="outlet" />
 * </div>
 */
export const routeAnimations = trigger('routeAnimations', [
  // Default transition for all route changes
  transition('* <=> *', [
    // Initial styles for entering and leaving pages
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        opacity: 1,
      }),
    ], { optional: true }),

    // Animate both at the same time
    group([
      // Leaving page fades out
      query(':leave', [
        animate(`200ms ${springEasing}`, style({
          opacity: 0,
        })),
      ], { optional: true }),

      // Entering page fades in with slight upward motion
      query(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(8px)',
        }),
        animate(`300ms 100ms ${springEasing}`, style({
          opacity: 1,
          transform: 'translateY(0)',
        })),
      ], { optional: true }),
    ]),
  ]),
]);

/**
 * Slide route animation - pages slide left/right
 * For more dramatic route changes (e.g., drill-down navigation)
 */
export const slideRouteAnimations = trigger('slideRouteAnimations', [
  // Forward navigation (slide left)
  transition(':increment', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
      }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate(`300ms ${springEasing}`, style({
          opacity: 0,
          transform: 'translateX(-30px)',
        })),
      ], { optional: true }),

      query(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(30px)',
        }),
        animate(`300ms ${springEasing}`, style({
          opacity: 1,
          transform: 'translateX(0)',
        })),
      ], { optional: true }),
    ]),
  ]),

  // Backward navigation (slide right)
  transition(':decrement', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
      }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate(`300ms ${springEasing}`, style({
          opacity: 0,
          transform: 'translateX(30px)',
        })),
      ], { optional: true }),

      query(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(-30px)',
        }),
        animate(`300ms ${springEasing}`, style({
          opacity: 1,
          transform: 'translateX(0)',
        })),
      ], { optional: true }),
    ]),
  ]),
]);
