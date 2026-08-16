import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './auth.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('chulsooya-auth-theme') === 'dark')
  useEffect(() => { localStorage.setItem('chulsooya-auth-theme', dark ? 'dark' : 'light') }, [dark])
  return <main className={dark ? "auth-page auth-dark" : "auth-page"}><div className="auth-frame">
    <Link to="/" className="auth-brand" aria-label="Chulsoo-ya home">{"\uCCA0\uC218\uC57C"}</Link>
    <section className="card auth-card">{children}</section>
    <button type="button" className="auth-theme-toggle" onClick={() => setDark((value) => !value)}>{dark ? "\u2600\uFE0F \uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uC804\uD658" : "\u263D \uB2E4\uD06C \uBAA8\uB4DC\uB85C \uC804\uD658"}</button>
  </div></main>
}
