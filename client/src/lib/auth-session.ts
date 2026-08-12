// Supabase 세션 access token은 이 모듈 메모리에만 보관한다.
// 브라우저 영속화·갱신은 @supabase/supabase-js가 담당한다.
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}
