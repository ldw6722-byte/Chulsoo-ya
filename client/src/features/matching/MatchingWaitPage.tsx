import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { formatDuration, useServerCountdown } from '@/hooks/useServerCountdown'
import { ErrorView, InlineNotice, LoadingView } from '@/components/StateViews'
import { ORDER_STATUS_META, formatWon } from '@/components/format'
import { ApiError } from '@/api/client'
import type { Order } from '@/types/api'

/**
 * 매칭 대기 화면.
 * 폴링 2초. 남은 시간은 서버가 준 serverTime 과 마감 시각의 차이로만 계산한다.
 */
export function MatchingWaitPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const id = Number(orderId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const order = useAsync<Order>(() => orderApi.get(id), [id], { pollMs: 2000 })

  const isWaiting = order.data?.status === 'WAITING_MATCH'
  const isConfirming = order.data?.status === 'SELLER_CONFIRMING'

  const activeDeadline = isWaiting
    ? order.data?.matchDeadlineAt
    : isConfirming
      ? order.data?.sellerConfirmationDeadlineAt
      : null

  const { remainingMs } = useServerCountdown(activeDeadline, order.data?.serverTime)

  async function cancel() {
    setCancelling(true)
    setActionError(null)
    try {
      await orderApi.cancel(id)
      order.reload()
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : '주문을 취소할 수 없습니다.')
    } finally {
      setCancelling(false)
    }
  }

  if (order.loading && !order.data) {
    return (
      <div className="page">
        <LoadingView label="주문 상태를 확인하는 중입니다" />
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
      <div className="card stack" style={{ padding: 'var(--sp-5)', textAlign: 'center' }}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          {data.retryCount > 0 ? (
            <span className="badge badge-warning">재매칭 {data.retryCount}회</span>
          ) : null}
        </div>

        {activeDeadline ? (
          <>
            <p
              className="tabular"
              style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, letterSpacing: '-0.02em' }}
              role="timer"
              aria-live="off"
            >
              {formatDuration(remainingMs)}
            </p>
            <p className="muted">{meta.description}</p>
            <div
              style={{
                height: 6,
                borderRadius: 'var(--r-full)',
                background: 'var(--c-surface-muted)',
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                (remainingMs / (isWaiting ? 300_000 : 120_000)) * 100,
              )}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (remainingMs / (isWaiting ? 300_000 : 120_000)) * 100)}%`,
                  background: isWaiting ? 'var(--c-primary)' : 'var(--c-warning)',
                  transition: 'width 0.25s linear',
                }}
              />
            </div>
          </>
        ) : (
          <p className="muted">{meta.description}</p>
        )}
      </div>

      {isConfirming && data.winningStoreName ? (
        <InlineNotice tone="warning">
          <strong>{data.winningStoreName}</strong>이(가) 배정되었습니다. 판매자가 물품 보유 여부를 확인하는 중이며,
          확인이 끝나면 결제 화면이 열립니다.
        </InlineNotice>
      ) : null}

      {data.status === 'PAYMENT_PENDING' ? (
        <div className="card stack" style={{ padding: 'var(--sp-4)' }}>
          <InlineNotice tone="success">
            물품 확인이 완료되었습니다. 결제를 진행하면 판매자가 준비를 시작합니다.
          </InlineNotice>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate(`/orders/${data.id}/payment`)}
          >
            결제 진행
          </button>
        </div>
      ) : null}

      {data.status === 'MATCH_FAILED' ? (
        <div className="card stack" style={{ padding: 'var(--sp-4)' }}>
          <InlineNotice tone="danger">
            현재 주변 업체가 모두 작업 중입니다. 잠시 후 다시 시도하거나 장바구니로 돌아가 주문을 조정해 주세요.
          </InlineNotice>
          <div className="row">
            <Link to="/cart" className="btn">
              장바구니로 이동
            </Link>
            <Link to="/orders" className="btn btn-ghost">
              주문 목록
            </Link>
          </div>
        </div>
      ) : null}

      {['PAID', 'PREPARING', 'DELIVERY_IN_PROGRESS', 'PICKUP_READY', 'COMPLETED'].includes(data.status) ? (
        <div className="card stack" style={{ padding: 'var(--sp-4)' }}>
          <InlineNotice tone="success">주문이 진행 중입니다. 상세 화면에서 진행 상황을 확인할 수 있습니다.</InlineNotice>
          <Link to={`/orders/${data.id}`} className="btn btn-primary btn-block">
            주문 상세 보기
          </Link>
        </div>
      ) : null}

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          요청 내역
        </h2>
        <ul className="stack" style={{ gap: 'var(--sp-2)' }}>
          {data.items.map((item) => (
            <li key={item.id} className="spread">
              <span className="muted">
                {item.productName} × {item.quantity}
              </span>
              <span className="tabular">{formatWon(item.lineAmount)}</span>
            </li>
          ))}
        </ul>
        <div className="spread">
          <span style={{ fontWeight: 700 }}>결제 예정 금액</span>
          <span className="tabular" style={{ fontWeight: 700 }}>
            {formatWon(data.totalAmount)}
          </span>
        </div>
        <p className="subtle">
          {data.fulfillmentMethod === 'DELIVERY' ? '배달' : '픽업'} · {data.address ?? '주소 없음'}
        </p>
      </section>

      {actionError ? <p className="field-error">{actionError}</p> : null}

      {isWaiting || isConfirming ? (
        <button type="button" className="btn btn-danger" disabled={cancelling} onClick={() => void cancel()}>
          {cancelling ? '취소 중…' : '주문 취소'}
        </button>
      ) : null}
    </div>
  )
}
