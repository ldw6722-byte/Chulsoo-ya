import { useState } from 'react'
import { adminCustomerNoticeApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import { splitNoticeTitle } from '@/lib/noticeTitle'
import type { CustomerNotice, CustomerNoticeRequest } from '@/types/api'

const emptyForm: CustomerNoticeRequest = { title: '', content: '', displayStartAt: null, displayEndAt: null }
const pad = (value: number) => String(value).padStart(2, '0')
const toLocalInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const toInstant = (value: string) => value ? new Date(value).toISOString() : null

export function CustomerNoticeManagementPanel() {
  const notices = useAsync(() => adminCustomerNoticeApi.list(), [])
  const [form, setForm] = useState<CustomerNoticeRequest>(emptyForm)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [autoDateNoticeIds, setAutoDateNoticeIds] = useState<Set<number>>(() => new Set())

  const reset = () => {
    setForm(emptyForm)
    setStartAt('')
    setEndAt('')
    setEditingId(null)
  }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      notify('공지 제목과 내용을 입력해 주세요.', 'error')
      return
    }
    const payload: CustomerNoticeRequest = { title: form.title.trim(), content: form.content.trim(), displayStartAt: toInstant(startAt), displayEndAt: toInstant(endAt) }
    setSaving(true)
    try {
      if (editingId) await adminCustomerNoticeApi.update(editingId, payload)
      else await adminCustomerNoticeApi.create(payload)
      notices.reload()
      notify(editingId ? '고객센터 공지를 수정했습니다.' : '고객센터 공지를 저장했습니다.', 'success')
      reset()
    } catch (error) {
      notify(error instanceof Error ? error.message : '고객센터 공지 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit = (notice: CustomerNotice) => {
    setEditingId(notice.id)
    setForm({ title: splitNoticeTitle(notice.title).title, content: notice.content, displayStartAt: notice.displayStartAt, displayEndAt: notice.displayEndAt })
    setStartAt(toLocalInput(notice.displayStartAt))
    setEndAt(toLocalInput(notice.displayEndAt))
  }

  const changeActive = async (notice: CustomerNotice) => {
    const appendRegistrationTime = !notice.active && autoDateNoticeIds.has(notice.id)
    try {
      await adminCustomerNoticeApi.setActive(notice.id, !notice.active, appendRegistrationTime)
      setAutoDateNoticeIds(currentIds => {
        const nextIds = new Set(currentIds)
        nextIds.delete(notice.id)
        return nextIds
      })
      notices.reload()
      notify(notice.active ? '고객센터 공지를 비활성화했습니다.' : appendRegistrationTime ? '고객센터 공지를 활성화하고 등록 시간을 제목에 추가했습니다.' : '고객센터 공지를 활성화했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '공지 상태 변경에 실패했습니다.', 'error')
    }
  }

  const remove = async (noticeId: number) => {
    try {
      await adminCustomerNoticeApi.remove(noticeId)
      notices.reload()
      if (editingId === noticeId) reset()
      setDeletingId(null)
      notify('고객센터 공지를 삭제했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '공지 삭제에 실패했습니다.', 'error')
    }
  }

  return <section className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">CUSTOMER NOTICE</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">고객센터 공지 관리</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">활성화한 일반 공지는 고객센터 공지사항 탭에 표시됩니다. 점검 공지는 서비스 점검 모드에서 별도로 관리되며 같은 탭에 자동으로 함께 표시됩니다.</p><div className="mt-5 grid gap-4 lg:grid-cols-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-200 lg:col-span-2">공지 제목<input value={form.title} maxLength={120} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="예: 추석 연휴 배송 일정 안내" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200 lg:col-span-2">공지 내용<textarea value={form.content} maxLength={3000} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} placeholder="고객에게 안내할 내용을 입력해 주세요." rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none ring-brand-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200">공지 표시 시작 (선택)<input type="datetime-local" value={startAt} onChange={event => setStartAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200">공지 표시 종료 (선택)<input type="datetime-local" value={endAt} onChange={event => setEndAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={save} className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? '저장 중입니다' : editingId ? '수정 저장' : '새 공지 저장'}</button>{editingId ? <button type="button" disabled={saving} onClick={reset} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">편집 취소</button> : null}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div><p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">SAVED NOTICES</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">저장된 일반 공지</h3></div><div className="mt-5 space-y-3">{notices.loading ? <LoadingView label="고객센터 공지를 불러오는 중입니다" /> : notices.error ? <ErrorView error={notices.error} onRetry={notices.reload} /> : notices.data?.length ? notices.data.map(notice => <article key={notice.id} className={`rounded-2xl border p-4 ${notice.active ? 'border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-black text-slate-900 dark:text-white">{splitNoticeTitle(notice.title).title}</h4>{splitNoticeTitle(notice.title).registrationTime ? <span className="rounded-md border border-slate-300/70 bg-slate-500/10 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-500/40 dark:bg-slate-300/10 dark:text-slate-300">등록 {splitNoticeTitle(notice.title).registrationTime}</span> : null}<span className={`rounded-full px-2 py-1 text-xs font-black ${notice.active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{notice.active ? '활성' : '비활성'}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p></div><div className="flex flex-wrap items-center gap-2"><label className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-black ${notice.active ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500' : 'cursor-pointer border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200'}`}><input type="checkbox" checked={autoDateNoticeIds.has(notice.id)} disabled={notice.active} onChange={event => setAutoDateNoticeIds(currentIds => { const nextIds = new Set(currentIds); if (event.target.checked) nextIds.add(notice.id); else nextIds.delete(notice.id); return nextIds })} className="h-4 w-4 accent-violet-600" />공지 날짜 자동 출력</label><button type="button" onClick={() => changeActive(notice)} className="min-h-11 rounded-xl border border-brand-300 bg-white px-3 text-xs font-black text-brand-700 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-200">{notice.active ? '비활성화' : '활성화'}</button><button type="button" onClick={() => edit(notice)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">수정</button>{deletingId === notice.id ? <><button type="button" onClick={() => remove(notice.id)} className="min-h-11 rounded-xl bg-rose-600 px-3 text-xs font-black text-white">삭제 확정</button><button type="button" onClick={() => setDeletingId(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">취소</button></> : <button type="button" onClick={() => setDeletingId(notice.id)} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">삭제</button>}</div></div></article>) : <p className="rounded-xl border border-dashed border-slate-300 py-9 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">저장된 일반 공지가 없습니다.</p>}</div></section></section>
}
