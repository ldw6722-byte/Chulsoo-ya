import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { storeDirectoryApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { StoreDirectoryItem } from '@/types/api'

const OPERATING_STATUS_LABEL = { OPEN: '영업중', PREPARING: '준비중', CLOSED: '영업종료', HOLIDAY: '휴무' } as const

function Stars({ rating }: { rating: number }) {

  return <span aria-label={`별점 ${rating.toFixed(1)}점`} className="font-bold text-amber-500">★ {rating.toFixed(1)}</span>
}

function StoreCard({ store }: { store: StoreDirectoryItem }) {
  return (
    <Link to={`/stores/${store.id}`} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      <div className="aspect-[16/9] bg-slate-100">
        {store.imageUrl ? <img src={store.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl text-slate-400">⚒</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-900">{store.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{store.cityName} {store.districtName}</p>
          </div>
          <Stars rating={store.rating} />
        </div>
        <p className="mt-3 line-clamp-1 text-sm text-slate-600">{store.handledItems.join(', ')}</p>
        {store.customerNoticeText ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{store.customerNoticeText}</p> : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {store.customerBadgeText ? <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">{store.customerBadgeText}</span> : null}
          <span className={store.operatingStatus === 'OPEN' ? 'rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700' : 'rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600'}>{OPERATING_STATUS_LABEL[store.operatingStatus]}</span>

        </div>
      </div>
    </Link>
  )
}

export function StoreFinder({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [city, setCity] = useState(() => searchParams.get("city") ?? "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC")
  const [district, setDistrict] = useState(() => searchParams.get('district') ?? '')
  const regions = useAsync(() => storeDirectoryApi.regions(), [])
  const stores = useAsync(() => storeDirectoryApi.list({ city, district: district || undefined }), [city, district])
  const cities = useMemo(() => Array.from(new Set((regions.data ?? []).map(region => region.cityName))), [regions.data])
  const districts = useMemo(() => (regions.data ?? []).filter(region => region.cityName === city).map(region => region.districtName), [regions.data, city])
  const list = compact ? (stores.data ?? []).slice(0, 3) : (stores.data ?? [])
  const moveToDirectory = () => navigate(`/stores?city=${encodeURIComponent(city)}${district ? `&district=${encodeURIComponent(district)}` : ''}`)

  return (
    <section className={compact ? 'my-10 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-slate-950 shadow-sm md:px-7' : 'mx-auto max-w-7xl px-4 py-8'}>
      <div className={compact ? 'flex flex-wrap items-end justify-between gap-5' : 'mb-7 flex flex-wrap items-end justify-between gap-5'}>
        <div>
          <p className={compact ? 'text-xs font-black tracking-wider text-brand-600' : 'text-xs font-black tracking-wider text-brand-600'}>STORE FINDER</p>
          <h2 className={compact ? "mt-1 text-2xl font-black tracking-tight text-slate-950" : "mt-1 text-3xl font-black tracking-tight text-slate-950"}>{compact ? "\uAC00\uAE4C\uC6B4 \uD310\uB9E4\uC810 \uCC3E\uAE30" : "\uC9C0\uC5ED \uD310\uB9E4\uC810 \uCC3E\uAE30"}</h2>
          <p className={compact ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-slate-500"}>{"\uC2DC\uB97C \uC120\uD0DD\uD558\uBA74 \uC804\uCCB4 \uC9C0\uC810, \uAD6C\uB97C \uC120\uD0DD\uD558\uBA74 \uD574\uB2F9 \uAD6C\uC758 \uD310\uB9E4\uC810\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."}</p>
        </div>
        <div className="-translate-y-1 flex flex-wrap gap-2">
          <select value={city} onChange={event => { setCity(event.target.value); setDistrict('') }} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">
            <option value="">{"\uC2DC \uC120\uD0DD"}</option>{cities.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={district} onChange={event => setDistrict(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">
            <option value="">{"\uC804\uCCB4 \uAD6C"}</option>{districts.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button type="button" onClick={moveToDirectory} className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-900 transition hover:bg-slate-100">{"\uC804\uCCB4 \uBCF4\uAE30"}</button>
        </div>
      </div>
      {stores.loading ? <LoadingView label="\uD310\uB9E4\uC810\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4." /> : stores.error ? <ErrorView error={stores.error} onRetry={stores.reload} /> : list.length ? (
        <>
          <div className={compact ? 'grid gap-4 md:grid-cols-3' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>{list.map(store => <StoreCard key={store.id} store={store} />)}</div>
          {compact && (stores.data ?? []).length > list.length ? <button type="button" onClick={moveToDirectory} className="mt-5 text-sm font-bold text-slate-900 underline underline-offset-4">{city} {district || '전체'} 판매점 더 보기 →</button> : null}
        </>
      ) : <div className={compact ? "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500" : "rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500"}>{"\uC120\uD0DD\uD55C \uC9C0\uC5ED\uC5D0 \uD45C\uC2DC\uD560 \uD310\uB9E4\uC810\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>}
    </section>
  )
}

export function StoreDirectoryPage() {
  return <div className="min-h-[70vh] bg-slate-50"><StoreFinder /></div>
}
