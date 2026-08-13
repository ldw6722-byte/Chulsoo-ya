import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { claimApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { ErrorView } from '@/components/StateViews'
import type { ClaimType } from '@/types/api'

const CLAIM_TYPES: Array<{ value: ClaimType; label: string; description: string }> = [
  { value: 'RETURN', label: '반품 요청', description: '상품 회수 후 환불이 필요한 경우' },
  { value: 'EXCHANGE', label: '교환 요청', description: '전체 상품을 동일 상품으로 교환하는 경우' },
  { value: 'PARTIAL_REPLACEMENT', label: '부분 교체', description: '누락·불량 품목만 재발송이 필요한 경우' },
]

const REASONS = [
  ['DEFECT', '상품 불량'], ['MISDELIVERY', '오배송'], ['MISSING_ITEM', '구성품·수량 누락'], ['CHANGE_OF_MIND', '단순 변심'], ['OTHER', '기타'],
] as const

export function ClaimRequestPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)
  const navigate = useNavigate()
  const [claimType, setClaimType] = useState<ClaimType>('RETURN')
  const [reasonCode, setReasonCode] = useState('DEFECT')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [complete, setComplete] = useState(false)

  const submit = async () => {
    if (!description.trim()) { setError(new ApiError('VALIDATION_ERROR', '요청 내용을 입력해 주세요.', 400)); return }
    setSubmitting(true); setError(null)
    try {
      const claim = await claimApi.create(id, { claimType, reasonCode, description: description.trim() })
      for (const file of files) await claimApi.uploadEvidence(claim.id, file)
      setComplete(true)
    } catch (cause) { setError(cause instanceof ApiError ? cause : new ApiError('UNKNOWN', '클레임 접수에 실패했습니다.', 500)) } finally { setSubmitting(false) }
  }

  if (complete) return <div className="page"><section className="card stack" style={{ padding: 'var(--sp-5)' }}><h1 className="section-title">클레임이 접수되었습니다</h1><p className="muted">판매자와 관리자가 함께 확인하며, 거래 정산은 처리 결과가 확정될 때까지 보류됩니다.</p><div className="row"><button type="button" className="btn btn-primary" onClick={() => navigate(`/orders/${id}`)}>주문 상세로 이동</button><Link to="/orders" className="btn btn-secondary">주문 목록</Link></div></section></div>

  return <div className="page stack"><div className="spread"><h1 className="section-title" style={{ fontSize: 'var(--fs-xl)', marginBottom: 0 }}>반품 · 교환 · 부분 교체 요청</h1><span className="subtle tabular">주문번호 {id}</span></div><section className="card stack" style={{ padding: 'var(--sp-4)' }}><h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>처리 유형</h2><div className="stack" style={{ gap: 'var(--sp-2)' }}>{CLAIM_TYPES.map((item) => <label key={item.value} className="row" style={{ padding: 'var(--sp-3)', border: `1px solid ${claimType === item.value ? 'var(--c-primary)' : 'var(--c-border)'}`, borderRadius: 'var(--r-md)' }}><input type="radio" name="claimType" checked={claimType === item.value} onChange={() => setClaimType(item.value)} /><span><strong>{item.label}</strong><br /><span className="subtle">{item.description}</span></span></label>)}</div></section><section className="card stack" style={{ padding: 'var(--sp-4)' }}><label className="stack" style={{ gap: 'var(--sp-2)' }}><span style={{ fontWeight: 700 }}>요청 사유</span><select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="field"><>{REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</></select></label><label className="stack" style={{ gap: 'var(--sp-2)' }}><span style={{ fontWeight: 700 }}>상세 내용</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={6} className="field" placeholder="문제 상품, 누락 수량, 원하는 처리 방법을 구체적으로 작성해 주세요." /><span className="subtle tabular">{description.length}/2000</span></label></section><section className="card stack" style={{ padding: 'var(--sp-4)' }}><label className="stack" style={{ gap: 'var(--sp-2)' }}><span style={{ fontWeight: 700 }}>사진·영상 증빙</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><span className="subtle">JPG, PNG, WEBP는 파일당 10MB, MP4는 파일당 30MB까지 첨부할 수 있습니다.</span></label>{files.length ? <ul className="stack" style={{ gap: 4 }}>{files.map((file) => <li key={`${file.name}-${file.lastModified}`} className="subtle">{file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB</li>)}</ul> : null}</section>{error ? <ErrorView error={error} onRetry={submit} /> : null}<div className="row"><button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void submit()}>{submitting ? '접수 중…' : '클레임 접수'}</button><Link to={`/orders/${id}`} className="btn btn-secondary">취소</Link></div></div>
}
