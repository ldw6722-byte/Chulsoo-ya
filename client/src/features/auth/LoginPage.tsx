import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { useAuth } from '@/app/useAuth'
import { AuthLayout } from './AuthLayout'
import { SocialAuthButtons } from './SocialAuthButtons'

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error: signInError } = await supabaseAuth.signInWithEmail(email.trim(), password)
      if (signInError) {
        setError(signInError.message)
        return
      }
      if (!data.session) {
        setError('로그인 세션을 만들지 못했습니다. 이메일 확인 상태를 확인해 주세요.')
        return
      }
      await refresh()
      navigate('/', { replace: true })
    } catch (cause) {
      setError(cause instanceof AuthConfigurationError ? cause.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  async function resendConfirmation() {
    if (!email.trim()) {
      setError('인증 메일을 받을 이메일을 먼저 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setNotice(null)
    try {
      const { error: resendError } = await supabaseAuth.resendSignupEmail(email.trim())
      if (resendError) {
        setError(resendError.message)
        return
      }
      setNotice('새 인증 메일을 보냈습니다. 메일의 링크를 열어 가입을 완료해 주세요.')
    } catch (cause) {
      setError(cause instanceof AuthConfigurationError ? cause.message : '인증 메일을 다시 보내지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <header>
        <h1 className="auth-heading">로그인</h1>
        <p className="auth-subtitle">필요한 공구를 더 빠르게 찾고 주문을 관리해 보세요.</p>
      </header>

      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {notice ? <p className="auth-success" role="status">{notice}</p> : null}

      <section style={{ marginTop: 'var(--sp-5)' }}>
        <SocialAuthButtons action="로그인" disabled={isLoading || !isSupabaseConfigured} onError={setError} />
      </section>

      <div className="auth-divider">또는 이메일로 로그인</div>

      <form className="stack" onSubmit={(event) => void submit(event)} noValidate>
        <div className="field">
          <label htmlFor="login-email">이메일</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            disabled={isLoading || !isSupabaseConfigured}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">비밀번호</label>
          <div className="auth-password-row">
            <input
              id="login-password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              disabled={isLoading || !isSupabaseConfigured}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
            >
              {showPassword ? '숨김' : '표시'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || !isSupabaseConfigured}>
          {isLoading ? '로그인 중…' : '이메일 로그인'}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        style={{ marginTop: 'var(--sp-3)' }}
        disabled={isLoading || !isSupabaseConfigured}
        onClick={() => void resendConfirmation()}
      >
        인증 메일 다시 보내기
      </button>

      {!isSupabaseConfigured ? (
        <p className="auth-notice">
          Supabase 연결 정보가 아직 설정되지 않았습니다. 개발 계정 전환 바를 사용해 기존 주문 기능을 검증할 수 있습니다.
        </p>
      ) : null}

      <p className="auth-footer-copy">
        계정이 없으신가요? <Link to="/auth/signup" className="auth-inline-link">회원가입</Link>
      </p>
    </AuthLayout>
  )
}
