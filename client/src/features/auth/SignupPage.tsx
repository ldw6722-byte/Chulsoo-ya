import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { SocialAuthButtons } from './SocialAuthButtons'
import { AuthConfigurationError, isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { useAuth } from '@/app/useAuth'

function EyeIcon({ closed }: { closed: boolean }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>{closed ? <path d="m4 4 16 16"/> : null}</svg> }

export function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const requested = searchParams.get('next')
  const redirectPath = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/' 
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setMessage(null)
    if (!agreed) { setError("Please agree to the terms before continuing."); return }
    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabaseAuth.signUpWithEmail(email.trim(), password, name.trim(), redirectPath)
      if (signUpError) { setError(signUpError.message); return }
      if (data.session) { await refresh(); navigate(redirectPath, { replace: true }); return }
      setMessage("Check your email to confirm the account, then return to sign in.")
    } catch (error) { setError(error instanceof AuthConfigurationError ? error.message : "Sign up failed. Please try again.") }
    finally { setLoading(false) }
  }
  return <AuthLayout>
    <h1 className="auth-heading">{"\uD68C\uC6D0\uAC00\uC785"}</h1>
    <p className="auth-subtitle">{"\uCCA0\uC218\uC57C\uC758 \uAC00\uACA9 \uBE44\uAD50\uC640 \uC8FC\uBB38 \uB9E4\uCE6D\uC744 \uC2DC\uC791\uD558\uC138\uC694."}</p>
    <SocialAuthButtons action="signup" disabled={loading || !isSupabaseConfigured} onError={setError} nextPath={redirectPath} />
    <div className="auth-divider"><span>{"\uB610\uB294 \uC774\uBA54\uC77C\uB85C \uD68C\uC6D0\uAC00\uC785"}</span></div>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    {message ? <p className="auth-notice">{message}</p> : null}
    <form className="auth-form" onSubmit={submit}>
      <div className="field"><label htmlFor="signup-name">{"\uC774\uB984"}</label><input id="signup-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder={"\uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694"} required /></div>
      <div className="field"><label htmlFor="signup-email">{"\uC774\uBA54\uC77C"}</label><input id="signup-email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="example@email.com" required /></div>
      <div className="field"><label htmlFor="signup-password">{"\uBE44\uBC00\uBC88\uD638"}</label><div className="auth-password-field"><input id="signup-password" className="input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} placeholder={"8\uC790 \uC774\uC0C1 \uC785\uB825"} required /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}><EyeIcon closed={!showPassword} /></button></div></div>
      <div className="field"><label htmlFor="signup-password-confirm">{"\uBE44\uBC00\uBC88\uD638 \uD655\uC778"}</label><div className="auth-password-field"><input id="signup-password-confirm" className="input" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} placeholder={"\uBE44\uBC00\uBC88\uD638\uB97C \uD55C \uBC88 \uB354 \uC785\uB825\uD558\uC138\uC694"} required /><button className="auth-password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)}><EyeIcon closed={!showConfirmPassword} /></button></div></div>
      <label className="auth-agreement"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>{"\uC774\uC6A9\uC57D\uAD00 \uBC0F \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68\uC5D0 \uB3D9\uC758\uD569\uB2C8\uB2E4."}</span></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={loading || !isSupabaseConfigured}>{loading ? "Creating..." : "\uD68C\uC6D0\uAC00\uC785"}</button>
    </form>
    <p className="auth-footer-copy">{"\uC774\uBBF8 \uACC4\uC815\uC774 \uC788\uC73C\uC2E0\uAC00\uC694? "}<Link to={"/auth/login?next=" + encodeURIComponent(redirectPath)} className="auth-inline-link">{"\uB85C\uADF8\uC778"}</Link></p>
  </AuthLayout>
}

