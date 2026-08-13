import { useMemo, useState } from 'react'
import { adminSupportApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminSupportInquiry, SupportInquiryStatus } from '@/types/api'

type Filter = 'ALL' | SupportInquiryStatus

const STATUS_LABEL: Record<SupportInquiryStatus, string> = {
  OPEN: '접수', IN_PROGRESS: '처리 중', ANSWERED: '답변 완료', CLOSED: '처리 완료',
}

const STATUS_TONE: Record<SupportInquiryStatus, string> = {
  OPEN: 'bg-rose-50 text-rose-700', IN_PROGRESS: 'bg-amber-50 text-amber-700', ANSWERED: 'bg-brand-50 text-brand-700', CLOSED: 'bg-slate-100 text-slate-700',
}

const dateTime = (value: string) => new Date(value).toLocaleString('ko-KR', { hour12: false })

export function SupportManagementPanel() {
  const inquiries = useAsync<AdminSupportInquiry[]>(() => adminSupportApi.inquiries(), [])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const all = inquiries.data ?? []
  const counts = useMemo(() => ({ ALL: all.length, OPEN: all.filter((item) => item.status === 'OPEN').length, IN_PROGRESS: all.filter((item) => item.status === 'IN_PROGRESS').length, ANSWERED: all.filter((item) => item.status === 'ANSWERED').length, CLOSED: all.filter((item) => item.status === 'CLOSED').length }), [all])
  const visible = useMemo(() => filter === 'ALL' ? all : all.filter((item) => item.status === filter), [all, filter])
  const selected = useMemo(() => all.find((item) => item.id === selectedId) ?? null, [all, selectedId])

  const selectInquiry = (inquiry: AdminSupportInquiry) => { setSelectedId(inquiry.id); setReply(inquiry.adminReply ?? ''); setNotice('') }
  const reload = () => { inquiries.reload(); setNotice('') }

  const changeStatus = async (status: SupportInquiryStatus) => {
    if (!selected) return
    setSaving(true); setNotice('')
    try {
      await adminSupportApi.changeStatus(selected.id, status)
      await Promise.resolve(inquiries.reload())
      setNotice(status === 'CLOSED' ? '민원을 처리 완료로 변경하고 고객에게 완료 알림을 발송했습니다.' : `민원을 ${STATUS_LABEL[status]} 상태로 변경했습니다.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : '상태 변경에 실패했습니다.') } finally { setSaving(false) }
  }

  const saveReply = async () => {
    if (!selected || !reply.trim()) { setNotice('고객에게 전달할 답변을 입력해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      await adminSupportApi.reply(selected.id, reply.trim())
      await Promise.resolve(inquiries.reload())
      setNotice('답변을 등록했습니다. 고객센터 알림으로 답변 발송이 완료되었습니다.')
    } catch (error) { setNotice(error instanceof Error ? error.message : '답변 등록에 실패했습니다.') } finally { setSaving(false) }
  }

  if (inquiries.loading && !inquiries.data) return <LoadingView label="고객 민원을 불러오는 중입니다" />
  if (inquiries.error) return <ErrorView error={inquiries.error} onRetry={reload} />

  return <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black tracking-wider text-brand-600">CUSTOMER CIVIL SERVICE</p><h2 className="mt-1 text-xl font-black text-slate-900">고객 민원 · 알림 운영</h2><p className="mt-2 text-sm text-slate-500">고객센터에서 접수된 1:1 문의와 고객의 소리를 확인하고 답변·처리 상태·고객 알림을 관리합니다.</p></div><button type="button" onClick={reload} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900">새로고침</button></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{(['ALL', 'OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'] as Filter[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-xl border p-3 text-left transition ${filter === status ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><p className="text-xs font-bold text-slate-500">{status === 'ALL' ? '전체 민원' : STATUS_LABEL[status]}</p><p className="mt-1 text-2xl font-black text-slate-900">{counts[status]}</p></button>)}</div></section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-black text-slate-900">민원 목록 <span className="ml-1 text-brand-600">{visible.length}</span></p></div><div className="divide-y divide-slate-100">{visible.map((inquiry) => <button key={inquiry.id} type="button" onClick={() => selectInquiry(inquiry)} className={`block w-full p-5 text-left transition hover:bg-slate-50 ${selectedId === inquiry.id ? 'bg-brand-50/50 ring-1 ring-inset ring-brand-200' : ''}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-brand-600">{inquiry.category} · 고객 {inquiry.consumerName}</p><h3 className="mt-1 truncate font-black text-slate-900">{inquiry.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{inquiry.content}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[inquiry.status]}`}>{STATUS_LABEL[inquiry.status]}</span></div><p className="mt-3 text-xs text-slate-400">접수 {dateTime(inquiry.createdAt)}</p></button>)}{!visible.length ? <p className="p-10 text-center text-sm text-slate-500">선택한 상태의 민원이 없습니다.</p> : null}</div></section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">CASE HANDLING</p><h2 className="mt-1 text-lg font-black text-slate-900">민원 처리 · 고객 알림</h2>{selected ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-brand-600">{selected.category} · {selected.consumerName}</p><h3 className="mt-1 font-black text-slate-900">{selected.title}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${STATUS_TONE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{selected.content}</p><p className="mt-3 text-xs text-slate-400">접수 {dateTime(selected.createdAt)}</p></div><div className="grid grid-cols-2 gap-2"><button type="button" disabled={saving || selected.status === 'IN_PROGRESS'} onClick={() => void changeStatus('IN_PROGRESS')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800 disabled:opacity-50">처리 시작</button><button type="button" disabled={saving || selected.status === 'CLOSED'} onClick={() => void changeStatus('CLOSED')} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50">처리 완료</button></div><div><label className="text-xs font-bold text-slate-600">고객 답변</label><textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={3000} placeholder="고객에게 전달할 답변을 입력해 주세요" className="mt-2 min-h-40 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6" /></div><button type="button" disabled={saving || !reply.trim()} onClick={() => void saveReply()} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? '반영 중' : '답변 등록 · 고객 알림 발송'}</button>{selected.adminReply ? <div className="rounded-xl border border-brand-100 bg-brand-50 p-3"><p className="text-xs font-black text-brand-700">현재 등록 답변</p><p className="mt-1 text-sm leading-6 text-slate-700">{selected.adminReply}</p></div> : null}{notice ? <p role="status" className="rounded-xl bg-slate-100 px-3 py-2 text-sm leading-6 text-slate-700">{notice}</p> : null}</div> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">왼쪽 목록에서 고객 민원을 선택하면 처리 시작, 답변 등록, 처리 완료와 고객 알림 발송을 진행할 수 있습니다.</p>}</aside></div></div>
}
