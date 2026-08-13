import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { useAuth } from '@/app/useAuth'
import { AuthLayout } from './AuthLayout'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase 인증 설정이 없습니다.')
      return
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const redirectError = searchParams.get('error_description') ?? searchParams.get('error')
      ?? hashParams.get('error_description') ?? hashParams.get('error')
    if (redirectError) {
      setError(redirectError)
      return
    }

    let active = true
    async function complete() {
      try {
        const code = searchParams.get('code')
        if (code) await supabaseAuth.exchangeCode(code)
        await refresh()
        if (active) navigate('/', { replace: true })
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : '인증을 완료할 수 없습니다.')
      }
    }
    void complete()
    return () => {
      active = false
    }
  }, [navigate, refresh, searchParams])

  return (
    <AuthLayout>
      {error ? (
        <div className="stack">
          <h1 className="auth-heading">인증을 완료하지 못했습니다</h1>
          <p className="field-error" role="alert">{error}</p>
          <Link to="/auth/login" className="btn btn-primary btn-block">
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <div className="stack" style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }} role="status">
          <h1 className="auth-heading">인증 정보를 확인하고 있습니다</h1>
          <p className="auth-subtitle">잠시만 기다려 주세요.</p>
          <div
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              margin: 'var(--sp-3) auto 0',
              border: '3px solid var(--c-primary-weak)',
              borderTopColor: 'var(--c-primary)',
              borderRadius: '50%',
              animation: 'auth-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
    </AuthLayout>
  )
}
