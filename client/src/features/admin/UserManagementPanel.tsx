import { Fragment, useMemo, useState } from 'react'
import { ApiError } from '@/api/client'
import { adminSellerDeactivationApi, adminUserApi } from '@/api/endpoints'
import { useAuth } from '@/app/useAuth'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import type { AdminUser, FeaturePermissionView, SellerDeactivationRequest, UserRole } from '@/types/api'

const roleLabel: Record<UserRole, string> = { CONSUMER: '일반 회원', SELLER: '판매자', ADMIN: '관리자' }
const groupLabel: Record<FeaturePermissionView['group'], string> = {
  CONSUMER: '일반사용자 기능', SELLER: '판매자 기능', ADMIN: '일반관리자 기능',
}

function PermissionPanel({ user, highestAdministrator, onChanged, onAdministratorChanged }: {
  user: AdminUser
  highestAdministrator: boolean
  onChanged: () => void
  onAdministratorChanged: (user: AdminUser) => void
}) {
  const permissions = useAsync<FeaturePermissionView[]>(() => adminUserApi.permissions(user.id), [user.id])
  const [changing, setChanging] = useState<string | null>(null)

  const toggle = async (permission: FeaturePermissionView) => {
    setChanging(permission.code)
    try {
      await adminUserApi.changePermission(user.id, permission.code, !permission.enabled)
      await permissions.reload()
      onChanged()
      notify(`${permission.label} 권한을 ${permission.enabled ? '해제' : '부여'}했습니다.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '권한을 변경하지 못했습니다.', 'error')
    } finally { setChanging(null) }
  }

  const changeAdministrator = async (enabled: boolean) => {
    const action = enabled ? '일반관리자로 지정' : '관리자 권한을 해지'
    const description = enabled
      ? `${user.name}님에게 일반관리자 권한을 부여하시겠습니까?`
      : `${user.name}님의 일반관리자 역할과 부여된 관리자 기능을 모두 회수하시겠습니까?`
    if (!window.confirm(description)) return
    setChanging('administrator')
    try {
      const changed = await adminUserApi.changeAdministrator(user.id, enabled)
      onAdministratorChanged(changed)
      onChanged()
      notify(`${user.name}님을 ${enabled ? '일반관리자로 지정' : '일반 회원으로 전환'}했습니다.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : `${action}하지 못했습니다.`, 'error')
    } finally { setChanging(null) }
  }

  if (permissions.loading && !permissions.data) {
    return <tr><td colSpan={5} className="bg-brand-50/30 px-5 py-5 text-sm text-slate-500">권한을 불러오는 중입니다.</td></tr>
  }
  if (permissions.error) {
    return <tr><td colSpan={5} className="bg-brand-50/30 px-5 py-5 text-sm text-rose-600">이 계정의 권한을 조회할 수 없습니다.</td></tr>
  }

  const groups = (permissions.data ?? []).reduce<Record<string, FeaturePermissionView[]>>(
    (result, permission) => ({ ...result, [permission.group]: [...(result[permission.group] ?? []), permission] }), {},
  )
  const canGrantAdministrator = highestAdministrator && user.role === 'CONSUMER'
  const canRevokeAdministrator = highestAdministrator && user.role === 'ADMIN' && user.adminLevel === 'STANDARD'

  return <tr><td colSpan={5} className="bg-brand-50/30 p-5"><section className="rounded-2xl border border-brand-200 bg-white p-4 dark:border-brand-900 dark:bg-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black tracking-wider text-brand-600">FEATURE PERMISSIONS</p>
        <h3 className="mt-1 font-black text-slate-900 dark:text-white">{user.name} · 기능 권한 설정</h3>
        <p className="mt-1 text-xs text-slate-500">최고관리자는 일반관리자 지정·해지와 모든 권한을 관리합니다. 일반관리자는 서버가 허용한 일반사용자·판매자 범위만 변경할 수 있습니다.</p>
      </div>
      {canGrantAdministrator ? <button type="button" disabled={changing === 'administrator'} onClick={() => void changeAdministrator(true)} className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">{changing === 'administrator' ? '처리 중' : '일반관리자로 지정'}</button> : null}
      {canRevokeAdministrator ? <button type="button" disabled={changing === 'administrator'} onClick={() => void changeAdministrator(false)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">{changing === 'administrator' ? '처리 중' : '관리자 해지'}</button> : null}
    </div>
    {user.role === 'SELLER' && highestAdministrator ? <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">판매자 계정은 판매자 등록 해지 후 일반회원으로 전환된 뒤 일반관리자로 지정할 수 있습니다.</p> : null}
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(groups).map(([group, values]) => <section key={group} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{groupLabel[group as FeaturePermissionView['group']]}</h4><div className="mt-3 space-y-2">{values.map(permission => <label key={permission.code} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span>{permission.label}</span><input type="checkbox" checked={permission.enabled} disabled={changing === permission.code} onChange={() => void toggle(permission)} /></label>)}</div></section>)}</div>
  </section></td></tr>
}

export function UserManagementPanel() {
  const { user: actor } = useAuth()
  const users = useAsync<AdminUser[]>(() => adminUserApi.list(), [])
  const requests = useAsync<SellerDeactivationRequest[]>(() => adminSellerDeactivationApi.pending(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'ALL' | UserRole>('ALL')
  const highestAdministrator = actor?.adminLevel === 'HIGHEST'
  const filtered = useMemo(() => (users.data ?? []).filter((user) =>
    (role === 'ALL' || user.role === role)
    && [user.name, user.email, user.phone ?? ''].some((value) => value.toLowerCase().includes(query.trim().toLowerCase())),
  ), [users.data, role, query])

  async function process(request: SellerDeactivationRequest, action: 'approve' | 'reject') {
    if (action === 'approve' && !window.confirm(request.sellerName + '님을 일반 회원으로 전환하고 판매점 운영을 중지하시겠습니까?')) return
    setBusyId(request.id)
    try {
      if (action === 'approve') await adminSellerDeactivationApi.approve(request.id)
      else await adminSellerDeactivationApi.reject(request.id, '관리자 검토 반려')
      notify(action === 'approve' ? '일반 회원 전환과 판매점 비활성화를 완료했습니다.' : '판매자 등록 해지 신청을 반려했습니다.')
      await Promise.all([users.reload(), requests.reload()])
    } catch (caught) {
      notify(caught instanceof ApiError ? caught.message : '판매자 등록 해지 요청을 처리하지 못했습니다.', 'error')
    } finally { setBusyId(null) }
  }

  if (users.loading && !users.data) return <LoadingView label="회원 정보를 불러오는 중입니다" />
  if (users.error) return <ErrorView error={users.error} onRetry={users.reload} />

  return <section className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800"><p className="text-xs font-black text-brand-600">MEMBER MANAGEMENT</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">회원 관리</h2><p className="mt-2 text-sm text-slate-500">회원 ID를 누르면 해당 항목 아래에서 기능 권한을 관리합니다. 최고관리자만 일반회원의 일반관리자 지정·해지를 수행합니다.</p><div className="mt-4 flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 이메일, 연락처 검색" className="h-11 min-w-56 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800" /><select value={role} onChange={(event) => setRole(event.target.value as 'ALL' | UserRole)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"><option value="ALL">전체 역할</option><option value="CONSUMER">일반 회원</option><option value="SELLER">판매자</option><option value="ADMIN">관리자</option></select></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-220 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-5 py-3">회원</th><th className="px-5 py-3">연락처</th><th className="px-5 py-3">역할</th><th className="px-5 py-3">가입일</th><th className="px-5 py-3 text-right">계정 상태</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((user) => { const pending = (requests.data ?? []).find((item) => item.sellerUserId === user.id); const selected = selectedUser?.id === user.id; return <Fragment key={user.id}><tr className={selected ? 'bg-brand-50/60' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}><td className="px-5 py-4"><button type="button" onClick={() => setSelectedUser(selected ? null : user)} className="rounded-lg text-left hover:text-brand-700"><p className="font-black text-slate-900 dark:text-white">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.email} · 권한 설정</p></button></td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.phone ?? '-'}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">{user.role === 'ADMIN' ? (user.adminLevel === 'HIGHEST' ? '최고 관리자' : '일반 관리자') : roleLabel[user.role]}</span></td><td className="px-5 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td><td className="px-5 py-4 text-right">{user.role === 'SELLER' && pending ? <button type="button" disabled={busyId === pending.id} onClick={() => void process(pending, 'approve')} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">{busyId === pending.id ? '처리 중' : '일반 회원 전환 승인'}</button> : user.role === 'SELLER' ? <span className="text-xs font-bold text-violet-700 dark:text-violet-300">판매자 활성 · 해지 신청 대기 없음</span> : user.role === 'CONSUMER' ? <span className="text-xs font-bold text-slate-500">{highestAdministrator ? '일반 관리자 지정 가능' : '일반회원 계정'}</span> : <span className="text-xs font-bold text-slate-500">관리자 계정</span>}</td></tr>{selected ? <PermissionPanel user={user} highestAdministrator={highestAdministrator} onChanged={users.reload} onAdministratorChanged={(changed) => setSelectedUser(changed)} /> : null}</Fragment> })}{filtered.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">조건에 맞는 회원이 없습니다.</td></tr> : null}</tbody></table></div>
  </section>{(requests.data ?? []).length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20"><p className="text-xs font-black text-amber-700">SELLER REQUEST ALERT</p><h2 className="mt-1 text-xl font-black text-amber-950 dark:text-amber-100">판매자 등록 해지 요청 {(requests.data ?? []).length}건</h2><div className="mt-4 space-y-3">{(requests.data ?? []).map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-slate-900"><div><p className="font-black text-slate-900 dark:text-white">{request.sellerName} · {request.sellerEmail}</p><p className="mt-1 text-xs text-slate-500">신청 시각 {new Date(request.requestedAt).toLocaleString('ko-KR')} {request.reason ? '· ' + request.reason : ''}</p></div><div className="flex gap-2"><button type="button" disabled={busyId === request.id} onClick={() => void process(request, 'approve')} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">일반 회원 전환 승인</button><button type="button" disabled={busyId === request.id} onClick={() => void process(request, 'reject')} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">반려</button></div></div>)}</div></section>}</section>
}
