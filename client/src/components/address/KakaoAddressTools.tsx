import { useEffect, useRef, useState } from 'react'
import { isKakaoMapConfigured, openKakaoPostcode, renderKakaoAddressMap, type KakaoPostcodeAddress } from '@/lib/kakao'
import { notify } from '@/lib/notify'

type KakaoAddressSearchButtonProps = {
  onSelect: (address: KakaoPostcodeAddress) => void
  className?: string
}

export function KakaoAddressSearchButton({ onSelect, className = '' }: KakaoAddressSearchButtonProps) {
  const [opening, setOpening] = useState(false)
  async function open() {
    setOpening(true)
    try { await openKakaoPostcode(onSelect, () => setOpening(false)) }
    catch (caught) { setOpening(false); notify(caught instanceof Error ? caught.message : '카카오 주소 검색을 열지 못했습니다.', 'error') }
  }
  return <button type="button" disabled={opening} onClick={() => void open()} className={'min-h-11 shrink-0 rounded-xl border border-brand-600 bg-white px-4 text-sm font-black text-brand-700 transition hover:bg-brand-50 disabled:opacity-50 dark:bg-slate-900 dark:text-brand-300 ' + className}>{opening ? '주소창 여는 중…' : '카카오 주소 찾기'}</button>
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
