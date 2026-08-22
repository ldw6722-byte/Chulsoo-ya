import { Link, useRouteError } from 'react-router-dom'

/** 라우트 렌더링 예외의 최후 안전망. API 오류 화면과 달리 예상하지 못한 화면 예외를 복구한다. */
export function RouteErrorPage() {
  const error = useRouteError()
  const detail = error instanceof Error ? error.message : ''

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-16">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-10" role="alert">
        <p className="text-xs font-black tracking-[0.16em] text-brand-600 dark:text-brand-300">SERVICE RECOVERY</p>
        <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">화면을 준비하지 못했습니다</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">잠시 후 다시 시도하거나 메인 화면으로 이동해 주세요. 서비스 이용 기록과 주문 정보는 변경되지 않습니다.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="guide-cta-secondary">새로고침</button>
          <Link to="/" className="guide-cta-primary">메인으로 이동</Link>
        </div>
        {import.meta.env.DEV && detail ? <p className="mt-6 break-all rounded-xl bg-slate-100 px-3 py-2 text-left text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">개발 정보: {detail}</p> : null}
      </section>
    </main>
  )
}
