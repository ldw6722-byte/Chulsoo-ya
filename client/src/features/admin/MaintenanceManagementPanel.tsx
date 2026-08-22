import { useEffect, useState } from 'react'
import { adminApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { notify } from '@/lib/notify'
import { splitNoticeTitle } from '@/lib/noticeTitle'
import type { MaintenanceNotice, MaintenancePhase } from '@/types/api'

const phaseLabel: Record<MaintenancePhase, string> = { NORMAL: '정상 운영', PREPARING: '점검 준비', MAINTENANCE: '전면 점검' }
const pad = (value: number) => String(value).padStart(2, '0')
const toLocalInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const toInstant = (value: string) => value ? new Date(value).toISOString() : null

type NoticeForm = { title: string; content: string; popupEnabled: boolean; displayStartAt: string; displayEndAt: string }
const emptyNotice: NoticeForm = { title: '', content: '', popupEnabled: false, displayStartAt: '', displayEndAt: '' }

export function MaintenanceManagementPanel() {
  const status = useAsync(() => adminApi.maintenanceStatus(), [])
  const notices = useAsync(() => adminApi.maintenanceNotices(), [])
  const [plannedStartAt, setPlannedStartAt] = useState('')
  const [plannedEndAt, setPlannedEndAt] = useState('')
  const [confirmPhase, setConfirmPhase] = useState<MaintenancePhase | null>(null)
  const [savingPhase, setSavingPhase] = useState(false)
  const [noticeForm, setNoticeForm] = useState<NoticeForm>(emptyNotice)
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null)
  const [savingNotice, setSavingNotice] = useState(false)
  const [deletingNoticeId, setDeletingNoticeId] = useState<number | null>(null)
  const [autoDateNoticeIds, setAutoDateNoticeIds] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    if (!status.data) return
    setPlannedStartAt(toLocalInput(status.data.plannedStartAt))
    setPlannedEndAt(toLocalInput(status.data.plannedEndAt))
  }, [status.data?.plannedStartAt, status.data?.plannedEndAt])

  if (status.loading && !status.data) return <LoadingView label="점검 모드 상태를 불러오는 중입니다" />
  if (status.error) return <ErrorView error={status.error} onRetry={status.reload} />
  if (!status.data) return null

  const current = status.data
  const applyPhase = async () => {
    if (!confirmPhase) return
    setSavingPhase(true)
    try {
      await adminApi.setMaintenanceMode(confirmPhase, toInstant(plannedStartAt), toInstant(plannedEndAt))
      status.reload()
      setConfirmPhase(null)
      notify(`점검 단계를 ${phaseLabel[confirmPhase]}로 변경했습니다.`, 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '점검 단계 변경에 실패했습니다.', 'error')
    } finally {
      setSavingPhase(false)
    }
  }

  const saveNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      notify('공지 제목과 내용을 입력해 주세요.', 'error')
      return
    }
    const payload = { title: noticeForm.title.trim(), content: noticeForm.content.trim(), popupEnabled: false, displayStartAt: toInstant(noticeForm.displayStartAt), displayEndAt: toInstant(noticeForm.displayEndAt) }
    setSavingNotice(true)
    try {
      if (editingNoticeId) await adminApi.updateMaintenanceNotice(editingNoticeId, payload)
      else await adminApi.createMaintenanceNotice(payload)
      notices.reload()
      status.reload()
      setEditingNoticeId(null)
      setNoticeForm(emptyNotice)
      notify(editingNoticeId ? '전체 공지를 수정했습니다.' : '전체 공지를 저장했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '전체 공지 저장에 실패했습니다.', 'error')
    } finally {
      setSavingNotice(false)
    }
  }

  const editNotice = (notice: MaintenanceNotice) => {
    setEditingNoticeId(notice.id)
    setNoticeForm({ title: notice.title, content: notice.content, popupEnabled: false, displayStartAt: toLocalInput(notice.displayStartAt), displayEndAt: toLocalInput(notice.displayEndAt) })
  }

  const setNoticeActive = async (notice: MaintenanceNotice) => {
    const appendRegistrationTime = !notice.active && autoDateNoticeIds.has(notice.id)
    try {
      await adminApi.setMaintenanceNoticeActive(notice.id, !notice.active, appendRegistrationTime)
      setAutoDateNoticeIds(currentIds => {
        const nextIds = new Set(currentIds)
        nextIds.delete(notice.id)
        return nextIds
      })
      notices.reload()
      status.reload()
      notify(notice.active ? '전체 공지를 비활성화했습니다.' : appendRegistrationTime ? '전체 공지를 활성화하고 등록 시간을 제목에 추가했습니다.' : '전체 공지를 활성화했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '공지 상태 변경에 실패했습니다.', 'error')
    }
  }

  const deleteNotice = async (noticeId: number) => {
    try {
      await adminApi.deleteMaintenanceNotice(noticeId)
      notices.reload()
      status.reload()
      setDeletingNoticeId(null)
      if (editingNoticeId === noticeId) { setEditingNoticeId(null); setNoticeForm(emptyNotice) }
      notify('전체 공지를 삭제했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '공지 삭제에 실패했습니다.', 'error')
    }
  }

  return (
    <section className="space-y-6">
      <section className="event-asset-studio rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">SERVICE CONTROL</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">전면 점검 모드</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">점검 준비 단계에서는 상단 점검 공지만 표시합니다. 전면 점검 단계에서만 일반 서비스와 일반 API가 차단됩니다.</p></div><span className={`rounded-full px-3 py-1.5 text-sm font-black ${current.phase === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : current.phase === 'PREPARING' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'}`}>{phaseLabel[current.phase]}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-200">점검 시작 예정<input type="datetime-local" value={plannedStartAt} onChange={event => setPlannedStartAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200">점검 종료 예정<input type="datetime-local" value={plannedEndAt} onChange={event => setPlannedEndAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label></div>
        <div className="mt-5 flex flex-wrap gap-2">{(['NORMAL', 'PREPARING', 'MAINTENANCE'] as MaintenancePhase[]).map(phase => <button key={phase} type="button" onClick={() => setConfirmPhase(phase)} className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${current.phase === phase ? 'bg-brand-600 text-white' : phase === 'MAINTENANCE' ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{phaseLabel[phase]}</button>)}</div>
        {confirmPhase ? <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-900/60 dark:bg-brand-950/30"><p className="font-black text-slate-900 dark:text-white">점검 단계를 {phaseLabel[confirmPhase]}로 변경할까요?</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{confirmPhase === 'MAINTENANCE' ? '일반 사용자 화면과 일반 API가 즉시 차단됩니다.' : confirmPhase === 'PREPARING' ? '서비스는 유지되고 상단 점검 안내만 표시됩니다.' : '전면 점검 차단을 해제하고 상단 점검 안내도 종료해 일반 서비스가 정상 운영으로 돌아갑니다.'}</p><div className="mt-4 flex gap-2"><button type="button" disabled={savingPhase} onClick={applyPhase} className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-60">{savingPhase ? '반영 중입니다' : '변경 확정'}</button><button type="button" disabled={savingPhase} onClick={() => setConfirmPhase(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">취소</button></div></div> : null}
      </section>

      <section className="event-asset-studio rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div><p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">GLOBAL NOTICE</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">전체 공지 관리</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">활성화한 공지 한 건은 고객센터 공지사항에 표시됩니다. 점검 준비 단계에서는 같은 공지의 예정 시간 안내가 사용자 화면 상단에도 표시됩니다. 저장된 공지는 다음 점검에도 다시 사용할 수 있습니다.</p></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-200 lg:col-span-2">공지 제목<input value={noticeForm.title} maxLength={120} onChange={event => setNoticeForm(currentForm => ({ ...currentForm, title: event.target.value }))} placeholder="예: 8월 정기 점검 안내" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="lg:col-span-2 text-sm font-bold text-slate-700 dark:text-slate-200">공지 내용<textarea value={noticeForm.content} onChange={event => setNoticeForm(currentForm => ({ ...currentForm, content: event.target.value }))} placeholder="점검 사유와 예정 시간을 안내해 주세요." rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200">공지 표시 시작<input type="datetime-local" value={noticeForm.displayStartAt} onChange={event => setNoticeForm(currentForm => ({ ...currentForm, displayStartAt: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label><label className="text-sm font-bold text-slate-700 dark:text-slate-200">공지 표시 종료<input type="datetime-local" value={noticeForm.displayEndAt} onChange={event => setNoticeForm(currentForm => ({ ...currentForm, displayEndAt: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label></div>
        <div className="mt-4 flex gap-2"><button type="button" disabled={savingNotice} onClick={saveNotice} className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-60">{savingNotice ? '저장 중입니다' : editingNoticeId ? '공지 수정 저장' : '새 공지 저장'}</button>{editingNoticeId ? <button type="button" onClick={() => { setEditingNoticeId(null); setNoticeForm(emptyNotice) }} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">편집 취소</button> : null}</div>
        <div className="mt-6 space-y-3">{notices.loading ? <LoadingView label="전체 공지를 불러오는 중입니다" /> : notices.error ? <ErrorView error={notices.error} onRetry={notices.reload} /> : notices.data?.length ? notices.data.map(notice => <article key={notice.id} className={`rounded-2xl border p-4 ${notice.active ? 'border-brand-300 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900 dark:text-white">{splitNoticeTitle(notice.title).title}</h3>{splitNoticeTitle(notice.title).registrationTime ? <span className="rounded-md border border-slate-300/70 bg-slate-500/10 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-500/40 dark:bg-slate-300/10 dark:text-slate-300">등록 {splitNoticeTitle(notice.title).registrationTime}</span> : null}<span className={`rounded-full px-2 py-0.5 text-xs font-black ${notice.active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{notice.active ? '전체 공지 활성' : '비활성'} </span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p></div><div className="flex flex-wrap items-center gap-2"><label className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black ${notice.active ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500' : 'cursor-pointer border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200'}`}><input type="checkbox" checked={autoDateNoticeIds.has(notice.id)} disabled={notice.active} onChange={event => setAutoDateNoticeIds(currentIds => { const nextIds = new Set(currentIds); if (event.target.checked) nextIds.add(notice.id); else nextIds.delete(notice.id); return nextIds })} className="h-4 w-4 accent-violet-600" />공지 날짜 자동 출력</label><button type="button" onClick={() => setNoticeActive(notice)} className="min-h-10 rounded-lg border border-brand-300 bg-white px-3 text-xs font-black text-brand-700 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-200">{notice.active ? '비활성화' : '활성화'}</button><button type="button" onClick={() => editNotice(notice)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">수정</button>{deletingNoticeId === notice.id ? <><button type="button" onClick={() => deleteNotice(notice.id)} className="min-h-10 rounded-lg bg-rose-600 px-3 text-xs font-black text-white">삭제 확정</button><button type="button" onClick={() => setDeletingNoticeId(null)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">취소</button></> : <button type="button" onClick={() => setDeletingNoticeId(notice.id)} className="min-h-10 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">삭제</button>}</div></div></article>) : <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">저장된 전체 공지가 없습니다.</p>}</div>
      </section>
    </section>
  )
}
