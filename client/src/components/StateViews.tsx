import type { ReactNode } from 'react'
import { ApiError } from '@/api/client'

/** README.ko.md 3.6: 모든 라우트는 로딩·빈 결과·오류 상태를 정의해야 한다. */

export function LoadingView({ label = '불러오는 중입니다' }: { label?: string }) {
  return (
    <div className="card" style={{ padding: 'var(--sp-5)', textAlign: 'center' }} role="status" aria-live="polite">
      <p className="muted">{label}…</p>
    </div>
  )
}

export function EmptyView({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card stack" style={{ padding: 'var(--sp-5)', textAlign: 'center' }}>
      <p style={{ fontWeight: 700 }}>{title}</p>
      {description ? <p className="muted">{description}</p> : null}
      {action}
    </div>
  )
}

type ServiceState = 'connection' | 'maintenance' | 'retry'

function getServiceState(error: ApiError): { state: ServiceState; eyebrow: string; title: string; description: string } {
  if (error.status === 0 || error.code === 'NETWORK_ERROR') {
    return { state: 'connection', eyebrow: 'CONNECTION CHECK', title: '서버 연결을 확인하고 있습니다', description: '잠시 후 다시 시도해 주세요. 인터넷 연결이나 서비스 상태를 확인하고 있습니다.' }
  }
  if (error.status >= 500 || error.code === 'TIMEOUT') {
    return { state: 'maintenance', eyebrow: 'SERVICE UPDATE', title: '서비스를 준비하고 있습니다', description: '더 안정적인 서비스를 위해 잠시 점검 중입니다. 잠시 후 다시 이용해 주세요.' }
  }
  return { state: 'retry', eyebrow: 'SERVICE NOTICE', title: '요청을 처리하지 못했습니다', description: '입력한 내용을 다시 확인하거나 잠시 후 다시 시도해 주세요.' }
}

function ServiceStateIcon({ state }: { state: ServiceState }) {
  const iconClass = state === 'maintenance' ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : state === 'connection' ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200' : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
  return <span aria-hidden="true" className={'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ' + iconClass}><svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.9">{state === 'maintenance' ? <><path d="M14.7 6.2a4.5 4.5 0 0 0-5.4 5.4L3.7 17.2a1.6 1.6 0 0 0 2.3 2.3l5.6-5.6a4.5 4.5 0 0 0 5.4-5.4l-2.8 2.1-2.5-.4-.4-2.5 2.1-2.8Z" /><path d="m15.8 15.8 3.1 3.1" /></> : state === 'connection' ? <><path d="M4 15.5a8.5 8.5 0 0 1 16 0" /><path d="M7.5 15.5a5 5 0 0 1 9 0" /><path d="M11.8 19.5h.4" /></> : <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.8v4.7" /><path d="M12 16.1h.01" /></>}</svg></span>
}

export function ErrorView({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const content = getServiceState(error)
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900" role="alert" aria-live="polite">
      <div className="flex items-start gap-4">
        <ServiceStateIcon state={content.state} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">{content.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{content.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{content.description}</p>
        </div>
      </div>
      {onRetry ? <button type="button" onClick={onRetry} className="mt-5 min-h-11 w-full rounded-xl border border-brand-300 bg-white px-4 text-sm font-black text-brand-700 transition hover:border-brand-500 hover:bg-brand-50 dark:border-brand-800 dark:bg-slate-800 dark:text-brand-200 dark:hover:bg-brand-950/40">다시 시도</button> : null}
      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">문제가 계속되면 잠시 후 다시 접속해 주세요.</p>
    </section>
  )
}

export function InlineNotice({
  tone,
  children,
}: {
  tone: 'info' | 'warning' | 'danger' | 'success'
  children: ReactNode
}) {
  const toneClass = {
    info: 'badge-info',
    warning: 'badge-warning',
    danger: 'badge-danger',
    success: 'badge-success',
  }[tone]
  const label = { info: '안내', warning: '주의', danger: '경고', success: '완료' }[tone]

  return (
    <div className="card row" style={{ padding: 'var(--sp-3)', alignItems: 'flex-start' }}>
      <span className={`badge ${toneClass}`}>{label}</span>
      <span className="muted" style={{ color: 'var(--c-text)' }}>
        {children}
      </span>
    </div>
  )
}
