import { useState } from 'react'
import { sellerApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { tierLabel } from '@/components/format'
import type { SellerStore } from '@/types/api'

export function SlotControlBar({ store, onChanged }: { store: SellerStore; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const restricted = Boolean(store.restrictedUntil && new Date(store.restrictedUntil) > new Date(store.serverTime))

  async function run(task: () => Promise<SellerStore>) {
    setBusy(true); setError(null)
    try { await task(); onChanged() } catch (caught) { setError(caught instanceof ApiError ? caught.message : '설정을 변경할 수 없습니다.') } finally { setBusy(false) }
  }

  const counters = [
    ['설정 슬롯', store.configuredSlots, 'text-slate-900 dark:text-white'], ['제안 대기', store.reservedSlots, 'text-amber-600'], ['진행 중', store.activeSlots, 'text-sky-600'], ['수신 가능', store.availableSlots, 'text-emerald-600'], ['신뢰 점수', Math.round(store.trustScore), 'text-brand-600'],
  ] as const

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-5 text-white"><div><p className="text-xs font-bold text-brand-200">SELLER OPERATIONS</p><h2 className="mt-1 text-xl font-black">{store.name}</h2><p className="mt-1 text-xs text-slate-300">{store.guCode} · {tierLabel(store.tier)} · 최대 {store.tierSlotCap}슬롯</p></div><div className="flex flex-wrap gap-2">{store.verified ? <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-bold text-emerald-100">검증 완료</span> : <span className="rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-100">검증 대기</span>}{restricted ? <span className="rounded-full bg-rose-400/20 px-3 py-1.5 text-xs font-bold text-rose-100">응찰 제한 중</span> : null}{!store.receivingOrders ? <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">주문 수신 중지</span> : null}</div></div><div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-5 dark:bg-slate-800">{counters.map(([label, value, tone]) => <div key={label} className="bg-white px-4 py-4 dark:bg-slate-900"><p className="text-xs font-bold text-slate-400">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p></div>)}</div><div className="flex flex-wrap items-center gap-3 p-5"><div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">동시 처리 주문</span><div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><button type="button" disabled={busy || store.configuredSlots <= 0} onClick={() => void run(() => sellerApi.updateSlots(store.configuredSlots - 1, 'MANUAL_DECREASE'))} className="h-10 w-10 text-lg font-black hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800">−</button><span className="grid h-10 w-10 border-x border-slate-200 text-sm font-black dark:border-slate-700">{store.configuredSlots}</span><button type="button" disabled={busy || store.configuredSlots >= store.tierSlotCap} onClick={() => void run(() => sellerApi.updateSlots(store.configuredSlots + 1, 'MANUAL_INCREASE'))} className="h-10 w-10 text-lg font-black hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800">+</button></div></div><div className="ml-auto flex flex-wrap gap-2"><button type="button" disabled={busy || store.configuredSlots === 0} onClick={() => void run(() => sellerApi.busyMode())} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-40">바쁨 모드</button>{store.configuredSlots === 0 ? <button type="button" disabled={busy} onClick={() => void run(() => sellerApi.updateSlots(Math.min(3, store.tierSlotCap), 'RESUME'))} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-40">주문 수신 재개</button> : null}</div>{store.configuredSlots >= store.tierSlotCap ? <p className="w-full text-xs text-amber-600">현재 등급의 최대 슬롯에 도달했습니다. 상위 구독으로 변경하면 더 많은 주문을 받을 수 있습니다.</p> : null}{error ? <p role="alert" className="w-full rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}</div></section>
  )
}
