import { useEffect, useRef, useState } from 'react'

/**
 * 서버 마감 시각 기준 카운트다운.
 * AGENTS.md 3.1: 기기 시간을 신뢰하지 않는다. 서버가 준 serverTime 과 deadline 의 차이를
 * 기준으로 남은 시간을 계산하고, 이후 경과는 로컬 경과 시간(performance)으로만 보정한다.
 */
export function useServerCountdown(
  deadlineIso: string | null | undefined,
  serverTimeIso: string | null | undefined,
): { remainingMs: number; expired: boolean } {
  const [remainingMs, setRemainingMs] = useState(0)
  const baseRef = useRef<{ initial: number; startedAt: number } | null>(null)

  useEffect(() => {
    if (!deadlineIso || !serverTimeIso) {
      baseRef.current = null
      setRemainingMs(0)
      return
    }
    const initial = new Date(deadlineIso).getTime() - new Date(serverTimeIso).getTime()
    baseRef.current = { initial, startedAt: performance.now() }
    setRemainingMs(Math.max(0, initial))

    const timer = window.setInterval(() => {
      const base = baseRef.current
      if (!base) return
      const elapsed = performance.now() - base.startedAt
      setRemainingMs(Math.max(0, base.initial - elapsed))
    }, 250)

    return () => window.clearInterval(timer)
  }, [deadlineIso, serverTimeIso])

  const hasDeadline = Boolean(deadlineIso && serverTimeIso)
  return { remainingMs, expired: hasDeadline && remainingMs <= 0 }
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
