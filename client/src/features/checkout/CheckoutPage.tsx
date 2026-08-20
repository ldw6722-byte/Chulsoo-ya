import { notify } from "@/lib/notify"
import type { KakaoPostcodeAddress } from '@/lib/kakao'
import { useAuth } from "@/app/useAuth"
import { useIdentity } from '@/app/useIdentity'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartApi, couponApi, deliveryAddressApi, orderApi, regionApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews'
import { KakaoAddressMapPreview, KakaoAddressSearchButton } from '@/components/address/KakaoAddressTools'
import { formatWon } from '@/components/format'
import type { Cart, CouponIssue, DeliveryAddress, FulfillmentMethod, RegionResolveResult } from '@/types/api'

const DELIVERY_FEE = 3000

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const { identity } = useIdentity()
  const isAuthenticated = Boolean(user ?? identity)
  const cart = useAsync<Cart>(() => cartApi.view(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading })
  const coupons = useAsync<{ issues: CouponIssue[] }>(() => couponApi.mine(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading })
  const samples = useAsync<string[]>(() => regionApi.samples(), [])
  const savedAddresses = useAsync<DeliveryAddress[]>(() => deliveryAddressApi.list(), [user?.id, identity?.userId], { enabled: isAuthenticated && !isLoading })
  const [method, setMethod] = useState<FulfillmentMethod>('DELIVERY')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [memo, setMemo] = useState('')
  const [region, setRegion] = useState<RegionResolveResult | null>(null)
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<number | null>(null)
  const appliedDefaultDeliveryAddressId = useRef<number | null>(null)
  const [couponIssueId, setCouponIssueId] = useState<number | null>(null)
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function resolveRegion(value = address) {
    if (!value.trim()) { setError('주소를 입력해 주세요.'); return }
    setResolving(true); setError(null)
    try { setRegion(await regionApi.resolve(value.trim())) } catch (caught) { setRegion(null); setError(caught instanceof ApiError ? caught.message : '주소를 확인할 수 없습니다.') } finally { setResolving(false) }
  }
  function selectDeliveryAddress(deliveryAddress: DeliveryAddress) {
    setSelectedDeliveryAddressId(deliveryAddress.id)
    setAddress(deliveryAddress.fullAddress)
    setAddressDetail(deliveryAddress.addressDetail ?? '')
    void resolveRegion(deliveryAddress.fullAddress)
  }

  function selectKakaoAddress(selected: KakaoPostcodeAddress) {
    if (selected.cityName !== '서울특별시' || !selected.districtName) { notify('현재 배송은 서울특별시 내 주소만 선택할 수 있습니다.', 'error'); return }
    setAddress(selected.address); setAddressDetail(''); setRegion(null); setSelectedDeliveryAddressId(null); void resolveRegion(selected.address)
  }

  useEffect(() => {
    const defaultAddress = savedAddresses.data?.find((item) => item.defaultAddress)
    if (!defaultAddress || selectedDeliveryAddressId !== null || appliedDefaultDeliveryAddressId.current === defaultAddress.id) return
    appliedDefaultDeliveryAddressId.current = defaultAddress.id
    selectDeliveryAddress(defaultAddress)
  }, [savedAddresses.data, selectedDeliveryAddressId])
  async function submit() {
    if (!region) { setError('주소 확인을 먼저 진행해 주세요.'); return }
    setSubmitting(true); setError(null)
    try {
      const order = await orderApi.create({ fulfillmentMethod: method, address: region.normalizedAddress, addressDetail: addressDetail.trim() || undefined, guCode: region.guCode, requestMemo: memo.trim() || undefined, couponIssueId: couponIssueId ?? undefined })
      notify("\uC8FC\uBB38 \uC694\uCCAD\uC744 \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4. \uD310\uB9E4\uC790 \uB9E4\uCE6D\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.")
      navigate(`/orders/${order.id}/matching`, { replace: true })
    } catch (caught) { const message = caught instanceof ApiError ? caught.message : "\\uC8FC\\uBB38 \\uC694\\uCCAD\\uC5D0 \\uC2E4\\uD328\\uD588\\uC2B5\\uB2C8\\uB2E4."; setError(message); notify(message, "error") } finally { setSubmitting(false) }
  }

  if (isLoading || cart.loading) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="주문 정보를 불러오는 중입니다" /></div>
  if (cart.error) return <div className="mx-auto max-w-7xl px-4 py-16"><ErrorView error={cart.error} onRetry={cart.reload} /></div>
  if (!cart.data) return <div className="mx-auto max-w-7xl px-4 py-16"><LoadingView label="주문 상품을 불러오는 중입니다" /></div>
  if ((cart.data?.items.length ?? 0) === 0) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyView title="주문할 상품이 없습니다" description="장바구니에 상품을 담은 뒤 다시 시도해 주세요." /></div>

  const items = cart.data?.items ?? []
  const itemsAmount = cart.data?.itemsAmount ?? 0
  const deliveryFee = method === 'DELIVERY' ? DELIVERY_FEE : 0
  const availableCoupons = (coupons.data?.issues ?? []).filter((coupon) => coupon.status === 'AVAILABLE' && new Date(coupon.expiresAt).getTime() > Date.now())
  const selectedCoupon = availableCoupons.find((coupon) => coupon.issueId === couponIssueId) ?? null
  const couponEligible = selectedCoupon !== null && itemsAmount >= selectedCoupon.minimumOrderAmount
  const discountAmount = couponEligible && selectedCoupon ? Math.min(selectedCoupon.discountAmount, itemsAmount) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-10">
      <div className="mb-7"><p className="text-sm font-bold text-brand-600">CHECKOUT</p><h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">주문 요청</h1><p className="mt-2 text-sm text-slate-500">판매자 매칭·재고 확인 뒤 결제를 진행합니다. 지금은 결제되지 않습니다.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">1</span><h2 className="text-lg font-black text-slate-900 dark:text-white">수령 방식</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{([{ code: 'DELIVERY', title: '배송 요청', desc: `동네 철물점에서 배송 · ${formatWon(DELIVERY_FEE)}` }, { code: 'PICKUP', title: '매장 픽업', desc: '배정 매장에서 직접 수령 · 배송비 없음' }] as const).map((option) => <button key={option.code} type="button" onClick={() => setMethod(option.code)} className={`rounded-2xl border-2 p-4 text-left transition ${method === option.code ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'border-slate-200 hover:border-brand-200 dark:border-slate-700'}`}><span className="text-xl">{option.code === 'DELIVERY' ? '🚚' : '🏪'}</span><p className="mt-3 font-black text-slate-900 dark:text-white">{option.title}</p><p className="mt-1 text-xs text-slate-500">{option.desc}</p></button>)}</div></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">2</span><h2 className="text-lg font-black text-slate-900 dark:text-white">배송지 및 매칭 지역</h2></div><div className="mt-5 space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black text-slate-900 dark:text-white">저장한 배송지</p><p className="mt-1 text-xs text-slate-500">배송지 관리에서 선택한 주문 기본 배송지가 자동으로 적용됩니다. 필요하면 여기서 다른 등록 배송지로 변경할 수 있습니다.</p></div><button type="button" onClick={() => { const defaultAddress = savedAddresses.data?.find((item) => item.defaultAddress); if (defaultAddress) selectDeliveryAddress(defaultAddress); else navigate('/my') }} className="min-h-11 rounded-xl border border-brand-300 bg-white px-3 text-xs font-black text-brand-700 hover:bg-brand-50">기본 주소지와 동일</button></div>{savedAddresses.loading ? <p className="mt-3 text-xs text-slate-500">배송지를 불러오는 중입니다.</p> : (savedAddresses.data?.length ?? 0) === 0 ? <p className="mt-3 text-xs text-slate-500">등록된 배송지가 없습니다. 기본 주소지는 마이철수에서 등록할 수 있습니다.</p> : <div className="mt-3 flex flex-wrap gap-2">{savedAddresses.data?.map((deliveryAddress) => <button key={deliveryAddress.id} type="button" onClick={() => selectDeliveryAddress(deliveryAddress)} className={'min-h-11 rounded-xl border px-3 text-left text-xs font-bold transition ' + (selectedDeliveryAddressId === deliveryAddress.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-300')}>{deliveryAddress.defaultAddress ? '기본 · ' : ''}{deliveryAddress.label}<span className="ml-1 font-medium text-slate-400">{deliveryAddress.districtName}</span></button>)}</div>}</div><div><label htmlFor="address" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">주소</label><div className="flex flex-wrap gap-2"><input id="address" value={address} onChange={(event) => { setAddress(event.target.value); setRegion(null); setSelectedDeliveryAddressId(null) }} placeholder="예) 서울특별시 강남구 테헤란로 123" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-brand-950/50" /><KakaoAddressSearchButton onSelect={selectKakaoAddress} /><button type="button" disabled={resolving} onClick={() => void resolveRegion()} className="shrink-0 rounded-xl border border-brand-600 px-4 text-sm font-black text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300">{resolving ? '확인 중…' : '주소 확인'}</button></div><KakaoAddressMapPreview address={address} /></div><div><label htmlFor="address-detail" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">상세 주소 <span className="font-medium text-slate-400">(선택)</span></label><input id="address-detail" value={addressDetail} onChange={(event) => setAddressDetail(event.target.value)} placeholder="동·호수, 출입 방법 등" className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-brand-950/50" /></div>{region ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">✓ 매칭 지역 확인 완료 · {region.guName} ({region.guCode})</p> : <p className="text-xs text-slate-500">주소를 확인하면 매칭 대상 지역이 결정됩니다.</p>}{(samples.data?.length ?? 0) > 0 ? <div className="flex flex-wrap gap-2">{samples.data?.map((sample) => <button key={sample} type="button" onClick={() => { setAddress(sample); setRegion(null) }} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300">{sample}</button>)}</div> : null}</div></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">3</span><h2 className="text-lg font-black text-slate-900 dark:text-white">쿠폰</h2></div><div className="mt-5 space-y-3"><label className="block text-sm font-bold text-slate-700 dark:text-slate-200">보유 쿠폰<select value={couponIssueId ?? ''} onChange={(event) => setCouponIssueId(event.target.value ? Number(event.target.value) : null)} className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"> <option value="">쿠폰을 사용하지 않음</option>{availableCoupons.map((coupon) => <option key={coupon.issueId} value={coupon.issueId}>{coupon.title} · {formatWon(coupon.discountAmount)} 할인 · {formatWon(coupon.minimumOrderAmount)} 이상</option>)}</select></label>{coupons.loading ? <p className="text-xs text-slate-500">보유 쿠폰을 불러오는 중입니다.</p> : selectedCoupon && !couponEligible ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">이 쿠폰은 상품 금액 {formatWon(selectedCoupon.minimumOrderAmount)} 이상에서 사용할 수 있습니다.</p> : <p className="text-xs text-slate-500">무상 쿠폰은 현금 환급·양도·기간 연장이 불가하며, 주문 취소 시 유효기간 내에서만 복구됩니다.</p>}</div></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">4</span><h2 className="text-lg font-black text-slate-900 dark:text-white">요청 사항</h2></div><textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="규격 대체 가능 여부, 도착 희망 시간 등 판매자에게 전달할 내용을 남겨 주세요." className="mt-5 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-brand-950/50" /></section>
        </div>

        <aside className="sticky top-35 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">주문 요약</h2><ul className="mt-5 max-h-56 space-y-3 overflow-y-auto border-b border-slate-100 pb-5 text-sm dark:border-slate-800">{items.map((item) => <li key={item.id} className="flex justify-between gap-3"><span className="line-clamp-1 text-slate-600 dark:text-slate-300">{item.productName} <small className="text-slate-400">× {item.quantity}</small></span><strong className="shrink-0 text-slate-900 dark:text-white">{formatWon(item.lineAmount)}</strong></li>)}</ul><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>상품 금액</span><strong className="text-slate-900 dark:text-white">{formatWon(itemsAmount)}</strong></div><div className="flex justify-between text-slate-500"><span>배송비</span><strong className="text-slate-900 dark:text-white">{formatWon(deliveryFee)}</strong></div>{selectedCoupon ? <div className="flex justify-between text-brand-700"><span>쿠폰 할인</span><strong>-{formatWon(discountAmount)}</strong></div> : null}</div><div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5 dark:border-slate-800"><span className="font-bold text-slate-700 dark:text-slate-200">결제 예정 금액</span><strong className="text-2xl font-black text-brand-600">{formatWon(itemsAmount + deliveryFee - discountAmount)}</strong></div>{error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}<button type="button" disabled={submitting || !region || (selectedCoupon !== null && !couponEligible)} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? '요청 중…' : '판매자 찾기 시작'}</button><p className="mt-3 text-center text-xs text-slate-400">재고 확인 후 최종 결제가 진행됩니다.</p></aside>
      </div>
    </div>
  )
}
