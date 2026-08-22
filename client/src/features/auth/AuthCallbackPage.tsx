import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '@/app/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading, error } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  const next = searchParams.get("next")
  const redirectPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"

  useEffect(() => {
    if (!user) return
    navigate(redirectPath, { replace: true })
  }, [navigate, redirectPath, user])

  useEffect(() => {
    if (!isSupabaseConfigured || user || error) return
    const timeout = window.setTimeout(() => setTimedOut(true), 7000)
    return () => window.clearTimeout(timeout)
  }, [error, user])

  const failureMessage = !isSupabaseConfigured
    ? "Supabase 인증 설정이 필요합니다."
    : error ?? (timedOut ? "로그인 세션을 확인하지 못했습니다." : null)

  return <AuthLayout>{failureMessage ? (
    <div className="stack">
      <h1 className="auth-heading">로그인을 완료하지 못했습니다.</h1>
      <p className="field-error" role="alert">{failureMessage}</p>
      <Link to={`/auth/login?next=${encodeURIComponent(redirectPath)}`} className="btn btn-primary btn-block">로그인으로 돌아가기</Link>
    </div>
  ) : (
    <div className="stack" style={{ textAlign: "center", padding: "var(--sp-4) 0" }} role="status">
      <h1 className="auth-heading">로그인 정보를 확인하고 있습니다.</h1>
      <p className="auth-subtitle">{isLoading ? "회원 권한을 확인하고 있습니다." : "잠시만 기다려 주세요."}</p>
    </div>
  )}</AuthLayout>
}
