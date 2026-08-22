import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { authApi } from "@/api/endpoints"
import { ApiError } from "@/api/client"
import { clearAuthSessionPolicy, getAuthSessionRemainingMs, isAuthSessionExpired, recordAuthActivity, setAccessToken } from "@/lib/auth-session"
import { clearAdminViewState } from "@/lib/admin-view"

import { isSupabaseConfigured, supabaseAuth } from "@/lib/supabase"
import type { AuthenticatedUser } from "@/types/api"
import { useIdentity } from "./useIdentity"
import { AuthContext } from "./auth-context"
import { notify } from "@/lib/notify"

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setIdentity } = useIdentity()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const synchronizationSequence = useRef(0)

  const applySession = useCallback(async (session: Session | null, sequence: number): Promise<AuthenticatedUser | null> => {
    // 늦게 끝난 초기 세션 조회·토큰 갱신 요청은 최신 로그인 상태를 덮어쓰지 못한다.
    if (sequence !== synchronizationSequence.current) return null

        if (!session) {
      setAccessToken(null)
      clearAuthSessionPolicy()
      clearAdminViewState()

      setUser(null)
      setIdentity(null)
      setError(null)
      return null
    }

    // DB 역할은 /auth/me 성공 응답만 신뢰한다. 임시 CONSUMER 역할은 관리자 경로를 오판하게 만든다.
    setAccessToken(session.access_token)
    setError(null)
    try {
      const authenticatedUser = await authApi.me()
      if (sequence !== synchronizationSequence.current) return null
      setUser(authenticatedUser)
      setIdentity({ userId: authenticatedUser.id, role: authenticatedUser.role, name: authenticatedUser.name })
      return authenticatedUser
    } catch (cause) {
      if (sequence !== synchronizationSequence.current) return null
      setAccessToken(null)
      setUser(null)
      setIdentity(null)
      setError(cause instanceof ApiError ? cause.message : "회원 권한을 확인하지 못했습니다.")
      return null
    }
  }, [setIdentity])

  const synchronizeSession = useCallback(async (session: Session | null) => {
    const sequence = ++synchronizationSequence.current
    return applySession(session, sequence)
  }, [applySession])

  const refresh = useCallback(async (): Promise<AuthenticatedUser | null> => {
    if (!isSupabaseConfigured) { setIsLoading(false); return null }
    // 요청 시작 순서를 먼저 고정해야 초기 getSession()의 늦은 null 응답이 새 로그인 상태를 지우지 못한다.
    const sequence = ++synchronizationSequence.current
    setIsLoading(true)
    try {
      const session = await supabaseAuth.getSession()
      return await applySession(session, sequence)
    } finally { setIsLoading(false) }
  }, [applySession])

  useEffect(() => {
    if (!isSupabaseConfigured) { setIsLoading(false); return }
    void refresh()
    const { data } = supabaseAuth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") notify("로그인되었습니다.")
      void synchronizeSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [refresh, synchronizeSession])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabaseAuth.signOut()
    if (signOutError) { setError(signOutError.message); notify(signOutError.message, "error"); return }
    await synchronizeSession(null)
    notify("로그아웃되었습니다.")
  }, [synchronizeSession])

  const expireForInactivity = useCallback(async () => {
    if (!isAuthSessionExpired()) return
    await supabaseAuth.signOut("local")
    await synchronizeSession(null)
    notify("30분 동안 활동이 없어 로그아웃되었습니다.", "error")
    const next = window.location.pathname + window.location.search
    window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`)
  }, [synchronizeSession])

  useEffect(() => {
    if (!user) return
    let timeoutId: number | null = null
    const scheduleExpiry = () => {
      const remaining = getAuthSessionRemainingMs()
      if (remaining === null) return
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => { void expireForInactivity() }, remaining)
    }
    if (isAuthSessionExpired()) { void expireForInactivity(); return }
    const recordActivity = () => { recordAuthActivity(); scheduleExpiry() }
    const events: Array<keyof WindowEventMap> = ["mousedown", "keydown", "touchstart", "scroll"]
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }))
    scheduleExpiry()
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, recordActivity))
    }
  }, [expireForInactivity, user])

  const value = useMemo(() => ({ configured: isSupabaseConfigured, user, isLoading, error, refresh, signOut }), [error, isLoading, refresh, signOut, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
