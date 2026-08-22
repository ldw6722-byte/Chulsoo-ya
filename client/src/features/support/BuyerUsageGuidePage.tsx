import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const SECTIONS = [
  { id: 'order', label: '주문 방법' },
  { id: 'matching', label: '실시간 매칭' },
  { id: 'delivery', label: '배송·시간 지정' },
  { id: 'pickup', label: '픽업 수령' },
  { id: 'payment', label: '결제·주문 조회' },
] as const

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-7"><p className="text-xs font-black tracking-[0.16em] text-brand-600 dark:text-brand-300">{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p></div>
}

const orderSteps = [
  ['01', '품목과 수량을 고릅니다', '카테고리·검색으로 필요한 품목을 찾고, 규격과 수량을 확인해 장바구니에 담습니다.'],
  ['02', '수령 방식을 정합니다', '배송 또는 픽업 중 현장 상황에 맞는 방식을 고르고, 배송이면 정확한 현장 주소를 확인합니다.'],
  ['03', '희망 수령 시간을 남깁니다', '내일 현장처럼 시간 제약이 있다면 주문 요청사항에 원하는 수령 시간과 현장 조건을 구체적으로 적습니다.'],
  ['04', '판매자 찾기를 시작합니다', '주문 요청 뒤 서버가 운영 가능한 판매자를 찾습니다. 이 단계에서는 아직 결제되지 않습니다.'],
] as const

export function BuyerUsageGuidePage() {
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 0)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  return <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-slate-950 via-brand-900 to-violet-800 px-6 py-9 text-white shadow-lg dark:border-brand-500/40 md:px-10 md:py-12">
      <p className="text-xs font-black tracking-[0.18em] text-brand-100">CHULSOO-YA BUYER GUIDE</p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end"><div><h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">현장에 필요한 철물, 필요한 시간에 받는 방법</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-brand-50 sm:text-base">철수야는 여러 판매점에 직접 전화하기 전에 주문 조건을 정리하고, 운영 가능한 지역 판매자를 서버 기준으로 연결합니다. 주문 요청과 결제는 분리되어 있으며, 판매자 재고 확인이 끝난 뒤에만 결제가 열립니다.</p></div><div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm"><p className="text-xs font-bold text-brand-100">주문 전 확인</p><p className="mt-2 text-sm font-black leading-6">품목·수량 · 현장 주소 · 배송/픽업 · 원하는 수령 시간 · 현장 요청사항</p></div></div>
    </section>

    <nav aria-label="구매자 사용방법 탐색" className="sticky top-2 z-10 mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"><div className="flex min-w-max gap-2">{SECTIONS.map((item) => <Link key={item.id} to={`/guide#${item.id}`} className="min-h-11 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-200">{item.label}</Link>)}</div></nav>

    <section id="order" className="scroll-mt-28 py-12"><SectionHeading eyebrow="ORDER BASICS" title="주문은 이렇게 시작합니다" description="원하는 품목을 장바구니에 담은 뒤, 수령 방식과 현장 정보를 확인하고 판매자 찾기를 요청합니다. 수량·주소·필수 동의가 맞지 않으면 주문 요청은 시작되지 않습니다." /><div className="grid gap-4 md:grid-cols-4">{orderSteps.map(([number, title, text]) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">{number}</p><h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-6 dark:border-brand-700/70 dark:bg-slate-900"><div><p className="text-sm font-black text-brand-900 dark:text-slate-100">중요: 주문 요청 시 바로 결제되지 않습니다.</p><p className="mt-2 text-sm leading-6 text-brand-800 dark:text-slate-300">판매자 매칭과 재고 확인이 완료된 주문만 다음 결제 단계로 이동합니다.</p></div><Link to="/catalog" className="guide-cta-primary">품목 찾아보기</Link></div></section>

    <section id="matching" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="LIVE MATCHING" title="실시간 매칭에서 기다리는 이유" description="철수야는 주문을 받은 즉시 판매자를 확정하지 않습니다. 지역·운영 상태·가용량을 서버가 확인한 뒤, 실제로 처리 가능한 판매자의 재고 확인을 거쳐 결제 가능 상태를 안내합니다." /><div className="grid gap-4 md:grid-cols-4">{[['요청 접수', '주문 조건이 서버에 저장되고, 주문 상세에서 현재 상태를 확인할 수 있습니다.'], ['판매자 매칭', '서버 기준으로 최대 5분 동안 운영 가능한 판매자를 찾습니다.'], ['재고·이행 확인', '낙찰 판매자는 2분 안에 실제 재고와 배송 또는 픽업 가능 여부를 확인합니다.'], ['결제 준비', '판매자 확인이 끝나면 결제 가능한 주문으로 전환되고 알림과 주문 상세에서 안내합니다.']].map(([title, text], index) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">0{index + 1}</p><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/70 dark:bg-amber-950/25"><p className="text-sm font-black text-amber-800 dark:text-amber-200">매칭이 바로 끝나지 않아도 주문 상세에서 상태를 확인해 주세요.</p><p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">판매자 거절 또는 확인 시간 초과로 매칭이 어려우면, 주문 상세가 다음 안내를 보여 드립니다. 결제 가능하다는 허위 안내는 표시하지 않습니다.</p></div></section>

    <section id="delivery" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="DELIVERY AT THE JOB SITE" title="내일 급한 현장, 원하는 시간에 받으려면" description="배송 주문은 현장 주소와 요청사항이 정확해야 판매자가 가능한 이행 시간을 판단할 수 있습니다. 화면에 확정 도착 시각이 표시되기 전에는 요청 시간은 희망 조건이며, 판매자 재고·운영·이행 확인 뒤 주문 상세의 상태를 기준으로 확인해야 합니다." /><div className="grid gap-4 md:grid-cols-3">{[['주소는 현장 기준으로', '자재를 받을 실제 현장 주소와 동·호수, 출입 방법, 연락 가능한 번호를 확인합니다. 주소가 다르면 판매 가능 판매자를 찾는 지역 기준도 달라집니다.'], ['시간은 구체적으로', '“내일 오전 작업 시작 전”, “오후 2시 이전”처럼 날짜·시간·현장 마감 조건을 요청사항에 구체적으로 남깁니다.'], ['예정과 확정을 구분', '판매자 확인 전에는 도착 보장을 약속하지 않습니다. 결제 가능 전환과 주문 상세의 이행 상태를 확인한 뒤 현장 작업을 확정해 주세요.']].map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div></section>

    <section id="pickup" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="PICKUP ORDER" title="직접 수령이 더 빠를 때는 픽업을 선택하세요" description="가까운 판매점에 직접 들를 수 있다면 주문 단계에서 픽업을 선택합니다. 판매자 확인과 결제가 끝난 뒤에만 준비·수령 상태를 기준으로 방문해 주세요." /><div className="grid gap-4 md:grid-cols-3">{[['01', '픽업으로 주문 요청', '장바구니에서 픽업을 선택하고, 필요한 수령 시간이나 차량·상차 관련 요청을 남깁니다.'], ['02', '판매자 확인 뒤 결제', '판매자가 재고와 이행 가능 여부를 확인한 뒤 결제 단계가 열립니다. 결제 전에는 방문하지 마세요.'], ['03', '준비 상태를 확인', '주문 상세와 알림에서 픽업 준비·수령 상태를 확인한 뒤 판매점 안내에 따라 방문합니다.']].map(([number, title, text]) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">{number}</p><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div></section>

    <section id="payment" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="PAYMENT & TRACKING" title="결제는 판매자 확인 뒤, 주문 상태는 마이철수에서" description="판매자 재고 확인이 완료되면 최종 주문 요약과 결제 수단이 열립니다. 결제 요청은 중복 처리되지 않도록 보호되며, 결제 뒤에는 주문 상세에서 배송·픽업 이력과 고객 안내를 확인할 수 있습니다." /><div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-lg font-black text-slate-950 dark:text-white">결제 전 마지막 확인</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><li>· 판매자 확인이 완료되어 결제 가능한 주문인지 확인합니다.</li><li>· 수령 방식, 주소, 수량, 쿠폰 반영 금액과 요청사항을 다시 확인합니다.</li><li>· 결제 버튼은 한 번만 누르고, 처리 중 화면을 새로 고치거나 중복 제출하지 않습니다.</li></ul></article><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-lg font-black text-slate-950 dark:text-white">주문 조회와 도움 요청</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><li>· 마이철수의 주문 조회에서 현재 단계와 이전 이력을 확인합니다.</li><li>· 상태 변경 알림을 누르면 해당 주문의 상세 정보로 이동합니다.</li><li>· 문제가 생기면 주문 상세의 안내 또는 고객센터에서 문의·클레임 절차를 진행합니다.</li></ul></article></div><div className="mt-6 flex flex-wrap gap-3"><Link to="/cart" className="guide-cta-primary">장바구니로 이동</Link><Link to="/orders" className="guide-cta-secondary">주문 조회</Link><Link to="/support" className="guide-cta-secondary">고객센터</Link></div></section>
  </main>
}
