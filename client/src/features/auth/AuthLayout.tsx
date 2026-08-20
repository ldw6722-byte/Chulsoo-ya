import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import './auth.css'

const MAIN_LOGO_URL = 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/brand/chulsooya-main-logo-check-outline.webp'

export function AuthLayout({ children, variant = 'login' }: { children: ReactNode; variant?: 'login' | 'signup' }) {
  return <main className={`auth-page auth-page-${variant}`}><div className="auth-frame">
    <Link to="/" className="auth-brand" aria-label="철수야 메인으로 이동"><img src={MAIN_LOGO_URL} alt="철수야" /></Link>
    <section className="card auth-card">{children}</section>
    <div className="auth-theme-toggle"><ThemeToggle /></div>
  </div></main>
}
