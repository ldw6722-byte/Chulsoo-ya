import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import type { ReactNode } from 'react'
import { useAuth } from './useAuth'
import { useIdentity } from './useIdentity'
import { isSupabaseConfigured } from '@/lib/supabase'

import { EmptyView, LoadingView } from '@/components/StateViews'
import type { UserRole } from '@/types/api'

const ROLE_LABEL: Record<UserRole, string> = {
  CONSUMER: '소비자',
  SELLER: '판매자',
  ADMIN: '관리자',
}

const DEVELOPMENT_ADMIN = { userId: 2, role: 'ADMIN' as const, name: '운영자' }

/**
 * 지정 역할이 아니면 화면을 렌더링하지 않는다.
 * ponytail: 개발 모드의 직접 /admin 진입은 시드 관리자 신원을 먼저 저장한다.
 * upgrade path: 운영 전환 시 Supabase 관리자 로그인·서버 권한 검증만 사용한다.
 */
export function RequireIdentity({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { identity, setIdentity } = useIdentity()
  const { user, isLoading, error, refresh } = useAuth()
  const location = useLocation()
  const authenticatedIdentity = user ? { userId: user.id, role: user.role, name: user.name } : null
  const effectiveIdentity = isSupabaseConfigured ? authenticatedIdentity : (identity ?? authenticatedIdentity)
  const useDevelopmentAdmin = import.meta.env.DEV && !isSupabaseConfigured && roles.length === 1 && roles[0] === 'ADMIN'

  useEffect(() => {
    if (useDevelopmentAdmin && identity?.role !== "ADMIN") setIdentity(DEVELOPMENT_ADMIN)
  }, [identity, setIdentity, useDevelopmentAdmin])

  if (useDevelopmentAdmin && identity?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <LoadingView label="개발 관리자 화면을 준비하는 중입니다" />
      </div>
    )
  }

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 px-4 py-16"><LoadingView label="로그인 정보를 확인하는 중입니다" /></div>
  }

  if (error && !effectiveIdentity) {
    return (
      <div className="page">
        <EmptyView
          title="회원 권한을 확인하지 못했습니다"
          description="연결이 안정된 뒤 다시 시도해 주세요. 역할이 일반회원으로 변경된 것은 아닙니다."
          action={<button type="button" className="btn btn-primary" onClick={() => { void refresh() }}>다시 시도</button>}
        />
      </div>
    )
  }

  if (!effectiveIdentity) {
    const next = location.pathname + location.search
    return <Navigate to={`/auth/login?next=${encodeURIComponent(next)}`} replace />
  }

    if (!roles.includes(effectiveIdentity.role)) {

    return (
      <div className="page">
        <EmptyView
          title="접근 권한이 없습니다"
          description={`이 화면은 ${roles.map((role) => ROLE_LABEL[role]).join(' 또는 ')} 계정으로만 이용할 수 있습니다.`}
        />
      </div>
    )
  }

  return <>{children}</>
}
