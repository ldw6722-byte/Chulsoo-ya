import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const SECTION_LINKS = [
  { id: 'intro', label: '철수야 소개' },
  { id: 'terms', label: '이용약관' },
  { id: 'privacy', label: '개인정보처리방침' },
] as const

const TERMS = [
  ['제1조 목적', '이 약관은 철수야가 제공하는 지역 기반 철물 주문·매칭 플랫폼 및 관련 부가 서비스의 이용 조건, 이용자와 운영자의 권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.'],
  ['제2조 서비스의 구조', '철수야는 통합 상품 카탈로그 탐색, 장바구니, 지역 기반 주문 요청, 판매자 매칭, 주문 상태 확인, 고객지원 기능을 제공합니다. 개별 거래의 판매자, 이행 방식, 결제 및 취소 조건은 주문 과정과 판매자 정보 화면에 표시된 내용이 함께 적용됩니다.'],
  ['제3조 회원과 계정', '이용자는 정확한 정보로 가입하고 본인의 계정 정보를 안전하게 관리해야 합니다. 타인의 계정을 사용하거나 서비스 운영을 방해하는 행위는 제한될 수 있습니다.'],
  ['제4조 주문과 계약', '주문 요청은 판매자 매칭과 물품 확인 과정을 거칩니다. 주문의 접수·판매자 확인·결제·이행 상태는 화면과 알림으로 안내되며, 거래 조건이 확정되는 시점은 서비스 화면에 표시된 절차를 따릅니다.'],
  ['제5조 취소·반품·분쟁', '취소·반품·교환·부분 교체는 주문 상태와 상품·판매자별 조건, 관계 법령 및 고객센터 안내에 따라 처리합니다. 이견이 있는 경우 이용자는 주문 상세의 클레임 또는 고객센터를 통해 처리를 요청할 수 있습니다.'],
  ['제6조 서비스 변경과 약관 개정', '운영자는 서비스 품질·보안·법령 준수를 위해 기능과 약관을 변경할 수 있습니다. 이용자에게 중요한 영향을 주는 변경은 적용 전 서비스 내 공지 등 합리적인 방법으로 안내합니다.'],
  ['제7조 책임과 분쟁 처리', '운영자와 이용자는 관련 법령과 이 약관을 준수합니다. 서비스 이용과 관련한 문의·분쟁은 고객센터를 통해 우선 접수하며, 해결되지 않는 분쟁은 관계 법령과 관할에 따라 처리합니다.'],
] as const

const PRIVACY_SECTIONS = [
  ['1. 개인정보 처리 목적', '회원 식별과 서비스 제공, 주문·매칭·결제·취소·환불·클레임 처리, 판매자 신청과 운영, 고객 문의 대응, 부정 이용 방지, 법령상 의무 이행을 위해 개인정보를 처리합니다.'],
  ['2. 처리하는 개인정보 항목', '회원가입·계정 관리 과정에서는 이메일, 이름, 연락처를 처리할 수 있습니다. 주문·이행 과정에서는 주문 품목, 배송지, 수령인, 연락처, 결제수단의 식별 가능한 최소 정보와 거래 이력이 처리될 수 있습니다. 판매자 신청에서는 사업자 및 증빙 정보가 추가로 처리될 수 있습니다.'],
  ['3. 보유 및 이용 기간', '개인정보는 처리 목적이 달성되면 지체 없이 파기하는 것을 원칙으로 합니다. 다만 계약·청약철회, 결제·공급, 소비자 불만·분쟁 처리 등 관계 법령상 보존 의무가 있는 기록은 해당 법령이 정한 기간 동안 보관합니다.'],
  ['4. 제3자 제공', '주문 이행에 필요한 범위에서 주문을 담당하는 판매자에게 수령인, 연락처, 배송지, 주문 정보가 제공될 수 있습니다. 그 밖의 제3자 제공은 법령상 근거 또는 별도 동의가 있는 경우에 한합니다.'],
  ['5. 처리 위탁과 외부 서비스', '서비스 운영을 위해 인증, 데이터베이스, 파일 저장, 지도·주소 검색 등 외부 인프라를 사용할 수 있습니다. 결제대행, 배송, 메시지 발송 등 외부 수탁자가 확정되는 경우 수탁자와 업무 내용을 이 방침에 최신화해 공개합니다.'],
  ['6. 파기 절차와 방법', '보유 기간이 끝나거나 처리 목적이 달성된 개인정보는 내부 절차에 따라 복구할 수 없는 방법으로 삭제합니다. 법령상 보관이 필요한 기록은 다른 정보와 분리해 보관합니다.'],
  ['7. 이용자 권리', '이용자는 자신의 개인정보에 대한 열람, 정정·삭제, 처리 정지, 동의 철회 등을 요청할 수 있습니다. 서비스 내 계정·주문 기능 또는 고객센터를 통해 요청할 수 있으며, 법령상 제한 사유가 없는 한 지체 없이 처리합니다.'],
  ['8. 안전성 확보조치', '접근 권한 관리, 인증 토큰 보호, 전송 구간 보호, 접근 기록 관리, 데이터베이스 접근 통제 등 개인정보의 분실·도난·유출·위조·변조를 방지하기 위한 관리적·기술적 조치를 적용합니다.'],
  ['9. 쿠키와 유사 기술', '서비스는 로그인 유지, 화면 설정, 이용 편의 제공을 위해 브라우저 저장소와 유사 기술을 사용할 수 있습니다. 이용자는 브라우저 설정에서 관련 저장을 제한하거나 삭제할 수 있으나 일부 기능이 제한될 수 있습니다.'],
  ['10. 방침 변경과 문의', '법령·서비스·처리 현황이 변경되면 이 방침을 갱신하고 시행일과 변경 내용을 안내합니다. 개인정보 관련 문의와 권리 행사는 아래 운영 정보가 확정된 뒤 지정되는 책임자 또는 고객센터로 접수할 수 있습니다.'],
] as const

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-7"><p className="text-xs font-black tracking-[0.16em] text-brand-600 dark:text-brand-300">{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p></div>
}

export function ServiceInformationPage() {
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 0)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  return <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
    <section className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 px-6 py-9 text-white shadow-lg md:px-10 md:py-12">
      <p className="text-xs font-black tracking-[0.18em] text-brand-100">CHULSOO-YA GUIDE</p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end"><div><h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">필요한 철물, 가까운 책임 판매자와 더 빠르게 연결합니다.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-brand-50 sm:text-base">철수야는 운영자가 관리하는 통합 카탈로그와 지역 기반 주문 매칭을 연결해, 필요한 철물과 공구를 더 명확한 절차로 찾고 주문할 수 있도록 돕는 O2O 플랫폼입니다.</p></div><div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm"><p className="text-xs font-bold text-brand-100">서비스 흐름</p><p className="mt-2 text-sm font-black leading-6">품목 탐색 → 주문 요청 → 지역 판매자 매칭 → 물품 확인 → 결제 → 배달·픽업</p></div></div>
    </section>

    <nav aria-label="철수야 안내 페이지 탐색" className="sticky top-2 z-10 mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"><div className="flex min-w-max gap-2">{SECTION_LINKS.map((item) => <Link key={item.id} to={`/about#${item.id}`} className="min-h-11 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-200">{item.label}</Link>)}</div></nav>

    <section id="intro" className="scroll-mt-28 py-12"><SectionHeading eyebrow="ABOUT CHULSOO-YA" title="철수야 소개" description="여러 매장에 전화를 돌리거나 재고 여부를 반복해서 확인해야 했던 철물 구매 경험을, 지역 기반의 책임 있는 주문 매칭 흐름으로 바꿉니다." /><div className="grid gap-4 md:grid-cols-3">{[["01", "하나의 통합 카탈로그", "운영 기준으로 정리한 상품·규격·가격 정보를 바탕으로 필요한 품목을 비교하고 장바구니를 구성합니다."], ["02", "지역 기반 책임 매칭", "주문 요청은 배송지 기준으로 자격 있는 지역 판매자에게 전달되며, 한 판매자가 주문 단위를 책임지고 이행합니다."], ["03", "상태가 보이는 거래", "매칭, 물품 확인, 결제, 준비, 이행 등 주문의 핵심 진행 상태를 서비스 안에서 확인할 수 있습니다."]].map(([number, title, text]) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-sm font-black text-brand-600 dark:text-brand-300">{number}</p><h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/25"><p className="text-sm font-black text-emerald-900 dark:text-emerald-100">철수야는 구매자, 판매자, 운영자가 각자의 역할을 분명히 확인할 수 있는 거래 흐름을 지향합니다.</p><p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">구매자는 필요한 품목을 찾고, 판매자는 감당 가능한 주문을 수신하며, 운영자는 카탈로그와 판매자 검증·고객 보호 절차를 관리합니다.</p></div></section>

    <section id="terms" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="TERMS OF SERVICE" title="이용약관" description="철수야 웹 MVP의 현재 서비스 구조를 기준으로 정리한 이용약관 검토 초안입니다. 실제 거래·결제·판매자 운영 조건이 확정되면 정식 사업자 정보와 함께 법률 검토를 거쳐 갱신됩니다." /><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">{TERMS.map(([title, text], index) => <article key={title} className={`p-6 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><h3 className="text-base font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div></section>

    <section id="privacy" className="scroll-mt-28 border-t border-slate-200 py-12 dark:border-slate-800"><SectionHeading eyebrow="PRIVACY POLICY" title="개인정보처리방침" description="철수야의 현재 계정·주문·판매자 운영 기능을 기준으로 개인정보 처리 항목을 정리한 검토 초안입니다. 정식 공개 전 실제 위탁·제공·보유 현황과 운영자 정보를 확인해 확정해야 합니다." /><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">{PRIVACY_SECTIONS.map(([title, text], index) => <article key={title} className={`p-6 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}><h3 className="text-base font-black text-slate-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p></article>)}</div><aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/25"><p className="text-sm font-black text-amber-950 dark:text-amber-100">정식 공개 전 운영 정보 확인</p><p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-200">상호, 대표자, 사업자등록번호, 통신판매업 신고번호, 주소, 고객센터 연락처, 개인정보 보호책임자, 실제 결제·배송·알림·분석 수탁자와 제3자 제공 현황은 현재 확정 정보가 없어 정식 공개 전에 반영해야 합니다.</p></aside></section>

    <section className="border-t border-slate-200 py-10 dark:border-slate-800"><p className="text-xs font-black tracking-[0.16em] text-slate-500 dark:text-slate-400">REFERENCE</p><h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">작성 기준</h2><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">기존 전자상거래 표준약관의 거래 조건 구성과 현행 전자상거래 소비자보호 지침, 개인정보 처리방침 작성지침의 공개 항목을 참고해 현재 기능에 맞는 구조로 정리했습니다.</p><div className="mt-4 flex flex-wrap gap-3"><a href="https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000265912&chrClsCd=010201" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">전자상거래 소비자보호 지침 · 2025</a><a href="https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20806" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">개인정보 처리방침 작성지침</a></div></section>
  </main>
}
