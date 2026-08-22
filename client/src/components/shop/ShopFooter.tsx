import { Link } from 'react-router-dom'

const GROUPS = [
  { title: '고객 서비스', links: [['고객센터', '/support'], ['주문 조회', '/orders'], ['취소·환불 안내', '/orders']] },
  { title: '주문 안내', links: [['주문 방법', '/guide#order'], ['실시간 매칭 안내', '/guide#matching'], ['배송·시간 지정 안내', '/guide#delivery'], ['픽업 주문 안내', '/guide#pickup'], ['결제 안내', '/guide#payment']] },
  { title: '판매자 서비스', links: [['판매자 운영 안내', '/seller-guide#overview'], ['판매자 지원 등록', '/seller-guide#apply'], ['판매자 구독 가이드', '/seller-guide#subscription'], ['신뢰·패널티 안내', '/seller-guide#penalty']] },
  { title: '철수야', links: [['서비스 소개', '/about#intro'], ['이용약관', '/about#terms'], ['개인정보처리방침', '/about#privacy']] },
] as const

export function ShopFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        {GROUPS.map((group) => (
          <section key={group.title}>
<h2 className="mb-4 leading-6 text-sm font-bold text-slate-900 dark:text-white">{group.title}</h2>
            <ul className="space-y-2.5 text-sm leading-5">
              {group.links.map(([label, to]) => <li key={label}><Link to={to} className="inline-flex min-h-5 items-center transition hover:text-brand-600">{label}</Link></li>)}
            </ul>
          </section>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs leading-6 text-slate-500">
          <p><strong className="text-slate-700 dark:text-slate-300">철수야</strong> · 동네 철물점 실시간 매칭 플랫폼</p>
          <p>주문 매칭과 마감 시각은 서버 기준으로 관리됩니다.</p>
          <p className="mt-1">© {new Date().getFullYear()} CHULSOO-YA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
