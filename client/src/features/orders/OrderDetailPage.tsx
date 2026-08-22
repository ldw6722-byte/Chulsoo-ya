import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { orderApi } from '@/api/endpoints'
import { saveBinaryDownload } from '@/api/client'

import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatDateTime, formatWon } from '@/components/format'
import type { Order, OrderStatus, PaymentRefundView, TradeDocumentType } from '@/types/api'

const TRADE_DOCUMENTS: { type: TradeDocumentType; label: string }[] = [
  { type: 'RECEIPT', label: '영수증' },
  { type: 'ORDER_STATEMENT', label: '주문 내역서' },
  { type: 'TRANSACTION_STATEMENT', label: '거래명세서' },
]

const TIMELINE: { status: OrderStatus; label: string; at: (order: Order) => string | null }[] = [

  { status: 'WAITING_MATCH', label: '주문 요청', at: (o) => o.createdAt },
  { status: 'SELLER_CONFIRMING', label: '판매자 배정', at: (o) => o.matchedAt },
  { status: 'PAYMENT_PENDING', label: '물품 확인 완료', at: (o) => o.sellerConfirmedAt },
  { status: 'PAID', label: '결제 완료', at: (o) => o.paidAt },
  { status: 'COMPLETED', label: '거래 완료', at: (o) => o.completedAt },
]

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const order = useAsync<Order>(() => orderApi.get(id), [id], { pollMs: 5000 })
  const paymentVisible = ['PAID', 'PREPARING', 'CANCELLED'].includes(order.data?.status ?? '')
  const payment = useAsync<PaymentRefundView>(() => orderApi.payment(id), [id, paymentVisible], { enabled: paymentVisible })
  const [canceling, setCanceling] = useState(false)
  const [notice, setNotice] = useState('')
  const [downloading, setDownloading] = useState<TradeDocumentType | null>(null)
  const [documentError, setDocumentError] = useState('')

  if (order.loading && !order.data) {
    return (
      <div className="page">
        <LoadingView label="주문 정보를 불러오는 중입니다" />
      </div>
    )
  }
  if (order.error && !order.data) {
    return (
      <div className="page">
        <ErrorView error={order.error} onRetry={order.reload} />
      </div>
    )
  }
  if (!order.data) return null

  const data = order.data
  const meta = ORDER_STATUS_META[data.status]
  const canCancel = ['WAITING_MATCH', 'MATCHED', 'SELLER_CONFIRMING', 'RE_MATCHING', 'PAYMENT_PENDING', 'PAID'].includes(data.status)
  const canRequestClaim = ['PREPARING', 'DELIVERY_IN_PROGRESS', 'PICKUP_READY', 'COMPLETED'].includes(data.status)
    const downloadDocument = async (type: TradeDocumentType) => {
    setDownloading(type); setDocumentError('')
    try { saveBinaryDownload(await orderApi.document(id, type)) }
    catch (error) { setDocumentError(error instanceof Error ? error.message : '거래 서류 다운로드에 실패했습니다.') }
    finally { setDownloading(null) }
  }

  const cancel = async () => {

    setCanceling(true); setNotice('')
    try {
      const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `cancel-${data.id}-${Date.now()}`
      await orderApi.cancel(data.id, key)
      setNotice('주문 취소 요청이 처리되었습니다.')
      await order.reload()
      await payment.reload()
    } catch (error) { setNotice(error instanceof Error ? error.message : '주문 취소에 실패했습니다.') } finally { setCanceling(false) }
  }

  return (
    <div className="page stack">
      <div className="spread flex-wrap gap-2">
        <h1 className="section-title" style={{ fontSize: 'var(--fs-xl)', marginBottom: 0 }}>
          주문 상세
        </h1>
        <span className="subtle tabular">주문번호 {data.id}</span>
      </div>

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <div className="row">
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          {data.retryCount > 0 ? <span className="badge badge-warning">재매칭 {data.retryCount}회</span> : null}
        </div>
        <p className="muted">{meta.description}</p>
        {['WAITING_MATCH', 'SELLER_CONFIRMING', 'RE_MATCHING'].includes(data.status) ? (
          <Link to={`/orders/${data.id}/matching`} className="btn btn-primary">
            실시간 진행 화면 열기
          </Link>
        ) : null}
        {data.status === 'PAYMENT_PENDING' ? (
          <Link to={`/orders/${data.id}/payment`} className="btn btn-primary">
            결제 진행
          </Link>
        ) : null}
        {canCancel ? <button type="button" className="btn btn-secondary" disabled={canceling} onClick={() => void cancel()}>{canceling ? '취소 처리 중' : data.status === 'PAID' ? '결제 취소' : '주문 취소'}</button> : null}
        {canRequestClaim ? <Link to={`/orders/${data.id}/claim`} className="btn btn-secondary">반품 · 교환 · 부분 교체 요청</Link> : null}
        {notice ? <p role="status" className="subtle">{notice}</p> : null}
      </section>

      {paymentVisible ? <section className="card stack" style={{ padding: 'var(--sp-4)' }}><h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>결제 · 환불</h2>{payment.loading && !payment.data ? <p className="muted">결제 정보를 불러오는 중입니다…</p> : payment.error ? <ErrorView error={payment.error} onRetry={payment.reload} /> : payment.data ? <><div className="spread flex-wrap gap-2"><span className="muted">결제 상태</span><span>{payment.data.paymentStatus === 'CANCELLED' ? '결제 취소' : payment.data.paymentStatus === 'REFUNDED' ? '전액 환불' : payment.data.paymentStatus === 'PARTIAL_REFUNDED' ? '부분 환불' : '결제 완료'}</span></div><div className="spread flex-wrap gap-2"><span className="muted">환불 가능 잔액</span><strong className="tabular">{formatWon(payment.data.remainingAmount)}</strong></div>{payment.data.refunds.length ? <div className="overflow-x-auto"><table className="table min-w-[34rem]"><thead><tr><th scope="col">처리</th><th scope="col">금액</th><th scope="col">사유</th><th scope="col">시각</th></tr></thead><tbody>{payment.data.refunds.map(refund => <tr key={refund.id}><td>{refund.refundType === 'CANCEL' ? '결제 취소' : '환불'}</td><td className="tabular">{formatWon(refund.amount)}</td><td>{refund.reason}</td><td className="tabular">{refund.completedAt ? formatDateTime(refund.completedAt) : '처리 중'}</td></tr>)}</tbody></table></div> : <p className="muted">처리된 취소·환불 이력이 없습니다.</p>}</> : null}</section> : null}

      
      {data.status === 'COMPLETED' ? (
        <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
          <div className="spread flex-wrap gap-2">
            <div>
              <h2 className="section-title" style={{ fontSize: 'var(--fs-base)', marginBottom: 0 }}>거래 서류</h2>
              <p className="muted" style={{ marginTop: 4 }}>거래 당시 주문 DB 정보를 기준으로 지금 생성합니다.</p>
            </div>
            <span className="badge badge-success">거래 완료</span>
          </div>
          <div className="row flex-wrap" style={{ gap: 'var(--sp-2)' }}>
            {TRADE_DOCUMENTS.map((document) => (
              <button key={document.type} type="button" className="btn btn-secondary" disabled={downloading !== null} onClick={() => void downloadDocument(document.type)}>
                {downloading === document.type ? '생성 중…' : document.label}
              </button>
            ))}
          </div>
          {documentError ? <p role="alert" className="subtle" style={{ color: 'var(--c-danger)' }}>{documentError}</p> : null}
          <p className="subtle">전자세금계산서는 발행 연동 전까지 이 문서함에서 제공하지 않습니다.</p>
        </section>
      ) : null}

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          진행 이력

        </h2>
        <ol className="stack" style={{ gap: 'var(--sp-2)' }}>
          {TIMELINE.map((step) => {
            const at = step.at(data)
            return (
              <li key={step.status} className="spread flex-wrap gap-2">
                <span className="row">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: at ? 'var(--c-success)' : 'var(--c-border-strong)',
                    }}
                  />
                  <span style={{ fontWeight: at ? 600 : 400, color: at ? 'var(--c-text)' : 'var(--c-text-subtle)' }}>
                    {step.label}
                  </span>
                </span>
                <span className="subtle tabular">{at ? formatDateTime(at) : '대기'}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          주문 품목
        </h2>
        <div className="overflow-x-auto">
          <table className="table min-w-[28rem]">
          <thead>
            <tr>
              <th scope="col">상품</th>
              <th scope="col">수량</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                금액
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{item.productName}</span>
                  <br />
                  <span className="subtle">{item.specSummary ?? '규격 정보 없음'}</span>
                </td>
                <td className="tabular">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ''}
                </td>
                <td className="tabular" style={{ textAlign: 'right' }}>
                  {formatWon(item.lineAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <div className="spread flex-wrap gap-2">
          <span className="muted">상품 금액</span>
          <span className="tabular">{formatWon(data.itemsAmount)}</span>
        </div>
        <div className="spread flex-wrap gap-2">
          <span className="muted">배달비</span>
          <span className="tabular">{formatWon(data.deliveryFee)}</span>
        </div>
        <div className="spread flex-wrap gap-2">
          <span style={{ fontWeight: 700 }}>총 금액</span>
          <span className="tabular" style={{ fontWeight: 700 }}>
            {formatWon(data.totalAmount)}
          </span>
        </div>
      </section>

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          배송 정보
        </h2>
        <div className="spread flex-wrap gap-2">
          <span className="muted">이행 방식</span>
          <span>{data.fulfillmentMethod === 'DELIVERY' ? '배달' : '매장 픽업'}</span>
        </div>
        <div className="spread flex-wrap gap-2">
          <span className="muted">주소</span>
          <span style={{ textAlign: 'right' }}>
            {data.address ?? '-'}
            {data.addressDetail ? ` ${data.addressDetail}` : ''}
          </span>
        </div>
        <div className="spread flex-wrap gap-2">
          <span className="muted">배정 매장</span>
          <span>{data.winningStoreName ?? '미배정'}</span>
        </div>
        {data.requestMemo ? (
          <div className="stack" style={{ gap: 4 }}>
            <span className="muted">요청 사항</span>
            <p>{data.requestMemo}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
