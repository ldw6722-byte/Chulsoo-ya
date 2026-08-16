import { useParams } from 'react-router-dom'
import { catalogApi } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { ToolProductCard } from '@/components/shop/ToolProductCard'
import type { EventCampaign, PageResponse, Product } from '@/types/api'

const THEMES: Record<string, string> = { blue: 'from-indigo-700 via-blue-600 to-cyan-500', orange: 'from-rose-700 via-orange-600 to-amber-500', charcoal: 'from-slate-800 via-slate-600 to-stone-500', green: 'from-teal-700 via-emerald-600 to-lime-500', violet: 'from-violet-800 via-purple-700 to-fuchsia-600' }
export function EventCampaignPage() {
  const { eventId = '' } = useParams()
  const id = Number(eventId)
  const campaign = useAsync<EventCampaign>(() => catalogApi.eventCampaign(id), [id])
  const products = useAsync<PageResponse<Product>>(() => catalogApi.products({ eventCampaignId: id, page: 0, size: 60, sort: 'popular' }), [id])
  if (!id || Number.isNaN(id)) return <EmptyView title="행사를 찾을 수 없습니다." description="올바른 행사 주소인지 확인해 주세요." />
  if (campaign.loading || products.loading) return <LoadingView label="행사 상품을 불러오는 중입니다." />
  if (campaign.error) return <ErrorView error={campaign.error} />
  const event = campaign.data
  if (!event) return <EmptyView title="행사를 찾을 수 없습니다." description="종료되었거나 비활성화된 행사입니다." />
  const items = products.data?.items ?? []
  return <div className="page pb-12"><section className={`overflow-hidden rounded-3xl bg-gradient-to-r ${THEMES[event.themeKey] ?? THEMES.blue} px-7 py-10 text-white shadow-xl md:px-12 md:py-14`}><p className="inline-flex rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-black">{event.badgeText}</p><p className="mt-5 text-sm font-black text-white/80">{event.name}</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{event.heroTitle}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/90 md:text-base">{event.heroSubtitle || '철수야가 준비한 행사 상품을 확인해 보세요.'}</p></section><div className="mt-8 flex items-end justify-between gap-3"><div><p className="text-xs font-black text-brand-600">EVENT PRODUCTS</p><h2 className="mt-1 text-2xl font-black text-slate-900">{event.name} 상품</h2></div><p className="text-sm font-bold text-slate-500">총 {products.data?.totalElements ?? 0}개</p></div>{items.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(product => <ToolProductCard key={product.id} product={product} />)}</div> : <div className="mt-5"><EmptyView title="이 행사에 연결된 상품이 없습니다." description="관리자 상품 수정에서 행사 적용과 행사 카테고리를 선택하면 이 페이지에 자동으로 표시됩니다." /></div>}</div>
}
