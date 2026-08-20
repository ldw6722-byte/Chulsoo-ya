import { Fragment, useState } from 'react'
import { notify } from '@/lib/notify'
import { adminSellerApplicationApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { AdminSellerApplication, AdminSellerApplicationDocuments, SellerVerificationDocument } from '@/types/api'

const STATUS_LABEL: Record<AdminSellerApplication['status'], string> = {
  PENDING: '심사 대기',
  MANUAL_REVIEW: '수동 심사',
  APPROVED: '승인 완료',
  REJECTED: '반려',
}

function isPending(application: AdminSellerApplication) {
  return application.status === 'PENDING' || application.status === 'MANUAL_REVIEW'
}

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('ko-KR') : '-'
}

function dateKey(value: string | null) {
  return value ? new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) : ''
}

function InfoItem({ label, value, wide = false }: { label: string; value: string | number | null; wide?: boolean }) {
  return <div className={wide ? 'md:col-span-2 xl:col-span-3' : ''}>
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value ?? '-'}</p>
  </div>
}

function DocumentCard({ document }: { document: SellerVerificationDocument }) {
  return <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-black text-slate-800">{document.label}</p>
      <span className={document.submitted ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700' : 'rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700'}>{document.submitted ? '제출됨' : '미제출'}</span>
    </div>
    {document.submitted && document.signedUrl ? <>
      <img src={document.signedUrl} alt={document.label} className="mt-3 aspect-4/3 w-full rounded-lg border border-slate-200 bg-white object-contain" />
      <a href={document.signedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-brand-700 underline">원본 크게 보기</a>
    </> : <p className="mt-3 text-xs text-slate-500">아직 제출된 문서가 없습니다.</p>}
  </article>
}

function StatusBadge({ status }: { status: AdminSellerApplication['status'] }) {
  const tone = status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'
  return <span className={'rounded-full px-2.5 py-1 text-xs font-black ' + tone}>{STATUS_LABEL[status]}</span>
}

function InlineApplicationDetails({ application, documents, loading, onClose }: { application: AdminSellerApplication; documents: AdminSellerApplicationDocuments | null; loading: boolean; onClose: () => void }) {
  return <section className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 shadow-inner">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black text-brand-600">PRIVATE VERIFICATION DOCUMENTS</p>
        <h3 className="mt-1 text-lg font-black text-slate-900">{application.storeName} · 전체 신청 정보 및 제출 문서</h3>
        <p className="mt-1 text-xs text-slate-500">선택한 신청 항목 바로 아래에서 확인합니다.</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">접기</button>
    </div>
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black text-brand-600">APPLICATION PROFILE</p>
      <h4 className="mt-1 text-base font-black text-slate-900">신청서 입력 정보</h4>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoItem label="신청자 이름" value={application.applicantName} />
        <InfoItem label="가입 이메일" value={application.applicantEmail} />
        <InfoItem label="가입 연락처" value={application.applicantPhone} />
        <InfoItem label="판매점 이름" value={application.storeName} />
        <InfoItem label="사업자 대표자" value={application.representativeName} />
        <InfoItem label="사업자등록번호" value={application.businessRegistrationNumber} />
        <InfoItem label="개업일" value={application.businessOpenedOn ?? '-'} />
        <InfoItem label="사업장 지역" value={application.cityName + ' ' + application.districtName} />
        <InfoItem label="사업장 연락처" value={application.phone} />
        <InfoItem label="사업장 주소" value={application.address} wide />
        <InfoItem label="신청 상태" value={STATUS_LABEL[application.status]} />
        <InfoItem label="국세청 확인" value={application.ntsMessage ? application.ntsStatus + ' · ' + application.ntsMessage : application.ntsStatus} />
        <InfoItem label="신청 시각" value={dateTime(application.submittedAt)} />
        <InfoItem label="심사 시각" value={dateTime(application.reviewedAt)} />
        <InfoItem label="심사 담당자 ID" value={application.reviewedByUserId ?? '-'} />
        {application.rejectionReason ? <InfoItem label="반려 사유" value={application.rejectionReason} wide /> : null}
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold text-slate-500">취급 품목</p>
        <div className="mt-2 flex flex-wrap gap-2">{application.handledItems.map((item) => <span key={item} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{item}</span>)}</div>
      </div>
    </section>
    {loading ? <p className="mt-4 text-sm text-slate-500">보안 문서를 불러오는 중입니다.</p> : documents ? <div className="mt-4 grid gap-4 md:grid-cols-2"><DocumentCard document={documents.businessLicense} /><DocumentCard document={documents.bankAccountCopy} /></div> : <p className="mt-4 text-sm text-slate-500">표시할 문서가 없습니다.</p>}
  </section>
}

type ApplicationTableProps = {
  applications: AdminSellerApplication[]
  busyId: number | null
  pending: boolean
  emptyText: string
  dateLabel: string
  selected: AdminSellerApplication | null
  documents: AdminSellerApplicationDocuments | null
  loadingDocuments: boolean
  onToggle: (application: AdminSellerApplication) => void
  onClose: () => void
  onApprove: (application: AdminSellerApplication) => void
  onReject: (application: AdminSellerApplication) => void
}

function ApplicationTable({ applications, busyId, pending, emptyText, dateLabel, selected, documents, loadingDocuments, onToggle, onClose, onApprove, onReject }: ApplicationTableProps) {
  return <div className="overflow-x-auto">
    <table className="w-full min-w-270 text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          <th className="px-5 py-3">순서</th>
          <th className="px-5 py-3">신청 판매점</th>
          <th className="px-5 py-3">신청자</th>
          <th className="px-5 py-3">사업자 정보</th>
          <th className="px-5 py-3">증빙</th>
          <th className="px-5 py-3">상태</th>
          <th className="px-5 py-3 text-right">심사</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {applications.map((application, index) => <Fragment key={application.id}>
          <tr className={selected?.id === application.id ? 'bg-brand-50/30' : ''}>
            <td className="px-5 py-4 align-top">
              <p className="font-black text-slate-800">{index + 1}</p>
              <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{pending ? dateTime(application.submittedAt) : dateTime(application.reviewedAt)}</p>
            </td>
            <td className="px-5 py-4"><p className="font-black text-slate-900">{application.storeName}</p><p className="mt-1 text-xs text-slate-500">{application.cityName} {application.districtName}</p></td>
            <td className="px-5 py-4"><p className="font-bold text-slate-800">{application.applicantName}</p><p className="mt-1 text-xs text-slate-500">{application.applicantEmail}</p></td>
            <td className="px-5 py-4 text-slate-600"><p>{application.representativeName}</p><p className="mt-1 text-xs">{application.businessRegistrationNumberMasked}</p></td>
            <td className="px-5 py-4"><button type="button" onClick={() => onToggle(application)} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">{selected?.id === application.id ? '정보·문서 접기' : '전체 정보·문서'}</button><p className="mt-2 text-xs text-slate-500">등록증 {application.certificateSubmitted ? '제출' : '미제출'} · 통장 {application.bankAccountCopySubmitted ? '제출' : '미제출'}</p></td>
            <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
            <td className="px-5 py-4 text-right">{pending ? <div className="flex justify-end gap-2"><button type="button" disabled={busyId === application.id || !application.certificateSubmitted || !application.bankAccountCopySubmitted} onClick={() => onApprove(application)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">승인</button><button type="button" disabled={busyId === application.id} onClick={() => onReject(application)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-700">반려</button></div> : <span className="text-xs font-bold text-slate-400">{dateLabel}</span>}</td>
          </tr>
          {selected?.id === application.id ? <tr><td colSpan={7} className="p-4"><InlineApplicationDetails application={application} documents={documents} loading={loadingDocuments} onClose={onClose} /></td></tr> : null}
        </Fragment>)}
      </tbody>
    </table>
    {!applications.length ? <p className="px-5 py-14 text-center text-sm text-slate-500">{emptyText}</p> : null}
  </div>
}

export function SellerApplicationManagementPanel() {
  const applications = useAsync<AdminSellerApplication[]>(() => adminSellerApplicationApi.list(), [])
  const [busyId, setBusyId] = useState<number | null>(null)

  const [documents, setDocuments] = useState<AdminSellerApplicationDocuments | null>(null)
  const [selected, setSelected] = useState<AdminSellerApplication | null>(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [historyStart, setHistoryStart] = useState('')
  const [historyEnd, setHistoryEnd] = useState('')

  const closeDetails = () => {
    setSelected(null)
    setDocuments(null)
    setLoadingDocuments(false)
  }

  const toggleDetails = async (application: AdminSellerApplication) => {
    if (selected?.id === application.id) {
      closeDetails()
      return
    }
    setSelected(application)
    setDocuments(null)
    setLoadingDocuments(true)
    try {
      setDocuments(await adminSellerApplicationApi.documents(application.id))
    } catch (error) {
      notify(error instanceof Error ? error.message : '증빙 문서를 불러오지 못했습니다.', 'error')
    } finally {
      setLoadingDocuments(false)
    }
  }

  const approve = async (application: AdminSellerApplication) => {
    if (!application.certificateSubmitted || !application.bankAccountCopySubmitted) {
      notify('사업자등록증과 통장사본이 모두 제출된 신청만 승인할 수 있습니다.', 'error')
      return
    }
    setBusyId(application.id)

    try {
      await adminSellerApplicationApi.approve(application.id)
      closeDetails()
      notify(application.storeName + ' 신청을 승인했습니다. 완료 히스토리에서 다시 확인할 수 있습니다.')
      await applications.reload()
    } catch (error) {
      notify(error instanceof Error ? error.message : '승인 처리에 실패했습니다.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (application: AdminSellerApplication) => {
    const reason = window.prompt('반려 사유를 입력해 주세요.')?.trim()
    if (!reason) return
    setBusyId(application.id)

    try {
      await adminSellerApplicationApi.reject(application.id, reason)
      closeDetails()
      notify(application.storeName + ' 신청을 반려했습니다. 완료 히스토리에서 다시 확인할 수 있습니다.')
      await applications.reload()
    } catch (error) {
      notify(error instanceof Error ? error.message : '반려 처리에 실패했습니다.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (applications.loading) return <LoadingView label="판매자 신청을 불러오는 중입니다." />
  if (applications.error) return <ErrorView error={applications.error} onRetry={applications.reload} />

  const list = applications.data ?? []
  const pendingApplications = list.filter(isPending)
  const historyApplications = list.filter((application) => !isPending(application))
  const filteredHistory = historyApplications.filter((application) => {
    const completedDate = dateKey(application.reviewedAt)
    return (!historyStart || completedDate >= historyStart) && (!historyEnd || completedDate <= historyEnd)
  })

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-xs font-black text-brand-600">SELLER VERIFICATION QUEUE</p>
        <div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-xl font-black text-slate-900">심사 대기 신청</h2><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-700">{pendingApplications.length}건</span></div>
        <p className="mt-2 text-sm text-slate-500">접수 시각 기준으로 먼저 신청한 판매자부터 나열됩니다. 전체 정보·문서는 선택한 신청 항목 바로 아래에 열립니다.</p>
      </div>

      <ApplicationTable applications={pendingApplications} busyId={busyId} pending emptyText="현재 심사 대기 중인 판매자 신청이 없습니다." dateLabel="심사 대기" selected={selected} documents={documents} loadingDocuments={loadingDocuments} onToggle={(application) => void toggleDetails(application)} onClose={closeDetails} onApprove={(application) => void approve(application)} onReject={(application) => void reject(application)} />
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-xs font-black text-slate-500">SELLER VERIFICATION HISTORY</p>
        <div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-xl font-black text-slate-900">심사 완료 히스토리</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{filteredHistory.length}건 표시</span></div>
        <p className="mt-2 text-sm text-slate-500">승인·반려된 신청 정보와 증빙 문서는 보존됩니다. 완료일을 선택해 원하는 기간만 찾을 수 있습니다.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
          <label className="grid gap-1 text-xs font-bold text-slate-600">완료일 시작<input type="date" value={historyStart} max={historyEnd || undefined} onChange={(event) => setHistoryStart(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">완료일 종료<input type="date" value={historyEnd} min={historyStart || undefined} onChange={(event) => setHistoryEnd(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800" /></label>
          <button type="button" disabled={!historyStart && !historyEnd} onClick={() => { setHistoryStart(''); setHistoryEnd('') }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-40">기간 초기화</button>
        </div>
      </div>
      <ApplicationTable applications={filteredHistory} busyId={null} pending={false} emptyText="선택한 완료일 구간에 해당하는 심사 히스토리가 없습니다." dateLabel="심사 완료" selected={selected} documents={documents} loadingDocuments={loadingDocuments} onToggle={(application) => void toggleDetails(application)} onClose={closeDetails} onApprove={() => undefined} onReject={() => undefined} />
    </section>
  </div>
}
