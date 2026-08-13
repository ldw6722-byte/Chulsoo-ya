import { useState } from 'react'
import { adminPaymentApi, orderApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { ErrorView } from '@/components/StateViews'
import type { PaymentRefundView } from '@/types/api'

function paymentStatusLabel(status: PaymentRefundView['paymentStatus']) {
  const labels: Record<PaymentRefundView['paymentStatus'], string> = {
    READY: '결제 준비', PAID: '결제 완료', CANCEL_PENDING: '취소 대기', CANCELLED: '결제 취소',
    REFUNDING: '환불 처리 중', PARTIAL_REFUNDED: '부분 환불', REFUNDED: '전액 환불',
  }
  return labels[status]
}

export function PaymentManagementPanel() {
  const [orderId, setOrderId] = useState('')
  const [payment, setPayment] = useState<PaymentRefundView | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)

  const lookup = async () => {
    const id = Number(orderId)
    if (!Number.isInteger(id) || id <= 0) { setMessage('조회할 주문 번호를 입력해 주세요.'); return }
    setLoading(true); setMessage(''); setError(null)
    try {
      const next = await orderApi.payment(id)
      setPayment(next)
      setAmount(String(next.remainingAmount))
    } catch (cause) { setPayment(null); setError(cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '결제 정보를 불러오지 못했습니다.', 500)) } finally { setLoading(false) }
  }

  const refund = async () => {
    if (!payment) return
    const refundAmount = Number(amount)
    if (!Number.isInteger(refundAmount) || refundAmount <= 0 || refundAmount > payment.remainingAmount) { setMessage('환불 금액은 남은 결제 금액 범위에서 입력해 주세요.'); return }
    if (!reason.trim()) { setMessage('환불 사유를 입력해 주세요.'); return }
    setLoading(true); setMessage(''); setError(null)
    try {
      const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `admin-refund-${payment.paymentId}-${Date.now()}`
      const next = await adminPaymentApi.refund(payment.paymentId, { amount: refundAmount, reason: reason.trim(), idempotencyKey: key })
      setPayment(next); setAmount(String(next.remainingAmount)); setReason('')
      setMessage('환불 처리가 완료되었습니다. 결제 잔액과 감사 이력이 갱신되었습니다.')
    } catch (cause) { setError(cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '환불 처리에 실패했습니다.', 500)) } finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">PAYMENT OPERATIONS</p><h2 className="mt-1 text-xl font-black text-slate-900">결제 · 환불 운영</h2><p className="mt-2 text-sm leading-6 text-slate-500">관리자는 반품·분쟁 확정 후 주문 번호로 결제 내역을 확인하고 전액 또는 부분 환불을 처리합니다. 배송 이후 분쟁은 클레임 절차를 먼저 확인해 주세요.</p><div className="mt-6 flex flex-wrap gap-2"><input value={orderId} onChange={(event) => setOrderId(event.target.value)} inputMode="numeric" placeholder="주문 번호" className="h-11 w-40 rounded-xl border border-slate-300 px-3 text-sm" /><button type="button" disabled={loading} onClick={() => void lookup()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50">결제 조회</button></div>{message ? <p role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p> : null}{error ? <div className="mt-4"><ErrorView error={error} onRetry={lookup} /></div> : null}{payment ? <div className="mt-6 space-y-5 border-t border-slate-100 pt-5"><div className="grid gap-3 sm:grid-cols-3"><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">결제 상태</p><p className="mt-1 font-black text-slate-900">{paymentStatusLabel(payment.paymentStatus)}</p></article><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">총 결제 금액</p><p className="mt-1 font-black text-slate-900">{payment.amount.toLocaleString()}원</p></article><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">환불 가능 잔액</p><p className="mt-1 font-black text-slate-900">{payment.remainingAmount.toLocaleString()}원</p></article></div>{['PAID', 'PARTIAL_REFUNDED'].includes(payment.paymentStatus) ? <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_2fr_auto]"><input type="number" min="1" max={payment.remainingAmount} value={amount} onChange={(event) => setAmount(event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm" /><input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="환불 사유" className="h-11 rounded-lg border border-slate-300 px-3 text-sm" /><button type="button" disabled={loading} onClick={() => void refund()} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{loading ? '처리 중' : '환불 처리'}</button></div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">현재 결제 상태에서는 추가 환불을 처리할 수 없습니다.</p>}<div><h3 className="text-sm font-black text-slate-900">환불 감사 이력</h3>{payment.refunds.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">유형</th><th className="px-3 py-2">금액</th><th className="px-3 py-2">사유</th><th className="px-3 py-2">처리 상태</th></tr></thead><tbody className="divide-y divide-slate-100">{payment.refunds.map((refund) => <tr key={refund.id}><td className="px-3 py-3">{refund.refundType === 'CANCEL' ? '결제 취소' : '환불'}</td><td className="px-3 py-3">{refund.amount.toLocaleString()}원</td><td className="px-3 py-3">{refund.reason}</td><td className="px-3 py-3">{refund.status === 'SUCCEEDED' ? '완료' : refund.status === 'FAILED' ? '실패' : '처리 중'}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">환불 이력이 없습니다.</p>}</div></div> : null}</section>
}
