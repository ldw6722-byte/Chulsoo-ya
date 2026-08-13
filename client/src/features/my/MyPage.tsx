import { Link } from 'react-router-dom'
import { cartApi, orderApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { formatWon } from '@/components/format'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { useAuth } from '@/app/useAuth'
import { useIdentity } from '@/app/useIdentity'
import type { Cart, OrderSummary } from '@/types/api'

const MENU_GROUPS = [
  { title: 'MY 주문', links: [['📦', '주문·배송·매칭 내역', '/orders'], ['↩️', '취소·환불 안내', '/orders'], ['🏪', '판매자 매칭 안내', '/catalog']] },
  { title: 'MY 혜택', links: [['🎫', '쿠폰·할인', '/catalog'], ['💰', '주문 혜택 안내', '/catalog']] },
  { title: 'MY 정보', links: [['👤', '회원 정보', '/my'], ['📍', '배송지 관리', '/checkout'], ['⚙️', '계정 설정', '/my']] },
] as const

function statusText(status: OrderSummary['status']) {
  const map: Record<OrderSummary['status'], string> = {
    DRAFT: '작성 중', WAITING_MATCH: '매칭 대기', MATCHED: '판매자 매칭', SELLER_CONFIRMING: '재고 확인', PAYMENT_PENDING: '결제 대기', PAID: '결제 완료', PREPARING: '상품 준비', DELIVERY_IN_PROGRESS: '배송 중', PICKUP_READY: '픽업 준비', COMPLETED: '완료', MATCH_FAILED: '매칭 실패', RE_MATCHING: '재매칭 중', CANCELLED: '취소',
  }
  return map[status]
}

export function MyPage() {
  const { user, signOut } = useAuth()
  const { identity } = useIdentity()
  const role = user?.role ?? identity?.role
  const isSeller = role === 'SELLER'
  const canApplyForSeller = role === 'CONSUMER'
  const orders = useAsync<OrderSummary[]>(() => orderApi.list(), [identity?.userId])
  const cart = useAsync<Cart>(() => cartApi.view(), [identity?.userId])
  const orderList = orders.data ?? []
  const matchingCount = orderList.filter((order) => ['WAITING_MATCH', 'RE_MATCHING', 'MATCHED', 'SELLER_CONFIRMING'].includes(order.status)).length
  const activeCount = orderList.filter((order) => ['PAID', 'PREPARING', 'DELIVERY_IN_PROGRESS', 'PICKUP_READY'].includes(order.status)).length
  const profileName = user?.name ?? (identity ? '철수야 고객' : '로그인이 필요합니다')
  const email = user?.email ?? '로그인하면 주문과 매칭 상태를 한곳에서 관리할 수 있어요.'

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-violet-500 px-6 py-7 text-white shadow-xl md:px-9">
        <div className="relative z-10"><p className="text-sm font-bold text-white/70">MY CHULSOO-YA</p><h1 className="mt-2 text-2xl font-black md:text-3xl">{profileName}님, 안녕하세요.</h1><p className="mt-2 text-sm text-white/85">{email}</p></div>
        <div className="relative z-10 mt-6 flex flex-wrap gap-3"><div className="min-w-28 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur"><p className="text-[11px] font-bold text-white/70">진행 주문</p><p className="mt-1 text-xl font-black">{activeCount}</p></div><div className="min-w-28 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur"><p className="text-[11px] font-bold text-white/70">매칭 요청</p><p className="mt-1 text-xl font-black">{matchingCount}</p></div><div className="min-w-28 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur"><p className="text-[11px] font-bold text-white/70">장바구니</p><p className="mt-1 text-xl font-black">{cart.data?.itemCount ?? 0}</p></div></div>
        <span className="absolute -right-5 -top-8 text-[12rem] opacity-10">🧰</span>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[245px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {MENU_GROUPS.map((group) => <section key={group.title} className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-800"><h2 className="mb-2 px-2 text-xs font-black text-slate-400">{group.title}</h2><ul className="space-y-1">{group.links.map(([icon, label, to]) => <li key={label}><Link to={to} className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800"><span>{icon}</span>{label}</Link></li>)}</ul></section>)}
          {canApplyForSeller && <section className="border-b border-slate-100 py-4 dark:border-slate-800"><h2 className="mb-2 px-2 text-xs font-black text-brand-600">SELLER PARTNER</h2><Link to="/seller/application" className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">🏪 판매자 등록 신청</Link></section>}
          {isSeller && <section className="border-b border-slate-100 py-4 dark:border-slate-800"><h2 className="mb-2 px-2 text-xs font-black text-violet-600">SELLER WORKFLOW</h2><ul className="space-y-1"><li><Link to="/seller/offers" className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">📥 응찰 내역</Link></li><li><Link to="/seller/orders" className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">📦 낙찰 후 주문 처리</Link></li><li><Link to="/seller/claims" className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">📣 클레임 처리</Link></li><li><Link to="/seller/settings" className="flex items-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">⚙️ 판매자 운영 설정</Link></li></ul></section>}
          {user ? <button type="button" onClick={() => void signOut()} className="mt-3 w-full rounded-xl border border-rose-200 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50">로그아웃</button> : <Link to="/auth/login" className="mt-3 block w-full rounded-xl bg-brand-600 py-2.5 text-center text-sm font-bold text-white">로그인하기</Link>}
        </aside>

        <div className="min-w-0">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['📬', '매칭 대기', matchingCount, '/orders'], ['📦', '진행 주문', activeCount, '/orders'], ['🛒', '장바구니', cart.data?.itemCount ?? 0, '/cart'], ['✅', '주문 완료', orderList.filter((order) => order.status === 'COMPLETED').length, '/orders']].map(([icon, label, count, to]) => <Link key={String(label)} to={String(to)} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><span className="text-2xl">{icon}</span><p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{count}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></Link>)}
          </section>

          {isSeller && <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black text-violet-700">SELLER WORKFLOW ACTIVE</p><h2 className="mt-1 text-xl font-black text-slate-900">판매자 업무를 시작하세요</h2><p className="mt-2 text-sm text-slate-600">응찰 확인부터 재고 확인, 배송 완료 처리까지 같은 계정에서 관리합니다.</p></div><div className="flex flex-wrap gap-2"><Link to="/seller/offers" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white">응찰 내역</Link><Link to="/seller/orders" className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-black text-violet-700">주문 처리</Link></div></div></section>}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold text-brand-600">RECENT ORDERS</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">최근 주문</h2></div><Link to="/orders" className="text-sm font-bold text-brand-600 hover:underline">전체 주문 보기 →</Link></div>
            {orders.loading ? <LoadingView label="최근 주문을 불러오는 중입니다" /> : orders.error ? <ErrorView error={orders.error} onRetry={orders.reload} /> : orderList.length === 0 ? <EmptyView title="최근 주문 내역이 없습니다" description="필요한 공구를 찾아 주문 매칭을 시작해 보세요." action={<Link to="/catalog" className="btn btn-primary">공구 둘러보기</Link>} /> : <div className="space-y-3">{orderList.slice(0, 5).map((order) => <Link key={order.id} to={`/orders/${order.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl dark:bg-brand-950/50">🔧</span><div className="min-w-36 flex-1"><p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{order.representativeProductName}</p><p className="mt-1 text-xs text-slate-500">주문 #{order.id} · {new Date(order.createdAt).toLocaleDateString('ko-KR')}</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 dark:bg-brand-950/50 dark:text-brand-200">{statusText(order.status)}</span><strong className="ml-auto text-sm text-slate-900 dark:text-white">{formatWon(order.totalAmount)}</strong></Link>)}</div>}
          </section>
        </div>
      </div>
    </div>
  )
}
