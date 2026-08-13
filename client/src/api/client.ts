import axios, { AxiosError } from 'axios'
import type { ApiEnvelope, ApiErrorBody, UserRole } from '@/types/api'
import { getAccessToken } from '@/lib/auth-session'

/**
 * 애플리케이션 전체의 유일한 HTTP 진입점.
 * AGENTS.md 2: fetch 직접 호출 금지, 컴포넌트에서 axios 직접 import 금지.
 */
export const http = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

const IDENTITY_STORAGE_KEY = 'chulsooya.identity'

export interface Identity {
  userId: number
  role: UserRole
  name: string
}

export function loadIdentity(): Identity | null {
  const raw = localStorage.getItem(IDENTITY_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Identity
  } catch {
    return null
  }
}

export function saveIdentity(identity: Identity | null): void {
  if (identity === null) {
    localStorage.removeItem(IDENTITY_STORAGE_KEY)
    return
  }
  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity))
}

// ponytail: 개발 단계에는 사용자 ID와 역할 힌트를 전달한다. 최신 서버는 DB의 실제 역할을 우선하며, 이전 로컬 실행본과의 호환을 유지한다.
// upgrade path: 운영 전환 뒤에는 import.meta.env.DEV 분기와 개발 헤더를 제거한다.
http.interceptors.request.use((config) => {
  // ponytail: 개발 관리자 화면은 저장된 시드 신원을 먼저 사용한다.
  // upgrade path: 운영 전환 뒤에는 import.meta.env.DEV 분기와 개발 헤더를 제거한다.
  const accessToken = getAccessToken()
  // 실제 Supabase 세션이 있으면 개발 시드 신원보다 JWT를 우선한다.
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return config
  }

  const developmentIdentity = import.meta.env.DEV ? loadIdentity() : null
  if (developmentIdentity) {
    config.headers.set('X-User-Id', String(developmentIdentity.userId))
    config.headers.set('X-User-Role', developmentIdentity.role)
  }
  return config
})

/** 서버 오류 규약 { error: { code, message } } 을 그대로 노출한다. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

function toApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiErrorBody>
  const body = axiosError.response?.data
  if (body?.error) {
    return new ApiError(body.error.code, body.error.message, axiosError.response?.status ?? 500)
  }
  if (axiosError.code === 'ECONNABORTED') {
    return new ApiError('TIMEOUT', '서버 응답이 지연되고 있습니다. 다시 시도해 주세요.', 408)
  }
  if (!axiosError.response) {
    return new ApiError('NETWORK_ERROR', '네트워크에 연결할 수 없습니다.', 0)
  }
  return new ApiError('UNKNOWN', '알 수 없는 오류가 발생했습니다.', axiosError.response.status)
}

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

/** 성공 응답 래퍼를 벗겨 data 만 반환한다. */
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}
