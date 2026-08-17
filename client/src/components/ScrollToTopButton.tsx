import { useEffect, useState } from 'react'

const SHOW_AFTER_PX = 320

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const syncVisibility = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    syncVisibility()
    window.addEventListener('scroll', syncVisibility, { passive: true })
    return () => window.removeEventListener('scroll', syncVisibility)
  }, [])

  if (!visible) return null

  return <button type="button" aria-label="맨 위로 이동" title="맨 위로 이동" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full border border-brand-500 bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-900/25 transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 sm:bottom-7 sm:right-7" >↑<span className="sr-only">맨 위로 이동</span></button>
}
