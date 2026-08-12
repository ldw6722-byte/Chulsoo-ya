import { useEffect, useMemo, useState } from 'react'
import { adminStoreApi, adminWorkflowApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminStoreActivity, AdminWorkflowOrder } from '@/types/api'

const statusLabel: Record<string, string> = {
  WAITING_MATCH: '응찰 대기', SELLER_CONFIRMING: '판매자 확인', PAYMENT_PENDING: '결제 대기',
  PREPARING: '상품 준비', DELIVERY_IN_PROGRESS: '배송 진행', COMPLETED: '완료', CANCELLED: '취소',
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('ko-KR', { hour12: false }) : '-'
}

function OrderTimeline({ order }: { order: AdminWorkflowOrder }) {
  return <ol className="mt-3 grid gap-2 border-l-2 border-slate-200 pl-4">{order.timeline.map(event => <li key={`${event.type}-${event.occurredAt}`} className="relative text-xs"><span className="absolute -left-[1.42rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" /><p className="font-black text-slate-800">{event.label}</p><p className="mt-0.5 text-slate-500">{dateTime(event.occurredAt)} {event.detail ? `· ${event.detail}` : ''}</p></li>)}</ol>
}

function ActivitySummary({ activity }: { activity: AdminStoreActivity }) {
  return <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">설정 슬롯</p><p className="mt-1 font-black text-slate-900">{activity.configuredSlots}개</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">현재 사용</p><p className="mt-1 font-black text-slate-900">{activity.reservedSlots + activity.activeSlots}개</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">가용 슬롯</p><p className="mt-1 font-black text-emerald-700">{activity.availableSlots}개</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">신뢰 점수</p><p className="mt-1 font-black text-slate-900">{activity.trustScore.toFixed(0)}점</p></div></div>
}

export function WorkflowMonitorPanel() {
  const orders = useAsync<AdminWorkflowOrder[]>(() => adminWorkflowApi.orders(), [])
  const stores = useAsync(() => adminStoreApi.list(), [])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [slots, setSlots] = useState(0)
  const [reason, setReason] = useState('관리자 운영 조정')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const activity = useAsync<AdminStoreActivity | null>(() => selectedStoreId === null ? Promise.resolve(null) : adminWorkflowApi.storeActivity(selectedStoreId), [selectedStoreId])
  const workflowOrders = useMemo(() => orders.data ?? [], [orders.data])

  useEffect(() => {
    if (selectedStoreId === null && (stores.data ?? []).length) setSelectedStoreId(stores.data?.[0].id ?? null)
  }, [selectedStoreId, stores.data])
  useEffect(() => {
    if (activity.data) setSlots(activity.data.configuredSlots)
  }, [activity.data])

  const forceSlots = async () => {
    if (selectedStoreId === null) return
    setSaving(true); setNotice('')
    try {
      await adminWorkflowApi.forceSlots(selectedStoreId, { configuredSlots: Number(slots), reason })
      await activity.reload()
      setNotice('판매자 슬롯 설정을 반영했습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '슬롯 설정 변경에 실패했습니다.')
    } finally { setSaving(false) }
  }

  if (orders.loading && !orders.data) return <LoadingView label="주문 생애주기를 불러오는 중입니다" />
  if (orders.error) return <ErrorView error={orders.error} onRetry={orders.reload} />

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black tracking-wider text-brand-600">ORDER LIFECYCLE</p><h2 className="mt-1 text-lg font-black text-slate-900">주문 · 응찰 모니터링</h2><p className="mt-1 text-sm text-slate-500">구매자 요청부터 응찰·낙찰·판매자 확인·결제까지 서버 상태를 추적합니다.</p></div><button type="button" onClick={orders.reload} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900">새로고침</button></div>
      <div className="divide-y divide-slate-100">{workflowOrders.length ? workflowOrders.map(order => <article key={order.orderId} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">주문 #{order.orderId}</h3><span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{statusLabel[order.status] ?? order.status}</span></div><p className="mt-2 text-sm text-slate-600">구매자 {order.consumerName} · {order.districtCode} · {order.itemCount}개 품목 · {order.totalAmount.toLocaleString()}원</p><p className="mt-1 text-xs text-slate-500">제안 {order.offerCount}건 · 응찰 {order.bidCount}건 · 낙찰 판매점 {order.storeName ?? '미정'}</p></div><p className="text-xs text-slate-500">매칭 마감 {dateTime(order.matchDeadlineAt)}</p></div><OrderTimeline order={order} /></article>) : <p className="p-10 text-center text-sm text-slate-500">표시할 주문 생애주기가 없습니다.</p>}</div>
    </section>
    <aside className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black tracking-wider text-rose-600">SELLER CONTROL</p><h2 className="mt-1 text-lg font-black text-slate-900">판매자 운영 조정</h2><p className="mt-2 text-sm leading-6 text-slate-500">관리자가 운영 이력을 확인하고 가용 슬롯을 조정할 수 있습니다.</p><select value={selectedStoreId ?? ''} onChange={event => setSelectedStoreId(Number(event.target.value))} className="mt-4 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">{(stores.data ?? []).map(store => <option key={store.id} value={store.id}>{store.name} · {store.districtName}</option>)}</select>{activity.loading ? <div className="mt-4"><LoadingView label="운영 현황을 불러오는 중입니다" /></div> : activity.error ? <div className="mt-4"><ErrorView error={activity.error} onRetry={activity.reload} /></div> : activity.data ? <div className="mt-4 space-y-4"><ActivitySummary activity={activity.data} /><div className="grid gap-2"><label className="text-xs font-bold text-slate-600">강제 설정 슬롯</label><input min="0" max="15" type="number" value={slots} onChange={event => setSlots(Number(event.target.value))} className="h-11 rounded-xl border border-slate-300 px-3 text-sm" /><input value={reason} onChange={event => setReason(event.target.value)} placeholder="조정 사유" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" /><button type="button" disabled={saving || !reason.trim()} onClick={() => void forceSlots()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? '반영 중' : '슬롯 강제 조정'}</button></div><div className="border-t border-slate-100 pt-4"><p className="text-xs font-black text-slate-700">최근 조정 이력</p>{activity.data.slotLogs.length ? <ul className="mt-3 space-y-2">{activity.data.slotLogs.slice(0, 5).map(log => <li key={`${log.createdAt}-${log.newSlots}`} className="text-xs text-slate-500"><b className="text-slate-700">{log.oldSlots} → {log.newSlots}</b> · {log.changedBy} · {log.reason}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">기록이 없습니다.</p>}</div></div> : null}{notice ? <p role="status" className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{notice}</p> : null}</section></aside>
  </div>
}
