import { useEffect, useState } from 'react'
import { notify } from '@/lib/notify'
import { adminPaymentApi, orderApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { ErrorView } from '@/components/StateViews'
import type { PaymentRefundView, SettlementRecord, SettlementSummary } from '@/types/api'

const won = (value: number) => value.toLocaleString('ko-KR') + '원'
const when = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '-'

function paymentStatusLabel(status: PaymentRefundView['paymentStatus']) {
  const labels: Record<PaymentRefundView['paymentStatus'], string> = {
    READY: '결제 준비', PAID: '결제 완료', CANCEL_PENDING: '취소 대기', CANCELLED: '결제 취소', PARTIAL_REFUNDED: '부분 환불', REFUNDING: '환불 처리 중', REFUNDED: '전액 환불',
  }
  return labels[status]
}

function settlementStatusLabel(status: SettlementRecord['status']) {
  return ({ PENDING: '정산 대기', HOLD: '정산 보류', RELEASABLE: '정산 가능', SETTLED: '정산 완료', CANCELLED: '정산 취소' } as const)[status]
}

export function PaymentManagementPanel() {
  const [orderId, setOrderId] = useState('')
  const [payment, setPayment] = useState<PaymentRefundView | null>(null)
  const [settlements, setSettlements] = useState<SettlementRecord[]>([])
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [settlementLoading, setSettlementLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)


  const loadSettlements = async () => {
    setSettlementLoading(true)
    try {
      const [nextSummary, nextSettlements] = await Promise.all([adminPaymentApi.settlementSummary(), adminPaymentApi.settlements()])
      setSummary(nextSummary)
      setSettlements(nextSettlements)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '정산 현황을 불러오지 못했습니다.', 500))
    } finally { setSettlementLoading(false) }
  }

  useEffect(() => { void loadSettlements() }, [])

  const lookup = async (target = orderId) => {
    const id = Number(target)
    if (!Number.isInteger(id) || id <= 0) { notify('조회할 주문 번호를 입력해 주세요.', 'error'); return }
    setLoading(true); setError(null)
    try {
      const next = await orderApi.payment(id)
      setOrderId(String(id)); setPayment(next); setAmount(String(next.remainingAmount)); notify(`주문 #${id} 결제 정보를 조회했습니다.`)
    } catch (cause) { const error = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '결제 정보를 불러오지 못했습니다.', 500); setPayment(null); setError(error); notify(error.message, 'error') } finally { setLoading(false) }
  }

  const refund = async () => {
    if (!payment) return
    const refundAmount = Number(amount)
    if (!Number.isInteger(refundAmount) || refundAmount <= 0 || refundAmount > payment.remainingAmount) { notify('환불 금액은 남은 결제 금액 범위에서 입력해 주세요.', 'error'); return }
    if (!reason.trim()) { notify('환불 사유를 입력해 주세요.', 'error'); return }
    setLoading(true); setError(null)
    try {
      const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `admin-refund-${payment.paymentId}-${Date.now()}`
      const next = await adminPaymentApi.refund(payment.paymentId, { amount: refundAmount, reason: reason.trim(), idempotencyKey: key })
      setPayment(next); setAmount(String(next.remainingAmount)); setReason('')
      notify('환불 처리가 완료되었습니다. 결제 잔액·정산 금액·감사 이력이 갱신되었습니다.')
      await loadSettlements()
    } catch (cause) { const error = cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '환불 처리에 실패했습니다.', 500); setError(error); notify(error.message, 'error') } finally { setLoading(false) }
  }

  return <section className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-black tracking-wider text-brand-600">SETTLEMENT OPERATIONS</p>
      <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">정산 · 환불</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">결제 승인 히스토리를 기준으로 판매자 정산 예정액과 환불 반영 금액을 확인합니다. 개발 기준 수수료는 결제 승인 금액의 10.00%이며, 실제 PG 이체는 수행하지 않습니다.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">결제 승인 매출</p><p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{summary ? won(summary.grossAmount) : '-'}</p></article>
        <article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">플랫폼 수수료</p><p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{summary ? won(summary.commissionAmount) : '-'}</p></article>
        <article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">환불 반영액</p><p className="mt-1 text-xl font-black text-rose-600">{summary ? won(summary.refundedAmount) : '-'}</p></article>
        <article className="rounded-xl bg-brand-600 p-4"><p className="text-xs font-bold text-white/80">판매자 정산 예정액</p><p className="mt-1 text-xl font-black text-white">{summary ? won(summary.sellerPayableAmount) : '-'}</p></article>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">APPROVED PAYMENT SETTLEMENTS</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">판매자 정산 확인</h3></div><button type="button" onClick={() => void loadSettlements()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">새로고침</button></div>
      {settlementLoading ? <p className="py-8 text-center text-sm text-slate-500">정산 현황을 불러오는 중입니다.</p> : settlements.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-225 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-3 py-3">주문</th><th className="px-3 py-3">판매점</th><th className="px-3 py-3">승인 금액</th><th className="px-3 py-3">수수료</th><th className="px-3 py-3">환불</th><th className="px-3 py-3">정산 예정</th><th className="px-3 py-3">상태</th><th className="px-3 py-3">승인 시각</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{settlements.map((item) => <tr key={item.id} className="text-slate-700 dark:text-slate-200"><td className="px-3 py-3"><button type="button" onClick={() => void lookup(String(item.orderId))} className="font-bold text-brand-700 hover:underline dark:text-brand-300">#{item.orderId}</button></td><td className="px-3 py-3">{item.storeName ?? `판매점 #${item.storeId}`}</td><td className="px-3 py-3">{won(item.grossAmount)}</td><td className="px-3 py-3">{won(item.commissionAmount)} <span className="text-xs text-slate-400">({(item.commissionRateBps / 100).toFixed(2)}%)</span></td><td className="px-3 py-3 text-rose-600">{won(item.refundedAmount)}</td><td className="px-3 py-3 font-black">{won(item.sellerPayableAmount)}</td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">{settlementStatusLabel(item.status)}</span></td><td className="px-3 py-3 text-xs text-slate-500">{when(item.approvedAt)}</td></tr>)}</tbody></table></div> : <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-800">결제 승인된 정산 대상 주문이 없습니다.</p>}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-black tracking-wider text-brand-600">PAYMENT OPERATIONS</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">결제 · 환불 운영</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">주문 번호로 결제 기록을 조회한 뒤 개발용 전액 또는 부분 환불을 처리합니다. 환불 금액은 같은 주문의 판매자 정산 예정액에도 즉시 반영됩니다.</p>
      <div className="mt-5 flex flex-wrap gap-2"><input value={orderId} onChange={(event) => setOrderId(event.target.value)} inputMode="numeric" placeholder="주문 번호" className="h-11 w-40 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /><button type="button" disabled={loading} onClick={() => void lookup()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white">결제 조회</button></div>
      {error ? <div className="mt-4"><ErrorView error={error} onRetry={payment ? () => void lookup() : () => void loadSettlements()} /></div> : null}
      {payment ? <div className="mt-6 space-y-5 border-t border-slate-100 pt-5 dark:border-slate-800"><div className="grid gap-3 sm:grid-cols-3"><article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">결제 상태</p><p className="mt-1 font-black text-slate-900 dark:text-white">{paymentStatusLabel(payment.paymentStatus)}</p></article><article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">총 결제 금액</p><p className="mt-1 font-black text-slate-900 dark:text-white">{won(payment.amount)}</p></article><article className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">환불 가능 잔액</p><p className="mt-1 font-black text-slate-900 dark:text-white">{won(payment.remainingAmount)}</p></article></div>{['PAID', 'PARTIAL_REFUNDED'].includes(payment.paymentStatus) ? <div className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-[1fr_2fr_auto]"><input type="number" min="1" max={payment.remainingAmount} value={amount} onChange={(event) => setAmount(event.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /><input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="환불 사유" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /><button type="button" disabled={loading} onClick={() => void refund()} className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{loading ? '처리 중' : '환불 처리'}</button></div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">현재 결제 상태에서는 추가 환불을 처리할 수 없습니다.</p>}<div><h4 className="text-sm font-black text-slate-900 dark:text-white">환불 감사 이력</h4>{payment.refunds.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-3 py-2">유형</th><th className="px-3 py-2">금액</th><th className="px-3 py-2">사유</th><th className="px-3 py-2">처리 상태</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{payment.refunds.map((refund) => <tr key={refund.id} className="text-slate-700 dark:text-slate-200"><td className="px-3 py-3">{refund.refundType === 'CANCEL' ? '결제 취소' : '환불'}</td><td className="px-3 py-3">{won(refund.amount)}</td><td className="px-3 py-3">{refund.reason}</td><td className="px-3 py-3">{refund.status === 'SUCCEEDED' ? '완료' : refund.status === 'FAILED' ? '실패' : '처리 중'}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">환불 이력이 없습니다.</p>}</div></div> : null}
    </section>
  </section>
}
