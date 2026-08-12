import { Link, useParams } from 'react-router-dom'
import { orderApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatDateTime, formatWon } from '@/components/format'
import type { Order, OrderStatus } from '@/types/api'

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

  return (
    <div className="page stack">
      <div className="spread">
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
      </section>

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          진행 이력
        </h2>
        <ol className="stack" style={{ gap: 'var(--sp-2)' }}>
          {TIMELINE.map((step) => {
            const at = step.at(data)
            return (
              <li key={step.status} className="spread">
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
        <table className="table">
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

        <div className="spread">
          <span className="muted">상품 금액</span>
          <span className="tabular">{formatWon(data.itemsAmount)}</span>
        </div>
        <div className="spread">
          <span className="muted">배달비</span>
          <span className="tabular">{formatWon(data.deliveryFee)}</span>
        </div>
        <div className="spread">
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
        <div className="spread">
          <span className="muted">이행 방식</span>
          <span>{data.fulfillmentMethod === 'DELIVERY' ? '배달' : '매장 픽업'}</span>
        </div>
        <div className="spread">
          <span className="muted">주소</span>
          <span style={{ textAlign: 'right' }}>
            {data.address ?? '-'}
            {data.addressDetail ? ` ${data.addressDetail}` : ''}
          </span>
        </div>
        <div className="spread">
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
