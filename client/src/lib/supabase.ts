import { createClient, type AuthError, type Provider, type Session, type User } from '@supabase/supabase-js'
import { supabaseSessionStorage } from './auth-session'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** ?댁쁺 ?섍꼍?먯꽌??URL怨?publishable/anon key媛 諛섎뱶???쒓났?섏뼱???쒕떎. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

// 媛믪씠 ?놁쓣 ?뚮룄 ???몄? ?뚮뜑留곷맂?? ?ㅼ젣 Auth ?몄텧? ensureSupabase媛 李⑤떒?쒕떎.
export const supabase = createClient(
  supabaseUrl || 'https://configuration-required.invalid',
  supabasePublishableKey || 'configuration-required',
  {
    auth: {
      // Vite SPA???쒕쾭 荑좏궎 ??μ냼媛 ?녿떎. ?대찓??留곹겕瑜??ㅻⅨ 釉뚮씪?곗?쨌湲곌린?먯꽌 ?댁뼱??
      // ?몄뀡??蹂듦뎄?????덈뒗 implicit flow瑜??ъ슜?쒕떎.
      flowType: 'implicit',
      autoRefreshToken: true,
            persistSession: true,
      storage: supabaseSessionStorage,
      detectSessionInUrl: true,

    },
  },
)

export class AuthConfigurationError extends Error {
  constructor() {
    super('Supabase ?몄쬆 ?ㅼ젙???놁뒿?덈떎. VITE_SUPABASE_URL怨?VITE_SUPABASE_ANON_KEY瑜??ㅼ젙??二쇱꽭??')
    this.name = 'AuthConfigurationError'
  }
}

function ensureSupabase(): void {
  if (!isSupabaseConfigured) throw new AuthConfigurationError()
}

function callbackUrl(nextPath?: string): string {
  const url = new URL(window.location.origin + "/auth/callback")
  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) url.searchParams.set("next", nextPath)
  return url.toString()
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

  setSession: async (accessToken: string, refreshToken: string): Promise<Session | null> => {
    ensureSupabase()
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (error) throw error
    return data.session
  },
  signInWithEmail: async (email: string, password: string) => {
    ensureSupabase()
    return supabase.auth.signInWithPassword({ email, password })
  },

  signUpWithEmail: async (email: string, password: string, name: string, nextPath?: string) => {
    ensureSupabase()
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: callbackUrl(nextPath),
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

  signInWithProvider: async (provider: Extract<Provider, 'google' | 'kakao'>, nextPath?: string) => {
    ensureSupabase()
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(nextPath),
        ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })
  },

  signOut: async (scope: "global" | "local" = "global") => {
    if (!isSupabaseConfigured) return { error: null as AuthError | null }
    return supabase.auth.signOut({ scope })
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange((event, session) => callback(event, session)),
}

export type SupabaseUser = User
