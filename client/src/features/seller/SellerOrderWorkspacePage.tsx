import { useState } from 'react'
import { sellerApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { formatDuration, useServerCountdown } from '@/hooks/useServerCountdown'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatWon } from '@/components/format'
import type { AssignedOrder, OrderStatus } from '@/types/api'

function nextActions(order: AssignedOrder): { label: string; next: OrderStatus }[] {
  if (order.status === 'PREPARING') return order.fulfillmentMethod === 'DELIVERY' ? [{ label: '배달 시작', next: 'DELIVERY_IN_PROGRESS' }] : [{ label: '픽업 준비 완료', next: 'PICKUP_READY' }]
  if (order.status === 'DELIVERY_IN_PROGRESS') return [{ label: '배달 완료', next: 'COMPLETED' }]
  if (order.status === 'PICKUP_READY') return [{ label: '거래 완료 처리', next: 'COMPLETED' }]
  return []
}

export function SellerOrderWorkspacePage() {
  const orders = useAsync<AssignedOrder[]>(() => sellerApi.assignedOrders(), [], { pollMs: 2000 })
  const [message, setMessage] = useState<string | null>(null)
  if (orders.loading && !orders.data) return <div className="mx-auto max-w-5xl px-4 py-16"><LoadingView label="진행 주문을 불러오는 중입니다" /></div>
  if (orders.error && !orders.data) return <div className="mx-auto max-w-5xl px-4 py-16"><ErrorView error={orders.error} onRetry={orders.reload} /></div>
  const items = orders.data ?? []
  return <div className="mx-auto max-w-5xl px-4 py-7 md:py-10"><div className="mb-7"><p className="text-sm font-bold text-brand-600">FULFILLMENT</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">진행 주문</h1><p className="mt-2 text-sm text-slate-500">낙찰된 주문의 재고 확인부터 이행 완료까지 관리합니다.</p></div>{message ? <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p> : null}{items.length === 0 ? <EmptyView title="진행 중인 주문이 없습니다" description="주문을 수락하면 이 화면에서 관리할 수 있습니다." /> : <ul className="grid gap-5">{items.map((order) => <AssignedOrderCard key={order.orderId} order={order} onDone={(text) => { setMessage(text); orders.reload() }} />)}</ul>}</div>
}

function AssignedOrderCard({ order, onDone }: { order: AssignedOrder; onDone: (message: string) => void }) {
  const isConfirming = order.status === 'SELLER_CONFIRMING'
  const { remainingMs, expired } = useServerCountdown(isConfirming ? order.sellerConfirmationDeadlineAt : null, order.serverTime)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const meta = ORDER_STATUS_META[order.status]
  async function run(task: () => Promise<unknown>, successMessage: string) { setBusy(true); setError(null); try { await task(); onDone(successMessage) } catch (caught) { setError(caught instanceof ApiError ? caught.message : '요청을 처리할 수 없습니다.') } finally { setBusy(false) } }
  return <li className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${isConfirming ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800'}`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><p className="text-xs font-bold text-slate-400">주문 #{order.orderId}</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{order.fulfillmentMethod === 'DELIVERY' ? '🚚 배송 이행' : '🏪 픽업 이행'} <span className="ml-2 font-medium text-slate-500">{order.addressMasked ?? '매장 픽업'}</span></p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">{meta.label}</span></div><div className="p-5">{isConfirming ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><div className="flex items-center justify-between"><span className="text-sm font-black">물품 확인 남은 시간</span><strong className="text-2xl font-black">{formatDuration(remainingMs)}</strong></div><p className="mt-2 text-xs leading-5">기한 내 확인하지 않으면 주문이 회수되고 응찰 제한 및 신뢰 점수 차감이 적용됩니다.</p></div> : null}<ul className="divide-y divide-slate-100 dark:divide-slate-800">{order.lines.map((line, index) => <li key={`${order.orderId}-${index}`} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{line.productName}</p><p className="mt-1 text-xs text-slate-500">{line.specSummary ?? '규격 정보 없음'}</p></div><strong className="text-sm text-slate-700 dark:text-slate-200">{line.quantity}{line.unit ? ` ${line.unit}` : ''}</strong></li>)}</ul><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"><span className="text-sm font-bold text-slate-500">주문 금액</span><strong className="text-lg font-black text-slate-900 dark:text-white">{formatWon(order.totalAmount)}</strong></div>{error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}{isConfirming ? <button type="button" disabled={busy || expired} onClick={() => void run(() => sellerApi.confirmStock(order.orderId), `주문 ${order.orderId} 물품 확인을 완료했습니다. 소비자 결제를 기다립니다.`)} className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-40">{busy ? '처리 중…' : '전 품목 보유 확인 완료'}</button> : null}{order.status === 'PAYMENT_PENDING' ? <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">소비자 결제를 기다리는 중입니다. 결제 완료 시 준비 단계로 전환됩니다.</p> : null}{order.status === 'PREPARING' && order.fulfillmentMethod === 'DELIVERY' ? <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">결제가 완료되었습니다. 배달을 시작해 주세요.</p> : null}{nextActions(order).map((action) => <button key={action.next} type="button" disabled={busy} onClick={() => void run(() => sellerApi.advanceStatus(order.orderId, action.next), order.status === 'PREPARING' && action.next === 'DELIVERY_IN_PROGRESS' ? `주문 ${order.orderId} 배달을 시작했습니다. 구매자에게 알림을 보냈습니다.` : action.next === 'COMPLETED' ? `주문 ${order.orderId} 배달을 완료했습니다. 구매자에게 알림을 보냈습니다.` : `주문 ${order.orderId} 상태를 변경했습니다.`)} className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-black text-white shadow-md hover:bg-brand-700 disabled:opacity-40">{action.label}</button>)}</div></li>
}
