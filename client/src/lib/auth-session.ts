let accessToken: string | null = null
const AUTH_SNAPSHOT_STORAGE_KEY = "chulsooya.auth-snapshot"
export interface AuthSnapshot { supabaseUserId: string; email: string; name: string }

export function setAccessToken(token: string | null): void { accessToken = token }
export function getAccessToken(): string | null { return accessToken }
export function saveAuthSnapshot(snapshot: AuthSnapshot | null): void {
  if (snapshot) localStorage.setItem(AUTH_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
  else localStorage.removeItem(AUTH_SNAPSHOT_STORAGE_KEY)
}
export function loadAuthSnapshot(): AuthSnapshot | null {
  try { const raw = localStorage.getItem(AUTH_SNAPSHOT_STORAGE_KEY); return raw ? JSON.parse(raw) as AuthSnapshot : null } catch { return null }
}
