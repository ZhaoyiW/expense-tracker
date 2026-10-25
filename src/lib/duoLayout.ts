// iPhone Duo display detection, as CSS media queries.
//
// Registered as Tailwind screens in tailwind.config.ts so layout switches in
// CSS (no flash of the phone layout before hydration).
//
// Measured on a Duo in Safari: outer portrait 382×590, inner landscape 951×538.
// Opened from the home screen the viewport is bigger: no URL bar, and on the
// outer display no Safari toolbar column on the right (screen is 466 wide).
// So the queries don't pin exact sizes; they use orientation, aspect ratio and
// a loose width range, which hold in both Safari and home-screen mode.
//
// - Outer portrait is squat (~0.65–0.69); normal iPhones in portrait are ≤0.56.
// - In landscape, normal iPhones are wider than 2:1; the Duo's displays aren't.
// - pointer: coarse keeps resized desktop windows out.
// - screen.width/height aren't usable: Safari reported the outer screen's
//   size while on the inner display.

const touch = '(pointer: coarse)'

export const DUO_QUERIES = {
  outerPortrait: `${touch} and (orientation: portrait) and (max-width: 520px) and (min-aspect-ratio: 3/5)`,
  outerLandscape: `${touch} and (orientation: landscape) and (max-width: 799px) and (max-aspect-ratio: 2/1)`,
  innerPortrait: `${touch} and (orientation: portrait) and (min-width: 560px) and (max-width: 760px)`,
  innerLandscape: `${touch} and (orientation: landscape) and (min-width: 800px) and (max-width: 1100px) and (max-aspect-ratio: 2/1)`,
} as const

const q = DUO_QUERIES

// Tailwind screens (used as `duo-rail:`, `duo-outer:` etc.)
export const DUO_SCREENS = {
  // Displays that use the right-side NavRail instead of BottomNav/Sidebar
  'duo-rail': { raw: [q.outerPortrait, q.outerLandscape, q.innerLandscape].join(', ') },
  'duo-outer': { raw: [q.outerPortrait, q.outerLandscape].join(', ') },
  'duo-inner-p': { raw: q.innerPortrait },
  'duo-inner-l': { raw: q.innerLandscape },
}
