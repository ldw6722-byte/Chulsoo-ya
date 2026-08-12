# 철수야 Supabase Auth · Google · Kakao 연결 체크리스트

## 제공받을 환경값

아래 값은 실제 연결 검증에만 사용하며, 비밀값은 `server/.env` 또는 배포 비밀 저장소에만 둔다. **채팅에 붙여넣기보다** 사용자가 `server/.env`와 `client/.env.local`에 직접 저장한 뒤 알려주는 방식이 안전하다.

| 파일 | 변수 | 필수 여부 | 공개 범위 |
| :--- | :--- | :---: | :--- |
| `server/.env` | `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` | 필수 | 서버 전용 |
| `server/.env` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 필수 | 서버 전용 |
| `server/.env` | `CORS_ALLOWED_ORIGINS` | 필수 | 서버 전용 설정 |
| `client/.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 필수 | 브라우저 공개 가능 |
| Supabase 대시보드 | Google Client ID / Secret | Google 사용 시 | Supabase Provider에만 입력 |
| Supabase 대시보드 | Kakao REST API key / Client Secret | Kakao 사용 시 | Supabase Provider에만 입력 |

> `VITE_*` 변수는 브라우저 번들에 포함된다. `SUPABASE_SERVICE_ROLE_KEY`, DB 비밀번호, OAuth client secret, JWT secret을 절대 넣지 않는다.

## 1. 데이터베이스와 서버

1. Supabase SQL Editor에서 신규 DB라면 `server/src/main/resources/db/supabase/V1__baseline.sql`을 실행한다.
2. 기존에 V1을 적용한 DB라면 `V2__supabase_auth_identity.sql`을 추가 실행한다.
3. Supabase Dashboard의 **JWT Signing Keys**에서 비대칭 key(RSA, EC 또는 EdDSA) 사용 상태를 확인한다.
4. `server/.env.example`을 복사해 `server/.env`를 만든 뒤 DB·Supabase·CORS 값을 입력한다.
5. `SPRING_PROFILES_ACTIVE=supabase`로 Spring Boot를 실행하고 공개 카탈로그 API와 authenticated `/api/auth/me`를 점검한다.

Spring Boot는 Supabase Auth의 JWKS endpoint로 access token을 검증하며, issuer는 `<SUPABASE_URL>/auth/v1`로 제한한다. Supabase는 비대칭 signing key가 JWKS를 통해 공개 검증 및 키 회전을 지원한다고 안내한다. [1] [2]

## 2. Supabase URL Configuration

Supabase Dashboard → **Authentication → URL Configuration**에서 다음 값을 등록한다.

| 항목 | 개발 값 | 운영 값 |
| :--- | :--- | :--- |
| Site URL | `http://localhost:5173` | 실제 HTTPS 웹 주소 |
| Redirect URLs | `http://localhost:5173/auth/callback` | `https://<domain>/auth/callback` |

`redirectTo` URL은 Supabase의 Redirect URLs allow list와 일치해야 하며, Site URL은 이메일 확인·비밀번호 재설정의 기본 URL 역할을 한다. [3]

## 3. Email / Password

Supabase Dashboard → **Authentication → Providers → Email**에서 Email provider를 활성화한다. 개발 중에는 이메일 확인을 사용하되, 확인 메일의 redirect URL이 `/auth/callback`으로 향하는지 점검한다. 철수야의 회원가입 화면은 이름·이메일·8자 이상 비밀번호·약관 동의를 요구하고, 가입 직후 이메일 확인 안내를 표시한다.

## 4. Google

Google Cloud Console에서 Web OAuth Client를 생성하고, Authorized JavaScript origins에는 철수야 웹 origin을, Authorized redirect URI에는 **Supabase가 Google Provider 화면에 표시하는 callback URL**을 등록한다. 이어서 Google Client ID와 Client Secret을 Supabase Dashboard → Authentication → Providers → Google에 입력하고 provider를 켠다. 요청 scope는 `openid`, email, profile을 유지한다. [4]

## 5. Kakao

Kakao Developers에서 앱을 만들고 Kakao Login을 활성화한다. Platform Key의 REST API key를 client ID로, Kakao Login Client Secret을 client secret으로 사용한다. Kakao Login Redirect URI에는 Supabase Dashboard가 보여 주는 `/auth/v1/callback` URL을 등록한다. Consent Items에서 email, nickname, profile image를 요구한다. 철수야는 배송·주문 연락을 위해 **email 동의를 필수**로 운영한다. [5]

## 6. 실제 검증 순서

| 순서 | 검증 | 기대 결과 |
| :---: | :--- | :--- |
| 1 | `npm run build`, `gradlew test` | 빌드 및 테스트 통과 |
| 2 | Email 가입 | 확인 메일 발송·callback 복귀 |
| 3 | Email 로그인 | `/api/auth/me`가 `users.supabase_user_id`와 `CONSUMER` 역할을 반환 |
| 4 | Google 로그인 | Google 동의 후 callback·동일 사용자 동기화 |
| 5 | Kakao 로그인 | Kakao 동의 후 callback·동일 사용자 동기화 |
| 6 | 재로그인 | 동일 Supabase `sub`가 기존 내부 사용자에 연결되고 역할이 유지 |
| 7 | 판매자/관리자 API | OAuth metadata를 바꿔도 `role`이 승격되지 않음 |

## References

[1]: https://supabase.com/docs/guides/auth/jwts "Supabase Docs — JSON Web Tokens"
[2]: https://supabase.com/docs/guides/auth/signing-keys "Supabase Docs — JWT Signing Keys"
[3]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Docs — Redirect URLs"
[4]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase Docs — Login with Google"
[5]: https://supabase.com/docs/guides/auth/social-login/auth-kakao "Supabase Docs — Login with Kakao"
