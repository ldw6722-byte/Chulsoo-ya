import { useState } from 'react'
import { storeReviewApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { StoreReview } from '@/types/api'

export function SellerReviewPanel() {
  const reviews = useAsync<StoreReview[]>(() => storeReviewApi.sellerList(), [])
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [notice, setNotice] = useState('')
  const save = async (review: StoreReview) => {
    const reply = (drafts[review.id] ?? review.sellerReply ?? '').trim()
    if (!reply) return
    try {
      await storeReviewApi.sellerReply(review.id, reply)
      setDrafts(previous => ({ ...previous, [review.id]: '' }))
      setNotice('대댓글을 저장했습니다.')
      await reviews.reload()
    } catch (error) { setNotice(error instanceof Error ? error.message : '대댓글 저장에 실패했습니다.') }
  }
  if (reviews.loading && !reviews.data) return <section className="mt-6"><LoadingView label="거래 후기를 불러오는 중입니다." /></section>
  if (reviews.error) return <section className="mt-6"><ErrorView error={reviews.error} onRetry={reviews.reload} /></section>
  return <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black tracking-wider text-brand-600">STORE REVIEWS</p><h2 className="mt-1 text-lg font-black text-slate-900">고객 거래 후기 · 대댓글 관리</h2></div><button type="button" onClick={reviews.reload} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">새로고침</button></div>{notice ? <p className="mx-5 mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">{notice}</p> : null}<div className="divide-y divide-slate-100">{(reviews.data ?? []).length ? (reviews.data ?? []).map(review => <article key={review.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-amber-500">★ {review.rating}.0 <span className="ml-2 text-xs text-slate-400">주문 #{review.orderId}</span></p><p className="mt-2 text-sm leading-6 text-slate-800">{review.comment}</p><p className="mt-2 text-xs text-slate-500">{review.consumerName} · {new Date(review.createdAt).toLocaleDateString('ko-KR')}</p></div></div><div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4"><p className="text-xs font-black text-brand-700">판매자 대댓글</p>{review.sellerReply ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.sellerReply}</p> : <p className="mt-2 text-sm text-slate-400">아직 대댓글을 등록하지 않았습니다.</p>}<div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={drafts[review.id] ?? review.sellerReply ?? ''} onChange={event => setDrafts(previous => ({ ...previous, [review.id]: event.target.value }))} maxLength={1000} placeholder="고객 후기에 답글을 남겨 주세요" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm" /><button type="button" onClick={() => void save(review)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700">대댓글 저장</button></div></div></article>) : <p className="p-10 text-center text-sm text-slate-500">등록된 거래 후기가 없습니다.</p>}</div></section>
}
