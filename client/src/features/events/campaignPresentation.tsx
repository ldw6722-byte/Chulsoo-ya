/* oxlint-disable react/only-export-components */
import type { ReactNode } from 'react'

export const THEME_OPTIONS = [
  ['blue', '블루 웨이브', 'from-indigo-700 via-blue-600 to-cyan-500'], ['orange', '오렌지 스파크', 'from-rose-700 via-orange-600 to-amber-500'], ['charcoal', '차콜 스틸', 'from-slate-800 via-slate-600 to-stone-500'], ['green', '그린 워크', 'from-teal-700 via-emerald-600 to-lime-500'], ['violet', '바이올렛 나이트', 'from-violet-800 via-purple-700 to-fuchsia-600'],
  ['ocean', '오션 딥', 'from-cyan-800 via-sky-600 to-blue-400'], ['sunset', '선셋 코랄', 'from-orange-800 via-rose-600 to-pink-400'], ['copper', '코퍼 브론즈', 'from-amber-900 via-orange-700 to-yellow-500'], ['lime', '라임 필드', 'from-lime-800 via-green-600 to-emerald-400'], ['graphite', '그래파이트', 'from-zinc-900 via-slate-700 to-slate-500'],
  ['ruby', '루비 레드', 'from-red-900 via-rose-700 to-red-400'], ['sky', '스카이 클리어', 'from-sky-800 via-sky-500 to-cyan-300'], ['navy', '네이비 블루', 'from-blue-950 via-blue-800 to-indigo-500'], ['coral', '코랄 핑크', 'from-rose-800 via-pink-600 to-orange-400'], ['mint', '민트 글로우', 'from-emerald-800 via-teal-500 to-cyan-300'],
  ['amber', '앰버 골드', 'from-yellow-900 via-amber-600 to-orange-400'], ['midnight', '미드나이트', 'from-slate-950 via-indigo-900 to-blue-700'], ['sand', '샌드 베이지', 'from-stone-800 via-amber-600 to-yellow-300'], ['aurora', '오로라', 'from-violet-900 via-cyan-700 to-emerald-400'], ['berry', '베리 그라데이션', 'from-fuchsia-900 via-purple-700 to-rose-500'],
] as const
export const THEME_CLASS = Object.fromEntries(THEME_OPTIONS.map(([key, , value]) => [key, value])) as Record<string, string>

type IconOption = { key: string; label: string; paths: string[]; extras?: ReactNode }
export const ICON_OPTIONS: IconOption[] = [
  { key: 'toolbox', label: '공구함', paths: ['M4 9h16v10H4z', 'M9 9V6h6v3', 'M4 13h16', 'M10 14h4'] },
  { key: 'hammer', label: '망치', paths: ['m14 5 5 5-3 3-5-5z', 'm12 12-7 7'] },
  { key: 'drill', label: '전동드릴', paths: ['M4 9h10l3 3-3 3H9v4H6v-7H4z', 'M14 11h5v4h-5', 'M6 19h4'] },
  { key: 'wrench', label: '렌치', paths: ['M14 5a4 4 0 0 0-4 5l-5 5 4 4 5-5a4 4 0 0 0 5-4l-3 1-2-2z'] },
  { key: 'bolts', label: '볼트·너트', paths: ['M8 4h8l3 4-3 4H8L5 8z', 'M10 8h4', 'M12 12v8'] },
  { key: 'screw', label: '나사', paths: ['M7 5h10l2 3-2 3H7L5 8z', 'm12 11-4 8', 'm8 15 4 4', 'm12 11 4 4'] },
  { key: 'pliers', label: '플라이어', paths: ['m8 4 4 5 4-5', 'm12 9-5 10', 'm12 9 5 10', 'M7 19h2', 'M15 19h2'] },
  { key: 'tape', label: '줄자', paths: ['M5 7a7 7 0 1 1 0 10z', 'M8 10h7v5H8z', 'M12 10v5'] },
  { key: 'ladder', label: '사다리', paths: ['M6 20 9 4', 'm12 20 3-16', 'M8 9h5', 'M7 14h6'] },
  { key: 'saw', label: '톱', paths: ['M4 7h12l4 5-4 5H4z', 'm7 12 2 2 2-2 2 2 2-2'] },
  { key: 'faucet', label: '수전', paths: ['M5 9h10a4 4 0 0 1 4 4v2', 'M10 9V5h4v4', 'M7 5h10', 'M19 15h-3'] },
  { key: 'pipe', label: '배관', paths: ['M6 5v7a4 4 0 0 0 4 4h8', 'M4 5h4', 'M18 14h3v5', 'M14 19h7'] },
  { key: 'shower', label: '샤워', paths: ['M6 8a6 6 0 0 1 12 0', 'M12 8V4', 'M6 8h12', 'M8 13v1', 'M12 13v1', 'M16 13v1'] },
  { key: 'bulb', label: '조명', paths: ['M9 18h6', 'M10 21h4', 'M8 14a6 6 0 1 1 8 0c-1 1-2 2-2 4h-4c0-2-1-3-2-4z'] },
  { key: 'plug', label: '전기 플러그', paths: ['M8 4v6', 'M16 4v6', 'M7 10h10v3a5 5 0 0 1-10 0z', 'M12 18v3'] },
  { key: 'fan', label: '환풍기', paths: ['M12 12a2 2 0 1 0 0 .1', 'M12 10c0-5 5-5 5-2', 'M14 12c5 0 5 5 2 5', 'M12 14c0 5-5 5-5 2', 'M10 12c-5 0-5-5-2-5'] },
  { key: 'hardhat', label: '안전모', paths: ['M4 15h16', 'M6 15a6 6 0 0 1 12 0', 'M12 9V6', 'M8 18h8'] },
  { key: 'shield', label: '안전 방패', paths: ['M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', 'm9 12 2 2 4-4'] },
  { key: 'gloves', label: '작업 장갑', paths: ['M8 20c-2 0-3-2-3-4V9a1 1 0 0 1 2 0v3V5a1 1 0 0 1 2 0v6V4a1 1 0 0 1 2 0v7V5a1 1 0 0 1 2 0v8l1-2a1 1 0 0 1 2 1l-2 6c-1 2-2 2-5 2z'] },
  { key: 'paint', label: '페인트', paths: ['M6 4h12v6H6z', 'M9 10v8', 'M7 18h4', 'M14 14c2 1 3 2 3 4a2 2 0 1 1-4 0c0-1 1-3 1-4z'] },
  { key: 'brick', label: '벽돌', paths: ['M4 7h16v10H4z', 'M4 12h16', 'M8 7v5', 'M15 12v5'] },
  { key: 'wood', label: '목재', paths: ['M4 7h16v10H4z', 'M8 10c2-2 4 2 6 0', 'M9 14c2-2 4 2 6 0'] },
  { key: 'box', label: '자재 상자', paths: ['M4 8 12 4l8 4v9l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v9'] },
  { key: 'cart', label: '운반 카트', paths: ['M4 5h2l2 10h10l2-7H8', 'M10 20a1 1 0 1 0 0 .1', 'M17 20a1 1 0 1 0 0 .1'] },
  { key: 'snow', label: '겨울 눈꽃', paths: ['M12 3v18', 'm5 7 14 10', 'M5 17 19 7', 'm9 4 3 3 3-3', 'm9 20 3-3 3 3'] },
  { key: 'spring', label: '봄 잎사귀', paths: ['M6 18c8 0 12-5 12-12C10 6 6 10 6 18z', 'm6 18 8-8'] },
  { key: 'sun', label: '여름 해', paths: ['M12 3v3', 'M12 18v3', 'm3 12h3', 'm15 12h3', 'm5.6 5.6 2.1 2.1', 'm16.3 16.3 2.1 2.1', 'm18.4 5.6-2.1 2.1', 'm7.7 16.3-2.1 2.1', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'] },
  { key: 'rain', label: '비', paths: ['M7 16h10a4 4 0 0 0 0-8 5 5 0 0 0-9-1 4 4 0 0 0-1 9z', 'm9 19-1 2', 'm13 19-1 2', 'm17 19-1 2'] },
  { key: 'cloud', label: '구름', paths: ['M6 17h11a4 4 0 0 0 0-8 5 5 0 0 0-9-1 4 4 0 0 0-2 8z'] },
  { key: 'wind', label: '바람', paths: ['M4 9h11a3 3 0 1 0-3-3', 'M4 13h15a3 3 0 1 1-3 3', 'M4 17h7'] },
]
export const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(item => [item.key, item])) as Record<string, IconOption>
export function CampaignIcon({ iconKey, className = 'h-20 w-20', strokeWidth = 1.6 }: { iconKey: string; className?: string; strokeWidth?: number }) { const icon = ICON_MAP[iconKey] ?? ICON_MAP.toolbox; return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>{icon.paths.map((path, index) => <path key={`${icon.key}-${index}`} d={path} />)}</svg> }
