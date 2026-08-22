import { useEffect, useState } from 'react'
import { popupNoticeApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'

const dismissKey = (noticeId: number) => `chulsooya:popup-ad-dismissed:${noticeId}`

function isDismissedForDay(noticeId: number) {
  const raw = localStorage.getItem(dismissKey(noticeId))
  if (!raw) return false
  const expiresAt = Number(raw)
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    localStorage.removeItem(dismissKey(noticeId))
    return false
  }
  return true
}

function contentParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

export function PopupAdvertisingPopup() {
  const popup = useAsync(() => popupNoticeApi.active(), [], { pollMs: 30_000 })
  const [visible, setVisible] = useState(false)
  const notice = popup.data
  const noticeId = notice?.id

  useEffect(() => {
    if (!noticeId) {
      setVisible(false)
      return
    }
    setVisible(!isDismissedForDay(noticeId))
  }, [noticeId])

  if (!notice || !visible) return null

  const dismissForDay = () => {
    localStorage.setItem(dismissKey(notice.id), String(Date.now() + 24 * 60 * 60 * 1000))
    setVisible(false)
  }
  const paragraphs = contentParagraphs(notice.content)

  return <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center p-4" aria-live="polite"><section className="pointer-events-auto w-full max-w-xl popup-attention-frame rounded-3xl p-[5px] shadow-2xl ring-4 ring-lime-300/30 dark:ring-lime-300/20" role="region" aria-labelledby="popup-advertising-title"><div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[calc(1.5rem-5px)] bg-white dark:bg-slate-900"><div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-600 via-lime-400 to-brand-500 dark:from-emerald-400 dark:via-lime-300 dark:to-brand-400" /><header className="shrink-0 border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-violet-50 px-6 py-5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30 sm:px-7"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-black tracking-[0.12em] text-brand-700 dark:text-brand-300">주요 안내</p><h2 id="popup-advertising-title" className="mt-2 border-l-4 border-brand-500 pl-3 text-xl font-black leading-snug tracking-[-0.02em] text-slate-950 dark:text-white sm:text-2xl">{notice.title}</h2></div><button type="button" onClick={() => setVisible(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white" aria-label="팝업 닫기"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div></header><div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-stone-50 via-slate-50 to-stone-100/70 px-6 py-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:px-7"><div className="space-y-4">{paragraphs.map((paragraph, index) => <p key={`${notice.id}-${index}`} className="whitespace-pre-line break-keep text-[15px] font-medium leading-7 text-slate-800 dark:text-slate-100">{paragraph}</p>)}</div></div><footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-900 sm:px-7"><div className="flex items-center justify-between gap-3"><label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><input type="checkbox" onChange={event => { if (event.target.checked) dismissForDay() }} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />오늘 하루 보지 않기</label><button type="button" onClick={() => setVisible(false)} className="popup-attention-button min-h-11 rounded-xl px-5 text-sm font-black text-white shadow-sm">확인</button></div></footer></div></section></div>
}
