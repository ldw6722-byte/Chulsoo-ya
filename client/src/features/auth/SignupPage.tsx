import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { SocialAuthButtons } from './SocialAuthButtons'

export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) return setError('이름을 입력해 주세요.')
    if (!email.trim()) return setError('이메일을 입력해 주세요.')
    if (password.length < 8) return setError('비밀번호는 8자 이상으로 입력해 주세요.')
    if (password !== confirmPassword) return setError('비밀번호가 일치하지 않습니다.')
    if (!termsAccepted) return setError('이용약관과 개인정보처리방침에 동의해 주세요.')

    setIsLoading(true)
    try {
      const { error: signUpError } = await supabaseAuth.signUpWithEmail(email.trim(), password, name.trim())
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      setConfirmationSent(true)
    } catch (cause) {
      setError(cause instanceof AuthConfigurationError ? cause.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <AuthLayout>
        <div className="auth-success" role="status">
          <h1 className="auth-heading">이메일을 확인해 주세요</h1>
          <p className="auth-subtitle" style={{ marginTop: 'var(--sp-3)' }}>
            <strong>{email}</strong>으로 인증 메일을 보냈습니다. 메일의 링크를 열면 가입이 완료됩니다.
          </p>
          <Link to="/auth/login" className="btn btn-primary" style={{ marginTop: 'var(--sp-5)' }}>
            로그인으로 이동
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <header>
        <h1 className="auth-heading">회원가입</h1>
        <p className="auth-subtitle">철수야 계정을 만들고 동네 철물점 매칭을 시작해 보세요.</p>
      </header>

      {error ? <p className="field-error" role="alert">{error}</p> : null}

      <section style={{ marginTop: 'var(--sp-5)' }}>
        <SocialAuthButtons action="가입" disabled={isLoading || !isSupabaseConfigured} onError={setError} />
      </section>

      <div className="auth-divider">또는 이메일로 가입</div>

      <form className="stack" onSubmit={(event) => void submit(event)} noValidate>
        <div className="field">
          <label htmlFor="signup-name">이름</label>
          <input
            id="signup-name"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="홍길동"
            value={name}
            disabled={isLoading || !isSupabaseConfigured}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password">비밀번호</label>
          <div className="auth-password-row">
            <input
              id="signup-password"
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8자 이상 입력해 주세요"
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

        <div className="field">
          <label htmlFor="signup-confirm-password">비밀번호 확인</label>
          <div className="auth-password-row">
            <input
              id="signup-confirm-password"
              className="input"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력해 주세요"
              value={confirmPassword}
              disabled={isLoading || !isSupabaseConfigured}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowConfirm((visible) => !visible)}
              aria-label={showConfirm ? '비밀번호 확인값 숨기기' : '비밀번호 확인값 표시'}
            >
              {showConfirm ? '숨김' : '표시'}
            </button>
          </div>
        </div>

        <label className="row" style={{ alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            disabled={isLoading || !isSupabaseConfigured}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            style={{ minWidth: 18, minHeight: 18, marginTop: 3 }}
          />
          <span className="muted" style={{ color: 'var(--c-text)' }}>
            이용약관 및 개인정보처리방침에 동의합니다.
          </span>
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading || !isSupabaseConfigured}>
          {isLoading ? '가입 처리 중…' : '이메일 회원가입'}
        </button>
      </form>

      {!isSupabaseConfigured ? (
        <p className="auth-notice">Supabase 연결 정보를 제공받은 뒤 Email·Google·Kakao 가입이 활성화됩니다.</p>
      ) : null}

      <p className="auth-footer-copy">
        이미 계정이 있으신가요? <Link to="/auth/login" className="auth-inline-link">로그인</Link>
      </p>
    </AuthLayout>
  )
}
