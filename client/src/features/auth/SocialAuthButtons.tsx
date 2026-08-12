import { useState } from 'react'
import { AuthConfigurationError, supabaseAuth } from '@/lib/supabase'

export function SocialAuthButtons({
  action,
  disabled,
  onError,
}: {
  action: '로그인' | '가입'
  disabled?: boolean
  onError: (message: string | null) => void
}) {
  const [provider, setProvider] = useState<'google' | 'kakao' | null>(null)

  async function begin(next: 'google' | 'kakao') {
    setProvider(next)
    onError(null)
    try {
      const { error } = await supabaseAuth.signInWithProvider(next)
      if (error) onError(error.message)
    } catch (cause) {
      onError(
        cause instanceof AuthConfigurationError
          ? cause.message
          : `${next === 'google' ? 'Google' : 'Kakao'} ${action}을 시작할 수 없습니다.`,
      )
    } finally {
      setProvider(null)
    }
  }

  return (
    <div className="auth-provider-grid">
      <button
        type="button"
        className="btn auth-provider auth-provider-google"
        disabled={disabled || provider !== null}
        onClick={() => void begin('google')}
      >
        <span aria-hidden="true" style={{ color: '#4285f4', fontWeight: 800 }}>
          G
        </span>
        Google {action}
      </button>
      <button
        type="button"
        className="btn auth-provider auth-provider-kakao"
        disabled={disabled || provider !== null}
        onClick={() => void begin('kakao')}
      >
        <span aria-hidden="true" style={{ fontWeight: 800 }}>
          K
        </span>
        Kakao {action}
      </button>
    </div>
  )
}
