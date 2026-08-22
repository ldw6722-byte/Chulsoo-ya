export const ADMIN_VIEW_STORAGE_KEY = 'chulsooya-admin-active-view'

export function clearAdminViewState() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(ADMIN_VIEW_STORAGE_KEY)
}
