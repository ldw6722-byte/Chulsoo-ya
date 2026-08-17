import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { sellerDeactivationApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/notify'
import type { SellerDeactivationRequest } from '@/types/api'

export function SellerDeactivationPage() {
  const request = useAsync<SellerDeactivationRequest | null>(() => sellerDeactivationApi.mine(), [])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function submit() {
    setSubmitting(true)
    try { await sellerDeactivationApi.request(reason); notify('판매자 등록 해지 신청이 관리자 회원관리에 전달되었습니다.'); request.reload() }
    catch (caught) { notify(caught instanceof ApiError ? caught.message : '판매자 등록 해지 신청을 접수하지 못했습니다.', 'error') }
    finally { setSubmitting(false) }
  }
  if (request.loading && !request.data) return <div className="page"><LoadingView label="판매자 등록 상태를 확인하는 중입니다" /></div>
  if (request.error) return <div className="page"><ErrorView error={request.error} onRetry={request.reload} /></div>
  const existing = request.data
  return <main className="mx-auto max-w-3xl px-4 py-10"><Link to="/my" className="text-sm font-bold text-brand-600">← 마이철수로 돌아가기</Link><section className="mt-5 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/50 dark:bg-slate-900"><p className="text-xs font-black tracking-wider text-rose-600">SELLER ACCOUNT</p><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">판매자 등록 해지 신청</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">관리자 승인 후 일반 회원으로 전환되며, 판매점은 주문 수신과 매칭에서 비활성화됩니다. 진행 중인 주문이 있으면 신청할 수 없습니다.</p>{existing?.status === 'PENDING' ? <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900"><strong className="block text-base">관리자 검토 중입니다.</strong><p className="mt-2">신청 시각: {new Date(existing.requestedAt).toLocaleString('ko-KR')}</p>{existing.reason ? <p className="mt-1">사유: {existing.reason}</p> : null}</div> : <><label className="mt-6 block text-sm font-black text-slate-800 dark:text-slate-100">해지 사유 <span className="font-normal text-slate-400">선택</span><textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} placeholder="예: 사업 운영 종료" className="mt-2 min-h-30 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800" /></label><button type="button" disabled={submitting} onClick={() => void submit()} className="mt-5 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{submitting ? '신청 저장 중' : '판매자 등록 해지 신청'}</button></>}</section></main>
}
