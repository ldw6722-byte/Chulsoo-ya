import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { authApi } from "@/api/endpoints"
import { ApiError } from "@/api/client"
import { loadAuthSnapshot, saveAuthSnapshot, setAccessToken } from "@/lib/auth-session"
import { isSupabaseConfigured, supabaseAuth } from "@/lib/supabase"
import type { AuthenticatedUser } from "@/types/api"
import { useIdentity } from "./useIdentity"
import { AuthContext } from "./auth-context"
import { notify } from "@/lib/notify"

function fallbackUser(session: Session): AuthenticatedUser {
  const name = session.user.email?.split("@")[0] ?? "\uD68C\uC6D0"
  return { id: 0, supabaseUserId: session.user.id, email: session.user.email ?? "", name, role: "CONSUMER" }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setIdentity } = useIdentity()
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const cached = loadAuthSnapshot()
    return cached ? { id: 0, supabaseUserId: cached.supabaseUserId, email: cached.email, name: cached.name, role: "CONSUMER" } : null
  })
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const applySession = useCallback(async (session: Session | null, clear = false) => {
    if (!session) {
      setAccessToken(null)
      if (clear) { saveAuthSnapshot(null); setUser(null); setIdentity(null) }
      return
    }
    const fallback = fallbackUser(session)
    setAccessToken(session.access_token)
    saveAuthSnapshot({ supabaseUserId: fallback.supabaseUserId, email: fallback.email, name: fallback.name })
    setUser(fallback)
    setIdentity({ userId: 0, role: "CONSUMER", name: fallback.name })
    try {
      const response = await authApi.me()
      setUser(response.user)
      setIdentity({ userId: response.user.id, role: response.user.role, name: response.user.name })
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "\uD68C\uC6D0 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.")
    }
  }, [setIdentity])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const session = await supabaseAuth.getSession()
      void applySession(session)
    } finally { setIsLoading(false) }
  }, [applySession])

  useEffect(() => {
    if (!isSupabaseConfigured) { setIsLoading(false); return }
    void refresh()
    const { data } = supabaseAuth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { void applySession(null, true); return }
      if (session) { void applySession(session); if (event === "SIGNED_IN") notify("로그인되었습니다.") }
    })
    return () => data.subscription.unsubscribe()
  }, [applySession, refresh])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabaseAuth.signOut()
    if (signOutError) { setError(signOutError.message); notify(signOutError.message, "error"); return }
    await applySession(null, true)
    notify("\uB85C\uADF8\uC544\uC6C3\uB418\uC5C8\uC2B5\uB2C8\uB2E4.")
  }, [applySession])
  const value = useMemo(() => ({ configured: isSupabaseConfigured, user, isLoading, error, refresh, signOut }), [error, isLoading, refresh, signOut, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
