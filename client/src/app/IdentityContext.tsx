import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loadIdentity, saveIdentity } from '@/api/client'
import type { Identity } from '@/api/client'
import { IdentityContext } from './identity-context'

/**
 * 현재 사용자 신원 보관.
 * ponytail: 개발 단계에서는 로컬 스토리지 + 요청 헤더로 역할을 전환한다.
 * upgrade path: Supabase Auth 세션으로 교체하고 setIdentity 를 제거한다.
 */
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<Identity | null>(() => loadIdentity())

  const setIdentity = useCallback((next: Identity | null) => {
    saveIdentity(next)
    setIdentityState(next)
  }, [])

  const value = useMemo(() => ({ identity, setIdentity }), [identity, setIdentity])

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
}
