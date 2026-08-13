import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { orderApi, supportApi } from '@/api/endpoints'
import { LoadingView } from '@/components/StateViews'
import { useIdentity } from '@/app/useIdentity'
import { useAsync } from '@/hooks/useAsync'
import type { CustomerCenterData, OrderSummary, SupportFaqItem } from '@/types/api'

type SupportTab = 'inquiry' | 'faq' | 'voice' | 'returns'

const TABS: Array<{ id: SupportTab; label: string }> = [
  { id: 'inquiry', label: '문의내역' },
  { id: 'faq', label: '자주 묻는 질문' },
  { id: 'voice', label: '고객의 소리' },
  { id: 'returns', label: '취소 · 반품 안내' },
]

// ponytail: API 재기동 전에도 도움말을 읽을 수 있는 최소 안전 표시. FAQ API 응답이 복구되면 서버 데이터가 우선한다.
const FALLBACK_FAQS: SupportFaqItem[] = [
  { category: '주문', question: '주문한 상품의 매칭 상태는 어디에서 확인하나요?', answer: '마이철수 주문 내역에서 판매자 응찰, 낙찰, 물품 확인 상태를 확인할 수 있습니다.' },
  { category: '결제', question: '판매자 확인 전에도 결제할 수 있나요?', answer: '판매자가 재고와 품목을 확인한 뒤 결제 안내가 열립니다.' },
  { category: '취소·반품', question: '반품비용은 누가 부담하나요?', answer: '상품 하자·오배송은 판매점 부담을 원칙으로 하며, 단순 변심은 판매점 정책에 따라 안내됩니다.' },
  { category: '판매점', question: '가까운 판매점은 어떻게 찾나요?', answer: '메인의 판매점 찾기에서 시와 구를 선택하면 등록 판매점을 확인할 수 있습니다.' },
  { category: '배송', question: '배송 진행 상태는 어디에서 확인하나요?', answer: '판매자가 배송을 시작하면 마이철수 주문 내역에서 준비·배송 진행·완료 상태를 확인할 수 있습니다.' },
  { category: '고객센터', question: '고객센터 답변은 어디에서 확인하나요?', answer: '고객센터 문의내역과 고객 알림에서 답변과 처리 상태를 확인할 수 있습니다.' },
]

const STATUS_LABEL = { OPEN: '접수', IN_PROGRESS: '처리 중', ANSWERED: '답변 완료', CLOSED: '처리 완료' } as const

function tabFromHash(hash: string): SupportTab {
  if (hash === '#faq') return 'faq'
  if (hash === '#voice') return 'voice'
  if (hash === '#returns' || hash === '#guide') return 'returns'
  return 'inquiry'
}

function FaqRows({ faqs, query, onQueryChange }: { faqs: SupportFaqItem[]; query: string; onQueryChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const filtered = useMemo(() => faqs.filter((faq) => `${faq.category} ${faq.question} ${faq.answer}`.includes(query.trim())), [faqs, query])
  const visible = expanded ? filtered : filtered.slice(0, 8)
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black tracking-wider text-brand-600">FAQ</p><h2 className="mt-1 text-2xl font-black text-slate-900">자주 묻는 질문</h2></div><label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 sm:w-72"><span className="text-brand-600">⌕</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="궁금한 내용을 검색해 보세요" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /></label></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{visible.map((faq) => <details key={`${faq.category}-${faq.question}`} className="group border-b border-slate-100 last:border-b-0"><summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-sm text-slate-900"><span className="font-black text-brand-600">Q</span><span className="flex-1 font-medium">[{faq.category}] {faq.question}</span><span className="text-slate-400 transition group-open:rotate-180">⌄</span></summary><div className="flex gap-4 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700"><span className="font-black text-brand-600">A</span><p>{faq.answer}</p></div></details>)}{!visible.length ? <p className="p-10 text-center text-sm text-slate-500">검색 결과가 없습니다.</p> : null}</div>{filtered.length > 8 ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">{expanded ? '접기' : '더보기'} <span>{expanded ? '⌃' : '⌄'}</span></button> : null}</section>
}

function InquiryForm({ category, onSubmitted }: { category: string; onSubmitted: () => void | Promise<void> }) {
  const { identity } = useIdentity()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!title.trim() || !content.trim()) { setNotice('제목과 내용을 모두 입력해 주세요.'); return }
    setSaving(true); setNotice('')
    try {
      await supportApi.createInquiry({ category, title: title.trim(), content: content.trim() })
      setTitle(''); setContent(''); setNotice('문의가 접수되었습니다. 답변이 등록되면 알림으로 안내합니다.')
      await onSubmitted()
    } catch (error) { setNotice(error instanceof Error ? error.message : '문의 접수에 실패했습니다.') } finally { setSaving(false) }
  }
  if (!identity) return <div className="rounded-xl bg-slate-50 p-6"><p className="text-sm text-slate-600">문의 접수는 로그인 후 이용할 수 있습니다.</p><Link to="/auth/login?next=/support" className="mt-4 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white">로그인하고 문의하기</Link></div>
  return <div className="grid gap-3"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="문의 제목" className="h-11 rounded-lg border border-slate-300 px-3 text-sm" /><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={3000} placeholder="문의 내용을 입력해 주세요. 주문·결제·판매점과 관련된 경우 주문 번호나 판매점명을 함께 적어 주시면 더 빠르게 확인할 수 있습니다." className="min-h-48 rounded-lg border border-slate-300 p-3 text-sm leading-6" /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-500">답변은 고객센터와 알림에서 확인할 수 있습니다. 긴급한 거래 분쟁은 주문 상세의 클레임 접수를 이용해 주세요.</p><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-lg bg-brand-600 px-7 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? '접수 중' : '보내기'}</button></div>{notice ? <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{notice}</p> : null}</div>
}

function InquiryHistory({ center }: { center: CustomerCenterData | null }) {
  if (!center) return null
  return <section className="mt-8"><h3 className="text-lg font-black text-slate-900">최근 문의내역</h3><div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">{center.inquiries.slice(0, 5).map((inquiry) => <article key={inquiry.id} className="border-b border-slate-100 p-4 last:border-b-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold text-brand-600">{inquiry.category}</p><p className="mt-1 font-bold text-slate-900">{inquiry.title}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{STATUS_LABEL[inquiry.status]}</span></div>{inquiry.adminReply ? <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm leading-6 text-slate-700"><b className="text-brand-700">철수야 답변</b><p className="mt-1">{inquiry.adminReply}</p></div> : null}</article>)}{!center.inquiries.length ? <p className="p-8 text-center text-sm text-slate-500">최근 문의내역이 없습니다.</p> : null}</div></section>
}

function orderStatusText(status: OrderSummary['status']) {
  const map: Record<OrderSummary['status'], string> = { DRAFT: '작성 중', WAITING_MATCH: '매칭 대기', MATCHED: '판매자 매칭', SELLER_CONFIRMING: '재고 확인', PAYMENT_PENDING: '결제 대기', PAID: '결제 완료', PREPARING: '상품 준비', DELIVERY_IN_PROGRESS: '배송 중', PICKUP_READY: '픽업 준비', COMPLETED: '주문 완료', MATCH_FAILED: '매칭 실패', RE_MATCHING: '재매칭 중', CANCELLED: '취소' }
  return map[status]
}

function RecentOrderProducts({ orders, loading, failed }: { orders: OrderSummary[]; loading: boolean; failed: boolean }) {
  const recent = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  return <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black tracking-wider text-brand-600">SHOP AGAIN</p><div className="mt-1 flex items-end justify-between gap-3"><h2 className="text-xl font-black text-slate-900">최근 주문 상품</h2><Link to="/orders" className="text-xs font-bold text-brand-600 hover:underline">주문 전체보기</Link></div><p className="mt-2 text-sm leading-6 text-slate-500">최근 주문일 순으로 필요한 철물·공구를 다시 찾아보세요.</p>{loading ? <p className="mt-5 text-sm text-slate-500">최근 주문 상품을 불러오는 중입니다.</p> : failed ? <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-600">최근 주문 정보를 불러오지 못했습니다.</p><Link to="/orders" className="mt-3 inline-flex text-sm font-bold text-brand-600">마이철수 주문내역 보기 →</Link></div> : recent.length ? <div className="mt-5 space-y-3">{recent.map((order) => <article key={order.id} className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString('ko-KR')} 주문</p><div className="mt-2 flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-black text-brand-700">철</span><div className="min-w-0 flex-1"><Link to={`/orders/${order.id}`} className="line-clamp-1 text-sm font-black text-slate-900 hover:text-brand-700">{order.representativeProductName}</Link><p className="mt-1 text-xs text-slate-500">{order.itemCount}개 상품 · {orderStatusText(order.status)}</p><div className="mt-2 flex flex-wrap gap-2"><Link to={`/catalog?keyword=${encodeURIComponent(order.representativeProductName)}`} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white">다시 찾기</Link><Link to={`/orders/${order.id}`} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">주문 확인</Link></div></div></div></article>)}</div> : <div className="mt-5 rounded-xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-800">최근 주문 상품이 없습니다.</p><p className="mt-1 text-xs leading-5 text-slate-500">필요한 공구와 철물을 찾아 주문 매칭을 시작해 보세요.</p><Link to="/catalog" className="mt-4 inline-flex rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">공구 둘러보기</Link></div>}</aside>
}

function ReturnGuide() {
  return <section><div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8"><p className="text-xs font-black tracking-wider text-brand-600">ORDER SUPPORT</p><h2 className="mt-2 text-2xl font-black text-slate-900">쉽고 빠른 취소 · 반품</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">철수야는 판매자 물품 확인 전 주문 취소와, 결제 후 반품·교환·부분 교체 요청을 주문 상태에 맞춰 안내합니다.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{[{ no: '01', title: '주문을 취소하고 싶어요', text: '판매자 물품 확인 전에는 주문 상세에서 취소를 요청할 수 있습니다.' }, { no: '02', title: '반품비용은 누가 부담하나요?', text: '상품 하자·오배송은 판매점 부담, 단순 변심은 상품·판매점 정책에 따라 안내됩니다.' }, { no: '03', title: '반품 진행 과정을 알고 싶어요', text: '접수 → 판매점 확인 → 회수 또는 반품 발송 → 검수 → 환불 순서로 진행됩니다.' }].map((item) => <article key={item.no} className="rounded-xl bg-slate-50 p-5"><p className="font-black text-brand-600">{item.no}</p><h3 className="mt-2 font-black text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}</div></div><div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="grid grid-cols-2 bg-slate-800 px-5 py-3 text-xs font-bold text-white sm:grid-cols-4"><span>신청 단계</span><span>판매점 확인</span><span>회수·검수</span><span>환불·완료</span></div><div className="grid grid-cols-2 gap-y-5 px-5 py-6 text-sm text-slate-700 sm:grid-cols-4"><p>주문 상세에서 요청</p><p>판매점이 처리 방법 안내</p><p>회수 또는 반품 발송</p><p>결제 수단에 따라 환불</p></div></div><Link to="/orders" className="mt-6 inline-flex rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white">주문 내역에서 취소 · 반품 확인</Link></section>
}

export function CustomerSupportPage() {
  const location = useLocation()
  const { identity } = useIdentity()
  const [tab, setTab] = useState<SupportTab>(() => tabFromHash(location.hash))
  const [faqQuery, setFaqQuery] = useState('')
  const faq = useAsync<SupportFaqItem[]>(() => supportApi.faqs(), [])
  const center = useAsync<CustomerCenterData>(() => supportApi.center(), [identity?.userId], { enabled: Boolean(identity) })
  const recentOrders = useAsync<OrderSummary[]>(() => orderApi.list(), [identity?.userId], { enabled: Boolean(identity) })
  useEffect(() => { setTab(tabFromHash(location.hash)) }, [location.hash])
  const openTab = (next: SupportTab) => { setTab(next); window.history.replaceState(null, '', next === 'faq' ? '#faq' : next === 'voice' ? '#voice' : next === 'returns' ? '#returns' : '/support') }
  if (faq.loading && !faq.data) return <div className="page"><LoadingView label="고객센터를 준비하는 중입니다" /></div>

  return <main className="mx-auto max-w-6xl px-4 py-8 md:py-12"><section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-500"><div className="flex flex-wrap items-center gap-4 px-6 py-5 text-white md:px-8"><h1 className="mr-4 text-2xl font-black">고객센터</h1><label className="flex h-10 min-w-64 flex-1 items-center gap-2 rounded-lg bg-white px-3 text-slate-700"><input value={faqQuery} placeholder="자주 묻는 질문 검색" onChange={(event) => { setFaqQuery(event.target.value); setTab('faq'); window.history.replaceState(null, '', '#faq') }} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /><span className="text-brand-600">⌕</span></label><button type="button" onClick={() => openTab('inquiry')} className="rounded-lg border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-bold hover:bg-white/25">문의 남기기</button></div></section><nav className="flex overflow-x-auto border-b border-slate-200 bg-white px-2"><div className="flex min-w-max gap-1">{TABS.map((item) => <button key={item.id} type="button" onClick={() => openTab(item.id)} className={`border-b-2 px-4 py-4 text-sm font-bold transition ${tab === item.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>{item.label}</button>)}</div></nav>

    <section className="mt-8">{tab === 'faq' ? <FaqRows faqs={faq.data ?? FALLBACK_FAQS} query={faqQuery} onQueryChange={setFaqQuery} /> : null}{tab === 'returns' ? <ReturnGuide /> : null}{tab === 'inquiry' ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-black tracking-wider text-brand-600">ONE TO ONE</p><h2 className="mt-1 text-2xl font-black text-slate-900">고객센터 문의</h2><p className="mt-3 text-sm leading-6 text-slate-600">주문·결제·판매점·서비스 이용과 관련해 도움이 필요하면 문의를 남겨 주세요.</p><div className="mt-6"><InquiryForm category="ONE_TO_ONE" onSubmitted={center.reload} /></div><InquiryHistory center={center.data ?? null} /></section><RecentOrderProducts orders={recentOrders.data ?? []} loading={recentOrders.loading} failed={Boolean(recentOrders.error)} /></div> : null}{tab === 'voice' ? <section className="mx-auto max-w-3xl"><div className="rounded-2xl border border-slate-200 bg-white p-7 md:p-10"><p className="text-xs font-black tracking-wider text-brand-600">YOUR VOICE</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">철수야의 중심은 항상 <span className="text-brand-600">고객님</span>입니다.</h2><p className="mt-5 text-sm leading-7 text-slate-600">서비스를 이용하면서 불편했던 점, 개선이 필요한 점을 들려주세요. 고객님의 의견은 판매점 매칭과 주문 경험을 더 좋게 만드는 데 사용됩니다.</p><div className="mt-7"><InquiryForm category="VOICE" onSubmitted={center.reload} /></div></div></section> : null}</section></main>
}
