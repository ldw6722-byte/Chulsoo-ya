# 철수야 Supabase 전환 안내

## 목적

현재 철수야 서버는 `local` 프로파일에서 H2와 개발 시드 데이터를 이용해 즉시 실행됩니다. Supabase를 연결할 때는 PostgreSQL 스키마를 먼저 적용한 뒤 `supabase` 프로파일을 활성화합니다. 애플리케이션은 운영 환경에서 `ddl-auto: validate`를 사용하므로, 실행 중 테이블을 임의로 변경하지 않습니다.

| 구분 | 로컬 개발 | Supabase 운영 |
| :--- | :--- | :--- |
| 활성 프로파일 | `local` | `supabase` |
| DB | H2 인메모리 | Supabase PostgreSQL |
| 스키마 생성 | Hibernate `create-drop` | `V1__baseline.sql` 수동 1회 적용 |
| 시드 데이터 | 자동 생성 | 비활성화 |
| JPA 동작 | 개발용 자동 생성 | 엔티티-스키마 일치 검증 |

## 사전 준비

Supabase 대시보드에서 대상 프로젝트를 준비하고, Database 화면의 **Session pooler** 연결 정보와 API 화면의 프로젝트 URL 및 publishable/anon key를 확보합니다. 서버 전용 작업을 지원하려면 service role key가 필요하지만, 이 값은 클라이언트에 절대 노출하면 안 됩니다. 사용자 access token은 Supabase JWKS 공개키로 검증하므로 JWT secret을 애플리케이션 환경변수에 넣지 않습니다.

`server/.env.example`을 복사해 `server/.env`를 만든 뒤 실제 값을 넣습니다. `server/.env`는 프로젝트 최상위 `.gitignore`에 포함되어 있어 버전 관리 대상이 아닙니다.

```powershell
Copy-Item server/.env.example server/.env
```

## 스키마 적용

새 데이터베이스는 Supabase 대시보드의 **SQL Editor**에서 `server/src/main/resources/db/supabase/V1__baseline.sql` 전체를 한 번 실행합니다. 이미 V1만 적용된 데이터베이스에는 이어서 `server/src/main/resources/db/supabase/V2__supabase_auth_identity.sql`을 실행합니다. 이 스크립트는 다음 핵심 제약을 포함합니다.

| 보호 대상 | DB 제약·인덱스 |
| :--- | :--- |
| 활성 장바구니 1개 | `ux_carts_one_active_per_consumer` 부분 유니크 인덱스 |
| 동일 상품/옵션 중복 | `ux_cart_items_unique_product_option` 유니크 인덱스 |
| 주문당 낙찰 판매자 1명 | `ux_bids_one_winner_per_order` 부분 유니크 인덱스 |
| 결제 재시도 중복 | `payments.idempotency_key` 유니크 제약 |
| 슬롯 회계 음수 | `stores` CHECK 제약 및 서버 트랜잭션 |
| 마감 조회 성능 | 매칭·확인 마감 시각 부분 인덱스 |

> 초기 스키마를 적용하기 전에 기존 테이블이 있는 경우에는 실행하지 말고, 현재 DB 상태를 먼저 확인해야 합니다. 기존 운영 DB를 대상으로 한 파괴적 변경은 별도 마이그레이션으로 처리합니다.

## 운영 실행

Windows PowerShell에서 `server/.env`의 값을 세션 환경변수로 반영한 다음 서버를 시작합니다. 환경변수를 파일에서 자동으로 주입하는 도구는 아직 추가하지 않았으므로, 민감한 운영 환경에서는 CI/CD 또는 안전한 비밀 관리 도구로 주입해야 합니다.

```powershell
$env:SPRING_PROFILES_ACTIVE = 'supabase'
$env:SUPABASE_DB_URL = 'jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres'
$env:SUPABASE_DB_USER = 'postgres.YOUR_PROJECT_REF'
$env:SUPABASE_DB_PASSWORD = 'DATABASE_PASSWORD'
$env:SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
$env:SUPABASE_ANON_KEY = 'ANON_KEY'
$env:SUPABASE_SERVICE_ROLE_KEY = 'SERVICE_ROLE_KEY'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
Set-Location server
.\gradlew.bat bootRun
```

서버가 기동되면 `GET /api/categories`를 호출해 DB 연결을 확인합니다. 인증 기능은 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`만 클라이언트 환경변수로 공개하고, service role key·DB 비밀번호는 Spring Boot 또는 배포 비밀 저장소에만 둡니다. Spring Boot는 `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`을 사용해 access token의 서명과 issuer를 검증합니다.

## 현재 제한 사항

이 단계의 주소 정규화는 개발용 로컬 파서입니다. 실제 운영 배포 전에는 카카오 로컬 API로 교체해야 하며, 결제는 토스페이먼츠 승인 API 및 서명 검증 웹훅 어댑터를 붙여야 합니다. 현재 결제 구현은 상태 순서와 멱등성만 검증하는 개발 스텁입니다.
