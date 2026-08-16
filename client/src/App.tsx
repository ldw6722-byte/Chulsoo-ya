import { RouterProvider } from 'react-router-dom'
import { IdentityProvider } from '@/app/IdentityContext'
import { AuthProvider } from '@/app/AuthProvider'
import { router } from '@/app/router'
import { ToastViewport } from '@/components/ToastViewport'

export default function App() {
  return (
    <IdentityProvider>
      <AuthProvider>
        <RouterProvider router={router} /><ToastViewport />
      </AuthProvider>
    </IdentityProvider>
  )
}
