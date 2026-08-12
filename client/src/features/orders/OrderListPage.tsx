import { Link } from 'react-router-dom'
import { orderApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatDateTime, formatWon } from '@/components/format'
import type { OrderSummary } from '@/types/api'

const LIVE_STATUSES = ['WAITING_MATCH', 'SELLER_CONFIRMING', 'RE_MATCHING']

export function OrderListPage() {
  const orders = useAsync<OrderSummary[]>(() => orderApi.list(), [], { pollMs: 5000 })

  if (orders.loading && !orders.data) {
    return (
      <div className="page">
        <LoadingView label="주문 목록을 불러오는 중입니다" />
      </div>
    )
  }
  if (orders.error && !orders.data) {
    return (
      <div className="page">
        <ErrorView error={orders.error} onRetry={orders.reload} />
      </div>
    )
  }

  const items = orders.data ?? []

  if (items.length === 0) {
    return (
      <div className="page">
        <EmptyView
          title="주문 내역이 없습니다"
          description="카탈로그에서 상품을 담고 첫 주문을 요청해 보세요."
          action={
            <Link to="/catalog" className="btn btn-primary">
              카탈로그로 이동
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="page stack">
      <h1 className="section-title" style={{ fontSize: 'var(--fs-xl)' }}>
        내 주문
      </h1>

      <ul className="stack">
        {items.map((order) => {
          const meta = ORDER_STATUS_META[order.status]
          const isLive = LIVE_STATUSES.includes(order.status)
          const target = isLive ? `/orders/${order.id}/matching` : `/orders/${order.id}`

          return (
            <li key={order.id}>
              <Link to={target} className="card stack" style={{ padding: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
                <div className="spread">
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                  <span className="subtle tabular">주문번호 {order.id}</span>
                </div>
                <p style={{ fontWeight: 600 }}>
                  {order.representativeProductName}
                  {order.itemCount > 1 ? (
                    <span className="muted"> 외 {order.itemCount - 1}개</span>
                  ) : null}
                </p>
                <div className="spread">
                  <span className="subtle">{formatDateTime(order.createdAt)}</span>
                  <span className="tabular" style={{ fontWeight: 700 }}>
                    {formatWon(order.totalAmount)}
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
