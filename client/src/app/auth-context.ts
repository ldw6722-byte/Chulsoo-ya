import { createContext } from 'react'
import type { AuthenticatedUser } from '@/types/api'

export interface AuthContextValue {
  configured: boolean
  user: AuthenticatedUser | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
