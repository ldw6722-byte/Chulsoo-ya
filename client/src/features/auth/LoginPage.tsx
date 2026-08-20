import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { SocialAuthButtons } from './SocialAuthButtons'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { clearAuthSessionPolicy, startAuthSession } from '@/lib/auth-session'

import { useAuth } from '@/app/useAuth'

function EyeIcon({ closed }: { closed: boolean }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>{closed ? <path d="m4 4 16 16"/> : null}</svg> }

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
    const [remember, setRemember] = useState(false)

  const requested = searchParams.get('next')
  const redirectPath = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/' 
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setLoading(true)
    try {
      startAuthSession(remember)
      const { error: signInError } = await supabaseAuth.signInWithEmail(email.trim(), password)
      if (signInError) { clearAuthSessionPolicy(); setError(signInError.message); return }
      await refresh(); navigate(redirectPath, { replace: true })

    } catch (error) { clearAuthSessionPolicy(); setError(error instanceof AuthConfigurationError ? error.message : "로그인에 실패했습니다. 다시 시도해 주세요.") }

    finally { setLoading(false) }
  }
  return <AuthLayout>
    <h1 className="auth-heading">{"\uB85C\uADF8\uC778"}</h1>
    <p className="auth-subtitle">{"\uCCA0\uC218\uC57C\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4."}</p>
        <SocialAuthButtons action="login" disabled={loading || !isSupabaseConfigured} onError={setError} nextPath={redirectPath} remember={remember} />

    <div className="auth-divider"><span>{"\uB610\uB294 \uC774\uBA54\uC77C\uB85C \uB85C\uADF8\uC778"}</span></div>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <form className="auth-form" onSubmit={submit}>
      <div className="field"><label htmlFor="login-email">{"\uC774\uBA54\uC77C"}</label><input id="login-email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="example@email.com" required /></div>
      <div className="field"><label htmlFor="login-password">{"\uBE44\uBC00\uBC88\uD638"}</label><div className="auth-password-field"><input id="login-password" className="input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder={"\uBE44\uBC00\uBC88\uD638\uC744 \uC785\uB825\uD558\uC138\uC694"} required /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}><EyeIcon closed={!showPassword} /></button></div></div>
            <div className="flex items-center justify-between text-sm"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>{"\uB85C\uADF8\uC778 \uC0C1\uD0DC \uC720\uC9C0"} <em>{"(\uB2E4\uB978 \uD658\uACBD\uC5D0\uC11C \uCCB4\uD06C \uC8FC\uC758)"}</em></span><span className="auth-help" tabIndex={0} aria-label="로그인 상태 유지 안내"><span aria-hidden="true">?</span><span className="auth-help-tooltip" role="tooltip">체크하면 7일 동안 이 환경에서 로그인 상태가 유지됩니다.</span></span></label><Link to="/support" className="auth-inline-link">{"\uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30"}</Link></div>

      <button className="btn btn-primary btn-block" type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? "로그인 중..." : "\uB85C\uADF8\uC778"}</button>
    </form>
    <p className="auth-footer-copy">{"\uACC4\uC815\uC774 \uC5C6\uC73C\uC2E0\uAC00\uC694? "}<Link to={"/auth/signup?next=" + encodeURIComponent(redirectPath)} className="auth-inline-link">{"\uD68C\uC6D0\uAC00\uC785"}</Link></p>
  </AuthLayout>
}
