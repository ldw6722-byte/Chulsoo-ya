import { Fragment, useEffect, useMemo, useState } from 'react'
import { notify } from '@/lib/notify'
import { adminSubscriptionApi } from '../../api/endpoints'
import type { AdminSellerMembership, SellerSubscriptionTier, StoreSubscriptionHistory, SubscriptionProduct } from '../../types/api'

const LABEL: Record<string, string> = {
  PREMIUM: '프리미엄', GOLD: '골드', SILVER: '실버',
  PURCHASED: '구독결제 승인', ADMIN_CHANGED: '관리자 조절', EXPIRED: '기간 만료',
}
const TIER_WEIGHT: Record<SellerSubscriptionTier, number> = { PREMIUM: 3, GOLD: 2, SILVER: 1 }
const empty = { name: '', tier: 'GOLD' as SellerSubscriptionTier, price: 0, durationMonths: 1, description: '', active: true, displayOrder: 0 }
const won = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원'
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '-'
const itemNames = (membership: AdminSellerMembership) => (membership.handledItems ?? '').split(',').map(item => item.trim()).filter(Boolean)

const tierButtonClass = (tier: SellerSubscriptionTier, active: boolean) => {
  const activeTone: Record<SellerSubscriptionTier, string> = {
    PREMIUM: 'border-violet-600 bg-violet-600 text-white shadow-sm',
    GOLD: 'border-amber-500 bg-amber-400 text-slate-950 shadow-sm',
    SILVER: 'border-slate-700 bg-slate-700 text-white shadow-sm',
  }
  const idleTone: Record<SellerSubscriptionTier, string> = {
    PREMIUM: 'border-violet-200 bg-white text-violet-700 hover:border-violet-400 hover:bg-violet-50',
    GOLD: 'border-amber-200 bg-white text-amber-700 hover:border-amber-400 hover:bg-amber-50',
    SILVER: 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  }
  return `inline-flex min-w-[3.75rem] items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-black transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${active ? activeTone[tier] : idleTone[tier]}`
}

export default function SubscriptionManagementPanel() {
  const [products, setProducts] = useState<SubscriptionProduct[]>([])
  const [memberships, setMemberships] = useState<AdminSellerMembership[]>([])
  const [history, setHistory] = useState<StoreSubscriptionHistory[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [expiryDate, setExpiryDate] = useState('')
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [form, setForm] = useState(empty)
  const [sellerQuery, setSellerQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [itemFilter, setItemFilter] = useState('')
  const [tierOrder, setTierOrder] = useState<'DEFAULT' | 'HIGH' | 'LOW'>('DEFAULT')

  const load = async () => {
    try {
      const [nextProducts, nextMemberships] = await Promise.all([adminSubscriptionApi.products(), adminSubscriptionApi.memberships()])
      setProducts(nextProducts)
      setMemberships(nextMemberships)
    } catch (error) {
      notify(error instanceof Error ? error.message : '구독 관리 정보를 불러오지 못했습니다.', 'error')
    }
  }

  useEffect(() => { void load() }, [])

  const districts = useMemo(
    () => [...new Set(memberships.map(member => member.districtName).filter((district): district is string => Boolean(district)))].sort((a, b) => a.localeCompare(b, 'ko')),
    [memberships],
  )
  const categories = useMemo(
    () => [...new Set(memberships.flatMap(itemNames))].sort((a, b) => a.localeCompare(b, 'ko')),
    [memberships],
  )
  const visibleMemberships = useMemo(() => {
    const keyword = sellerQuery.trim().toLowerCase()
    return memberships
      .filter(member => {
        const searchable = [member.storeName, member.ownerEmail, member.districtName ?? '', member.handledItems ?? ''].join(' ').toLowerCase()
        return (!keyword || searchable.includes(keyword))
          && (!districtFilter || member.districtName === districtFilter)
          && (!itemFilter || itemNames(member).includes(itemFilter))
      })
      .sort((left, right) => {
        if (tierOrder === 'DEFAULT') return 0
        const comparison = TIER_WEIGHT[left.tier] - TIER_WEIGHT[right.tier]
        return tierOrder === 'HIGH' ? -comparison : comparison
      })
  }, [memberships, sellerQuery, districtFilter, itemFilter, tierOrder])
  const selectedMember = useMemo(() => memberships.find(member => member.storeId === selected) ?? null, [memberships, selected])

  const saveProduct = async () => {
    try {
      if (editingProduct) await adminSubscriptionApi.updateProduct(editingProduct, form)
      else await adminSubscriptionApi.createProduct(form)
      setForm(empty)
      setEditingProduct(null)
      notify(editingProduct ? '구독 상품을 수정했습니다.' : '구독 상품을 등록했습니다.')
      await load()
    } catch (error) {
      notify(error instanceof Error ? error.message : '상품 등록에 실패했습니다.', 'error')
    }
  }

  const openHistory = async (storeId: number) => {
    if (selected === storeId) {
      setSelected(null)
      setHistory([])
      return
    }
    setSelected(storeId)
    try {
      setHistory(await adminSubscriptionApi.history(storeId))
    } catch (error) {
      notify(error instanceof Error ? error.message : '히스토리를 불러오지 못했습니다.', 'error')
    }
  }

  const change = async (storeId: number, tier: SellerSubscriptionTier) => {
    const expiresAt = tier === 'SILVER'
      ? null
      : (expiryDate ? new Date(expiryDate + 'T23:59:59').toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    try {
      const updated = await adminSubscriptionApi.changeMembership(storeId, { tier, expiresAt, reason: '관리자 등급 조절' })
      setMemberships(current => current.map(member => member.storeId === storeId ? updated : member))
      setSelected(storeId)
      setHistory(await adminSubscriptionApi.history(storeId))
      notify('판매자 멤버십 등급을 변경했습니다.')
    } catch (error) {
      notify(error instanceof Error ? error.message : '등급 변경에 실패했습니다.', 'error')
    }
  }

  const removeProduct = async (product: SubscriptionProduct) => {
    try {
      await adminSubscriptionApi.removeProduct(product.id)
      await load()
      notify(`「${product.name}」 구독 상품을 삭제했습니다.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.', 'error')
    }
  }

  return <div className="stack">
    <section className="card p-5">
      <p className="text-xs font-black text-violet-700">SUBSCRIPTION PRODUCT CRUD</p>
      <h2 className="mt-1 text-xl font-black">구독상품 관리</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">여기서 등록·수정한 상품은 <strong>판매자 구독 페이지의 플랜 카드</strong>에 즉시 반영됩니다. 판매자가 결제 요청을 보내면 별도 <strong>구독결제 승인</strong> 탭에서 승인할 때만 판매점의 등급·최대 슬롯·만료일이 DB에 적용됩니다.</p>
      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 md:grid-cols-4"><p><strong className="text-slate-900 dark:text-white">상품명</strong><br />판매자 카드의 플랜 제목입니다.</p><p><strong className="text-slate-900 dark:text-white">등급</strong><br />골드·프리미엄의 슬롯·주문 공개 정책을 적용합니다.</p><p><strong className="text-slate-900 dark:text-white">가격·기간</strong><br />결제 요청 금액과 승인 뒤 적용 기간입니다.</p><p><strong className="text-slate-900 dark:text-white">판매 상태·순서</strong><br />판매 중인 상품만 카드에 노출하며 숫자가 작을수록 먼저 보입니다.</p></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">상품명<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="예) 골드 운영 플랜" className="input mt-1" /></label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">적용 등급<select value={form.tier} onChange={event => setForm({ ...form, tier: event.target.value as SellerSubscriptionTier })} className="input mt-1"><option value="GOLD">골드</option><option value="PREMIUM">프리미엄</option></select></label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">결제 요청 금액<input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} placeholder="0" className="input mt-1" /></label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">승인 후 적용 기간(개월)<input type="number" min="1" value={form.durationMonths} onChange={event => setForm({ ...form, durationMonths: Number(event.target.value) })} placeholder="1" className="input mt-1" /></label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">판매자 카드 노출 순서<input type="number" min="0" value={form.displayOrder} onChange={event => setForm({ ...form, displayOrder: Number(event.target.value) })} placeholder="0" className="input mt-1" /></label>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />판매자 페이지에 판매 중으로 노출</label>
        <label className="md:col-span-2 text-sm font-bold text-slate-700 dark:text-slate-200">플랜 설명<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="판매자가 카드에서 확인할 혜택과 운영 설명" className="input mt-1 min-h-24 py-3" /></label>
        <div className="flex items-end"><button type="button" onClick={() => void saveProduct()} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">{editingProduct ? '상품 수정 저장' : '상품 등록'}</button></div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="table"><thead><tr><th>상품</th><th>등급</th><th>가격</th><th>기간</th><th>판매 상태</th><th>관리</th></tr></thead><tbody>
          {products.map(product => <tr key={product.id}><td>{product.name}</td><td>{LABEL[product.tier]}</td><td>{won(product.price)}</td><td>{product.durationMonths}개월</td><td>{product.active ? '판매 중' : '중지'}</td><td className="space-x-1"><button type="button" onClick={() => { setEditingProduct(product.id); setForm({ name: product.name, tier: product.tier, price: product.price, durationMonths: product.durationMonths, description: product.description || '', active: product.active, displayOrder: product.displayOrder }) }} className="rounded-lg border px-2 py-1 text-xs font-bold">수정</button><button type="button" onClick={() => void removeProduct(product)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700">삭제</button></td></tr>)}
        </tbody></table>
      </div>
    </section>

    <section className="card p-5">
      <p className="text-xs font-black text-violet-700">SELLER MEMBERSHIP CONTROL</p>
      <h2 className="mt-1 text-xl font-black">판매자 멤버십 등급 관리</h2>
      <p className="mt-2 text-sm text-slate-600">관리자는 무료 체험·등급 조절을 위해 프리미엄, 골드, 실버를 직접 변경할 수 있습니다. 유료 등급은 기본 30일 만료일로 반영됩니다.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
        <label className="text-sm font-bold text-slate-700">관리자 지정 만료일 <input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
        <p className="text-xs text-slate-500">비워 두면 서버 기준 현재 시각에서 30일을 자동 적용합니다. 실버 전환 시 만료일은 비웁니다.</p>
      </div>
      <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:grid-cols-4">
        <input value={sellerQuery} onChange={event => setSellerQuery(event.target.value)} placeholder="판매점·이메일·지역·취급 품목 검색" className="input" />
        <select value={districtFilter} onChange={event => setDistrictFilter(event.target.value)} className="input"><option value="">전체 지역</option>{districts.map(district => <option key={district} value={district}>{district}</option>)}</select>
        <select value={itemFilter} onChange={event => setItemFilter(event.target.value)} className="input"><option value="">전체 카테고리</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
        <select value={tierOrder} onChange={event => setTierOrder(event.target.value as typeof tierOrder)} className="input"><option value="DEFAULT">기본 순서</option><option value="HIGH">멤버십 높은 순</option><option value="LOW">멤버십 낮은 순</option></select>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-500">검색 결과 {visibleMemberships.length}곳</p>
      <div className="mt-4 overflow-x-auto">
        <table className="table"><thead><tr><th>판매점</th><th>지역·카테고리</th><th>현재 등급</th><th>만료일</th><th>가용 슬롯</th><th>관리</th></tr></thead><tbody>
          {visibleMemberships.map(member => <Fragment key={member.storeId}>
            <tr className={selected === member.storeId ? 'bg-violet-50' : ''}>
              <td><button type="button" className="font-black text-violet-700" onClick={() => void openHistory(member.storeId)}>{member.storeName}</button><p className="text-xs text-slate-500">{member.ownerEmail}</p></td>
              <td><p>{member.districtName || '지역 미설정'}</p><p className="max-w-48 truncate text-xs text-slate-500" title={member.handledItems ?? ''}>{member.handledItems || '카테고리 미설정'}</p></td>
              <td>{LABEL[member.tier]}</td><td>{dateTime(member.subscriptionExpiresAt)}</td><td>{member.configuredSlots} / {member.tierSlotCap}</td>
              <td className="space-x-1 whitespace-nowrap"><button type="button" aria-pressed={member.tier === 'PREMIUM'} onClick={() => void change(member.storeId, 'PREMIUM')} className={tierButtonClass('PREMIUM', member.tier === 'PREMIUM')}>프리미엄</button><button type="button" aria-pressed={member.tier === 'GOLD'} onClick={() => void change(member.storeId, 'GOLD')} className={tierButtonClass('GOLD', member.tier === 'GOLD')}>골드</button><button type="button" aria-pressed={member.tier === 'SILVER'} onClick={() => void change(member.storeId, 'SILVER')} className={tierButtonClass('SILVER', member.tier === 'SILVER')}>실버</button></td>
            </tr>
            {selected === member.storeId && <tr><td colSpan={6}><div className="rounded-xl bg-slate-50 p-4"><p className="font-black">{selectedMember?.storeName} · 등급 히스토리</p>{history.length === 0 ? <p className="mt-2 text-sm text-slate-500">변경 이력이 없습니다.</p> : <ul className="mt-2 space-y-1 text-sm">{history.map(entry => <li key={entry.id}>{dateTime(entry.createdAt)} · {LABEL[entry.previousTier]} → {LABEL[entry.nextTier]} · {LABEL[entry.eventType]} · 만료 {dateTime(entry.expiresAt)}</li>)}</ul>}</div></td></tr>}
          </Fragment>)}
          {visibleMemberships.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">조건에 맞는 판매점이 없습니다.</td></tr>}
        </tbody></table>
      </div>
    </section>
  </div>
}
