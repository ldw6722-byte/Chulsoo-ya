import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/endpoints'
import { useAuth } from '@/app/useAuth'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import type { AdminAccount, AdminStatus } from '@/types/api'

const STATUS_OPTIONS: Array<{ value: AdminStatus; label: string; tone: string }> = [
  { value: 'WORKING', label: '근무 중', tone: 'bg-emerald-500' },
  { value: 'AWAY', label: '자리 비움', tone: 'bg-amber-400' },
  { value: 'OFFLINE', label: '업무 종료', tone: 'bg-slate-400' },
]

function initials(name: string) {
  return name.trim().slice(0, 1) || '관'
}

export function AdminAccountMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [updatedAccount, setUpdatedAccount] = useState<AdminAccount | null>(null)
  const account = useAsync(() => adminApi.myAccount(), [])
  const accounts = useAsync(() => adminApi.administratorAccounts(), [], { enabled: settingsOpen && (updatedAccount ?? account.data)?.level === 'HIGHEST' })
  const current = updatedAccount ?? account.data
  const displayName = current?.name ?? user?.name ?? '관리자'
  const displayEmail = current?.email ?? user?.email ?? ''
  const status = current?.status ?? 'OFFLINE'
  const statusOption = STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[2]

  const updateStatus = async (next: AdminStatus) => {
    try {
      const updated = await adminApi.updateMyAccountStatus(next)
      setUpdatedAccount(updated)
      account.reload()
      notify('관리자 운영 상태를 변경했습니다.')
    } catch (error) {
      notify(error instanceof Error ? error.message : '관리자 운영 상태 변경에 실패했습니다.', 'error')
    }
  }

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !name.trim()) {
      notify('이름과 이메일을 입력해 주세요.', 'error')
      return
    }
    if (!window.confirm(`${email.trim()} 주소로 일반 관리자 초대 이메일을 보내시겠습니까?`)) return
    setInviting(true)
    try {
      await adminApi.inviteAdministrator({ email: email.trim(), name: name.trim() })
      setEmail('')
      setName('')
      accounts.reload()
      notify('일반 관리자 초대 이메일을 발송했습니다.')
    } catch (error) {
      notify(error instanceof Error ? error.message : '일반 관리자 초대에 실패했습니다.', 'error')
    } finally {
      setInviting(false)
    }
  }

  return <div className="relative">
    <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => { setSettingsOpen(false); setOpen((value) => !value) }} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className={`h-2.5 w-2.5 rounded-full ${statusOption.tone}`} aria-label={statusOption.label} />
      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-black text-white dark:bg-brand-500">{initials(displayName)}</span>
      <span className="hidden min-w-0 sm:block"><span className="block max-w-28 truncate text-sm font-black text-slate-800 dark:text-slate-100">{displayName}</span><span className="block max-w-28 truncate text-[11px] text-slate-500">{current?.roleLabel ?? '관리자'}</span></span>
      <span className="hidden text-xs text-slate-400 sm:block">⌄</span>
    </button>

    {open && <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-black text-white dark:bg-brand-500">{initials(displayName)}</span><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900 dark:text-white">{displayName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{displayEmail}</p><p className="mt-1 text-xs font-bold text-brand-600">{current?.roleLabel ?? '관리자'} · {current?.statusLabel ?? statusOption.label}</p></div></div></div>
      <div className="px-2 py-2"><p className="px-2 pb-2 text-[11px] font-black tracking-wider text-slate-400">운영 상태</p><div className="grid grid-cols-3 gap-1">{STATUS_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => void updateStatus(option.value)} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${status === option.value ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/20 dark:text-brand-100' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}><span className={`mr-1 inline-block h-2 w-2 rounded-full ${option.tone}`} />{option.label}</button>)}</div></div>
      <div className="border-t border-slate-100 px-2 py-2 dark:border-slate-800"><Link to="/my/profile" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">내 프로필</Link>{current?.level === 'HIGHEST' && <button type="button" onClick={() => { setOpen(false); setSettingsOpen(true) }} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">관리자 계정 설정</button>}<Link to="/support" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">고객 지원</Link><button type="button" onClick={() => void signOut()} className="mt-1 block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">로그아웃</button></div>
    </div>}

    {settingsOpen && <section role="dialog" aria-label="관리자 계정 설정" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100vh-5.5rem)] w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:w-96 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black tracking-wider text-brand-600">최고 관리자 전용</p><h2 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">관리자 계정 설정</h2></div><button type="button" onClick={() => setSettingsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="관리자 계정 설정 닫기">×</button></div>
      <form onSubmit={invite} className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"><label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">이름<input value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="운영 담당자" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="operator@example.com" /></label><button type="submit" disabled={inviting} className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{inviting ? '초대 중' : '일반 관리자 초대'}</button></form>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500 dark:border-slate-800 dark:bg-slate-800"><span>관리자</span><span>권한</span><span>상태</span></div><div className="max-h-48 overflow-y-auto">{accounts.loading && <p className="px-3 py-5 text-sm text-slate-500">관리자 계정을 불러오는 중입니다.</p>}{accounts.data?.accounts.map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm dark:border-slate-800"><span className="min-w-0"><b className="block truncate text-slate-900 dark:text-white">{item.name}</b><span className="block truncate text-xs text-slate-500">{item.email}</span></span><span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{item.roleLabel}</span><span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300"><i className={`h-2 w-2 rounded-full ${STATUS_OPTIONS.find((option) => option.value === item.status)?.tone ?? 'bg-slate-400'}`} />{item.statusLabel}</span></div>)}{accounts.error && <p className="px-3 py-5 text-sm text-rose-600">관리자 계정을 불러오지 못했습니다.</p>}</div></div>
    </section>}
  </div>
}
