import { useState } from 'react'
import { sellerApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { tierLabel } from '@/components/format'
import type { SellerStore } from '@/types/api'

export function SlotControlBar({ store, onChanged }: { store: SellerStore; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pauseConfirmationOpen, setPauseConfirmationOpen] = useState(false)
  const restricted = Boolean(store.restrictedUntil && new Date(store.restrictedUntil) > new Date(store.serverTime))

  async function run(task: () => Promise<SellerStore>) {
    setBusy(true)
    setError(null)
    try {
      await task()
      onChanged()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : '설정을 변경할 수 없습니다.')
    } finally {
      setBusy(false)
    }
  }

  function toggleReceivingOrders() {
    if (busy) return
    if (store.receivingOrders) {
      setPauseConfirmationOpen(true)
      return
    }
    void run(() => sellerApi.updateSlots(Math.min(3, store.tierSlotCap), 'RESUME'))
  }

  async function confirmPauseOrders() {
    setPauseConfirmationOpen(false)
    await run(() => sellerApi.busyMode())
  }

  const counters = [
    ['설정 슬롯', store.configuredSlots, 'text-slate-900 dark:text-white'],
    ['제안 대기', store.reservedSlots, 'text-amber-600'],
    ['진행 중', store.activeSlots, 'text-sky-600'],
    ['수신 가능', store.availableSlots, 'text-emerald-600'],
    ['신뢰 점수', Math.round(store.trustScore), 'text-brand-600'],
  ] as const

  const receiving = store.receivingOrders

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-5 text-white">
        <div>
          <p className="text-xs font-bold text-brand-200">SELLER OPERATIONS</p>
          <h2 className="mt-1 text-xl font-black">{store.name}</h2>
          <p className="mt-1 text-xs text-slate-300">{store.guCode} · {tierLabel(store.tier)} · 최대 {store.tierSlotCap}슬롯</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {store.verified ? <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-100">검증 완료</span> : <span className="rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-100">검증 대기</span>}
          {restricted ? <span className="rounded-full bg-rose-400/20 px-3 py-1.5 text-xs font-bold text-rose-100">응찰 제한 중</span> : null}
          {!receiving ? <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">주문 수신 중지</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-5 dark:bg-slate-800">
        {counters.map(([label, value, tone]) => <div key={label} className="bg-white px-4 py-4 dark:bg-slate-900"><p className="text-xs font-bold text-slate-400">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p></div>)}
      </div>

      <div className="flex flex-wrap items-center gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">동시 처리 주문</span>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <button type="button" disabled={busy || store.configuredSlots <= 0} onClick={() => void run(() => sellerApi.updateSlots(store.configuredSlots - 1, 'MANUAL_DECREASE'))} className="h-10 w-10 text-lg font-black hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800">−</button>
            <span className="grid h-10 w-10 place-items-center border-x border-slate-200 text-sm font-black dark:border-slate-700">{store.configuredSlots}</span>
            <button type="button" disabled={busy || store.configuredSlots >= store.tierSlotCap} onClick={() => void run(() => sellerApi.updateSlots(store.configuredSlots + 1, 'MANUAL_INCREASE'))} className="h-10 w-10 text-lg font-black hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800">+</button>
          </div>
        </div>

        <div className="ml-auto flex min-w-52 items-center justify-between gap-4 rounded-full border border-violet-500/70 bg-violet-500/5 px-4 py-2 dark:border-violet-400/70 dark:bg-violet-400/10">
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">주문 수신</p>
            <p id="order-receiving-description" className={`mt-0.5 text-xs font-bold ${receiving ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{busy ? '변경 중' : receiving ? '새 주문을 받고 있습니다.' : '새 주문을 받지 않습니다.'}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={receiving}
            aria-describedby="order-receiving-description"
            aria-label={receiving ? '주문 수신을 중지하려면 확인이 필요합니다' : '주문 수신을 다시 시작합니다'}
            disabled={busy}
            onClick={toggleReceivingOrders}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 dark:focus:ring-offset-slate-900 ${receiving ? 'bg-emerald-600 focus:ring-emerald-600 dark:bg-emerald-500 dark:focus:ring-emerald-400' : 'bg-rose-600 focus:ring-rose-600 dark:bg-rose-500 dark:focus:ring-rose-400'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${receiving ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {store.configuredSlots >= store.tierSlotCap ? <p className="w-full text-xs text-amber-600">현재 등급의 최대 슬롯에 도달했습니다. 상위 구독으로 변경하면 더 많은 주문을 받을 수 있습니다.</p> : null}
        {error ? <p role="alert" className="w-full rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
      </div>

      {pauseConfirmationOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="pause-orders-title" aria-describedby="pause-orders-description" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-black tracking-wider text-rose-600 dark:text-rose-300">주문 수신 변경</p><h3 id="pause-orders-title" className="mt-2 text-xl font-black text-slate-950 dark:text-white">새 주문을 거절할까요?</h3><p id="pause-orders-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">확인하면 새 주문 제안을 받지 않습니다. 이미 진행 중인 주문은 계속 처리할 수 있으며, 나중에 토글을 다시 켜면 주문 수신을 재개할 수 있습니다.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPauseConfirmationOpen(false)} className="btn">취소</button><button type="button" disabled={busy} onClick={() => void confirmPauseOrders()} className="btn btn-danger">주문 거절하기</button></div></section></div> : null}
    </section>
  )
}
