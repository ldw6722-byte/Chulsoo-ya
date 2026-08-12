# 철수야 인증 아키텍처

## 구현 계약

철수야는 Supabase Auth를 **인증 주체**로 사용하고, Spring Boot의 `users` 테이블을 **플랫폼 역할과 도메인 프로필의 진실 공급원**으로 사용한다. 이메일·비밀번호 가입과 Google·Kakao OAuth는 브라우저에서 Supabase Auth를 통해 처리한다. 로그인 성공 뒤 프론트엔드는 Supabase access token을 `Authorization: Bearer` 헤더에 담아 `GET /api/auth/me`을 호출하고, Spring Boot는 검증된 JWT의 `sub`를 기준으로 로컬 사용자를 생성 또는 동기화한다.

| 레이어 | 책임 | 금지 사항 |
| :--- | :--- | :--- |
| React + Supabase JS | Email 가입·로그인, Google/Kakao OAuth 리디렉션, 세션 갱신, 로그아웃 | service role key·JWT secret 보관 금지 |
| Spring Boot Resource Server | Bearer JWT 서명·issuer·expiry 검증, 사용자 동기화, 역할 기반 도메인 권한 | 클라이언트가 보낸 `role`을 신뢰하지 않음 |
| PostgreSQL `users` | 플랫폼 내부 PK, `supabase_user_id`, 표시 이름, 전화번호, 역할 | access/refresh token 영속화 금지 |
| Supabase Auth | 사용자 자격증명, OAuth 연결, 이메일 확인, 세션 발급 | 주문·낙찰 등 도메인 상태를 직접 결정하지 않음 |

> Kordeal의 구성에서 확인한 **중앙 AuthContext**, **Google/Kakao 2열 버튼**, **이메일 구분선**, **가입 후 이메일 확인 안내**, **OAuth callback route**의 사용자 흐름을 참고한다. 그러나 하드코딩된 비밀값과 전체 API 허용 방식은 철수야에 반영하지 않는다.

## 사용자 스키마 변경

`users` 테이블은 기존 정수형 플랫폼 ID를 유지하고 Supabase Auth의 UUID를 별도 고유 키로 추가한다. 이 방식은 장바구니·주문·판매자 매장 등 기존 외래 키를 보존하면서 외부 인증 식별자를 안전하게 연결한다.

| 컬럼 | 타입 | 제약 | 용도 |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, 기존 유지 | 도메인 관계의 내부 식별자 |
| `supabase_user_id` | `uuid` | nullable, unique | Supabase JWT `sub`와 1:1 연결 |
| `email` | `varchar` | unique, not null | Auth 사용자 이메일의 최신 스냅샷 |
| `name` | `varchar` | not null | OAuth 메타데이터 또는 이메일 앞부분 기반 표시 이름 |
| `role` | enum 문자열 | not null | 최초 동기화 시 `CONSUMER`; 판매자 승격은 검증 절차 전용 |

초기 동기화가 발생한 신규 계정은 항상 `CONSUMER`로 생성한다. OAuth 메타데이터의 role, 클라이언트 요청 body의 role, 임의 헤더 값은 판매자나 관리자로 승격하는 근거가 될 수 없다.

## OAuth 및 이메일 흐름

| 흐름 | 브라우저 동작 | 콜백·서버 동작 |
| :--- | :--- | :--- |
| Email 회원가입 | `signUp({ email, password, options: { data: { name }, emailRedirectTo } })` | Supabase 확인 메일 발송 후 `/auth/callback`으로 복귀, 세션 수립 뒤 `/api/auth/me` 동기화 |
| Email 로그인 | `signInWithPassword({ email, password })` | 세션 access token을 Axios에 적용하고 `/api/auth/me` 호출 |
| Google 로그인 | `signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } })` | Supabase callback → `/auth/callback` → 세션 확인·동기화 |
| Kakao 로그인 | `signInWithOAuth({ provider: 'kakao', options: { redirectTo } })` | Supabase callback → `/auth/callback` → 세션 확인·동기화 |
| 로그아웃 | `supabase.auth.signOut()` | 메모리 Authorization token과 인증 상태 제거 |

Google은 Google Cloud에서 웹 OAuth Client를 만들고 Supabase가 제공하는 callback URL을 Google의 Authorized redirect URI로 등록해야 한다. Kakao는 REST API key와 Kakao Login Client Secret을 Supabase Provider에 저장하며, Kakao Developer Portal에는 Supabase callback URL을 등록해야 한다. 브라우저 callback URL은 Supabase **Redirect URLs allow list**에 정확히 등록한다. [1] [2] [3]

## Spring Boot JWT 검증

Supabase의 비대칭 JWT signing key를 사용한다. Spring Security Resource Server는 `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`의 JWKS로 서명을 검증하고, issuer를 `https://<project-ref>.supabase.co/auth/v1`로 제한한다. 이는 JWT secret을 애플리케이션에 배포하지 않고 키 교체를 지원하는 방식이다. Supabase는 대칭 HS256 secret보다 비대칭 signing key 사용을 권장한다. [4] [5]

```text
Browser → Supabase Auth → access token (JWT)
       → Authorization: Bearer <JWT>
       → Spring Resource Server (JWKS + issuer validation)
       → AuthUserService (sub UUID로 users upsert)
       → CurrentUserResolver (internal user id + platform role)
       → Order / Cart / Seller REST API
```

`local` 프로파일은 기존 `X-User-Id`와 `X-User-Role` 개발 헤더를 유지해 시드 데이터와 E2E 검증을 지원한다. `supabase` 프로파일에서는 Spring Security가 모든 비공개 API에 Bearer JWT를 요구하고, 개발 헤더를 사용자 인증 근거로 사용하지 않는다.

## 환경변수 및 리디렉션 계약

| 위치 | 변수 | 공개 가능 여부 |
| :--- | :--- | :--- |
| `client/.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 예. Supabase publishable/anon key만 |
| `server/.env` 또는 배포 비밀 저장소 | `SUPABASE_DB_*`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | 아니오. 서버 전용 |
| Supabase URL Configuration | Site URL, `http://localhost:5173/auth/callback`, 운영 callback URL | 대시보드 설정 |
| Google Cloud / Kakao Developers | Supabase `/auth/v1/callback` URL | 공급자 대시보드 설정 |

`VITE_*` 접두사의 환경변수는 브라우저 번들에 포함되므로 DB 비밀번호, service role key, OAuth client secret, JWT secret을 넣지 않는다.

## 개발 순서

1. `V2__supabase_auth_identity.sql`로 `users.supabase_user_id` 및 고유 인덱스를 추가한다.
2. `@supabase/supabase-js`와 프론트엔드 AuthProvider·인증 화면·callback route를 추가한다.
3. Spring Boot Resource Server와 `AuthUserService`, `/api/auth/me`, Supabase용 `CurrentUserResolver`를 추가한다.
4. local 프로파일 E2E 및 인증 서비스 단위 테스트를 통과시킨다.
5. 사용자가 Supabase 프로젝트 URL·publishable/anon key를 제공한 뒤 Google/Kakao Provider와 redirect URL을 설정하고 실제 OAuth를 점검한다.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase Docs — Login with Google"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-kakao "Supabase Docs — Login with Kakao"
[3]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Docs — Redirect URLs"
[4]: https://supabase.com/docs/guides/auth/jwts "Supabase Docs — JSON Web Tokens"
[5]: https://supabase.com/docs/guides/auth/signing-keys "Supabase Docs — JWT Signing Keys"
