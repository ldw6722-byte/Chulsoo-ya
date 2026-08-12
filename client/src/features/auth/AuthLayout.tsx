import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './auth.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-frame">
        <Link to="/" className="auth-brand" aria-label="철수야 홈으로 이동">
          철수야
        </Link>
        <section className="card auth-card">{children}</section>
      </div>
    </main>
  )
}
