import SubscriptionManagementPanel from './SubscriptionManagementPanel'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/endpoints'
import { StoreManagementPanel } from './StoreManagementPanel'
import { ProductManagementPanel } from './ProductManagementPanel'
import { WorkflowMonitorPanel } from './WorkflowMonitorPanel'
import { SupportManagementPanel } from './SupportManagementPanel'
import { EventCampaignManagementPanel } from './EventCampaignManagementPanel'
import { EventAssetManagementPanel } from './EventAssetManagementPanel'
import { SellerApplicationManagementPanel } from './SellerApplicationManagementPanel'
import { PaymentManagementPanel } from './PaymentManagementPanel'
import { CouponManagementPanel } from './CouponManagementPanel'
import { UserManagementPanel } from './UserManagementPanel'
import { DevelopmentPaymentApprovalPanel } from './DevelopmentPaymentApprovalPanel'

import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { AdminOverview, OrderStatus } from '@/types/api'

type AdminView = 'overview' | 'orders' | 'stores' | 'users' | 'events' | 'applications' | 'catalog' | 'finance' | 'developmentPayments' | 'coupons' | 'subscriptions' | 'support'

const ADMIN_VIEW_STORAGE_KEY = 'chulsooya-admin-active-view'
const isAdminView = (value: string | null): value is AdminView => ['overview', 'orders', 'stores', 'users', 'applications', 'catalog', 'finance', 'developmentPayments', 'coupons', 'support'].includes(value ?? '')

type NavItem = {
  label: string
  view: AdminView
  detail: string
}

const NAVIGATION: Array<{ label: string; items: NavItem[] }> = [
  {
    label: '운영 현황',
    items: [
      { label: '대시보드 홈', view: 'overview', detail: '주문·매칭 현황' },
      { label: '주문 · 매칭', view: 'orders', detail: '대기·재입찰·진행 주문' },
    ],
  },
  {
    label: '플랫폼 관리',
    items: [
      { label: '상품 · 카테고리', view: 'catalog', detail: '1,600개 철물 카탈로그' },
      { label: '판매자 운영', view: 'stores', detail: '매장 승인·슬롯·응찰 제한' },
      { label: '구독상품 관리', view: 'subscriptions', detail: '상품 CRUD·등급·만료 이력' },
      { label: '회원 관리', view: 'users', detail: '구매자·판매자 회원정보·권한 확인' },
      { label: '판매자 신청 심사', view: 'applications', detail: '사업자등록증·승인·반려' },

            { label: '정산 · 환불', view: 'finance', detail: '결제·환불·정산 보류' },
      { label: '쿠폰 운영', view: 'coupons', detail: '무상 쿠폰 정책·회원 발행' },
      { label: '행사 · 이벤트 관리', view: 'events', detail: '행사 카테고리와 메인 히어로 노출 관리' },

    ],
  },
  {
    label: '개발 검증',
    items: [
      { label: '개발 결제 승인', view: 'developmentPayments', detail: '결제 대기 주문 임시 승인' },
    ],
  },
  {
    label: '고객 지원',
    items: [
      { label: '고객 문의 · 알림', view: 'support', detail: '1:1 문의·답변·고객 알림' },
    ],
  },
]

const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: '작성 중',
  WAITING_MATCH: '매칭 대기',
  MATCHED: '낙찰',
  SELLER_CONFIRMING: '판매자 확인',
  PAYMENT_PENDING: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '준비 중',
  DELIVERY_IN_PROGRESS: '배송 중',
  PICKUP_READY: '픽업 준비',
  COMPLETED: '완료',
  MATCH_FAILED: '매칭 실패',
  RE_MATCHING: '재입찰',
  CANCELLED: '취소',
}

const STATUS_TONE: Partial<Record<OrderStatus, string>> = {
  WAITING_MATCH: 'bg-amber-50 text-amber-700',
  SELLER_CONFIRMING: 'bg-orange-50 text-orange-700',
  RE_MATCHING: 'bg-violet-50 text-violet-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

const VIEW_TITLE: Record<AdminView, [string, string]> = {
  overview: ['운영 대시보드', '주문 매칭과 판매자 운영 현황을 한눈에 확인합니다.'],
  orders: ['주문 · 매칭', '매칭 대기, 판매자 확인, 재입찰 주문을 우선 관리합니다.'],
  stores: ['판매자 운영', '매장 승인, 응찰 제한, 가용 슬롯 상태를 확인합니다.'],
  users: ['회원 관리', '구매자·판매자의 저장된 회원정보와 역할을 확인합니다.'],
  events: ['행사 · 이벤트 관리', '행사 카테고리 생성, 상품 행사 적용, 메인 히어로 배너 노출을 관리합니다.'],  applications: ['판매자 신청 심사', '사업자 정보와 증빙 제출 상태를 검토하고 승인 또는 반려합니다.'],

  catalog: ['상품 · 카테고리', '철수야 철물 카탈로그와 분류 체계를 관리합니다.'],
    finance: ['정산 · 환불', '결제 현황과 정산·환불 운영 기준을 확인합니다.'],
  developmentPayments: ['개발 결제 승인', '개발 환경에서 결제 대기 주문을 임시 승인해 이후 주문 흐름을 검증합니다.'],
  coupons: ['쿠폰 운영', '무상 쿠폰 정책을 등록하고 회원에게 발행합니다.'],

  subscriptions: ['구독상품 관리', '구독 상품과 판매자 멤버십 등급·만료 이력을 관리합니다.'],
  support: ['고객 문의 · 알림', '고객 문의 답변과 처리 상태, 고객 알림 발송을 관리합니다.'],
}

const money = (value: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value)
const dateTime = (value: string) => new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

function MetricCard({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black ${tone}`}>{label.slice(0, 1)}</span><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div><p className="mt-4 text-sm font-black text-slate-900">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><p className="text-base font-black text-slate-800">{title}</p><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>
}

function RecentOrders({ overview }: { overview: AdminOverview }) {
  if (!overview.recentOrders.length) return <EmptyPanel title="최근 주문이 없습니다" description="주문이 접수되면 매칭 상태와 판매자 배정 현황이 이곳에 표시됩니다." />
  return <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500"><tr><th className="px-5 py-3">주문</th><th className="px-5 py-3">매칭 상태</th><th className="px-5 py-3">낙찰 매장</th><th className="px-5 py-3 text-right">금액</th><th className="px-5 py-3 text-right">접수 시각</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.recentOrders.map(order => <tr key={order.id} className="transition hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-slate-900">{order.representativeProductName}</p><p className="mt-1 text-xs text-slate-500">#{order.id} · {order.itemCount}개 품목</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${STATUS_TONE[order.status] ?? 'bg-blue-50 text-blue-700'}`}>{STATUS_LABEL[order.status]}</span></td><td className="px-5 py-4 text-slate-600">{order.winningStoreName ?? '배정 전'}</td><td className="px-5 py-4 text-right font-black text-slate-900">{money(order.totalAmount)}</td><td className="px-5 py-4 text-right text-xs text-slate-500">{dateTime(order.createdAt)}</td></tr>)}</tbody></table></div>
}

function StoreAttention({ overview }: { overview: AdminOverview }) {
  if (!overview.storeAttention.length) return <EmptyPanel title="확인이 필요한 판매자 매장이 없습니다" description="매장 승인, 응찰 제한, 가용 슬롯 상태가 안정적으로 유지되고 있습니다." />
  return <div className="space-y-3">{overview.storeAttention.map(store => <article key={store.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{store.name}</p><p className="mt-1 text-xs text-slate-500">{store.guCode} · 가용 슬롯 {store.availableSlots}</p></div><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">{store.state}</span></div><p className="mt-3 text-xs text-slate-500">신뢰 점수 {store.trustScore.toFixed(1)}점{store.restrictedUntil ? ` · 제한 종료 ${dateTime(store.restrictedUntil)}` : ''}</p></article>)}</div>
}

export function AdminOverviewPage() {
  const overview = useAsync<AdminOverview>(() => adminApi.overview(), [])
  const [activeView, setActiveView] = useState<AdminView>(() => {
    const savedView = window.sessionStorage.getItem(ADMIN_VIEW_STORAGE_KEY)
    return isAdminView(savedView) ? savedView : 'orders'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [title, description] = VIEW_TITLE[activeView]
  const matches = useMemo(() => NAVIGATION.flatMap(group => group.items).filter(item => item.label.includes(query) || item.detail.includes(query)), [query])

  if (overview.loading && !overview.data) return <div className="min-h-screen bg-slate-50 px-4 py-16"><LoadingView label="관리자 운영 데이터를 불러오는 중입니다" /></div>
  if (overview.error) return <div className="min-h-screen bg-slate-50 px-4 py-16"><ErrorView error={overview.error} onRetry={overview.reload} /></div>
  const data = overview.data
  if (!data) return null

  const selectView = (view: AdminView) => {
    window.sessionStorage.setItem(ADMIN_VIEW_STORAGE_KEY, view)
    setActiveView(view)
    setSidebarOpen(false)
  }
  const content = activeView === 'orders' ? <WorkflowMonitorPanel />
    : activeView === 'stores' ? <StoreManagementPanel />
    : activeView === 'users' ? <UserManagementPanel />
    : activeView === 'events' ? <><EventCampaignManagementPanel /><EventAssetManagementPanel /></>    : activeView === 'subscriptions' ? <SubscriptionManagementPanel />
    : activeView === 'applications' ? <SellerApplicationManagementPanel />
    : activeView === 'catalog' ? <div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-brand-600">CATALOG</p><p className="mt-3 text-4xl font-black text-slate-900">{data.summary.totalProductCount.toLocaleString()}</p><p className="mt-2 text-sm text-slate-500">등록된 철물·공구 상품</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-brand-600">CATEGORY</p><p className="mt-3 text-lg font-black text-slate-900">9대분류 · 32소분류</p><p className="mt-2 text-sm leading-6 text-slate-500">상품과 카테고리의 등록·수정 API는 운영 승인 워크플로우와 함께 연결합니다.</p></article></div>
        : activeView === 'finance' ? <div className="grid gap-4"><article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-brand-600">TODAY REVENUE</p><p className="mt-3 text-4xl font-black text-slate-900">{money(data.summary.todayRevenue)}</p><p className="mt-2 text-sm text-slate-500">결제 완료 기준 당일 매출</p></article><PaymentManagementPanel /></div>
    : activeView === 'developmentPayments' ? <DevelopmentPaymentApprovalPanel />
    : activeView === 'coupons' ? <CouponManagementPanel />
    : activeView === 'support' ? <SupportManagementPanel />
    : <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="오늘 주문" value={data.summary.todayOrderCount} detail="오늘 접수된 매칭 주문" tone="bg-blue-50 text-blue-700" /><MetricCard label="매칭 대기" value={data.summary.matchingOrderCount} detail="즉시 확인이 필요한 주문" tone="bg-amber-50 text-amber-700" /><MetricCard label="판매 상품" value={data.summary.totalProductCount.toLocaleString()} detail="철물·공구 카탈로그" tone="bg-violet-50 text-violet-700" /><MetricCard label="오늘 매출" value={money(data.summary.todayRevenue)} detail="결제 완료 기준" tone="bg-emerald-50 text-emerald-700" /></section><section className="mt-5 grid gap-4 lg:grid-cols-4">{[{ label: '상품 · 카테고리', detail: '카탈로그 점검', view: 'catalog' as const }, { label: '주문 · 매칭', detail: '대기 주문 처리', view: 'orders' as const }, { label: '판매자 운영', detail: '슬롯·신뢰 점수', view: 'stores' as const }, { label: '판매자 신청 심사', detail: '사업자 검토', view: 'applications' as const }, { label: '정산 · 환불', detail: '결제 운영 확인', view: 'finance' as const }, { label: '쿠폰 운영', detail: '무상 쿠폰 정책·발행', view: 'coupons' as const }, { label: '행사 · 이벤트 관리', detail: '행사 카테고리·히어로 배너', view: 'events' as const }, { label: '고객 문의 · 알림', detail: '민원 답변·고객 알림 처리', view: 'support' as const }].map(item => <button key={item.view} type="button" onClick={() => selectView(item.view)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"><p className="text-sm font-black text-slate-900">{item.label} <span className="float-right text-brand-600">→</span></p><p className="mt-2 text-xs text-slate-500">{item.detail}</p></button>)}</section><section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><p className="text-xs font-black text-brand-600">RECENT ORDERS</p><h2 className="mt-1 text-lg font-black text-slate-900">최근 주문</h2></div><button type="button" onClick={() => selectView('orders')} className="text-sm font-bold text-brand-600">전체 보기 →</button></div><RecentOrders overview={data} /></article><aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black text-rose-600">ATTENTION</p><h2 className="mt-1 text-lg font-black text-slate-900">판매자 운영 알림</h2><div className="mt-4"><StoreAttention overview={data} /></div></aside></section></>

  return <div className="admin-theme min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100"><div className="flex min-h-screen items-start"><aside className={`fixed inset-y-0 left-0 z-40 w-70 border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-16 items-center border-b border-slate-100 px-5"><Link to="/" className="text-xl font-black tracking-tight text-slate-900">철수야 <span className="text-brand-600">관리자</span></Link></div><div className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5">{NAVIGATION.map(group => <section key={group.label} className="mb-6"><p className="px-3 text-[11px] font-black tracking-wider text-slate-400">{group.label}</p><div className="mt-2 space-y-1">{group.items.map(item => <button key={item.view} type="button" onClick={() => selectView(item.view)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${activeView === item.view ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><span>{item.label}</span><span className="text-xs text-slate-400">›</span></button>)}</div></section>)}<div className="border-t border-slate-100 pt-4"><Link to="/" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">쇼핑몰 바로가기</Link><Link to="/seller" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">판매자 화면 보기</Link></div></div></aside>{sidebarOpen && <button type="button" aria-label="관리 메뉴 닫기" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}<main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8"><button type="button" aria-label="관리 메뉴 열기" onClick={() => setSidebarOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-lg lg:hidden">☰</button><div className="relative max-w-md flex-1"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="관리 메뉴 검색" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-brand-400 focus:bg-white" />{query && <div className="absolute top-11 z-30 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{matches.length ? matches.map(item => <button key={item.view} type="button" onClick={() => { selectView(item.view); setQuery('') }} className="block w-full px-4 py-3 text-left hover:bg-slate-50"><p className="text-sm font-bold text-slate-900">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></button>) : <p className="px-4 py-3 text-sm text-slate-500">일치하는 관리 메뉴가 없습니다.</p>}</div>}</div><div className="ml-auto flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:block">서버 시각 {dateTime(data.serverTime)}</span><ThemeToggle compact /><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">A</span></div></header><div className="mx-auto max-w-[1600px] p-4 md:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black tracking-wider text-brand-600">CHULSOO-YA OPERATIONS</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => selectView('orders')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50">매칭 대기 주문</button><button type="button" onClick={() => selectView('stores')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50">판매자 운영 알림</button></div></div>{activeView === 'catalog' ? <ProductManagementPanel /> : null}{content}</div></main></div></div>
}
