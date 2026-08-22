import { notify } from '@/lib/notify'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, catalogApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import type { AdminProduct, CategoryTreeNode, EventCampaign, ProductPriceTier } from '@/types/api'

type Payload = Omit<AdminProduct, 'id' | 'categoryName' | 'active'>
type Draft = { name: string; price: string; specSummary: string; supplyCost: string; discountRate: string; selectPromotion: boolean; eventCampaignId: string }
type OptionDraft = { id?: number; label: string; salePrice: string }

const emptyDraft: Draft = { name: '', price: '', specSummary: '', supplyCost: '', discountRate: '0', selectPromotion: false, eventCampaignId: '' }
const emptyOption = (salePrice = ''): OptionDraft => ({ label: '', salePrice })
const errorText = (prefix: string, cause: unknown) => `${prefix}${cause instanceof ApiError && cause.status ? ` (HTTP ${cause.status})` : ''}`
const promotionPrice = (draft: Draft) => Math.round((Number(draft.price) || 0) * (100 - Math.min(99, Math.max(0, Number(draft.discountRate) || 0))) / 100)

function toPayload(draft: Draft, product?: AdminProduct, categoryCode?: string): Payload {
  const regularPrice = Number(draft.price) || 0
  const price = draft.selectPromotion ? promotionPrice(draft) : regularPrice
  return {
    categoryCode: product?.categoryCode ?? categoryCode ?? '', name: draft.name.trim(), specSummary: draft.specSummary.trim() || '-',
    description: product?.description ?? null, specification: product?.specification ?? null, price, originalPrice: draft.selectPromotion ? regularPrice : (product?.originalPrice ?? regularPrice),
    supplyCost: draft.selectPromotion ? regularPrice : null, discountRate: draft.selectPromotion ? Number(draft.discountRate) || 0 : 0,
    selectPromotion: draft.selectPromotion, eventCampaignId: draft.selectPromotion && draft.eventCampaignId ? Number(draft.eventCampaignId) : null,
    unit: product?.unit ?? 'EA', imageUrl: product?.imageUrl ?? null, brand: product?.brand ?? null,
    featured: product?.featured ?? false, quickFulfillment: product?.quickFulfillment ?? false,
  }
}
function toDraft(product: AdminProduct): Draft {
  const base = product.originalPrice ?? product.price
  return { name: product.name, price: String(product.selectPromotion ? base : product.price), specSummary: product.specSummary, supplyCost: String(base), discountRate: product.selectPromotion && base ? String(Math.round((base - product.price) * 100 / base)) : '0', selectPromotion: product.selectPromotion, eventCampaignId: product.eventCampaignId === null ? '' : String(product.eventCampaignId) }
}
function toTierPayload(option: OptionDraft, sortOrder: number): Omit<ProductPriceTier, 'id'> {
  const label = option.label.trim()
  return { label, salePrice: Number(option.salePrice), guideBrands: label, guideMessage: `${label} 옵션으로 납품됩니다.`, sortOrder, active: true }
}

export function ProductManagementPanel() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [majorCode, setMajorCode] = useState('')
  const [middleCode, setMiddleCode] = useState('')
  const [minorCode, setMinorCode] = useState('')
  const [categoryCode, setCategoryCode] = useState('')
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<AdminProduct[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [eventCampaigns, setEventCampaigns] = useState<EventCampaign[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([])
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)

  const majorCategories = tree
  const selectedMajor = majorCategories.find(item => item.code === majorCode)
  const middleCategories = selectedMajor?.children ?? []
  const selectedMiddle = middleCategories.find(item => item.code === middleCode)
  const minorCategories = selectedMiddle?.children ?? []

  const load = useCallback(async (pageNumber = 0, append = false) => {
    try {
      const page = await adminApi.listProducts({ categoryCode: keyword.trim() ? undefined : (categoryCode || undefined), keyword: keyword.trim() || undefined, page: pageNumber, size: 30 })
      setItems(current => append ? [...current, ...page.items] : page.items)
      setCurrentPage(page.page); setTotalElements(page.totalElements); setTotalPages(page.totalPages); setError('')
    } catch (cause) { setError(errorText('상품 목록을 불러오지 못했습니다.', cause)) }
  }, [categoryCode, keyword])

  useEffect(() => {
    void catalogApi.categoryTree().then(setTree).catch(() => setTree([]))
    void adminApi.listEventCampaigns().then(setEventCampaigns).catch(() => setEventCampaigns([]))
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, keyword.trim() ? 260 : 0)
    return () => window.clearTimeout(timer)
  }, [load, keyword])

  const chooseMajor = (code: string) => { setMajorCode(code); setMiddleCode(''); setMinorCode(''); setCategoryCode(code) }
  const chooseMiddle = (code: string) => { setMiddleCode(code); setMinorCode(''); setCategoryCode(code || majorCode) }
  const chooseMinor = (code: string) => { setMinorCode(code); setCategoryCode(code || middleCode || majorCode) }
  const clearCategory = () => { setMajorCode(''); setMiddleCode(''); setMinorCode(''); setCategoryCode('') }
  const closeForm = () => { setEditing(null); setDraft(emptyDraft); setOptionDrafts([]); setIsFormOpen(false) }
  const openCreate = () => {
    if (!categoryCode) { const message = '새 상품을 등록할 소분류 또는 중분류를 선택해 주세요.'; setError(message); notify(message, 'error'); return }
    setEditing(null); setDraft(emptyDraft); setOptionDrafts([emptyOption()]); setError(''); setIsFormOpen(true)
  }
  const openEdit = async (product: AdminProduct) => {
    setEditing(product); setDraft(toDraft(product)); setOptionDrafts([emptyOption(String(product.price))]); setError(''); setIsFormOpen(true)
    try { const tiers = await adminApi.priceTiers(product.id); const active = tiers.filter(tier => tier.active !== false).map(tier => ({ id: tier.id, label: tier.label, salePrice: String(tier.salePrice) })); setOptionDrafts(active.length ? active : [emptyOption(String(product.price))]) }
    catch (cause) { const message = errorText('상품 옵션을 불러오지 못했습니다.', cause); setError(message); notify(message, 'error') }
  }
  const save = async () => {
    if (!draft.name.trim() || !draft.price || Number(draft.price) < 0) { const message = '상품명과 기본 판매 가격을 확인해 주세요.'; setError(message); notify(message, 'error'); return }
    if (!optionDrafts.length || optionDrafts.some(item => !item.label.trim() || !item.salePrice || Number(item.salePrice) < 0)) { const message = '브랜드·규격별 판매 옵션을 확인해 주세요.'; setError(message); notify(message, 'error'); return }
    setIsSaving(true)
    try {
      const saved = editing ? await adminApi.updateProduct(editing.id, toPayload(draft, editing)) : await adminApi.createProduct(toPayload(draft, undefined, categoryCode))
      const current = editing ? await adminApi.priceTiers(saved.id) : []
      const currentIds = new Set(optionDrafts.flatMap(item => item.id === undefined ? [] : [item.id]))
      await Promise.all(current.filter(item => item.active !== false && !currentIds.has(item.id)).map(item => adminApi.removePriceTier(item.id)))
      await Promise.all(optionDrafts.map((option, index) => {
        const target = draft.selectPromotion && index === 0 ? { ...option, salePrice: String(promotionPrice(draft)) } : option
        return target.id === undefined ? adminApi.createPriceTier(saved.id, toTierPayload(target, index)) : adminApi.updatePriceTier(target.id, toTierPayload(target, index))
      }))
      notify(editing ? '상품 정보를 수정했습니다.' : '새 상품을 등록했습니다.'); closeForm(); await load(); setHighlightedId(saved.id); window.setTimeout(() => setHighlightedId(null), 60_000); window.setTimeout(() => document.getElementById(`admin-product-row-${saved.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
    } catch (cause) { const message = errorText('상품을 저장하지 못했습니다.', cause); setError(message); notify(message, 'error') }
    finally { setIsSaving(false) }
  }
    const toggle = async (product: AdminProduct) => { try { await adminApi.setProductActive(product.id, !product.active); await load(); notify(product.active ? '상품을 비활성화했습니다.' : '상품을 활성화했습니다.') } catch (cause) { const message = errorText('상품 상태를 변경하지 못했습니다.', cause); setError(message); notify(message, 'error') } }
  const remove = async (product: AdminProduct) => {
    if (!window.confirm(`“${product.name}” 상품을 삭제할까요?\n주문 이력이나 장바구니에 연결된 상품은 삭제할 수 없으며, 비활성화를 사용해야 합니다.`)) return
    try { await adminApi.deleteProduct(product.id); await load(); notify('상품을 삭제했습니다.') }
    catch (cause) { const message = cause instanceof ApiError ? cause.message : '상품을 삭제하지 못했습니다.'; setError(message); notify(message, 'error') }
  }

  const loadMore = async () => { if (isLoadingMore || currentPage + 1 >= totalPages) return; setIsLoadingMore(true); try { await load(currentPage + 1, true) } finally { setIsLoadingMore(false) } }

  const editor = <div className='rounded-2xl border border-brand-200 bg-brand-50 p-4'>
    <div className='flex items-center justify-between gap-3'><div><p className='text-xs font-black text-brand-600'>{editing ? 'PRODUCT EDIT' : 'NEW PRODUCT'}</p><h3 className='mt-1 font-black text-slate-900'>{editing ? '상품 수정' : '새 상품 등록'}</h3></div><button type='button' onClick={closeForm} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700'>닫기</button></div>
    <div className='mt-4 grid gap-3 md:grid-cols-3'><label className='text-sm font-bold text-slate-700'>상품명<input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} className='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal' /></label><label className='text-sm font-bold text-slate-700'>기본 판매 가격<input type='number' min='0' value={draft.price} onChange={event => setDraft(current => ({ ...current, price: event.target.value }))} className='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal' /></label><label className='text-sm font-bold text-slate-700'>규격 요약<input value={draft.specSummary} onChange={event => setDraft(current => ({ ...current, specSummary: event.target.value }))} className='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal' /></label></div>
    <div className='mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900/70 dark:bg-rose-950/30'><div className='flex flex-wrap items-center justify-between gap-2'><div><h4 className='font-black text-slate-900 dark:text-slate-100'>철수야 셀렉트 행사</h4><p className='mt-1 text-xs text-slate-500 dark:text-slate-300'>기본 판매 가격을 행사 전 가격으로 사용하며, 할인율로 행사 적용가를 계산합니다.</p></div><label className='inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200'><input type='checkbox' checked={draft.selectPromotion} onChange={event => setDraft(current => ({ ...current, selectPromotion: event.target.checked }))} /> 행사 적용</label></div>{draft.selectPromotion ? <div className='mt-3 grid gap-3 md:grid-cols-3'><label className='text-sm font-bold text-slate-700 dark:text-slate-200'>할인율 (%)<input type='number' min='0' max='99' value={draft.discountRate} onChange={event => setDraft(current => ({ ...current, discountRate: event.target.value }))} className='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal' /></label><div className='rounded-xl border border-rose-200 bg-white px-3 py-2 dark:border-rose-900/70 dark:bg-slate-950'><p className='text-xs font-bold text-slate-500 dark:text-slate-300'>행사 적용 판매가</p><p className='mt-1 text-xl font-black text-rose-600 dark:text-rose-400'>{promotionPrice(draft).toLocaleString()}원</p></div><label className='text-sm font-bold text-slate-700 dark:text-slate-200 md:col-span-3'>행사 카테고리<select value={draft.eventCampaignId} onChange={event => setDraft(current => ({ ...current, eventCampaignId: event.target.value }))} className='mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal'><option value=''>행사 카테고리를 선택해 주세요.</option>{eventCampaigns.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div> : null}</div>
    <div className='mt-4 rounded-xl border border-brand-100 bg-white p-3'><div className='flex items-center justify-between gap-2'><div><h4 className='font-black text-slate-900'>브랜드·규격별 판매 옵션</h4><p className='mt-1 text-xs text-slate-500'>구매자가 선택하는 옵션별 판매 가격입니다.</p></div><button type='button' onClick={() => setOptionDrafts(current => [...current, emptyOption(draft.price)])} className='rounded-lg border border-brand-300 px-3 py-2 text-sm font-bold text-brand-700'>옵션 추가</button></div><div className='mt-3 space-y-2'>{optionDrafts.map((option, index) => <div key={option.id ?? `new-${index}`} className='grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_180px_auto]'><label className='text-xs font-bold text-slate-600'>브랜드·옵션명<input value={option.label} onChange={event => setOptionDrafts(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder='예: A브랜드 고급형' className='mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal' /></label><label className='text-xs font-bold text-slate-600'>선택 판매 가격<input type='number' min='0' value={option.salePrice} onChange={event => setOptionDrafts(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, salePrice: event.target.value } : item))} className='mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal' /></label><button type='button' disabled={optionDrafts.length === 1} onClick={() => setOptionDrafts(current => current.filter((_, itemIndex) => itemIndex !== index))} className='self-end rounded-lg px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:text-slate-300'>삭제</button></div>)}</div></div>
    <div className='mt-4 flex justify-end gap-2'><button type='button' onClick={closeForm} className='rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700'>취소</button><button type='button' disabled={isSaving} onClick={() => void save()} className='rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50'>{isSaving ? '저장 중' : '저장'}</button></div>
  </div>

  const selectedPath = [selectedMajor?.name, selectedMiddle?.name, minorCategories.find(item => item.code === minorCode)?.name].filter(Boolean).join(' · ')
  return <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
    <div className='flex flex-wrap items-center justify-between gap-3'><div><p className='text-xs font-black text-brand-600'>CATALOG MASTER</p><h2 className='mt-1 text-lg font-black text-slate-900'>상품 관리</h2></div><button type='button' onClick={openCreate} className='rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white'>새 상품 등록</button></div>
    <div className='mt-4 space-y-3'><div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-3'><div className='flex flex-wrap items-center justify-between gap-2'><div><p className='text-sm font-black text-slate-800'>카테고리로 검토</p><p className='mt-1 text-xs text-slate-500'>대분류부터 소분류까지 순서대로 선택합니다.</p></div><button type='button' onClick={clearCategory} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700'>전체 카테고리</button></div><div className='mt-3 grid gap-2 md:grid-cols-3'><label className='text-xs font-black text-slate-600'>대분류<select value={majorCode} onChange={event => chooseMajor(event.target.value)} className='mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm'><option value=''>대분류 선택</option>{majorCategories.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label className='text-xs font-black text-slate-600'>중분류<select disabled={!majorCode || !middleCategories.length} value={middleCode} onChange={event => chooseMiddle(event.target.value)} className='mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100'><option value=''>{middleCategories.length ? '중분류 선택' : '중분류 없음'}</option>{middleCategories.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><label className='text-xs font-black text-slate-600'>소분류<select disabled={!middleCode || !minorCategories.length} value={minorCode} onChange={event => chooseMinor(event.target.value)} className='mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100'><option value=''>{minorCategories.length ? '소분류 선택' : '소분류 없음'}</option>{minorCategories.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></div><p className='mt-3 text-xs font-semibold text-brand-700'>{categoryCode ? `현재 검토 분류: ${selectedPath}` : '전체 카테고리 상품을 보고 있습니다.'}</p></div><div className='rounded-2xl border border-brand-100 bg-brand-50/40 p-3'><label className='block text-sm font-black text-slate-800'>빠른 상품 검색<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='상품명을 입력하면 전체 카테고리에서 자동 검색합니다.' className='mt-2 h-11 w-full rounded-xl border border-brand-200 bg-white px-3 text-sm text-slate-800' /></label><p className='mt-2 text-xs text-slate-500'>{keyword.trim() ? '검색어가 입력되어 전체 카테고리에서 자동 검색 중입니다.' : '카테고리를 선택하지 않아도 바로 검색할 수 있습니다.'}</p></div></div>
    {error ? <p role='alert' className='mt-3 text-sm font-bold text-rose-600'>{error}</p> : null}
    {isFormOpen && !editing ? <div className='mt-4'>{editor}</div> : null}
    <div className='mt-4 overflow-x-auto'><table className='min-w-full text-sm'><thead className='border-b text-left text-slate-500'><tr><th className='px-2 py-3'>ID</th><th className='px-2 py-3'>상품</th><th className='px-2 py-3'>카테고리</th><th className='px-2 py-3'>기본가</th><th className='px-2 py-3'>상태</th><th className='px-2 py-3' /></tr></thead><tbody>{items.map(item => <Fragment key={item.id}><tr id={`admin-product-row-${item.id}`} className={highlightedId === item.id ? 'border-y-2 border-brand-500 bg-brand-50/70' : 'border-b border-slate-100'}><td className='px-2 py-3 text-slate-500'>{item.id}</td><td className='px-2 py-3'><Link to={`/product/${item.id}`} className='rounded-md px-2 py-1 font-bold text-slate-900 hover:bg-brand-50 hover:text-brand-700'>{item.name}</Link>{highlightedId === item.id ? <span className='ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-black text-white'>수정 완료</span> : null}<p className='text-xs text-slate-500'>{item.specSummary}</p></td><td className='px-2 py-3'><Link to={`/catalog?categoryCode=${encodeURIComponent(item.categoryCode)}`} className='rounded-md px-2 py-1 font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700'>{item.categoryName}</Link></td><td className='px-2 py-3 font-bold'>{item.price.toLocaleString()}원</td><td className='px-2 py-3'><span className={item.active ? 'font-bold text-emerald-600' : 'font-bold text-slate-400'}>{item.active ? '노출 중' : '비활성'}</span></td><td className='px-2 py-3'><div className='flex gap-2'><button type='button' onClick={() => void openEdit(item)} className='rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 hover:bg-brand-600 hover:text-white dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-700'>수정</button><button type='button' onClick={() => void toggle(item)} className={item.active ? 'rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-500 hover:text-white dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-700' : 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-700'}>{item.active ? '비활성화' : '활성화'}</button><button type='button' onClick={() => void remove(item)} className='rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-800 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-700'>삭제</button></div></td></tr>{editing?.id === item.id ? <tr><td colSpan={6} className='px-0 py-3'>{editor}</td></tr> : null}</Fragment>)}</tbody></table>{items.length === 0 ? <p className='py-5 text-center text-sm text-slate-500'>조회된 상품이 없습니다.</p> : null}{items.length ? <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-2 pt-4 text-sm text-slate-500'><span>총 {totalElements.toLocaleString()}개 중 {items.length.toLocaleString()}개 표시</span>{currentPage + 1 < totalPages ? <button type='button' disabled={isLoadingMore} onClick={() => void loadMore()} className='rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 disabled:opacity-50'>{isLoadingMore ? '불러오는 중' : '상품 더 보기'}</button> : <span className='font-semibold text-emerald-600'>모든 상품을 표시했습니다.</span>}</div> : null}</div>
  </section>
}
