import { Link } from 'react-router-dom'
import { AddressManagementPanel } from './AddressManagementPanel'

export function DeliveryAddressPage() {
  return <div className="mx-auto max-w-5xl px-4 py-7 md:py-10">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-brand-600">MY CHULSOO-YA</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">배송지 관리</h1><p className="mt-2 text-sm text-slate-500">기본 주소지는 회원정보에서 관리하고, 이곳에서는 현장·추가 배송지만 관리합니다.</p></div><Link to="/my/profile" className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">회원정보로 돌아가기</Link></div>
    <AddressManagementPanel />
  </div>
}
