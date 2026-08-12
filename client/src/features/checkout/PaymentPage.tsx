import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatWon } from '@/components/format'
import type { Order } from '@/types/api'

const METHODS = [
  { code: 'CARD', icon: '💳', title: '신용·체크카드', description: '일반 카드 결제' },
  { code: 'EASY_PAY', icon: '⚡', title: '간편 결제', description: '간편결제 서비스' },
  { code: 'TRANSFER', icon: '🏦', title: '계좌 이체', description: '실시간 계좌 이체' },
] as const

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const id = Number(orderId)
  const order = useAsync<Order>(() => orderApi.get(id), [id])
  const idempotencyKeyRef = useRef(`order-${id}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`)
  const [method, setMethod] = useState<(typeof METHODS)[number]['code']>('CARD')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pay() {
    setSubmitting(true); setError(null)
    try { await orderApi.confirmPayment(id, idempotencyKeyRef.current, method); navigate(`/orders/${id}`, { replace: true }) } catch (caught) { setError(caught instanceof ApiError ? caught.message : '결제를 완료할 수 없습니다.') } finally { setSubmitting(false) }
  }

  if (order.loading && !order.data) return <div className="mx-auto max-w-5xl px-4 py-16"><LoadingView label="결제 정보를 불러오는 중입니다" /></div>
  if (order.error && !order.data) return <div className="mx-auto max-w-5xl px-4 py-16"><ErrorView error={order.error} onRetry={order.reload} /></div>
  if (!order.data) return null

  const data = order.data
  const payable = data.status === 'PAYMENT_PENDING'

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:py-10">
      <div className="mb-7"><p className="text-sm font-bold text-brand-600">PAYMENT</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">결제하기</h1><p className="mt-2 text-sm text-slate-500">안전한 결제를 위해 결제 요청은 한 번만 처리됩니다.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-5">
          <section className={`rounded-2xl border p-5 ${payable ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/25' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/25'}`}><p className={`text-sm font-black ${payable ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{payable ? '✓ 판매자 재고 확인 완료' : '결제 가능 상태를 확인하는 중'}</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{payable ? <><strong>{data.winningStoreName}</strong>이(가) 물품 보유를 확인했습니다. 결제 완료 후 판매자가 준비를 시작합니다.</> : <>현재 주문 상태는 <strong>{ORDER_STATUS_META[data.status].label}</strong>입니다. 판매자 물품 확인이 완료된 주문만 결제할 수 있습니다.</>}</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">결제 수단</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{METHODS.map((option) => <button key={option.code} type="button" onClick={() => setMethod(option.code)} aria-pressed={method === option.code} className={`rounded-2xl border-2 p-4 text-left transition ${method === option.code ? 'border-brand-600 bg-brand-50 shadow-sm dark:bg-brand-950/30' : 'border-slate-200 hover:border-brand-200 dark:border-slate-700'}`}><span className="text-2xl">{option.icon}</span><p className="mt-3 text-sm font-black text-slate-900 dark:text-white">{option.title}</p><p className="mt-1 text-xs text-slate-500">{option.description}</p></button>)}</div><p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:bg-slate-800">결제 요청은 멱등성 키로 보호됩니다. 네트워크 오류로 다시 시도해도 중복 결제가 발생하지 않습니다.</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">주문 상품</h2><ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{data.items.map((item) => <li key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span className="min-w-0 flex-1"><strong className="block line-clamp-1 text-slate-900 dark:text-white">{item.productName}</strong><small className="text-slate-500">{item.quantity}개</small></span><strong className="shrink-0 text-slate-900 dark:text-white">{formatWon(item.lineAmount)}</strong></li>)}</ul></section>
        </div>
        <aside className="sticky top-35 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">최종 결제 금액</h2><div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm dark:border-slate-800"><div className="flex justify-between text-slate-500"><span>상품 금액</span><strong className="text-slate-900 dark:text-white">{formatWon(data.itemsAmount)}</strong></div><div className="flex justify-between text-slate-500"><span>배송비</span><strong className="text-slate-900 dark:text-white">{formatWon(data.deliveryFee)}</strong></div>{data.discountAmount > 0 ? <div className="flex justify-between text-slate-500"><span>할인</span><strong className="text-rose-600">-{formatWon(data.discountAmount)}</strong></div> : null}</div><div className="mt-5 flex items-end justify-between"><span className="font-bold text-slate-700 dark:text-slate-200">총 결제 금액</span><strong className="text-2xl font-black text-brand-600">{formatWon(data.totalAmount)}</strong></div>{error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}<button type="button" disabled={!payable || submitting} onClick={() => void pay()} className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? '결제 처리 중…' : `${formatWon(data.totalAmount)} 결제하기`}</button><p className="mt-3 text-center text-xs text-slate-400">결제 시 철수야 결제 약관에 동의합니다.</p></aside>
      </div>
    </div>
  )
}
