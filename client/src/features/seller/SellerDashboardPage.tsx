import { Link } from 'react-router-dom'
import { sellerApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { SlotControlBar } from './SlotControlBar'
import { SellerReviewPanel } from './SellerReviewPanel'
import type { AssignedOrder, SellerMetrics, SellerOffer, SellerStore } from '@/types/api'

export function SellerDashboardPage() {
  const store = useAsync<SellerStore>(() => sellerApi.store(), [], { pollMs: 5000, stopPollingOnError: true })
  const hasStore = Boolean(store.data)
  const offers = useAsync<SellerOffer[]>(() => sellerApi.offers(), [], { pollMs: 3000, enabled: hasStore })
  const orders = useAsync<AssignedOrder[]>(() => sellerApi.assignedOrders(), [], { pollMs: 5000, enabled: hasStore })
  const metrics = useAsync<SellerMetrics>(() => sellerApi.metrics(), [], { pollMs: 15000, enabled: hasStore })
  if (store.loading && !store.data) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="매장 정보를 불러오는 중입니다" /></div>
  if (store.error?.status === 404 && !store.data) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyView title="등록된 판매점이 없습니다" description="판매자 신청을 접수한 뒤 승인되면 주문 제안과 슬롯 운영을 이용할 수 있습니다." action={<Link to="/seller/application" className="guide-cta-primary">판매자 신청 확인</Link>} /></div>
  if (store.error && !store.data) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorView error={store.error} onRetry={store.reload} /></div>
  if (!store.data) return null

  const pendingConfirm = (orders.data ?? []).filter((order) => order.status === 'SELLER_CONFIRMING')
  const openOfferCount = offers.data?.length ?? 0
  const metricCards = [
    ['📨', '새 주문 제안', openOfferCount, '지금 응찰 가능한 주문'], ['📦', '물품 확인 대기', pendingConfirm.length, '2분 내 재고 확인 필요'], ['🏆', '낙찰 건수', metrics.data?.wonBids ?? 0, '누적 낙찰 주문'], ['⭐', '신뢰 점수', Math.round(metrics.data?.trustScore ?? 0), '매장 운영 신뢰도'],
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand-600">SELLER CONSOLE</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">판매자 대시보드</h1><p className="mt-2 text-sm text-slate-500">실시간 주문 제안과 진행 주문을 빠르게 관리하세요.</p></div><Link to="/seller/offers" className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white shadow-md hover:bg-brand-700">주문 제안 확인 →</Link></div><SlotControlBar store={store.data} onChanged={() => { store.reload(); offers.reload() }} />{pendingConfirm.length > 0 ? <Link to="/seller/orders" className="mt-5 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><span><strong>물품 확인이 필요한 주문이 {pendingConfirm.length}건 있습니다.</strong><small className="ml-2">기한 내 확인하지 않으면 주문이 회수됩니다.</small></span><span className="font-black">지금 확인 →</span></Link> : null}<section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metricCards.map(([icon, label, value, description]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl">{icon}</span><p className="mt-5 text-3xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">{label}</p><p className="mt-1 text-xs text-slate-500">{description}</p></article>)}</section><section className="mt-6 grid gap-4 md:grid-cols-3">{[['📨', '실시간 주문 제안', `${openOfferCount}건 대기`, '/seller/offers'], ['📦', '진행 주문 관리', `${(orders.data ?? []).length}건 진행`, '/seller/orders'], ['⚙️', '슬롯 운영 설정', `수신 가능 ${store.data.availableSlots}슬롯`, '/seller/settings']].map(([icon, title, description, to]) => <Link key={title} to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl">{icon}</span><p className="mt-4 text-sm font-black text-slate-900 group-hover:text-brand-600 dark:text-white">{title}<span className="float-right">→</span></p><p className="mt-1 text-xs text-slate-500">{description}</p></Link>)}</section><SellerReviewPanel />{metrics.error ? <div className="mt-6"><ErrorView error={metrics.error} onRetry={metrics.reload} /></div> : null}</div>
  )
}
