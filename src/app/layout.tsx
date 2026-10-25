import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { NavRail } from '@/components/layout/NavRail'
import { SwRegister } from '@/components/layout/SwRegister'

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Personal expense and income tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    // Lets the page draw under the status bar, so on the Duo the NavRail can
    // sit in the status-bar column on the right. iOS then shows white status text.
    statusBarStyle: 'black-translucent',
    title: 'Expenses',
  },
}

export const viewport: Viewport = {
  themeColor: '#A89880',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="flex h-dvh overflow-hidden bg-mo-bg safe-shell duo-rail:pr-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0 duo-rail:pb-0 duo-rail:rail-gutter">
          {children}
        </main>
        <NavRail />
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  )
}
