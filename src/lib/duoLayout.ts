// iPhone Duo display detection, as CSS media queries.
//
// Registered as Tailwind screens in tailwind.config.ts so layout switches in
// CSS (no flash of the phone layout before hydration).
//
// Measured on a Duo (CSS px):
//   outer portrait   Safari 382×590   home screen 382×660
//   inner landscape  Safari 951×538   home screen 867×651
// On both displays the status bar is a column on the right (~84px). In
// Safari the outer display also puts its toolbar in that column, so the
// width stays 382 either way. screen.width/height aren't usable: Safari
// reported the outer screen's 466×678 while on the inner display.
//
// - Outer portrait: no iPhone is 379–386 wide (SE/mini 375, others ≥390),
//   so match that width. With viewport-fit=cover the status column becomes
//   part of the viewport (~466 wide), hence the second, squat-aspect range;
//   normal iPhones in portrait are ≤0.6.
// - In landscape, normal iPhones are wider than 2:1; the Duo's displays aren't.
// - pointer: coarse keeps resized desktop windows out.

const touch = '(pointer: coarse)'

export const DUO_QUERIES = {
  outerPortrait: [
    `${touch} and (orientation: portrait) and (min-width: 379px) and (max-width: 386px)`,
    `${touch} and (orientation: portrait) and (min-width: 450px) and (max-width: 520px) and (min-aspect-ratio: 3/5)`,
  ].join(', '),
  outerLandscape: `${touch} and (orientation: landscape) and (max-width: 799px) and (max-aspect-ratio: 2/1)`,
  innerPortrait: `${touch} and (orientation: portrait) and (min-width: 560px) and (max-width: 760px)`,
  innerLandscape: `${touch} and (orientation: landscape) and (min-width: 800px) and (max-width: 1100px) and (max-aspect-ratio: 2/1)`,
} as const

const q = DUO_QUERIES

// Tailwind screens (used as `duo-rail:`, `duo-outer:` etc.)
export const DUO_SCREENS = {
  // Displays that use the floating NavRail instead of BottomNav/Sidebar
  'duo-rail': { raw: [q.outerPortrait, q.outerLandscape, q.innerLandscape].join(', ') },
  'duo-outer': { raw: [q.outerPortrait, q.outerLandscape].join(', ') },
  'duo-inner-p': { raw: q.innerPortrait },
  'duo-inner-l': { raw: q.innerLandscape },
}
