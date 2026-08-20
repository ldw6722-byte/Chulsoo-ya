# Supabase 관리자 계정·권한 공식 확인 기록

## 역할과 권한

Supabase 공식 RBAC 문서는 애플리케이션 역할을 별도 테이블에 저장하고, Custom Access Token Auth Hook으로 JWT claim에 역할을 넣어 RLS 정책과 애플리케이션 권한 검사에 사용하는 방식을 제시한다. 철수야는 이미 Spring Boot가 DB의 `users.role`을 권한 판단의 원천으로 사용하므로, 기존 `ADMIN`은 유지하고 `admin_level`로 최고 관리자·일반 관리자를 세분화하는 설계를 적용한다.

- 출처: https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac

## 계정 초대

Supabase Auth Admin API의 `inviteUserByEmail`은 이메일 초대 링크를 전송한다. Admin API와 서비스 역할 키는 서버에서만 사용해야 하며 브라우저에 노출하면 안 된다. 철수야는 Spring Boot의 `SUPABASE_SERVICE_ROLE_KEY` 환경변수만 사용해 `/auth/v1/invite` 호출을 수행한다.

- 출처: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail

## Google·Kakao의 역할

Google·Kakao는 Supabase Auth의 OAuth 로그인 공급자다. 두 공급자는 신원 인증과 이메일 제공을 담당하지만 철수야의 최고 관리자·일반 관리자 권한을 부여하지 않는다. 사전 초대된 이메일은 철수야 DB에 일반 관리자로 등록되고, 같은 이메일로 Google·Kakao 첫 로그인을 하면 기존 사용자 레코드에 Supabase 사용자 ID가 연결되는 기존 AuthUserService 흐름을 사용한다.

- Kakao: https://supabase.com/docs/guides/auth/social-login/auth-kakao
- Google: https://supabase.com/docs/guides/auth/social-login/auth-google
