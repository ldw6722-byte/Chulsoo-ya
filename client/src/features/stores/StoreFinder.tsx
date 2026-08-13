import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { storeDirectoryApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { StoreDirectoryItem } from '@/types/api'

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
        <p className="mt-3 line-clamp-1 text-sm text-slate-600">{store.handledItems.join(' · ')}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {store.receivingOrders ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">주문 수신</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">주문 미수신</span>}
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">가용 슬롯 {store.availableSlots}</span>
        </div>
      </div>
    </Link>
  )
}

export function StoreFinder({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [city, setCity] = useState(() => searchParams.get('city') ?? '서울특별시')
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
          <h2 className={compact ? 'mt-1 text-2xl font-black tracking-tight text-slate-950' : 'mt-1 text-3xl font-black tracking-tight text-slate-950'}>{compact ? '가까운 판매점 찾기' : '지역 판매점 찾기'}</h2>
          <p className={compact ? 'mt-2 text-sm text-slate-500' : 'mt-2 text-sm text-slate-500'}>시를 선택하면 전체 지점, 구를 선택하면 해당 구의 판매점을 확인합니다.</p>
        </div>
        <div className="-translate-y-1 flex flex-wrap gap-2">
          <select value={city} onChange={event => { setCity(event.target.value); setDistrict('') }} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">
            <option value="">시 선택</option>{cities.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={district} onChange={event => setDistrict(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">
            <option value="">전체 구</option>{districts.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button type="button" onClick={moveToDirectory} className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-900 transition hover:bg-slate-100">전체 보기</button>
        </div>
      </div>
      {stores.loading ? <LoadingView label="판매점을 불러오는 중입니다" /> : stores.error ? <ErrorView error={stores.error} onRetry={stores.reload} /> : list.length ? (
        <>
          <div className={compact ? 'grid gap-4 md:grid-cols-3' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>{list.map(store => <StoreCard key={store.id} store={store} />)}</div>
          {compact && (stores.data ?? []).length > list.length ? <button type="button" onClick={moveToDirectory} className="mt-5 text-sm font-bold text-slate-900 underline underline-offset-4">{city} {district || '전체'} 판매점 더 보기 →</button> : null}
        </>
      ) : <div className={compact ? 'rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500' : 'rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500'}>선택한 지역에 표시할 판매점이 없습니다.</div>}
    </section>
  )
}

export function StoreDirectoryPage() {
  return <div className="min-h-[70vh] bg-slate-50"><StoreFinder /></div>
}
