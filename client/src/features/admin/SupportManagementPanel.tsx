import { useMemo, useState } from 'react'
import { notify } from '@/lib/notify'
import { adminSupportApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminSupportInquiry, SupportInquiryStatus } from '@/types/api'

type Filter = 'ALL' | SupportInquiryStatus

const STATUS_LABEL: Record<SupportInquiryStatus, string> = {
  OPEN: '접수', IN_PROGRESS: '처리 중', ANSWERED: '답변 완료', CLOSED: '처리 완료',
}

const STATUS_TONE: Record<SupportInquiryStatus, string> = {
  OPEN: 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-200',
  ANSWERED: 'bg-brand-50 text-brand-700 dark:bg-brand-950/35 dark:text-brand-200',
  CLOSED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

const dateTime = (value: string) => new Date(value).toLocaleString('ko-KR', { hour12: false })

export function SupportManagementPanel() {
  const inquiries = useAsync<AdminSupportInquiry[]>(() => adminSupportApi.inquiries(), [])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)

  const all = useMemo(() => inquiries.data ?? [], [inquiries.data])
  const counts = useMemo(() => ({ ALL: all.length, OPEN: all.filter((item) => item.status === 'OPEN').length, IN_PROGRESS: all.filter((item) => item.status === 'IN_PROGRESS').length, ANSWERED: all.filter((item) => item.status === 'ANSWERED').length, CLOSED: all.filter((item) => item.status === 'CLOSED').length }), [all])
  const visible = useMemo(() => filter === 'ALL' ? all : all.filter((item) => item.status === filter), [all, filter])
  const selected = useMemo(() => all.find((item) => item.id === selectedId) ?? null, [all, selectedId])

  const selectInquiry = (inquiry: AdminSupportInquiry) => { setSelectedId(inquiry.id); setReply(inquiry.adminReply ?? ''); setConfirmComplete(false) }
  const reload = () => { inquiries.reload() }

  const changeStatus = async (status: Extract<SupportInquiryStatus, 'IN_PROGRESS' | 'CLOSED'>) => {
    if (!selected) return
    setSaving(true)
    try {
      await adminSupportApi.changeStatus(selected.id, status)
      await Promise.resolve(inquiries.reload())
      setConfirmComplete(false)
      notify(status === 'IN_PROGRESS' ? '민원 처리를 시작했습니다. 고객 답변을 등록한 뒤 처리 완료할 수 있습니다.' : '민원을 처리 완료로 변경하고 고객에게 완료 알림을 발송했습니다.')
    } catch (error) { notify(error instanceof Error ? error.message : '상태 변경에 실패했습니다.', 'error') } finally { setSaving(false) }
  }

  const saveReply = async () => {
    if (!selected || !reply.trim()) { notify('고객에게 전달할 답변을 입력해 주세요.', 'error'); return }
    setSaving(true)
    try {
      await adminSupportApi.reply(selected.id, reply.trim())
      await Promise.resolve(inquiries.reload())
      notify('답변을 등록하고 고객 알림을 발송했습니다. 내용을 확인한 뒤 처리 완료할 수 있습니다.')
    } catch (error) { notify(error instanceof Error ? error.message : '답변 등록에 실패했습니다.', 'error') } finally { setSaving(false) }
  }

  if (inquiries.loading && !inquiries.data) return <LoadingView label="고객 민원을 불러오는 중입니다" />
  if (inquiries.error) return <ErrorView error={inquiries.error} onRetry={reload} />

  return <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black tracking-wider text-brand-600 dark:text-brand-300">CUSTOMER CIVIL SERVICE</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">고객 민원 · 알림 운영</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-300">접수 → 처리 시작 → 답변·고객 알림 → 처리 완료 순서로 고객 문의를 관리합니다.</p></div><button type="button" onClick={reload} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">새로고침</button></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{(['ALL', 'OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'] as Filter[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-xl border p-3 text-left transition ${filter === status ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/35' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'}`}><p className="text-xs font-bold text-slate-500 dark:text-slate-300">{status === 'ALL' ? '전체 민원' : STATUS_LABEL[status]}</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{counts[status]}</p></button>)}</div></section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><p className="text-sm font-black text-slate-900 dark:text-white">민원 목록 <span className="ml-1 text-brand-600 dark:text-brand-300">{visible.length}</span></p></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map((inquiry) => <button key={inquiry.id} type="button" onClick={() => selectInquiry(inquiry)} className={`block w-full p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${selectedId === inquiry.id ? 'bg-brand-50/50 ring-1 ring-inset ring-brand-200 dark:bg-brand-950/30 dark:ring-brand-500/60' : ''}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-brand-600 dark:text-brand-300">{inquiry.category} · 고객 {inquiry.consumerName}</p><h3 className="mt-1 truncate font-black text-slate-900 dark:text-white">{inquiry.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{inquiry.content}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[inquiry.status]}`}>{STATUS_LABEL[inquiry.status]}</span></div><p className="mt-3 text-xs text-slate-400 dark:text-slate-500">접수 {dateTime(inquiry.createdAt)}</p></button>)}{!visible.length ? <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-300">선택한 상태의 민원이 없습니다.</p> : null}</div></section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-black tracking-wider text-brand-600 dark:text-brand-300">CASE HANDLING</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">민원 처리 · 고객 알림</h2>{selected ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-brand-600 dark:text-brand-300">{selected.category} · {selected.consumerName}</p><h3 className="mt-1 font-black text-slate-900 dark:text-white">{selected.title}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_TONE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span></div><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.content}</p><p className="mt-3 text-xs text-slate-400 dark:text-slate-500">접수 {dateTime(selected.createdAt)}</p></div>

        {selected.status === 'OPEN' ? <button type="button" disabled={saving} onClick={() => void changeStatus('IN_PROGRESS')} className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200 dark:hover:bg-amber-950/55">처리 시작</button> : null}
        {selected.status === 'IN_PROGRESS' ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200"><strong>처리 중입니다.</strong> 고객 답변을 등록하면 고객 알림이 발송되고, 그 다음 처리 완료할 수 있습니다.</div> : null}
        {selected.status === 'ANSWERED' ? <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm leading-6 text-brand-800 dark:border-brand-800 dark:bg-brand-950/35 dark:text-brand-200"><strong>답변과 고객 알림이 등록됐습니다.</strong> 내용을 확인한 뒤 처리 완료로 닫아 주세요.</div> : null}
        {selected.status === 'CLOSED' ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><strong>처리 완료된 문의입니다.</strong> 완료된 문의는 다시 처리 시작하거나 답변을 수정할 수 없습니다.</div> : null}

        <div><label className="text-xs font-bold text-slate-600 dark:text-slate-300">고객 답변</label><textarea value={reply} onChange={(event) => setReply(event.target.value)} disabled={saving || selected.status !== 'IN_PROGRESS'} maxLength={3000} placeholder={selected.status === 'OPEN' ? '처리 시작 후 고객 답변을 등록할 수 있습니다.' : selected.status === 'CLOSED' ? '처리 완료된 문의의 답변입니다.' : '고객에게 전달할 답변을 입력해 주세요'} className="mt-2 min-h-40 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400" /></div>
        {selected.status === 'IN_PROGRESS' ? <button type="button" disabled={saving || !reply.trim()} onClick={() => void saveReply()} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500">{saving ? '반영 중' : '답변 등록 · 고객 알림 발송'}</button> : null}
        {selected.status === 'ANSWERED' ? <div className="space-y-2">{confirmComplete ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200"><p><strong>처리 완료 후에는 다시 열 수 없습니다.</strong> 고객 답변과 처리 내용을 확인했으면 완료를 확정해 주세요.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirmComplete(false)} className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-800 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-200">취소</button><button type="button" disabled={saving} onClick={() => void changeStatus('CLOSED')} className="min-h-11 rounded-lg bg-rose-700 px-3 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50">처리 완료 확정</button></div></div> : <button type="button" onClick={() => setConfirmComplete(true)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">처리 완료</button>}</div> : null}
        {selected.adminReply ? <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-950/35"><p className="text-xs font-black text-brand-700 dark:text-brand-200">현재 등록 답변</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{selected.adminReply}</p></div> : null}</div> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-500 dark:bg-slate-800 dark:text-slate-300">왼쪽 목록에서 고객 민원을 선택하면 처리 시작, 답변 등록·고객 알림, 처리 완료 순서로 진행할 수 있습니다.</p>}</aside></div></div>
}
