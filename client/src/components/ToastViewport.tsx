import { useEffect, useState } from "react"

import type { ToastKind } from "@/lib/notify"
type Toast = { id: number; message: string; kind: ToastKind }


export function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Toast, "id">>).detail
      const id = Date.now() + Math.random()
      setToasts((current) => [...current.slice(-2), { id, ...detail }])
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600)
    }
    window.addEventListener("chulsooya:toast", handler)
    return () => window.removeEventListener("chulsooya:toast", handler)
  }, [])
  return <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-20 z-[100] -translate-x-1/2 grid w-[min(24rem,calc(100vw-2.5rem))] gap-2">{toasts.map((toast) => <div key={toast.id} role="status" className={`rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${toast.kind === "success" ? "bg-slate-900" : "bg-rose-600"}`}>{toast.message}</div>)}</div>
}
