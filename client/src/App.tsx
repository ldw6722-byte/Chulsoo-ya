import { RouterProvider } from 'react-router-dom'
import { IdentityProvider } from '@/app/IdentityContext'
import { AuthProvider } from '@/app/AuthProvider'
import { router } from '@/app/router'
import { ToastViewport } from '@/components/ToastViewport'
import { ThemeProvider } from '@/app/ThemeContext'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'

export default function App() {
  return (
    <ThemeProvider>
      <IdentityProvider>
        <AuthProvider>
          <RouterProvider router={router} /><ScrollToTopButton /><ToastViewport />
        </AuthProvider>
      </IdentityProvider>
    </ThemeProvider>
  )
}
