import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cartApi, supportApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import type { Cart, CustomerCenterData } from '@/types/api'
import { CategoryMegaMenu } from './CategoryMegaMenu'
import { HeaderNotifications } from './HeaderNotifications'

function MenuIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg> }
function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path strokeLinecap="round" d="m16 16 4 4" /></svg> }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg> }
function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l1.5 10.2a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg> }

export function ShopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity } = useIdentity()
  const { user, signOut, isLoading } = useAuth()
  const isAuthenticated = Boolean(user ?? identity)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const hoverCloseTimer = useRef<number | null>(null)
  const { data: center, reload: reloadNotifications } = useAsync<CustomerCenterData>(() => supportApi.center(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading })
  const { data: cart, reload: reloadCart } = useAsync<Cart>(() => cartApi.view(), [identity?.userId, location.pathname], {
    enabled: isAuthenticated && !isLoading && !location.pathname.startsWith('/seller') && !location.pathname.startsWith('/admin'),
  })

  useEffect(() => { const refreshCart = () => void reloadCart(); window.addEventListener("chulsooya:cart-updated", refreshCart); return () => window.removeEventListener("chulsooya:cart-updated", refreshCart) }, [reloadCart])
  function search(value = query) { const keyword = value.trim(); if (keyword) navigate("/catalog?keyword=" + encodeURIComponent(keyword)) }
  function goToCategory(code: string) { setCategoryOpen(false); navigate("/catalog?categoryCode=" + encodeURIComponent(code)) }
  function goToQuickSection(quickSection: string) {
    if (location.pathname === "/") { document.getElementById(quickSection)?.scrollIntoView({ behavior: "smooth", block: "start" }); return }
    navigate("/", { state: { quickSection } })
  }
  const currentPath = location.pathname + location.search + location.hash
  const loginPath = "/auth/login?next=" + encodeURIComponent(currentPath)
  const signupPath = "/auth/signup?next=" + encodeURIComponent(currentPath)
  const displayName = user?.email ?? (identity ? `${identity.name}님` : isLoading ? "로그인 확인 중" : "로그인")
  const cartCount = isAuthenticated ? (cart?.itemCount ?? 0) : 0
  const notifications = center?.notifications ?? []
  const openNotification = async (notificationId: number, targetPath: string | null) => { await supportApi.markNotificationRead(notificationId); await reloadNotifications(); navigate(targetPath ?? "/support") }
  const handleSignOut = async () => { await signOut(); setAccountOpen(false); navigate("/", { replace: true }) }
  const keepMenuOpen = (open: () => void) => { if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current); hoverCloseTimer.current = null; open() }
  const delayMenuClose = (close: () => void) => { if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current); hoverCloseTimer.current = window.setTimeout(close, 180) }
  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950">
    <div className="bg-slate-900 text-[11px] text-slate-200"><div className="mx-auto flex h-10 max-w-7xl items-center justify-end gap-4 px-4">
      <Link to="/support" className="hover:text-white">{"\uACE0\uAC1D\uC13C\uD130"}</Link><Link to="/seller/application" className="hover:text-white">{"\uD310\uB9E4\uC810 \uC2E0\uCCAD\uD558\uAE30"}</Link><Link to="/admin" className="hover:text-white">{"\uAD00\uB9AC\uC790 \uB300\uC2DC\uBCF4\uB4DC"}</Link>
      {isAuthenticated ? <><span className="max-w-60 truncate text-slate-400">{displayName}</span><button type="button" onClick={() => void handleSignOut()} className="hover:text-white">{"\uB85C\uADF8\uC544\uC6C3"}</button></> : <><Link to={loginPath} className="hover:text-white">{"\uB85C\uADF8\uC778"}</Link><Link to={signupPath} className="hover:text-white">{"\uD68C\uC6D0\uAC00\uC785"}</Link></>}
    </div></div>
    <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
      <div className="relative shrink-0" onMouseEnter={() => keepMenuOpen(() => { setAccountOpen(false); setCategoryOpen(true) })} onMouseLeave={() => delayMenuClose(() => setCategoryOpen(false))}><Link to="/catalog" onClick={(event) => { event.preventDefault(); setCategoryOpen(true) }} className="flex h-16 w-18 flex-col items-center justify-center rounded-2xl bg-brand-600 !text-white shadow-sm"><span className="h-5 w-5"><MenuIcon /></span><span className="mt-1 text-xs font-bold !text-white">{"\uCE74\uD14C\uACE0\uB9AC"}</span></Link><CategoryMegaMenu open={categoryOpen} onSelect={goToCategory} /></div>
      <Link to="/" onClick={() => window.scrollTo(0, 0)} className="inline-flex h-16 w-40 shrink-0 overflow-hidden rounded-lg bg-white"><img src="/brand/chulsooya-logo.webp" alt="Chulsoo-ya" className="h-full w-full object-cover" /></Link>
      <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border-2 border-brand-500 bg-white"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search() }} placeholder={"\uC0C1\uD488\uBA85, \uADDC\uACA9, \uC6A9\uB3C4\uB85C \uAC80\uC0C9"} className="h-14 min-w-0 flex-1 px-4 text-sm outline-none" aria-label={"\uC0C1\uD488 \uAC80\uC0C9"} /><button type="button" onClick={() => search()} className="grid w-14 place-items-center bg-brand-600 text-white" aria-label={"\uAC80\uC0C9"}><span className="h-5 w-5"><SearchIcon /></span></button></div>
      <div ref={accountRef} className="relative shrink-0" onMouseEnter={() => keepMenuOpen(() => { setCategoryOpen(false); setAccountOpen(true) })} onMouseLeave={() => delayMenuClose(() => setAccountOpen(false))}>
        <button type="button" onClick={() => setAccountOpen(true)} className="grid h-14 w-14 place-items-center rounded-xl hover:bg-slate-100" aria-label={displayName} aria-expanded={accountOpen}><span className="h-7 w-7"><UserIcon /></span></button>
        {accountOpen ? <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {isAuthenticated ? <><p className="truncate border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">{displayName}</p><Link to="/my" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uB9C8\uC774\uCCA0\uC218"}</Link><Link to="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uC8FC\uBB38 \uB0B4\uC5ED"}</Link>
            <button type="button" onClick={() => void handleSignOut()} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50">{"\uB85C\uADF8\uC544\uC6C3"}</button></> : <>
            <p className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">{"\uC800\uC7A5\uD615 \uAE30\uB2A5\uC740 \uB85C\uADF8\uC778 \uD6C4 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}</p>
            <Link to={loginPath} onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50">{"\uB85C\uADF8\uC778"}</Link>
            <Link to={signupPath} onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uD68C\uC6D0\uAC00\uC785"}</Link></>}
        </div> : null}
      </div>
      {isAuthenticated ? <HeaderNotifications notifications={notifications} onRead={(item) => openNotification(item.id, item.targetPath)} /> : null}
      <Link to="/cart" className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl hover:bg-slate-100" aria-label="Cart"><span className="h-7 w-7"><CartIcon /></span>{isAuthenticated && cartCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">{cartCount > 99 ? "99+" : cartCount}</span> : null}</Link>
    </div>
    <nav className="border-t border-slate-100 bg-white"><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
      <button type="button" onClick={() => goToQuickSection("quick-newest")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">{"\uC2E0\uADDC \uC0C1\uD488"}</button>
      <button type="button" onClick={() => goToQuickSection("quick-popular")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">{"\uC778\uAE30 \uACF5\uAD6C"}</button>
      <button type="button" onClick={() => goToQuickSection("quick-featured")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">{"\uCD94\uCC9C \uC0C1\uD488"}</button>
    </div></nav>
  </header>
}
