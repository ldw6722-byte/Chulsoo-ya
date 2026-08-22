import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'

function resetRequestMessage(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('rate limit')) return '재설정 안내 요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.'
  if (normalized.includes('email address') && normalized.includes('invalid')) return '이메일 주소를 다시 확인해 주세요.'
  return '비밀번호 재설정 안내를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function PasswordResetRequestPage() {
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('next')
  const redirectPath = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/'
  const loginPath = `/auth/login?next=${encodeURIComponent(redirectPath)}`
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: resetError } = await supabaseAuth.requestPasswordReset(email.trim(), redirectPath)
      if (resetError) {
        setError(resetRequestMessage(resetError.message))
        return
      }
      setSent(true)
    } catch (cause) {
      setError(cause instanceof AuthConfigurationError ? cause.message : '비밀번호 재설정 안내를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return <AuthLayout>
    <h1 className="auth-heading">비밀번호 찾기</h1>
    <p className="auth-subtitle">이메일 로그인에 사용한 주소를 입력해 주세요.</p>
    <p className="auth-notice">Google·카카오 로그인 비밀번호는 각 플랫폼에서 관리합니다.</p>
    {sent ? <div className="stack"><p className="auth-success">입력하신 이메일로 비밀번호 재설정 안내를 보냈습니다. 메일함을 확인해 주세요.</p><Link to={loginPath} className="btn btn-primary btn-block">로그인으로 돌아가기</Link></div> : <form className="auth-form" onSubmit={submit}>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="field"><label htmlFor="reset-email">이메일</label><input id="reset-email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="example@email.com" required /></div>
      <button className="btn btn-primary btn-block" type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? '안내를 보내는 중...' : '재설정 안내 받기'}</button>
    </form>}
    <p className="auth-footer-copy"><Link to={loginPath} className="auth-inline-link">로그인으로 돌아가기</Link></p>
  </AuthLayout>
}
