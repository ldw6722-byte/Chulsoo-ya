import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { setAccessToken } from '@/lib/auth-session'
import { isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import type { AuthenticatedUser } from '@/types/api'
import { useIdentity } from './useIdentity'
import { AuthContext } from './auth-context'

/**
 * Kordeal의 중앙 인증 상태 모델을 참조하되, 동기화 권위는 Spring Boot JWT 검증 결과로 제한한다.
 * OAuth·이메일 세션은 Supabase가 관리하고, 역할은 백엔드 users.role만 사용한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setIdentity } = useIdentity()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const synchronize = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setAccessToken(null)
        setUser(null)
        setIdentity(null)
        return
      }

      setAccessToken(session.access_token)
      const response = await authApi.me()
      setUser(response.user)
      setIdentity({ userId: response.user.id, role: response.user.role, name: response.user.name })
    },
    [setIdentity],
  )

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await synchronize(await supabaseAuth.getSession())
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : '로그인 정보를 확인할 수 없습니다.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [synchronize])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    void refresh()
    const { data } = supabaseAuth.onAuthStateChange((_event, session) => {
      void synchronize(session).catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : '사용자 정보를 동기화할 수 없습니다.')
      })
    })
    return () => data.subscription.unsubscribe()
  }, [refresh, synchronize])

  const signOut = useCallback(async () => {
    setError(null)
    const { error: signOutError } = await supabaseAuth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      return
    }
    await synchronize(null)
  }, [synchronize])

  const value = useMemo(
    () => ({ configured: isSupabaseConfigured, user, isLoading, error, refresh, signOut }),
    [error, isLoading, refresh, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
