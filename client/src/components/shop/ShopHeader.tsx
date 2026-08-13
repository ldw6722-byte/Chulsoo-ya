import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cartApi, catalogApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import type { Cart, CategoryTreeNode } from '@/types/api'

const QUICK_LINKS = [
  { label: '\uC2E0\uADDC \uC0C1\uD488', target: 'quick-newest', tone: 'border-sky-500 text-sky-700 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-950/40' },
  { label: '\uC778\uAE30 \uACF5\uAD6C', target: 'quick-popular', tone: 'border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-950/40' },
  { label: '\uCD94\uCC9C \uC0C1\uD488', target: 'quick-featured', tone: 'border-rose-500 text-rose-700 hover:bg-rose-50 dark:border-rose-400 dark:text-rose-300 dark:hover:bg-rose-950/40' },
] as const

function MenuIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg> }
function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path strokeLinecap="round" d="m16 16 4 4" /></svg> }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg> }
function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l1.5 10.2a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg> }

export function ShopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity, setIdentity } = useIdentity()
  const { user, signOut } = useAuth()
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [hoveredTop, setHoveredTop] = useState<CategoryTreeNode | null>(null)
  const [hoveredMiddle, setHoveredMiddle] = useState<CategoryTreeNode | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('chulsooya-theme') === 'dark')
  const categoryRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: cart } = useAsync<Cart>(() => cartApi.view(), [identity?.userId, location.pathname], {
    enabled: Boolean(identity) && !location.pathname.startsWith('/seller') && !location.pathname.startsWith('/admin'),
  })

  useEffect(() => { void catalogApi.categoryTree().then(setTree).catch(() => setTree([])) }, [])
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('chulsooya-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setCategoryOpen(false)
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false)
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  useEffect(() => {
    if (!categoryOpen && tree.length > 0) return
    if (categoryOpen && !hoveredTop && tree.length > 0) { setHoveredTop(tree[0]); setHoveredMiddle(tree[0].children[0] ?? null) }
  }, [categoryOpen, hoveredTop, tree])
  useEffect(() => {
    const keyword = query.trim()
    if (!keyword) { setSuggestions([]); return }
    const timer = window.setTimeout(() => { void catalogApi.suggestions(keyword).then(setSuggestions).catch(() => setSuggestions([])) }, 180)
    return () => window.clearTimeout(timer)
  }, [query])

  function navigateCategory(code: string) { navigate(`/catalog?categoryCode=${encodeURIComponent(code)}`); setCategoryOpen(false) }
  function search(value = query) { const keyword = value.trim(); if (keyword) { setSuggestionsOpen(false); navigate(`/catalog?keyword=${encodeURIComponent(keyword)}`) } }
  function toggleCategory() {
    setCategoryOpen((opened) => {
      const next = !opened
      if (next && tree.length > 0) { setHoveredTop(tree[0]); setHoveredMiddle(tree[0].children[0] ?? null) }
      return next
    })
  }
  const displayName = user?.name ?? '마이철수'

  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
    <div className="bg-slate-900 text-[11px] text-slate-200"><div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-4 px-4"><div className="group relative"><Link to="/support" className="hover:text-white">고객센터</Link><div className="invisible absolute right-0 top-[calc(100%-1px)] z-50 w-38 rounded-lg border border-slate-200 bg-white py-1 text-slate-700 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"><Link to="/support#faq" className="block px-3 py-2 text-xs hover:bg-slate-50">자주 묻는 질문</Link><Link to="/support#inquiry" className="block px-3 py-2 text-xs hover:bg-slate-50">1:1 채팅문의</Link><Link to="/support#voice" className="block px-3 py-2 text-xs hover:bg-slate-50">고객의 소리</Link><Link to="/support#guide" className="block px-3 py-2 text-xs hover:bg-slate-50">취소 / 반품 안내</Link></div></div>{user ? <><span className="max-w-45 truncate text-slate-400">{user.email}</span><button type="button" onClick={() => void signOut()} className="hover:text-white">로그아웃</button></> : <><Link to="/auth/login" className="hover:text-white">로그인</Link><Link to="/auth/signup" className="hover:text-white">회원가입</Link></>}<Link to="/admin" onClick={(event) => { if (import.meta.env.DEV && !user && !identity) { event.preventDefault(); setIdentity({ userId: 2, role: 'ADMIN', name: '운영자' }); navigate('/admin') } }} className="hover:text-white">관리자</Link>
      </div></div>
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5">
      <div ref={categoryRef} className="relative hidden shrink-0 sm:block"><button type="button" onClick={toggleCategory} className="flex h-14 w-16 flex-col items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700" aria-expanded={categoryOpen}><span className="h-5 w-5"><MenuIcon /></span><span className="mt-1 text-[11px] font-semibold">카테고리</span></button>
        {categoryOpen ? <div className="absolute left-0 top-full mt-2 flex min-w-180 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-120 w-52 overflow-y-auto border-r border-slate-100 py-1 dark:border-slate-800">{tree.map((category) => <button key={category.code} type="button" onMouseEnter={() => { setHoveredTop(category); setHoveredMiddle(category.children[0] ?? null) }} onClick={() => navigateCategory(category.code)} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${hoveredTop?.code === category.code ? 'bg-brand-50 font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-200' : 'font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}><span className="w-6 text-center text-base">{category.iconKey ?? '🔧'}</span><span className="flex-1">{category.name}</span>{category.children.length > 0 ? <span aria-hidden="true">›</span> : null}</button>)}</div>
          <div className="max-h-120 w-52 overflow-y-auto border-r border-slate-100 bg-slate-50 py-1 dark:border-slate-800 dark:bg-slate-800/60">{hoveredTop?.children.map((category) => <button key={category.code} type="button" onMouseEnter={() => setHoveredMiddle(category)} onClick={() => navigateCategory(category.code)} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${hoveredMiddle?.code === category.code ? 'bg-white font-black text-brand-700 dark:bg-slate-700 dark:text-brand-200' : 'font-medium text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}`}><span>{category.name}</span>{category.children.length > 0 ? <span aria-hidden="true">›</span> : null}</button>)}</div>
          <div className="max-h-120 w-52 overflow-y-auto py-1">{hoveredMiddle?.children.length ? hoveredMiddle.children.map((category) => <button key={category.code} type="button" onClick={() => navigateCategory(category.code)} className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200">{category.name}</button>) : <p className="px-4 py-5 text-sm text-slate-400">세부 카테고리가 없습니다.</p>}</div>
        </div> : null}
      </div>
      <Link to="/" onClick={() => window.scrollTo(0, 0)} aria-label={'\uCCA0\uC218\uC57C \uD648'} className="group relative inline-flex h-14 w-44 shrink-0 items-center overflow-hidden rounded-lg bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 dark:bg-white dark:focus-visible:ring-brand-700">
        <img src="/brand/chulsooya-logo.webp" alt={'\uCCA0\uC218\uC57C'} className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-[1.025]" />
      </Link>
      <div ref={searchRef} className="relative min-w-0 flex-1"><div className="flex overflow-hidden rounded-xl border-2 border-brand-500 bg-white transition focus-within:ring-4 focus-within:ring-brand-100 dark:bg-slate-900 dark:focus-within:ring-brand-900/40"><input value={query} onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true) }} onKeyDown={(event) => { if (event.key === 'Enter') search() }} onFocus={() => setSuggestionsOpen(true)} placeholder="필요한 철물·공구를 검색해 보세요" className="h-11 min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" aria-label="상품 검색"/><button type="button" onClick={() => search()} className="grid w-12 place-items-center bg-brand-600 text-white transition hover:bg-brand-700" aria-label="검색"><span className="h-5 w-5"><SearchIcon /></span></button></div>{suggestionsOpen && suggestions.length > 0 ? <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); search(suggestion) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><span className="h-4 w-4 text-slate-400"><SearchIcon /></span>{suggestion}</button>)}</div> : null}</div>
      <div className="flex shrink-0 items-center gap-2 text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => setDark((value) => !value)}
          aria-label={dark ? '\uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uBC14\uAFB8\uAE30' : '\uB2E4\uD06C \uBAA8\uB4DC\uB85C \uBC14\uAFB8\uAE30'}
          className="group relative hidden h-11 w-11 place-items-center rounded-xl transition hover:bg-slate-100 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-slate-800 md:grid"
        >
          <span className="text-lg">{dark ? '\u2600' : '\u25D0'}</span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950"
          >
            {dark ? '\uB77C\uC774\uD2B8' : '\uB2E4\uD06C'}
          </span>
        </button>

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((opened) => !opened)}
            className="group relative grid h-11 w-11 place-items-center rounded-xl transition hover:bg-slate-100 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-slate-800"
            aria-label={displayName}
            aria-expanded={accountOpen}
          >
            <span className="h-6 w-6"><UserIcon /></span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950"
            >
              {displayName}
            </span>
          </button>
          {accountOpen ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <Link to="/my" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{'\uB9C8\uC774\uD398\uC774\uC9C0'}</Link>
              <Link to="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{'\uC8FC\uBB38 \uB0B4\uC5ED'}</Link>
              {user ? (
                <button type="button" onClick={() => void signOut()} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">{'\uB85C\uADF8\uC544\uC6C3'}</button>
              ) : (
                <Link to="/auth/login" className="block px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800">{'\uB85C\uADF8\uC778'}</Link>
              )}
            </div>
          ) : null}
        </div>

        <Link
          to="/cart"
          className="group relative grid h-11 w-11 place-items-center rounded-xl transition hover:bg-slate-100 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-slate-800"
          aria-label={'\uC7A5\uBC14\uAD6C\uB2C8'}
        >
          <span className="h-6 w-6"><CartIcon /></span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950"
          >
            {'\uC7A5\uBC14\uAD6C\uB2C8'}
          </span>
          {cart?.itemCount ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {cart.itemCount > 99 ? '99+' : cart.itemCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
    <nav className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="빠른 탐색"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5">{QUICK_LINKS.map((item) => <Link key={item.label} to="/" onClick={(event) => {
        event.preventDefault()
        const section = document.getElementById(item.target)
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        navigate('/', { state: { quickSection: item.target } })
      }} className={`shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:focus-visible:ring-brand-700 ${item.tone}`}>{item.label}</Link>)}<div className="ml-auto shrink-0 border-l border-slate-200 pl-2 dark:border-slate-700"><Link to="/stores" className="inline-flex border-b-2 border-slate-900 px-3 py-2 text-sm font-black text-slate-900 transition hover:bg-slate-100 dark:border-white dark:text-white dark:hover:bg-slate-900">판매점 찾기</Link></div></div></nav>
  </header>
}
