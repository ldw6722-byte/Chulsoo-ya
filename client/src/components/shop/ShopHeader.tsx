import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cartApi, catalogApi, supportApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import type { Cart, CustomerCenterData } from '@/types/api'
import { CategoryMegaMenu } from './CategoryMegaMenu'
import { HeaderNotifications } from './HeaderNotifications'
import { ThemeToggle } from '@/components/ThemeToggle'
import { notify } from '@/lib/notify'

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const hoverCloseTimer = useRef<number | null>(null)
    const { data: center, reload: reloadNotifications } = useAsync<CustomerCenterData>(() => supportApi.center(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading, pollMs: 10_000 })

  const { data: cart, reload: reloadCart } = useAsync<Cart>(() => cartApi.view(), [identity?.userId, location.pathname], {
    enabled: isAuthenticated && !isLoading && !location.pathname.startsWith('/seller') && !location.pathname.startsWith('/admin'),
  })

    useEffect(() => { const refreshCart = () => void reloadCart(); window.addEventListener("chulsooya:cart-updated", refreshCart); return () => window.removeEventListener("chulsooya:cart-updated", refreshCart) }, [reloadCart])
  useEffect(() => { const refreshNotifications = () => void reloadNotifications(); window.addEventListener("chulsooya:notifications-updated", refreshNotifications); return () => window.removeEventListener("chulsooya:notifications-updated", refreshNotifications) }, [reloadNotifications])

  useEffect(() => { const keyword = query.trim(); setActiveSuggestionIndex(-1); if (!keyword) { setSuggestions([]); return } let active = true; const timer = window.setTimeout(() => { void catalogApi.suggestions(keyword).then(items => { if (active) setSuggestions(items.slice(0, 8)) }).catch(() => { if (active) setSuggestions([]) }) }, 150); return () => { active = false; window.clearTimeout(timer) } }, [query])
  function clearSearch() { setQuery(''); setSuggestions([]); setActiveSuggestionIndex(-1) }
  function search(value = query) { const keyword = value.trim(); clearSearch(); if (keyword) navigate("/catalog?keyword=" + encodeURIComponent(keyword)) }
  function selectSuggestion(suggestion: string) { setQuery(suggestion); search(suggestion) }
  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setActiveSuggestionIndex((current) => current >= suggestions.length - 1 ? 0 : current + 1); return }
    if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setActiveSuggestionIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1); return }
    if (event.key === 'Enter') { event.preventDefault(); const selected = suggestions[activeSuggestionIndex]; if (selected) selectSuggestion(selected); else search(); return }
    if (event.key === 'Escape') { setSuggestions([]); setActiveSuggestionIndex(-1) }
  }
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
  const sellerApplicationPath = '/seller/application'
  const cartPath = '/cart'
  const openSellerApplication = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return
    event.preventDefault()
    notify('판매점 신청은 로그인 후 이용할 수 있습니다.', 'success')
    navigate('/auth/login?next=' + encodeURIComponent(sellerApplicationPath))
  }
  const openCart = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return
    event.preventDefault()
    notify('장바구니는 로그인 후 이용할 수 있습니다.', 'success')
    navigate('/auth/login?next=' + encodeURIComponent(cartPath))
  }
  const notifications = center?.notifications ?? []
  const openNotification = async (notificationId: number, targetPath: string | null) => { await supportApi.markNotificationRead(notificationId); await reloadNotifications(); navigate(targetPath ?? "/support") }
  const handleSignOut = async () => { await signOut(); setAccountOpen(false); navigate("/", { replace: true }) }
  const keepMenuOpen = (open: () => void) => { if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current); hoverCloseTimer.current = null; open() }
  const delayMenuClose = (close: () => void) => { if (hoverCloseTimer.current !== null) window.clearTimeout(hoverCloseTimer.current); hoverCloseTimer.current = window.setTimeout(close, 180) }
  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950">
    <div className="bg-slate-900 text-[11px] text-slate-200"><div className="mx-auto flex h-10 max-w-7xl items-center justify-end gap-4 px-4">
      <Link to="/support" className="hover:text-white">{"\uACE0\uAC1D\uC13C\uD130"}</Link><Link to={sellerApplicationPath} onClick={openSellerApplication} className="hover:text-white">{"\uD310\uB9E4\uC810 \uC2E0\uCCAD\uD558\uAE30"}</Link><Link to="/admin" className="hover:text-white">{"\uAD00\uB9AC\uC790 \uB300\uC2DC\uBCF4\uB4DC"}</Link>
      {isAuthenticated ? <><span className="max-w-60 truncate text-slate-400">{displayName}</span><button type="button" onClick={() => void handleSignOut()} className="hover:text-white">{"\uB85C\uADF8\uC544\uC6C3"}</button></> : <><Link to={loginPath} className="hover:text-white">{"\uB85C\uADF8\uC778"}</Link><Link to={signupPath} className="hover:text-white">{"\uD68C\uC6D0\uAC00\uC785"}</Link></>}
    </div></div>
    <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
      <div className="relative shrink-0" onMouseEnter={() => keepMenuOpen(() => { setAccountOpen(false); setCategoryOpen(true) })} onMouseLeave={() => delayMenuClose(() => setCategoryOpen(false))}><Link to="/catalog" onClick={(event) => { event.preventDefault(); setCategoryOpen(true) }} className="flex h-16 w-18 flex-col items-center justify-center rounded-2xl bg-brand-600 !text-white shadow-sm"><span className="h-5 w-5"><MenuIcon /></span><span className="mt-1 text-xs font-bold !text-white">{"\uCE74\uD14C\uACE0\uB9AC"}</span></Link><CategoryMegaMenu open={categoryOpen} onSelect={goToCategory} /></div>
      <Link to="/" onClick={() => { clearSearch(); window.scrollTo(0, 0) }} className="group inline-flex h-16 w-40 shrink-0 items-center justify-center rounded-lg bg-white p-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(99,102,241,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"><img src="https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/brand/chulsooya-main-logo-check-outline.webp" alt="철수야 홈" className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02]" /></Link>
      <div className="relative min-w-0 flex-1"><div className="flex overflow-hidden rounded-xl border-2 border-brand-500 bg-white dark:bg-slate-900"><input value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => window.setTimeout(() => { setSuggestions([]); setActiveSuggestionIndex(-1) }, 120)} onKeyDown={handleSearchKeyDown} placeholder={"\uC0C1\uD488\uBA85, \uADDC\uACA9, \uC6A9\uB3C4\uB85C \uAC80\uC0C9"} className="h-14 min-w-0 flex-1 bg-white px-4 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100" aria-label={"\uC0C1\uD488 \uAC80\uC0C9"} role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0} aria-controls="search-suggestions" aria-activedescendant={activeSuggestionIndex >= 0 ? `search-suggestion-${activeSuggestionIndex}` : undefined} /><button type="button" onClick={() => search()} className="grid w-14 place-items-center bg-brand-600 text-white" aria-label={"\uAC80\uC0C9"}><span className="h-5 w-5"><SearchIcon /></span></button></div>{suggestions.length ? <div id="search-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{suggestions.map((suggestion, index) => <button id={`search-suggestion-${index}`} key={suggestion} role="option" aria-selected={activeSuggestionIndex === index} type="button" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveSuggestionIndex(index)} onClick={() => selectSuggestion(suggestion)} className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition dark:text-slate-100 ${activeSuggestionIndex === index ? 'bg-brand-50 text-brand-700 dark:bg-slate-800' : 'text-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-800'}`}><span className="text-brand-600">⌕</span><span className="truncate">{suggestion}</span></button>)}</div> : null}</div>
      <ThemeToggle compact />
      <div ref={accountRef} className="relative shrink-0" onMouseEnter={() => keepMenuOpen(() => { setCategoryOpen(false); setAccountOpen(true) })} onMouseLeave={() => delayMenuClose(() => setAccountOpen(false))}>
        <button type="button" onClick={() => setAccountOpen(true)} className="grid h-14 w-14 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={displayName} aria-expanded={accountOpen}><span className="h-7 w-7"><UserIcon /></span></button>
        {accountOpen ? <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {isAuthenticated ? <><p className="truncate border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">{displayName}</p><Link to="/my" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uB9C8\uC774\uCCA0\uC218"}</Link><Link to="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uC8FC\uBB38 \uB0B4\uC5ED"}</Link>
            <button type="button" onClick={() => void handleSignOut()} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50">{"\uB85C\uADF8\uC544\uC6C3"}</button></> : <>
            <p className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">{"\uB85C\uADF8\uC778 \uD6C4 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}</p>
            <Link to={loginPath} onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50">{"\uB85C\uADF8\uC778"}</Link>
            <Link to={signupPath} onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">{"\uD68C\uC6D0\uAC00\uC785"}</Link></>}
        </div> : null}
      </div>
      {isAuthenticated ? <HeaderNotifications notifications={notifications} onRead={(item) => openNotification(item.id, item.targetPath)} /> : null}
      <Link to={cartPath} onClick={openCart} className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="장바구니"><span className="h-7 w-7"><CartIcon /></span>{isAuthenticated && cartCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">{cartCount > 99 ? "99+" : cartCount}</span> : null}</Link>
    </div>
    <nav className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
      <button type="button" onClick={() => goToQuickSection("quick-newest")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">{"\uC2E0\uADDC \uC0C1\uD488"}</button>
      <button type="button" onClick={() => goToQuickSection("quick-popular")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">{"\uC778\uAE30 \uACF5\uAD6C"}</button>
      <button type="button" onClick={() => goToQuickSection("quick-featured")} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">{"\uCD94\uCC9C \uC0C1\uD488"}</button>
    </div></nav>
  </header>
}
