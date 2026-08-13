# 진행 기록

갱신: 2026-08-12 · 기준 문서: `README.ko.md` · 규약: `AGENTS.md`

## 현재 상태

| 항목 | 상태 |
| :--- | :--- |
| 활성 단계 | Kordeal식 상품 쇼핑·상세·장바구니 UX와 1,600개 철물 카탈로그 적용 완료, 사용자 화면 확인 대기 |
| 백엔드 | Supabase PostgreSQL 프로파일 기동·Flyway V1~V3 적용·JWT 보호 경계 확인, `./gradlew test` **24건 통과** |
| 프론트엔드 | Kordeal식 메가 메뉴·상품 판매 카드·`/product/:id` 상세·장바구니 흐름 이식, lint 0 오류·production build 통과 |
| DB | 철물 **대 9·중 30·소 32** 카테고리, 모든 소분류당 상품 **50개**, 총 **1,600개** 적용 완료 |
| 이미지 | 요청에 따라 미등록 상태. 카드·상세에서 ‘상품 이미지 준비 중’ 플레이스홀더 표시 |
| Email Auth | 테스트 계정 개발용 인증 완료 처리. Supabase Email provider 저장 및 Custom SMTP 검토 필요 |
| Google/Kakao | UI와 Supabase 호출은 구현, Provider Client ID/Secret 설정·실연동은 미완료 |

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

## 남은 작업

- [ ] 브라우저에서 3단 메가 메뉴·상품 카드 클릭·`/product/:id` 상세·장바구니 시각 확인 및 피드백 반영
- [ ] 상품 이미지 업로드·리사이징·대표/상세 이미지 관리 기능 추가
- [ ] Supabase Dashboard에서 Email provider를 ON으로 저장하고, default SMTP 문제를 Custom SMTP 또는 운영용 메일 서비스로 해결
- [ ] Email 회원가입·로그인·`/api/auth/me` 동기화의 실제 브라우저 E2E 재확인
- [ ] Google OAuth: Google Cloud Client ID/Secret 등록 및 Supabase Provider 활성화
- [ ] Kakao OAuth: Kakao Developers REST API Key/Client Secret 등록 및 Supabase Provider 활성화

## 세션 핸드오프

다음 세션은 `AGENTS.md` → `PROGRESS.md` → `PROJECT_MAP.md` 순서로 읽는다. 카테고리 분류 근거는 `docs/HARDWARE_CATEGORY_RESEARCH.md`, 스키마·REST 계약은 `docs/CATEGORY_CATALOG_SCHEMA.md`, 1,600개 시드는 `server/src/main/resources/seed/hardware-products-1600.json`, UI 기준은 `docs/KORDEAL_UI_REFERENCE.md`에 있다.

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
