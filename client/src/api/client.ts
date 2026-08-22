import axios, { AxiosError } from 'axios'
import type { ApiEnvelope, ApiErrorBody, UserRole } from '@/types/api'
import { getAccessToken } from '@/lib/auth-session'

/**
 * ?좏뵆由ъ??댁뀡 ?꾩껜???좎씪??HTTP 吏꾩엯??
 * AGENTS.md 2: fetch 吏곸젒 ?몄텧 湲덉?, 而댄룷?뚰듃?먯꽌 axios 吏곸젒 import 湲덉?.
 */
export const http = axios.create({
  baseURL: '/api',
  timeout: 10_000,
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

// ponytail: 媛쒕컻 ?④퀎?먮뒗 ?ъ슜??ID? ??븷 ?뚰듃瑜??꾨떖?쒕떎. 理쒖떊 ?쒕쾭??DB???ㅼ젣 ??븷???곗꽑?섎ŉ, ?댁쟾 濡쒖뺄 ?ㅽ뻾蹂멸낵???명솚???좎??쒕떎.
// upgrade path: ?댁쁺 ?꾪솚 ?ㅼ뿉??import.meta.env.DEV 遺꾧린? 媛쒕컻 ?ㅻ뜑瑜??쒓굅?쒕떎.
http.interceptors.request.use((config) => {
  // ponytail: 媛쒕컻 愿由ъ옄 ?붾㈃? ??λ맂 ?쒕뱶 ?좎썝??癒쇱? ?ъ슜?쒕떎.
  // upgrade path: ?댁쁺 ?꾪솚 ?ㅼ뿉??import.meta.env.DEV 遺꾧린? 媛쒕컻 ?ㅻ뜑瑜??쒓굅?쒕떎.
  const accessToken = getAccessToken()
  // ?ㅼ젣 Supabase ?몄뀡???덉쑝硫?媛쒕컻 ?쒕뱶 ?좎썝蹂대떎 JWT瑜??곗꽑?쒕떎.
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

/** ?쒕쾭 ?ㅻ쪟 洹쒖빟 { error: { code, message } } ??洹몃?濡??몄텧?쒕떎. */
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
    return new ApiError('TIMEOUT', '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.', 408)
  }
  if (!axiosError.response) {
    return new ApiError('NETWORK_ERROR', '서버에 연결하지 못했습니다.', 0)
  }
  return new ApiError('UNKNOWN', '요청을 처리하지 못했습니다.', axiosError.response.status)
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error)
    return Promise.reject(apiError)
  },
)

/** ?깃났 ?묐떟 ?섑띁瑜?踰쀪꺼 data 留?諛섑솚?쒕떎. */
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

export interface BinaryDownload {
  blob: Blob
  fileName: string
}

/** JSON envelope가 아닌 서버 생성 파일도 동일한 Axios 인증 채널로 받는다. */
export async function downloadBinary(path: string, fallbackFileName: string): Promise<BinaryDownload> {
  const response = await http.get<Blob>(path, { responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const rfc5987 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  let fileName = fallbackFileName
  try {
    fileName = rfc5987 ? decodeURIComponent(rfc5987) : plain ?? fallbackFileName
  } catch {
    fileName = plain ?? fallbackFileName
  }
  return { blob: response.data, fileName }
}

export function saveBinaryDownload(file: BinaryDownload): void {
  const url = URL.createObjectURL(file.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
