import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cartApi } from '@/api/endpoints'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { formatWon } from '@/components/format'
import type { Cart } from '@/types/api'

export function CartPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const { identity } = useIdentity()
  const isAuthenticated = Boolean(user ?? identity)
  const [busyItemId, setBusyItemId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const pendingScrollYRef = useRef<number | null>(null)
  const cart = useAsync<Cart>(() => cartApi.view(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading })
  useEffect(() => { if (cart.data) window.dispatchEvent(new Event("chulsooya:cart-updated")) }, [cart.data])
  useLayoutEffect(() => {
    if (pendingScrollYRef.current === null || !cart.data) return
    window.scrollTo({ top: pendingScrollYRef.current, behavior: "instant" })
    pendingScrollYRef.current = null
  }, [cart.data])

  async function run(itemId: number, task: () => Promise<Cart>) {
    setBusyItemId(itemId)
    setActionError(null)
    try {
      await task()
      cart.reload()
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : '요청을 처리할 수 없습니다.')
    } finally {
      setBusyItemId(null)
    }
  }

  if (isLoading || cart.loading) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="장바구니를 불러오는 중입니다" /></div>
  if (cart.error) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorView error={cart.error} onRetry={cart.reload} /></div>
  if (!cart.data) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="장바구니를 불러오는 중입니다" /></div>

  const items = cart.data?.items ?? []
  if (items.length === 0) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyView title="장바구니가 비어 있습니다" description="카탈로그에서 필요한 공구를 담아 주세요." action={<Link to="/catalog" className="btn btn-primary">공구 둘러보기</Link>} /></div>

  const productAmount = cart.data?.itemsAmount ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
      <div className="mb-7"><p className="text-sm font-bold text-brand-600">SHOPPING CART</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">장바구니 <span className="text-brand-600">{items.length}</span></h1></div>
      {actionError ? <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{actionError}</p> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">선택 상품 <span className="ml-1 text-brand-600">{items.length}개</span></div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => <li key={item.id} className="flex gap-4 p-4 sm:p-5">
              <div className="grid h-22 w-22 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-violet-100 text-3xl dark:from-slate-800 dark:to-brand-950">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : '🔧'}</div>
              <div className="min-w-0 flex-1"><Link to={`/product/${item.productId}`} className="line-clamp-1 text-sm font-black text-slate-900 hover:text-brand-600 dark:text-white">{item.productName}</Link><p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.specSummary ?? '표준 규격 상품'}{item.unit ? ` · ${item.unit}` : ''}</p><p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{formatWon(item.unitPrice)}</p><p className="mt-1 text-xs text-brand-700">{item.priceTierLabel}  안내 브랜드: {item.priceTierBrands}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><button type="button" disabled={busyItemId === item.id || item.quantity <= 1} onClick={() => void run(item.id, () => cartApi.changeQuantity(item.id, item.quantity - 1))} className="h-9 w-9 text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={`${item.productName} 수량 감소`}>−</button><span className="grid h-9 w-10 place-items-center border-x border-slate-200 text-center text-sm font-black tabular-nums dark:border-slate-700">{item.quantity}</span><button type="button" disabled={busyItemId === item.id} onClick={() => void run(item.id, () => cartApi.changeQuantity(item.id, item.quantity + 1))} className="h-9 w-9 text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={`${item.productName} 수량 증가`}>+</button></div><button type="button" disabled={busyItemId === item.id} onClick={() => void run(item.id, () => cartApi.removeItem(item.id))} className="text-xs font-bold text-slate-400 hover:text-rose-600">삭제</button></div></div>
              <p className="shrink-0 text-right text-sm font-black text-slate-900 dark:text-white">{formatWon(item.lineAmount)}</p>
            </li>)}
          </ul>
        </section>

        <aside className="sticky top-35 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">주문 예상 금액</h2><div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm dark:border-slate-800"><div className="flex justify-between text-slate-500"><span>상품 금액</span><strong className="text-slate-900 dark:text-white">{formatWon(productAmount)}</strong></div><div className="flex justify-between text-slate-500"><span>배송비</span><span>주문 요청 시 계산</span></div></div><div className="mt-5 flex items-end justify-between"><span className="font-bold text-slate-700 dark:text-slate-200">합계</span><strong className="text-2xl font-black text-brand-600">{formatWon(productAmount)}<span className="text-xs">부터</span></strong></div><p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">판매자 매칭과 재고 확인이 끝난 뒤 결제를 진행합니다.</p><label className="mt-4 flex gap-2 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs leading-5 text-slate-700"><input type="checkbox" checked={Boolean(cart.data?.priceTierAgreed)} onChange={() => void cartApi.agreePriceTierSupply().then(cart.reload)} className="mt-1 accent-brand-600"/><span>가격대 해당 제품은 판매자 보유 브랜드로 납품됩니다. 가격대별 브랜드명을 확인했습니다.</span></label><button type="button" disabled={!cart.data?.priceTierAgreed} onClick={() => navigate('/checkout')} className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45">주문 요청하기</button><Link to="/catalog" className="mt-3 block text-center text-sm font-bold text-slate-500 hover:text-brand-600">계속 쇼핑하기</Link></aside>
      </div>
    </div>
  )
}
