import { notify } from "@/lib/notify"
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cartApi, catalogApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { ToolProductCard } from '@/components/shop/ToolProductCard'
import { EventHeroCarousel } from '@/components/shop/EventHeroCarousel'
import { PopupAdvertisingPopup } from '@/components/popup/PopupAdvertisingLayer'
import { StoreFinder } from '@/features/stores/StoreFinder'
import { useAuth } from '@/app/useAuth'
import { isSupabaseConfigured, supabaseAuth } from '@/lib/supabase'
import { setAccessToken } from '@/lib/auth-session'
import type { Category, Product } from '@/types/api'

const PRODUCT_LIMIT = 36

type SectionTone = 'violet' | 'rose' | 'amber'

const TONE_STYLE: Record<SectionTone, { marker: string; button: string }> = {
  violet: { marker: 'bg-sky-500', button: 'text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40' },
  rose: { marker: 'bg-emerald-500', button: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40' },
  amber: { marker: 'bg-rose-500', button: 'text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40' },
}
export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refresh } = useAuth()
  const quickSection = (location.state as { quickSection?: string } | null)?.quickSection
  const [addingId, setAddingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const categories = useAsync<Category[]>(() => catalogApi.categories(), [])
  const newest = useAsync(() => catalogApi.products({ page: 0, size: PRODUCT_LIMIT, sort: 'newest' }), [])
  const popular = useAsync<Product[]>(() => catalogApi.popular(PRODUCT_LIMIT), [])
  const featured = useAsync<Product[]>(() => catalogApi.featured(PRODUCT_LIMIT), [])

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const target = quickSection

    if (!target) {
      window.scrollTo(0, 0)
      return () => { window.history.scrollRestoration = previousRestoration }
    }

    const timer = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => {
      window.clearTimeout(timer)
      window.history.scrollRestoration = previousRestoration
    }
  }, [location.key, quickSection])

  async function addToCart(product: Product) {
    if (!user) {
      const session = isSupabaseConfigured ? await supabaseAuth.getSession() : null
      if (!session) {
        navigate(`/auth/login?next=${encodeURIComponent(`/product/${product.id}`)}`)
        return
      }
      setAccessToken(session.access_token)
      await refresh()
    }
    setAddingId(product.id)
    setNotice(null)
    try {
            await cartApi.addItem(product.id, 1)
      window.dispatchEvent(new Event('chulsooya:cart-updated'))
      notify(`${product.name}\uC744 \uC7A5\uBC14\uAD6C\uB2C8\uC5D0 \uB2F4\uC558\uC2B5\uB2C8\uB2E4.`)

      setNotice(`${product.name}을 장바구니에 담았습니다.`)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "\\uC7A5\\uBC14\\uAD6C\\uB2C8\\uC5D0 \\uB2F4\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4."
      setNotice(message)
      notify(message, "error")
    } finally {
      setAddingId(null)
    }
  }

  function productSection(
    id: string,
    tone: SectionTone,
    title: string,
    items: Product[] | undefined,
    loading: boolean,
    error: ApiError | null,
    retry: () => void,
    to: string,
  ) {
    const style = TONE_STYLE[tone]
    return (
      <section id={id} className="mb-20 scroll-mt-28">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className={`h-7 w-1 shrink-0 rounded-full ${style.marker}`} />
            <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h2>
          </div>
          <Link to={to} className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${style.button}`}>
            {'\uC804\uCCB4 \uBCF4\uAE30'} <span aria-hidden="true">{'\u2192'}</span>
          </Link>
        </div>
        {loading ? <LoadingView label="상품을 불러오는 중입니다" /> : null}
        {error ? <ErrorView error={error} onRetry={retry} /> : null}
        {!loading && !error && (items?.length ?? 0) === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-4xl">🧰</p>
            <p className="mt-3 font-bold text-slate-700 dark:text-slate-200">상품을 준비 중입니다.</p>
          </div>
        ) : null}
        {!loading && !error && (items?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
            {items?.slice(0, 30).map((product) => (
              <ToolProductCard key={product.id} product={product} adding={addingId === product.id} onAdd={addToCart} />
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <>
      <PopupAdvertisingPopup />
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <section id="quick-hero" className="scroll-mt-28">
        <EventHeroCarousel />
      </section>
      <StoreFinder compact />

      <section className="mb-12 scroll-mt-28">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">어떤 철물·공구를 찾으세요?</h2>
          </div>
          <Link to="/catalog" className="rounded-lg px-3 py-2 text-sm font-black text-brand-600 transition hover:bg-brand-50 dark:hover:bg-brand-950/30">전체보기 →</Link>
        </div>
        {categories.loading ? <LoadingView label="카테고리를 불러오는 중입니다" /> : null}
        {categories.error ? <ErrorView error={categories.error} onRetry={categories.reload} /> : null}
        {!categories.loading && !categories.error ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {(categories.data ?? []).map((category) => (
              <Link key={category.code} to={`/catalog?categoryCode=${encodeURIComponent(category.code)}`} className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-transparent bg-white px-2 text-center shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:bg-slate-900">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl transition group-hover:bg-brand-600 group-hover:grayscale dark:bg-brand-950/60">{category.iconKey ?? '🔧'}</span>
                <span className="line-clamp-1 text-xs font-bold text-slate-600 dark:text-slate-300">{category.name}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {notice ? (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span>✓ {notice}</span>
          <Link to="/cart" className="ml-auto font-bold underline">장바구니 보기</Link>
        </div>
      ) : null}

      {productSection(
        'quick-newest',
        'violet',
        '\uC2E0\uADDC \uC0C1\uD488',
        newest.data?.items,
        newest.loading,
        newest.error,
        newest.reload,
        '/catalog?sort=newest',
      )}
      {productSection(
        'quick-popular',
        'rose',
        '\uC778\uAE30 \uACF5\uAD6C',
        popular.data ?? undefined,
        popular.loading,
        popular.error,
        popular.reload,
        '/catalog?sort=popular',
      )}
      {productSection(
        'quick-featured',
        'amber',
        '\uCD94\uCC9C \uC0C1\uD488',
        featured.data ?? undefined,
        featured.loading,
        featured.error,
        featured.reload,
        '/catalog?sort=popular',
      )}    </div>
    </>
  )
}
