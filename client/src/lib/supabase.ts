import { createClient, type AuthError, type Provider, type Session, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** 운영 환경에서는 URL과 publishable/anon key가 반드시 제공되어야 한다. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

// 값이 없을 때도 앱 셸은 렌더링된다. 실제 Auth 호출은 ensureSupabase가 차단한다.
export const supabase = createClient(
  supabaseUrl || 'https://configuration-required.invalid',
  supabasePublishableKey || 'configuration-required',
  {
    auth: {
      // Vite SPA는 서버 쿠키 저장소가 없다. 이메일 링크를 다른 브라우저·기기에서 열어도
      // 세션을 복구할 수 있는 implicit flow를 사용한다.
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)

export class AuthConfigurationError extends Error {
  constructor() {
    super('Supabase 인증 설정이 없습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해 주세요.')
    this.name = 'AuthConfigurationError'
  }
}

function ensureSupabase(): void {
  if (!isSupabaseConfigured) throw new AuthConfigurationError()
}

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`
}

export const supabaseAuth = {
  getSession: async (): Promise<Session | null> => {
    if (!isSupabaseConfigured) return null
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  exchangeCode: async (code: string): Promise<Session | null> => {
    ensureSupabase()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data.session
  },

  signInWithEmail: async (email: string, password: string) => {
    ensureSupabase()
    return supabase.auth.signInWithPassword({ email, password })
  },

  signUpWithEmail: async (email: string, password: string, name: string) => {
    ensureSupabase()
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: callbackUrl(),
      },
    })
  },

  resendSignupEmail: async (email: string) => {
    ensureSupabase()
    return supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
  },

  signInWithProvider: async (provider: Extract<Provider, 'google' | 'kakao'>) => {
    ensureSupabase()
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(),
        ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return { error: null as AuthError | null }
    return supabase.auth.signOut()
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange((event, session) => callback(event, session)),
}

export type SupabaseUser = User
