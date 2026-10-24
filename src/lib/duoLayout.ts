// iPhone Duo display detection, as CSS media queries.
//
// Same queries as weight_control/app/lib/duoLayout.ts — keep the two in sync.
// They're registered as Tailwind screens in tailwind.config.ts so layout
// switches in CSS (no flash of the phone layout before hydration).
//
// The numbers come from WebKit's published Safari viewport table for the Duo,
// not a stable Apple API, so if Safari's viewport sizes change only these
// strings need updating.
//
// A Duo outer display (382pt) overlaps a normal iPhone's portrait width, so
// outerPortrait adds a min-aspect-ratio check: the outer display is squatter
// (~0.62) than any current iPhone in portrait (~0.46–0.56).

export const DUO_QUERIES = {
  outerPortrait: '(min-width: 370px) and (max-width: 420px) and (min-aspect-ratio: 3/5)',
  outerLandscape: '(min-width: 570px) and (max-width: 620px) and (orientation: landscape)',
  innerPortrait: '(min-width: 640px) and (max-width: 700px) and (orientation: portrait)',
  innerLandscape: '(min-width: 900px) and (max-width: 1000px) and (orientation: landscape) and (max-aspect-ratio: 9/5)',
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
