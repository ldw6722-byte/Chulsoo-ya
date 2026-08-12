import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cartApi, catalogApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import type { Cart, CategoryTreeNode } from '@/types/api'

const QUICK_LINKS = [
  { label: '빠른 매칭', to: '/catalog?sort=popular', tone: 'text-blue-600' },
  { label: '인기 철물', to: '/catalog?sort=popular', tone: 'text-rose-600' },
  { label: '신규 상품', to: '/catalog?sort=newest', tone: 'text-violet-600' },
  { label: '특가 공구', to: '/catalog?sort=priceAsc', tone: 'text-brand-600' },
] as const

function MenuIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg> }
function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path strokeLinecap="round" d="m16 16 4 4" /></svg> }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg> }
function CartIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l1.5 10.2a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg> }

export function ShopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity } = useIdentity()
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
    <div className="bg-slate-900 text-[11px] text-slate-200"><div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-4 px-4"><Link to="/my" className="hover:text-white">마이페이지</Link>{user ? <><span className="max-w-45 truncate text-slate-400">{user.email}</span><button type="button" onClick={() => void signOut()} className="hover:text-white">로그아웃</button></> : <><Link to="/auth/login" className="hover:text-white">로그인</Link><Link to="/auth/signup" className="hover:text-white">회원가입</Link></>}<Link to="/admin" className="hover:text-white">관리자</Link></div></div>
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5">
      <div ref={categoryRef} className="relative hidden shrink-0 sm:block"><button type="button" onClick={toggleCategory} className="flex h-14 w-16 flex-col items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700" aria-expanded={categoryOpen}><span className="h-5 w-5"><MenuIcon /></span><span className="mt-1 text-[11px] font-semibold">카테고리</span></button>
        {categoryOpen ? <div className="absolute left-0 top-full mt-2 flex min-w-180 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-120 w-52 overflow-y-auto border-r border-slate-100 py-1 dark:border-slate-800">{tree.map((category) => <button key={category.code} type="button" onMouseEnter={() => { setHoveredTop(category); setHoveredMiddle(category.children[0] ?? null) }} onClick={() => navigateCategory(category.code)} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${hoveredTop?.code === category.code ? 'bg-brand-50 font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-200' : 'font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}><span className="w-6 text-center text-base">{category.iconKey ?? '🔧'}</span><span className="flex-1">{category.name}</span>{category.children.length > 0 ? <span aria-hidden="true">›</span> : null}</button>)}</div>
          <div className="max-h-120 w-52 overflow-y-auto border-r border-slate-100 bg-slate-50 py-1 dark:border-slate-800 dark:bg-slate-800/60">{hoveredTop?.children.map((category) => <button key={category.code} type="button" onMouseEnter={() => setHoveredMiddle(category)} onClick={() => navigateCategory(category.code)} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${hoveredMiddle?.code === category.code ? 'bg-white font-black text-brand-700 dark:bg-slate-700 dark:text-brand-200' : 'font-medium text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700'}`}><span>{category.name}</span>{category.children.length > 0 ? <span aria-hidden="true">›</span> : null}</button>)}</div>
          <div className="max-h-120 w-52 overflow-y-auto py-1">{hoveredMiddle?.children.length ? hoveredMiddle.children.map((category) => <button key={category.code} type="button" onClick={() => navigateCategory(category.code)} className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200">{category.name}</button>) : <p className="px-4 py-5 text-sm text-slate-400">세부 카테고리가 없습니다.</p>}</div>
        </div> : null}
      </div>
      <Link to="/" className="shrink-0 text-2xl font-black tracking-tight text-brand-600 md:text-3xl">철수야</Link>
      <div ref={searchRef} className="relative min-w-0 flex-1"><div className="flex overflow-hidden rounded-xl border-2 border-brand-500 bg-white transition focus-within:ring-4 focus-within:ring-brand-100 dark:bg-slate-900 dark:focus-within:ring-brand-900/40"><input value={query} onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true) }} onKeyDown={(event) => { if (event.key === 'Enter') search() }} onFocus={() => setSuggestionsOpen(true)} placeholder="필요한 철물·공구를 검색해 보세요" className="h-11 min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white" aria-label="상품 검색"/><button type="button" onClick={() => search()} className="grid w-12 place-items-center bg-brand-600 text-white transition hover:bg-brand-700" aria-label="검색"><span className="h-5 w-5"><SearchIcon /></span></button></div>{suggestionsOpen && suggestions.length > 0 ? <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); search(suggestion) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><span className="h-4 w-4 text-slate-400"><SearchIcon /></span>{suggestion}</button>)}</div> : null}</div>
      <div className="flex shrink-0 items-center gap-2 text-slate-600 dark:text-slate-300"><button type="button" onClick={() => setDark((value) => !value)} className="hidden flex-col items-center px-1 text-[11px] hover:text-brand-600 md:flex"><span className="text-lg">{dark ? '☀' : '◐'}</span>{dark ? '라이트' : '다크'}</button><div ref={accountRef} className="relative"><button type="button" onClick={() => setAccountOpen((opened) => !opened)} className="flex flex-col items-center px-1 text-[11px] hover:text-brand-600" aria-expanded={accountOpen}><span className="h-6 w-6"><UserIcon /></span><span className="hidden sm:block">{displayName}</span></button>{accountOpen ? <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"><Link to="/my" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">마이페이지</Link><Link to="/orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">주문 내역</Link>{user ? <button type="button" onClick={() => void signOut()} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">로그아웃</button> : <Link to="/auth/login" className="block px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800">로그인</Link>}</div> : null}</div><Link to="/cart" className="relative flex flex-col items-center px-1 text-[11px] hover:text-brand-600" aria-label="장바구니"><span className="h-6 w-6"><CartIcon /></span><span className="hidden sm:block">장바구니</span>{cart?.itemCount ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{cart.itemCount > 99 ? '99+' : cart.itemCount}</span> : null}</Link></div>
    </div>
    <nav className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="빠른 탐색"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5">{QUICK_LINKS.map((item) => <Link key={item.label} to={item.to} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800 ${item.tone}`}>{item.label}</Link>)}<Link to="/seller" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">판매자 운영</Link></div></nav>
  </header>
}
