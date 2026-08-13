import { useState } from 'react'
import { adminSellerApplicationApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminSellerApplication, SellerApplicationStatus } from '@/types/api'

const STATUS_LABEL: Record<SellerApplicationStatus, string> = {
  PENDING: '심사 대기', MANUAL_REVIEW: '수동 심사', APPROVED: '승인 완료', REJECTED: '반려',
}

export function SellerApplicationManagementPanel() {
  const applications = useAsync<AdminSellerApplication[]>(() => adminSellerApplicationApi.list(), [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const approve = async (application: AdminSellerApplication) => {
    if (!application.certificateSubmitted) { setMessage('사업자등록증이 제출된 신청만 승인할 수 있습니다.'); return }
    setBusyId(application.id); setMessage('')
    try { await adminSellerApplicationApi.approve(application.id); setMessage(`${application.storeName} 신청을 승인했습니다. 판매자 역할과 미검증 매장이 생성되었습니다.`); await applications.reload() } catch (error) { setMessage(error instanceof Error ? error.message : '승인 처리에 실패했습니다.') } finally { setBusyId(null) }
  }

  const reject = async (application: AdminSellerApplication) => {
    const reason = window.prompt('반려 사유를 입력해 주세요. 신청자에게 그대로 안내됩니다.')?.trim()
    if (!reason) return
    setBusyId(application.id); setMessage('')
    try { await adminSellerApplicationApi.reject(application.id, reason); setMessage(`${application.storeName} 신청을 반려했습니다.`); await applications.reload() } catch (error) { setMessage(error instanceof Error ? error.message : '반려 처리에 실패했습니다.') } finally { setBusyId(null) }
  }

  if (applications.loading && !applications.data) return <LoadingView label="판매자 신청을 불러오는 중입니다" />
  if (applications.error) return <ErrorView error={applications.error} onRetry={applications.reload} />
  const list = applications.data ?? []
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5"><p className="text-xs font-black text-brand-600">SELLER VERIFICATION</p><h2 className="mt-1 text-xl font-black text-slate-900">판매자 신청 심사</h2><p className="mt-2 text-sm leading-6 text-slate-500">사업자등록증 제출 여부와 신청 정보를 확인한 뒤 승인 또는 반려합니다. 승인된 매장은 별도 운영 검토 후 주문 수신을 시작합니다.</p></div>{message ? <p role="status" className="mx-5 mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}<div className="overflow-x-auto"><table className="w-full min-w-230 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">신청 판매점</th><th className="px-5 py-3">신청자</th><th className="px-5 py-3">사업자 정보</th><th className="px-5 py-3">증빙</th><th className="px-5 py-3">상태</th><th className="px-5 py-3 text-right">심사</th></tr></thead><tbody className="divide-y divide-slate-100">{list.map((application) => { const open = application.status === 'PENDING' || application.status === 'MANUAL_REVIEW'; return <tr key={application.id}><td className="px-5 py-4"><p className="font-black text-slate-900">{application.storeName}</p><p className="mt-1 text-xs text-slate-500">{application.cityName} {application.districtName} · {application.handledItems.join(', ')}</p></td><td className="px-5 py-4"><p className="font-bold text-slate-800">{application.applicantName}</p><p className="mt-1 text-xs text-slate-500">{application.applicantEmail}</p></td><td className="px-5 py-4 text-slate-600"><p>{application.representativeName}</p><p className="mt-1 text-xs">{application.businessRegistrationNumberMasked}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${application.certificateSubmitted ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{application.certificateSubmitted ? '제출됨' : '미제출'}</span></td><td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-700">{STATUS_LABEL[application.status]}</span></td><td className="px-5 py-4 text-right">{open ? <div className="flex justify-end gap-2"><button type="button" disabled={busyId === application.id || !application.certificateSubmitted} onClick={() => void approve(application)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">승인</button><button type="button" disabled={busyId === application.id} onClick={() => void reject(application)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50">반려</button></div> : <span className="text-xs font-bold text-slate-400">검토 완료</span>}</td></tr> })}</tbody></table>{!list.length ? <p className="px-5 py-14 text-center text-sm text-slate-500">접수된 판매자 신청이 없습니다.</p> : null}</div></section>
}
