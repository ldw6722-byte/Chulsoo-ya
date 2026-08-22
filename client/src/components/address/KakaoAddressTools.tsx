import { useEffect, useRef, useState } from 'react'
import { isKakaoMapConfigured, openKakaoPostcode, renderKakaoAddressMap, searchKakaoPlaces, toKakaoPostcodeAddressFromPlace, type KakaoPlaceSearchResult, type KakaoPostcodeAddress } from '@/lib/kakao'
import { notify } from '@/lib/notify'

type KakaoAddressSearchButtonProps = {
  onSelect: (address: KakaoPostcodeAddress) => void
  className?: string
}

type SearchTab = 'address' | 'place'

export function KakaoAddressSearchButton({ onSelect, className = '' }: KakaoAddressSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SearchTab>('address')
  const [openingPostcode, setOpeningPostcode] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<KakaoPlaceSearchResult[]>([])

  function close() {
    if (openingPostcode) return
    setOpen(false)
    setKeyword('')
    setResults([])
  }

  async function openPostcode() {
    setOpeningPostcode(true)
    try {
      await openKakaoPostcode((address) => {
        onSelect(address)
        setOpeningPostcode(false)
        setOpen(false)
        setKeyword('')
        setResults([])
      }, () => setOpeningPostcode(false))
    } catch (caught) {
      setOpeningPostcode(false)
      notify(caught instanceof Error ? caught.message : '카카오 주소 검색을 열지 못했습니다.', 'error')
    }
  }

  async function searchPlaces() {
    if (!keyword.trim()) {
      notify('장소명 또는 건물명을 입력해 주세요.', 'error')
      return
    }
    setSearching(true)
    try {
      const found = await searchKakaoPlaces(keyword)
      setResults(found)
      if (found.length === 0) notify('일치하는 장소를 찾지 못했습니다. 지역명과 함께 다시 검색해 주세요.', 'error')
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '장소명 검색을 시작하지 못했습니다.', 'error')
    } finally {
      setSearching(false)
    }
  }

  function selectPlace(place: KakaoPlaceSearchResult) {
    onSelect(toKakaoPostcodeAddressFromPlace(place))
    setOpen(false)
    setKeyword('')
    setResults([])
  }

  return <><button type="button" onClick={() => setOpen(true)} className={'min-h-11 shrink-0 rounded-xl border border-brand-600 bg-white px-4 text-sm font-black text-brand-700 transition hover:bg-brand-50 dark:bg-slate-900 dark:text-brand-300 ' + className}>주소·장소명 찾기</button>{open ? <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="주소와 장소명 찾기"><section className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700"><div><p className="text-xs font-black text-brand-600">KAKAO ADDRESS</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">주소·장소명 찾기</h2></div><button type="button" onClick={close} disabled={openingPostcode} className="min-h-10 rounded-lg px-3 text-sm font-black text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white">닫기</button></div><div className="flex border-b border-slate-200 px-5 dark:border-slate-700"><button type="button" onClick={() => setTab('address')} className={'min-h-11 border-b-2 px-4 text-sm font-black transition ' + (tab === 'address' ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white')}>주소 검색</button><button type="button" onClick={() => setTab('place')} className={'min-h-11 border-b-2 px-4 text-sm font-black transition ' + (tab === 'place' ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white')}>장소명 검색</button></div>{tab === 'address' ? <div className="p-5"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">도로명·건물번호 또는 동·번지로 정확한 배송 주소를 찾습니다.</p><button type="button" disabled={openingPostcode} onClick={() => void openPostcode()} className="mt-4 min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-black text-white transition hover:bg-brand-700 disabled:opacity-50">{openingPostcode ? '주소창 여는 중…' : '카카오 주소창 열기'}</button></div> : <div className="p-5"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">상호·건물·랜드마크를 검색합니다. 정확도를 위해 지역명을 함께 입력해 주세요.</p><div className="mt-4 flex gap-2"><input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void searchPlaces() }} placeholder="예) 중구 롯데백화점, 강남역" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-brand-950/50" /><button type="button" disabled={searching} onClick={() => void searchPlaces()} className="min-h-11 shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-black text-white transition hover:bg-brand-700 disabled:opacity-50">{searching ? '검색 중…' : '검색'}</button></div>{results.length > 0 ? <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">{results.map((place, index) => <li key={`${place.name}-${place.roadAddress || place.address}-${index}`}><button type="button" onClick={() => selectPlace(place)} className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800"><p className="font-black text-slate-900 dark:text-white">{place.name}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{place.roadAddress || place.address}</p>{place.roadAddress ? <p className="mt-1 text-[11px] text-slate-400">지번 {place.address}</p> : <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">도로명 정보가 없어 지번 주소로 적용됩니다.</p>}</button></li>)}</ul> : null}</div>}</section></div> : null}</>
}

export function KakaoAddressMapPreview({ address }: { address: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  useEffect(() => {
    const container = containerRef.current
    if (!container || !address.trim() || !isKakaoMapConfigured()) return
    let active = true
    setState('loading')
    void renderKakaoAddressMap(container, address.trim()).then(
      () => { if (active) setState('idle') },
      () => { if (active) setState('error') },
    )
    return () => { active = false }
  }, [address])
  if (!address.trim()) return null
  if (!isKakaoMapConfigured()) return <p className="mt-2 text-xs text-slate-500">카카오 주소가 선택되면 지도로 위치를 확인할 수 있습니다.</p>
  return <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"><div ref={containerRef} className="h-48 w-full" aria-label="선택한 주소 지도" />{state === 'loading' ? <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700">지도를 불러오는 중입니다.</p> : null}{state === 'error' ? <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700">선택한 주소의 지도를 표시하지 못했습니다.</p> : null}</div>
}
