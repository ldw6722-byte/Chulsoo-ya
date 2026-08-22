import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { maintenanceApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'

function MaintenancePage({ updatedAt, onRetry }: { updatedAt: string; onRetry: () => void }) {
  const lastUpdated = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt))
  return (
    <div className="shop-theme flex min-h-screen items-center justify-center bg-slate-50 p-5 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <main className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
        <div className="h-2 bg-gradient-to-r from-brand-500 via-violet-500 to-brand-500" />
        <div className="px-7 py-10 text-center sm:px-12">
          <p className="text-sm font-black tracking-wide text-brand-600 dark:text-brand-300">CHULSOO-YA SERVICE</p>
          <div aria-hidden="true" className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.7"><path d="M14.7 6.2a4.5 4.5 0 0 0-5.4 5.4L3.7 17.2a1.6 1.6 0 0 0 2.3 2.3l5.6-5.6a4.5 4.5 0 0 0 5.4-5.4l-2.8 2.1-2.5-.4-.4-2.5 2.1-2.8Z" /><path d="m15.8 15.8 3.1 3.1" /></svg>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-white">서비스 점검 중입니다</h1>
          <p className="mt-4 break-keep text-base leading-7 text-slate-600 dark:text-slate-300">더 안정적인 철물 주문·매칭 서비스를 준비하고 있습니다.<br />잠시 후 다시 이용해 주세요.</p>
          <button type="button" onClick={onRetry} className="mt-8 min-h-12 rounded-xl bg-brand-600 px-6 text-sm font-black text-white transition hover:bg-brand-700">상태 다시 확인</button>
          <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">마지막 점검 상태 변경: {lastUpdated}</p>
        </div>
      </main>
    </div>
  )
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isLoading: isAuthLoading, user } = useAuth()
  const status = useAsync(() => maintenanceApi.status(), [], { pollMs: 15_000 })
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isAdminRecoveryLogin = location.pathname === '/auth/login' && new URLSearchParams(location.search).get('next')?.startsWith('/admin')
  const highestAdministrator = user?.role === 'ADMIN' && user.adminLevel === 'HIGHEST'
  const allowAdminRecovery = isAdminRoute && (isAuthLoading || !user || highestAdministrator)

  if (status.data?.enabled && !allowAdminRecovery && !isAdminRecoveryLogin) return <MaintenancePage updatedAt={status.data.updatedAt} onRetry={status.reload} />
  return <>{children}</>
}
