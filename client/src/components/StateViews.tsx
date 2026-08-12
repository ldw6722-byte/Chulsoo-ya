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

export function ErrorView({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="card stack" style={{ padding: 'var(--sp-5)' }} role="alert">
      <div className="row">
        <span className="badge badge-danger">오류</span>
        <span className="subtle">{error.code}</span>
      </div>
      <p>{error.message}</p>
      {onRetry ? (
        <button type="button" className="btn" onClick={onRetry}>
          다시 시도
        </button>
      ) : null}
    </div>
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
