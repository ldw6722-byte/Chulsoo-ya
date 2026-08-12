# Supabase 연결 검증 기록

| 항목 | 결과 | 확인 방법 |
| :--- | :--- | :--- |
| 프로젝트 endpoint | 접근 가능 | `https://<project-ref>.supabase.co/`는 루트 경로 미지원 응답을 반환하며, 이는 API endpoint의 정상 동작과 별개이다. |
| JWKS endpoint | 접근 가능 | `/auth/v1/.well-known/jwks.json`이 공개키 목록을 반환했다. |
| JWT 알고리즘 | ES256 | 공개키의 `alg`가 `ES256`, `kty`가 EC로 확인되어 Spring Boot `NimbusJwtDecoder` JWKS 검증 구성과 호환된다. |
| 클라이언트 설정 | 반영 완료 | `client/.env.local`에 URL과 publishable key만 저장했다. |
| 서버 설정 | 반영 완료 | `server/.env`에 Session pooler JDBC·DB 사용자·비밀번호·URL·키·CORS를 안전하게 저장했다. |
| PostgreSQL 마이그레이션 | 성공 | Flyway가 public schema에 V1 baseline과 V2 Supabase 인증 식별자 마이그레이션을 적용했다. |
| 운영 서버 | 기동 성공 | `supabase` 프로파일로 Spring Boot가 PostgreSQL에 연결되어 포트 8080에서 실행 중이다. |
| 공개 API | 성공 | `GET /api/categories`가 PostgreSQL에서 HTTP 200과 빈 카탈로그를 반환했다. |
| JWT 보안 경계 | 성공 | 토큰 없는 `GET /api/auth/me` 요청이 HTTP 401을 반환했다. |
| Email provider | 활성 | Signup 허용 상태이며, 기본 SMTP 전달 제한으로 확인 메일 미도착을 별도 진단 중이다. |
| 개발 테스트 계정 | 인증 완료 처리 | 사용자 승인에 따라 `ldw6722@gmail.com` 계정만 `auth.users.email_confirmed_at`을 개발 검증용으로 갱신했다. |
| 외부 OAuth provider | 미설정 | 현재 Auth 설정에서 Google·Kakao 활성화 정보는 확인되지 않았다. |

## 다음 검증 항목

Email 회원가입은 실제 수신 가능한 테스트 이메일로 가입 요청을 보낸 뒤, 인증 링크를 열어 `/auth/callback` → `/api/auth/me` 사용자 동기화를 확인해야 한다. Google/Kakao OAuth는 각 공급자의 Client ID와 Client Secret을 Supabase Dashboard에 등록한 뒤 검증한다.
