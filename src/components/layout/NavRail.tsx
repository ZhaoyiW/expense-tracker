'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { navItems } from './navItems'

// Floating icon pill at the bottom right, for iPhone Duo outer display and
// inner display in landscape. Sits in the status-bar column on the right
// (safe-area-inset-right) when there is one; see .nav-rail in globals.css.
export function NavRail() {
  const pathname = usePathname()

  return (
    <nav className="nav-rail hidden duo-rail:flex fixed z-40 flex-col items-center gap-1 p-1.5 rounded-full bg-mo-card/70 backdrop-blur-xl border border-mo-border/60 shadow-fab">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={clsx(
              'w-11 h-11 flex items-center justify-center rounded-full active:scale-95',
              active ? 'bg-brand-subtle text-brand-dark' : 'text-mo-muted'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          </Link>
        )
      })}
    </nav>
  )
}
