'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { navItems } from './navItems'

// Icon-only nav on the right edge, for iPhone Duo outer display and inner
// display in landscape. Icons sit at the bottom so the right thumb reaches them.
export function NavRail() {
  const pathname = usePathname()

  return (
    <nav
      className="hidden duo-rail:flex flex-col justify-end shrink-0 h-full bg-mo-card border-l border-mo-border pb-safe"
      style={{ paddingRight: 'env(safe-area-inset-right, 0px)' }}
    >
      <div className="flex flex-col items-center gap-1 w-16 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={clsx(
                'w-11 h-11 flex items-center justify-center rounded-2xl active:scale-95',
                active ? 'bg-brand-subtle text-brand-dark' : 'text-mo-muted'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
