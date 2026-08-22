import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { deliveryAddressApi, regionApi, sellerApplicationApi, userApi } from '@/api/endpoints'
import { KakaoAddressSearchButton } from '@/components/address/KakaoAddressTools'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/app/useAuth'
import type { FeaturePermissionView, SellerApplication, SubmitSellerApplicationRequest } from '@/types/api'

const INITIAL_FORM: SubmitSellerApplicationRequest = {
  storeName: '', representativeName: '', businessRegistrationNumber: '', businessOpenedOn: '',
  cityName: '서울특별시', districtName: '', address: '', phone: '', handledItems: '철물,공구',
}
const STATUS: Record<SellerApplication['status'], string> = {
  PENDING: '심사 대기', MANUAL_REVIEW: '수동 심사', APPROVED: '승인 완료', REJECTED: '반려',
}
const MIN_BYTES = 100 * 1024
const MAX_BYTES = 10 * 1024 * 1024
const MIN_EDGE = 800
const MAX_EDGE = 6000

type DocumentKind = 'business' | 'bank'
const LABEL: Record<DocumentKind, string> = { business: '사업자등록증', bank: '통장사본' }

async function validateImage(file: File): Promise<string | null> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'JPG 또는 PNG 이미지만 첨부할 수 있습니다.'
  if (file.size < MIN_BYTES || file.size > MAX_BYTES) return '파일 용량은 100KB 이상 10MB 이하만 가능합니다.'
  const url = URL.createObjectURL(file)
  try {
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error('이미지 확인 실패'))
      image.src = url
    })
    const shortEdge = Math.min(size.width, size.height)
    const longEdge = Math.max(size.width, size.height)
    if (shortEdge < MIN_EDGE || longEdge > MAX_EDGE) return '이미지 해상도는 짧은 변 800px 이상, 긴 변 6000px 이하여야 합니다.'
    return null
  } catch {
    return '이미지 파일을 열 수 없습니다.'
  } finally {
    URL.revokeObjectURL(url)
  }
}

function DocumentDropUpload({ kind, submitted, application, onUploaded }: {
  kind: DocumentKind
  submitted: boolean
  application: SellerApplication
  onUploaded: (next: SellerApplication) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const choose = async (next: File | null) => {
    if (!next) return
    const error = await validateImage(next)
    if (error) { setFile(null); setNotice(error); return }
    setFile(next); setNotice('')
  }
  const submit = async () => {
    if (!file) { setNotice(`${LABEL[kind]} 이미지를 선택해 주세요.`); return }
    setSaving(true); setNotice('')
    try {
      const next = kind === 'business'
        ? await sellerApplicationApi.uploadCertificate(application.id, file)
        : await sellerApplicationApi.uploadBankAccountCopy(application.id, file)
      onUploaded(next); setFile(null); setNotice(`${LABEL[kind]}이 제출되었습니다.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `${LABEL[kind]} 제출에 실패했습니다.`)
    } finally { setSaving(false) }
  }

  return <article className={`rounded-2xl border p-5 ${submitted ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/50'} dark:border-slate-700 dark:bg-slate-900/70`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black text-slate-900 dark:text-white">{LABEL[kind]}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">JPG·PNG만 가능하며 100KB 이상 10MB 이하, 짧은 변 800px 이상·긴 변 6000px 이하의 식별 가능한 이미지를 제출해 주세요.</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${submitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{submitted ? '제출 완료' : '제출 필요'}</span></div>
    <div onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void choose(event.dataTransfer.files?.[0] ?? null) }} className={`mt-4 rounded-xl border-2 border-dashed px-5 py-6 text-center transition ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'}`}>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">여기로 이미지를 끌어다 놓으세요</p><p className="mt-1 text-xs text-slate-500">또는 아래에서 파일을 직접 찾을 수 있습니다.</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={event => void choose(event.target.files?.[0] ?? null)} className="hidden" />
      <div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">파일 찾기</button><button type="button" disabled={!file || saving} onClick={() => void submit()} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? '업로드 중' : submitted ? '교체 업로드' : '제출하기'}</button></div>
      {file ? <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">선택됨: {file.name} · {(file.size / 1024).toFixed(0)}KB</p> : null}
    </div>{notice ? <p role="status" className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{notice}</p> : null}
  </article>
}

function ApplicationStatus({ application }: { application: SellerApplication }) {
  if (application.internalAdminApplication) {
    return <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/20"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-violet-700 dark:text-violet-300">INTERNAL ADMIN SELLER APPLICATION</p><h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{application.storeName}</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">관리자 판매자 기능 테스트용 신청입니다. 사업자 정보와 증빙서류는 요구하지 않습니다.</p></div><span className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-black text-violet-800 dark:bg-violet-950 dark:text-violet-200">{STATUS[application.status]}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white/80 p-4 dark:bg-slate-900/80"><p className="text-xs font-bold text-slate-500">증빙서류</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">제출 면제</p></div><div className="rounded-xl bg-white/80 p-4 dark:bg-slate-900/80"><p className="text-xs font-bold text-slate-500">판매점 공개</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">내부 테스트 전용</p></div><div className="rounded-xl bg-white/80 p-4 dark:bg-slate-900/80"><p className="text-xs font-bold text-slate-500">심사 결과</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString('ko-KR') : '최고관리자 검토 전'}</p></div></div>{application.rejectionReason ? <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">반려 사유: {application.rejectionReason}</p> : null}{application.status === 'APPROVED' ? <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">관리자 역할을 유지한 채 판매자 기능이 활성화되었습니다. <Link to="/seller" className="font-black underline">판매자 대시보드</Link>에서 운영 설정을 확인해 주세요.</div> : null}</section>
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">SELLER APPLICATION</p><h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{application.storeName} 판매자 신청</h1><p className="mt-2 text-sm text-slate-500">{application.cityName} {application.districtName} · {application.handledItems.join(', ')}</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-700 dark:bg-brand-950/50 dark:text-brand-200">{STATUS[application.status]}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">사업자등록증</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{application.certificateSubmitted ? '제출 완료' : '제출 필요'}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">통장사본</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{application.bankAccountCopySubmitted ? '제출 완료' : '제출 필요'}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500">심사 결과</p><p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString('ko-KR') : '검토 전'}</p></div></div>{application.rejectionReason ? <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">반려 사유: {application.rejectionReason}</p> : null}{application.status === 'APPROVED' ? <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">판매자 계정이 활성화되었습니다. <Link to="/seller" className="font-black underline">판매자 대시보드</Link>에서 운영 설정을 확인해 주세요.</div> : null}</section>
}

function DocumentSelectCard({ kind, file, error, onChoose }: { kind: DocumentKind; file: File | null; error: string; onChoose: (file: File | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return <article onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); onChoose(event.dataTransfer.files?.[0] ?? null) }} className={`rounded-2xl border-2 border-dashed p-5 transition ${dragging ? 'border-brand-500 bg-brand-50' : file ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-900 dark:text-white">{LABEL[kind]}</h2><p className="mt-1 text-xs leading-5 text-slate-500">JPG·PNG · 100KB~10MB · 짧은 변 800px 이상</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-black ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{file ? '선택 완료' : '필수 첨부'}</span></div><input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={event => onChoose(event.target.files?.[0] ?? null)} className="hidden" /><div className="mt-5 text-center"><p className="text-sm font-bold text-slate-700 dark:text-slate-200">파일을 여기로 끌어다 놓으세요</p><p className="mt-1 text-xs text-slate-500">또는 파일 찾기로 이미지 경로를 선택할 수 있습니다.</p><button type="button" onClick={() => inputRef.current?.click()} className="mt-4 min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">파일 찾기</button></div>{file ? <div className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><p className="truncate font-bold text-slate-800 dark:text-white">{file.name}</p><p className="mt-1">{(file.size / 1024).toFixed(0)}KB</p><button type="button" onClick={() => onChoose(null)} className="mt-2 text-brand-700 underline">선택 취소</button></div> : null}{error ? <p className="mt-3 text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p> : null}</article>
}

function ApplicationForm({ onSubmitted, profileName, profileEmail, profilePhone, defaultAddress }: {
  onSubmitted: (application: SellerApplication, notice: string) => void
  profileName: string
  profileEmail: string
  profilePhone: string
  defaultAddress: string
}) {
  const [form, setForm] = useState<SubmitSellerApplicationRequest>(INITIAL_FORM)
  const [files, setFiles] = useState<Record<DocumentKind, File | null>>({ business: null, bank: null })
  const [fileErrors, setFileErrors] = useState<Record<DocumentKind, string>>({ business: '', bank: '' })
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof SubmitSellerApplicationRequest>(key: K, value: SubmitSellerApplicationRequest[K]) => setForm(current => ({ ...current, [key]: value }))
  const applyKakaoAddress = async (address: string) => {
    try {
      const resolved = await regionApi.resolve(address)
      setForm(current => ({ ...current, cityName: resolved.cityName, districtName: resolved.districtName, address: resolved.normalizedAddress }))
      setNotice('카카오 주소와 서비스 지역이 확인되었습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '서비스 지역을 확인하지 못했습니다.')
    }
  }
  useEffect(() => {
    setForm(current => ({ ...current, representativeName: current.representativeName || profileName, phone: current.phone || profilePhone }))
  }, [profileName, profilePhone])
  useEffect(() => {
    if (defaultAddress && !form.address) void applyKakaoAddress(defaultAddress)
  // 기본 배송지는 최초 1회만 판매자 신청 주소의 초깃값으로 사용한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAddress])
  const choose = async (kind: DocumentKind, next: File | null) => {
    if (!next) { setFiles(current => ({ ...current, [kind]: null })); setFileErrors(current => ({ ...current, [kind]: '' })); return }
    const error = await validateImage(next)
    if (error) { setFiles(current => ({ ...current, [kind]: null })); setFileErrors(current => ({ ...current, [kind]: error })); return }
    setFiles(current => ({ ...current, [kind]: next })); setFileErrors(current => ({ ...current, [kind]: '' }))
  }
  const submit = async () => {
    const required = ['storeName', 'representativeName', 'businessRegistrationNumber', 'districtName', 'address', 'phone'] as const
    if (required.some(key => !form[key].trim())) { setNotice('필수 정보를 모두 입력해 주세요.'); return }
    if (!files.business || !files.bank) { setNotice('사업자등록증과 통장사본 이미지를 모두 첨부해 주세요.'); return }
    if (fileErrors.business || fileErrors.bank) { setNotice('첨부 이미지 기준을 다시 확인해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      const created = await sellerApplicationApi.submit({ ...form, businessOpenedOn: form.businessOpenedOn || undefined })
      try {
        const afterBusiness = await sellerApplicationApi.uploadCertificate(created.id, files.business)
        const completed = await sellerApplicationApi.uploadBankAccountCopy(afterBusiness.id, files.bank)
        onSubmitted(completed, '판매자 신청과 두 증빙 문서 제출이 완료되었습니다. 관리자가 검토합니다.')
      } catch (error) {
        onSubmitted(created, error instanceof Error ? '판매자 신청은 저장됐지만 일부 문서 업로드에 실패했습니다. 아래 제출 영역에서 다시 업로드해 주세요.' : '판매자 신청은 저장됐지만 일부 문서 업로드에 실패했습니다.')
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : '판매자 신청에 실패했습니다.') } finally { setSaving(false) }
  }
  const input = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-black tracking-wider text-brand-600">SELLER ONBOARDING</p><h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">판매자 가입 신청</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">사업자 기본 정보와 필수 증빙 이미지를 한 번에 제출하면 관리자가 검토합니다.</p><div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm dark:border-brand-900/60 dark:bg-brand-950/20"><p className="font-black text-slate-900 dark:text-white">로그인 계정 정보로 기본값을 채웠습니다.</p><p className="mt-1 text-slate-600 dark:text-slate-300">{profileName || '이름 미등록'} · {profileEmail}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">대표자명·연락처는 회원 정보에서, 사업장 주소는 기본 배송지 또는 카카오 주소 선택값에서 가져옵니다.</p></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">판매점 이름<input className={input} value={form.storeName} onChange={event => update('storeName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">대표자명<input className={input} value={form.representativeName} onChange={event => update('representativeName', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">사업자등록번호<input className={input} inputMode="numeric" placeholder="123-45-67890" value={form.businessRegistrationNumber} onChange={event => update('businessRegistrationNumber', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">개업일<input className={input} type="date" value={form.businessOpenedOn ?? ''} onChange={event => update('businessOpenedOn', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">시·도<input className={input} value={form.cityName} readOnly aria-readonly="true" /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">시·군·구<input className={input} value={form.districtName} readOnly aria-readonly="true" /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 md:col-span-2">사업장 주소<div className="flex flex-wrap gap-2"><input className={input + ' min-w-0 flex-1'} value={form.address} readOnly aria-readonly="true" placeholder="카카오 주소·장소명 찾기로 선택해 주세요." /><KakaoAddressSearchButton onSelect={(selected) => void applyKakaoAddress(selected.roadAddress || selected.address)} /></div><p className="text-xs font-normal leading-5 text-slate-500">주소를 직접 입력하지 않으며, 선택한 카카오 주소를 전국 시군구 서비스 지역 코드로 확인합니다.</p></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">연락처<input className={input} inputMode="tel" value={form.phone} onChange={event => update('phone', event.target.value)} /></label><label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">취급 품목<input className={input} value={form.handledItems ?? ''} onChange={event => update('handledItems', event.target.value)} /></label></div><div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800"><div><p className="text-xs font-black tracking-wider text-brand-600">REQUIRED DOCUMENTS</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">필수 첨부 서류</h2><p className="mt-2 text-sm text-slate-500">사업자등록증과 통장사본을 모두 선택해야 신청을 접수할 수 있습니다.</p></div><div className="mt-4 grid gap-4 md:grid-cols-2"><DocumentSelectCard kind="business" file={files.business} error={fileErrors.business} onChoose={file => void choose('business', file)} /><DocumentSelectCard kind="bank" file={files.bank} error={fileErrors.bank} onChoose={file => void choose('bank', file)} /></div></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-xs leading-5 text-slate-500">증빙 문서는 비공개 저장소에 보관되며, 관리자 심사 목적으로만 조회됩니다.</p><button type="button" disabled={saving} onClick={() => void submit()} className="min-h-11 rounded-xl bg-brand-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? '신청 및 문서 저장 중' : '판매자 신청 접수'}</button></div>{notice ? <p role="status" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{notice}</p> : null}</section>
}

function InternalAdministratorApplicationForm({ onSubmitted }: { onSubmitted: (application: SellerApplication, notice: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const submit = async () => {
    if (!confirming) { setConfirming(true); return }
    setSaving(true); setNotice('')
    try {
      const application = await sellerApplicationApi.submitInternalAdministrator()
      onSubmitted(application, '관리자 판매자 신청이 심사 대기로 접수되었습니다. 최고관리자가 내부 테스트 판매점 생성을 검토합니다.')
    } catch (error) { setNotice(error instanceof Error ? error.message : '관리자 판매자 신청에 실패했습니다.') } finally { setSaving(false) }
  }
  return <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/20"><p className="text-xs font-black tracking-wider text-violet-700 dark:text-violet-300">ADMIN SELLER TEST</p><h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">관리자 판매자 신청</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">내부 운영 테스트용 판매점 신청입니다. 사업자등록 정보와 증빙서류는 제출하지 않으며, 최고관리자가 심사 대기열에서 확인한 뒤 강제 승인합니다.</p><div className="mt-5 rounded-xl border border-violet-200 bg-white/80 p-4 text-sm text-slate-700 dark:border-violet-900/70 dark:bg-slate-900/80 dark:text-slate-200"><strong className="font-black">승인 후에도 관리자 역할과 등급은 유지됩니다.</strong><p className="mt-1">판매점은 내부 테스트 전용으로 생성되며 공개 판매점 목록에는 노출되지 않습니다.</p></div><div className="mt-6 flex flex-wrap items-center gap-3">{confirming && <p className="w-full rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">내부 테스트 판매점 신청을 만들고 최고관리자 심사로 넘기겠습니까?</p>}<button type="button" disabled={saving} onClick={() => void submit()} className="guide-cta-primary disabled:cursor-not-allowed disabled:opacity-50">{saving ? '신청 생성 중' : confirming ? '관리자 판매자 신청 확정' : '관리자 판매자 신청하기'}</button>{confirming && <button type="button" disabled={saving} onClick={() => setConfirming(false)} className="guide-cta-secondary">취소</button>}</div>{notice ? <p role="status" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{notice}</p> : null}</section>
}

function AdministratorApplicationUnavailable() {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-black tracking-wider text-slate-500">ADMIN SELLER TEST</p><h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">관리자 판매자 신청 권한이 없습니다</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">최고관리자에게 <strong>판매자 신청</strong> 토글을 부여받으면, 사업자 정보와 증빙 없이 내부 테스트 판매점 심사를 신청할 수 있습니다.</p><Link to="/my" className="guide-cta-secondary mt-6 inline-flex">마이철수로 돌아가기</Link></section>
}

export function SellerApplicationPage() {
  const { user } = useAuth()
  const mine = useAsync<SellerApplication>(() => sellerApplicationApi.mine(), [])
  const profile = useAsync(() => userApi.mine(), [user?.id])
  const addresses = useAsync(() => deliveryAddressApi.list(), [user?.id])
  const permissions = useAsync<FeaturePermissionView[]>(() => user?.role === 'ADMIN' ? userApi.myFeaturePermissions() : Promise.resolve([]), [user?.id, user?.role])
  const [application, setApplication] = useState<SellerApplication | null>(null)
  const [applicationNotice, setApplicationNotice] = useState('')
  useEffect(() => { if (mine.data) setApplication(mine.data) }, [mine.data])
  const noApplication = mine.error instanceof ApiError && mine.error.status === 404
  const canApplyAsAdministrator = user?.role === 'ADMIN' && (user.adminLevel === 'HIGHEST' || Boolean(permissions.data?.some(permission => permission.code === 'CONSUMER_SELLER_APPLICATION' && permission.enabled)))
  const defaultAddress = addresses.data?.find(address => address.defaultAddress)?.fullAddress ?? ''

  if (mine.loading && !mine.data) return <div className="page"><LoadingView label="판매자 신청 상태를 불러오는 중입니다" /></div>
  if (mine.error && !noApplication && !application) return <div className="page"><ErrorView error={mine.error} onRetry={mine.reload} /></div>
  if (!application && user?.role === 'ADMIN' && permissions.loading && user.adminLevel !== 'HIGHEST') return <div className="page"><LoadingView label="관리자 판매자 신청 권한을 확인하는 중입니다" /></div>
  if (!application && user?.role === 'ADMIN' && permissions.error && user.adminLevel !== 'HIGHEST') return <div className="page"><ErrorView error={permissions.error} onRetry={permissions.reload} /></div>

  return <main className="mx-auto max-w-4xl px-4 py-8 md:py-12"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">CHULSOO-YA PARTNER</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">판매자 등록</h1></div><Link to="/my" className="guide-cta-secondary">마이철수로 돌아가기</Link></div>{application ? <><ApplicationStatus application={application} />{applicationNotice ? <p role="status" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{applicationNotice}</p> : null}{!application.internalAdminApplication && <section className="mt-6 grid gap-4 md:grid-cols-2"><DocumentDropUpload kind="business" submitted={application.certificateSubmitted} application={application} onUploaded={setApplication} /><DocumentDropUpload kind="bank" submitted={application.bankAccountCopySubmitted} application={application} onUploaded={setApplication} /></section>}</> : user?.role === 'ADMIN' ? canApplyAsAdministrator ? <InternalAdministratorApplicationForm onSubmitted={(next, notice) => { setApplication(next); setApplicationNotice(notice) }} /> : <AdministratorApplicationUnavailable /> : <ApplicationForm onSubmitted={(next, notice) => { setApplication(next); setApplicationNotice(notice) }} profileName={profile.data?.name ?? user?.name ?? ''} profileEmail={profile.data?.email ?? user?.email ?? ''} profilePhone={profile.data?.phone ?? ''} defaultAddress={defaultAddress} />}</main>
}
