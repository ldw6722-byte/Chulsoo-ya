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

// ponytail: 개발 단계 신원은 헤더로 전달한다.
// upgrade path: Supabase Auth 세션 토큰을 Authorization: Bearer 로 교체.
http.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return config
  }

  // ponytail: local 프로파일 E2E와 시드 계정 검증을 위한 개발 전용 fallback.
  // upgrade path: Supabase 운영 전환 뒤에는 서버가 이 헤더를 인증 근거로 허용하지 않는다.
  const identity = loadIdentity()
  if (identity) {
    config.headers.set('X-User-Id', String(identity.userId))
    config.headers.set('X-User-Role', identity.role)
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
