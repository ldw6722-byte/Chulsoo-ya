import { useState } from 'react'
import { AuthConfigurationError, supabaseAuth } from '@/lib/supabase'
import { clearAuthSessionPolicy, startAuthSession } from '@/lib/auth-session'

type Provider = 'google' | 'kakao'
type Props = { action: 'login' | 'signup'; disabled?: boolean; onError: (message: string | null) => void; nextPath?: string; remember?: boolean }

export function SocialAuthButtons({ disabled = false, onError, nextPath, remember = false }: Props) {

  const [pending, setPending] = useState<Provider | null>(null)
  const start = async (provider: Provider) => {
    if (disabled || pending) return
    setPending(provider); onError(null)
        try {
      startAuthSession(remember)
      const result = await supabaseAuth.signInWithProvider(provider, nextPath)
      if (result.error) { clearAuthSessionPolicy(); onError(result.error.message) }
    }

    catch (error) { clearAuthSessionPolicy(); onError(error instanceof AuthConfigurationError ? error.message : "Social login could not be started.") }
    finally { setPending(null) }
  }
  return <div className="auth-provider-grid">
    <button type="button" className="auth-provider auth-provider-google" disabled={disabled || Boolean(pending)} onClick={() => void start("google")}><span className="auth-google-mark" aria-hidden="true">G</span><span>{pending === "google" ? "\uC5F0\uACB0 \uC911..." : "\uAD6C\uAE00\uB85C \uB85C\uADF8\uC778"}</span></button>
    <button type="button" className="auth-provider auth-provider-kakao" disabled={disabled || Boolean(pending)} onClick={() => void start("kakao")}><span className="auth-kakao-mark" aria-hidden="true"></span><span>{pending === "kakao" ? "\uC5F0\uACB0 \uC911..." : "\uCE74\uCE74\uC624\uB85C \uB85C\uADF8\uC778"}</span></button>
  </div>
}
