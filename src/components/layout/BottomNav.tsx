'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, TrendingUp, Sparkles, Landmark } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/insights', label: 'Insights', icon: Sparkles },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Txns', icon: List },
  { href: '/ytd', label: 'YTD', icon: TrendingUp },
  { href: '/investment', label: 'Invest', icon: Landmark },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-mo-card border-t border-mo-border pb-safe">
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className={clsx(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-colors text-2xs font-medium',
                active ? 'bg-brand-subtle text-brand-dark' : 'text-mo-muted'
              )}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
