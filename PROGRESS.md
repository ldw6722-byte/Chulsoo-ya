# 진행 기록

갱신: 2026-08-22 · 기준 문서: `README.ko.md` · 현재 구현·미구현 기준: `docs/CURRENT_IMPLEMENTATION_AND_BACKLOG.md` · 규약: `AGENTS.md`

## 현재 상태

| 항목 | 상태 |
| :--- | :--- |
| 활성 단계 | 철물 O2O 웹 MVP의 핵심 도메인·관리자 운영·역할 권한까지 구현됐으며, 실제 PG·지급·운영 관측성·E2E·출시 보완 단계다. |
| 백엔드 | Supabase PostgreSQL 프로파일, Flyway V1~V42, Spring Security·Supabase JWT, 역할·세부 권한, 관리자 접근 감사·경보 API와 기존 행사 배너 테마 Storage·DB 이관이 적용됐다. 최신 검증은 `gradlew.bat test bootJar` 통과 기준이다. |
| 프론트엔드 | React 19·TSX·Axios REST 화면, 이메일 비밀번호 재설정·OAuth 콜백 역할 동기화, 권한 기반 관리자 알림 종·보안 감사 탭, 전역 다크모드 보정까지 반영됐다. 최신 검증은 lint·TS 빌드·Vite build 통과 기준이다. |
| 역할·권한 | 최고관리자는 전체 접근과 일반관리자 부여·해지·세부 기능 토글을 관리한다. 일반관리자는 DB에서 ON으로 부여된 메뉴·API만 접근한다. |
| 판매점 운영 | 판매자·관리자는 회원 기본 주소와 분리된 찾아오시는 길, 영업 시간, 정기·임시 휴무를 관리하며 고객에는 서버 계산 영업 상태만 노출한다. |
| 인증 | 이메일·Google·Kakao 흐름과 이메일 비밀번호 재설정을 구현했다. 세션·DB 역할 동기화와 직접 관리자 로그인·OAuth 콜백 경합을 보정했으며, Supabase 기본 이메일 발송 한도와 실제 역할별 브라우저 E2E는 계속 회귀 확인한다. |
| 이미지·Storage | 판매점·카탈로그·행사 자산은 Supabase Storage URL을 사용한다. 기존 GPT 행사 배너 테마 20개도 `event_assets` DB 자산으로 등록돼 관리자 행사 편집에서 선택·삭제 관리한다. 판매자 증빙은 비공개 서명 URL로 분리한다. |

## 쇼핑·카탈로그 이식 완료 목록

| 범위 | 구현 내용 | 데이터 연결 |
| :--- | :--- | :--- |
| 카테고리 체계 | 수공구·전동공구·철물·배관·전기·건축·접착·안전·생활철물의 대·중·소 계층 | `categories.parent_id`, `level`, `active`, `image_url` |
| 메가 메뉴 | Kordeal식 3열 hover 메뉴, 대→중→소 탐색 | `GET /api/categories/tree` |
| 홈 카테고리 | 9개 대분류 아이콘·추천·인기·신규 상품 판매 섹션 | `GET /api/categories`, `GET /api/products/featured`, `GET /api/products/popular` |
| 카탈로그 | 브레드크럼, 하위 분류 칩, 정렬, 5열 상품 판매 그리드 | `GET /api/categories/{code}`, `GET /api/products` |
| 상품 카드 | 빠른 매칭·할인 배지, 브랜드, 정가·할인가, 평점·리뷰, 장바구니 버튼 | 확장 `ProductResponse`, `cartApi.addItem` |
| 상품 상세 | Kordeal식 **`/product/:id`** URL, 이미지 갤러리/플레이스홀더, 수량·합계, 상세·규격·주문 안내 탭 | `GET /api/products/{id}`, `cartApi.addItem` |
| 장바구니 | 상품 상세 링크, 수량 변경·삭제, 주문 요약·주문 요청 연결 | `/api/cart/**` |
| 공개 탐색 | 로그인 없이 카테고리·상품 목록·상품 상세를 조회 | Supabase 보안 체인의 GET 카탈로그 permit 규칙 |
| 대량 시드 | 소분류별 실제 철물 취급 품목 조사 후 50개씩 JSON 정규화·안전 적용 | `hardware-products-1600.json`, `BulkCatalogSeedRunner` |

## 핵심 기술 결정

| 일자 | 결정 | 사유 |
| :--- | :--- | :--- |
| 2026-08-12 | HTTP는 Axios 단일 채널, 통신은 REST, 화면은 TSX로 고정 | 사용자 지시와 AGENTS 규약 |
| 2026-08-12 | Kordeal의 소스 구조·컴포넌트·Tailwind 테마를 철수야 도메인으로 이식 | 사용자 제공 참조 프로젝트의 UI/UX 재사용 요구 |
| 2026-08-12 | 계층형 카테고리는 자기 참조 `parent_id` + `level(1~3)`로 모델링 | 메가 메뉴·하위 카테고리 검색·운영 확장 지원 |
| 2026-08-12 | 상품 판매 정보는 기존 `products`에 비파괴 필드 확장 | 기존 장바구니·매칭 주문의 `product_id` 계약 보존 |
| 2026-08-12 | 카탈로그 교체는 주문이 없을 때만 허용 | 주문·결제 이력의 `product_id` 정합성 보존 |
| 2026-08-12 | 이미지 미등록 상품은 디자인 플레이스홀더로 렌더링 | 사용자 요청에 따른 이미지 작업 보류 |
| 2026-08-12 | Supabase Session pooler Hikari 풀을 최대 3으로 제한 | Pooler 연결 한도 초과 방지 |

## 검증 기록

| 검증 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 0 오류 |
| `cd client && npm run build` | 통과 |
| `cd server && ./gradlew test` | 통과, 24건 |
| 카테고리 트리 단위 테스트 | 대→중→소 정렬·중첩 조립 통과 |
| Supabase 공개 탐색 | 카테고리·상품 목록·상품 상세 모두 HTTP 200 |
| Supabase 대량 시드 | 총 1,600개, 소분류 32개 모두 정확히 50개 확인 |
| 로컬 REST E2E | 소분류 상품 50개 조회 → 상품 상세 → 장바구니 2개 추가 통과 |

## 현재 우선순위

현재 구현·보완·미구현 항목과 다음 개발 순서는 `docs/CURRENT_IMPLEMENTATION_AND_BACKLOG.md`를 단일 기준으로 사용한다. 즉시 우선순위는 판매자 구독 해지, 최고관리자 부여·해지 권한 E2E, 이메일·Google·Kakao 직접 로그인·콜백 E2E, NTS·알림 채널, 실제 PG·지급대행 설계·연동, 운영 보안·관측성·백업이다.

## 세션 핸드오프

다음 세션은 `AGENTS.md` → 이 문서 상단 → `PROJECT_MAP.md` → `docs/CURRENT_IMPLEMENTATION_AND_BACKLOG.md` 순서로 읽는다. 도메인별 스키마·REST 계약 변경은 각 계약 문서(`CATEGORY_CATALOG_SCHEMA.md`, `SELLER_ONBOARDING_CONTRACT.md`, `PAYMENT_REFUND_CONTRACT.md`, `CLAIM_CONTRACT.md`, `COUPON_CONTRACT.md`, `STORE_OPERATIONS_PERMISSION_CONTRACT.md`)를 함께 갱신한다.

## Recent UI adjustment (2026-08-12)
- Home quick scroll now contains exactly three links: product newest, popular hardware, affordable tools.
- Removed the fast-response and seller-operation quick links.
- Home section titles now exactly match quick-link labels; English badges removed.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Header refinement (2026-08-12)
- Home quick navigation and section titles are now: New Products, Popular Tools, Recommended Products.
- Removed all three section descriptions.
- Applied distinct blue, green, and red quick-link colors plus a compact Chulsoo-ya wordmark.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Signature wordmark refinement (2026-08-12)
- Replaced the decorative logo with a compact horizontal wordmark: the Cheolsu pair is emphasized as one high-contrast unit and Ya remains a clean companion character.
- Removed the sparkle, multi-color gradient, and single-character emphasis from the prior version.
- Design basis: simple, scalable wordmark with one controlled accent for header readability.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Product showcase refinement (2026-08-12)
- Quick navigation has persistent blue, green, and red underlines for New Products, Popular Tools, and Recommended Products.
- Replaced the boxed wordmark with a minimalist Chulsoo-ya wordmark and a controlled underline accent under Cheolsu.
- Rebuilt the three product showcase headers, grid spacing, cards, image placeholder, price hierarchy, and cart CTA for cleaner commerce presentation.
- Fixed one HomePage link encoding regression using a UTF-8 Node script.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Cyberpunk signature and bathroom event copy (2026-08-12)
- Replaced the previous plain wordmark with a Gaegu Korean handwritten-style signature using cyan, violet, and fuchsia neon treatment.
- Removed the HARDWARE CATEGORY label above the category grid.
- Updated bathroom event title and copy as requested.
- Frontend verification: npm run lint, npx tsc -b, and npm run build passed.


## Home reload and adult signature refinement (2026-08-12)
- Removed query-driven quick navigation so a refreshed home page always begins at the top.
- Quick links now navigate with transient route state and preserve smooth scrolling without a reload target in the URL.
- Replaced the prior light handwritten font with a joined adult brush-signature wordmark and cyan-violet-fuchsia treatment.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Supplied brand logo integration (2026-08-12)
- Added the user-supplied Cheolsuya logo to client/public/brand/chulsooya-logo.webp.
- Replaced the generated text signature in ShopHeader with the supplied logo while preserving the home navigation and accessible label.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Header icon tooltips (2026-08-12)
- Removed persistent text labels from dark mode, account, and cart controls in the header.
- Added labels that appear only on hover or keyboard focus, while retaining aria labels and the cart count badge.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Bathroom banner copy-only update (2026-08-12)
- Changed only the bathroom event title to 욕실 꾸미기 행사전 and the description to 욕실 분위기 전환.
- Preserved the existing banner layout, badge, CTA, icon, gradient, and carousel behavior.
- Frontend verification: npm run lint (0 warnings, 0 errors), npx tsc -b, and npm run build passed.


## Admin shortcut flow (2026-08-13)
- In the local Vite development environment, the header Admin link selects seeded admin user ID 2 only when no authenticated or development identity exists, then opens /admin.
- Existing authenticated users remain subject to the normal ADMIN role guard.
- Frontend lint/typecheck/build passed.


## Store directory and admin CRUD (2026-08-13)
- Added city/district store finder on home and /stores. City returns all city stores; district narrows to the selected district.
- Added /api/stores public directory search, /api/admin/stores ADMIN CRUD, directory profile fields, and Supabase V4 migration.
- Local seed creates 100 mock stores across 10 Seoul districts (10 per district). Verified city=100, district=10, admin=100 responses and CRUD cycle.



## 판매자 온보딩·관리자 심사 구현 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기능 갭 감사 | 공유 기획 문서 11종과 저장소 명세·코드를 역할/API/DB 단위로 대조하고 `docs/FEATURE_GAP_AUDIT.md`에 기록 | 완료 |
| 신청 DB | Supabase 비파괴 `V7__seller_applications.sql`에 신청자·사업자 정보·NTS 상태·증빙 메타데이터·심사 이력을 추가 | 코드 완료, Supabase 기동 시 Flyway 적용 |
| 신청 API | `POST /api/seller-applications`, `GET /me`, 증빙 업로드와 관리자 목록·승인·반려 REST API 구현 | 완료 |
| 증빙 보안 | JPEG/PNG/PDF, 100KB~5MB, 파일 시그니처 검증; UUID 객체 키와 Supabase 비공개 Storage 업로드 어댑터 | 완료 |
| 역할 전환 | 관리자 승인 트랜잭션에서 증빙 확인 → `SELLER` 역할 전환 → 미검증 매장 1개 생성 | 완료 |
| 소비자 화면 | 마이철수의 `판매자 등록 신청` → 신청 정보 입력·증빙 제출·심사 상태 확인 화면 | 완료 |
| 관리자 화면 | 관리자 대시보드의 `판매자 신청 심사`에서 제출 상태 확인·승인·반려 | 완료 |
| TDD | 신청 승인/반려 상태 전이, 승인 시 역할·매장 생성, 증빙 파일 형식·용량·시그니처 테스트 | 통과 |

### 이번 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`gradle_exit=0`) |

### 다음 구현 순서

1. 매칭·응찰·가용 슬롯·자동 제한에 대한 실제 역할별 E2E와 패널티 이력 도메인을 보강한다.
2. 결제 스텁을 취소·전액/부분 환불·감사 이력을 갖춘 내부 결제 도메인으로 확장한다.
3. 클레임·정산 HOLD·증빙·문서·쿠폰·플랫폼 알림·관리자 재무 화면을 순서대로 구현한다.

### 외부 설정 대기

- Supabase Storage에 비공개 `seller-verification-documents` 버킷과 서버 서비스 키 권한을 설정해야 실제 증빙 업로드가 가능하다.
- NTS 실시간 진위확인은 공공데이터포털 API 키가 준비된 뒤 서버 어댑터에서 활성화한다. 현재는 사업자 정보와 증빙을 관리자 수동 심사로 처리한다.
- V7은 사용자가 Supabase 프로필로 `ServerApplication.java`를 기동할 때 Flyway가 적용한다. 서버를 임의로 백그라운드 기동하지 않는다.


## 매칭·응찰·가용 슬롯·패널티 고도화 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 시차 발송 강제 | 제안 도달 시각 이전의 응찰을 서버에서 `OFFER_NOT_AVAILABLE_YET`으로 차단 | 완료 |
| 슬롯 배분 | 한 번의 확산마다 신규 제안을 한 건만 생성하고, 등급별 0/3/6초 시차와 상위 등급 포화 시 즉시 오버플로를 적용 | 완료 |
| 라운드 로빈 | 지역·등급별 영속 커서(`dispatch_cursors`)로 동일 등급 판매자의 시작점을 순환 | 완료 |
| 낙찰 동시성 | 주문 행 잠금·낙찰자 유니크 제약·슬롯 예약→진행 전환·비낙찰 예약 해제를 기존 흐름과 함께 회귀 검증 | 완료 |
| 패널티 감사 | 물품 확인 2분 만료 시 주문별 단일 패널티 이력·24시간 응찰 제한·신뢰점수 -10을 트랜잭션으로 기록 | 완료 |
| 판매자 화면 | 운영 설정에서 현재 제한 사유·해제 예정·패널티 이력을 조회 | 완료 |
| 관리자 화면 | 판매자 운영 모니터에서 선택 판매점의 패널티·제한 이력을 확인 | 완료 |
| DB | Supabase V8(`penalties`), V9(`dispatch_cursors`) 비파괴 Flyway 마이그레이션 추가 | 코드 완료, Supabase 기동 시 적용 |

### 이번 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`all_validation_exit=0`) |

### 다음 구현 순서

1. 결제 스텁을 멱등 결제 시도·취소·전액/부분 환불·감사 이력으로 확장한다.
2. 클레임 접수·증빙·정산 HOLD·교환/부분 교체·결정적 문서를 역할별로 구현한다.
3. 쿠폰·플랫폼 알림·관리자 재무·운영 거버넌스를 구현한다.

### 외부 적용 조건

- V8·V9는 사용자가 Supabase 프로필로 `ServerApplication.java`를 한 번 실행하면 Flyway가 순차 적용한다.
- Redis 분산 락과 앱 푸시 묶음 발송은 외부 인프라가 준비된 뒤 현재 PostgreSQL 행 잠금·영속 커서를 대체/보완하는 고도화 항목으로 남긴다.


## 결제 취소·전액/부분 환불·감사 이력 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 결제 멱등성 | 같은 주문의 재시도는 기존 결과를 반환하고, 다른 주문의 결제 키 재사용은 서버가 차단 | 완료 |
| 소비자 취소 | 결제 전 주문 취소와 `PAID` 직후 전액 결제 취소를 분기 처리 | 완료 |
| 관리자 환불 | `PAID`·`PREPARING` 주문의 전액/부분 환불, 환불 가능 잔액 검증, 전액 환불 시 주문 종료 | 완료 |
| 동시성 | 소비자 취소·관리자 환불의 잠금 순서를 주문→결제로 통일하고, 결제 비관적 잠금으로 잔액을 보호 | 완료 |
| 감사 이력 | 요청자·처리자·사유·환불 유형·멱등성 키·PG 개발 스텁 결과·처리 시각을 `refunds`에 기록 | 완료 |
| 소비자 화면 | 주문 상세에서 결제 상태·환불 가능 잔액·취소/환불 이력을 표시하고 안전한 취소 요청 제공 | 완료 |
| 관리자 화면 | 재무 메뉴에서 주문 번호로 결제 조회, 전액·부분 환불, 감사 이력 확인 제공 | 완료 |
| DB | Supabase V10(`refunds`) 비파괴 Flyway 마이그레이션 추가 | 코드 완료, Supabase 기동 시 적용 |

### 결제 환불 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 (`all_payment_validation_exit=0`) |

### 다음 구현 순서

1. 클레임 접수·증빙·정산 HOLD·교환/부분 교체·결정적 문서를 역할별로 구현한다.
2. 쿠폰·플랫폼 알림·관리자 재무·운영 거버넌스를 구현한다.
3. OAuth·외부 알림·웹훅·접근성·보안 오류 상태를 보강한다.

### 외부 적용 조건

- V10은 사용자가 Supabase 프로필로 `ServerApplication.java`를 한 번 실행하면 Flyway가 순차 적용한다.
- 현재 PG 취소·환불은 개발용 결정적 스텁 키를 감사 이력에 남긴다. 실제 자금 이동은 이후 서버 전용 PG 어댑터와 서명 검증 웹훅 연동에서 대체한다.


## 클레임·증빙·정산 HOLD·결정적 문서 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 소비자 | 주문 상세에서 반품·교환·부분 교체 접수, 사유·상세 내용·사진/영상 증빙 제출 | 완료 |
| 증빙 보안 | JPG·PNG·WEBP·MP4 MIME·시그니처·용량 이중 검증, UUID 객체 키 기반 비공개 Storage 저장 | 완료 |
| 정산 HOLD | 클레임 생성 트랜잭션에서 주문별 정산 레코드 생성 또는 잠금 후 `HOLD`, 불변 이벤트 기록 | 완료 |
| 판매자 | 낙찰 판매자만 신규 클레임 목록·상세·증빙 메타데이터를 보고 접수·회수·재발송·중재 요청 처리 | 완료 |
| 관리자 | 상태별 운영 큐, 증빙·처리 타임라인 검토, 정산 해제·기각·전액 환불 중재 | 완료 |
| 환불 연동 | 관리자 전액 환불 결정이 기존 결제 환불 감사 이력과 결제 잔액 갱신을 재사용 | 완료 |
| 역할 알림 | 소비자·낙찰 판매자·관리자에게 클레임 접수, 판매자·관리자 처리 결과를 저장형 알림으로 기록 | 완료 |
| 처리 문서 | AI 사용 없이 확정 DB 값만 주입한 클레임 처리 확인서 생성·관리자 조회 | 완료 |
| DB | Supabase V11(`claims`, `claim_evidences`, `claim_events`, `settlements`) 비파괴 Flyway 마이그레이션 | 코드 완료, Supabase 기동 시 적용 |

### 클레임 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 |

### 외부 적용 조건

- Supabase Storage에 비공개 버킷 `claim-evidences`를 생성해야 실제 증빙 업로드가 가능하다.
- 현재 알림은 DB 저장형 알림으로 먼저 보존한다. FCM·알림톡·SMS·이메일은 외부 발송 어댑터 설정 단계에서 이 이벤트를 구독한다.
- V11은 Supabase 프로필로 서버를 한 번 기동하면 Flyway가 순차 적용한다.

### 다음 구현 순서

1. 쿠폰 발행·사용·취소 복구와 관리자 쿠폰 운영을 구현한다.
2. 플랫폼 알림 고도화·관리자 재무·거버넌스 운영 도구를 구현한다.
3. OAuth·실시간 외부 알림·접근성·보안 오류 상태를 보강한다.


## 무상 쿠폰·플랫폼 알림·운영 도구 (2026-08-13)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 쿠폰 정책 | 코드·제목·정액 할인·최소 주문·시작/만료·활성 상태를 관리자가 생성 | 완료 |
| 회원 발행 | 관리자가 회원 번호 기준으로 무상 쿠폰 발행, 발행 이벤트·플랫폼 알림 기록 | 완료 |
| 소비자 선택 | 체크아웃에서 사용 가능 쿠폰·최소 주문 조건·유효기간 확인 후 발행본 선택 | 완료 |
| 서버 할인 | 클라이언트 할인값을 신뢰하지 않고 사용자 쿠폰을 잠금 조회해 서버에서 할인·주문 연결 확정 | 완료 |
| 취소 복구 | 소비자 주문 취소에서만 유효한 적용 쿠폰을 한 번 복구. 환불·클레임 전액 환불은 복구하지 않음 | 완료 |
| 감사 이력 | 발행·적용·복구·만료 상태를 `coupon_events`에 append-only 기록 | 완료 |
| 관리자 화면 | 관리자 대시보드의 쿠폰 운영 메뉴에서 정책 등록·회원 발행 제공 | 완료 |
| DB | Supabase V12(`coupons`, `coupon_issues`, `coupon_events`, `orders.coupon_issue_id`) 비파괴 Flyway 마이그레이션 | 코드 완료, Supabase 기동 시 적용 |

### 쿠폰 검증

| 명령 | 결과 |
| :--- | :--- |
| `cd client && npm run lint` | 통과, 기존 경고 3건·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |
| `cd server && .\gradlew.bat test` | 통과 |

### 외부 적용 조건

- 만료 임박 알림은 현재 발행 시 안내와 상태 조회 시 만료 처리까지 구현되어 있다. 백그라운드 이메일·푸시·알림톡 발송은 운영 배포 환경과 발송 공급자 결정 후 별도 배치/이벤트 처리로 연결한다.
- V12는 Supabase 프로필로 서버를 한 번 기동하면 Flyway가 순차 적용한다.

### 다음 구현 순서

1. Supabase Email, Google OAuth, Kakao OAuth 운영 콘솔 설정과 리다이렉트·메일 전달 실연동을 확인한다.
2. 외부 발송(FCM·알림톡·SMS), PG 웹훅 서명 검증, 사업자 진위확인 어댑터를 운영 키로 연결한다.
3. 소비자·판매자·관리자 종단 간 시나리오와 권한·오류·접근성 회귀를 최종 검증한다.

## 기본 주소지·다중 배송지 관리 및 주문 요청 연동 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기본 주소지 | 첫 배송지는 자동 기본 지정, 이후 기본 주소지 전환·삭제 후 대체 기본 주소지 자동 지정 | 완료 |
| 배송지 CRUD | 배송지 이름·받는 분·연락처·서울특별시 구·도로명·상세 주소 등록·수정·삭제 | 완료 |
| 매칭 지역 | 주문 요청에서 저장 배송지를 선택하면 주소·상세 주소·구 매칭이 자동 반영 | 완료 |
| 주문 화면 | 기본 주소지와 동일 버튼, 저장 배송지 선택, 직접 주소 입력 유지 | 완료 |
| DB | Supabase Flyway V23 (delivery_addresses, 기본 배송지 부분 유니크 인덱스) 적용 | 완료 |
| API | /api/delivery-addresses GET·POST·PATCH·DELETE 및 기본 지정 PATCH | 완료 |

### 배송지 검증
| 검증 | 결과 |
| :--- | :--- |
| DeliveryAddressTest | 통과 |
| 실제 API | 테스트 구매자 01로 생성·수정·기본 지정·삭제·정리 검증 완료 |
| Supabase 마이그레이션 | V23 적용 완료 |
| 클라이언트 | lint, tsc, build 통과 |
| 서버 | gradlew test 통과 |

## 마이철수 주문 현황·배송지 탭 분리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 로그인 전용 | 인증 라우트 가드를 유지하고 마이철수 하단의 로그인 버튼 제거 | 완료 |
| 메뉴 동선 | 기존 배송지 관리 메뉴를 주문하기(`/checkout`)로 변경, 배송지 관리는 별도 `/my/delivery-addresses` 탭으로 분리 | 완료 |
| 본문 전환 | 마이철수 고정 배송지 관리 패널을 현재 장바구니 상품·수량·금액·주문하기 상태 패널로 교체 | 완료 |
| 배송지 탭 | 기본 주소지·현장 배송지 CRUD UI를 독립 페이지에서 제공 | 완료 |

### 마이철수 탭 분리 검증
| 명령 | 결과 |
| :--- | :--- |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run lint` | 경고·오류 0건 |
| `cd client && npm run build` | 통과 |

## 회원정보 저장·관리자 회원관리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 회원정보 탭 | 로그인 회원이 이름·휴대전화·이메일·권한·가입일을 확인하고 이름·휴대전화를 저장·수정 | 완료 |
| 인증 동기화 | 회원이 직접 저장한 이름은 다음 Supabase 인증 동기화에서 덮어쓰지 않고 이메일만 동기화 | 완료 |
| 관리자 회원관리 | 구매자·판매자의 이름·이메일·연락처·권한·가입일 조회, 검색·역할 필터, 판매자 역할 전환 | 완료 |
| 권한 | 회원은 본인 프로필만 조회·수정, 관리자 목록은 `/api/admin/users` 관리자 권한으로 제한 | 완료 |
| DB | 기존 `users` 테이블의 name·phone·role·created_at 재사용, 별도 마이그레이션 불필요 | 완료 |

### 회원정보 검증
| 검증 | 결과 |
| :--- | :--- |
| UserProfileTest·AuthUserServiceTest | 통과 |
| 실제 API | 테스트 구매자 프로필 저장 후 일반 관리자 회원 목록 반영 검증, 원래 이름으로 복원 완료 |
| 클라이언트 | lint, tsc, build 통과 |
| 서버 | gradlew test 통과 |

## 회원정보 기본 주소지·하단 추가 배송지 동선 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 회원정보 | 이름·연락처 아래에서 기본 주소지(받는 분·연락처·서울시 구·도로명·상세 주소)를 직접 저장·수정 | 완료 |
| 배송지 관리 | 기본 주소지는 회원정보에서만 수정하고, 배송지 관리 화면에는 별도 현장·수령지만 표시 | 완료 |
| 추가 UX | 배송지 관리 하단의 `+ 배송지 추가하기` 클릭 후에만 추가 폼을 열어 생성·수정·삭제 | 완료 |
| 주문 요청 | 기본 주소지·별도 배송지 모두 기존 체크아웃 저장 배송지 선택으로 유지 | 완료 |

### 주소지 동선 검증
| 검증 | 결과 |
| :--- | :--- |
| 실제 API | 테스트 구매자 02로 기본 주소지 1건·추가 배송지 1건 생성, 기본 1건 보장, 삭제 정리 완료 |
| 클라이언트 | lint, tsc, build 통과 |

## 회원정보 행 단위 수정 화면 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 화면 구조 | 첨부 참고 화면처럼 좌측 항목명·우측 내용의 행 단위 표 구조로 변경 | 완료 |
| 계정 정보 | 이메일, 이름, 휴대전화, 계정 보안 안내, 가입 정보 행 제공 | 완료 |
| 수정 동선 | 이름·휴대전화 행의 변경 버튼으로 입력을 열고 하단 회원정보 저장으로 DB 반영 | 완료 |
| 배송지 | 기본 배송지 편집을 같은 표의 배송지 행에 유지하고, 추가 배송지 관리 화면으로 연결 | 완료 |
| 인증 제약 | 이메일·비밀번호는 Supabase 인증 제공자가 관리하므로 현재 화면에서는 안내만 표시 | 완료 |

### 회원정보 표 화면 검증
| 검증 | 결과 |
| :--- | :--- |
| 클라이언트 | lint, tsc, build 통과 |

## 배송지 기본 선택·주문 요청 자동 적용 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 기본 주소지 표시 | 회원정보에서 작성한 `기본 주소지`를 배송지 관리 목록에도 표시 | 완료 |
| 배송지 선택 | 기본·추가 배송지의 `주문에 사용` 라디오 선택으로 기본 배송지 변경 | 완료 |
| 영속성 | 선택된 주소를 `default_address`로 저장하고 다른 주소의 기본 선택 자동 해제 | 완료 |
| 주문 요청 | `/checkout` 진입 시 기본 배송지를 주소·상세주소·매칭 지역에 자동 적용 | 완료 |
| 주문 중 변경 | 주문 요청의 저장한 배송지 버튼으로 등록 배송지를 즉시 변경하고 매칭 지역 재확인 | 완료 |

### 배송지 선택 검증
| 검증 | 결과 |
| :--- | :--- |
| 실제 API | 테스트 구매자 03의 기본 주소지와 추가 배송지를 생성하고, 추가 배송지 선택 후 default_address 전환 검증·정리 완료 |
| 클라이언트 | lint, tsc, build 통과 |

## 결제수단 관리 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 마이철수 메뉴 | `결제수단` 탭과 `/my/payment-methods` 로그인 전용 경로 추가 | 완료 |
| 결제수단 유형 | 쿠페이머니 없이 은행계좌·신용/체크카드 등록·목록·삭제 지원 | 완료 |
| 팝업 흐름 | 목록 → 결제수단 선택 → 은행 선택·계좌 입력 또는 카드 입력을 페이지 이동 없이 모달에서 처리 | 완료 |
| DB 저장 | provider_name·method_type·마지막 네 자리만 보관, 전체 카드·계좌번호는 저장·응답하지 않음 | 완료 |
| 권한 | 로그인한 본인 결제수단만 조회·등록·삭제 | 완료 |

### 결제수단 검증
| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 카드·계좌의 마지막 네 자리 마스킹 테스트 통과 |
| 실제 API | 테스트 구매자 02로 계좌·카드 등록, 마스킹 응답, 삭제·정리 완료 |
| DB | V24 payment_methods 마이그레이션 Supabase 적용 완료 |
| 전체 빌드 | client lint·tsc·build, server test 통과 |

## 전역 다크모드 토글·유지 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 테마 상태 | `ThemeProvider`가 light·dark 상태를 HTML 루트 클래스에 적용 | 완료 |
| 유지 | `chulsooya-theme` localStorage에 사용자 선택을 저장해 페이지 이동·새로고침 후 복원 | 완료 |
| 사용자 화면 | 쇼핑 헤더에 아이콘 토글 추가, 검색·메뉴·계정·탐색 영역 다크 표면 보정 | 완료 |
| 관리자 화면 | 관리자 상단 헤더에 아이콘 토글 추가, 레거시 관리자 패널의 배경·테두리·텍스트 대비 보정 | 완료 |
| 접근성 | 토글의 aria-pressed와 라이트·다크 모드 전환 레이블 제공 | 완료 |

### 다크모드 검증
| 검증 | 결과 |
| :--- | :--- |
| 클라이언트 | lint 경고 0, tsc·build 통과 |
| 서버 회귀 | gradlew test 통과 |

## 개발 결제 승인 탭 (2026-08-17)
| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 관리자 메뉴 | 왼쪽 메뉴 `개발 검증 → 개발 결제 승인` 별도 탭 추가 | 완료 |
| 대기 목록 | 판매자 재고 확인을 마쳐 `PAYMENT_PENDING` 상태인 주문만 조회 | 완료 |
| 임시 승인 | 관리자만 주문별 `개발용 결제 승인`을 실행해 `PAYMENT_PENDING → PAID → PREPARING` 전환 | 완료 |
| 결제 이력 | `DEVELOPMENT_ADMIN_APPROVAL` 결제수단과 개발용 거래 키를 남겨 실제 결제와 구분 | 완료 |
| 멱등성 | 주문 단위 잠금과 기존 완료 결제 확인으로 중복 승인 요청은 상태를 반복 전환하지 않음 | 완료 |
| 운영 전환 | 실제 PG 결제창·서버 승인·웹훅 서명 검증으로 대체 필요 | 기록 완료 |

### 개발 결제 승인 검증
| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 관리자 승인 시 결제 대기 주문이 준비 중으로 전환되고 비관리자는 차단되는 테스트 통과 |
| 실제 API | 일반 관리자 대기 목록 200·일반 구매자 접근 403 확인 |
| 프론트엔드 | lint 경고 0, tsc·build 통과 |
| 백엔드 | 전체 gradlew test 통과, 최신 JAR 재시작 |

## 2026-08-17 — 개발 결제 승인 히스토리 및 실제 강남 매칭 검증

- 관리자 `개발 결제 승인` 탭 하단에 `승인 및 처리 상태 히스토리`를 추가했다. 개발 결제 승인 완료 건은 결제 승인 시각, 결제 상태, 현재 주문 처리 상태, 판매점, 주문 금액을 표시한다.
- `GET /api/admin/payments/development-history`는 `DEVELOPMENT_ADMIN_APPROVAL` 결제 기록만 역시간순으로 반환하며 관리자만 접근할 수 있다.
- 구매자 01의 기본 배송지가 동대문구였던 상태를 확인하고, 실제 매칭 검증을 위해 강남구 테헤란로 123으로 수정했다. 지역 확인 결과와 판매자 04 역할 계정(`test.seller01@chulsooya.dev`)의 판매점 구 코드가 `GU_C99`로 일치했다.
- 판매점 `테스트 강남 철물점`은 검증 완료, 주문 수신 가능, 가용 슬롯 3개임을 확인했다. 구매자 주문 요청 → 판매자 응찰 → 판매자 재고 확인으로 주문 #9를 `PAYMENT_PENDING`까지 이동했다.
- 슈퍼어드민이 관리자 화면에서 주문 #9를 직접 개발 결제 승인했다. 구매자·판매자 주문 상태는 `PREPARING`, 결제 기록은 `PAID`, 개발 승인 대기 목록에서는 제거됨을 실제 API로 검증했다.
- 검증: `npm run lint` 경고 0건, `npx tsc -b`, `npm run build`, `gradlew test` 통과.


## 2026-08-17 — 개발 정산·환불 및 결제 승인 히스토리 연동

관리자 `정산 · 환불` 탭을 결제 승인 히스토리 기반 정산 화면으로 확장했다. 개발 환경 수수료율은 서버 설정 `app.settlement.commission-bps=1000`으로 분리해 **10.00%**로 계산하며, 실제 PG 이체는 수행하지 않는다. 결제 승인 시 정산 레코드를 생성하고, 부분·전액 환불 시 환불액·수수료·판매자 정산 예정액을 즉시 재계산한다.

주문 #9로 실제 흐름을 검증했다. 슈퍼어드민 직접 개발 결제 승인 뒤 1,000원 부분 환불과 136,500원 전액 환불을 순서대로 수행했고, 결제는 `REFUNDED`, 정산은 `CANCELLED`, 누적 환불액은 137,500원, 판매자 정산 예정액은 0원으로 DB에 저장됐다. 관리자 화면에는 판매점명, 승인 금액, 수수료, 환불, 정산 예정, 정산 상태, 결제 승인 시각이 표시된다.

검증: 실제 Supabase DB API 검증, Chrome 관리자 화면 확인, `npm run lint`, `npx tsc -b`, `npm run build`, `gradlew test` 통과.


## 판매자 신청 증빙 문서 업로드 (V26 완료)

판매자 신청에 **사업자등록증**과 **통장사본**을 각각 필수 이미지 증빙으로 추가했다. 전용 Supabase Storage 버킷 seller-verification-documents는 비공개로 생성됐고, JPG/PNG만 허용하며 파일별 최대 5MB로 제한한다.

서버·클라이언트는 100KB 이상 5MB 이하, JPG/PNG, 짧은 변 800px 이상, 긴 변 6000px 이하를 검증한다. 서버는 파일 서명, 실제 이미지 디코딩, 해상도를 재검증한다. 객체 키는 seller-applications/{applicationId}/{documentType}/{uuid} 형식이며 DB에는 공개 URL이 아니라 object key·content type·size만 저장된다. 관리자가 조회할 때만 10분 서명 URL을 생성한다.

V26 마이그레이션은 seller_applications에 통장사본 object key·content type·size 필드를 추가했다. 관리자 승인은 사업자등록증과 통장사본이 모두 제출돼야 가능하다. 판매자 신청 화면은 드래그앤드롭과 파일 찾기를 모두 제공하며, 관리자 판매자 신청 심사와 판매자 운영 상세에서 비공개 문서를 미리보기로 검토한다.

실제 검증에서는 테스트 구매자 02의 신청 ID 1에 두 문서를 각각 1,921,453 bytes PNG로 업로드했고, 일반 관리자 서명 URL 두 건의 이미지 응답을 확인했다. 신청은 승인하지 않고 PENDING 상태로 유지했다. 프론트엔드 lint 0건·TS 빌드·Vite build와 서버 전체 Gradle 테스트도 통과했으며, 최신 서버는 V26 적용 JAR로 8080에서 실행 중이다.


### 판매자 신청 폼 내 단일 문서 제출 동선 보정

판매자 신청 화면에 사업자등록증과 통장사본 선택 영역을 기본 정보 입력 영역 아래에 직접 배치했다. 사용자는 드래그앤드롭 또는 파일 찾기로 두 문서를 선택한 뒤 판매자 신청 접수 버튼 한 번으로 신청 DB 저장과 두 비공개 스토리지 업로드를 순차 실행한다. 두 문서 중 하나라도 없거나 이미지 기준을 충족하지 않으면 신청 전에 안내한다. 신청 저장 후 일부 업로드가 실패하면 신청 상태 화면에서 재시도할 수 있도록 유지한다.

## 판매자 등록 해지 신청 및 관리자 승인 연동 (V27 완료)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 판매자 메뉴 | 마이철수는 현재 역할이 **SELLER**이면 `판매자 등록 신청` 대신 `판매자 등록 해지 신청`만 표시한다. 신청이 대기 상태면 검토 중 문구를 표시한다. | 완료 |
| 신청 흐름 | `/seller/deactivation`에서 해지 사유를 제출하고, 이미 접수된 요청은 중복 생성하지 않고 상태로 반환한다. | 완료 |
| 관리자 처리 | 회원관리에서 대기 요청 수·신청 사유·신청 시각을 표시하며, 승인 또는 반려할 수 있다. | 완료 |
| 승인 효과 | 승인 시 판매자 역할을 일반 회원으로 변경하고, 해당 판매점의 영업 및 주문 수신 상태를 비활성화한다. | 완료 |
| 역할 보호 | 일반 회원 전환은 관리자 역할 직접 변경으로는 처리할 수 없고, 해지 신청 승인 API만 사용한다. 판매자 활성화에는 검증된 판매점이 필요하다. | 완료 |
| 지연 로딩 보정 | 해지 요청 응답에서 판매자 이름을 조회할 때 발생한 `LazyInitializationException`을 컨트롤러 트랜잭션 범위로 보정했다. | 완료 |

### 판매자 해지 신청 검증

| 검증 | 결과 |
| :--- | :--- |
| 판매자 01 상태 | `test.seller01@chulsooya.dev`(사용자 ID 107)의 역할이 **SELLER**로 유지됨을 본인·관리자 API에서 확인했다. |
| 판매자 02 신청 | `test.seller02@chulsooya.dev`(사용자 ID 108)의 요청 ID 1이 **PENDING** 상태로 조회된다. |
| 관리자 알림 | `GET /api/admin/seller-deactivations`가 대기 요청 ID 1을 반환해 회원관리 알림 섹션과 연결됨을 확인했다. |
| API 오류 회귀 | 지연 로딩 오류 보정 후 판매자 본인 요청 조회·관리자 대기 목록 조회가 모두 200 응답으로 통과했다. |
| 클라이언트 | `npm run lint` 경고·오류 0건, `npx tsc -b`, `npm run build` 통과. |
| 서버 | `./gradlew.bat test` 통과, V27 포함 최신 JAR를 8080 포트에서 실행 중. |

> 테스트 데이터 유지: 판매자 02의 요청 ID 1은 관리자 대기 알림·승인 UI 확인을 위해 **PENDING**으로 유지한다. 실제 승인 검증이 필요할 때에는 이 요청을 처리해 판매점 비활성화와 일반 회원 전환을 확인한다.

## 관리자 판매자 신청 심사 — 전체 입력 정보 조회 보완 (2026-08-17)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 심사 진입 | 목록의 `문서 검토` 버튼을 `전체 정보·문서`로 변경했다. | 완료 |
| 가입자 정보 | 신청자 이름·가입 이메일·가입 연락처를 상세 패널에 표시한다. 기존 계정에 가입 연락처가 없으면 `미입력`으로 명시한다. | 완료 |
| 사업자·판매점 정보 | 판매점명, 대표자명, 사업자등록번호, 개업일, 시·구, 사업장 주소, 사업장 연락처, 취급 품목을 한 화면에서 확인한다. | 완료 |
| 심사 정보 | 신청 상태, 국세청 확인 상태·메시지, 신청·심사 시각, 심사 담당자 ID, 반려 사유를 함께 표시한다. | 완료 |
| 증빙 문서 | 기존의 비공개 사업자등록증·통장사본 서명 URL 미리보기는 동일 상세 패널 하단에서 유지한다. | 완료 |
| API 범위 | 관리자 전용 판매자 신청 목록 응답에 신청자 연락처, 원문 사업자등록번호, 개업일을 추가했다. | 완료 |

### 전체 정보 심사 검증

| 검증 | 결과 |
| :--- | :--- |
| 단위 테스트 | 관리자 응답이 가입 연락처·개업일·사업장 주소·사업장 연락처·취급 품목을 포함하는 테스트를 추가하고 통과했다. |
| 실제 API | 테스트 신청 ID 1에서 신청자·사업장·사업자·개업일·취급 품목·증빙 상태가 관리자 API로 반환됨을 확인했다. |
| 클라이언트 | `npm run lint` 경고·오류 0건, `npx tsc -b`, `npm run build` 통과. |
| 서버 | `./gradlew.bat test` 통과, 최신 JAR를 8080 포트에서 재시작했다. |

## 승인 판매자 신청 → 판매자 운영 등록 판매점 연동 점검 (2026-08-17)

| 점검 항목 | 실제 확인 결과 |
| :--- | :--- |
| 승인 신청 | 승인 상태 판매자 신청은 1건이다. 신청 ID 1의 신청자 계정은 `SELLER` 역할로 전환되어 있다. |
| 판매점 목록 연동 | 신청자 이메일을 기준으로 판매자 운영의 등록 판매점에서 동일 소유자 판매점을 찾았고, `문서 검증 테스트 철물점`이 존재한다. |
| 판매점 명칭 | 신청서 판매점명과 등록 판매점명이 모두 `문서 검증 테스트 철물점`으로 일치한다. |
| 핵심 정보 일관성 | 시·구, 사업장 주소, 사업장 연락처, 취급 품목이 신청서와 등록 판매점 데이터에서 모두 일치한다. |
| 구현 판단 | 승인 처리 서비스가 신청서 값을 단일 원본으로 사용해 판매점을 생성하고 있으므로, 이번 점검에서는 추가 보정이 필요하지 않았다. |

## 판매점 등록·승인 DB 정합성 자동 점검 스크립트 (2026-08-17)

| 항목 | 내용 |
| :--- | :--- |
| 실행 파일 | `server/scripts/auditSellerStoreConsistency.mjs` |
| 점검 기준 | 승인 신청 ↔ 회원 역할 ↔ 등록 판매점 연결, 판매점명·시·구·주소·연락처·취급 품목, 승인 상태·주문 수신 상태를 대조한다. |
| 결과 | 오류가 없으면 종료 코드 0, 실행 실패는 1, 정합성 오류는 2로 종료한다. `--json`으로 자동 처리용 보고서를 출력할 수 있다. |
| 보안 | 관리자 이메일·비밀번호는 현재 터미널 환경 변수로만 전달하며 스크립트나 저장소에 저장하지 않는다. 점검은 읽기 전용 API만 호출한다. |
| 테스트 | `auditSellerStoreConsistency.test.mjs`에서 정상 연결, 판매점명·취급 품목 불일치, 등록 판매점 누락을 검증한다. |
| 실제 실행 | 승인 신청 1건·등록 판매점 103건을 점검했고 오류 0건·경고 0건으로 `PASS`를 확인했다. |
| 사용 문서 | `server/scripts/README.seller-store-consistency.md`에 실행 환경 변수·종료 코드·판정 규칙을 기록했다. |

## 관리자 메뉴 편의성 정리 — 행사 재배치·클레임 진입 제거 (2026-08-17)

| 변경 | 결과 |
| :--- | :--- |
| 행사 · 이벤트 관리 | 관리자 좌측 메뉴에서 `쿠폰 운영` 바로 아래로 이동했다. `EventCampaignManagementPanel` 연결과 행사 CRUD·히어로 배너 기능은 유지했다. |
| 클레임 운영 | 좌측 메뉴, 대시보드 빠른 진입 카드, 탭 타입·저장 탭 판별·렌더링 분기에서 제거했다. 기존 클레임 컴포넌트와 API·DB는 삭제하지 않았다. |
| 기존 저장 탭 | 이전 세션에 `claims`가 저장돼 있어도 유효 탭 목록에서 제외되므로 관리자 대시보드 홈으로 안전하게 복귀한다. |
| 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`를 모두 통과했다. |
\n## 판매자 신청 심사 대기열·완료 히스토리 및 신규 5건 실데이터 테스트 (2026-08-17)\n\n| 항목 | 구현·검증 결과 |\n| :--- | :--- |\n| 대기열 | 관리자 판매자 신청 심사 화면 상단에는 `PENDING`·`MANUAL_REVIEW` 신청만 접수 시각 오름차순으로 표시한다. |\n| 완료 히스토리 | `APPROVED`·`REJECTED` 신청은 하단 히스토리로 분리하고 입력 정보·심사 정보·비공개 문서 미리보기 연결을 유지한다. |\n| 연속 심사 | 대기 목록의 각 신청에 승인·반려 버튼을 제공한다. 처리 완료 후 목록을 새로고침해 다음 대기 신청이 상단에 유지되며, 완료 건은 히스토리로 이동한다. |\n| 서버 정렬 | 관리자 전체 신청 목록도 `submittedAt` 오름차순으로 조회하도록 `findAllByOrderBySubmittedAtAsc`를 적용했다. |\n| 신규 계정 | `test.sellerapp01`~`05@chulsooya.dev` 5개 계정을 실제 Supabase Auth에 생성하고 사용자 프로필을 저장했다. |\n| 실제 신청·문서 저장 | 신청 ID 2~6을 모두 `PENDING`으로 제출했다. 각 신청은 사업자등록증·통장사본 JPEG를 실제 비공개 스토리지에 저장하고 두 제출 상태를 확인했다. |\n| 문서 검증 | 5개 신청이 접수 순서 1~5로 정렬되며, 각 문서의 저장 크기 318KB~431KB와 관리자 서명 URL 반환을 실제 API에서 확인했다. |\n| 품질 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`; 백엔드 `gradlew test bootJar`를 통과했다. |\n
## 판매자 신청 심사 인라인 상세·완료일 범위 필터 (2026-08-17)

| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 인라인 상세 | 심사 대기와 심사 완료 히스토리 모두에서 `전체 정보·문서`를 누른 해당 행 바로 다음에 신청 정보와 두 문서 미리보기가 확장된다. 목록 하단의 독립 상세 패널은 제거했다. |
| 상세 토글 | 같은 항목을 다시 누르거나 `접기`를 누르면 해당 행의 상세만 닫힌다. 다른 항목을 누르면 선택 위치가 즉시 해당 항목 아래로 이동한다. |
| 완료일 필터 | 심사 완료 히스토리에 시작일·종료일 HTML 날짜 입력과 기간 초기화 버튼을 추가했다. `reviewedAt`의 한국 시간 날짜가 선택 범위에 포함되는 승인·반려 건만 표시한다. |
| 대기열 유지 | 대기 목록은 접수 시각 기준 오름차순을 유지하고, 히스토리 기간 필터는 완료된 신청에만 적용한다. |
| 품질 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`를 통과했다. 소스 검증으로 인라인 행 렌더링, 날짜 입력 2개, `reviewedAt` 범위 조건, 기존 하단 독립 패널 제거를 확인했다. |

## 판매점 인라인 후기 관리 및 관리자 메모 (2026-08-17)

| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 판매점 행 인라인 관리 | 판매자 운영에서 판매점명을 누르면 해당 판매점 행 바로 아래에 후기·판매자 대댓글·증빙 문서·관리자 메모 관리 영역이 열린다. 기존 별도 후기 버튼은 제거했다. |
| 후기 없음 상태 | 선택 판매점에 거래 후기가 없으면 해당 판매점 아래에 `등록된 후기가 없습니다.`를 표시한다. |
| 관리자 후기 관리 | 관리자는 모든 거래 후기의 내용 수정, 공개·숨김 상태 변경, 영구 삭제, 판매자 대댓글 저장을 수행할 수 있다. 삭제와 숨김·재공개 시 판매점 신뢰 점수·평점을 기존 로직으로 다시 계산한다. |
| 관리자 신규 글쓰기 | 실제 거래 후기는 거래 구매자만 작성하는 기존 정책을 유지한다. 관리자의 새 글은 별도 `관리자 메모`로 저장하며, 작성·수정·삭제가 가능하다. |
| DB/API | V28 `admin_store_review_notes` 테이블과 판매점별 메모 CRUD API, 관리자 후기 수정 API를 추가했다. 모든 API는 관리자 권한을 검사한다. |
| 실제 검증 | 판매점 ID 2 `강남 종합공구`에서 후기 0건 조회, 임시 관리자 메모 작성·수정·삭제·원상 복구를 실제 API로 통과했다. |
| 품질 검증 | 관리자 후기 수정 도메인 테스트, 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`, 백엔드 `gradlew test bootJar`를 통과했다. |

## 결제 후 배달 시작·완료 및 주문 모니터링 흐름 (2026-08-17)

| 항목 | 구현·실제 검증 결과 |
| :--- | :--- |
| 판매자 배달 처리 | 결제 완료 뒤 판매자 진행 주문에서 `배달 시작` → `배달 완료`로 상태를 전환한다. 즉시배달만 배송 진행 상태를 사용하며 픽업 흐름은 기존 준비 완료·거래 완료를 유지한다. |
| 구매자 알림 | 판매자가 배달을 시작하면 `DELIVERY_STARTED`, 완료하면 `DELIVERY_COMPLETED` 고객 알림을 저장한다. |
| 관리자 타임라인 | 주문 응찰 모니터링에 `배달 시작`·`배달 완료` 이벤트를 추가했다. 2초 폴링으로 상태를 갱신하며, 현재 진행 단계는 느린 빨간 점멸, 완료 이벤트는 녹색 점, 나머지 완료 이력은 보라색 점으로 표시한다. |
| 실제 주문 #10 | 테스트 구매자 03이 즉시배달 503,400원 주문을 생성하고, 테스트 강남 철물점이 응찰·재고 확인 후 사용자가 개발 결제 승인을 수행했다. |
| 실제 전환 검증 | 주문 #10: `PAYMENT_PENDING` → `PREPARING` → `DELIVERY_IN_PROGRESS` → `COMPLETED` 전환을 실제 API로 검증했다. 배달 시작·완료 알림 2건과 관리자 타임라인의 두 이벤트가 모두 저장됐다. |
| 품질 검증 | 배송 알림 서비스 단위 테스트, 프론트엔드 린트·타입·프로덕션 빌드, 백엔드 전체 테스트·JAR 빌드를 통과했다. 최신 JAR가 8080 포트에서 실행 중이다. |

## 멤버십 시간차 제안·응찰·낙찰 모니터링 보정 (2026-08-17)

| 항목 | 결과 |
| :--- | :--- |
| 문서 기준 | 프리미엄은 0초, 일반은 3초, 신규·비구독은 6초 시차로 순차 제안을 받고, 판매자 응찰 뒤 단일 낙찰자가 확정된다. |
| 문제 원인 | 기존 타임라인은 실제 멤버십 제안 단계를 표시하지 않고 `낙찰`과 `응찰 확정`을 같은 시각에 역순으로 표시했다. 또한 추가 확산 스케줄러가 15초 주기여서 3·6초 규칙을 실제로 지키지 못했다. |
| 타임라인 보정 | 주문 접수 → 프리미엄 우선 제안 → 일반 판매자 확산 제안 → 신규·비구독 판매자 확산 제안 → 응찰 접수 → 낙찰 확정 → 물품 확인 → 결제 → 배송 순서로 표시한다. |
| 확산 주기 보정 | `spreadPendingOrders`의 고정 지연을 15초에서 1초로 변경해 0·3·6초 규칙의 최대 오차를 약 1초로 제한했다. |
| 실제 검증 | 자동 검증 주문 #11에서 프리미엄 +33ms, 일반 +3,928ms, 신규·비구독 +6,067ms로 제안된 것을 확인하고 주문을 취소 처리했다. |
| 품질 검증 | 백엔드 전체 테스트와 최신 JAR 빌드를 통과하고 8080 포트에서 재시작했다. |


## 프리미엄·골드·실버 판매자 구독 및 단계적 응찰 (완료)

- 멤버십 등급을 **프리미엄·골드·실버**로 통일했고, 비구독 판매자는 실버 기본 등급으로 정리했다.
- 단계별 주문 공개를 프리미엄 0~30초, 프리미엄·골드 30~60초, 전체 판매자 60초 이후로 구현했다. 각 단계에서는 가용 슬롯이 있는 해당 등급 판매자 모두에게 동시에 공개하며, 응찰 낙찰은 기존 DB 잠금 기반 서버 수신 선착순으로 유지한다.
- V29: 구독상품, 판매자 구독 변경 이력, 판매점 만료일을 추가했다. V30: 기존 임시 등급을 구독 이력 없는 실버 기본 등급으로 정규화했다.
- 판매자 경로 /seller/subscription: 구독상품 조회·자동 승인 구매, 등급·만료일·공개 단계·변경 이력 확인을 제공한다.
- 관리자 구독상품 관리: 상품 등록·수정·삭제(이력 존재 시 판매 중지), 판매자 등급 강제 조절, 30일 만료일 설정, 등급 이력 조회를 제공한다.
- 판매자 운영 목록에도 프리미엄·골드·실버 배지를 표시한다.
- 자동 구독 승인·관리자 프리미엄 승급·실버 원복·이력 검증을 실제 API로 완료했다. 상품 ID 1, 판매점 ID 101, 현재 테스트 판매점 등급은 실버로 원복했다.
- 백엔드 전체 테스트, 프론트엔드 lint·타입 검사·프로덕션 빌드, V29·V30 Flyway 적용과 최신 JAR 재시작을 완료했다.

## 판매점·공구 이미지 자산 및 DB 연결 (2026-08-17)

- 판매점 카드용 철물점 외관 이미지 20개와 대·중분류 대표 공구 이미지 20개를 생성했다. 이미지에는 테스트 문구·워터마크·로고를 포함하지 않았다.
- 정적 자산 경로는 client/public/assets/generated/stores/ 및 client/public/assets/generated/tools/ 이며, Vite 프로덕션 빌드에도 같은 경로로 복사된다.
- 저용량 최적화: 판매점 이미지는 640×480 JPEG, 공구 이미지는 640×640 JPEG로 최적화했다. 총 용량은 1,629,876바이트이며 파일별 최대 크기는 56,916바이트다.
- DB는 이미지 바이너리를 저장하지 않고 정적 URL만 저장한다. 등록 판매점 106곳에 판매점 이미지 20종을 순환 적용했고, 상품 1,000개와 관련 대·중분류 48개에 공구 이미지 20종을 카테고리별로 적용했다.
- 실제 Supabase 조회로 판매점 106/106, 상품 1,000/1,000의 생성 이미지 URL 연결을 확인했다.
- 프론트엔드 lint·TypeScript·프로덕션 빌드는 통과했다. 이 작업은 백엔드 소스 변경이 없는 정적 자산·DB URL 반영이며, 전체 Gradle 테스트는 출력 없이 장시간 대기해 중지했다.

## 카탈로그 이미지 Supabase Storage 전환 (2026-08-17)

- 공개 Storage 버킷 catalog-images를 생성하고 최적화된 판매점 외관 20개, 공구 카테고리 이미지 20개를 업로드했다. 버킷에는 JPEG만 허용하고 파일 크기 상한은 1MB로 설정했다.
- 공개 경로는 https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/catalog-images/stores/ 및 tools/ 이다.
- DB는 정적 로컬 경로 대신 Storage 공개 URL을 참조한다. stores.image_url 106/106, products.image_url 및 image_urls 1,000/1,000, categories.image_url 56개가 Storage URL로 전환됐다.
- 대표 파일 stores/store-01.jpg 공개 URL은 HTTP 200, image/jpeg, 47,996바이트로 검증했다.
- 로컬 client/public/assets/generated 자산은 개발·빌드용 복사본으로 남아 있으나, 운영 데이터의 이미지 참조는 Supabase Storage URL을 사용한다.

## 행사 테마·철물점 아이콘 확장 (2026-08-17)

- 행사 히어로 배경용 고해상도 테마 20개를 생성하고 1440x810 저용량 JPEG로 최적화했다. 행사 등록·수정의 배경 테마 선택지에 기존 그라데이션과 함께 추가했다.
- 철물점 중심 3D 아이콘 30개(드릴, 해머, 렌치, 배관, 안전 장비, 도어락, 작업등 등)를 생성하고 투명 WebP로 최적화했다. 기존 SVG 아이콘과 함께 행사 아이콘 선택지에 추가했다.
- 생성 자산 50개는 Supabase Storage 공개 버킷 event-assets에 업로드했다. themes는 image/jpeg, icons는 image/webp로 제공되며 버킷 파일 상한은 1MB다.
- 신규 이미지 테마를 선택한 행사는 Storage 배경을 히어로에 적용한다. 선택한 생성 아이콘은 히어로 우측 약 1/3 영역(large breakpoint 23rem)에서 크게 표시한다.
- 관리자 행사·이벤트 관리의 아이콘 선택은 5열 대형 카드에서 8~12열, 높이 44~48px의 컴팩트 그리드로 축소했다. 미리보기의 아이콘은 더 크게 표시한다.
- 프론트엔드 lint, TypeScript 빌드, Vite production build를 통과했다. 대표 테마·아이콘 Storage URL은 HTTP 200으로 확인했다.

## 행사 히어로 생성 자산 저장 보정 (2026-08-17)

- 원인: 관리자 행사 API의 themeKey·iconKey 허용 목록이 기존 20개 테마·30개 SVG 아이콘에 고정되어 있었다. 신규 생성 테마·철물점 아이콘을 저장하면 서버가 blue·toolbox 기본값으로 정규화했고, 메인 히어로 공개 API도 기본값을 반환했다.
- 보정: AdminEventCampaignController 허용 목록에 생성 배경 테마 20개와 asset-* 철물점 아이콘 30개를 추가했다.
- 검증: 행사 ID 1을 purpleTools·asset-drill로 관리자 API에서 저장한 뒤, 공개 /api/event-campaigns/hero API가 동일 키를 반환하는 것을 실제 검증했다.

## 행사 아이콘 토글 해제 (2026-08-17)

- 관리자 행사 아이콘 선택은 동일 카드 재클릭 시 none 값으로 전환되어 적용을 해제한다. 새 행사 기본값도 none이다.
- CampaignIcon은 none 또는 빈 키에서 렌더링하지 않아 메인 히어로에 아이콘 영역을 만들지 않는다.
- 서버 행사 API는 none을 유효 아이콘 키로 저장하며, 잘못된 아이콘 키도 none으로 안전하게 정규화한다.
- 아이콘 카드에 hover 이동·확대·테두리·그림자와 active 축소 반응을 추가했다.
- 실제 관리자 API에서 iconKey=none 저장, 비노출 행사 공개 히어로 제외, 임시 검증 행사 삭제까지 확인했다.

## 판매점 고객 노출 설정 CRUD 및 목록·상세 동기화 (2026-08-18)
| 항목 | 구현·검증 결과 |
| :--- | :--- |
| 데이터 모델 | V31에서 stores.directory_visible, customer_badge_text, customer_notice_text를 추가했다. 기존 판매점은 고객 노출 상태를 유지한다. |
| 관리자 판매자 운영 | 판매점 행의 기존 인라인 수정 폼에 **고객 화면 노출 설정**을 추가했다. 고객 배지(60자), 안내 문구(200자), 목록·상세 고객 노출 토글을 등록·수정 흐름으로 저장한다. |
| 고객 목록·상세 | 목록 카드에서는 내부 운영값인 가용 슬롯을 완전히 제거했다. 관리자가 저장한 배지와 안내 문구는 목록과 상세에 함께 노출된다. 상세는 기존처럼 가용 슬롯을 표시하지 않는다. |
| 노출 제어 | 고객 노출을 끄면 공개 판매점 목록·지역 필터·상세 조회에서 제외되며, 관리자는 판매자 운영 목록에서 계속 관리할 수 있다. |
| 실제 DB 연동 검증 | 테스트 판매점 ID 101에 배지·안내 문구를 관리자 API로 저장한 뒤 공개 목록과 상세 API에서 동일 값을 확인하고 원래 값으로 복구했다. |
| 품질 검증 | 고객 노출 설정 단위 테스트, 백엔드 전체 테스트, 프론트엔드 lint·TypeScript·프로덕션 빌드를 통과했다. V31 Flyway 적용 후 최신 JAR를 8080 포트에서 재시작했다. |


## 백엔드 Supabase 응답 지연 안정화 (2026-08-18)

| 범위 | 보정 내용 | 상태 |
| :--- | :--- | :--- |
| 원인 진단 | 스레드 덤프에서 공개 판매점 목록이 `StoreResponse.from`의 판매자 이메일 지연 로딩으로 판매점마다 `users` 조회를 발생시키고, Supabase Session pooler SSL 응답을 기다리는 현상을 확인 | 완료 |
| 공개 목록 DTO | 고객용 `/api/stores`는 판매자 이메일을 포함하지 않는 `StoreResponse.fromPublic`을 사용하도록 변경해 판매자별 지연 로딩 조회를 제거 | 완료 |
| 관리자 응답 | `/api/admin/stores`와 관리자 생성·수정 응답은 기존처럼 판매자 이메일을 포함 | 완료 |
| DB 대기 제한 | Supabase Hikari에 연결 5초·검증 3초·JDBC 연결 5초·소켓 15초·JPA 쿼리 15초 제한과 keepalive를 추가해 원격 DB 지연이 무한 대기가 되지 않도록 보정 | 완료 |
| 실행 방식 | 최신 JAR를 8080 포트에서 재기동하고 표준 출력·오류 로그를 `server/build/server-runtime.*.log`로 분리 | 완료 |

### 안정화 검증

| 검증 | 결과 |
| :--- | :--- |
| `cd server && .\\gradlew.bat test` | 통과 |
| 공개 판매점 목록 | 재기동 직후 7.96초, 워밍업 후 1.54초·2.83초·1.47초로 HTTP 200 확인 |
| 최종 공개 API | `/api/stores` HTTP 200 0.95초, `/api/stores/16` HTTP 200 0.38초 확인 |
| 실행 상태 | 최신 JAR 프로세스가 8080 포트를 유지하며 응답 확인 |

> 원격 Supabase 연결이 지연되면 이제 연결·소켓·쿼리 시간이 제한된다. 목록 API의 판매자 이메일은 고객 화면에 불필요하므로 공개 DTO에서 제외하며, 관리자 목록만 기존 판매자 이메일을 조회한다.


## 2026-08-18 — 브랜드 자산 전역 적용 완료

| 영역 | 반영 내용 |
| --- | --- |
| Supabase Storage | 공개 `event-assets` 버킷의 `brand/` 경로에 체크 테두리 메인 로고 WebP와 파비콘 WebP를 저장했다. |
| DB | V33 `brand_assets` 테이블로 `MAIN_LOGO`, `FAVICON`의 Storage 키·공개 URL·생성 출처를 기록했다. |
| 앱 | 공통 `ShopHeader`가 Storage 공개 메인 로고 URL을 사용하도록 변경했고, `public/favicon.ico`는 멀티사이즈 체크 테두리 ICO로 교체했다. |
| 캐시 | `index.html` 파비콘 버전을 `20260818-outline`으로 갱신했다. |
| 검증 | Storage 공개 URL HTTP 200, Flyway V33 적용, 백엔드 전체 테스트 무실패, 프론트엔드 lint·타입 검사·프로덕션 빌드, My Browser 메인 헤더 렌더링을 확인했다. |

## 비즈니스 알림 전수 보완 (2026-08-18)

- 고객센터 관리자 답변 알림은 기존에 DB 저장이 구현돼 있었고, 헤더가 최초 진입 후 재조회하지 않아 빨간 점·목록에 늦게 반영되는 문제를 확인했다.
- 공통 헤더의 고객센터 알림 조회에 10초 폴링과 `chulsooya:notifications-updated` 즉시 갱신 이벤트를 추가했다. 문의 접수 직후에도 헤더 배지가 즉시 재조회된다.
- 헤더 목록은 미확인 알림만 표시한다. 클릭된 알림은 읽음 처리 뒤 목록·빨간 점·숫자 배지에서 즉시 제거된다.
- `BusinessNotificationService`를 추가해 상태 전이가 확정된 트랜잭션 안에서 사용자·관리자 알림을 공통 저장하도록 정리했다.
- 보완된 알림 이벤트: 새 주문 제안 수신 판매자, 낙찰 확정 소비자·선정 판매자, 판매자 재고 확인 소비자, 결제 승인 소비자·선정 판매자, 주문 취소 소비자·선정 판매자, 관리자 환불·클레임 환불 소비자, 판매자 신청 접수 관리자·승인/반려 신청자, 구독 구매·관리자 등급 조절·만료 판매자.
- 회귀 테스트: 관리자 답변이 문의 작성자의 `INQUIRY_ANSWERED` 미확인 알림으로 저장되는 테스트와 새 주문 제안 알림 테스트를 추가했다.
- 검증: 백엔드 전체 테스트 통과, 프론트엔드 `npm run lint && npx tsc -b && npm run build` 통과, 최신 JAR 재시작 후 공개 API HTTP 200 확인.


## Supabase public RLS 보안 보정 (2026-08-19)

- Supabase Security Advisor 경고를 점검한 결과, public 스키마의 테이블 38개에서 RLS가 비활성화되어 있었고 `anon`·`authenticated` 역할에 CRUD 권한이 부여되어 있었다.
- 각 테이블에 RLS를 활성화하고 `anon`·`authenticated`의 테이블 직접 권한과 시퀀스 권한을 회수했다. 향후 테이블·시퀀스에 대한 기본 권한도 회수했다.
- 검증: public 테이블 38개 기준 `RLS_DISABLED=0`, `ANON_GRANTED=0`, `AUTHENTICATED_GRANTED=0`; anon Supabase REST의 `users` 직접 조회는 HTTP 401, Spring Boot 공개 판매점 API는 HTTP 200을 확인했다.
- Spring Boot 서버는 테이블 소유자 JDBC 역할로 REST API를 통해서만 DB에 접근하므로 기존 앱 기능 경로는 유지된다.
- Supabase Session Pooler에서 긴 DDL 배치가 대기하는 문제를 피하기 위해 실제 RLS 적용은 테이블별 짧은 연결로 완료했다. V34는 적용 완료 상태를 Flyway 이력에 기록한다.

## 관리자 CRUD 공통 상단 알림 통합 (2026-08-19)

| 범위 | 적용 내용 | 상태 |
| :--- | :--- | :--- |
| 행사·이벤트 | 행사 등록·수정·활성화·삭제, 자산 업로드·수정·이미지 교체·삭제·행사 적용의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 상품·카테고리 | 상품 등록·수정, 옵션 저장, 활성화·비활성화와 입력 검증 오류를 공통 상단 토스트로 통일 | 완료 |
| 판매자 신청 심사 | 증빙 문서 조회 오류, 승인·반려 및 승인 조건 검증을 공통 상단 토스트로 통일 | 완료 |
| 판매자 운영·주문 매칭 | 판매점 CRUD, 후기·대댓글·관리자 메모 관리, 슬롯 강제 조정의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 구독·쿠폰·정산·환불 | 구독상품 CRUD·판매자 등급 변경, 쿠폰 정책·회원 발행, 결제 조회·환불 처리의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 고객 문의·알림 | 문의 상태 변경과 답변 등록·고객 알림 발송의 성공·실패 안내를 공통 상단 토스트로 통일 | 완료 |
| 기존 적용 탭 | 회원 관리의 판매자 해지 처리와 개발 결제 승인 알림은 기존 공통 상단 토스트 구현을 유지 | 확인 완료 |

### 이번 검증

| 검증 | 결과 |
| :--- | :--- |
| 관리자 탭 정적 점검 | 현재 연결된 관리자 패널 12개에서 로컬 `message`·`notice` 상태 0건, 공통 `notify` 호출 확인 |
| 브라우저 확인 | 빈 행사 등록 저장 시 화면 상단 중앙에 오류 토스트 표시 확인. 데이터 변경 없음 |
| `cd client && npm run lint` | 통과, 경고·오류 0건 |
| `cd client && npx tsc -b` | 통과 |
| `cd client && npm run build` | 통과 |


## 2026-08-19 — 카카오 로그인·주소·지도 연동

- Kakao Developers에 개인 개발자 앱 `철수야`를 생성하고 카카오 로그인 사용 설정을 활성화했다.
- REST API 키 설정에 Supabase OAuth 콜백 `https://gvsnsnjfvtogvlyvmlkt.supabase.co/auth/v1/callback`을 등록하고 Client Secret을 활성화했다.
- Supabase Authentication의 Kakao Provider를 활성화하고 카카오 REST API 키·Client Secret을 저장했다. 이메일 미제공 계정 허용은 기존 회원 식별 규칙을 위해 OFF로 유지한다.
- 카카오 지도 JavaScript 키에는 `http://localhost:5173` 도메인을 등록했다. 실제 키는 Git 제외 `client/.env.local`에만 저장하고 `VITE_KAKAO_JAVASCRIPT_KEY`로 로드한다.
- `client/src/lib/kakao.ts`와 `components/address/KakaoAddressTools.tsx`를 추가했다. 카카오 우편번호 선택 후 서울시 구·도로명 주소를 기존 배송지 DTO에 맞게 채우고, 기본·추가 배송지 및 체크아웃에서 지도 미리보기를 표시한다.
- 주문 요청의 카카오 주소 선택은 기존 `regionApi.resolve`를 계속 호출하므로, 판매자 매칭 구 판정은 기존 서버 권위를 유지한다.
- 검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과. 로그인 화면에서 카카오 로그인 시작 버튼 노출 확인.

## Supabase Free 기반 로그인 유지·비활동 자동 로그아웃 (2026-08-20)

| 항목 | 구현·확인 결과 |
| :--- | :--- |
| Supabase 세션 설정 | 현재 Free 요금제에서는 `Inactivity timeout`·`Time-box user sessions`가 Pro 이상 전용으로 잠겨 있음을 콘솔에서 확인했다. Access token expiry는 권장 기본값 3,600초를 유지했다. |
| 기본 로그인 | `로그인 상태 유지`는 기본 미선택으로 변경했다. 체크하지 않으면 Supabase 세션을 브라우저 세션 저장소에 보관하고, 30분 활동 없음 시 로컬 로그아웃한다. |
| 로그인 상태 유지 | 체크 시 Supabase 세션과 인증 스냅샷을 로컬 저장소에 보관하며, 마지막 활동 후 7일 동안 유지한다. |
| 활동 감지 | 마우스 클릭·키보드 입력·터치 시작·스크롤 때 만료 시각을 연장한다. 만료 시 Supabase 로컬 세션, 인증 스냅샷, 개발용 신원을 함께 정리하고 로그인 화면으로 이동한다. |
| 소셜 로그인 | Google·Kakao OAuth 시작 전에도 동일한 저장 정책을 기록해 이메일 로그인과 동작을 통일했다. |
| 검증 | 로그인 화면의 기본 미선택 렌더링 확인, `npm run lint`, `npx tsc -b`, `npm run build` 통과. 30분·7일 실제 경과 검증은 타이머 시간이 길어 수동 운영 확인 대상으로 남긴다. |

> Free 요금제의 프론트엔드 자동 로그아웃은 사용자 기기의 로컬 세션을 제거한다. 서버가 무활동 refresh session까지 강제 만료해야 하면 향후 Supabase Pro의 세션 설정을 적용한다.

## 로그인·회원가입 정중앙 인증 화면 개편 (2026-08-20)

| 범위 | 적용 내용 |
| :--- | :--- |
| 공통 배경 | 밝은 뉴트럴 표면 위에 은은한 격자와 좌측 블루 톤을 적용했다. |
| 공통 배치 | 로그인·회원가입 모두 데스크톱·태블릿·모바일에서 가로 정중앙 카드 구조를 사용한다. 첨부 스크린샷의 잘린 좌우 여백은 레이아웃 기준으로 사용하지 않았다. |
| 인증 카드 | 둥근 흰 카드, 선명한 제목, 구글·카카오 버튼, 구분선, 큰 입력 필드·그라데이션 CTA로 통일했다. |
| 회원가입 반응형 | 낮은 데스크톱 높이에서는 가입 전용 여백·입력 높이를 축소해 스크롤과 카드 밀림을 줄였다. |
| 문구 | 로그인·회원가입의 로딩·검증·실패·이메일 인증 안내를 한글로 통일했다. |
| 검증 | 로그인·회원가입 실화면 확인, `npm run lint`, `npx tsc -b`, `npm run build` 통과. |

### 인증 화면 후속 정밀 보완
- 구글·카카오 소셜 버튼 사이 간격을 4mm(15px)로 맞추고, 구글 테두리·카카오 노란 배경·말풍선 아이콘 대비를 보정함.
- 로그인 상태 유지 문구를 `다른 환경에서 체크 주의`로 표시하고, 물음표 아이콘 마우스오버·키보드 포커스 시 `체크하면 7일 동안 이 환경에서 로그인 상태가 유지됩니다.` 안내 말풍선을 표시함.
- 로그인과 회원가입의 각 입력·동의·제출 블록 간 간격을 4mm(15px)로 통일함.
- 검증: 로그인 도움말 hover, 회원가입 공통 소셜 버튼·필드 간격, 프론트엔드 lint·typecheck·build 통과.

### 인증 상단 메인 로고·무스크롤 보정
- `AuthLayout`의 상단 홈 링크가 메인 헤더와 같은 Supabase Storage 로고 `event-assets/brand/chulsooya-main-logo-check-outline.webp`를 사용하도록 변경함.
- 로그인·회원가입 상단 로고 클릭은 기존대로 `/` 메인 도메인으로 이동함.
- 인증 카드·로고·입력 높이를 소폭 축소하고, 데스크톱 회원가입의 테마 전환을 하단 고정으로 배치해 현재 검증 화면에서 세로 스크롤 없이 모든 폼 요소가 표시됨.
- 검증: 로그인·회원가입 실화면 확인, `npm run lint`, `npx tsc -b`, `npm run build` 통과.

### 인증 버튼 테두리·4mm 이격·다크 모드 보정
- 구글 버튼에는 표면 대비가 보이는 1px 테두리를, 카카오 버튼에는 노란 배경을 구분하는 1px 올리브 톤 테두리를 적용함.
- 로그인·회원가입 모두 폼의 각 필드, 약관, 제출 버튼 블록 사이 간격을 15px(약 4mm)로 고정함.
- 인증 전용 다크 모드에 다크 표면·테두리·텍스트·그림자 토큰을 직접 적용해 실제 어두운 카드·입력 필드 대비가 표시되도록 보정함.
- 로그인·회원가입 라이트·다크 모드 모두 `Pixels below: 0` 확인 및 프론트엔드 lint·typecheck·build 통과.

### 전역 밝은·어두운 화면 스위치 통일
- 공통 `ThemeToggle`을 좌측 밝은·우측 어두운 상태가 명시되는 스위치로 교체해 공통 헤더와 인증 화면에서 재사용함.
- 인증 화면은 로컬 테마 상태를 제거하고 전역 `ThemeProvider`를 사용하므로 모든 도메인 간 밝은·어두운 화면 상태가 유지됨.
- 인증 배경의 격자·좌측 그라데이션을 제거해 밝은 화면은 전체 밝은 표면, 어두운 화면은 전체 어두운 표면으로 명확히 전환됨.
- 회원가입·로그인 모두 테마 스위치를 메인 카드 바로 아래 중앙에 배치함.
- 검증: 인증 라이트·다크 전환, 메인 공통 헤더 스위치 표시, 인증 무스크롤, lint·typecheck·build 통과.

### 모바일 인증 폼 4mm 이격 검증
- Chrome DevTools 390×844px 에뮬레이션으로 로그인·회원가입 라이트·다크 화면을 확인함. 문서 폭과 뷰포트 폭이 모두 390px으로 측정되어 가로 넘침이 없음.
- `auth-form`을 세로 플렉스 컨테이너로 보정해 입력 필드·약관·제출 버튼 블록의 15px(약 4mm) 이격이 실제 모바일 레이아웃에도 적용됨.
- 구글 버튼 1px 중립 테두리, 카카오 버튼 1px 올리브 테두리, 입력 필드 1px 테두리가 390px 화면에서 식별 가능함.
- 모바일 회원가입은 44px 이상 터치 영역과 4mm 이격을 유지하므로 하단 제출·테마 전환 영역으로 짧은 세로 스크롤이 필요함.
- 검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과.

### 해·달 슬라이드 테마 토글 통일
- 공통 `ThemeToggle`을 Tailwind 기반 해·달 아이콘 슬라이드 스위치로 교체함. 밝은 화면은 좌측 해 손잡이, 어두운 화면은 우측 달 손잡이로 표시됨.
- 공통 헤더의 압축 토글과 로그인·회원가입 카드 아래 토글이 같은 컴포넌트와 전역 테마 상태를 사용함.
- 로그인 토글의 밝은→어두운 전환 및 메인 헤더의 전역 다크 상태 유지 확인, lint·typecheck·build 통과.

## 2026-08-20 — 관리자 계정·권한·운영 상태 관리

- Flyway V35로 `users`에 `admin_level`(`HIGHEST`/`STANDARD`/`NONE`), `admin_status`(`WORKING`/`AWAY`/`OFFLINE`), 상태 변경 시각을 비파괴적으로 추가했다.
- 기존 `ADMIN` 역할은 유지하고, `ldw6722@gmail.com`은 로컬 환경의 `app.bootstrap.super-admin-email` 설정으로 시작 시 **최고 관리자**로 승격한다.
- 최고 관리자 전용 REST API를 추가했다: 현재 관리자 정보 조회, 본인 운영 상태 변경, 관리자 목록 조회, 일반 관리자 이메일 초대.
- Supabase Admin 초대 API는 Spring Boot의 `SUPABASE_SECRET_KEY` 환경변수만 사용하며 브라우저로 노출하지 않는다.
- 관리자 상단에 접속 관리자 이름·이메일·권한·운영 상태 메뉴를 추가했다. 최고 관리자에게만 `관리자 계정 설정`과 일반 관리자 초대 화면이 보인다.
- 검증: 최고 관리자 계정 메뉴·상태 선택·계정 설정 모달·관리자 목록을 실브라우저에서 확인했다. 백엔드 권한 단위 테스트, 프론트 린트·타입 검사·빌드를 통과했다.

- 관리자 계정 설정은 중앙 고정 모달을 제거하고 상단 계정 메뉴 아래의 컴팩트 패널로 변경했다. 초대 입력·관리자 목록은 패널 내부 스크롤로 유지해 주문·매칭 업무 화면을 가리지 않는다.

- 관리자 운영 상태 변경은 PATCH 응답의 최신 관리자 정보를 즉시 화면 상태에 반영하도록 보정했다. 상태 선택 직후 상단 계정 문구·상태 점·선택 버튼이 함께 갱신된다.

- 구독상품 관리의 판매자 멤버십 등급 변경은 전체 목록 재조회 대신 변경된 행만 즉시 교체하도록 보정했다. 프리미엄·골드·실버 버튼은 활성 등급 색상과 마우스오버 이동·그림자 애니메이션을 제공하며, 등급 변경 후 목록 순서와 선택 위치를 유지한다.

- 판매자 멤버십 등급 변경 성공 직후 해당 판매점 히스토리를 다시 조회하도록 보정했다. 연속 변경 시 최신 이력이 최상단에 추가되고, 기존 변경 기록도 같은 판매점 행 아래에 누적 표시되는 것을 실브라우저에서 확인했다.

## 판매자 멤버십 검색·지역·카테고리 필터·정렬 (2026-08-20)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| REST 응답 | 관리자 멤버십 목록에 판매점의 `districtName`, `handledItems`를 추가 | 구현 완료 |
| 통합 검색 | 판매점명·소유자 이메일·지역·취급 품목을 하나의 검색 입력에서 찾도록 구성 | 구현 완료 |
| 선택 필터 | 목록 데이터에서 지역과 쉼표 구분 취급 품목을 추출해 전체/개별 드롭다운 필터 제공 | 구현 완료 |
| 멤버십 정렬 | 기본 순서, 프리미엄→골드→실버, 실버→골드→프리미엄 정렬 제공 | 구현 완료 |
| 기존 흐름 | 행 단위 등급 변경 시 목록 위치를 유지하고, 해당 행 아래 히스토리를 즉시 갱신·토글 | 유지 |
| 통합 검증 | 백엔드 최신 JAR 생성 시각 확인. 원격 명령 채널 `closed pipe` 및 로컬 8080 연결 불가로 프론트 lint·tsc·build, 서버 재기동, 브라우저 E2E는 대기 | 진행 대기 |


### 구독상품 관리 판매자 탐색·최고 관리자 인증 검증 (2026-08-20)

- 실제 최고 관리자 계정으로 관리자 대시보드와 구독상품 관리 탭에 정상 진입되는 것을 확인했다.
- 판매점·이메일·지역·취급 품목 통합 검색은 `강동구` 입력 시 106곳 중 강동구 판매점 10곳으로 즉시 필터링됐다.
- 지역 필터는 `강남구` 선택 시 13곳만 출력했고, 취급 카테고리 `공구` 단독 선택은 해당 품목 판매점 1곳을 출력했다.
- 멤버십 높은 순은 프리미엄 → 골드 → 실버, 낮은 순은 실버 → 프리미엄 순으로 즉시 재정렬됨을 확인했다.
- 인증 API 응답을 중첩된 사용자 객체로 잘못 처리하던 프론트엔드 오류를 바로잡아 서버가 반환한 관리자 역할을 직접 반영하도록 보정했다.
- 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`를 통과했다.


## 판매점 운영 정보·DB 권한 토글 1차 구현 (2026-08-21)

| 범위 | 구현 내용 | 상태 |
|---|---|---|
| 회원 기본 주소 보호 | `users`, 배송지, 체크아웃 주소 흐름을 변경하지 않고 판매점 전용 필드로 분리 | 완료 |
| 판매점 운영 정보 | `directions`, 시작·종료 시간, 정기 휴무, 임시 휴무를 `stores`에 추가하는 V36 작성 | 코드 완료 |
| 영업 상태 | 서버 `Asia/Seoul` 기준으로 영업중·준비중·영업종료·휴무 계산. 주문 수신·슬롯·매칭과 분리 | 완료 |
| 판매자 화면 | 마이철수에서 찾아오시는 길, 영업시간, 정기·임시 휴무 설정 | 완료 |
| 고객 화면 | 판매점 목록·상세에서 서버 계산 영업 상태와 별도 찾아오시는 길 표시 | 완료 |
| 관리자 판매점 관리 | 기존 판매점 관리 폼에서 별도 안내·영업 시간·임시 휴무 수정 | 완료 |
| DB 권한 토글 | `user_feature_permissions`, `permission_audit_logs`, 최고관리자 전체 통과·일반관리자 위임 범위·감사 이력 서비스 구현 | 코드 완료 |
| 회원관리 UI | 회원 행 아래 DB 기반 기능 토글 UI 및 Axios REST 연동 | 완료 |

검증: `StoreOperatingStatusTest` 통과, 서버 전체 테스트 결과 XML에 실패·오류 없음, 프론트엔드 `npx tsc -b`, `npm run lint`, `npm run build` 통과.

다음 통합 검증: 최신 V36을 적용한 서버 JAR 기동 후 최고관리자·권한이 제한된 일반관리자·판매자·일반사용자 역할별 API와 화면을 확인한다. 서버 재기동은 기존 작업 흐름을 방해하지 않도록 별도 승인 뒤에만 진행한다.

- V37로 기존 일반관리자 계정의 기능 권한 기본값을 비파괴 보정했다. 최고관리자 계정은 권한 행 생성 대상에서 제외한다.
- 실제 최고관리자 브라우저 검증: 고객 판매점 상세에서 `영업중` 표시, 회원관리에서 일반사용자 4개 토글·일반관리자 11개 토글, 판매자 운영 탭의 찾아오시는 길·영업시간·휴무 입력을 확인했다.
- 최신 JAR 재기동 뒤 Flyway V36·V37 적용과 API 8080 수신을 확인했다.

- `AdminFeaturePermissionInterceptor`를 `/api/admin/**`에 등록해 일반관리자의 판매점·심사·카탈로그·행사·구독·매칭·정산·고객문의·개발결제 API 접근을 최고관리자 부여형 권한 코드로 서버에서 강제한다. 최고관리자는 전체 권한을 유지한다.
- 인터셉터 적용 JAR의 첫 재기동은 Supabase 연결 풀의 일시적 대기 시간으로 실패했으나, 재시도 후 API 8080 수신을 복구했다. `./gradlew.bat test bootJar`는 통과했다.


## 2026-08-21 — 관리자 로그인 역할 동기화 경합 보정
- 증상: 최고관리자 로그인 성공 알림 뒤 `/admin`이 일반회원 권한으로 오판되거나 로그인 화면으로 전환되는 간헐 현상.
- 근본 원인: `AuthProvider.refresh()`의 초기 `getSession()` 요청이 로그인 요청보다 먼저 시작됐어도 늦게 `null`로 완료될 수 있었고, 응답 완료 시점에 동기화 순서를 새로 부여하면서 이미 확인된 최신 DB 역할을 지웠음.
- 보정: 세션 조회 **시작 시점**에 순서를 부여하고 늦게 도착한 과거 응답을 무시하도록 수정. DB 역할 확인 전 임시 `CONSUMER` 역할을 인증 상태에 넣지 않음. 인증 API 실패는 권한 없음 대신 재시도 안내로 구분.
- 검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과. 테스트 일반관리자 Supabase 토큰으로 `GET /api/auth/me`가 `role=ADMIN`을 정상 반환함을 직접 확인.
- 잔여 확인: 실제 최고관리자 브라우저 로그인 후 `/admin` E2E 확인 필요.


## 2026-08-21 — `/auth/login?next=/admin` 직접 로그인 이동 보정
- 메인 화면 로그인은 공개 경로로 이동해 정상처럼 보였지만, 직접 관리자 로그인은 `refresh()` 직후 React 역할 상태가 아직 반영되기 전에 `/admin` 라우트 가드가 실행되어 로그인 화면으로 되돌아갈 수 있었음.
- `refresh()`가 DB 역할 동기화 결과를 반환하도록 확장하고, 이메일 로그인·소셜 콜백 모두 인증 사용자 상태가 React에 반영된 뒤에만 `next` 경로로 이동하도록 보정.
- 검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과.

## 2026-08-21 — 실제 일반관리자 등록 및 인사 권한 관리

- `admin@chulsooya.dev`를 Supabase Auth 실제 로그인 계정으로 등록하고, 기존 시드 일반관리자 앱 DB 레코드와 연결했다.
- Flyway V38: 최고관리자의 일반관리자 부여·해지 이력을 `administrator_role_audit_logs`에 기록한다.
- Flyway V39: 기존 `role=ADMIN`, `admin_level=NONE` 시드 관리자를 `STANDARD`로 보정한다.
- 최고관리자 전용 일반관리자 부여·해지 API를 추가했다. 해지 시 일반회원 전환, 모든 세부 기능 권한 OFF, 역할·권한 감사 이력을 함께 기록한다.
- 회원관리 행 상세에 최고관리자 전용 일반관리자 부여·해지 UI를 추가했다.
- 일반관리자는 본인 권한 토글만 조회할 수 있고, 허용받지 않은 관리자 메뉴·빠른 실행 버튼·검색 결과는 숨긴다. 서버 API 인가도 기존 권한 인터셉터로 유지한다.
- 검증: 백엔드 `gradlew.bat test bootJar`, 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build` 통과. `admin@chulsooya.dev` 직접 로그인 뒤 권한 미부여 상태에서 운영 대시보드만 표시되는 것을 확인했다.

## 기획·설계 문서 정합화 (2026-08-21)

- `docs/PLANNING_ALIGNMENT_REGISTER.md`를 현재 기획서 대조·충돌 해소 기준으로 추가했다.
- 통합 개발 마스터 가이드, 고도화 실행 계획서, 핵심 매칭·패널티 엔진, 대량 주문 배분 설계, 초기 개발 작업 지시서를 현재 주문·결제·멤버십·기술 구조 기준으로 정합화했다.
- 주문 결제 순서는 `주문 요청 → 5분 매칭 → 낙찰 → 2분 판매자 확인 → PAYMENT_PENDING → 개발 승인/최종 PG`로 고정했다.
- 멤버십 공개는 프리미엄 0~30초, 프리미엄·골드 30~60초, 전체 적격 판매자 60초 이후으로 고정했다.
- 실제 PG 결제·취소·환불 웹훅·지급대행/에스크로, NTS 실제 진위확인, 외부 푸시는 최종 통합 단계까지 보류한다.
- PG 이전 우선순위는 역할·인증 E2E, 판매자 구독 해지, 매칭·슬롯·마감 회귀, 인앱 알림·운영 예외, NTS 어댑터·문서, 오피스·수리 확장, 출시 준비 순서다.

## 관리자 탭 복원 정책 보정 (2026-08-21)

관리자 업무 중 새로고침·메인 이동 후 `/admin` 재진입은 마지막 탭을 `sessionStorage`에서 복원한다. 로그아웃, 세션 만료, 명시적 권한 회수로 현재 탭 접근이 불가해진 경우에는 저장된 관리자 탭을 삭제해 다음 로그인·진입이 운영 대시보드 홈에서 시작하도록 보정했다. 관련 파일은 `client/src/lib/admin-view.ts`, `client/src/app/AuthProvider.tsx`, `client/src/features/admin/AdminOverviewPage.tsx`이다.

검증: `npm run lint`(기존 Hook 의존성 경고 2건, 오류 없음), `npx tsc -b`, `npm run build` 통과.

## 관리자 접근 감사·반복 경보 (V40 완료, 2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 감사 로그 | `/api/admin/**`의 인증 없음·관리자 역할 없음·세부 기능 권한 없음 접근을 `admin_access_audit_logs`에 기록 | 완료 |
| 패턴 탐지 | 10분 내 동일 IP 5회 반복, 동일 IP의 4개 이상 관리 경로 탐색, 동일 계정의 3개 이상 IP 분산 접근을 감지 | 완료 |
| 동시성 | PostgreSQL 트랜잭션 자문 잠금으로 동일 IP·계정의 동시 거부 요청에서도 경보 집계가 누락되지 않게 보정 | 완료 |
| 관리자 경보 | 탐지 경보는 `customer_notifications`에 모든 `ADMIN` 계정별로 저장되어 기존 알림 종과 연결 | 완료 |
| 관리자 탭 | `보안 운영 → 보안 감사 · 경보` 탭에서 최근 경보 20건·거부 이력 100건을 확인, 상단 경보 버튼으로 바로 이동 | 완료 |
| 권한 | 최고관리자는 항상 접근 가능, 일반관리자는 `ADMIN_VIEW_SECURITY_AUDIT` 토글 ON일 때만 메뉴·API 접근 가능 | 완료 |
| 이메일 | 외부 이메일 발송 어댑터 미연결. 현재 DB 저장형 관리자 알림으로 즉시 전파하며, 이후 이메일 어댑터가 같은 이벤트를 구독하도록 확장 | 보류 |
| DB | Supabase Flyway V40 (`admin_access_audit_logs`, `admin_access_alert_logs`) 적용 완료 | 완료 |

### 검증

| 검증 | 결과 |
| :--- | :--- |
| 반복 접근 거부 | 테스트 판매자 계정의 `/api/admin/overview` 5회 거부 요청이 모두 HTTP 403 | 통과 |
| 관리자 알림 저장 | 일반관리자 고객센터 알림 조회에서 `SECURITY_ALERT` 1건 확인 | 통과 |
| 로그아웃 관리자 접근 | `/api/admin/overview` 무인증 요청 HTTP 401 확인 | 통과 |
| 서버 | `gradlew.bat test bootJar` 통과, 최신 JAR 재기동 및 V40 적용 확인 | 통과 |
| 클라이언트 | `npm run lint`, `npx tsc -b`, `npm run build` 통과 | 통과 |

> 테스트 판매자 계정의 반복 거부 요청으로 생성된 보안 경보·감사 이력은 감사 목적상 삭제하지 않고 유지한다.


## 권한 기반 관리자 알림 종·업무 딥링크 (2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 관리자 알림 종 | 관리자 대시보드 상단에 기존 `HeaderNotifications`를 재사용해 미확인 알림 레드닷·목록을 표시 | 완료 |
| 읽음 처리 | 알림 항목 클릭 시 DB `read_at`을 기록하고, 해당 항목은 즉시 레드닷·목록에서 제외 | 완료 |
| 딥링크 | 알림의 `targetPath`가 `/admin?view=...`이면 권한이 있는 관리 탭을 직접 열고, 외부에서 진입해도 초기 탭으로 반영 | 완료 |
| 최고관리자 | 모든 관리자 CRUD 알림과 최고관리자 전용 계정 초대·일반관리자 부여·해지·운영 상태 변경 알림 수신 | 완료 |
| 일반관리자 | 보안 경보는 기본 수신·조회하며, 그 외 업무 알림은 해당 DB 기능 토글이 ON인 경우에만 저장·수신 | 완료 |
| 고객 문의 | 신규 고객 문의는 `ADMIN_MANAGE_SUPPORT` 권한 보유 일반관리자와 최고관리자에게만 저장되고 고객 지원 탭으로 이동 | 완료 |
| CRUD 알림 | 관리자 API의 성공한 변경 요청을 권한 코드와 연결해 판매점·상품·행사·쿠폰·구독·주문·정산·클레임·고객 지원 등 해당 탭 알림으로 저장 | 완료 |
| 레드닷 호환 | 서버가 `readAt=null`을 JSON에서 생략하는 경우도 미확인으로 판정하도록 공통 알림 컴포넌트를 보정 | 완료 |

### 검증

| 검증 | 결과 |
| :--- | :--- |
| 일반관리자 보안 감사 | `admin@chulsooya.dev` 실제 로그인 후 `GET /api/admin/security-audits` HTTP 200 | 통과 |
| 보안 알림 읽음 | 실제 `SECURITY_ALERT` 알림 ID 85·90을 읽음 API로 처리하고 `readAt` 저장 확인 | 통과 |
| 권한 라우팅 단위 테스트 | 최고관리자 항상 수신, 일반관리자 기능 토글 ON일 때만 수신 규칙 테스트 추가·통과 | 통과 |
| 전체 빌드 | `gradlew.bat test bootJar`, `npm run lint`, `npx tsc -b`, `npm run build` 통과 | 통과 |

> 테스트에서 만든 보안 감사 이력·경보와 읽음 상태는 감사 데이터로 유지한다. 프론트엔드 lint에는 기존 `AdminOverviewPage.tsx` Hook 의존성 경고 2건만 남아 있으며 오류는 없다.


## 관리자 고객 문의 알림 딥링크 보정 (2026-08-22)

- 관리자 계정이 상점 헤더 또는 관리자 대시보드 알림 종에서 `INQUIRY_SUBMITTED` 알림을 선택하면, 기존 `target_path` 값과 무관하게 `/admin?view=support`로 이동하도록 보정했다.
- 새 고객 문의는 이미 고객 지원 권한 기반으로 `/admin?view=support`를 저장하며, V41 마이그레이션으로 기존 관리자 수신 `INQUIRY_SUBMITTED` 데이터도 동일 경로로 정규화했다.
- `V41__normalize_admin_inquiry_notification_paths.sql` 적용 완료. Flyway 로그에서 스키마 버전 v41 확인.
- `gradlew.bat test bootJar`, `npm run lint`, `npx tsc -b`, `npm run build` 통과. 기존 관리자 Hook 의존성 경고 2건만 유지.


## 이메일 비밀번호 재설정·로그인 안내 보정 (2026-08-22)

| 범위 | 반영 내용 | 상태 |
| :--- | :--- | :--- |
| 비밀번호 찾기 | `/auth/forgot-password`에서 이메일 로그인 계정에 Supabase 재설정 안내 메일 발송 | 완료 |
| 새 비밀번호 설정 | 메일의 기존 `/auth/callback?next=/auth/reset-password` 허용 콜백을 재사용해 `/auth/reset-password`에서 새 비밀번호 저장 후 재로그인 | 완료 |
| 소셜 로그인 안내 | 비밀번호 찾기 화면에 Google·카카오 로그인 비밀번호는 각 플랫폼에서 관리한다는 안내 표시 | 완료 |
| 로그인 상태 유지 | `로그인 상태 유지 (개인 기기에서만 사용해 주세요)`로 보정하고 도움말에 최대 7일·공용 PC 주의 표시 | 완료 |
| 완료 안내 | 재설정 뒤 로그인 화면에서 새 비밀번호 로그인 안내 표시 | 완료 |

검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과. 기존 `AdminOverviewPage.tsx` Hook 의존성 경고 2건만 유지.


## 2026-08-22 — 상용 준비 인증·관리자 운영·보안·다크모드 보완

| 범위 | 구현·보정 내용 | 상태 |
| :--- | :--- | :--- |
| 역할·인증 회귀 | 일반관리자·판매자·일반회원의 실제 Supabase 로그인과 로컬 REST 권한 경계를 검증했다. 판매자는 장바구니·주문·판매자 API를 사용하고 관리자 API는 403으로 차단되며, 일반회원은 판매자·관리자 API 모두 차단된다. | 완료 |
| 관리자 직접 진입 | 로그아웃 상태의 `/admin` 요청은 로그인 화면의 `next=/admin`으로 전환되고, 로그인 후 DB 역할 동기화가 완료되어야 관리자 화면으로 이동한다. | 완료 |
| 이메일 비밀번호 재설정 | `/auth/forgot-password`에서 이메일 재설정 링크를 요청하고, 기존 `/auth/callback`을 거쳐 `/auth/reset-password`에서 새 비밀번호를 설정한다. Google·Kakao 로그인 비밀번호는 각 플랫폼에서 관리한다는 안내를 제공한다. | 완료 |
| 재설정 발송 한도 안내 | Supabase 기본 메일 발송 한도 초과 응답을 사용자 친화적 한국어 안내로 변환했다. 기본 발송 제한 때문에 실제 테스트 중 발송 거절된 경우는 외부 SMTP 연결 전까지 우회하지 않는다. | 완료 |
| 관리자 접근 감사 | V40 `admin_access_audit_logs`, `admin_access_alert_logs`로 `/api/admin/**`의 401·403을 기록하고, 반복·경로 탐색·분산 IP 패턴을 감지한다. | 완료 |
| 보안 경보 | 동일 IP 10분 5회, 동일 IP 4개 이상 관리 경로, 동일 계정 3개 이상 IP 패턴을 감지한다. 동일 대상·패턴의 경보는 30분 동안 중복 억제한다. | 완료 |
| 보안 감사 탭 | 관리자 대시보드 `보안 운영 → 보안 감사 · 경보`에서 최근 접근 거부 이력과 경보를 확인한다. 보안 경보는 일반관리자도 기본 수신·조회한다. | 완료 |
| 권한 기반 관리자 알림 | 최고관리자는 관리자 업무 CRUD·고객 문의·계정/권한 변경·보안 경보를 수신한다. 일반관리자는 보안 경보와 DB 기능 토글이 ON인 업무 알림만 받는다. | 완료 |
| 알림 종·딥링크 | 미확인 알림은 레드닷으로 표시되며, 클릭하면 DB `read_at`을 저장하고 해당 관리자 탭으로 이동한다. 관리자 고객 문의 알림은 개인 고객센터가 아닌 `/admin?view=support`로 고정했다. V41은 기존 관리자 고객 문의 알림의 경로도 정규화한다. | 완료 |
| 장바구니 UX | 홈·카탈로그·상품 상세의 담기 성공을 상품명 기반 녹색 안내로 통일하고 헤더 장바구니 수량 갱신 이벤트를 연결했다. 판매자도 일반 구매자 기능을 사용할 수 있도록 shopping route guard를 유지한다. | 완료 |
| 상세 반응형 | 상품 상세 수량 조절 영역의 모바일 터치 크기를 보정하고, 주문 상세 표·주소·금액 행의 모바일 가로 넘침을 방지했다. | 완료 |
| 전역 다크모드 | 사용자 앱 셸의 밝은 레거시 표면·텍스트·폼을 공통 다크 테마와 연결했다. 판매점 상세, 판매점 찾기, 주문 상세, 알림 종을 포함한다. | 완료 |
| 카테고리 메가메뉴 | 3단 분류의 밝은·다크 표면과 연한 보라 테두리형 호버를 통일했다. 다크모드 소분류 호버는 전용 CSS로 제어해 밝은 배경이 침범하지 않도록 했다. | 완료 |
| 헤더 로고 | 공통 철수야 로고를 둥근 카드로 클리핑하고, 다크모드에서는 원본 흰 바탕이 옅은 회청색 표면과 섞이도록 처리했다. 밝은 모드는 유지한다. | 완료 |

### 최신 검증

| 검증 | 결과 |
| :--- | :--- |
| 역할별 실제 REST E2E | 일반관리자·판매자·일반회원 역할 동기화와 200/401/403 권한 경계 확인 |
| 보안 경보 E2E | 판매자 반복 관리자 접근 403 차단, `SECURITY_ALERT` 저장·일반관리자 알림 읽음 처리 확인 |
| 관리자 알림 수신 규칙 | 최고관리자 전체 수신·일반관리자 토글 기반 수신 단위 테스트 통과 |
| 백엔드 | `gradlew.bat test bootJar` 통과, V40·V41 포함 최신 JAR로 재기동 |
| 프론트엔드 | `npm run lint`, `npx tsc -b`, `npm run build` 통과. `AdminOverviewPage.tsx`의 기존 Hook 의존성 경고 2건만 유지 |

### 현재 운영·검증 유의사항

- 실제 관리자 이메일 경보는 외부 SMTP·발송 어댑터를 연결하기 전까지 DB 알림 종과 보안 감사 탭으로 대체한다.
- 비밀번호 재설정 메일은 Supabase 기본 발송 한도에 영향을 받는다. 상용 발송은 SMTP 설정 후 실제 수신 E2E를 다시 수행한다.
- 최고관리자 실제 브라우저 로그인과 일반관리자의 허용 메뉴 시각 확인은 연결 브라우저 복구 후 재검증한다.
- 다음 P0 구현은 판매자 구독 본인 해지(실버 전환·이력·관리자 연동)다.

## 2026-08-22 — 관리자 대시보드 다크모드 시안성·호버 통일

관리자 대시보드 공통 `admin-theme`에 다크 표면·텍스트·입력·선택·표 구분선 보정을 확장했다. 모든 관리자 탭에서 `bg-white`, `bg-slate-50`, `bg-slate-100`, `bg-brand-50` 계열의 레거시 표면은 슬레이트·보라 계열 표면으로 전환된다. 상품·회원 탭의 반투명 카드와 선택 행도 전용 규칙으로 보정했다.

관리자 사이드 메뉴, 테이블 행, 중립 버튼·링크의 hover는 사용자 3단 카테고리와 같은 다크 대응 규칙을 사용한다. 밝은 모드에서는 연한 보라 배경·얇은 보라 테두리·진한 보라 글자이며, 다크모드에서는 짙은 보라 배경·보라 테두리·밝은 보라 글자로 표시된다. 위험·성공 동작의 빨강·초록 hover는 상태 의미를 유지하기 위해 변경하지 않았다.

검증: `npm run lint`, `npx tsc -b`, `npm run build` 통과. 기존 `AdminOverviewPage.tsx` Hook 의존성 경고 2건만 유지한다. 연결된 브라우저 확장이 HTTP 504로 응답해 실제 탭별 시각 E2E는 미실행 상태다.

## 2026-08-22 — Storage 배너 테마의 행사 편집 드롭다운 연결

`EventAssetManagementPanel`에서 배너 테마를 Storage에 저장·활성화하거나 편집·파일 교체·삭제하면 `chulsooya:event-assets-updated` 이벤트를 발행한다. `EventCampaignManagementPanel`은 이 이벤트를 수신해 자산 목록을 즉시 다시 불러온다.

새 행사 등록·수정의 기존 `배경 테마` 드롭다운은 기본 테마와 `Storage 업로드 배너 테마` 그룹을 함께 표시한다. 활성 업로드 테마를 선택·저장하면 `themeAssetId`가 행사에 저장되고, 편집 미리보기와 사용자 메인 히어로는 `themeImageUrl`을 우선 사용한다. 기본 테마를 선택하면 `themeAssetId`를 해제하고 기존 색상 테마 흐름을 그대로 사용한다.

자산 편집의 `자산 목록 순서`는 관리자 자산 카드 정렬 전용이며, 메인 히어로 노출 순서는 행사 등록의 `메인 배너 노출 순서 (낮은 숫자 먼저)`로 분리했다. 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build` 통과.

## 2026-08-22 — 행사 배너 테마 삭제 운영 흐름 확정

행사 배너 테마의 삭제 보호 규칙을 확정했다. 행사에 `themeAssetId` 또는 `iconAssetId`로 연결된 자산은 서버가 HTTP 409으로 삭제를 차단한다. 단순 `비활성화`는 메인 히어로 노출만 중단하며 행사 연결은 유지한다.

관리자는 행사를 삭제하거나, 행사 수정에서 기본/다른 Storage 테마로 교체해 기존 `themeAssetId` 연결을 해제한 뒤에만 Storage 배너 테마를 삭제할 수 있다. 삭제 성공 시 DB 자산 레코드, Supabase Storage 파일, 새 행사 등록·수정의 `Storage 업로드 배너 테마` 드롭다운, 상단 `등록 배너 테마 관리` 삭제 선택 목록이 함께 갱신된다. 기본 배경 테마 목록은 삭제 대상이 아니다.


---

## 2026-08-22 — 기존 행사 배너 테마 Storage·DB 운영 통합

| 항목 | 완료 내용 |
|---|---|
| 기존 이미지 자산 전수 | 기존 GPT 생성 배너 테마 20개가 Supabase Storage `event-assets/themes/`에 존재함을 확인했다. 개발 폴더 의존은 없다. |
| DB 자산 이관 | Flyway V42로 20개 Storage 테마를 `event_assets`에 `THEME`·`AI_GENERATED`·활성 자산으로 백필했다. Storage 객체를 재업로드하지 않고 기존 공개 URL·키를 그대로 등록했다. |
| 기존 행사 연결 | 활성 행사 7건의 `theme_asset_id`를 기존 테마 키와 일치하는 자산 ID로 연결했다. 공개 히어로 API가 7건 모두 `themeAssetId`와 `themeImageUrl`을 반환하는 것을 확인했다. |
| 관리자 운영 | 새 행사 등록·수정의 `Storage 업로드 배너 테마` 그룹, 미리보기, 등록 배너 테마 선택·삭제 관리가 같은 `event_assets` 목록을 사용한다. 행사에 연결된 테마는 서버가 삭제를 차단한다. |
| 코드 정리 | `campaignPresentation.tsx`의 배너 테마 이미지 하드코드 목록과 URL 폴백을 제거했다. 메인 히어로와 행사 편집 미리보기는 DB가 반환한 Storage URL을 사용한다. 기본 색상 테마는 코드에서 유지한다. |
| 검증 | 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`, 백엔드 `gradlew.bat test bootJar` 통과. 최신 JAR 재기동 뒤 V42 적용 및 관리자·공개 API를 확인했다. |

**운영 규칙**: Storage 테마는 행사 삭제 또는 다른 테마로 교체해 연결을 해제한 뒤에만 삭제한다. 단순 비활성화는 행사 연결을 유지하므로 테마 삭제를 허용하지 않는다.


## 2026-08-22 — 행사 자산 편집 단순화

- `배너 테마·아이콘 자산 관리`은 Storage 자산 업로드·편집·활성/비활성·삭제 전용 화면으로 정리했다.
- 기존 행사에 자산을 바로 적용하던 `적용할 기존 행사` 선택과 카드 `행사에 적용` 버튼은 새 행사 등록·수정의 직접 테마/아이콘 선택 기능과 중복돼 제거했다.
- 새 이미지 등록, 등록 배너 테마, 등록 배너 아이콘을 각각 접고 펼치는 섹션으로 구성했다. 자산 관리의 밀도를 낮추고, 신규/기존 행사 모두 행사 등록·수정 화면에서 자산을 선택하는 단일 흐름으로 통일했다.
- 등록 배너 테마 섹션에는 Storage 테마 선택·삭제 관리를 유지하며, 행사 연결 중인 자산은 서버에서 삭제를 차단한다.
- 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build` 통과. 실제 My Browser 시각 확인은 브라우저 확장 HTTP 504로 보류했다.

## 관리자 세션 복원·업무 알림 딥링크 정합성 보정 (2026-08-22)

| 범위 | 구현·점검 결과 | 상태 |
| :--- | :--- | :--- |
| 관리자 직접 URL 세션 | 기본 30분과 로그인 상태 유지 7일의 만료 정책은 유지하되, Supabase 세션 저장소를 `localStorage`로 통일해 새 탭·직접 `/admin` 진입에서도 세션을 복원하도록 보정 | 완료 |
| 보안 경보 딥링크 | 서버가 저장하던 `/admin?view=security-audit`를 실제 관리자 탭 키인 `/admin?view=securityAudit`로 정규화 | 완료 |
| 기존 보안 알림 | V43에서 기존 `SECURITY_ALERT` 대상 경로를 정규화하고, 프론트엔드는 이전 `security-audit` 경로도 호환해 보안 감사 탭으로 변환 | 완료 |
| 전수 대조 | 고객 문의·회원·매장·판매자 신청·카탈로그·행사·쿠폰·구독·주문·정산·개발 결제·보안 경보의 관리자 대상 탭 키를 `AdminView` 목록과 대조. 보안 경보의 하이픈 표기만 불일치였음 | 완료 |
| 검증 | 프론트엔드 lint·TypeScript·Vite build 통과, 서버 `gradlew.bat test bootJar` 통과, 최신 JAR 재기동 및 Flyway V43 적용 확인 | 완료 |

사용자 확인 기준으로 `/admin` 세션 복원은 정상이다. 브라우저 제어 세션에는 관리자 로그인 상태가 남아 있지 않아 알림 클릭의 자동 시각 검증은 제한됐으며, 실제 관리자 화면에서 보안 경보 클릭 시 `보안 감사 · 경보` 탭이 열리는지 최종 확인이 필요하다.

## 행사 자산 Storage 업로드 운영 검증·정책 정렬 (2026-08-22)

- 관리자 대시보드 `행사 · 이벤트 관리 → 새 이미지 등록`만 사용해 `치이카와 특별전` 배너 테마(1,920 × 640px PNG)를 실제 Storage와 `event_assets`에 등록했다. 등록 배너 테마는 20개에서 21개로 증가했고, 새 행사 등록의 `배경 테마` 드롭다운에 자동 반영됨을 확인했다.
- `client/src/api/endpoints.ts`: 행사 자산 등록·파일 교체 요청을 Axios `postForm`으로 통일했다. 공통 Axios JSON 기본 헤더를 제거해 FormData가 브라우저 multipart 경계값을 정상 생성하도록 보정했다.
- `server/src/main/java/com/chulsooya/server/domain/admin/EventAssetStorage.java`: Storage 업로드 실패 시 타입·파일명·응답 사유를 안전하게 경고 로그로 남기도록 보정했다.
- V44: `event-assets` 버킷의 허용 MIME 형식을 `image/jpeg`, `image/png`, `image/webp`로 정렬했다.
- V45: `event-assets` 버킷과 Spring multipart 업로드 제한을 8MB로 통일했다. 관리자 화면의 JPG·PNG·WebP·최대 8MB 안내와 실제 정책이 일치한다.
- 검증: 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build`; 서버 `gradlew.bat test bootJar` 통과. V44·V45 Flyway 적용 및 최신 JAR 재기동 완료.

### 관리자 상품 삭제 보호·다크모드 버튼 보정 (완료)
- 상품·카테고리 목록 행에 `삭제` 버튼 복구: 클릭 뒤 확인 팝업에서 승인해야 삭제 API를 호출하도록 구성
- `DELETE /api/admin/products/{id}`는 참조 없는 상품만 실제 삭제: 주문 이력 또는 장바구니 참조가 있으면 삭제를 차단하고 비활성화 사용을 안내
- 가격 옵션은 기존 DB cascade로 함께 정리되며, 상품만 제거하므로 카테고리 자체와 주문 이력은 보존
- 상품 수정·비활성화·활성화·삭제 버튼의 다크모드 테두리·표면·문자·호버 대비 통일
- `AdminProductDeletionTest`: 참조 없는 삭제 성공, 주문 이력 차단, 장바구니 차단 시나리오 추가
- 프론트엔드 lint·TypeScript·운영 빌드 및 서버 test·bootJar 통과, 최신 JAR로 서버 재기동

### 비활성 상품 장바구니·주문 예외 처리 (완료)
- `CartItemResponse`에 상품 활성 상태를 포함해 장바구니·주문 요청 화면이 재고 없는 상품을 판정하도록 보정
- 비활성 상품은 장바구니에서 흐림 처리와 `재고 없음` 배지로 표시하고, 수량 변경은 UI·서버 모두에서 차단하며 개별 삭제는 유지
- 재고 없음 상품이 있으면 장바구니와 주문 요청 화면에서 안내를 표시하고, 주문 요청 버튼을 비활성화해 장바구니 정리를 유도
- 서버 `OrderService`의 기존 주문 생성 단계 활성 상태 검증을 유지해 직접 API 호출도 차단
- `CartServiceInactiveProductTest`: 비활성 상태 응답 및 비활성 상품 수량 변경 서버 차단 시나리오 검증
- 서버 test·bootJar 및 프론트 lint·TypeScript·운영 빌드 통과, 최신 JAR 재기동

## 카카오 주소·장소명 통합 검색 (완료)

- 기존 카카오 우편번호 주소 검색은 유지하고, 같은 `주소·장소명 찾기` 팝업에 `주소 검색`과 `장소명 검색` 탭을 추가했다.
- 장소명 검색은 기존 카카오 지도 JavaScript SDK의 `services.Places().keywordSearch()`를 재사용한다. 별도 REST API 키를 브라우저나 소스에 추가하지 않는다.
- 장소 결과를 선택하면 도로명 주소(없으면 지번 주소)를 기존 배송지·주문 주소 선택 흐름으로 전달한다. 기존 서울시 구 단위 검증과 주문 지역 확인은 그대로 수행한다.
- 장소명 검색 결과에는 상호명·도로명 주소·지번 주소를 표시하고, 도로명 정보가 없는 결과는 지번 적용 사실을 안내한다.
- 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build` 통과. 기존 `AdminOverviewPage.tsx` Hook 의존성 경고 2건과 번들 크기 경고만 유지.

## 서비스 점검·연결 오류 화면 통일 (완료)

서버 연결 실패, 응답 지연, 5xx 서버 오류는 원문 코드·문자 깨짐 대신 공통 `ErrorView`의 서비스 안내 카드로 표시한다. 연결 실패는 `서버 연결을 확인하고 있습니다`, 응답 지연·5xx는 `서비스를 준비하고 있습니다`, 일반 요청 실패는 재시도 안내로 분류했다. 각 카드는 상황별 SVG 아이콘, 밝은·다크모드 표면, 명확한 다시 시도 버튼을 제공하며, 사용자에게 내부 오류 코드나 인코딩 깨진 문구를 노출하지 않는다. Axios의 네트워크·시간 초과·알 수 없는 오류 메시지도 자연스러운 한글로 정규화했다. 프론트엔드 `npm run lint`, `npx tsc -b`, `npm run build` 통과. 기존 `AdminOverviewPage.tsx` Hook 의존성 경고 2건과 번들 크기 경고만 유지.

## 최고관리자 전면 점검 모드 (완료)

V46 `platform_maintenance_mode` 단일 상태 테이블과 `PlatformMaintenanceModeService`를 추가했다. 최고관리자만 `/api/admin/maintenance`에서 점검을 시작·해제할 수 있으며, 상태는 `/api/maintenance/status`로 익명 조회 가능하다. 점검 활성화 시 `MaintenanceModeInterceptor`가 일반 `/api/**` 요청을 `503 MAINTENANCE_ACTIVE`로 차단하고, 최고관리자의 `/api/admin/**` 요청 및 상태 조회만 통과시킨다. 일반관리자는 점검 중 관리자 대시보드도 접근할 수 없다.

프론트는 `MaintenanceGate`로 메인·직접 URL·인증 등 모든 일반 라우트를 전면 `서비스 점검 중입니다` 화면으로 전환한다. 최고관리자는 `/admin` 및 `/auth/login?next=/admin` 복구 흐름만 유지한다. 관리자 대시보드 `보안 운영`에 최고관리자 전용 `서비스 점검 모드` 탭을 추가했고, 시작·해제 모두 2단계 확인으로 처리한다. 서버 점검 제어 서비스·인터셉터 단위 테스트 통과, 서버 `test bootJar`와 프론트 `lint`, `tsc`, `build` 통과. V46 적용 후 공개 상태 API가 `enabled:false`를 반환하는 것까지 확인했다. 실제 점검 ON/OFF는 서비스 전체 접근에 영향을 주므로 사용자 확인 전에는 실행하지 않았다.

## 점검 단계·재사용 공지 운영 확장 (완료)

V47에서 `platform_maintenance_mode`에 `NORMAL`·`PREPARING`·`MAINTENANCE` 단계와 점검 예정 시작·종료 시간을 추가하고, 재사용 가능한 `maintenance_notices` 공지 자산 테이블을 신설했다. 공지는 제목·내용·팝업 표시 여부·표시 기간을 저장하며, 최고관리자가 생성·수정·활성화·비활성화·삭제할 수 있다. 활성화는 한 건만 유지해 같은 공지를 상단 안내와 메인 팝업에 공통 재사용한다.

`PREPARING`에서는 일반 서비스는 유지하면서 공통 헤더에 점검 예정 시간·공지 제목을 표시하고, 메인 화면은 로그인 여부와 무관하게 공지 팝업을 표시한다. 팝업의 `오늘 하루 보지 않기`는 공지 ID별 browser localStorage에 24시간 만료로 저장한다. `MAINTENANCE`에서만 기존 전면 점검 게이트·서버 503 차단이 동작한다. 최고관리자 전용 `서비스 점검 모드` 탭은 점검 단계·예정 시간 제어와 공지 라이브러리 CRUD·활성화·삭제 2단계 확인을 제공한다.

점검 단계·공지 활성화 단위 테스트, 서버 `test bootJar`, 프론트 `lint`, `tsc`, `build` 통과. V47 Flyway 적용과 공개 상태 API의 `NORMAL` 응답을 확인했다.


## 서비스 점검 공지·메인 팝업 광고 분리 (V48 완료, 2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 서비스 점검 | `NORMAL`은 전면 차단을 실제 해제해 정상 운영으로 복귀하고, `PREPARING`은 서비스·일반 API를 차단하지 않은 채 상단 점검 공지만 표시하며, `MAINTENANCE`만 일반 API 503 및 전면 점검 화면을 사용한다. | 완료 |
| 점검 공지 | 기존 `maintenance_notices`는 점검 준비 단계의 상단 공지 CRUD·활성화 전용으로 유지했다. 레거시 `popup_enabled` DB 열은 비파괴 호환을 위해 남기되, 프론트 표시 흐름에서는 사용하지 않는다. | 완료 |
| 팝업 광고 DB | Flyway V48 `popup_notices`를 추가했다. 제목·내용·활성 상태·선택 표시 기간·수정 관리자·생성/수정 시각을 저장하며 활성 행은 하나만 허용한다. | 적용 완료 |
| 팝업 광고 API | 공개 `GET /api/notices/popup`과 최고관리자 전용 목록·생성·수정·활성화/비활성화·삭제 REST API를 추가했다. 활성화 시 기존 활성 공지는 자동 비활성화한다. | 완료 |
| 권한·알림 | 팝업 광고 관리는 DB의 최고관리자 상태를 서버에서 재검증한다. 변경 시 최고관리자 저장형 알림과 `/admin?view=popupAds` 딥링크를 기록한다. | 완료 |
| 메인 표시 | 홈 화면에서만 독립 팝업을 표시하며, 팝업 ID별 localStorage 24시간 다시 보지 않기를 제공한다. 서비스 점검 상단 배너와 팝업 광고는 더 이상 공유하지 않는다. | 완료 |
| 관리자 탐색 | `홍보 · 콘텐츠 → 메인 팝업 광고`와 `서비스 운영 → 서비스 점검 모드`를 독립 그룹으로 배치했다. 두 탭은 일반관리자에게 노출·접근되지 않는다. | 완료 |
| 응답 계약 | `ApiResponse`의 null `data`도 JSON에서 생략하지 않도록 보정했다. 활성 팝업이 없으면 공개 API는 `{\"data\":null}`을 반환한다. | 완료 |

### V48 검증

| 검증 | 결과 |
| :--- | :--- |
| `cd server && gradlew.bat test bootJar` | 통과. `PopupNoticeServiceTest`의 단일 활성화·최고관리자 제한·공개 기간 필터를 포함한다. |
| `cd client && npm run lint && npx tsc -b && npm run build` | 통과. 오류 0건. 기존 `MaintenanceManagementPanel`, `AdminOverviewPage` Hook 의존성 경고 2건만 유지된다. |
| 최신 JAR 재기동 | 완료. V48 Flyway 적용 후 `localhost:8080`에서 실행 중이다. |
| 공개 API | `GET /api/maintenance/status` HTTP 200, `enabled:false`, `phase:NORMAL` 확인. `GET /api/notices/popup` HTTP 200, 활성 팝업 없음에 따른 `{\"data\":null}` 확인. |
| 시각 E2E | 자동 브라우저 연결 불안정으로 이번 변경의 화면 상호작용 E2E는 수행하지 못했다. 컴파일·단위 테스트·실행 API 검증으로 대체했다. |


## 고객센터 공지 탭·점검 공지 연동 (V49 완료, 2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 고객센터 공지 탭 | 고객센터 `/support`의 기본 탭으로 `공지사항`을 추가했다. 로그인 여부와 무관하게 일반 공지와 활성 점검 공지를 함께 읽는다. | 완료 |
| 점검 공지 연동 | 활성·표시 기간 유효한 `maintenance_notices`를 고객센터 공지 목록에 `MAINTENANCE` 출처로 읽기 전용 노출한다. 점검 공지의 생성·수정·활성화는 기존 서비스 점검 탭이 유일하다. | 완료 |
| 일반 공지 DB | Flyway V49 `customer_notices`에 제목·내용·활성 상태·선택 표시 기간·작성/수정 관리자·시각을 저장한다. 여러 일반 공지는 동시에 활성화할 수 있다. | 적용 완료 |
| 일반 공지 CRUD | 최고관리자 및 `ADMIN_MANAGE_CUSTOMER_NOTICES` DB 권한 토글을 받은 일반관리자만 일반 고객센터 공지를 생성·수정·활성화·비활성화·삭제할 수 있다. 삭제는 관리자 UI에서 2단계 확인을 사용한다. | 완료 |
| 관리자 메뉴 | `고객 지원 → 고객센터 공지` 탭을 추가했다. 권한이 없는 일반관리자에게는 메뉴·직접 탭 접근 모두 차단된다. | 완료 |
| 업무 알림 | 일반 공지 변경은 기존 관리자 기능 권한 인터셉터를 통해 권한 보유자에게 저장형 업무 알림으로 기록되고 `/admin?view=customerNotices`로 연결된다. | 완료 |
| 점검 시간 보정 | 서비스 점검 관리자 화면의 `datetime-local` 변환을 브라우저 로컬 시간 기준으로 변경해 UTC 문자열을 그대로 보여주던 시간대 오차를 보정했다. | 완료 |

### V49 검증

| 검증 | 결과 |
| :--- | :--- |
| TDD | 구현 전 `CustomerNoticeServiceTest`는 누락된 도메인 타입으로 컴파일 실패했고, 구현 후 전체 `gradlew.bat test`가 통과했다. |
| 프론트 | `npm run lint && npx tsc -b && npm run build` 통과. 오류 0건, 기존 Hook 의존성 경고 2건만 유지된다. |
| 서버 적용 | 최신 JAR 재기동 및 V49 Flyway 적용 완료. |
| 공개 API | `GET /api/support/notices` HTTP 200 확인. 현재 활성 상단 점검 공지 제목·내용·기간이 `source: MAINTENANCE`로 반환된다. |


### V49 후속 보정 — 상단 점검 배너 시간·고객센터 링크

| 항목 | 반영 내용 |
| :--- | :--- |
| 고정 공지 제목 제거 | 점검 준비 상단 배너에서 DB 점검 공지 제목을 표시하지 않는다. |
| 예정 시간 동기화 | 공개 `MaintenanceStatus`의 `plannedStartAt`, `plannedEndAt`을 브라우저 한국 로컬 시간으로 각각 `시작 예정`, `종료 예정`에 표시한다. |
| 고객센터 이동 | 상단 배너 전체를 `/support` 고객센터 공지사항 탭으로 이동하는 접근 가능한 링크로 변경했다. |
| 검증 | `npm run lint && npx tsc -b && npm run build` 통과. 오류 0건, 기존 Hook 의존성 경고 2건과 번들 크기 경고만 유지된다. |


### V49 연동 결함 보정 — 활성 전체 공지 고객센터 노출

| 항목 | 결과 |
| :--- | :--- |
| 원인 | `CustomerNoticeService.publicNotices()`가 전체 공지(`maintenance_notices`)에도 공지 표시 시작·종료 기간 필터를 적용해, 활성 상태여도 고객센터 API에서 제외했다. |
| 보정 | 고객센터의 전체 공지는 `active=true`만으로 노출하도록 변경했다. 표시 기간은 점검 준비 상단 안내의 시간 정보와 기존 점검 상태 흐름에만 유지된다. |
| TDD | 표시 기간이 끝난 활성 전체 공지도 고객센터 목록에 포함되는 실패 테스트를 추가한 뒤 통과시켰다. |
| 적용 검증 | 전체 `gradlew.bat test bootJar` 통과, 최신 JAR 재기동 완료. `GET /api/support/notices`에서 현재 활성 `서비스 안정화 점검 안내`가 `source: MAINTENANCE`로 반환되는 것을 확인했다. |
| 화면 검증 제한 | 연결된 브라우저 확장 응답이 HTTP 504로 중단되어 클릭 기반 E2E는 수행하지 못했다. 공개 API와 빌드 검증을 완료했으며, 브라우저 새로고침 후 고객센터 공지사항에서 확인 가능하다. |


### V50 전체 공지 활성화 시각·공지 등록 시간 자동 출력

| 항목 | 결과 |
| :--- | :--- |
| 활성화 시각 | `maintenance_notices.activated_at`을 추가했다. 활성화할 때 서버 시각을 DB에 기록하며, 기존 활성 공지는 `updated_at`으로 보정했다. |
| 전체 공지 카드 | 활성 공지 배지에 마지막 활성화 날짜·시간을 표시한다. |
| 공지 날짜 자동 출력 | 비활성 공지 카드의 활성화 버튼 왼쪽에 체크박스를 배치했다. 체크 후 활성화하면 서버 한국 시간(초 단위)을 `공지 등록 시간:` 문구로 본문 끝에 저장·출력한다. 체크하지 않으면 시간 문구를 저장하지 않고, 기존에 자동 저장된 시간 문구는 제거해 본문에서 숨긴다. |
| 재활용 원칙 | 공지 표시 시작·종료 기간은 자동 변경하지 않는다. 공지 내용과 기간은 재활용 가능하며, 자동 시간 문구만 체크 상태에 따라 제어한다. |
| 검증 | 점검 서비스 단위 테스트, 전체 `gradlew.bat test bootJar`, 프론트 `npm run lint && npx tsc -b && npm run build`를 통과했다. 최신 JAR 재기동 및 공개 점검 상태 API HTTP 200을 확인했다. |

- 후속 보정: `공지 날짜 자동 출력` 체크 후 활성화하면 서버 한국 시간이 제목 원문 끝에 저장된다. 자동 문구는 `[등록 yyyy.MM.dd HH:mm]` 형식이며, 고객센터와 관리자 카드에서는 제목 원문과 분리한 작은 반투명 `등록 yyyy.MM.dd HH:mm` 배지로 렌더링한다. 체크하지 않으면 자동 등록 문구만 제거하고 제목·본문 원문과 공지 기간은 유지한다.

- V51 일반 고객센터 공지에도 점검 공지와 동일한 `공지 날짜 자동 출력` 흐름을 적용했다. 체크 후 활성화하면 서버 한국 시간이 제목 끝에 `[등록 yyyy.MM.dd HH:mm]`로 저장되고, 관리자·고객센터에서는 작은 반투명 등록 배지로 분리된다. 체크하지 않으면 자동 등록 문구만 숨긴다. `customer_notices.activated_at`을 추가하고 기존 활성 일반 공지는 `updated_at`으로 보정했다.

- 후속 결함 보정: 일반 공지는 활성 상태여도 과거·미래 공지 표시 기간에 걸리면 고객센터에서 누락되고 있었다. 전체 공지·점검 공지와 동일하게 `is_active=true`인 일반 공지는 표시 기간과 무관하게 고객센터 공지사항에 노출하도록 공개 조회 필터를 보정했다. 활성화된 일반 공지 3건과 점검 공지가 공개 API에 함께 반환되는 것을 확인했다.

- 메인 팝업 광고 가독성 보정: 영어 고정 라벨을 `주요 안내`로 바꾸고 제목을 고대비·좌측 강조선 헤더로 정리했다. 본문은 빈 줄 기준 문단으로 나누어 여백·행간·색 대비를 높였으며, 긴 내용은 본문 영역만 스크롤되어 닫기·오늘 하루 보지 않기·확인 영역이 유지된다.

- 메인 팝업 광고를 전면 차단 모달에서 비차단형 화면 위 안내로 전환했다. 배경 딤·블러와 `aria-modal`을 제거하고, 팝업 패널만 상호작용 가능하게 하여 팝업 외부의 본 화면 조작은 유지된다.

## 철수야 소개·이용약관·개인정보처리방침 공공 안내 페이지 (2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 공용 안내 페이지 | `/about`에 철수야 소개, 이용약관, 개인정보처리방침을 앵커 기반 단일 페이지로 구성 | 완료 |
| 푸터 연결 | 푸터 우측 서비스 소개·이용약관·개인정보처리방침을 각각 `/about#intro`, `/about#terms`, `/about#privacy`로 연결 | 완료 |
| 소개 내용 | 통합 카탈로그, 지역 기반 책임 매칭, 상태가 보이는 거래 흐름을 제품 사양 기준으로 안내 | 완료 |
| 이용약관 초안 | 공정거래위원회 전자상거래 표준약관의 거래 조건 구성에 맞춰 서비스·주문·취소·분쟁·약관 변경 구조를 정리 | 검토 초안 |
| 개인정보처리방침 초안 | 개인정보 처리방침 작성지침을 참고해 처리 목적·항목·보유·제공·위탁·파기·권리·보안·쿠키·변경 고지를 정리 | 검토 초안 |
| 정식 공개 전 확인 | 상호·대표자·사업자등록번호·통신판매업 신고번호·주소·보호책임자·실제 수탁자/제공 현황은 확정 후 법률 검토 필요 | 남음 |
| 검증 | `npm run lint && npx tsc -b && npm run build` 통과. 기존 Hook 의존성 경고 3건 및 번들 크기 경고만 유지 | 통과 |

- 법률 기준 조사 메모는 프로젝트 공유 파일 `legal_policy_research_notes.md`에 저장했다.


## 판매자 서비스·구독·신뢰 패널티 가이드 보강 (2026-08-22)

- 공개 `/seller-guide`를 추가했다. 판매자 서비스 장점, 지원 등록 준비 항목·심사 흐름, 주문 제안·재고 확인·이행 순서, 서버 기준 가용 슬롯 계산, 등급별 주문 공개 시점, 신뢰 점수·패널티·응찰 제한 예방 안내를 앵커 탐색 구조로 제공한다.
- 실제 패널티 규칙을 가이드에 반영했다. 낙찰 후 물품 확인 2분 만료 시 주문별 단일 패널티 이력, 신뢰 점수 -10점, 24시간 새 주문 응찰 제한이 적용되며, 판매자 운영 설정에서 제한 해제 시각과 이력을 확인한다.
- 푸터 `판매자 서비스` 그룹은 `판매자 서비스`, `판매자 지원 등록`, `판매자 구독 가이드`, `신뢰·패널티 안내`로 정리했으며 모두 가이드의 관련 앵커로 연결된다. 기존 공개 푸터의 주문 제안 관리·슬롯 운영 설정 직접 링크는 가이드로 대체했다.
- 기존에 구현됐지만 라우터가 누락된 `/seller/subscription`을 판매자 전용으로 등록했다. 가이드의 구독 확인 CTA가 현재 등급·만료·주문 공개 시점·판매 상품 화면으로 이어진다.
- 역할이 `SELLER`인 승인 판매자의 마이철수 `SELLER WORKFLOW`에 `판매자 안내 가이드` 탭을 추가했다.
- `npm run lint && npx tsc -b && npm run build` 통과. 린트는 기존 Hook 의존성 경고 3건·번들 크기 경고만 있으며 오류는 없다.


## 안내 페이지 CTA 공통화 및 회귀 방지 (2026-08-22)

판매자 서비스 가이드의 `판매자 등록 신청`, `판매자 구독 확인`, `현재 슬롯 확인`, `마이철수로 이동` CTA를 평면 보라 버튼에서 공통 입체 CTA로 교체했다. `global.css`의 `guide-cta-primary`은 초록·연두·퍼플 순환 그라데이션, 외곽 프레임, 눌림 반응을 제공하고, `guide-cta-secondary`는 밝은·다크 모드에 맞춘 입체 보조 액션을 제공한다. 팝업 전용 `popup-attention-button`은 일반 화면에 확장하지 않는다. `AGENTS.md` 프론트 규약에 새 안내·가이드·신청·확인 CTA는 이 두 공통 클래스를 우선 재사용하도록 명시했다. 프론트 린트·타입 검사·배포 빌드는 통과했으며 기존 Hook 의존성 경고 3건·번들 크기 경고만 유지된다.

- 판매자 신청 증빙(사업자등록증·통장사본) 이미지 최대 용량을 **5MB → 10MB**로 상향했다. 프론트 선검증·안내 문구와 `SellerCertificateValidator`를 10MB로 통일하고, Spring multipart `max-file-size`·`max-request-size`는 multipart 오버헤드를 고려해 12MB로 조정했다. JPG/PNG, 최소 100KB, 짧은 변 800px 이상·긴 변 6000px 이하 정책은 유지한다. 10MB 경계·10MB 초과 거부 테스트, 전체 서버 `test bootJar`, 프론트 lint/tsc/build 통과 후 최신 서버 재기동과 `/api/maintenance/status` 정상 응답을 확인했다.

- 최고관리자는 `CONSUMER_SELLER_APPLICATION` 토글과 무관하게 판매자 신청·증빙 제출·자기 신청 승인 테스트를 수행할 수 있도록 보정했다. 일반관리자는 해당 소비자 권한 토글이 ON인 경우에만 같은 테스트 신청을 수행한다. 관리자 신청이 승인돼도 계정 역할은 `ADMIN`과 최고관리자 등급을 보존하고, 테스트 판매점만 연결한다. 일반 소비자 승인만 기존처럼 `SELLER`로 역할 전환한다. 전역 라우트 오류 복구 화면, 권한 없음의 메인 이동 CTA, 판매점 없음의 안정적 안내·신청 경로, 오류 발생 시 판매자 대시보드 폴링 중지를 추가했다. 판매자 신청 서비스 테스트와 전체 `test bootJar`, 프론트 lint/tsc/build 통과 후 최신 서버 재기동·공개 상태 API 정상 응답을 확인했다.

- 판매자 증빙 실제 UI 검증 및 10MB 정합성 보정: Supabase Storage 관리 화면에서 비공개 `seller-verification-documents` 버킷은 JPEG/PNG 제한은 맞지만 파일 한도가 5MB인 것을 확인했다. 사업자등록증 6,134KB·통장사본 5,766KB가 이 제한을 초과해 차단됐으므로, 버킷 제한을 10MB로 저장했다. 이어 기존 버킷을 매 업로드마다 재생성해 막히던 `SellerCertificateStorage`를 조회 후 재사용하고, 없는 경우에만 생성하도록 보정했다. 실제 프론트에서 사업자등록증 업로드 후 기존 DB `ck_seller_application_certificate_size` 5MB 제약이 남아 있음을 확인해 V52 마이그레이션으로 두 증빙 메타데이터 제약을 100KB~10MB로 정렬했다. 최신 서버 적용 뒤 프론트에서 두 6MB대 PNG 모두 `제출 완료`가 됐으며, 최고관리자 심사 화면의 전체 정보·문서에서 두 비공개 문서 미리보기와 만료형 원본 조회 링크가 정상 열리는 것을 확인했다. 심사 승인 상태 변경은 아직 수행하지 않았다.


## 2026-08-22 — 관리자 내부 판매자 신청·권한 정합성·판매자 UI 보정

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 관리자 내부 신청 | 최고관리자와 `CONSUMER_SELLER_APPLICATION` 토글을 부여받은 일반관리자는 사업자 정보·증빙 없이 `POST /api/seller-applications/internal-admin`으로 내부 테스트 판매자 신청을 생성 | 완료 |
| DB 모델 | `V53__internal_admin_seller_applications.sql`로 `internal_admin_application`을 추가하고 내부 신청에 한해 사업자 번호·주소·지역 필드 NULL 허용 | Supabase 적용 완료 |
| 강제 승인 | 내부 신청은 최고관리자만 문서 없이 강제 승인 가능. 승인해도 신청자 역할은 `ADMIN`, 최고관리자는 `HIGHEST`를 유지하고 내부 테스트 판매점만 생성 | 완료 |
| 공개 노출 보호 | 내부 관리자 판매점은 고객 판매점 목록에서 비노출 처리. 판매자 API는 본인 소유 매장 기준으로만 접근 | 완료 |
| 일반관리자 토글 | 최고관리자는 일반관리자에게 CONSUMER·SELLER·ADMIN 모든 기능 그룹 토글을 부여할 수 있고, 일반관리자 해지 시 모든 위임 토글을 회수 | 완료 |
| 판매자 API 가드 | 일반관리자의 판매점·응찰·구독·클레임 API는 실제 부여된 SELLER 토글로 강제. 최고관리자는 전체 허용 | 완료 |
| 마이철수 | 관리자도 본인 판매점이 있고 해당 SELLER 토글이 있으면 판매자 워크플로 탭을 표시. 토글 없는 일반관리자는 판매자 탭을 보지 않음 | 완료 |
| 심사 권한 | 판매자 신청 목록·문서 조회·승인·반려는 최고관리자 또는 `ADMIN_REVIEW_SELLER_APPLICATIONS` 토글을 받은 일반관리자에게만 허용 | 완료 |
| 다크모드 회귀 | 마이철수 판매자 카드, 계정 드롭다운, 고객센터 일반 공지 배지, 판매자 지원 등록 안내 패널의 표면·본문·보조 CTA 대비를 보정 | 완료 |
| 문구 정리 | 판매자 가이드·푸터 첫 링크를 `판매자 운영 안내`로 통일. 주문 수신 중단 버튼·이력을 `주문 거절`로 변경 | 완료 |

### 검증

| 검증 | 결과 |
| :--- | :--- |
| `cd server && gradlew.bat test bootJar` | 통과 |
| 내부 관리자 신청·강제 승인 단위 테스트 | 증빙 면제, ADMIN/HIGHEST 보존, 판매점 생성 통과 |
| 일반관리자 CONSUMER·SELLER 토글 단위 테스트 | 최고관리자 부여 가능, 일반관리자 간 변경 차단 통과 |
| Supabase Flyway | V53 적용 확인 |
| `cd client && npm run lint && npx tsc -b && npm run build` | 통과. 기존 Hook dependency 경고 3건, 오류 0건 |
| 실제 프론트 증빙 흐름 | 비공개 10MB 버킷 업로드, 관리자 서명 URL 문서 조회, 승인 후 판매점 생성 확인 |

### 보류·주의

- 내부 관리자 신청은 계정당 기존 판매자 신청이 없을 때만 가능하다. 이미 승인된 최고관리자 테스트 계정에는 별도 내부 신청을 중복 생성하지 않는다.
- 실제 일반관리자 토글별 프론트 E2E는 토글을 받은 테스트 계정을 선택한 뒤, 신규 내부 신청 데이터 생성에 대한 사용자 승인 후 수행한다.
- 프론트 시각 검증은 서버 재기동 시 로그인 세션이 초기화될 수 있으므로 재로그인 후 이어서 수행한다.


### 후속 UI 정리·스페셜 CTA 경계

| 항목 | 반영 내용 |
| :--- | :--- |
| 판매자 주문 제어 | `바쁨 모드` 라벨을 `주문 거절`로 교체했다. 주문 수신이 중지된 상태에는 비활성 거절 버튼을 숨기고 `주문 수신 재개`만 표시한다. |
| 스페셜 CTA 범위 | 입체형·애니메이션 CTA는 공개 안내·가이드·판매자 신청과 팝업 확인에만 제한한다. 슬롯·주문 수신·삭제·반려·환불 같은 운영·위험 동작은 표준 `.btn` 계열을 사용한다. |
| 판매자 가이드 | 푸터·가이드 상단 첫 링크를 `판매자 운영 안내`로 통일하고, 지원 등록 안내 패널의 다크모드 표면·본문 대비를 보정했다. |
| 공통 다크모드 | 계정 드롭다운, 고객센터 일반 공지 배지, 마이철수 판매자 워크플로 카드, 푸터 제목·링크 간격을 보정했다. |
| 전용 스킬 | `/home/ubuntu/skills/chulsooya-special-cta/SKILL.md`를 생성·검증했다. 허용/금지 동작, 표준 버튼 선택, 다크모드·접근성 검수 기준을 포함한다. |

검증: 프론트 `npm run lint && npx tsc -b && npm run build` 통과(기존 Hook dependency 경고 3건, 오류 0건). 백엔드 `gradlew.bat test bootJar` 통과. 로컬 백엔드는 8080 포트에서 실행 중이다.


## 주문 수신 토글·가용량 이력 누적 UI 보정 (2026-08-22)

| 범위 | 구현 내용 | 상태 |
| :--- | :--- | :--- |
| 주문 수신 제어 | 평면 레드 `주문 거절` 버튼을 Tailwind 상태형 `주문 수신` 토글로 교체 | 완료 |
| 위험 변경 확인 | 수신 중→중지 전환은 확인 대화상자에서 `주문 거절하기`를 한 번 더 눌러야 적용. 진행 주문은 계속 처리되고 새 주문 제안만 멈춘다는 영향을 설명 | 완료 |
| 재개 동작 | 수신 중지→수신 재개는 같은 토글을 켜서 기존 `RESUME` 슬롯 복구 API를 호출 | 완료 |
| 상태 표현 | 수신 중지 상태에는 상단 배지와 토글 설명으로 상태를 보이며, 비활성 거절 버튼을 남기지 않음 | 완료 |
| 변경 이력 | 가용량 변경 이력은 기본 최근 3건만 표시. 4건 이상이면 `이력 펼치기 (N)`으로 전체 표를 열고 `이력 접기`로 되돌림 | 완료 |
| 스페셜 CTA 경계 | 주문 수신 토글·확인 대화상자는 표준 운영 제어를 사용하고, 스페셜 CTA를 적용하지 않음 | 완료 |

검증: `npm run lint && npx tsc -b && npm run build` 통과. 기존 Hook dependency 경고 3건, 오류 0건. 실제 브라우저 확장 확인은 HTTP 504 응답 지연으로 자동화하지 못했으므로, 프론트 빌드·사용자 화면 확인 근거로 기록한다.


### 판매자 제어 UI 후속 정렬

- 주문 수신 제어는 카드형 안내 UI를 제거하고 Tailwind 표준 폼 패턴의 라벨·보조 문구·독립 스위치로 변경했다. 수신 중→중지 전환은 확인 대화상자의 `주문 거절하기`를 거쳐야 적용되며, 중지→재개는 같은 토글로 처리한다.
- 가용량 변경 이력은 기본 최근 3건을 노출하고, 4건 이상이면 `이력 펼치기 (N)`·`이력 접기`로 전체 이력을 관리한다.
- 슬롯 숫자 영역에 `place-items-center`를 적용해 `−`·숫자·`+`의 가로·세로 기준선을 맞췄다.
- 최신 프론트 검증: `npm run lint && npx tsc -b && npm run build` 통과. 기존 Hook dependency 경고 3건, 오류 0건.


- 주문 수신 Tailwind 스위치는 타원형 퍼플 테두리·투명 퍼플 표면·퍼플 원형 손잡이로 정렬했다. 주문 수신의 켜짐·꺼짐 의미는 상태 문구와 2단계 확인 대화상자로 전달하며, 색상만으로 상태를 판정하지 않는다.
- 최신 프론트 검증: `npm run lint && npx tsc -b && npm run build` 통과. 기존 Hook dependency 경고 3건, 오류 0건.


## 등급별 주문 공개 우선순위 문서 감사

`docs/SELLER_TIER_NOTIFICATION_PRIORITY_AUDIT.md`를 추가했다. 현행 철물 정책은 프리미엄 0초·골드 30초·실버 60초 공개, 슬롯 15/8/3이며 비구독은 실버다. 과거 0/3/6초 문서는 폐기 규칙으로 분류했다. 판매자 설정의 빈 현재 등급과 `6초 후 수신`은 과거 프론트 타입·하드코딩 불일치로 확인됐으며, DB·API 단일 기준으로 보정해야 한다.

## 2026-08-22 — 구독결제 내부 승인·전국 지역·구매자 사용방법 보정

- 판매자 구독상품은 더 이상 구매 즉시 등급을 변경하지 않는다. `subscription_payment_requests`의 `PENDING → APPROVED/REJECTED` 상태로 내부 결제 요청을 보관하고, 승인 시에만 판매점 등급·만료일·구독 이력(`PURCHASED`)과 판매자 알림을 반영한다. 실제 PG 호출·웹훅은 미연동이며, 이후 승인 처리 지점을 PG 승인 결과로 교체한다.
- 관리자 대시보드 개발 검증 그룹에 `구독결제 승인` 탭을 추가했다. 대기 요청의 상품·금액·기간·판매점을 검토한 뒤 2단계 승인 또는 반려 사유 입력·확정으로 처리한다.
- `V56__seed_default_seller_subscription_products.sql`로 골드 운영 플랜(39,000원/1개월)과 프리미엄 운영 플랜(79,000원/1개월)을 실제 `subscription_products`에 중복 없이 시드했다. 서버 로그에서 Flyway v56 적용을 확인했다.
- 판매자 `/seller/subscription`은 관리자 CRUD의 활성 상품만 라이트·다크 플랜 카드로 표시하며, 실버 기본 등급·서버 정책 슬롯·주문 공개 지연·현재 구독·승인 대기 요청·이력을 서버 응답으로 표시한다. 하드코딩된 `6초 후 수신` 안내는 사용하지 않는다.
- 관리자 구독상품 CRUD에 각 입력(상품명, 등급, 금액, 기간, 노출 순서, 판매 상태, 설명)이 판매자 카드와 승인 흐름에 미치는 영향을 명시했다.
- `V55__service_regions.sql`과 지역 마스터 서비스로 제주를 제외한 전국 시군구를 공식 코드 기반으로 적재했다. 판매자 신청 승인 시 주소 문자열 해시 대신 공식 지역 코드를 저장하고, 판매자 신청·결제 주소·판매점 찾기에 공통 지역 API를 연결했다.
- 판매자 신청은 로그인 계정·기본 배송지 정보를 자동 채우고 카카오 주소 선택 결과를 DB 지역 마스터로 정규화한다. 수기 시군구 입력은 제거 대상이다.
- 구매자 공용 `/buyer-guide` 페이지와 푸터 앵커를 추가했다. 주문 작성·시간 지정·실시간 매칭·배송·픽업·결제 단계와 오류·대기 안내를 실제 상태 머신에 맞춰 설명한다.
- 고객 문의는 `OPEN → IN_PROGRESS → ANSWERED → CLOSED`를 유지한다. 처리 시작, 답변 등록·고객 알림, 처리 완료 확인 순서이며 이미 완료된 문의만 재시작·답변 수정이 금지된다.
- 최신 검증: 백엔드 `gradlew.bat test bootJar` 통과, 프론트 `npm run lint && npx tsc -b && npm run build` 통과. 프론트에는 기존 Hook dependency 경고 3건과 번들 크기 경고만 남아 있으며 오류는 없다. 최신 서버 PID 3452, `/api/maintenance/status` HTTP 200을 확인했다.

### 단일 사업자·판매점 정책 및 구독 화면 정리

`stores.user_id`의 DB 고유 제약을 계정 1개당 사업자·판매점 1개 정책으로 확정했다. 다른 사업자는 별도 계정 가입과 판매자 신청·심사를 거친다. 다점포 선택·통합 결제는 현재 구현 범위가 아닌 **향후 선택 가능한 확장 비즈니스 옵션**으로만 기록한다. 판매자 구독 화면은 단일 판매점 전제에 맞춰 `현재 판매점` 카드를 제거하고, 압축 상태 요약·실버/골드/프리미엄 반응형 카드·모달형 결제 요청 확인으로 재구성했다. 데스크톱 3열, 태블릿 2열, 모바일 1열이며 최신 프론트 lint·TypeScript·Vite build를 통과했다.

### 구독결제 처리 이력 및 판매자 플랜 안내 보정

관리자 `구독결제 승인` 화면은 승인 대기열과 처리 이력을 분리했다. 처리 이력 API는 `PENDING` 요청을 제외하고 승인·반려 완료 요청만 최신 처리 시각 순으로 반환한다. 화면은 최근 3건을 기본 노출하며 누적 4건 이상이면 접기·펼치기로 전체 이력을 확인한다. 각 이력은 판매점·플랜·금액·요청/처리 시각·승인/반려 상태와 반려 사유를 표시한다. 판매자 플랜 화면은 제목을 `철수야 구독 플랜`으로 바꾸고, 내부 용어 `주문 공개`를 `새 주문 제안 우선순위`와 이해 가능한 문장으로 교체했다. 구독결제 서비스 단위 테스트, 전체 백엔드 `test bootJar`, 프론트 lint·TypeScript·Vite build를 통과했다.

## 안내 CTA·인증 복귀·공개 고객센터 라우팅 보정 (2026-08-23)

| 상태 | 판매자 등록 신청 | 판매자 구독 확인·현재 슬롯 확인 | 장바구니·주문 조회 | 고객센터 |
| :--- | :--- | :--- | :--- | :--- |
| 비로그인 | `/auth/login?next=/seller/application`으로 이동 후 인증 완료 시 판매자 신청으로 복귀 | 로그인·회원가입 후 본래 판매자 구독 또는 슬롯 목적지로 복귀 | 로그인·회원가입 후 `/cart` 또는 `/orders`로 복귀 | `/support` 공개 화면으로 즉시 이동 |
| 일반 회원·심사 중 | 판매자 신청 상태·신청 폼 | 판매자 신청 화면으로 자연스럽게 회복 | 본인 장바구니·주문 조회 | 공개 이용 가능 |
| 승인 판매자 | 판매자 대시보드 | 구독 또는 슬롯 설정 | 본인 장바구니·주문 조회 | 공개 이용 가능 |
| 판매자 워크플로가 활성화된 관리자 | 판매자 대시보드 | 구독 또는 슬롯 설정 | 본인 장바구니·주문 조회 | 공개 이용 가능 |
| 판매자 워크플로가 없는 관리자 | 기존 관리자 판매자 신청 권한 안내 | 판매자 신청 권한 안내 | 본인 장바구니·주문 조회 | 공개 이용 가능 |

`RequireIdentity`는 보호 경로의 path·query·hash를 `next`에 보존하며, 판매자 전용 경로에 일반 회원이 접근하면 권한 거부 화면 대신 `/seller/application`으로 회복한다. OAuth·이메일 인증 콜백·비밀번호 재설정 분기에서도 `next`가 유지되도록 보정했다. 구매자 사용방법의 장바구니·주문 조회는 기존 보호 라우트로 로그인 복귀를 유지하고, 고객센터는 공개 `/support`으로 유지한다. 푸터 고객센터도 `/my`가 아닌 공개 `/support`으로 통일했다.

검증: 프론트 `npm run lint`(기존 Hook dependency 경고 3건, 신규 오류 0건), `npx tsc -b`, `npm run build` 통과. 실제 브라우저 자동 검증은 My Browser 확장 응답 시간 초과(HTTP 504)로 실행하지 못했다.

## 히어로 배너 자산 세트 준비 (2026-08-23)

밝은 고키 톤의 1,920×640px(3:1) PNG 히어로 배너 22개를 준비했다. 구성은 뚱냥이 용품 특별전 1개, 통통 강아지 용품 특별전 1개, BOSCH·DEWALT·Makita·Milwaukee·HILTI·Festool·RYOBI·HiKOKI·Metabo HPT·BLACK+DECKER 브랜드 테마 각 2개다. 최종 자산·미리보기·브랜드별 특징 목록은 `/home/ubuntu/chulsooya_hero_banners/`에 있으며, ZIP은 `chulsooya_hero_banner_assets.zip`이다. 관리자 `배너 테마·아이콘 자산 관리`에서 배너 테마로 Storage 업로드 후 행사 배경 테마로 선택한다. 실제 브랜드 행사 또는 제품 판매 게시 전에는 상표·판매 권한·실제 제품 정보의 최종 확인이 필요하다.

## 관리자 다크모드 표면 통일 보정 (2026-08-23)

관리자 다크모드의 과도하게 짙은 배경과 판매자 운영 폼의 밝은 회색 잔존 표면은 전역 토큰과 관리자 Tailwind 브리지의 범위 불일치가 원인이었다. `tokens.css`의 다크 `--c-bg`·`--c-surface`·`--c-surface-muted`·테두리·텍스트 명도를 차분한 네이비 계열로 조정하고, `global.css`의 `.admin-theme` 브리지에 `bg-slate-50` 반투명 변형·`bg-slate-200/300`·`bg-violet-50` 반투명 변형을 추가했다. 개별 관리자 패널의 임시 덧칠 없이 전역 표면 규칙을 보정했다. 프론트 `npm run lint && npx tsc -b && npm run build` 통과; 기존 Hook dependency 경고 3건과 Vite 청크 크기 경고만 남는다.

## 고객문의 완료 해지·재처리 흐름 (2026-08-23)

고객 문의는 `접수(OPEN) → 처리 중(IN_PROGRESS) → 답변 완료(ANSWERED, 고객 알림) → 처리 완료(CLOSED, 고객 알림)`로 운영한다. 후속 문제가 제기되면 관리자만 처리 완료 문의를 두 단계 확인 후 해지하여 다시 `처리 중`으로 전환할 수 있다. 이때 고객에게 `INQUIRY_REOPENED` 재처리 알림을 보내며, 기존 답변 값은 유지하고 새 답변 입력란은 비운다. `SupportInquiry.reopen()`과 `CustomerSupportService.changeStatus()`를 확장했고, 관리자 패널에는 `후속 문제로 처리 완료 해지` 확인 UI를 추가했다. `SupportInquiryTest`와 `CustomerSupportServiceNotificationTest` 재실행 결과 BUILD SUCCESSFUL, 프론트 린트·타입 검사·빌드 통과(기존 Hook dependency 경고 3개·Vite 청크 경고만)했다. 서버는 8080에서 재기동 완료했다. My Browser 자동 화면 검증은 확장 응답 시간 초과로 수행하지 못했다.

## 고객문의 답변 등록 시각 표시 (2026-08-23)

고객문의 답변 시각은 기존 `SupportInquiry.answer()`가 서버에서 기록하는 `answeredAt`(Instant)을 `InquiryResponse`로 이미 전달하고 있었다. 고객센터 최근 문의내역의 철수야 답변 카드에 공지사항과 같은 `등록 YYYY.MM.DD HH:mm` 배지를 추가했고, 화면 시간대는 서버 운영 기준 KST(`Asia/Seoul`)로 고정했다. 프론트 `npm run lint && npx tsc -b && npm run build` 통과; 기존 Hook dependency 경고 3개와 Vite 청크 경고만 남는다.

## 고객문의 원문·접수/답변 등록 시각 표시 보정 (2026-08-23)

고객센터 최근 문의내역은 제목·상태만이 아니라 고객이 입력한 문의 원문을 제목 아래에 그대로 표시하도록 보정했다. 답변이 있을 때만 별도 `철수야 답변` 영역을 표시한다. 기존 `InquiryResponse`의 서버 생성 `createdAt`과 서버 답변 등록 `answeredAt`을 추가 API·스키마 변경 없이 재사용했으며, 고객 접수·관리자 답변 모두 공지사항과 같은 `등록 YYYY.MM.DD HH:mm` 배지로 KST(`Asia/Seoul`) 기준 표시한다. 프론트 `npm run lint && npx tsc -b && npm run build` 통과; 기존 Hook dependency 경고 3개와 Vite 청크 경고만 남는다.

## DB 즉시 생성 거래 서류 (2026-08-23)

- 거래 완료(`COMPLETED`) 주문은 파일 Storage에 보관하지 않고, 구매자·판매자가 문서함에서 열기·다운로드할 때 주문·품목·결제·판매점 DB 스냅샷을 읽어 결정적 PDF를 즉시 생성하도록 구현했다.
- 문서 종류는 영수증, 주문 내역서, 거래명세서다. 전자세금계산서는 발행 대행 연동·사업자 정보·세무 검토 전까지 실제 발행 또는 문서 생성 대상에 포함하지 않는다.
- 백엔드에 Apache PDFBox 3.0.8과 Noto Sans KR OFL 글꼴을 추가했다. PDFBox 자체에 API·건당 사용료는 없으며 Storage 보관 비용도 이 설계에는 없다. 라이선스·비용·문서 경계는 `docs/TRADE_DOCUMENT_PDF_POLICY.md`에 기록했다.
- `TradeDocumentService`는 구매자 본인/관리자 또는 낙찰 판매자만 허용하고, 완료 전 주문은 거부한다. 구매자 경로는 `GET /api/orders/{orderId}/documents/{type}`, 판매자 경로는 `GET /api/seller/orders/{orderId}/documents/{type}`이며 `private, no-store` 다운로드 응답을 사용한다.
- 구매자 주문 상세에는 3종 문서 다운로드 버튼을, 판매자 주문 작업 화면에는 최근 완료 거래 30건의 거래명세서 문서함을 추가했다. 거래 완료 시 구매자와 낙찰 판매자에게 앱 내부 `TRADE_DOCUMENT_READY` 알림을 발송한다.
- 검증: 거래 문서 권한·완료 상태·실제 `%PDF` 한글 렌더링·완료 알림 단위 테스트 통과, 백엔드 `test bootJar` 통과, 프론트 `lint && tsc -b && build` 통과. 기존 Hook dependency 경고 3건과 Vite 청크 경고만 남는다. 백엔드는 거래 문서 코드가 포함된 JAR로 8080 재기동했다. My Browser 확장 응답 시간 초과로 실제 클릭 E2E는 미완료다.


## 전역 테마 토글 통합 후속 (2026-08-23)

- 밝음 모드에서 보라·브랜드 배경 링크형 CTA의 검정 글씨가 상속되던 전역 `a { color: inherit; }` 우선순위 문제를 확인하고, 링크 초기화 규칙을 Tailwind 기본 레이어로 이동해 `text-white` 유틸리티가 정상 적용되도록 보정했다.
- 마이철수 `응찰 내역`, 판매자 대시보드 `주문 제안 확인` 등 링크형 브랜드 CTA는 공통 대비 규칙을 사용하도록 정리했다. 프론트 `npm run lint && npx tsc -b && npm run build` 통과 기준이며, My Browser 실제 화면 재촬영은 세션 응답 시간 초과로 미완료다.
- 밝음·다크 모드 토글 UI는 `ThemeContext`/`useTheme`를 단일 상태 공급원으로 유지하고, `ThemeToggle` 재사용 컴포넌트의 표시·상태·접근성·색상 클래스를 전역 공통 기준으로 통합했다.
- 로컬 화면별 별도 테마 상태는 없으며, 공개 `ShopHeader`와 관리자 `AdminOverviewPage` 모두 동일한 `<ThemeToggle />` API를 사용한다. 토글 크기·손잡이 이동·라벨·아이콘·포커스 대비를 공통 컴포넌트에서 관리하고 `compact` 화면별 변형은 제거했다. `ThemeProvider`의 `localStorage` 유지와 HTML `dark` 클래스 적용은 기존 단일 전역 흐름을 유지한다.
