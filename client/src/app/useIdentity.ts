import { useContext } from 'react'
import { IdentityContext } from './identity-context'
import type { IdentityContextValue } from './identity-context'

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext)
  if (!context) {
    throw new Error('useIdentity 는 IdentityProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
