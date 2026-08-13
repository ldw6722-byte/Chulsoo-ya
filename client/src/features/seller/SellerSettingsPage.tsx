import { sellerApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { formatDateTime, tierLabel } from '@/components/format'
import { SlotControlBar } from './SlotControlBar'
import type { SellerPenalty, SellerStore, SlotLog } from '@/types/api'

const CHANGED_BY_LABEL: Record<string, string> = {
  SELLER: '판매자',
  ADMIN: '관리자',
  SYSTEM: '시스템',
}

const REASON_LABEL: Record<string, string> = {
  MANUAL_INCREASE: '수동 증가',
  MANUAL_DECREASE: '수동 감소',
  BUSY_MODE: '바쁨 모드',
  RESUME: '수신 재개',
}

export function SellerSettingsPage() {
  const store = useAsync<SellerStore>(() => sellerApi.store(), [])
  const logs = useAsync<SlotLog[]>(() => sellerApi.slotLogs(), [])
  const penalties = useAsync<SellerPenalty[]>(() => sellerApi.penalties(), [])

  if (store.loading && !store.data) {
    return (
      <div className="page">
        <LoadingView label="설정을 불러오는 중입니다" />
      </div>
    )
  }
  if (store.error && !store.data) {
    return (
      <div className="page">
        <ErrorView error={store.error} onRetry={store.reload} />
      </div>
    )
  }
  if (!store.data) return null
  const sellerStore = store.data
  const activePenalty = (penalties.data ?? []).find((penalty) => penalty.restrictionUntil && new Date(penalty.restrictionUntil).getTime() > new Date(sellerStore.serverTime).getTime())

  return (
    <div className="page stack">
      <h1 className="section-title" style={{ fontSize: 'var(--fs-xl)' }}>
        슬롯 설정
      </h1>

      <SlotControlBar
        store={store.data}
        onChanged={() => {
          store.reload()
          logs.reload()
        }}
      />

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          구독 등급
        </h2>
        <table className="table">
          <tbody>
            <tr>
              <th scope="row">현재 등급</th>
              <td>{tierLabel(store.data.tier)}</td>
            </tr>
            <tr>
              <th scope="row">최대 슬롯</th>
              <td className="tabular">{store.data.tierSlotCap}슬롯</td>
            </tr>
            <tr>
              <th scope="row">알림 우선순위</th>
              <td>
                {store.data.tier === 'PREMIUM'
                  ? '즉시 수신'
                  : store.data.tier === 'STANDARD'
                    ? '3초 후 수신'
                    : '6초 후 수신'}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="subtle">
          상위 등급은 더 많은 동시 주문과 빠른 알림 수신 권한을 제공합니다. 등급 변경은 관리자 승인 후 반영됩니다.
        </p>
      </section>

      {activePenalty ? <section className="card stack" style={{ padding: 'var(--sp-4)', borderColor: 'var(--c-danger)' }}><h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>주문 응찰 제한</h2><p className="subtle">{activePenalty.reason}</p><p className="tabular">제한 해제 예정: {activePenalty.restrictionUntil ? formatDateTime(activePenalty.restrictionUntil) : '-'}</p><p className="subtle">신뢰 점수 {activePenalty.trustScoreDelta}점이 반영되었습니다. 제한 중에는 새 주문 제안을 받을 수 없습니다.</p></section> : null}

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>
          가용량 변경 이력
        </h2>
        {logs.loading && !logs.data ? (
          <p className="muted">이력을 불러오는 중입니다…</p>
        ) : logs.error ? (
          <ErrorView error={logs.error} onRetry={logs.reload} />
        ) : (logs.data?.length ?? 0) === 0 ? (
          <EmptyView title="변경 이력이 없습니다" description="슬롯을 조정하면 모든 변경이 기록됩니다." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">시각</th>
                <th scope="col">변경</th>
                <th scope="col">주체</th>
                <th scope="col">사유</th>
              </tr>
            </thead>
            <tbody>
              {(logs.data ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="tabular">{formatDateTime(log.createdAt)}</td>
                  <td className="tabular">
                    {log.oldConfiguredSlots} → {log.newConfiguredSlots}
                  </td>
                  <td>{CHANGED_BY_LABEL[log.changedBy] ?? log.changedBy}</td>
                  <td>{log.reason ? (REASON_LABEL[log.reason] ?? log.reason) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card stack" style={{ padding: 'var(--sp-4)' }}>
        <h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>패널티 · 제한 이력</h2>
        {penalties.loading && !penalties.data ? <p className="muted">이력을 불러오는 중입니다…</p> : penalties.error ? <ErrorView error={penalties.error} onRetry={penalties.reload} /> : (penalties.data?.length ?? 0) === 0 ? <EmptyView title="패널티 이력이 없습니다" description="물품 확인 기한을 지키면 신뢰 점수와 응찰 권한이 유지됩니다." /> : <table className="table"><thead><tr><th scope="col">적용 시각</th><th scope="col">주문</th><th scope="col">사유</th><th scope="col">점수</th><th scope="col">제한 해제</th></tr></thead><tbody>{(penalties.data ?? []).map((penalty) => <tr key={penalty.id}><td className="tabular">{formatDateTime(penalty.appliedAt)}</td><td>#{penalty.orderId}</td><td>{penalty.reason}</td><td className="tabular">{penalty.trustScoreDelta}</td><td className="tabular">{penalty.restrictionUntil ? formatDateTime(penalty.restrictionUntil) : '-'}</td></tr>)}</tbody></table>}
      </section>
    </div>
  )
}
