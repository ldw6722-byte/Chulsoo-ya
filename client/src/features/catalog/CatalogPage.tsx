import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cartApi, catalogApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { ToolProductCard } from '@/components/shop/ToolProductCard'
import type { CategoryTreeNode, PageResponse, Product } from '@/types/api'

const PAGE_SIZE = 20
const SORT_OPTIONS = [
  ['popular', '인기순'], ['newest', '신상품순'], ['priceAsc', '낮은 가격순'], ['priceDesc', '높은 가격순'], ['rating', '평점순'],
] as const

function findPath(nodes: CategoryTreeNode[], code: string, ancestors: CategoryTreeNode[] = []): CategoryTreeNode[] | null {
  for (const node of nodes) {
    const path = [...ancestors, node]
    if (node.code === code) return path
    const found = findPath(node.children, code, path)
    if (found) return found
  }
  return null
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryCode = searchParams.get('categoryCode') ?? searchParams.get('category') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const eventCampaignId = Number(searchParams.get('eventCampaignId') ?? '0') || undefined
  const rawSort = searchParams.get('sort') ?? 'popular'
  const sort = (['popular', 'newest', 'priceAsc', 'priceDesc', 'rating', 'name'].includes(rawSort) ? rawSort : 'popular') as 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating' | 'name'
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))
  const [keywordInput, setKeywordInput] = useState(keyword)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const tree = useAsync<CategoryTreeNode[]>(() => catalogApi.categoryTree(), [])
  const selected = useAsync<CategoryTreeNode | null>(() => categoryCode ? catalogApi.category(categoryCode) : Promise.resolve(null), [categoryCode])
  const products = useAsync<PageResponse<Product>>(() => catalogApi.products({ categoryCode: categoryCode || undefined, keyword: keyword || undefined, eventCampaignId, page, size: PAGE_SIZE, sort }), [categoryCode, keyword, page, sort])

  function updateParams(patch: Record<string, string | null>) { const next = new URLSearchParams(searchParams); Object.entries(patch).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key) }); if (!Object.hasOwn(patch, 'page')) next.delete('page'); setSearchParams(next) }
  async function addToCart(product: Product) { setAddingId(product.id); setNotice(null); try { await cartApi.addItem(product.id, 1); setNotice(`${product.name}을 장바구니에 담았습니다.`) } catch (error) { setNotice(error instanceof ApiError ? error.message : '장바구니에 담지 못했습니다.') } finally { setAddingId(null) } }

  const path = categoryCode ? findPath(tree.data ?? [], categoryCode) ?? [] : []
  const roots = tree.data ?? []
  const subcategories = selected.data?.children ?? []
  const items = products.data?.items ?? []
  const totalPages = products.data?.totalPages ?? 0
  const heading = eventCampaignId ? '철수야 셀렉트 행사 상품' : categoryCode ? `${selected.data?.name ?? '카테고리'} 상품` : keyword ? `“${keyword}” 검색 결과` : '철물·공구 전체 상품'

  return <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400"><Link to="/" className="hover:text-brand-600">홈</Link><span>›</span>{path.length ? path.map((node, index) => <span key={node.code} className={index === path.length - 1 ? 'font-bold text-slate-700 dark:text-slate-200' : ''}>{node.name}{index < path.length - 1 ? <span className="ml-2">›</span> : null}</span>) : <span>카테고리</span>}</div>
    <div className="mb-7 rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-violet-500 px-6 py-8 text-white shadow-lg md:px-9"><p className="text-sm font-bold text-white/75">HARDWARE MARKET</p><h1 className="mt-2 text-3xl font-black">{heading}</h1><p className="mt-2 text-sm text-white/85">상품을 담은 뒤 동네 철물점과 실시간 매칭을 시작하세요.</p><form className="mt-6 flex max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg" onSubmit={(event) => { event.preventDefault(); updateParams({ keyword: keywordInput.trim() || null }) }}><input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} placeholder="상품명, 규격, 용도를 검색해 보세요" className="h-12 min-w-0 flex-1 px-4 text-sm text-slate-900 outline-none" aria-label="카탈로그 검색"/><button type="submit" className="bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-slate-800">검색</button></form></div>
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 px-5 py-3 text-xs font-black text-slate-400 dark:border-slate-800">대분류</div><div className="flex flex-wrap gap-2 p-4"><button type="button" onClick={() => updateParams({ categoryCode: null })} className={`rounded-full px-4 py-2 text-sm font-bold transition ${!categoryCode ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300'}`}>전체</button>{roots.map((category) => <button key={category.code} type="button" onClick={() => updateParams({ categoryCode: category.code })} className={`rounded-full px-4 py-2 text-sm font-bold transition ${path[0]?.code === category.code ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:text-brand-200' : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300'}`}><span className="mr-1">{category.iconKey ?? '🔧'}</span>{category.name}</button>)}</div></section>
    {selected.loading ? <div className="mb-5"><LoadingView label="하위 카테고리를 불러오는 중입니다" /></div> : subcategories.length > 0 ? <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black text-slate-900 dark:text-white">{selected.data?.name} 하위 분류</h2><button type="button" className="text-xs font-bold text-brand-600" onClick={() => updateParams({ categoryCode })}>전체 보기</button></div><div className="flex flex-wrap gap-2">{subcategories.map((category) => <button key={category.code} type="button" onClick={() => updateParams({ categoryCode: category.code })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300">{category.name}</button>)}</div></section> : null}
    {notice ? <div role="status" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>✓ {notice}</span><Link to="/cart" className="ml-auto font-bold underline">장바구니 보기</Link></div> : null}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">총 <strong className="text-slate-900 dark:text-white">{products.data?.totalElements.toLocaleString('ko-KR') ?? 0}</strong>개 상품</p><select value={sort} onChange={(event) => updateParams({ sort: event.target.value })} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="정렬 기준">{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {products.loading ? <LoadingView label="상품을 불러오는 중입니다" /> : products.error ? <ErrorView error={products.error} onRetry={products.reload} /> : items.length === 0 ? <EmptyView title="조건에 맞는 상품이 없습니다" description="검색어를 바꾸거나 다른 카테고리를 선택해 보세요." action={<button type="button" className="btn" onClick={() => setSearchParams(new URLSearchParams())}>필터 초기화</button>} /> : <><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{items.map((product) => <ToolProductCard key={product.id} product={product} adding={addingId === product.id} onAdd={addToCart} />)}</div>{totalPages > 1 ? <div className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page <= 0} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900">이전</button><span className="text-sm font-bold text-slate-500">{page + 1} / {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900">다음</button></div> : null}</>}
  </div>
}
