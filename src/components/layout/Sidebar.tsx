'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, TrendingUp, Wallet, Sparkles, Landmark } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/insights', label: 'Insights', icon: Sparkles },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/ytd', label: 'Year-to-Date', icon: TrendingUp },
  { href: '/investment', label: 'Investment', icon: Landmark },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-mo-card border-r border-mo-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-mo-border">
        <div className="w-8 h-8 rounded-2xl bg-brand flex items-center justify-center shadow-soft">
          <Wallet size={15} className="text-white" />
        </div>
        <span className="font-semibold text-mo-text text-base tracking-tight">Expenses</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium',
                active
                  ? 'bg-brand-subtle text-brand-dark'
                  : 'text-mo-muted hover:bg-mo-accent-light hover:text-mo-text'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-brand' : 'text-mo-muted'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-mo-border">
        <p className="text-2xs text-mo-muted">Personal Finance</p>
      </div>
    </aside>
  )
}
