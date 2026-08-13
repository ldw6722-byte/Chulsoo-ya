import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { sellerApplicationApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { SellerApplication, SubmitSellerApplicationRequest } from '@/types/api'

const INITIAL_FORM: SubmitSellerApplicationRequest = {
  storeName: '', representativeName: '', businessRegistrationNumber: '', businessOpenedOn: '',
  cityName: '서울특별시', districtName: '', address: '', phone: '', handledItems: '철물,공구',
}

const STATUS: Record<SellerApplication['status'], string> = {
  PENDING: '심사 대기', MANUAL_REVIEW: '수동 심사', APPROVED: '승인 완료', REJECTED: '반려',
}

function CertificateUpload({ application, onUploaded }: { application: SellerApplication; onUploaded: (next: SellerApplication) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!file) { setNotice('사업자등록증 파일을 선택해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      onUploaded(await sellerApplicationApi.uploadCertificate(application.id, file))
      setFile(null)
      setNotice('사업자등록증이 안전하게 제출되었습니다. 관리자가 검토 후 안내합니다.')
    } catch (error) { setNotice(error instanceof Error ? error.message : '사업자등록증 제출에 실패했습니다.') } finally { setSaving(false) }
  }
  if (application.certificateSubmitted) return <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">사업자등록증이 제출되었습니다. 검토 상태는 아래에서 확인할 수 있습니다.</div>
  return <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-base font-black text-slate-900">사업자등록증 제출</h2><p className="mt-2 text-sm leading-6 text-slate-600">JPG, PNG, PDF 파일만 가능하며 파일 크기는 100KB 이상 5MB 이하입니다. 서류는 공개되지 않고 심사 담당자만 확인합니다.</p><div className="mt-4 flex flex-wrap items-center gap-3"><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block max-w-full text-sm" /><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? '제출 중' : '서류 제출'}</button></div>{notice ? <p role="status" className="mt-3 text-sm text-slate-700">{notice}</p> : null}</section>
}

function ApplicationStatus({ application }: { application: SellerApplication }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">SELLER APPLICATION</p><h1 className="mt-1 text-2xl font-black text-slate-900">{application.storeName} 판매자 신청</h1><p className="mt-2 text-sm text-slate-500">{application.cityName} {application.districtName} · {application.handledItems.join(', ')}</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-700">{STATUS[application.status]}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">제출일</p><p className="mt-1 text-sm font-black text-slate-900">{new Date(application.submittedAt).toLocaleDateString('ko-KR')}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">사업자 확인</p><p className="mt-1 text-sm font-black text-slate-900">{application.ntsStatus === 'VERIFIED' ? '확인 완료' : '심사 준비 중'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">심사 결과</p><p className="mt-1 text-sm font-black text-slate-900">{application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString('ko-KR') : '검토 전'}</p></div></div>{application.rejectionReason ? <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-700">반려 사유: {application.rejectionReason}</p> : null}{application.status === 'APPROVED' ? <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">판매자 계정이 활성화되었습니다. <Link to="/seller" className="font-black underline">판매자 대시보드로 이동</Link>해 운영 설정을 확인해 주세요.</div> : null}</section>
}

function ApplicationForm({ onSubmitted }: { onSubmitted: (application: SellerApplication) => void }) {
  const [form, setForm] = useState<SubmitSellerApplicationRequest>(INITIAL_FORM)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key: keyof SubmitSellerApplicationRequest, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async () => {
    const required = ['storeName', 'representativeName', 'businessRegistrationNumber', 'districtName', 'address', 'phone'] as const
    if (required.some((key) => !form[key].trim())) { setNotice('필수 정보를 모두 입력해 주세요.'); return }
    setSaving(true); setNotice('')
    try { onSubmitted(await sellerApplicationApi.submit({ ...form, businessOpenedOn: form.businessOpenedOn || undefined })) } catch (error) { setNotice(error instanceof Error ? error.message : '판매자 신청에 실패했습니다.') } finally { setSaving(false) }
  }
  const input = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500'
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">SELLER ONBOARDING</p><h1 className="mt-1 text-2xl font-black text-slate-900">판매자 가입 신청</h1><p className="mt-3 text-sm leading-6 text-slate-600">사업자 정보와 등록증을 제출하면 관리자가 검토합니다. 승인된 뒤에만 지역 주문 응찰을 시작할 수 있습니다.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">판매점 이름<input className={input} value={form.storeName} onChange={(event) => update('storeName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">대표자명<input className={input} value={form.representativeName} onChange={(event) => update('representativeName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">사업자등록번호<input className={input} inputMode="numeric" placeholder="123-45-67890" value={form.businessRegistrationNumber} onChange={(event) => update('businessRegistrationNumber', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">개업일<input className={input} type="date" value={form.businessOpenedOn ?? ''} onChange={(event) => update('businessOpenedOn', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">시·도<input className={input} value={form.cityName} onChange={(event) => update('cityName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">구·군<input className={input} placeholder="강남구" value={form.districtName} onChange={(event) => update('districtName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">사업장 주소<input className={input} value={form.address} onChange={(event) => update('address', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">연락처<input className={input} inputMode="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">취급 품목<input className={input} value={form.handledItems ?? ''} onChange={(event) => update('handledItems', event.target.value)} /></label></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-xs leading-5 text-slate-500">입력한 사업자 정보와 첨부 서류는 판매자 검증 목적으로만 사용되며, 고객이나 다른 판매자에게 공개되지 않습니다.</p><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? '신청 중' : '판매자 신청하기'}</button></div>{notice ? <p role="status" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{notice}</p> : null}</section>
}

export function SellerApplicationPage() {
  const mine = useAsync<SellerApplication>(() => sellerApplicationApi.mine(), [])
  const [application, setApplication] = useState<SellerApplication | null>(null)
  useEffect(() => { if (mine.data) setApplication(mine.data) }, [mine.data])
  const noApplication = mine.error instanceof ApiError && mine.error.status === 404
  if (mine.loading && !mine.data) return <div className="page"><LoadingView label="판매자 신청 상태를 불러오는 중입니다" /></div>
  if (mine.error && !noApplication && !application) return <div className="page"><ErrorView error={mine.error} onRetry={mine.reload} /></div>
  return <main className="mx-auto max-w-4xl px-4 py-8 md:py-12"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">CHULSOO-YA PARTNER</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">판매자 등록</h1></div><Link to="/my" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">마이철수로 돌아가기</Link></div>{application ? <><ApplicationStatus application={application} /><CertificateUpload application={application} onUploaded={setApplication} /></> : <ApplicationForm onSubmitted={setApplication} />}</main>
}
