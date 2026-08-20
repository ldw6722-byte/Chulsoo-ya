import { useState } from 'react'
import { notify } from '@/lib/notify'
import { adminCouponApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'

const toLocalInput = (date: Date) => date.toISOString().slice(0, 16)

export function CouponManagementPanel() {
  const policies = useAsync(() => adminCouponApi.list(), [])
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [discountAmount, setDiscountAmount] = useState('1000')
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('10000')
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date()))
  const [expiresAt, setExpiresAt] = useState(() => toLocalInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)))
  const [consumerId, setConsumerId] = useState('')
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)


  const create = async () => {
    if (!code.trim() || !title.trim()) { notify('쿠폰 코드와 제목을 입력해 주세요.', 'error'); return }
    setSaving(true);
    try {
      const policy = await adminCouponApi.create({ code: code.trim(), title: title.trim(), discountAmount: Number(discountAmount), minimumOrderAmount: Number(minimumOrderAmount), startsAt: new Date(startsAt).toISOString(), expiresAt: new Date(expiresAt).toISOString() })
      setSelectedPolicyId(policy.id); setCode(''); setTitle(''); notify('쿠폰 정책을 등록했습니다. 회원에게 발행할 수 있습니다.'); await policies.reload()
    } catch (error) { notify(error instanceof Error ? error.message : '쿠폰 정책 등록에 실패했습니다.', 'error') } finally { setSaving(false) }
  }

  const issue = async () => {
    if (!selectedPolicyId || !Number.isInteger(Number(consumerId)) || Number(consumerId) <= 0) { notify('발행할 쿠폰과 회원 번호를 확인해 주세요.', 'error'); return }
    setSaving(true);
    try { await adminCouponApi.issue(selectedPolicyId, Number(consumerId)); setConsumerId(''); notify('회원에게 쿠폰을 발행했습니다.') } catch (error) { notify(error instanceof Error ? error.message : '쿠폰 발행에 실패했습니다.', 'error') } finally { setSaving(false) }
  }

  return <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">COUPON OPERATIONS</p><h2 className="mt-1 text-lg font-black text-slate-900">무상 쿠폰 정책</h2><p className="mt-2 text-sm leading-6 text-slate-500">이벤트·보상용 무상 쿠폰만 발행합니다. 현금 환급·양도·연장은 제공하지 않으며, 유효기간과 최소 주문 조건을 명시합니다.</p>{policies.loading && !policies.data ? <div className="mt-6"><LoadingView label="쿠폰 정책을 불러오는 중입니다" /></div> : policies.error ? <div className="mt-6"><ErrorView error={policies.error} onRetry={policies.reload} /></div> : (policies.data?.length ?? 0) === 0 ? <div className="mt-6"><EmptyView title="등록된 쿠폰 정책이 없습니다" description="오른쪽에서 첫 쿠폰 정책을 등록해 주세요." /></div> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-170 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">코드</th><th className="px-3 py-2">혜택</th><th className="px-3 py-2">최소 주문</th><th className="px-3 py-2">유효기간</th><th className="px-3 py-2"></th></tr></thead><tbody className="divide-y divide-slate-100">{(policies.data ?? []).map((policy) => <tr key={policy.id}><td className="px-3 py-3"><b>{policy.code}</b><br /><span className="text-xs text-slate-500">{policy.title}</span></td><td className="px-3 py-3">{policy.discountAmount.toLocaleString()}원</td><td className="px-3 py-3">{policy.minimumOrderAmount.toLocaleString()}원</td><td className="px-3 py-3 text-xs text-slate-500">~ {new Date(policy.expiresAt).toLocaleDateString('ko-KR')}</td><td className="px-3 py-3"><button type="button" onClick={() => setSelectedPolicyId(policy.id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${selectedPolicyId === policy.id ? 'bg-brand-600 text-white' : 'border border-slate-300 text-slate-700'}`}>발행 선택</button></td></tr>)}</tbody></table></div>}</article><aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-black text-slate-900">쿠폰 정책 등록</h2><div className="mt-4 space-y-3"><input value={code} onChange={(event) => setCode(event.target.value)} maxLength={40} placeholder="쿠폰 코드 예: WELCOME1000" className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" /><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="고객에게 보일 쿠폰 제목" className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" /><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-600">할인 금액<input type="number" min="1" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">최소 주문<input type="number" min="0" value={minimumOrderAmount} onChange={(event) => setMinimumOrderAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label></div><label className="text-xs font-bold text-slate-600">시작<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">종료<input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label><button type="button" disabled={saving} onClick={() => void create()} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-black text-white disabled:opacity-50">쿠폰 정책 등록</button></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-black text-slate-900">회원 쿠폰 발행</h2><p className="mt-2 text-sm text-slate-500">선택한 쿠폰 정책을 회원 번호 기준으로 발행합니다.</p><input value={consumerId} onChange={(event) => setConsumerId(event.target.value)} inputMode="numeric" placeholder="회원 번호" className="mt-4 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" /><button type="button" disabled={saving || !selectedPolicyId} onClick={() => void issue()} className="mt-3 w-full rounded-xl border border-brand-600 bg-white py-2.5 text-sm font-black text-brand-700 disabled:opacity-50">선택 쿠폰 발행</button></section></aside></section>
}
