import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTO_ADVANCE_MS = 6500

const EVENT_HEROES = [
  {
    productId: 185,
    eyebrow: '한정 특가 · 수공구',
    badge: '46% OFF',
    title: '프로페셔널 줄자\n행사 특가',
    description: '현장 측정에 자주 쓰는 스틸 포켓 줄자를 기간 한정 특가로 만나보세요.',
    cta: '행사 상품 보기',
    icon: '📏',
    gradient: 'from-indigo-700 via-blue-600 to-cyan-500',
  },
  {
    productId: 379,
    eyebrow: '절단·연마 기획전',
    badge: '38% OFF',
    title: '4인치 연마석\n교체 소모품 특가',
    description: '그라인더 작업용 연마석을 합리적인 행사 가격으로 준비했습니다.',
    cta: '연마석 상세 보기',
    icon: '⚙️',
    gradient: 'from-rose-700 via-orange-600 to-amber-500',
  },
  {
    productId: 548,
    eyebrow: '철물 고정재 행사',
    badge: '30% OFF',
    title: '케미컬 앙카\n현장 보강 특가',
    description: '안정적인 고정이 필요한 시공 현장을 위한 앙카 행사 상품입니다.',
    cta: '앙카 상세 보기',
    icon: '🧱',
    gradient: 'from-slate-800 via-slate-600 to-stone-500',
  },
  {
    productId: 785,
    eyebrow: '욕실·설비 교체전',
    badge: '34% OFF',
    title: '욕실 꾸미기 행사전',
    description: '욕실 분위기 전환',
    cta: '구경하기',
    icon: '🛁',
    gradient: 'from-teal-700 via-emerald-600 to-lime-500',
  },
  {
    productId: 924,
    eyebrow: '전기 안전 행사',
    badge: '35% OFF',
    title: '개별 스위치 멀티탭\n안전 특가',
    description: '현장과 매장에서 바로 쓰는 6구 멀티탭을 행사 가격으로 제공합니다.',
    cta: '멀티탭 상세 보기',
    icon: '⚡',
    gradient: 'from-violet-800 via-purple-700 to-fuchsia-600',
  },
] as const

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7 md:h-9 md:w-9">
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

export function EventHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const previous = useCallback(
    () => setActiveIndex((index) => (index - 1 + EVENT_HEROES.length) % EVENT_HEROES.length),
    [],
  )
  const next = useCallback(
    () => setActiveIndex((index) => (index + 1) % EVENT_HEROES.length),
    [],
  )

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(next, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [next, paused])

  return (
    <section
      className="relative mb-9 h-76 overflow-hidden rounded-3xl bg-slate-900 shadow-xl md:h-96"
      aria-roledescription="carousel"
      aria-label="철수야 행사 상품 배너"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {EVENT_HEROES.map((hero, index) => {
        const isActive = index === activeIndex
        return (
          <article
            key={hero.productId}
            aria-hidden={!isActive}
            className={`absolute inset-0 flex items-center overflow-hidden bg-gradient-to-r ${hero.gradient} px-7 text-white transition-[opacity,transform] duration-700 ease-out md:px-14 ${isActive ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-5 opacity-0'}`}
          >
            <div className="relative z-10 max-w-xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-black tracking-wide backdrop-blur">{hero.eyebrow}</span>
                <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-black shadow-sm">{hero.badge}</span>
              </div>
              <h1 className="whitespace-pre-line text-3xl font-black leading-tight tracking-tight md:text-5xl">{hero.title}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/90 md:text-base">{hero.description}</p>
              <Link
                to={`/product/${hero.productId}`}
                className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border-2 border-white bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,.24)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_14px_28px_rgba(15,23,42,.32)] focus:outline-none focus:ring-4 focus:ring-white/60"
              >
                <span className="text-slate-900">{hero.cta}</span>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-white transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <div className="pointer-events-none absolute -right-14 top-7 hidden h-76 w-76 rounded-full border-20 border-white/10 md:block" />
            <div className="pointer-events-none absolute bottom-5 right-15 hidden text-9xl opacity-25 drop-shadow-2xl md:block">{hero.icon}</div>
          </article>
        )
      })}

      <button
        type="button"
        onClick={previous}
        className="absolute inset-y-0 left-0 z-20 grid w-11 place-items-center text-white/90 transition hover:bg-slate-950/10 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60 md:w-16"
        aria-label="이전 행사 배너"
      >
        <Arrow direction="left" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute inset-y-0 right-0 z-20 grid w-11 place-items-center text-white/90 transition hover:bg-slate-950/10 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60 md:w-16"
        aria-label="다음 행사 배너"
      >
        <Arrow direction="right" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/20 px-3 py-2 backdrop-blur" aria-label="배너 선택">
        {EVENT_HEROES.map((hero, index) => (
          <button
            key={hero.productId}
            type="button"
            aria-label={`${index + 1}번 행사 배너 보기`}
            aria-current={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/85'}`}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{activeIndex + 1} / {EVENT_HEROES.length} 행사 배너</p>
    </section>
  )
}
