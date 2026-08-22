import { Link } from 'react-router-dom'
import { maintenanceApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'

const formatTime = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : null

export function MaintenancePreparingBanner() {
  const status = useAsync(() => maintenanceApi.status(), [], { pollMs: 30_000 })
  if (status.data?.phase !== 'PREPARING') return null
  const start = formatTime(status.data.plannedStartAt)
  const end = formatTime(status.data.plannedEndAt)

  return <div className="border-b border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/45 dark:text-amber-100"><Link to="/support" aria-label="고객센터 공지사항에서 서비스 점검 안내 보기" className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs transition hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-inset dark:hover:bg-amber-900/30 sm:text-sm"><span className="inline-flex items-center gap-1.5 font-black"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.7 19h14.6c1.2 0 2-1.3 1.4-2.4L13.4 4c-.6-1.1-2.2-1.1-2.8 0L3.3 16.6C2.7 17.7 3.5 19 4.7 19Z" /></svg>서비스 점검 예정</span>{start ? <span className="font-bold">· 시작 예정 {start}</span> : null}{end ? <span className="font-bold">· 종료 예정 {end}</span> : null}<span className="font-bold underline underline-offset-2">공지 보기</span></Link></div>
}
