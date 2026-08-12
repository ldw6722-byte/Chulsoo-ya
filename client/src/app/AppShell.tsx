import { Outlet, useLocation } from 'react-router-dom'
import { ShopFooter } from '@/components/shop/ShopFooter'
import { ShopHeader } from '@/components/shop/ShopHeader'

export function AppShell() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/auth/')

  if (isAuthRoute) return <Outlet />

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <ShopHeader />
      <main className="min-h-0 flex-1"><Outlet /></main>
      <ShopFooter />
    </div>
  )
}
