import { LayoutDashboard, List, TrendingUp, Sparkles, Landmark } from 'lucide-react'

// Shared by Sidebar (label), BottomNav (shortLabel) and NavRail (icon only)
export const navItems = [
  { href: '/insights', label: 'Insights', shortLabel: 'Insights', icon: Sparkles },
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', shortLabel: 'Txns', icon: List },
  { href: '/ytd', label: 'Year-to-Date', shortLabel: 'YTD', icon: TrendingUp },
  { href: '/investment', label: 'Investment', shortLabel: 'Invest', icon: Landmark },
]
