import { useMemo, useState } from 'react'
import { adminStoreApi } from '@/api/endpoints'
import { ErrorView, LoadingView } from '@/components/StateViews'
import { useAsync } from '@/hooks/useAsync'
import type { StoreCreateRequest, StoreDirectoryItem, StoreUpdateRequest } from '@/types/api'

type StoreForm = StoreCreateRequest
const emptyForm = (): StoreForm => ({
  name: '', ownerEmail: '', ownerName: '', phone: '', cityName: '서울특별시', districtName: '강남구',
  address: '', imageUrl: '', handledItems: '전동공구,수공구,안전용품', rating: 4, verified: true, receivingOrders: true,
})
const districts = ['강남구', '강동구', '강서구', '관악구', '광진구', '마포구', '송파구', '영등포구', '용산구', '성동구']

function asForm(store: StoreDirectoryItem): StoreForm {
  return { name: store.name, ownerEmail: store.ownerEmail, ownerName: '', phone: store.phone, cityName: store.cityName, districtName: store.districtName, address: store.address, imageUrl: store.imageUrl ?? '', handledItems: store.handledItems.join(','), rating: store.rating, verified: store.verified, receivingOrders: store.receivingOrders }
}

export function StoreManagementPanel() {
  const stores = useAsync<StoreDirectoryItem[]>(() => adminStoreApi.list(), [])
  const [editing, setEditing] = useState<StoreDirectoryItem | null>(null)
  const [form, setForm] = useState<StoreForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const visible = useMemo(() => stores.data ?? [], [stores.data])
  const isCreating = editing === null
  const reset = () => { setEditing(null); setForm(emptyForm()); setNotice('') }
  const change = <K extends keyof StoreForm>(key: K, value: StoreForm[K]) => setForm(previous => ({ ...previous, [key]: value }))
  const beginEdit = (store: StoreDirectoryItem) => { setEditing(store); setForm(asForm(store)); setNotice('') }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      if (editing) {
        const payload: StoreUpdateRequest = { name: form.name, phone: form.phone, cityName: form.cityName, districtName: form.districtName, address: form.address, imageUrl: form.imageUrl, handledItems: form.handledItems, rating: Number(form.rating), verified: form.verified, receivingOrders: form.receivingOrders }
        await adminStoreApi.update(editing.id, payload)
      } else {
        await adminStoreApi.create({ ...form, rating: Number(form.rating) })
      }
      await stores.reload()
      const message = editing ? '판매점 정보를 수정했습니다.' : '판매점을 등록했습니다.'
      setEditing(null)
      setForm(emptyForm())
      setNotice(message)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '판매점 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (store: StoreDirectoryItem) => {
    if (!window.confirm(`${store.name} 판매점을 삭제할까요?`)) return
    try {
      await adminStoreApi.remove(store.id)
      await stores.reload()
      if (editing?.id === store.id) reset()
      setNotice('판매점을 삭제했습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '판매점 삭제에 실패했습니다.')
    }
  }

  if (stores.loading && !stores.data) return <LoadingView label="판매점 목록을 불러오는 중입니다" />
  if (stores.error) return <ErrorView error={stores.error} onRetry={stores.reload} />

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-wider text-brand-600">STORE CRUD</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">판매점 등록 · 상태 관리</h2>
            <p className="mt-1 text-sm text-slate-500">이미지 주소, 취급 품목, 승인·주문 수신 상태를 관리합니다. 별점은 실거래 후기만 반영됩니다.</p>
          </div>
          <button type="button" onClick={reset} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50">판매점 등록</button>
        </div>
        {notice ? <p role="status" className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">{notice}</p> : null}
        <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-3">
          <input required value={form.name} onChange={event => change('name', event.target.value)} placeholder="판매점명" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
          {isCreating ? <>
            <input required type="email" value={form.ownerEmail} onChange={event => change('ownerEmail', event.target.value)} placeholder="판매자 이메일" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
            <input required value={form.ownerName} onChange={event => change('ownerName', event.target.value)} placeholder="판매자 이름" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
          </> : <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">판매자 {form.ownerEmail}</div>}
          <input required value={form.phone} onChange={event => change('phone', event.target.value)} placeholder="전화번호" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
          <input required value={form.cityName} onChange={event => change('cityName', event.target.value)} placeholder="시" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
          <select value={form.districtName} onChange={event => change('districtName', event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">{districts.map(value => <option key={value} value={value}>{value}</option>)}</select>
          <input required value={form.address} onChange={event => change('address', event.target.value)} placeholder="상세 주소" className="h-11 rounded-xl border border-slate-300 px-3 text-sm md:col-span-2 xl:col-span-3" />
          <input value={form.imageUrl} onChange={event => change('imageUrl', event.target.value)} placeholder="이미지 URL (https://...)" className="h-11 rounded-xl border border-slate-300 px-3 text-sm md:col-span-2" />
          <input value={form.handledItems} onChange={event => change('handledItems', event.target.value)} placeholder="취급 품목 (쉼표로 구분)" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
                    <div className="flex h-11 items-center rounded-xl border border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">별점은 거래 후기·신뢰점수 메뉴에서 자동 집계됩니다.</div>

          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm"><input type="checkbox" checked={form.verified} onChange={event => change('verified', event.target.checked)} /> 승인 상태</label>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm"><input type="checkbox" checked={form.receivingOrders} onChange={event => change('receivingOrders', event.target.checked)} /> 주문 수신</label>
          <div className="flex gap-2"><button disabled={saving} className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? '저장 중' : editing ? '수정 저장' : '판매점 등록'}</button>{editing ? <button type="button" onClick={reset} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900">취소</button> : null}</div>
        </form>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">등록 판매점 {visible.length}개</h2><button type="button" onClick={stores.reload} className="text-sm font-bold text-slate-700">목록 새로고침</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">판매점</th><th className="px-4 py-3">지역</th><th className="px-4 py-3">취급 품목</th><th className="px-4 py-3">별점</th><th className="px-4 py-3">상태</th><th className="px-4 py-3 text-right">관리</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map(store => <tr key={store.id}><td className="px-4 py-4"><p className="font-black text-slate-900">{store.name}</p><p className="mt-1 text-xs text-slate-500">{store.ownerEmail}</p></td><td className="px-4 py-4 text-slate-600">{store.cityName} {store.districtName}</td><td className="px-4 py-4 text-slate-600">{store.handledItems.join(' · ')}</td><td className="px-4 py-4 font-black text-amber-600">★ {store.rating.toFixed(1)}</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${store.verified && store.receivingOrders ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{store.verified ? (store.receivingOrders ? '운영 중' : '주문 미수신') : '승인 대기'}</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => beginEdit(store)} className="mr-3 font-bold text-slate-900">수정</button><button type="button" onClick={() => void remove(store)} className="font-bold text-rose-700">삭제</button></td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}
