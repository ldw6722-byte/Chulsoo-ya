import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartApi, catalogApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { ToolProductCard } from '@/components/shop/ToolProductCard'
import { useAuth } from '@/app/useAuth'
import type { Category, Product } from '@/types/api'

const HEROES = [
  { eyebrow: '동네 철물점 실시간 매칭', title: '필요한 철물과 공구,\n지금 바로 찾아보세요', description: '가까운 철물점에 주문을 즉시 전달하고 가장 빠른 응답을 매칭합니다.', to: '/catalog', cta: '전체 상품 보기', gradient: 'from-brand-700 via-brand-600 to-violet-500', icon: '🔧' },
  { eyebrow: '현장 자재도 한 번에', title: '대량 주문부터\n긴급 보수까지', description: '필요한 자재 목록을 담아 동네 판매자에게 빠르게 요청하세요.', to: '/catalog?sort=popular', cta: '인기 철물 보기', gradient: 'from-sky-600 via-blue-600 to-brand-700', icon: '🧱' },
  { eyebrow: '픽업·배송 선택 가능', title: '가까운 철물점에서\n더 편하게 받으세요', description: '매칭 후 픽업 또는 배송 방식을 선택할 수 있습니다.', to: '/catalog?sort=newest', cta: '신규 상품 보기', gradient: 'from-emerald-600 via-teal-600 to-cyan-700', icon: '🛠️' },
] as const

export function HomePage() {
  const navigate = useNavigate()
  const { configured, user } = useAuth()
  const [heroIndex, setHeroIndex] = useState(0)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const categories = useAsync<Category[]>(() => catalogApi.categories(), [])
  const featured = useAsync<Product[]>(() => catalogApi.featured(12), [])
  const popular = useAsync<Product[]>(() => catalogApi.popular(12), [])
  const newest = useAsync<{ items: Product[] }>(() => catalogApi.products({ page: 0, size: 8, sort: 'newest' }), [])

  useEffect(() => { const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % HEROES.length), 4500); return () => window.clearInterval(timer) }, [])
  async function addToCart(product: Product) { if (configured && !user) { navigate('/auth/login'); return } setAddingId(product.id); setNotice(null); try { await cartApi.addItem(product.id, 1); setNotice(`${product.name}을 장바구니에 담았습니다.`) } catch (error) { setNotice(error instanceof ApiError ? error.message : '장바구니에 담지 못했습니다.') } finally { setAddingId(null) } }

  const productSection = (title: string, eyebrow: string, tone: string, items: Product[] | undefined, loading: boolean, error: ApiError | null, retry: () => void, to: string) => <section className="mb-11"><div className="mb-4 flex items-end justify-between"><div><p className={`text-sm font-bold ${tone}`}>{eyebrow}</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{title}</h2></div><Link to={to} className="text-sm font-bold text-brand-600 hover:underline">전체보기 →</Link></div>{loading ? <LoadingView label="상품을 불러오는 중입니다" /> : error ? <ErrorView error={error} onRetry={retry} /> : (items?.length ?? 0) === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center dark:border-slate-700 dark:bg-slate-900"><p className="text-4xl">🧰</p><p className="mt-3 font-bold text-slate-700 dark:text-slate-200">상품을 준비 중입니다.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{items?.slice(0, 10).map((product) => <ToolProductCard key={product.id} product={product} adding={addingId === product.id} onAdd={addToCart} />)}</div>}</section>

  return <div className="mx-auto max-w-7xl px-4 py-6 md:py-8"><section className="relative mb-9 h-72 overflow-hidden rounded-3xl shadow-xl md:h-96">{HEROES.map((hero, index) => <div key={hero.title} className={`absolute inset-0 flex items-center bg-gradient-to-r ${hero.gradient} px-7 text-white transition-opacity duration-700 md:px-14 ${index === heroIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}><div className="max-w-xl"><p className="mb-3 text-sm font-bold tracking-wide text-white/75">{hero.eyebrow}</p><h1 className="whitespace-pre-line text-3xl font-black leading-tight md:text-5xl">{hero.title}</h1><p className="mt-5 max-w-md text-sm leading-6 text-white/85 md:text-base">{hero.description}</p><Link to={hero.to} className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100">{hero.cta} <span className="ml-2">→</span></Link></div><div className="pointer-events-none absolute -right-12 top-8 hidden h-72 w-72 rounded-full border-20 border-white/10 md:block" /><div className="pointer-events-none absolute bottom-8 right-16 hidden text-9xl opacity-20 md:block">{hero.icon}</div></div>)}<div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">{HEROES.map((hero, index) => <button key={hero.title} type="button" aria-label={`${index + 1}번 배너`} onClick={() => setHeroIndex(index)} className={`h-2.5 rounded-full transition-all ${index === heroIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/50'}`} />)}</div></section>
    <section className="mb-11"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold text-brand-600">HARDWARE CATEGORY</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">어떤 철물·공구를 찾으세요?</h2></div><Link to="/catalog" className="text-sm font-bold text-brand-600 hover:underline">전체보기 →</Link></div>{categories.loading ? <LoadingView label="카테고리를 불러오는 중입니다" /> : categories.error ? <ErrorView error={categories.error} onRetry={categories.reload} /> : <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">{(categories.data ?? []).map((category) => <Link key={category.code} to={`/catalog?categoryCode=${encodeURIComponent(category.code)}`} className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-transparent bg-white px-2 text-center shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:bg-slate-900"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl transition group-hover:bg-brand-600 group-hover:grayscale dark:bg-brand-950/60">{category.iconKey ?? '🔧'}</span><span className="line-clamp-1 text-xs font-bold text-slate-600 dark:text-slate-300">{category.name}</span></Link>)}</div>}</section>
    {notice ? <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>✓ {notice}</span><Link to="/cart" className="ml-auto font-bold underline">장바구니 보기</Link></div> : null}
    {productSection('철수야 추천 공구', 'FEATURED TOOLS', 'text-brand-600', featured.data ?? undefined, featured.loading, featured.error, featured.reload, '/catalog?sort=popular')}
    {productSection('지금 많이 찾는 철물', 'POPULAR NOW', 'text-rose-500', popular.data ?? undefined, popular.loading, popular.error, popular.reload, '/catalog?sort=popular')}
    {productSection('새로 등록된 상품', 'NEW ARRIVALS', 'text-violet-600', newest.data?.items, newest.loading, newest.error, newest.reload, '/catalog?sort=newest')}
  </div>
}
