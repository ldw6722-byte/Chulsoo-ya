export type ToastKind = "success" | "error"

export function notify(message: string, kind: ToastKind = "success") {
  window.dispatchEvent(new CustomEvent("chulsooya:toast", { detail: { message, kind } }))
}
