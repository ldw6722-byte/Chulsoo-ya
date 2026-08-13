import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { storeReviewApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'

const date = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))

export function StoreDetailPage() {
  const { storeId } = useParams()
  const id = Number(storeId)
  const detail = useAsync(() => storeReviewApi.detail(id), [id])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (detail.loading && !detail.data) return <div className="mx-auto max-w-6xl px-4 py-16"><LoadingView label="판매점 정보를 불러오는 중입니다" /></div>
  if (detail.error) return <div className="mx-auto max-w-6xl px-4 py-16"><ErrorView error={detail.error} onRetry={detail.reload} /></div>
  if (!detail.data) return null
  const data = detail.data
  const store = data.store
  const eligibility = data.eligibility

  const submit = async () => {
    if (!eligibility.eligible || !eligibility.orderId || !comment.trim()) return
    try {
      setSubmitting(true)
      setMessage(null)
      await storeReviewApi.create(store.id, { orderId: eligibility.orderId, rating, comment: comment.trim() })
      setComment('')
      setMessage('거래 후기가 등록되었습니다. 판매점 신뢰 점수에 반영됩니다.')
      await detail.reload()
    } catch {
      setMessage('후기를 등록하지 못했습니다. 거래 자격과 기간을 다시 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="min-h-[70vh] bg-slate-50 py-8"><div className="mx-auto max-w-6xl px-4"><Link to="/stores" className="text-sm font-bold text-slate-500 hover:text-brand-700">← 판매점 목록</Link><section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[minmax(0,1fr)_25rem]"><div className="min-h-72 bg-slate-100">{store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" /> : <div className="grid h-full min-h-72 place-items-center text-7xl text-slate-300">⚒</div>}</div><div className="p-7"><p className="text-xs font-black tracking-wider text-brand-600">CHULSOO-YA STORE</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{store.name}</h1><p className="mt-2 text-sm text-slate-500">{store.cityName} {store.districtName} · {store.address}</p><div className="mt-6 rounded-2xl bg-brand-50 p-5"><p className="text-sm font-bold text-brand-700">거래 후기 평점</p><p className="mt-1 text-3xl font-black text-slate-950">★ {data.averageRating.toFixed(1)} <span className="text-sm font-bold text-slate-500">/ 5.0 · {data.reviewCount}건</span></p></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-400">취급 품목</dt><dd className="mt-1 font-bold text-slate-800">{store.handledItems.join(' · ')}</dd></div><div><dt className="text-slate-400">주문 상태</dt><dd className="mt-1 font-bold text-slate-800">{store.receivingOrders ? '주문 수신 중' : '주문 미수신'}</dd></div><div><dt className="text-slate-400">가용 슬롯</dt><dd className="mt-1 font-bold text-slate-800">{store.availableSlots}건</dd></div><div><dt className="text-slate-400">연락처</dt><dd className="mt-1 font-bold text-slate-800">{store.phone}</dd></div></dl></div></div></section><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">REVIEWS</p><h2 className="mt-1 text-xl font-black text-slate-950">거래 후기</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">실거래 구매자만 작성</span></div><div className="mt-5 space-y-4">{data.reviews.length ? data.reviews.map(review => <article key={review.id} className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0"><div className="flex items-center justify-between"><p className="font-black text-amber-500">★ {review.rating}.0</p><p className="text-xs text-slate-400">{date(review.createdAt)}</p></div><p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p><p className="mt-2 text-xs text-slate-400">{review.consumerName} · 주문 #{review.orderId}</p></article>) : <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">아직 등록된 거래 후기가 없습니다.</div>}</div></section><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">WRITE REVIEW</p><h2 className="mt-1 text-xl font-black text-slate-950">거래 후기 작성</h2>{eligibility.eligible ? <><p className="mt-3 text-sm leading-6 text-slate-600">{eligibility.reason}<br />작성 기한: {eligibility.expiresAt ? date(eligibility.expiresAt) : '-'}</p><div className="mt-5 flex gap-1">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value}점`} onClick={() => setRating(value)} className={`text-3xl transition ${value <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</button>)}</div><textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={1000} placeholder="거래 경험과 상품·판매점 응대에 대한 의견을 남겨 주세요." className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-500" /><button type="button" disabled={submitting || !comment.trim()} onClick={submit} className="mt-3 h-12 w-full rounded-xl bg-brand-600 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? '등록 중...' : '후기 등록'}</button></> : <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{eligibility.reason}<Link to="/orders" className="mt-3 block font-black text-brand-700">주문 내역 확인 →</Link></div>}{message && <p className="mt-3 text-sm font-bold text-brand-700">{message}</p>}<p className="mt-5 text-xs leading-5 text-slate-400">후기는 거래 완료일 기준 20일 안에 주문별 한 번만 작성할 수 있습니다. 공개된 후기 평점은 판매점 신뢰 점수에 반영됩니다.</p></aside></div></div></main>
}
