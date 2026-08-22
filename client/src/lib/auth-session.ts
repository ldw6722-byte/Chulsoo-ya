let accessToken: string | null = null

const AUTH_SNAPSHOT_STORAGE_KEY = "chulsooya.auth-snapshot"
const AUTH_POLICY_STORAGE_KEY = "chulsooya.auth-policy"
const AUTH_POLICY_MODE_STORAGE_KEY = "chulsooya.auth-policy-mode"

export const STANDARD_IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const REMEMBER_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000

type AuthPolicyMode = "standard" | "remember"

interface AuthSessionPolicy {
  mode: AuthPolicyMode
  expiresAt: number
}

export interface AuthSnapshot {
  supabaseUserId: string
  email: string
  name: string
}

function storageFor(_mode: AuthPolicyMode): Storage {
  // Supabase 세션은 새 탭의 /admin 직접 진입에서도 복원돼야 한다.
  // 30분·7일 차이는 저장 위치가 아니라 expiresAt 정책으로 계속 판정한다.
  return localStorage
}

function storedMode(): AuthPolicyMode | null {
  const mode = localStorage.getItem(AUTH_POLICY_MODE_STORAGE_KEY)
  return mode === "standard" || mode === "remember" ? mode : null
}

function loadPolicy(): AuthSessionPolicy | null {
  const mode = storedMode()
  if (!mode) return null
  try {
    const raw = storageFor(mode).getItem(AUTH_POLICY_STORAGE_KEY)
    const policy = raw ? JSON.parse(raw) as AuthSessionPolicy : null
    return policy?.mode === mode && Number.isFinite(policy.expiresAt) ? policy : null
  } catch {
    return null
  }
}

function savePolicy(policy: AuthSessionPolicy | null): void {
  sessionStorage.removeItem(AUTH_POLICY_STORAGE_KEY)
  localStorage.removeItem(AUTH_POLICY_STORAGE_KEY)
  if (!policy) {
    localStorage.removeItem(AUTH_POLICY_MODE_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_POLICY_MODE_STORAGE_KEY, policy.mode)
  storageFor(policy.mode).setItem(AUTH_POLICY_STORAGE_KEY, JSON.stringify(policy))
}

function timeoutFor(mode: AuthPolicyMode): number {
  return mode === "remember" ? REMEMBER_IDLE_TIMEOUT_MS : STANDARD_IDLE_TIMEOUT_MS
}

export function startAuthSession(remember: boolean): void {
  const mode: AuthPolicyMode = remember ? "remember" : "standard"
  savePolicy({ mode, expiresAt: Date.now() + timeoutFor(mode) })
}

export function recordAuthActivity(): number | null {
  const policy = loadPolicy()
  if (!policy) return null
  const nextPolicy = { ...policy, expiresAt: Date.now() + timeoutFor(policy.mode) }
  savePolicy(nextPolicy)
  return nextPolicy.expiresAt
}

export function isAuthSessionExpired(): boolean {
  const policy = loadPolicy()
  return Boolean(policy && policy.expiresAt <= Date.now())
}

export function getAuthSessionRemainingMs(): number | null {
  const policy = loadPolicy()
  return policy ? Math.max(0, policy.expiresAt - Date.now()) : null
}

export function clearAuthSessionPolicy(): void {
  savePolicy(null)
}

function authStorage(): Storage {
  const mode = storedMode()
  return mode ? storageFor(mode) : localStorage
}

export const supabaseSessionStorage = {
  getItem: (key: string) => authStorage().getItem(key),
  setItem: (key: string, value: string) => authStorage().setItem(key, value),
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function saveAuthSnapshot(snapshot: AuthSnapshot | null): void {
  if (snapshot) authStorage().setItem(AUTH_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
  else {
    localStorage.removeItem(AUTH_SNAPSHOT_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_SNAPSHOT_STORAGE_KEY)
  }
}

export function loadAuthSnapshot(): AuthSnapshot | null {
  try {
    const raw = authStorage().getItem(AUTH_SNAPSHOT_STORAGE_KEY)
    return raw ? JSON.parse(raw) as AuthSnapshot : null
  } catch {
    return null
  }
}
