import { useState } from 'react'
import { adminPaymentApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import type { DevelopmentPaymentApprovalHistory, Order } from '@/types/api'

const money = (value: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value)
const when = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '처리 시각 확인 중'

export function DevelopmentPaymentApprovalPanel() {
  const pending = useAsync<Order[]>(() => adminPaymentApi.developmentPending(), [])
  const history = useAsync<DevelopmentPaymentApprovalHistory[]>(() => adminPaymentApi.developmentHistory(), [])
  const [approvingId, setApprovingId] = useState<number | null>(null)

  async function approve(order: Order) {
    if (!window.confirm(`주문 #${order.id}을 개발용 결제 승인 처리할까요? 실제 결제는 발생하지 않으며 주문 상태만 준비 중으로 전환됩니다.`)) return
    setApprovingId(order.id)
    try {
      await adminPaymentApi.developmentApprove(order.id)
      notify(`주문 #${order.id}을 개발용 결제 승인 처리했습니다.`)
      await Promise.all([pending.reload(), history.reload()])
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : '개발 결제 승인에 실패했습니다.', 'error')
    } finally {
      setApprovingId(null)
    }
  }

  if (pending.loading && !pending.data) return <LoadingView label="결제 대기 주문을 불러오는 중입니다" />
  if (pending.error) return <ErrorView error={pending.error} onRetry={pending.reload} />

  const orders = pending.data ?? []
  const records = history.data ?? []

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm dark:border-violet-900/60 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-black tracking-wider text-violet-600">DEVELOPMENT ONLY</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">개발 결제 승인</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">판매자 재고 확인을 마쳐 결제 대기 상태가 된 주문입니다. 실제 카드·계좌 결제 없이 주문 상태를 결제 완료 후 준비 중으로 전환합니다.</p>
          </div>
          <button type="button" onClick={() => { pending.reload(); history.reload() }} className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">새로고침</button>
        </div>

        {orders.length === 0 ? (
          <div className="py-10"><EmptyView title="결제 승인 대기 주문이 없습니다" description="구매자 주문 요청 후 판매자가 재고 확인을 완료하면 이 목록에 표시됩니다." /></div>
        ) : (
          <div className="mt-5 space-y-3">
            {orders.map(order => (
              <article key={order.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900 dark:text-white">주문 #{order.id}</p><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">결제 대기</span></div>
                    <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">낙찰 판매점: {order.winningStoreName ?? '확인 중'}</p>
                    <p className="mt-1 text-sm text-slate-500">{order.fulfillmentMethod === 'DELIVERY' ? (order.address ?? '배송지 확인 중') : '매장 픽업'} · {order.items.length}개 품목</p>
                    <p className="mt-1 text-xs text-slate-500">판매자 확인: {when(order.sellerConfirmedAt)}</p>
                  </div>
                  <div className="flex min-w-40 flex-col items-stretch gap-3 text-right">
                    <strong className="text-lg font-black text-slate-900 dark:text-white">{money(order.totalAmount)}</strong>
                    <button type="button" disabled={approvingId !== null} onClick={() => void approve(order)} className="min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-50">{approvingId === order.id ? '승인 처리 중…' : '개발용 결제 승인'}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
          <p className="text-xs font-black tracking-wider text-emerald-600">APPROVAL HISTORY</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">승인 및 처리 상태 히스토리</h2>
          <p className="mt-2 text-sm text-slate-500">개발 결제 승인 후 주문이 어떤 처리 단계에 있는지 최근 승인 순서대로 확인합니다.</p>
        </div>

        {history.loading && !history.data ? (
          <div className="py-10"><LoadingView label="승인 이력을 불러오는 중입니다" /></div>
        ) : history.error ? (
          <div className="py-8"><ErrorView error={history.error} onRetry={history.reload} /></div>
        ) : records.length === 0 ? (
          <div className="py-10"><EmptyView title="아직 개발 결제 승인 이력이 없습니다" description="결제 대기 주문을 승인하면 이곳에 승인 시각과 이후 처리 상태가 남습니다." /></div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                <tr><th className="px-4 py-3">주문</th><th className="px-4 py-3">판매점</th><th className="px-4 py-3">승인 시각</th><th className="px-4 py-3">결제 상태</th><th className="px-4 py-3">현재 처리 상태</th><th className="px-4 py-3 text-right">금액</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map(record => (
                  <tr key={record.order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-4 font-black text-slate-900 dark:text-white">#{record.order.id}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{record.order.winningStoreName ?? '판매점 확인 중'}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{when(record.approvedAt)}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">{record.paymentStatus === 'PAID' ? '결제 완료' : record.paymentStatus}</span></td>
                    <td className="px-4 py-4"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-800">{record.order.status === 'PREPARING' ? '준비 중' : record.order.status}</span></td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">{money(record.order.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
