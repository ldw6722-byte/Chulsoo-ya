import { useRef, useState } from "react"
import type { CustomerNotification } from "@/types/api"
function BellIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path strokeLinecap="round" d="M10 21h4" /></svg> }
export function HeaderNotifications({ notifications, onRead }: { notifications: CustomerNotification[]; onRead: (item: CustomerNotification) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const keepOpen = () => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); closeTimer.current = null; setOpen(true) }
  const delayClose = () => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); closeTimer.current = window.setTimeout(() => setOpen(false), 180) }
    const unreadNotifications = notifications.filter((item) => item.readAt == null)
  const unread = unreadNotifications.length

  return <div className="relative shrink-0" onMouseEnter={keepOpen} onMouseLeave={delayClose}>
    <button type="button" onClick={keepOpen} className="relative grid h-14 w-14 place-items-center rounded-2xl text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-brand-200" aria-label={"\uC54C\uB9BC"} aria-expanded={open}>
      <span className="h-7 w-7"><BellIcon /></span>
      {unread > 0 ? <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">{unread > 99 ? "99+" : unread}</span> : null}
    </button>
    {open ? <div className="absolute right-0 top-full z-60 mt-2 w-88 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><p className="text-sm font-black text-slate-900 dark:text-white">{"\uC54C\uB9BC"}</p><p className="mt-1 text-xs text-slate-400">{"\uC8FC\uBB38\u00B7\uB9E4\uCE6D\u00B7\uBB38\uC758 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694."}</p></div>
      <div className="max-h-88 overflow-y-auto">
                {unreadNotifications.length ? unreadNotifications.slice(0, 6).map((item) => <button key={item.id} type="button" onClick={() => void onRead(item).then(() => setOpen(false))} className="block w-full border-b border-slate-100 bg-brand-50/50 px-4 py-3 text-left hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-800/70 dark:hover:bg-slate-800">

          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{item.content}</p>
        </button>) : <p className="px-4 py-10 text-center text-sm text-slate-400">{"\uBBF8\uD655\uC778 \uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>}
      </div>
    </div> : null}
  </div>
}
