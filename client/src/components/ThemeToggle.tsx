import { useTheme } from '@/app/useTheme'

const TRACK_CLASS = 'relative inline-flex h-8 w-16 shrink-0 items-center justify-between rounded-full border border-slate-300 bg-stone-100 p-1 shadow-inner transition-colors duration-200 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
const KNOB_CLASS = 'absolute left-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[14px] shadow-sm transition-transform duration-200 dark:bg-slate-100'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
      title={isDark ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
      className={TRACK_CLASS}
    >
      <span aria-hidden="true" className="grid flex-1 place-items-center text-[13px] text-amber-500">☀</span>
      <span aria-hidden="true" className="grid flex-1 place-items-center text-[14px] text-slate-500 dark:text-slate-300">☾</span>
      <span aria-hidden="true" className={`${KNOB_CLASS} ${isDark ? 'translate-x-8' : 'translate-x-0'}`}>
        {isDark ? '☾' : '☀'}
      </span>
    </button>
  )
}
