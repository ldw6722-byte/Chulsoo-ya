import { adminApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminSecurityAlertItem, AdminSecurityAuditItem, AdminSecurityAuditResponse } from '@/types/api'

const dateTime = (value: string) => new Date(value).toLocaleString('ko-KR', { hour12: false })

const DENIAL: Record<AdminSecurityAuditItem['denialType'], { label: string; tone: string }> = {
  UNAUTHENTICATED: { label: '로그인 없이 접근', tone: 'bg-amber-50 text-amber-800' },
  FORBIDDEN_ROLE: { label: '관리자 역할 없음', tone: 'bg-rose-50 text-rose-700' },
  FORBIDDEN_FEATURE: { label: '세부 권한 없음', tone: 'bg-violet-50 text-violet-700' },
}

const ALERT: Record<AdminSecurityAlertItem['alertType'], string> = {
  RAPID_REPEAT: '단시간 반복',
  DISTRIBUTED_IP: '분산 IP 접근',
  PATH_SCAN: '관리 경로 탐색',
}

const labelForDenial = (type: string) => DENIAL[type]?.label ?? '권한 거부'
const toneForDenial = (type: string) => DENIAL[type]?.tone ?? 'bg-slate-100 text-slate-700'
const labelForAlert = (type: string) => ALERT[type] ?? '접근 경보'

export function SecurityAuditPanel() {
  const audit = useAsync<AdminSecurityAuditResponse>(() => adminApi.securityAudits(), [])
  const data = audit.data

  if (audit.loading && !data) return <LoadingView label="보안 감사 이력을 불러오는 중입니다" />
  if (audit.error) return <ErrorView error={audit.error} onRetry={audit.reload} />
  if (!data) return null

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wider text-rose-600">SECURITY AUDIT</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">관리자 접근 감사 · 경보</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">관리자 권한이 없는 접근을 기록하고, 반복·분산·관리 경로 탐색 패턴이 감지되면 모든 관리자 알림함에 경보를 남깁니다.</p>
        </div>
        <button type="button" onClick={audit.reload} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50">새로고침</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="text-xs font-bold text-rose-700">최근 경보</p><p className="mt-1 text-2xl font-black text-rose-900">{data.alerts.length}</p><p className="mt-1 text-xs text-rose-700">최근 20건 기준</p></article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold text-slate-600">접근 거부 이력</p><p className="mt-1 text-2xl font-black text-slate-900">{data.logs.length}</p><p className="mt-1 text-xs text-slate-500">최근 100건 기준</p></article>
        <article className="rounded-xl border border-brand-100 bg-brand-50 p-4"><p className="text-xs font-bold text-brand-700">외부 이메일 발송</p><p className="mt-1 text-sm font-black text-brand-900">연동 대기</p><p className="mt-1 text-xs text-brand-700">현재는 관리자 알림함으로 즉시 전파됩니다.</p></article>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4"><p className="text-sm font-black text-slate-900">반복 패턴 경보</p><p className="mt-1 text-xs text-slate-500">동일 대상의 같은 경보는 30분 동안 한 번만 전파됩니다.</p></div>
      <div className="divide-y divide-slate-100">
        {data.alerts.map(alert => <article key={alert.id} className="flex flex-wrap items-start justify-between gap-3 p-5"><div className="min-w-0"><span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">{labelForAlert(alert.alertType)}</span><p className="mt-3 text-sm font-bold leading-6 text-slate-900">{alert.summary}</p><p className="mt-2 text-xs text-slate-500">대상 {alert.targetKey} · 경보 {dateTime(alert.alertedAt)}</p></div></article>)}
        {!data.alerts.length ? <p className="p-10 text-center text-sm text-slate-500">아직 반복 접근 경보가 없습니다.</p> : null}
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="text-sm font-black text-slate-900">관리자 접근 거부 이력</p><p className="mt-1 text-xs text-slate-500">권한 없음 요청만 표시됩니다. 정상 관리자 작업은 기록하지 않습니다.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{data.logs.length}건</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500"><tr><th className="px-5 py-3">거부 유형</th><th className="px-5 py-3">계정</th><th className="px-5 py-3">IP</th><th className="px-5 py-3">요청 경로</th><th className="px-5 py-3">접속 환경</th><th className="px-5 py-3 text-right">시각</th></tr></thead><tbody className="divide-y divide-slate-100">{data.logs.map(log => <tr key={log.id} className="align-top transition hover:bg-slate-50"><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneForDenial(log.denialType)}`}>{labelForDenial(log.denialType)}</span></td><td className="px-5 py-4 font-bold text-slate-900">{log.email ?? '비로그인'}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{log.ipAddress}</td><td className="px-5 py-4"><p className="font-mono text-xs text-slate-800">{log.httpMethod} {log.requestPath}</p></td><td className="max-w-xs px-5 py-4 text-xs leading-5 text-slate-500">{log.userAgent ?? '정보 없음'}</td><td className="px-5 py-4 text-right text-xs text-slate-500">{dateTime(log.createdAt)}</td></tr>)}</tbody></table></div>
      {!data.logs.length ? <p className="p-10 text-center text-sm text-slate-500">기록된 관리자 접근 거부 이력이 없습니다.</p> : null}
    </section>
  </div>
}
