import { useTheme } from '@/app/useTheme'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return <button type="button" onClick={toggleTheme} aria-pressed={dark} aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'} className={'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ' + (compact ? 'w-11 px-0' : '')}><span aria-hidden="true" className="text-base">{dark ? '☀' : '☾'}</span>{compact ? null : <span>{dark ? '라이트 모드' : '다크 모드'}</span>}</button>
}
