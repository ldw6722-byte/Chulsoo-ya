import { useEffect, useState } from 'react'
import { sellerClaimApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import type { ClaimDetail, ClaimSummary, SellerClaimAction } from '@/types/api'

const STATUS_LABEL: Record<ClaimSummary['status'], string> = {
  REQUESTED: '신규 요청', SELLER_REVIEWING: '판매자 확인 중', PICKUP_SCHEDULED: '회수 진행', REPLACEMENT_SHIPPING: '재발송 진행', ESCALATED: '관리자 중재', RESOLVED: '처리 완료', REJECTED: '기각',
}

const ACTIONS: Array<{ action: SellerClaimAction; label: string; tracking: boolean }> = [
  { action: 'ACKNOWLEDGE', label: '요청 확인', tracking: false },
  { action: 'SCHEDULE_PICKUP', label: '회수 지시', tracking: false },
  { action: 'SHIP_REPLACEMENT', label: '재발송 처리', tracking: true },
  { action: 'ESCALATE', label: '관리자 중재 요청', tracking: false },
]

export function SellerClaimsPage() {
  const claims = useAsync<ClaimSummary[]>(() => sellerClaimApi.list(), [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const detail = useAsync<ClaimDetail | null>(() => selectedId === null ? Promise.resolve(null) : sellerClaimApi.detail(selectedId), [selectedId])
  const [action, setAction] = useState<SellerClaimAction>('ACKNOWLEDGE')
  const [note, setNote] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { if (selectedId === null && claims.data?.length) setSelectedId(claims.data[0].id) }, [claims.data, selectedId])

  const submitAction = async () => {
    if (selectedId === null || !note.trim()) { setNotice('처리 내용을 입력해 주세요.'); return }
    if (action === 'SHIP_REPLACEMENT' && !trackingNumber.trim()) { setNotice('재발송 운송장 번호를 입력해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      await sellerClaimApi.action(selectedId, { action, note: note.trim(), trackingNumber: trackingNumber.trim() || undefined })
      setNote(''); setTrackingNumber(''); setNotice('처리 상태를 반영했습니다.')
      await Promise.all([claims.reload(), detail.reload()])
    } catch (error) { setNotice(error instanceof Error ? error.message : '클레임 처리에 실패했습니다.') } finally { setSaving(false) }
  }

  if (claims.loading && !claims.data) return <div className="page"><LoadingView label="클레임을 불러오는 중입니다" /></div>
  if (claims.error && !claims.data) return <div className="page"><ErrorView error={claims.error} onRetry={claims.reload} /></div>

  return <div className="page stack"><div><p className="subtle">SELLER CLAIM WORKSPACE</p><h1 className="section-title" style={{ fontSize: 'var(--fs-xl)' }}>클레임 처리</h1><p className="muted">신규 클레임은 거래 정산이 보류된 상태입니다. 회수·재발송 진행 상황을 정확히 기록해 주세요.</p></div><div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><section className="card stack" style={{ padding: 'var(--sp-4)' }}><h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>처리 대기 목록</h2>{(claims.data?.length ?? 0) === 0 ? <EmptyView title="처리할 클레임이 없습니다" description="새 클레임이 접수되면 이곳에 표시됩니다." /> : <ul className="stack" style={{ gap: 'var(--sp-2)' }}>{(claims.data ?? []).map((claim) => <li key={claim.id}><button type="button" onClick={() => setSelectedId(claim.id)} className="card" style={{ width: '100%', padding: 'var(--sp-3)', textAlign: 'left', borderColor: selectedId === claim.id ? 'var(--c-primary)' : undefined }}><strong>주문 #{claim.orderId}</strong><p className="subtle">{claim.claimType === 'RETURN' ? '반품' : claim.claimType === 'EXCHANGE' ? '교환' : '부분 교체'} · {STATUS_LABEL[claim.status]}</p><p className="subtle">{new Date(claim.createdAt).toLocaleString('ko-KR')}</p></button></li>)}</ul>}</section><section className="card stack" style={{ padding: 'var(--sp-4)' }}>{detail.loading && !detail.data ? <LoadingView label="상세 내용을 불러오는 중입니다" /> : detail.error ? <ErrorView error={detail.error} onRetry={detail.reload} /> : detail.data ? <><div className="spread"><h2 className="section-title" style={{ fontSize: 'var(--fs-base)' }}>주문 #{detail.data.claim.orderId}</h2><span className="badge badge-warning">정산 {detail.data.settlementStatus === 'HOLD' ? '보류' : detail.data.settlementStatus}</span></div><p><strong>요청 사유:</strong> {detail.data.claim.reasonCode}</p><p className="muted">{detail.data.claim.description}</p><section className="stack" style={{ gap: 'var(--sp-2)' }}><h3 style={{ fontSize: 'var(--fs-base)' }}>증빙 자료</h3>{detail.data.evidences.length ? <ul>{detail.data.evidences.map((evidence) => <li key={evidence.id} className="subtle">{evidence.contentType} · {(evidence.byteSize / 1024 / 1024).toFixed(1)}MB</li>)}</ul> : <p className="subtle">첨부된 증빙이 없습니다.</p>}</section><section className="stack" style={{ gap: 'var(--sp-2)' }}><h3 style={{ fontSize: 'var(--fs-base)' }}>처리 기록</h3>{detail.data.events.map((event) => <p key={event.id} className="subtle">{new Date(event.createdAt).toLocaleString('ko-KR')} · {event.detail}</p>)}</section>{!['RESOLVED', 'REJECTED'].includes(detail.data.claim.status) ? <section className="stack" style={{ gap: 'var(--sp-2)' }}><h3 style={{ fontSize: 'var(--fs-base)' }}>판매자 처리</h3><select className="field" value={action} onChange={(event) => setAction(event.target.value as SellerClaimAction)}>{ACTIONS.map((item) => <option key={item.action} value={item.action}>{item.label}</option>)}</select><textarea className="field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="소비자에게 전달될 처리 내용을 입력해 주세요." />{action === 'SHIP_REPLACEMENT' ? <input className="field" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="재발송 운송장 번호" /> : null}<button type="button" className="btn btn-primary" disabled={saving} onClick={() => void submitAction()}>{saving ? '반영 중…' : '처리 상태 반영'}</button>{notice ? <p role="status" className="subtle">{notice}</p> : null}</section> : null}</> : <EmptyView title="클레임을 선택해 주세요" description="왼쪽 목록에서 처리할 건을 선택하세요." />}</section></div></div>
}
