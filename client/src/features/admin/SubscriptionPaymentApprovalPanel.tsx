import { useEffect, useMemo, useState } from 'react'
import { adminSubscriptionApi } from '@/api/endpoints'
import { LoadingView } from '@/components/StateViews'
import type { SubscriptionPaymentRequest } from '@/types/api'

const won = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원'
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '-'
const TIER_LABEL: Record<string, string> = { SILVER: '실버', GOLD: '골드', PREMIUM: '프리미엄' }
const STATUS_LABEL: Record<string, string> = { APPROVED: '승인 완료', REJECTED: '반려 완료', PENDING: '승인 대기' }

function StatusBadge({ status }: { status: string }) {
  const className = status === 'APPROVED'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    : status === 'REJECTED'
      ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200'
      : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200'
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${className}`}>{STATUS_LABEL[status] ?? status}</span>
}

export function SubscriptionPaymentApprovalPanel() {
  const [pending, setPending] = useState<SubscriptionPaymentRequest[]>([])
  const [history, setHistory] = useState<SubscriptionPaymentRequest[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [nextPending, nextHistory] = await Promise.all([
        adminSubscriptionApi.pendingPaymentRequests(),
        adminSubscriptionApi.paymentRequestHistory(),
      ])
      setPending(nextPending)
      setHistory(nextHistory.filter((item) => item.status !== 'PENDING'))
      setSelectedId((current) => current && nextPending.some((item) => item.id === current) ? current : nextPending[0]?.id ?? null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독결제 요청을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const selected = useMemo(() => pending.find((item) => item.id === selectedId) ?? null, [pending, selectedId])
  const visibleHistory = historyExpanded ? history : history.slice(0, 3)

  const process = async () => {
    if (!selected || !confirmAction) return
    setBusy(true)
    try {
      if (confirmAction === 'approve') await adminSubscriptionApi.approvePaymentRequest(selected.id)
      else await adminSubscriptionApi.rejectPaymentRequest(selected.id, rejectReason.trim())
      setConfirmAction(null)
      setRejectReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독결제 요청을 처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !pending.length) return <LoadingView label="구독결제 승인 대기열을 불러오는 중입니다." />
  if (error && !pending.length && !history.length) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/25"><p className="font-black text-rose-800 dark:text-rose-200">{error}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl border border-rose-300 bg-white px-4 text-sm font-black text-rose-700 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-200">다시 시도</button></div>

  return <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-700">
          <div><p className="text-xs font-black tracking-[0.14em] text-brand-700 dark:text-brand-300">SUBSCRIPTION PAYMENT REVIEW</p><h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">구독결제 승인 대기</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">판매자가 보낸 플랜 결제 요청을 확인하고 승인 또는 반려합니다.</p></div>
          <button type="button" onClick={() => void load()} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">새로고침</button>
        </div>
        {error ? <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
        {pending.length === 0 ? <div className="px-6 py-14 text-center"><p className="text-base font-black text-slate-800 dark:text-slate-100">승인 대기 중인 구독결제가 없습니다.</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">판매자가 플랜 카드에서 결제 요청을 보내면 이곳에 표시됩니다.</p></div> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{pending.map((item) => <li key={item.id}><button type="button" onClick={() => { setSelectedId(item.id); setConfirmAction(null) }} className={`w-full px-5 py-5 text-left transition ${selectedId === item.id ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black text-brand-700 dark:text-brand-300">{TIER_LABEL[item.tier]} · #{item.id}</p><p className="mt-1 text-base font-black text-slate-950 dark:text-white">{item.storeName} · {item.productName}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{won(item.amount)} / {item.durationMonths}개월 · 요청 {dateTime(item.requestedAt)}</p></div><StatusBadge status="PENDING" /></div></button></li>)}</ul>}
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-black tracking-[0.14em] text-brand-700 dark:text-brand-300">REQUEST REVIEW</p>
        <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">구독결제 검토</h2>
        {!selected ? <p className="mt-8 text-sm leading-6 text-slate-500 dark:text-slate-400">왼쪽에서 승인 대기 요청을 선택하면 판매점·플랜·요청 금액을 확인할 수 있습니다.</p> : <div className="mt-6 space-y-5"><dl className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70"><div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">판매점</dt><dd className="font-black text-slate-950 dark:text-white">{selected.storeName}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">신청 플랜</dt><dd className="font-black text-slate-950 dark:text-white">{selected.productName} · {TIER_LABEL[selected.tier]}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">결제 요청</dt><dd className="font-black text-slate-950 dark:text-white">{won(selected.amount)} / {selected.durationMonths}개월</dd></div></dl>
          {confirmAction === 'reject' ? <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">반려 사유<textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="판매자에게 전달할 반려 사유를 입력해 주세요." className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-800" /></label> : null}
          {confirmAction ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/25"><p className="text-sm font-black text-amber-900 dark:text-amber-100">{confirmAction === 'approve' ? '승인하면 판매점 등급·만료일·구독 이력이 즉시 변경됩니다.' : '반려하면 판매자에게 사유와 함께 알림이 발송됩니다.'}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmAction(null)} className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">취소</button><button type="button" disabled={busy || (confirmAction === 'reject' && !rejectReason.trim())} onClick={() => void process()} className={confirmAction === 'approve' ? 'min-h-11 flex-1 rounded-xl bg-emerald-600 px-3 text-sm font-black text-white disabled:opacity-50' : 'min-h-11 flex-1 rounded-xl bg-rose-600 px-3 text-sm font-black text-white disabled:opacity-50'}>{busy ? '처리 중…' : confirmAction === 'approve' ? '승인 확정' : '반려 확정'}</button></div></div> : <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setConfirmAction('approve')} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700">승인하기</button><button type="button" onClick={() => setConfirmAction('reject')} className="min-h-11 rounded-xl border border-rose-300 bg-white px-4 text-sm font-black text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/25">반려하기</button></div>}
        </div>}
      </aside>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700"><div><p className="text-xs font-black tracking-[0.14em] text-brand-700 dark:text-brand-300">PROCESSING HISTORY</p><h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">구독결제 처리 히스토리 <span className="text-brand-700 dark:text-brand-300">{history.length}</span></h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">승인·반려가 끝난 요청을 확인합니다.</p></div>{history.length > 3 ? <button type="button" aria-expanded={historyExpanded} onClick={() => setHistoryExpanded((value) => !value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{historyExpanded ? '처리 히스토리 접기' : `처리 히스토리 펼치기 (${history.length})`}</button> : null}</div>
      {history.length === 0 ? <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">아직 처리 완료된 구독결제가 없습니다.</div> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{visibleHistory.map((item) => <li key={item.id} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950 dark:text-white">{item.storeName} · {item.productName}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{won(item.amount)} / {item.durationMonths}개월 · 요청 {dateTime(item.requestedAt)} · 처리 {dateTime(item.reviewedAt)}</p>{item.status === 'REJECTED' && item.rejectionReason ? <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">반려 사유: {item.rejectionReason}</p> : null}</div><StatusBadge status={item.status} /></div></li>)}</ul>}
      {!historyExpanded && history.length > 3 ? <p className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">최근 3건만 표시합니다.</p> : null}
    </section>
  </div>
}
