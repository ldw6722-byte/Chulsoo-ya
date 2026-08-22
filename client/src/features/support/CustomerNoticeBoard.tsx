import { supportApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { splitNoticeTitle } from '@/lib/noticeTitle'

const period = (start: string | null, end: string | null) => {
  const format = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  if (!start && !end) return null
  return `${start ? format(start) : '즉시'} ~ ${end ? format(end) : '별도 안내 시까지'}`
}

export function CustomerNoticeBoard() {
  const notices = useAsync(() => supportApi.notices(), [])

  if (notices.loading && !notices.data) return <LoadingView label="공지사항을 불러오는 중입니다" />
  if (notices.error) return <ErrorView error={notices.error} onRetry={notices.reload} />

  return <section><div className="mb-5"><p className="text-xs font-black tracking-wider text-brand-600 dark:text-brand-300">NOTICE</p><h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">공지사항</h2></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">{notices.data?.length ? notices.data.map(notice => <details key={`${notice.source}-${notice.id}`} className="group border-b border-slate-100 last:border-b-0 dark:border-slate-800"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-slate-900 dark:text-white"><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${notice.source === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : 'bg-indigo-100 text-indigo-800 dark:border dark:border-indigo-700/80 dark:bg-indigo-950 dark:text-indigo-100'}`}>{notice.source === 'MAINTENANCE' ? '서비스 점검' : '일반 공지'}</span><span className="min-w-0 flex-1 font-black">{splitNoticeTitle(notice.title).title}</span>{splitNoticeTitle(notice.title).registrationTime ? <span className="shrink-0 rounded-md border border-slate-300/70 bg-slate-500/10 px-2 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-500/40 dark:bg-slate-300/10 dark:text-slate-300">등록 {splitNoticeTitle(notice.title).registrationTime}</span> : null}<span className="text-slate-400 transition group-open:rotate-180">⌄</span></summary><div className="border-t border-slate-100 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-800/50"><p className="whitespace-pre-line break-keep text-sm leading-7 text-slate-700 dark:text-slate-200">{notice.content}</p>{period(notice.displayStartAt, notice.displayEndAt) ? <p className="mt-4 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">안내 기간: {period(notice.displayStartAt, notice.displayEndAt)}</p> : null}</div></details>) : <p className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">현재 안내할 공지사항이 없습니다.</p>}</div></section>
}
