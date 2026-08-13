import { useEffect, useState } from 'react'
import { adminClaimApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import type { AdminClaimDecision, ClaimDetail, ClaimStatus, ClaimSummary } from '@/types/api'

const STATUS_OPTIONS: Array<[ClaimStatus, string]> = [['REQUESTED', '신규 요청'], ['SELLER_REVIEWING', '판매자 확인 중'], ['PICKUP_SCHEDULED', '회수 진행'], ['REPLACEMENT_SHIPPING', '재발송 진행'], ['ESCALATED', '관리자 중재'], ['RESOLVED', '처리 완료'], ['REJECTED', '기각']]
const DECISIONS: Array<[AdminClaimDecision, string]> = [['RESOLVE_NO_REFUND', '정산 해제 후 종결'], ['FULL_REFUND', '전액 환불 후 종결'], ['REJECT', '기각 후 정산 해제']]

export function ClaimManagementPanel() {
  const [status, setStatus] = useState<ClaimStatus>('REQUESTED')
  const claims = useAsync<ClaimSummary[]>(() => adminClaimApi.list(status), [status])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const detail = useAsync<ClaimDetail | null>(() => selectedId === null ? Promise.resolve(null) : adminClaimApi.detail(selectedId), [selectedId])
  const [decision, setDecision] = useState<AdminClaimDecision>('RESOLVE_NO_REFUND')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [documentContent, setDocumentContent] = useState('')
  const [documentLoading, setDocumentLoading] = useState(false)

  useEffect(() => { setSelectedId(claims.data?.[0]?.id ?? null) }, [claims.data])

  const loadDocument = async () => {
    if (selectedId === null) return
    setDocumentLoading(true); setNotice('')
    try { const document = await adminClaimApi.document(selectedId); setDocumentContent(document.content) } catch (error) { setNotice(error instanceof Error ? error.message : '처리 확인서를 불러오지 못했습니다.') } finally { setDocumentLoading(false) }
  }

  const resolve = async () => {
    if (selectedId === null || !note.trim()) { setNotice('관리자 결정 사유를 입력해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      await adminClaimApi.resolve(selectedId, { decision, note: note.trim() })
      setNotice('관리자 결정을 반영했습니다. 정산 상태와 환불 이력을 확인해 주세요.')
      setNote('')
      await Promise.all([claims.reload(), detail.reload()])
    } catch (error) { setNotice(error instanceof Error ? error.message : '클레임 결정 처리에 실패했습니다.') } finally { setSaving(false) }
  }

  return <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-rose-600">CLAIM OPERATIONS</p><h2 className="mt-1 text-lg font-black text-slate-900">클레임 운영 큐</h2></div><select value={status} onChange={(event) => setStatus(event.target.value as ClaimStatus)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold">{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{claims.loading && !claims.data ? <div className="mt-5"><LoadingView label="클레임을 불러오는 중입니다" /></div> : claims.error ? <div className="mt-5"><ErrorView error={claims.error} onRetry={claims.reload} /></div> : (claims.data?.length ?? 0) === 0 ? <div className="mt-5"><EmptyView title="해당 상태의 클레임이 없습니다" description="새 요청이 접수되면 여기에서 확인할 수 있습니다." /></div> : <ul className="mt-5 space-y-2">{(claims.data ?? []).map((claim) => <li key={claim.id}><button type="button" onClick={() => setSelectedId(claim.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedId === claim.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}><div className="flex items-center justify-between"><strong className="text-sm text-slate-900">주문 #{claim.orderId}</strong><span className="text-xs font-bold text-slate-500">{claim.claimType === 'RETURN' ? '반품' : claim.claimType === 'EXCHANGE' ? '교환' : '부분 교체'}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-600">{claim.description}</p><p className="mt-2 text-xs text-slate-500">{new Date(claim.createdAt).toLocaleString('ko-KR')}</p></button></li>)}</ul>}</article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{detail.loading && !detail.data ? <LoadingView label="클레임 상세를 불러오는 중입니다" /> : detail.error ? <ErrorView error={detail.error} onRetry={detail.reload} /> : detail.data ? <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-brand-600">ORDER #{detail.data.claim.orderId}</p><h2 className="mt-1 text-lg font-black text-slate-900">{detail.data.claim.reasonCode}</h2></div><span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">정산 {detail.data.settlementStatus === 'HOLD' ? '보류' : detail.data.settlementStatus}</span></div><p className="text-sm leading-6 text-slate-700">{detail.data.claim.description}</p><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">정산 보류 사유</p><p className="mt-1 text-sm text-slate-800">{detail.data.holdReason ?? '-'}</p></div><div><h3 className="text-sm font-black text-slate-900">증빙</h3>{detail.data.evidences.length ? <ul className="mt-2 space-y-1">{detail.data.evidences.map((evidence) => <li key={evidence.id} className="text-sm text-slate-600">{evidence.contentType} · {(evidence.byteSize / 1024 / 1024).toFixed(1)}MB</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">첨부된 증빙이 없습니다.</p>}</div><div><h3 className="text-sm font-black text-slate-900">처리 타임라인</h3><ul className="mt-2 space-y-2">{detail.data.events.map((event) => <li key={event.id} className="text-sm text-slate-600"><b className="text-slate-800">{event.actorRole}</b> · {event.detail}<span className="ml-2 text-xs text-slate-400">{new Date(event.createdAt).toLocaleString('ko-KR')}</span></li>)}</ul></div>{['RESOLVED', 'REJECTED'].includes(detail.data.claim.status) ? <div className="space-y-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => void loadDocument()} disabled={documentLoading} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 disabled:opacity-50">{documentLoading ? '문서 생성 중…' : '처리 확인서 보기'}</button>{documentContent ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">{documentContent}</pre> : null}</div> : null}{!['RESOLVED', 'REJECTED'].includes(detail.data.claim.status) ? <div className="space-y-3 border-t border-slate-100 pt-5"><h3 className="text-sm font-black text-slate-900">관리자 결정</h3><select value={decision} onChange={(event) => setDecision(event.target.value as AdminClaimDecision)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">{DECISIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder="판단 근거와 고객·판매자에게 전달할 안내를 입력해 주세요." /><button type="button" disabled={saving} onClick={() => void resolve()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? '처리 중…' : '결정 반영'}</button>{notice ? <p role="status" className="text-sm text-slate-600">{notice}</p> : null}</div> : null}</div> : <EmptyView title="클레임을 선택해 주세요" description="왼쪽 운영 큐에서 처리할 클레임을 선택하세요." />}</article></section>
}
