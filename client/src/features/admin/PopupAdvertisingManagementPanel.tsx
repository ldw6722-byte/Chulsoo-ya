import { useState } from 'react'
import { popupNoticeApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import type { PopupNotice, PopupNoticeRequest } from '@/types/api'

const emptyForm: PopupNoticeRequest = {
  title: '',
  content: '',
  displayStartAt: null,
  displayEndAt: null,
}

const toLocalInput = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : ''
const toInstant = (value: string) => value ? new Date(value).toISOString() : null

export function PopupAdvertisingManagementPanel() {
  const notices = useAsync(() => popupNoticeApi.list(), [])
  const [form, setForm] = useState<PopupNoticeRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStartAt('')
    setEndAt('')
  }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      notify('팝업 제목과 내용을 입력해 주세요.', 'error')
      return
    }

    const payload: PopupNoticeRequest = {
      title: form.title.trim(),
      content: form.content.trim(),
      displayStartAt: toInstant(startAt),
      displayEndAt: toInstant(endAt),
    }

    setSaving(true)
    try {
      if (editingId) await popupNoticeApi.update(editingId, payload)
      else await popupNoticeApi.create(payload)
      notices.reload()
      notify(editingId ? '메인 팝업을 수정했습니다.' : '메인 팝업을 저장했습니다.', 'success')
      resetForm()
    } catch (error) {
      notify(error instanceof Error ? error.message : '팝업 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const edit = (notice: PopupNotice) => {
    setEditingId(notice.id)
    setForm({
      title: notice.title,
      content: notice.content,
      displayStartAt: notice.displayStartAt,
      displayEndAt: notice.displayEndAt,
    })
    setStartAt(toLocalInput(notice.displayStartAt))
    setEndAt(toLocalInput(notice.displayEndAt))
  }

  const changeActive = async (notice: PopupNotice) => {
    try {
      await popupNoticeApi.setActive(notice.id, !notice.active)
      notices.reload()
      notify(notice.active ? '메인 팝업을 비활성화했습니다.' : '메인 팝업을 활성화했습니다. 기존 활성 팝업은 자동으로 비활성화됩니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '팝업 상태 변경에 실패했습니다.', 'error')
    }
  }

  const remove = async (noticeId: number) => {
    try {
      await popupNoticeApi.remove(noticeId)
      notices.reload()
      if (editingId === noticeId) resetForm()
      setDeletingId(null)
      notify('메인 팝업을 삭제했습니다.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : '팝업 삭제에 실패했습니다.', 'error')
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">POPUP ADVERTISING</p>
        <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">메인 팝업 광고 관리</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">광고·안내 등 재사용 가능한 메인 팝업을 관리합니다. 활성 팝업은 한 건만 유지되며, 홈 화면에서만 표시됩니다. 서비스 점검 상단 공지와는 별도로 운영됩니다.</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 lg:col-span-2">팝업 제목
            <input value={form.title} maxLength={120} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="예: 철수야 여름 특별 혜택" className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 lg:col-span-2">팝업 내용
            <textarea value={form.content} maxLength={2000} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} placeholder="메인 화면에서 안내할 내용을 입력해 주세요." rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none ring-brand-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">표시 시작 (선택)
            <input type="datetime-local" value={startAt} onChange={event => setStartAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">표시 종료 (선택)
            <input type="datetime-local" value={endAt} onChange={event => setEndAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={save} className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? '저장 중입니다' : editingId ? '수정 저장' : '새 팝업 저장'}</button>
          {editingId ? <button type="button" disabled={saving} onClick={resetForm} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">편집 취소</button> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-wide text-brand-600 dark:text-brand-300">SAVED POPUPS</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">저장된 팝업</h3></div><p className="text-sm text-slate-500 dark:text-slate-400">활성화하면 기존 활성 팝업은 자동으로 비활성화됩니다.</p></div>
        <div className="mt-5 space-y-3">
          {notices.loading ? <LoadingView label="메인 팝업을 불러오는 중입니다" /> : notices.error ? <ErrorView error={notices.error} onRetry={notices.reload} /> : notices.data?.length ? notices.data.map(notice => (
            <article key={notice.id} className={`rounded-2xl border p-4 ${notice.active ? 'border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-black text-slate-900 dark:text-white">{notice.title}</h4><span className={`rounded-full px-2 py-1 text-xs font-black ${notice.active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{notice.active ? '활성' : '비활성'}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p><p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">표시 기간: {notice.displayStartAt ? new Date(notice.displayStartAt).toLocaleString('ko-KR') : '즉시'} ~ {notice.displayEndAt ? new Date(notice.displayEndAt).toLocaleString('ko-KR') : '종료일 없음'}</p></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => changeActive(notice)} className="min-h-11 rounded-xl border border-brand-300 bg-white px-3 text-xs font-black text-brand-700 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-200 dark:hover:bg-brand-950/30">{notice.active ? '비활성화' : '활성화'}</button><button type="button" onClick={() => edit(notice)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700">수정</button>{deletingId === notice.id ? <><button type="button" onClick={() => remove(notice.id)} className="min-h-11 rounded-xl bg-rose-600 px-3 text-xs font-black text-white transition hover:bg-rose-700">삭제 확정</button><button type="button" onClick={() => setDeletingId(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">취소</button></> : <button type="button" onClick={() => setDeletingId(notice.id)} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50">삭제</button>}</div>
              </div>
            </article>
          )) : <p className="rounded-xl border border-dashed border-slate-300 py-9 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">저장된 메인 팝업이 없습니다.</p>}
        </div>
      </section>
    </section>
  )
}
