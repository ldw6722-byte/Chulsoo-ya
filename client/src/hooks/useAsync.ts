import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  reload: () => void
}

/**
 * REST 조회용 최소 훅.
 * ponytail: React Query 를 추가하지 않고 표준 훅으로 처리한다.
 * upgrade path: 캐시 공유·낙관적 업데이트가 필요해지면 도입.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: { pollMs?: number; enabled?: boolean },
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)
  const mountedRef = useRef(true)
  const enabled = options?.enabled ?? true

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetcher()
      .then((result) => {
        if (cancelled || !mountedRef.current) return
        setData(result)
        setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled || !mountedRef.current) return
        setError(e instanceof ApiError ? e : new ApiError('UNKNOWN', '오류가 발생했습니다.', 500))
      })
      .finally(() => {
        if (cancelled || !mountedRef.current) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled])

  useEffect(() => {
    const pollMs = options?.pollMs
    if (!pollMs || !enabled) return
    const timer = window.setInterval(() => setTick((t) => t + 1), pollMs)
    return () => window.clearInterval(timer)
  }, [options?.pollMs, enabled])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, reload }
}
