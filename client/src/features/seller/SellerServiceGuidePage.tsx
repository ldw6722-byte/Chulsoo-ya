import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { userApi } from '@/api/endpoints'
import { useAuth } from '@/app/useAuth'
import { useAsync } from '@/hooks/useAsync'
import type { MemberProfile } from '@/types/api'

const SECTIONS = [
  { id: 'overview', label: '판매자 운영 안내' },
  { id: 'apply', label: '지원 등록' },
  { id: 'operations', label: '운영 가이드' },
  { id: 'subscription', label: '구독 가이드' },
  { id: 'penalty', label: '신뢰·패널티' },
] as const

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-7"><p className="text-xs font-black tracking-[0.16em] text-brand-600 dark:text-brand-300">{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p></div>
}

const journey = [
  ['01', '지원 등록', '사업장 기본 정보와 사업자등록증·통장사본을 제출합니다.'],
  ['02', '운영자 검토', '제출 내용과 운영 가능 지역·품목을 확인한 뒤 판매자 계정을 승인합니다.'],
  ['03', '판매점 운영 설정', '영업시간, 정기 휴무, 찾아오시는 길을 관리해 고객에게 정확한 상태를 안내합니다.'],
  ['04', '주문 수신과 이행', '가용 슬롯 안에서 주문 제안을 받고, 재고 확인·이행 절차를 진행합니다.'],
] as const

export function SellerServiceGuidePage() {
  const location = useLocation()
  const { user } = useAuth()
  const profile = useAsync<MemberProfile>(() => userApi.mine(), [user?.id], { enabled: Boolean(user) })
  const hasSellerWorkflow = user?.role === 'SELLER' || Boolean(profile.data?.sellerWorkflowActive)
  const loginPath = (next: string) => `/auth/login?next=${encodeURIComponent(next)}`
  const sellerPath = (next: string) => !user ? loginPath(next) : hasSellerWorkflow ? next : '/seller/application'
  const applicationPath = !user ? loginPath('/seller/application') : hasSellerWorkflow ? '/seller' : '/seller/application'

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 0)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  return <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-slate-950 via-brand-900 to-violet-800 px-6 py-9 text-white shadow-lg dark:border-brand-500/40 md:px-10 md:py-12">
      <p className="text-xs font-black tracking-[0.18em] text-brand-100">CHULSOO-YA SELLER SERVICE</p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end"><div><h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">지역 고객의 주문을, 감당 가능한 운영 범위 안에서 받으세요.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-brand-50 sm:text-base">철수야 판매자 서비스는 판매점의 영업 상태와 가용 슬롯을 기준으로 주문 제안을 안내합니다. 판매자는 재고 확인과 이행에 집중하고, 운영 정보·구독·제한 이력은 한곳에서 확인할 수 있습니다.</p></div><div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm"><p className="text-xs font-bold text-brand-100">판매자 운영 흐름</p><p className="mt-2 text-sm font-black leading-6">지원 등록 → 검토·승인 → 운영 설정 → 주문 제안 → 재고 확인 → 이행</p></div></div>
    </section>

    <nav aria-label="판매자 서비스 가이드 탐색" className="sticky top-2 z-10 mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"><div className="flex min-w-max gap-2">{SECTIONS.map((item) => <Link key={item.id} to={`/seller-guide#${item.id}`} className="min-h-11 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-200">{item.label}</Link>)}</div></nav>

    <section id="overview" className="scroll-mt-28 py-12"><SectionHeading eyebrow="SELLER PARTNER" title="판매자 서비스" description="철수야는 판매점의 실제 영업 가능 상태와 가용량을 거래 흐름에 반영합니다. 무리한 주문 수신보다, 책임 있게 처리할 수 있는 주문을 받는 구조를 지향합니다." /><div className="grid gap-4 md:grid-cols-3">{[['지역 기반 주문 기회', '고객 주문은 배송지 기준으로 해당 지역의 운영 가능 판매자에게 안내됩니다.'], ['운영 상태의 정확한 안내', '영업시간·휴무·임시 휴무·찾아오시는 길을 관리해 고객에게 현재 상태를 정확히 표시합니다.'], ['처리 범위 안의 주문 수신', '가용 슬롯과 수신 상태를 기준으로 주문 제안이 배분되어 처리 중인 주문과 새 요청을 함께 관리할 수 있습니다.']].map(([title, text], index) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">0{index + 1}</p><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div></section>

    <section id="apply" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="SELLER ONBOARDING" title="판매자 지원 등록" description="판매점 정보와 필수 증빙을 제출하면 운영자가 검토합니다. 승인 후에 판매자 운영 화면, 구독 현황, 주문 제안과 처리 기능을 사용할 수 있습니다." /><div className="grid gap-4 md:grid-cols-4">{journey.map(([number, title, text]) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">{number}</p><h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-6 dark:border-brand-700/70 dark:bg-slate-900"><div><p className="text-sm font-black text-brand-900 dark:text-slate-100">준비할 정보</p><p className="mt-2 text-sm leading-6 text-brand-800 dark:text-slate-300">판매점명, 대표자명, 사업자등록번호, 사업장 주소·연락처, 취급 품목과 사업자등록증·통장사본 이미지가 필요합니다.</p></div><Link to={applicationPath} className="guide-cta-primary">판매자 등록 신청</Link></div></section>

    <section id="operations" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="OPERATIONS GUIDE" title="판매자 운영 가이드" description="승인된 판매자는 마이철수와 판매자 화면에서 주문 제안·진행 주문·운영 정보를 관리합니다. 주문을 받기 전에 현재 영업 상태와 처리 가능한 가용량을 먼저 확인해 주세요." /><div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-lg font-black text-slate-950 dark:text-white">주문 제안을 받았을 때</h3><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><li><strong className="text-brand-700 dark:text-brand-300">1. 조건 확인</strong> · 품목, 수량, 수령 방식, 마감 시각을 확인합니다.</li><li><strong className="text-brand-700 dark:text-brand-300">2. 응찰 결정</strong> · 실제 확보와 이행이 가능한 주문에만 응찰합니다.</li><li><strong className="text-brand-700 dark:text-brand-300">3. 재고 확인</strong> · 낙찰 후 화면에 표시된 기한 안에 재고·이행 가능 여부를 확정합니다.</li><li><strong className="text-brand-700 dark:text-brand-300">4. 주문 이행</strong> · 결제 완료 후 준비, 배송 또는 픽업 상태를 순서대로 갱신합니다.</li></ol></article><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-lg font-black text-slate-950 dark:text-white">슬롯 시스템 이해하기</h3><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">슬롯은 동시에 책임질 수 있는 주문 수를 뜻합니다. 서버는 <strong className="text-slate-900 dark:text-white">설정 슬롯 − 예약 슬롯 − 진행 슬롯</strong>으로 가용 슬롯을 계산하며, 가용 슬롯이 없거나 주문 수신을 중지하면 새 제안을 받지 않습니다.</p><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">처리량을 무리하게 높이기보다, 실제 인력·재고·배송 가능 범위에 맞춰 슬롯을 운영하는 것이 안전합니다.</p></article></div></section>

    <section id="subscription" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="SELLER MEMBERSHIP" title="판매자 구독 가이드" description="구독 등급은 새 주문 제안을 받는 순서와 최대 슬롯 상한에 반영됩니다. 실제 판매 중인 구독 상품의 가격·기간·최대 슬롯은 관리자 등록 상품과 승인 상태에 따라 달라질 수 있습니다." /><div className="grid gap-4 md:grid-cols-3">{[['프리미엄', '새 주문 제안을 가장 먼저 받습니다', '가장 빠른 주문 확인 기회와 등급별 최대 슬롯 상한을 제공합니다.'], ['골드', '새 주문 제안을 약 30초 후 받습니다', '상위 등급 판매점의 매칭이 끝나지 않은 주문을 이어서 제안받을 수 있습니다.'], ['실버', '새 주문 제안을 약 1분 후 받습니다', '남아 있는 주문을 확인하며 기본 운영을 시작할 수 있습니다.']].map(([tier, timing, text]) => <article key={tier} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">{tier}</p><h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{timing}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/60 p-6 dark:border-violet-900/70 dark:bg-violet-950/25"><p className="text-sm font-black text-violet-900 dark:text-violet-100">구독 전 확인할 점</p><p className="mt-2 text-sm leading-7 text-violet-800 dark:text-violet-200">구독은 새 주문 제안 우선순위와 최대 동시 주문 상한을 넓히는 운영 도구입니다. 현재 등급, 구독 만료일, 최대 슬롯과 가용 슬롯은 승인된 판매자 계정의 판매자 구독·운영 설정에서 확인합니다.</p><div className="mt-4 flex flex-wrap gap-3"><Link to={sellerPath('/seller/subscription')} className="guide-cta-primary">판매자 구독 확인</Link><Link to={sellerPath('/seller/settings')} className="guide-cta-secondary">현재 슬롯 확인</Link></div></div></section>

    <section id="penalty" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="TRUST & RESTRICTION" title="신뢰 점수와 패널티 운영" description="주문을 수락한 뒤 재고 확인이나 이행 약속을 지키지 못하면 고객 경험과 다른 판매자의 기회에 영향을 줄 수 있습니다. 철수야는 관련 이력을 기록하고 제한 상태를 판매자에게 투명하게 보여줍니다." /><div className="grid gap-4 md:grid-cols-3">{[['적용되는 상황', '낙찰 후 화면에 표시된 물품 확인 기한 안에 재고·이행 가능 여부를 확정하지 못하면, 해당 주문의 확인 만료 이력이 자동 기록됩니다.'], ['현재 적용 결과', '물품 확인 2분 만료 시 주문별 단일 패널티 이력, 신뢰 점수 -10점, 24시간 새 주문 응찰 제한이 적용됩니다. 제한 중에는 새 주문 제안을 받을 수 없습니다.'], ['예방과 확인', '가용 슬롯을 실제 처리량에 맞추고, 수신한 제안의 재고·인력·배송 가능 여부를 먼저 확인하세요. 적용 내역과 제한 해제 시각은 운영 설정의 패널티·제한 이력에서 확인합니다.']].map(([title, text], index) => <article key={title} className={`rounded-2xl border p-6 shadow-sm ${index === 1 ? 'border-rose-200 bg-rose-50/65 dark:border-rose-900/70 dark:bg-rose-950/25' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><p className={`text-sm font-black ${index === 1 ? 'text-rose-700 dark:text-rose-300' : 'text-brand-600 dark:text-brand-300'}`}>0{index + 1}</p><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900"><div><p className="text-sm font-black text-slate-950 dark:text-white">승인된 판매자는 마이철수에서 가이드를 다시 열 수 있습니다.</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">구독 현황, 최대 슬롯, 가용 슬롯, 패널티·제한 이력은 판매자 운영 화면에서 실제 서버 기준으로 확인합니다.</p></div><Link to="/my" className="guide-cta-secondary">마이철수로 이동</Link></div></section>
  </main>
}
