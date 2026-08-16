import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '@/app/useAuth'
import { isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const next = searchParams.get("next")
  const redirectPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"

  useEffect(() => {
    if (!isSupabaseConfigured) { setError("Supabase \uC778\uC99D \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."); return }
    let closed = false
    let subscription: { unsubscribe: () => void } | null = null
    const complete = async () => {
      const session = await supabaseAuth.getSession()
      if (session) {
        await refresh()
        if (!closed) navigate(redirectPath, { replace: true })
        return
      }
      const result = supabaseAuth.onAuthStateChange(async (event, nextSession) => {
        if (event !== "SIGNED_IN" || !nextSession || closed) return
        subscription?.unsubscribe()
        await refresh()
        if (!closed) navigate(redirectPath, { replace: true })
      })
      subscription = result.data.subscription
    }
    void complete().catch((cause: unknown) => { if (!closed) setError(cause instanceof Error ? cause.message : "로그인 세션을 확인하지 못했습니다.") })
    const timeout = window.setTimeout(() => { if (!closed) setError("\uB85C\uADF8\uC778 \uC138\uC158\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.") }, 7000)
    return () => { closed = true; window.clearTimeout(timeout); subscription?.unsubscribe() }
  }, [navigate, redirectPath, refresh])

  return <AuthLayout>{error ? (
    <div className="stack">
      <h1 className="auth-heading">{"\uB85C\uADF8\uC778\uC744 \uC644\uB8CC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}</h1>
      <p className="field-error" role="alert">{error}</p>
      <Link to="/auth/login" className="btn btn-primary btn-block">{"\uB85C\uADF8\uC778\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"}</Link>
    </div>
  ) : (
    <div className="stack" style={{ textAlign: "center", padding: "var(--sp-4) 0" }} role="status">
      <h1 className="auth-heading">{"\uB85C\uADF8\uC778 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4."}</h1>
      <p className="auth-subtitle">{"\uC7A0\uC2DC\uB9CC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694."}</p>
    </div>
  )}</AuthLayout>
}
