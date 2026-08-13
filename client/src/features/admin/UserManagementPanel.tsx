import { useState } from 'react'
import { adminUserApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminUser } from '@/types/api'

export function UserManagementPanel() {
  const users = useAsync<AdminUser[]>(() => adminUserApi.list(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const toggleSeller = async (user: AdminUser) => {
    if (user.role === 'ADMIN') return
    setBusyId(user.id)
    setMessage(null)
    try {
      const next = user.role === 'SELLER' ? 'CONSUMER' : 'SELLER'
      await adminUserApi.changeRole(user.id, next)
      setMessage(`${user.name} 계정을 ${next === 'SELLER' ? '판매자' : '일반 회원'}로 변경했습니다.`)
      await users.reload()
    } finally {
      setBusyId(null)
    }
  }

  if (users.loading && !users.data) return <LoadingView label="회원 계정을 불러오는 중입니다" />
  if (users.error) return <ErrorView error={users.error} onRetry={users.reload} />
  const list = users.data ?? []
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5"><p className="text-xs font-black text-brand-600">MEMBER ROLE CONTROL</p><h2 className="mt-1 text-xl font-black text-slate-900">회원 · 판매자 계정 관리</h2><p className="mt-2 text-sm text-slate-500">판매자로 전환하면 해당 회원의 마이철수에 응찰·주문 처리·운영 설정 메뉴가 활성화됩니다.</p></div>{message && <p className="mx-5 mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}<div className="overflow-x-auto"><table className="w-full min-w-170 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">회원</th><th className="px-5 py-3">이메일</th><th className="px-5 py-3">현재 역할</th><th className="px-5 py-3 text-right">판매자 워크플로우</th></tr></thead><tbody className="divide-y divide-slate-100">{list.map(user => <tr key={user.id}><td className="px-5 py-4 font-black text-slate-900">{user.name}</td><td className="px-5 py-4 text-slate-600">{user.email}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${user.role === 'SELLER' ? 'bg-violet-50 text-violet-700' : user.role === 'ADMIN' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'}`}>{user.role === 'SELLER' ? '판매자' : user.role === 'ADMIN' ? '관리자' : '일반 회원'}</span></td><td className="px-5 py-4 text-right">{user.role === 'ADMIN' ? <span className="text-xs font-bold text-slate-400">관리자 보호</span> : <button type="button" disabled={busyId === user.id} onClick={() => void toggleSeller(user)} className={`rounded-xl px-4 py-2 text-xs font-black ${user.role === 'SELLER' ? 'border border-slate-300 bg-white text-slate-700' : 'bg-violet-600 text-white'} disabled:opacity-50`}>{busyId === user.id ? '변경 중' : user.role === 'SELLER' ? '일반 회원으로 전환' : '판매자 계정 활성화'}</button>}</td></tr>)}</tbody></table></div></section>
}
