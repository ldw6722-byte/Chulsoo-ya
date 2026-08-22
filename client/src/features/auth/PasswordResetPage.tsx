import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { clearAuthSessionPolicy, startAuthSession } from '@/lib/auth-session'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'

export function PasswordResetPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('next')
  const redirectPath = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/'
  const forgotPasswordPath = `/auth/forgot-password?next=${encodeURIComponent(redirectPath)}`
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    const verifyRecoverySession = async () => {
      try {
        const session = await supabaseAuth.getSession()
        if (active) setReady(Boolean(session))
      } catch {
        if (active) setReady(false)
      }
    }
    void verifyRecoverySession()
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('비밀번호는 8자 이상으로 입력해 주세요.')
      return
    }
    if (password !== confirmation) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      startAuthSession(false)
      const { error: updateError } = await supabaseAuth.updatePassword(password)
      if (updateError) {
        setError(updateError.message)
        return
      }
      await supabaseAuth.signOut('local')
      clearAuthSessionPolicy()
      navigate(`/auth/login?reset=done&next=${encodeURIComponent(redirectPath)}`, { replace: true })
    } catch (cause) {
      setError(cause instanceof AuthConfigurationError ? cause.message : '비밀번호를 변경하지 못했습니다. 재설정 메일을 다시 요청해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return <AuthLayout>
    <h1 className="auth-heading">새 비밀번호 설정</h1>
    <p className="auth-subtitle">새 비밀번호를 설정한 뒤 다시 로그인해 주세요.</p>
    {!ready ? <div className="stack"><p className="auth-notice">유효한 재설정 링크인지 확인하고 있습니다. 잠시 후에도 열리지 않으면 재설정 안내를 다시 요청해 주세요.</p><Link to={forgotPasswordPath} className="btn btn-primary btn-block">재설정 안내 다시 받기</Link></div> : <form className="auth-form" onSubmit={submit}>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="field"><label htmlFor="reset-password">새 비밀번호</label><input id="reset-password" className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="8자 이상 입력해 주세요" required /></div>
      <div className="field"><label htmlFor="reset-password-confirmation">새 비밀번호 확인</label><input id="reset-password-confirmation" className="input" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" placeholder="새 비밀번호를 다시 입력해 주세요" required /></div>
      <button className="btn btn-primary btn-block" type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? '변경하는 중...' : '비밀번호 변경하기'}</button>
    </form>}
  </AuthLayout>
}
