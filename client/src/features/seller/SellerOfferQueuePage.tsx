import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sellerApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { formatDuration, useServerCountdown } from '@/hooks/useServerCountdown'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { formatWon } from '@/components/format'
import type { SellerOffer, SellerStore } from '@/types/api'

export function SellerOfferQueuePage() {
  const store = useAsync<SellerStore>(() => sellerApi.store(), [], { pollMs: 5000 })
  const offers = useAsync<SellerOffer[]>(() => sellerApi.offers(), [], { pollMs: 2000 })
  const [message, setMessage] = useState<string | null>(null)
  if (offers.loading && !offers.data) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="주문 제안을 확인하는 중입니다" /></div>
  if (offers.error && !offers.data) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorView error={offers.error} onRetry={offers.reload} /></div>
  const items = offers.data ?? []

  return <div className="mx-auto max-w-5xl px-4 py-7 md:py-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand-600">LIVE OFFERS</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">실시간 주문 제안</h1><p className="mt-2 text-sm text-slate-500">수락하면 즉시 낙찰되고, 다음 단계에서 실제 재고를 확인합니다.</p></div>{store.data ? <span className={`rounded-full px-4 py-2 text-sm font-black ${store.data.availableSlots > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'}`}>수신 가능 {store.data.availableSlots}슬롯</span> : null}</div>{message ? <p role="status" className="mb-5 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">{message}</p> : null}{store.data && store.data.availableSlots === 0 ? <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">수신 가능 슬롯이 없습니다. 슬롯을 조정하면 새 제안을 받을 수 있습니다.</p> : null}{items.length === 0 ? <EmptyView title="대기 중인 주문 제안이 없습니다" description="새 주문이 접수되면 이 화면에 자동으로 표시됩니다." /> : <ul className="grid gap-5">{items.map((offer) => <OfferCard key={offer.offerId} offer={offer} onDone={(text) => { setMessage(text); offers.reload(); store.reload() }} />)}</ul>}</div>
}

function OfferCard({ offer, onDone }: { offer: SellerOffer; onDone: (message: string) => void }) {
  const navigate = useNavigate()
  const { remainingMs, expired } = useServerCountdown(offer.expiresAt, offer.serverTime)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const urgent = remainingMs < 10_000
  async function accept() { setBusy(true); setError(null); try { await sellerApi.bid(offer.orderId); onDone(`주문 ${offer.orderId}을 수락했습니다. 2분 내에 물품 확인을 완료해 주세요.`); navigate('/seller/orders') } catch (caught) { setError(caught instanceof ApiError ? caught.message : '응찰에 실패했습니다.') } finally { setBusy(false) } }
  async function decline() { setBusy(true); setError(null); try { await sellerApi.decline(offer.orderId); onDone(`주문 ${offer.orderId} 제안을 거절했습니다.`) } catch (caught) { setError(caught instanceof ApiError ? caught.message : '거절 처리에 실패했습니다.') } finally { setBusy(false) } }
  return <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><p className="text-xs font-bold text-slate-400">주문 #{offer.orderId}</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{offer.fulfillmentMethod === 'DELIVERY' ? '🚚 배송 주문' : '🏪 픽업 주문'} <span className="ml-2 font-medium text-slate-500">{offer.addressMasked ?? '매장 픽업'}</span></p></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${expired ? 'bg-slate-100 text-slate-500' : urgent ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'}`}>{expired ? '만료됨' : `남은 시간 ${formatDuration(remainingMs)}`}</span></div><div className="p-5"><ul className="divide-y divide-slate-100 dark:divide-slate-800">{offer.lines.map((line, index) => <li key={`${offer.offerId}-${index}`} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{line.productName}</p><p className="mt-1 text-xs text-slate-500">{line.specSummary ?? '규격 정보 없음'}</p></div><strong className="text-sm text-slate-700 dark:text-slate-200">{line.quantity}{line.unit ? ` ${line.unit}` : ''}</strong></li>)}</ul><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"><span className="text-sm font-bold text-slate-500">주문 금액</span><strong className="text-lg font-black text-slate-900 dark:text-white">{formatWon(offer.totalAmount)}</strong></div>{error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}<div className="mt-5 flex gap-3"><button type="button" disabled={busy || expired} onClick={() => void accept()} className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-black text-white shadow-md hover:bg-brand-700 disabled:opacity-40">{busy ? '처리 중…' : '주문 수락'}</button><button type="button" disabled={busy || expired} onClick={() => void decline()} className="rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">거절</button></div><p className="mt-3 text-xs text-slate-400">수락하면 다른 매장의 제안은 종료됩니다. 이후 2분 안에 실제 재고를 확인해야 합니다.</p></div></li>
}
