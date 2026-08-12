import { Link } from 'react-router-dom'
import { userApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { ErrorView, LoadingView } from '@/components/StateViews'
import type { DevUser } from '@/types/api'

const ROLE_LABEL: Record<DevUser['role'], string> = { CONSUMER: '소비자', SELLER: '판매자', ADMIN: '관리자' }
const ROLE_TONE: Record<DevUser['role'], string> = { CONSUMER: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', SELLER: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', ADMIN: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' }

export function AdminOverviewPage() {
  const users = useAsync<DevUser[]>(() => userApi.list(), [])
  if (users.loading && !users.data) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="운영 데이터를 불러오는 중입니다" /></div>
  if (users.error) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorView error={users.error} onRetry={users.reload} /></div>

  const items = users.data ?? []
  const count = (role: DevUser['role']) => items.filter((user) => user.role === role).length
  const statCards = [
    ['👥', '전체 사용자', items.length, '등록된 철수야 계정'],
    ['🏪', '판매자 매장', count('SELLER'), '주문 제안 수신 가능'],
    ['🛒', '소비자', count('CONSUMER'), '주문 매칭 이용자'],
    ['🛡️', '운영 관리자', count('ADMIN'), '운영 권한 계정'],
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-800 to-brand-900 px-6 py-8 text-white shadow-xl md:px-9"><p className="text-sm font-bold text-brand-200">CHULSOO-YA ADMIN</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">운영 대시보드</h1><p className="mt-2 text-sm text-slate-300">플랫폼 계정과 주문 매칭 운영 상태를 한눈에 확인하세요.</p></div><Link to="/" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/20">소비자 화면 보기 →</Link></div></section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{statCards.map(([icon, label, value, description]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-950/50">{icon}</span><span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span></div><p className="mt-5 text-sm font-black text-slate-900 dark:text-white">{label}</p><p className="mt-1 text-xs text-slate-500">{description}</p></article>)}</section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['🔎', '카탈로그 점검', '상품·카테고리 확인', '/catalog'], ['📦', '주문 현황', '소비자 주문 내역', '/orders'], ['🏪', '판매자 운영', '제안·슬롯 운영', '/seller'], ['⚙️', '계정 관리', '등록 계정과 권한', '/admin'],
      ].map(([icon, title, desc, to]) => <Link key={title} to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl">{icon}</span><p className="mt-4 text-sm font-black text-slate-900 group-hover:text-brand-600 dark:text-white">{title} <span className="float-right">→</span></p><p className="mt-1 text-xs text-slate-500">{desc}</p></Link>)}</section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800"><div><p className="text-sm font-bold text-brand-600">USER MANAGEMENT</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">등록 계정</h2></div><button type="button" onClick={users.reload} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">새로고침</button></div><div className="overflow-x-auto"><table className="w-full min-w-150 text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-500 dark:bg-slate-800/60"><tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">이름</th><th className="px-5 py-3">이메일</th><th className="px-5 py-3">역할</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((user) => <tr key={user.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"><td className="px-5 py-4 font-mono text-xs text-slate-500">#{user.id}</td><td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{user.name}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.email}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${ROLE_TONE[user.role]}`}>{ROLE_LABEL[user.role]}</span></td></tr>)}</tbody></table></div></section>
    </div>
  )
}
