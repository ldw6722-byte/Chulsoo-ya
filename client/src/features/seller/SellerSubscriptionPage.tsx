import { useEffect, useMemo, useState } from 'react'
import { sellerSubscriptionApi } from '../../api/endpoints'
import type { SellerSubscriptionStatus, SubscriptionProduct } from '../../types/api'
import { LoadingView } from '@/components/StateViews'

const LABEL: Record<string, string> = {
  PREMIUM: '프리미엄',
  GOLD: '골드',
  SILVER: '실버',
  PURCHASED: '구독결제 승인',
  ADMIN_CHANGED: '관리자 등급 조정',
  EXPIRED: '구독 기간 만료',
}

const won = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원'
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '-'

type TierPolicy = { slotCap: number; dispatchDelaySeconds: number }

function ProductCard({
  product,
  policy,
  currentTier,
  pending,
  onSelect,
}: {
  product: SubscriptionProduct
  policy: TierPolicy | undefined
  currentTier: string
  pending: boolean
  onSelect: (product: SubscriptionProduct) => void
}) {
  const isCurrent = currentTier === product.tier
  const tierClass = product.tier === 'PREMIUM'
    ? 'border-violet-300 bg-violet-50/60 dark:border-violet-500/50 dark:bg-violet-950/20'
    : product.tier === 'GOLD'
      ? 'border-amber-300 bg-amber-50/60 dark:border-amber-600/60 dark:bg-amber-950/20'
      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'

  return (
    <article className={`flex min-h-[19rem] flex-col overflow-hidden rounded-2xl border shadow-sm ${tierClass}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black tracking-[0.14em] text-brand-700 dark:text-brand-300">{LABEL[product.tier]} PLAN</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">{product.name}</h2>
          </div>
          {isCurrent ? <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">현재 적용 중</span> : null}
        </div>
        <p className="mt-3 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-300">{product.description || '관리자 대시보드에서 등록한 판매자 운영 플랜입니다.'}</p>
        <div className="mt-4 flex items-end gap-1.5">
          <strong className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{product.price === 0 ? '무료' : won(product.price)}</strong>
          {product.price > 0 ? <span className="pb-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">/ {product.durationMonths}개월</span> : null}
        </div>
      </div>
      <div className="mt-auto border-t border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <ul className="space-y-1.5 text-sm leading-5 text-slate-700 dark:text-slate-200">
          <li>최대 동시 주문 수신 <strong>{policy?.slotCap ?? '-'}슬롯</strong></li>
          <li><strong>새 주문 제안 우선순위</strong></li>
          <li>{!policy ? '-' : policy.dispatchDelaySeconds === 0 ? '새 주문이 들어오면 가장 먼저 제안을 받을 수 있습니다.' : `새 주문이 들어온 뒤 약 ${policy.dispatchDelaySeconds === 60 ? '1분' : `${policy.dispatchDelaySeconds}초`} 후 제안을 받습니다.`}</li>
        </ul>
        <button
          type="button"
          disabled={pending || isCurrent}
          onClick={() => onSelect(product)}
          className="mt-4 min-h-11 w-full rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 dark:border-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:border-slate-700 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isCurrent ? '현재 적용 중인 플랜' : pending ? '승인 대기 요청이 있습니다' : `${LABEL[product.tier]} 플랜 결제 요청`}
        </button>
      </div>
    </article>
  )
}

function PaymentRequestModal({
  product,
  busy,
  onCancel,
  onConfirm,
}: {
  product: SubscriptionProduct
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 sm:items-center" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="subscription-payment-title" className="w-full max-w-lg rounded-2xl border border-violet-300 bg-white p-5 shadow-2xl dark:border-violet-700 dark:bg-slate-900 sm:p-6">
        <p className="text-xs font-black tracking-[0.14em] text-violet-700 dark:text-violet-300">결제 요청 확인</p>
        <h2 id="subscription-payment-title" className="mt-2 text-xl font-black text-slate-950 dark:text-white">{product.name} 결제 요청을 보낼까요?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">요청 금액은 <strong>{won(product.price)}</strong>입니다. 현재는 실제 PG 결제 연결 전 내부 승인 테스트 단계이며, 요청은 최고관리자의 구독결제 승인 탭으로 전달됩니다.</p>
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">승인 전에는 현재 등급과 최대 슬롯이 바뀌지 않습니다.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">취소</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="min-h-11 rounded-xl border border-brand-700 bg-brand-600 px-5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-50">{busy ? '요청 등록 중…' : '결제 요청 보내기'}</button>
        </div>
      </section>
    </div>
  )
}

export default function SellerSubscriptionPage() {
  const [status, setStatus] = useState<SellerSubscriptionStatus | null>(null)
  const [products, setProducts] = useState<SubscriptionProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<SubscriptionProduct | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [nextStatus, nextProducts] = await Promise.all([sellerSubscriptionApi.status(), sellerSubscriptionApi.products()])
      setStatus(nextStatus)
      setProducts(nextProducts.filter((product) => product.active && product.tier !== 'SILVER').sort((left, right) => left.displayOrder - right.displayOrder))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독 정보를 불러오지 못했습니다.')
    }
  }

  useEffect(() => { void load() }, [])

  const policies = useMemo(() => new Map((status?.tierPolicies ?? []).map((policy) => [policy.tier, policy])), [status?.tierPolicies])
  const pending = status?.pendingPaymentRequest ?? null

  const requestPayment = async () => {
    if (!selectedProduct) return
    setBusy(true)
    try {
      await sellerSubscriptionApi.requestPayment(selectedProduct.id)
      setSelectedProduct(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독 결제 요청을 만들지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (!status && !error) return <LoadingView label="구독 상품과 현재 판매점 상태를 불러오는 중입니다." />
  if (!status) return <main className="mx-auto max-w-3xl px-4 py-10"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/25"><p className="font-black text-rose-800 dark:text-rose-200">{error || '구독 정보를 불러오지 못했습니다.'}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl border border-rose-300 bg-white px-4 text-sm font-black text-rose-700 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-200">다시 시도</button></div></main>

  const currentPolicy = policies.get(status.tier)
  const visibleCards = [
    { id: 0, tier: 'SILVER', name: '실버 기본 운영', description: '판매자 승인 후 기본으로 적용되는 운영 등급입니다. 별도 결제 요청 없이 사용할 수 있습니다.', price: 0, durationMonths: 0, active: true, displayOrder: -1 },
    ...products,
  ] as SubscriptionProduct[]

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <p className="text-[11px] font-black tracking-[0.16em] text-brand-700 dark:text-brand-300">SELLER SUBSCRIPTION</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">철수야 구독 플랜</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">판매점 규모와 주문량에 맞는 플랜을 선택하세요. 플랜이 적용되면 동시에 받을 수 있는 주문 수와 주문을 받는 순서가 달라집니다.</p>
          </div>
          {pending ? <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">{pending.productName} 승인 대기</span> : null}
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="p-3"><p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">현재 등급</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{LABEL[status.tier]}</p></div>
          <div className="p-3"><p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">최대 슬롯</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{currentPolicy?.slotCap ?? '-'}슬롯</p></div>
          <div className="p-3"><p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">구독 만료</p><p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{dateTime(status.subscriptionExpiresAt)}</p></div>
        </div>
      </section>

      {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">{error}</p> : null}

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[11px] font-black tracking-[0.15em] text-brand-700 dark:text-brand-300">PLAN COMPARISON</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">판매점에 맞는 운영 플랜을 선택하세요</h2></div><p className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block">승인 전에는 현재 플랜이 유지됩니다.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCards.map((product) => <ProductCard key={product.id} product={product} policy={policies.get(product.tier)} currentTier={status.tier} pending={Boolean(pending)} onSelect={setSelectedProduct} />)}</div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <h2 className="text-base font-black text-slate-950 dark:text-white">등급 변경 이력</h2>
        {(status.history?.length ?? 0) === 0 ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">아직 승인된 구독 변경 이력이 없습니다.</p> : <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><tr><th className="px-3 py-2">시각</th><th className="px-3 py-2">변경</th><th className="px-3 py-2">처리</th><th className="px-3 py-2">만료일</th><th className="px-3 py-2">사유</th></tr></thead><tbody>{status.history.map((item) => <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800"><td className="px-3 py-2 text-slate-600 dark:text-slate-300">{dateTime(item.createdAt)}</td><td className="px-3 py-2 font-bold text-slate-950 dark:text-white">{LABEL[item.previousTier]} → {LABEL[item.nextTier]}</td><td className="px-3 py-2 text-slate-600 dark:text-slate-300">{LABEL[item.eventType]}</td><td className="px-3 py-2 text-slate-600 dark:text-slate-300">{dateTime(item.expiresAt)}</td><td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.reason || '-'}</td></tr>)}</tbody></table></div>}
      </section>

      {selectedProduct ? <PaymentRequestModal product={selectedProduct} busy={busy} onCancel={() => setSelectedProduct(null)} onConfirm={() => void requestPayment()} /> : null}
    </main>
  )
}
