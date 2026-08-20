export type KakaoPostcodeAddress = {
  address: string
  roadAddress: string
  jibunAddress: string
  cityName: string
  districtName: string
  zonecode: string
}

type KakaoPostcodeData = {
  address: string
  roadAddress: string
  jibunAddress: string
  sido: string
  sigungu: string
  zonecode: string
}

type KakaoMaps = {
  load: (callback: () => void) => void
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown
  LatLng: new (latitude: number, longitude: number) => unknown
  Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void }
  services: {
    Geocoder: new () => {
      addressSearch: (address: string, callback: (result: Array<{ x: string; y: string }>, status: string) => void) => void
    }
    Status: { OK: string }
  }
}

declare global {
  interface Window {
    daum?: { Postcode: new (options: { oncomplete: (data: KakaoPostcodeData) => void; onclose?: () => void }) => { open: () => void } }
    kakao?: { maps: KakaoMaps }
  }
}

const postcodeScriptId = 'kakao-postcode-sdk'
const mapsScriptId = 'kakao-map-sdk'
let postcodeLoader: Promise<void> | null = null
let mapsLoader: Promise<KakaoMaps> | null = null

function loadScript(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing?.dataset.loaded === 'true') return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    const complete = () => { script.dataset.loaded = 'true'; resolve() }
    script.addEventListener('load', complete, { once: true })
    script.addEventListener('error', () => reject(new Error('카카오 서비스를 불러오지 못했습니다.')), { once: true })
    if (!existing) { script.id = id; script.src = src; script.async = true; document.head.appendChild(script) }
  })
}

export function isKakaoMapConfigured() { return Boolean(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim()) }

export function toDeliveryRoadAddress(address: KakaoPostcodeAddress) {
  const parts = (address.roadAddress || address.address).trim().split(/\s+/)
  if (parts[0] === '서울' || parts[0] === '서울특별시') parts.shift()
  if (parts[0] === address.districtName) parts.shift()
  return parts.join(' ')
}

export function openKakaoPostcode(onComplete: (address: KakaoPostcodeAddress) => void, onClose?: () => void) {
  postcodeLoader ??= loadScript(postcodeScriptId, 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js')
  return postcodeLoader.then(() => {
    if (!window.daum?.Postcode) throw new Error('카카오 주소 검색을 시작하지 못했습니다.')
    new window.daum.Postcode({
      oncomplete: (data) => onComplete({
        address: data.address,
        roadAddress: data.roadAddress || data.address,
        jibunAddress: data.jibunAddress,
        cityName: data.sido === '서울' ? '서울특별시' : data.sido,
        districtName: data.sigungu.trim().split(/\s+/).at(-1) ?? '',
        zonecode: data.zonecode,
      }),
      onclose: onClose,
    }).open()
  })
}

export function loadKakaoMaps(): Promise<KakaoMaps> {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim()
  if (!key) return Promise.reject(new Error('카카오 지도 키가 설정되지 않았습니다.'))
  mapsLoader ??= loadScript(mapsScriptId, `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=${encodeURIComponent(key)}`).then(() => new Promise<KakaoMaps>((resolve, reject) => {
    const maps = window.kakao?.maps
    if (!maps) { reject(new Error('카카오 지도 서비스를 시작하지 못했습니다.')); return }
    maps.load(() => resolve(maps))
  }))
  return mapsLoader
}

export async function renderKakaoAddressMap(container: HTMLElement, address: string) {
  const maps = await loadKakaoMaps()
  const geocoder = new maps.services.Geocoder()
  return new Promise<void>((resolve, reject) => {
    geocoder.addressSearch(address, (result, status) => {
      if (status !== maps.services.Status.OK || result.length === 0) { reject(new Error('선택한 주소의 좌표를 찾지 못했습니다.')); return }
      const position = new maps.LatLng(Number(result[0].y), Number(result[0].x))
      container.replaceChildren()
      const map = new maps.Map(container, { center: position, level: 3 })
      new maps.Marker({ position }).setMap(map)
      resolve()
    })
  })
}
